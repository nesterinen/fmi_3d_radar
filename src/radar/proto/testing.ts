import { fromArrayBuffer } from "geotiff"
import { BufferGeometry, Color, Float32BufferAttribute, Points, PointsMaterial, SRGBColorSpace } from 'three/src/Three.js'

/*
function calculate_distance(x1: number, y1: number, x2: number, y2: number): number{
    return Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
}
*/

/**
 * Scale x linearly 0 - 1.0
 * @param x 2.5
 * @param inMin 0
 * @param inMax 5
 * @returns 0.5
 */
const colorMap = (x: number, inMin: number, inMax: number): number => {
    return (x - inMin) / (inMax - inMin)
}

export async function tif2points(file_name: string) {
    const degrees = parseFloat(file_name.split('_')[3])
    const radar_radians = degrees * Math.PI/180;  // 5 is ppi_{degrees}_dbzh_qc
    
    const response = await fetch(file_name)  // ~50ms
    const arrayBuffer = await response.arrayBuffer()  // ~3-16
    const tiff = await fromArrayBuffer(arrayBuffer)  // ~0-1ms
    const image = await tiff.getImage()  // ~0-1ms
    const data = await image.readRasters()   // 150 - 1250 ms


    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating rgb for 3js material?
    const c = new Color()

    const centerX = data.width/2
    const centerY = data.height/2
    //const radar_elevation = 174
    //const res = 183.5  // scaled_resolution
    //const edge_drop_off = 9832.35 //m distance to edge is 353553,4 meters so dropoff is 9.83235 km = 9832.35 meters, https://earthcurvature.com/

    // add edges
    position.push(0) // x for 3js geometry
    position.push(0) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(data.width) // x for 3js geometry
    position.push(0) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(0) // x for 3js geometry
    position.push(data.height) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(data.width) // x for 3js geometry
    position.push(data.height) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    // ppi radar is Uint8, 
    if (data[0] instanceof Uint8Array) {

        let index = -1
        let distance: number;
        let z: number;
        let rgb_value: number;

        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++

                // if z value 0 or 255 skip
                if(data[0][index] == 0 || data[0][index] == 255) {
                    continue;
                }

                // calculate distance from center then calculate elevation from that
                // sin angle is the radar angle
                distance = Math.sqrt((centerX - x)**2 + (centerY - y)**2)
                //const distance = Math.sqrt((centerX * res - x * res)**2 + (centerY * res - y * res)**2)
                z = distance * Math.sin(radar_radians)

                // geometry
                position.push(y) // x for 3js geometry
                position.push(x) // y for 3js geometry
                position.push(z) // z for 3js geometry

                // color -> slowest part..
                //const dBZ = 0.5 * data[0][index] - 32  // radar reflectivity (dbz), conversion: Z[dBZ] = 0.5 * pixel value - 32
                //rgb_value = (data[0][index] - 120) / -120 // faster but very little..
                rgb_value = colorMap(data[0][index], 120, 0)  // z 255-0 -> 1.0 - 0.0...
                // c.setHSL((2/3) * rgb_value, 1, 0.5, SRGBColorSpace) // slower but slightly better looking
                c.setHSL((2/3) * rgb_value, 1, 0.5)  // HSL color gradient 2/3 = red to blue
                color.push( c.r, c.g, c.b ) // 438ms - 300ms with no srgbcolorspace
                //color.push(1, 1, 1) // 150ms
            }
        }
    }

    // etop_{num}_dbz is Uint16, clouds
    if (data[0] instanceof Uint16Array) {
        //const perPixelResolution = image.getResolution()[0] | 250
        let index = -1
        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++
                if(data[0][index] == 0 || data[0][index] == 65535) {
                    continue;
                }

                position.push(y)
                position.push(x)
                // data[0][index] / perPixelResolution
                // cloud top height (etop_20), conversion: height[km] = 0.1 * pixel value - 0.1
                // ((0.1 * data[0][index] - 0.1) / 4)/perPixelResolution
                position.push(data[0][index] / 300)

                //c.setRGB(1, 1, 1, SRGBColorSpace)  // ~ 150ms???
                //color.push( c.r, c.g, c.b )
                color.push(1, 1, 1)
            }
        }
    }

    const geometry = new BufferGeometry()

    if ( position.length > 0 ) geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    if ( color.length > 0 ) geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    geometry.computeBoundingSphere()

    const material = new PointsMaterial( { size: 0.0005 } )

    if ( color.length > 0 ) {
        material.vertexColors = true;
    }

    return new Points( geometry, material )
}
/*
async function loadPointCloud2(fileName: string){
    const pointcloud = await tif2points2(fileName)
        
    // align pointcloud so that the bottom(z) is 0 instead of median.
    // medians are different sizes depending on radar angle.
    pointcloud.geometry.computeBoundingBox()
    const zOffset = pointcloud.geometry.boundingBox?.max.z
    pointcloud.geometry.center()
    if (zOffset){
        pointcloud.geometry.translate(0, 0, zOffset/2)
    }

    pointcloud.name = 'point_cloud' // + pointclouds.length;
    //pointcloud.material.size = 1.5

    pointcloud.geometry.rotateX((Math.PI / 2) * 3) // rotate 90 degreee three times
    pointcloud.geometry.rotateY((Math.PI / 2) * 3) // rotate 90 degreee three times

    scene.add( pointcloud );

    render()
}
*/

