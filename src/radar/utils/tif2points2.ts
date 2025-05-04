import { fromArrayBuffer } from "geotiff"
import { BufferGeometry, Color, Float32BufferAttribute, Points, PointsMaterial } from 'three/src/Three.js'


// https://en.ilmatieteenlaitos.fi/radar-data-on-aws-s3
// https://www.ilmatieteenlaitos.fi/avoin-data-saatutkat


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


export async function tif2points2(file_name: string) {
    const degrees = parseFloat(file_name.split('_')[3])
    const radar_radians = degrees * Math.PI/180;  // 5 is ppi_{degrees}_dbzh_qc
    
    /*
    , {
        headers: {
            "Cache-control": "max-age=600"
        },
        cache: "default"
    }*/
    const response = await fetch(file_name)
    const arrayBuffer = await response.arrayBuffer()
    const tiff = await fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const data = await image.readRasters()

    // image.fileDirectory .ImageWidth .imageLength .ModelPixelScale
    // .ImageDescription: "COMP:DBZH:PPI:elangles(3)\u0000"
    // .DateTime
    // .ModelTiepoint 3, 4 = E, N.... image.getBoundingBox() = [E1,N1,E2,N2]
    //if (data.height !== 2000 || data.width !== 2000) {throw new Error('height, or lenght not 2000')}
    
    const [scaleX, scaleY] = image.fileDirectory.ModelPixelScale

    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating r g b array for 3js material
    const c = new Color()

    const centerX = data.width*scaleX/2
    const centerY = data.height*scaleY/2

    // add edges
    position.push(0)
    position.push(0)
    position.push(0)
    c.setRGB(1, 0, 0)
    color.push( c.r, c.g, c.b )

    position.push(data.width * scaleX)
    position.push(0)
    position.push(0)
    c.setRGB(1, 0, 0)
    color.push( c.r, c.g, c.b )

    position.push(0)
    position.push(data.height * scaleX)
    position.push(0)
    c.setRGB(1, 0, 0)
    color.push( c.r, c.g, c.b )

    position.push(data.width * scaleX)
    position.push(data.height * scaleY)
    position.push(0)
    c.setRGB(1, 0, 0)
    color.push( c.r, c.g, c.b )

    // etop used to be Uint16Array but is now Uint8Array....
    //console.log('insasnce:', data[0].constructor)

    // ppi_{angle}_dbzh is Uint8, 
    if (data[0] instanceof Uint8Array) {

        let index = -1
        let distance: number;
        let z: number;
        let rgb_value: number;

        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++

                if(data[0][index] == 0 || data[0][index] == 255) {
                    continue;
                }

                // calculate z elevation (meters)
                distance = Math.sqrt((centerX - x*scaleX)**2 + (centerY - y*scaleY)**2)
                z = distance * Math.sin(radar_radians)

                // geometry x,z,y to match the rotation fo three js
                position.push(x * scaleX)
                position.push(z)
                position.push(y * scaleY)

                // color
                rgb_value = colorMap(data[0][index], 120, 0)
                c.setHSL((2/3) * rgb_value, 1, 0.5)
                color.push( c.r, c.g, c.b )
            }
        }
    }

    // etop_{num?}_dbz is Uint16, clouds (Cumulonimbus) // https://www.ilmatieteenlaitos.fi/alapilvet
    if (data[0] instanceof Uint16Array) {
        //const perPixelResolution = image.getResolution()[0] | 250
        let index = -1
        for (let y = 0; y < data.height; y++){
            for (let x = 0; x < data.width; x++){
                index++
                if(data[0][index] == 0 || data[0][index] == 65535) {
                    continue;
                }

                position.push(x * scaleX)
                position.push(data[0][index]) 
                position.push(y * scaleY)

                // cloud top height (etop_20), conversion: height[km] = 0.1 * pixel value - 0.1
                //console.log(`x: ${x}, y: ${y}, pixel: ${data[0][index]}, calculated: ${(0.1 * data[0][index] - 0.1)}[km]`)
                // x: 1266, y: 38, pixel: 7427, calculated: 742.6[km]  // 742.6KM!? thats space..

                color.push(1, 1, 1)
                //break testi
            }
        }
    }

    if(!(data[0] instanceof Uint16Array) && !(data[0] instanceof Uint8Array)) {
        console.log('tif2points2: data is not Uint16 or Uint8')
    }

    const geometry = new BufferGeometry()

    if ( position.length > 0 ) geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    if ( color.length > 0 ) geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    //geometry.computeBoundingSphere()

    const material = new PointsMaterial()  //  { size: 0.0005 }

    if ( color.length > 0 ) {
        material.vertexColors = true;
    }

    const returnPoints = new Points( geometry, material )
    returnPoints.position.x = -centerX
    returnPoints.position.z = -centerY

    return returnPoints
}