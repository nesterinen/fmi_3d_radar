import * as THREE from 'three'
//import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { useEffect, useRef } from 'react'

// THREE setup ########################################################################
let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let controls: OrbitControls

export type PointCloudType = THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.PointsMaterial, THREE.Object3DEventMap> | null
//let pointcloud: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.PointsMaterial, THREE.Object3DEventMap>
//const pointclouds: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.PointsMaterial, THREE.Object3DEventMap>[] = []
//const planeCut = new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0.1 )

function init(width = 500, height = 500) {
    camera = new THREE.PerspectiveCamera(75, width / height, 1_000, 700_000) // 37500
    camera.position.y = 200_000 // 87500

    scene = new THREE.Scene()

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)
    //controls.minDistance = 5
    //controls.maxDistance = 500
    //controls.zoomSpeed = 2

    //const axesHelper = new THREE.AxesHelper( 50 )
    //scene.add(axesHelper)

    //renderer.clippingPlanes[0] = planeCut
    //renderer.setAnimationLoop(animate)

    const loader = new THREE.TextureLoader()

    
    loader.load('map/tempBg.png', (texture) => {
        const groundGeometry = new THREE.PlaneGeometry(500_000, 500_000) // (meters, meters)

        const groundMaterial = new THREE.MeshBasicMaterial()
        groundMaterial.map = texture
        groundMaterial.needsUpdate = true

        const groundPlane = new THREE.Mesh( groundGeometry, groundMaterial )
        groundPlane.name = 'ground_plane'
        groundPlane.rotation.x = (Math.PI / 2) * 3
        scene.add(groundPlane)

        render()
    })
}
// ####################################################################################


// ?????? #############################################################################
function loadPointCloud(pointcloud: PointCloudType){
    if(!pointcloud) return

    /* ~900 fucking milliseconds
    const startTime = Date.now()
    pointcloud.geometry.computeBoundingBox()
    const zOffset = pointcloud.geometry.boundingBox?.max.z
    pointcloud.geometry.center()
    if (zOffset){
        pointcloud.geometry.translate(0, 0, zOffset/2)
    }
    pointcloud.geometry.rotateX((Math.PI / 2) * 3) // rotate 90 degreee three times
    pointcloud.geometry.rotateY((Math.PI / 2) * 3) // rotate 90 degreee three times
    console.log('SPEED:', Date.now() - startTime)
    */
    //pointcloud.name = 'point_cloud'

    let oldPointCloud = scene.getObjectByName(pointcloud.name) as PointCloudType
    if(oldPointCloud){
        // Memory leak if not disposed()
        oldPointCloud.geometry.dispose()
        oldPointCloud.material.dispose()
        scene.remove(oldPointCloud)
        oldPointCloud = null

        scene.add(pointcloud)
    } else {
        scene.add(pointcloud)
    }

    //console.log(scene.children)
    //console.log(renderer.info.memory)
    render()
}
// ####################################################################################


// "Global functions" #################################################################
function resize(width: number | undefined, height: number | undefined) {
    if (width && height) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        render()
    }
}

function render() {
    // do not render if not in DOM:
    if (!renderer.domElement.parentNode) return;
    renderer.render(scene, camera)
}


/*
const mat4 = new THREE.Matrix4()
function animate() {
    //const currentTime = Date.now()
    //const time = ( currentTime - startTime ) / 1000;
    //pointcloud.rotation.y = time * 0.5
    planeCut.applyMatrix4( mat4.makeRotationY( 0.01 ) )
    render()
}
*/

// ####################################################################################

// Main Component #####################################################################
type RadarProps = {
    //pointcloud: PointCloudType | undefined,
    pointclouds: Array<PointCloudType | undefined>
}
const RadarRenderer = ({pointclouds}:RadarProps) => {
    const refContainer = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = refContainer.current

        if (container) {
            if (container.parentElement) {
                init(container.parentElement.clientWidth, container.parentElement.clientHeight)
            }

            container.appendChild(renderer.domElement)

            render()

            if (window) {
                window.addEventListener('resize', () => resize(container.parentElement?.clientWidth, container.parentElement?.clientHeight))
            }
        }

        return () => { // cleanup when component closes
            if (container) container.removeChild(renderer.domElement)
            if (window) window.removeEventListener('resize', () => resize)
        }
    }, [refContainer])

    /*
    useEffect(() => {
        if(pointcloud){
            loadPointCloud(pointcloud)
        }
    }, [pointcloud])
    */

    useEffect(() => {
        if(pointclouds){
            pointclouds.map(pointcloud => {
                if (pointcloud) {
                    loadPointCloud(pointcloud)
                }
            })
        }
    },[pointclouds])

    return (
        <div ref={refContainer}>
        </div>
    )
}

export default RadarRenderer

/*
tif2points2('tiffs/' + '202503050840' + '_fikes_etop_20_dbzh_qc.tif').then(data => 
    loadPointCloud(data)
)
*/

/*
const date = '202503050840'
//loadPointCloud('tiffs/' + date + '_fikes_ppi_9.0_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_ppi_5.0_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_ppi_3.0_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_ppi_1.5_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_ppi_0.7_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_ppi_0.3_dbzh_qc.tif')

loadPointCloud('tiffs/' + date + '_fikes_etop_20_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_etop_45_dbzh_qc.tif')
//loadPointCloud('tiffs/' + date + '_fikes_etop_50_dbzh_qc.tif')

//loadPointCloud('http://s3-eu-west-1.amazonaws.com/fmi-opendata-radar-geotiff/2025/03/06/fikes/202503061035_fikes_ppi_0.3_dbzh_qc.tif')
//loadPointCloud('http://s3-eu-west-1.amazonaws.com/fmi-opendata-radar-geotiff/2025/03/06/fikes/202503061035_fikes_etop_20_dbzh_qc.tif')
//loadPointCloud('http://s3-eu-west-1.amazonaws.com/fmi-opendata-radar-geotiff/2025/03/07/fikes/202503071035_fikes_ppi_0.3_dbzh_qc.tif')
*/