export async function testing() {
    const response = await fetch('tiffs/202503060715_fikes_ppi_5.0_dbzh_qc.tif')
    const arrayBuffer = await response.arrayBuffer()

    const tiff = await fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const data = await image.readRasters()

    //image.getResolution is px = m^2 ? example 1px = 250

    //console.log(image.getOrigin()) // easting northing??
    //console.log(image.getResolution()) or image.fileDirectory.ModelPixelScale
    console.log(data)

    /* same result, 353553.4 meters
    console.log(calculate_distance(1000, 1000, 2000, 2000)*250)
    console.log(calculate_distance(1000*250, 1000*250, 2000*250, 2000*250))
    */
}


export async function tif2points_proto() {
    const response = await fetch('tiffs/202503060715_fikes_ppi_5.0_dbzh_qc.tif')
    const arrayBuffer = await response.arrayBuffer()

    const tiff = await fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const data = await image.readRasters()

    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating rgb for 3js material?
    const c = new Color()

    if (data[0] instanceof Uint8Array) {  // Object.prototype.toString.call(data[0]) === "[object Uint8Array]"

        let index = 0

        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                const z = data[0][index]

                // geometry
                position.push(y) // x for 3js geometry
                position.push(x) // y for 3js geometry
                position.push(z) // z for 3js geometry

                // color
                c.setRGB(1, 1, 1, SRGBColorSpace) //rgb values 0.0 - 1.0
                color.push( c.r, c.g, c.b )

                index++
            }
        }
    }

    const geometry = new BufferGeometry()

    if ( position.length > 0 ) geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    if ( color.length > 0 ) geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    geometry.computeBoundingSphere()

    const material = new PointsMaterial( { size: 0.005 } )

    if ( color.length > 0 ) {
        material.vertexColors = true;
    }

    return new Points( geometry, material )
}


