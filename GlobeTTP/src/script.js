//#region imports
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { Mesh } from 'three'
import jsonCities from '../src/cities.json'
//#endregion

// accessing Canvas from DOM
const canvas = document.querySelector('canvas.webgl')

// Scene createad
const scene = new THREE.Scene()

//#region Loading Textures
const textureLoader = new THREE.TextureLoader();

const colorMap = textureLoader.load('/textures/EarthMap.jpg')
const heightMap = textureLoader.load('/textures/Height2.png')
const normalMap = textureLoader.load('/textures/normalMap2.png')
//#endregion

//#region Earth
const geometry = new THREE.SphereGeometry(1,50,50);

const material = new THREE.MeshStandardMaterial()
//material.map= colorMap
//material.heightMap=heightMap
material.normalMap=normalMap
material.color = new THREE.Color(0x1f0887)
material.metalness=0.1;
material.roughness=0.8;

const earth = new THREE.Mesh(geometry,material)

earth.receiveShadow = true;
scene.add(earth)
//#endregion

//#region Coordinate System

    //#region add Pin for HQ
    let headquater = new THREE.Mesh(
        new THREE.SphereGeometry(0.01,20,20),
        new THREE.MeshBasicMaterial({
            color: 0x278c49
        })
    )

    let coordinatesHQ = {
        lat:48.224144,
        long: 14.233794
    }

    let posCart=convertLatLongToCartesian(coordinatesHQ.lat, coordinatesHQ.long)

    headquater.position.set(posCart.x,posCart.y,posCart.z)
    headquater.name='headquarter'
    earth.attach(headquater)
    //#endregion

    //convert Latitude and Longitude to Cartesian
    //this formula is FUCKED; idk how to fix it yet
    function convertLatLongToCartesian(lat, long){
        let phi=(90-lat) * (Math.PI / 180)
        let theta=(180 + long) * (Math.PI/ 180)

        let x=-(Math.sin(phi)*Math.cos(theta))
        let y=(Math.sin(phi)*Math.sin(theta))
        let z=(Math.cos(phi))

        return {x,y,z}
    }

    //#region create Marker from JSON-file
    let cities=[]
    const citiesMaterial =new THREE.MeshBasicMaterial({
        color: 0x7c1b87
    })
    jsonCities.forEach(function(city){
        let i = new THREE.Mesh(
            new THREE.SphereGeometry(0.01,20,20),
            citiesMaterial
        )
        i.name=city.name
        posCart=convertLatLongToCartesian(city.lat, city.long)

        i.position.set(posCart.x,posCart.y,posCart.z)
        earth.attach(i)
        cities.push(i)
    });    
    //#endregion

    //#region draw curve from HQ to random other point
    function generateRandomIntegerInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const curveMaterial =new THREE.MeshBasicMaterial({
        color: 0xcc9535
    })
    function getCurve(p1,p2){
        let v1= new THREE.Vector3(p1.x,p1.y,p1.z)
        let v2= new THREE.Vector3(p2.x,p2.y,p2.z)

        let points=[]
        for(let i=0; i<20;i++){
            let p = new THREE.Vector3().lerpVectors(v1,v2,i/20)
            p.normalize() //Path doesn`t intersect with Earth anymore
            p.multiplyScalar(1 + (0.1*Math.sin(Math.PI*i/20))) //adds the curvature 
            points.push(p)
        }
        let path = new THREE.CatmullRomCurve3(points)

        const curve = new THREE.TubeGeometry(path, 20,0.005,10,true);
        const curveMesh= new THREE.Mesh(curve, curveMaterial);
        curveMesh.userData=200 //sets Time To Life to certain amount of ticks
        earth.attach(curveMesh)
    }
    function drawCurveToRandomCity(){
        let destination = cities[generateRandomIntegerInRange(0,cities.length-1)]
        console.log('HQ to '+destination.name)
        getCurve(headquater.getWorldPosition(),destination.getWorldPosition())

    }
    //#endregion
//#endregion

//#region Atmosphere
const geometry2 = new THREE.SphereGeometry(1.2,50,50);


const vertexShader= 
    'varying vec3 vectorNormal;'+
    'void main(){'+
        'vectorNormal = normal;'+
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );'+
    '}'

const fragmentShader = 
    'varying vec3 vectorNormal;'+
    'void main(){ '+ //change the first value in pow to adjust the atmosphere gradient
        'float intensity = pow(0.9 - dot(vectorNormal, vec3(0,0,1.0)),2.0);'+
        'gl_FragColor = vec4( vec4(0.3,0.6,1.0,1.0)*intensity);'+
    '}'

const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
})

const atmosphere = new THREE.Mesh(geometry2,atmosphereMaterial)
scene.add(atmosphere)
//#endregion

//#region Lighting
const pointLight = new THREE.PointLight(0x6d1f91, 1,0,2)

pointLight.position.x = -4
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)
//#endregion

//#region Adding Light properties to Controls
const gui = new dat.GUI()

let light1=gui.addFolder('Light 1')

light1.add(pointLight.position, 'x').min(-20).max(20).step(1);
light1.add(pointLight.position, 'y').min(-20).max(20).step(1);
light1.add(pointLight.position, 'z').min(-20).max(20).step(1);
light1.add(pointLight, 'intensity').min(0).max(50).step(1);
light1.add(pointLight, 'power').min(0).max(100).step(2);

const lightColor = {
    color: 0x0a2540
}
light1.addColor(lightColor, 'color')
    .onChange(() => {
        pointLight.color.set(lightColor.color)
    })
//#endregion

//#region sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
//#endregion

//#region Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 2
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
//#endregion

//#region initalize renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//#endregion

//#region mouse movement
document.onmousemove = onDocumentMouseMove

let mouseX=0
let mouseY=0

let targetX=0
let targetY=0

const windowHalfX = window.innerWidth/2
const windowHalfY = window.innerHeight/2

function onDocumentMouseMove(event){
    mouseX=(event.clientX - windowHalfX)
    mouseY=(event.clientY - windowHalfY)
}
//#endregion

//#region rendering 
const clock = new THREE.Clock()

const tick = () =>
{
    //delete old curves
    //checks for Time To Life, stored in userData
    earth.children.forEach(element => {
        if(element.userData!=null){
            if(element.userData<=0){
                earth.remove(element)
                element.geometry.dispose()
                element.material.dispose()
                element = undefined
            }else{
                element.userData --
            }
        }
    });
    
    targetX= mouseX*.001 //important for mouse movement
    targetY= mouseY*.001 //important for mouse movement

    const elapsedTime = clock.getElapsedTime()

    if(generateRandomIntegerInRange(1,5000)<=5) drawCurveToRandomCity()

    // Update objects
    earth.rotation.y = .5 * elapsedTime

    earth.rotation.y += .5 * (targetX -earth.rotation.y) //important for mouse movement
    earth.rotation.x += .5 * (targetY -earth.rotation.x) //important for mouse movement
    earth.rotation.Z += .5 * (targetY -earth.rotation.x) //important for mouse movement
    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
//#endregion