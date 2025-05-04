import { BufferGeometry, Color, Float32BufferAttribute, Points, PointsMaterial, SRGBColorSpace } from 'three/src/Three.js'

export function pointBox(sizeX: number, sizeY: number, sizeZ: number){
    const position = []  // creating x y z array for for 3js geometry
    const color = [] // creating rgb for 3js material?
    const c = new Color()

    for (let x = 0; x < sizeX; x++){
        for (let y = 0; y < sizeY; y++){
            for (let z = 0; z < sizeZ; z++){
                position.push(x)
                position.push(y)
                position.push(z)

                c.setRGB(1, 1, 1, SRGBColorSpace)
                color.push(c.r, c.g, c.b)
            }
        }
    }

    const geometry = new BufferGeometry()

    geometry.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );
    geometry.setAttribute( 'color', new Float32BufferAttribute( color, 3 ) );

    geometry.computeBoundingSphere()

    const material = new PointsMaterial( { size: 0.005 } )
    material.vertexColors = true

    return new Points( geometry, material )
}