export async function tif2points_proto2() {
    const response = await fetch('tiffs/202503060715_fikes_ppi_5.0_dbzh_qc.tif')
    const arrayBuffer = await response.arrayBuffer()

    const tiff = await fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const data = await image.readRasters()

    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating rgb for 3js material?
    const c = new Color()
    const centerX = data.width/2
    const centerY = data.height/2

    if (data[0] instanceof Uint8Array) {  // Object.prototype.toString.call(data[0]) === "[object Uint8Array]"

        let index = -1

        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++
                if(data[0][index] == 0 || data[0][index] == 255) {
                    continue;
                }
                const distance = Math.sqrt((centerX - x)**2 + (centerY - y)**2)
                const z = distance * Math.sin(5)
                //const z = data[0][index]

                // geometry
                position.push(y) // x for 3js geometry
                position.push(x) // y for 3js geometry
                position.push(z) // z for 3js geometry

                // color
                c.setRGB(1, 1, 1, SRGBColorSpace) //rgb values 0.0 - 1.0
                color.push( c.r, c.g, c.b )
            }
        }
    }

    const geometry = new BufferGeometry()

    if ( position.length > 0 ) geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    if ( color.length > 0 ) geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    geometry.computeBoundingSphere()

    const material = new PointsMaterial( { size: 0.005 } )

    if ( color.length > 0 ) {
        material.vertexColors = true;
    }

    return new Points( geometry, material )
}

export async function tif2points_proto3(file_name: string) {
    const degrees = parseFloat(file_name.split('_')[3])
    const radar_radians = degrees * Math.PI/180;  // 5 is ppi_{degrees}_dbzh_qc

    const response = await fetch(file_name)
    const arrayBuffer = await response.arrayBuffer()

    const tiff = await fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const data = await image.readRasters()

    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating rgb for 3js material?
    const c = new Color()

    const centerX = data.width/2
    const centerY = data.height/2
    //const radar_elevation = 174
    //const res = 183.5  // scaled_resolution
    //const edge_drop_off = 9832.35 //m distance to edge is 353553,4 meters so dropoff is 9.83235 km = 9832.35 meters, https://earthcurvature.com/

    // add edges
    position.push(0) // x for 3js geometry
    position.push(0) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(data.width) // x for 3js geometry
    position.push(0) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(0) // x for 3js geometry
    position.push(data.height) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    position.push(data.width) // x for 3js geometry
    position.push(data.height) // y for 3js geometry
    position.push(0) // z for 3js geometry
    c.setRGB(1, 0, 0, SRGBColorSpace) //rgb values 0.0 - 1.0
    color.push( c.r, c.g, c.b )

    // ppi radar is Uint8
    if (data[0] instanceof Uint8Array) {

        let index = -1
        let distance: number;
        let z: number;
        let rgb_value: number;

        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++

                // if z value 0 or 255 skip
                if(data[0][index] == 0 || data[0][index] == 255) {
                    continue;
                }

                // calculate distance from center then calculate elevation from that
                // sin angle is the radar angle
                distance = Math.sqrt((centerX - x)**2 + (centerY - y)**2)
                //const distance = Math.sqrt((centerX * res - x * res)**2 + (centerY * res - y * res)**2)
                z = distance * Math.sin(radar_radians)

                // geometry
                position.push(y) // x for 3js geometry
                position.push(x) // y for 3js geometry
                position.push(z) // z for 3js geometry

                // color
                //const dBZ = 0.5 * data[0][index] - 32
                rgb_value = colorMap(data[0][index], 120, 0)  // z 255-0 -> 1.0 - 0.0...

                c.setHSL((2/3) * rgb_value, 1, 0.5, SRGBColorSpace)  // HSL color gradient 2/3 = red to blue

                color.push( c.r, c.g, c.b )
            }
        }
    }

    // etop_{num}_dbz is Uint16
    if (data[0] instanceof Uint16Array) {
        const perPixelResolution = image.getResolution()[0] | 250
        let index = -1
        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++
                if(data[0][index] == 0 || data[0][index] == 65535) {
                    continue;
                }

                position.push(y)
                position.push(x)
                position.push(data[0][index] / perPixelResolution)

                c.setRGB(1, 1, 1, SRGBColorSpace)

                color.push( c.r, c.g, c.b )
            }
        }
    }

    const geometry = new BufferGeometry()

    if ( position.length > 0 ) geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    if ( color.length > 0 ) geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    geometry.computeBoundingSphere()

    const material = new PointsMaterial( { size: 0.0005 } )

    if ( color.length > 0 ) {
        material.vertexColors = true;
    }

    return new Points( geometry, material )
}