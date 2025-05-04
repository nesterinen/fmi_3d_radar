import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { useEffect, useRef } from 'react'
import { pointBox } from './forcut'

// THREE setup ########################################################################
let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
//let startTime: number;

let pointcloud: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.PointsMaterial, THREE.Object3DEventMap>

const planeCut = new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0.1 )


function init(width = 500, height = 500) {
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1500)
    camera.position.y = 350

    scene = new THREE.Scene()

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)
    controls.minDistance = 5
    controls.maxDistance = 500
    controls.zoomSpeed = 2

    renderer.clippingPlanes[0] = planeCut

    renderer.setAnimationLoop(animate)

    //startTime = Date.now()
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

const mat4 = new THREE.Matrix4()
function animate() {
    //const currentTime = Date.now()
    //const time = ( currentTime - startTime ) / 1000;
    //pointcloud.rotation.y = time * 0.5
    planeCut.applyMatrix4( mat4.makeRotationY( 0.05 ) )
    render()
}
// ####################################################################################


// Main Component #####################################################################
const ForcutRenderer = () => {
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


    useEffect(() => {
        pointcloud = pointBox(10, 10, 10)
        pointcloud.geometry.center()
        scene.add(pointcloud)
        render()
    }, [])

    return (
        <div ref={refContainer}>
        </div>
    )
}

export default ForcutRenderer