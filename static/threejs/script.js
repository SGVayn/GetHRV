import * as THREE from '/static/threejs/js/three.module.js';
import { OrbitControls } from '/static/threejs/js/OrbitControls.js';
import { GLTFLoader } from '/static/threejs/js/GLTFLoader.js';
import { DRACOLoader } from '/static/threejs/js/DRACOLoader.js';
import GUI from '/static/threejs/js/lil-gui.module.min.js';
import { GPUComputationRenderer } from '/static/threejs/js/GPUComputationRenderer.js';


// Async function to load shaders
async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${url}`);
    }
    return await response.text();
}

// Dynamically load shaders
const particlesVertexShader = await loadShader('/static/threejs/shaders/particles/vertex.glsl');
const particlesFragmentShader = await loadShader('/static/threejs/shaders/particles/fragment.glsl');
const gpgpuParticlesShader = await loadShader('/static/threejs/shaders/gpgpu/particles.glsl');

console.log('Vertex Shader:', particlesVertexShader);
console.log('Fragment Shader:', particlesFragmentShader);
console.log('GPGPU Shader:', gpgpuParticlesShader);



// console.log(GPUComputationRenderer);


/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/static/threejs/draco/');

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4.5, 4, 70 )
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

debugObject.clearColor = '#29191f'
renderer.setClearColor(debugObject.clearColor)

//load model
const gltf = await gltfLoader.loadAsync('/static/threejs/models/flowerpot.glb'); //returns a promise js waits till it loads
//better using callback function

//base geometry
const baseGeometry= {}
baseGeometry.instance = gltf.scene.children[0].geometry //load boat 1 hour 30 in
baseGeometry.count = baseGeometry.instance.attributes.position.count //how many vertices

//GPU compute

//setup
const gpgpu = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count)) //make a square texture for the FBO
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

//base particles
const baseParticlesTexture = gpgpu.computation.createTexture() //bunch of 0s in an array 

for (let i = 0; i < baseGeometry.count; i++)
{
    const i3 = i * 3
    const i4 = i * 4
//position based on geometry
    baseParticlesTexture.image.data[i4 +0] = baseGeometry.instance.attributes.position.array[i3+0]
    baseParticlesTexture.image.data[i4 +1] = baseGeometry.instance.attributes.position.array[i3+1]
    baseParticlesTexture.image.data[i4 +2] = baseGeometry.instance.attributes.position.array[i3+2]
    baseParticlesTexture.image.data[i4 +3] = Math.random() //RGBA

} //RGBA is 4x4 not 3x3

// console.log(baseParticlesTexture.image.data);

// Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [ gpgpu.particlesVariable ])

// Uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.445) //half influenced
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(4)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.9)

//init
gpgpu.computation.init()


//debug
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(3,3),
    new THREE.MeshBasicMaterial({
        map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
    }) //fbo
)
gpgpu.debug.visible = false
gpgpu.debug.position.x = 3
scene.add(gpgpu.debug)

/**
 * Particles
 */
const particles = {}

// Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2) //2 for xy
const sizesArray = new Float32Array(baseGeometry.count) //size of each particle

for(let y = 0; y < gpgpu.size; y++)
{
    for(let x = 0; x < gpgpu.size; x++)
    {
        const i = (y * gpgpu.size) + x
        const i2 = i * 2

        const uvX = (x+0.5) / gpgpu.size
        const uvY = (y+0.5) / gpgpu.size

        particlesUvArray[i2 + 0] = uvX
        particlesUvArray[i2 + 1] = uvY

        sizesArray[i] = Math.random()
    }
}


particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2)) //to send to vertex shader
particles.geometry.setAttribute('aColor' , baseGeometry.instance.attributes.color) //to send to vertex shader
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1)) //to send to vertex shader only 1 value needed

// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uSize: new THREE.Uniform(0.05),
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticlesTexture: new THREE.Uniform()
    
    }
})

// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

/**
 * Tweaks
 */
gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).step(0.001).name('uSize')
// gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value').min(0).max(1).step(0.001).name('uFlowFieldInfluence')

gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uFlowFieldInfluence')
    .setValue(latestSDNN); // Initialize with latestSDNN

console.log(latestSDNN, "derp");

gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, 'value').min(0).max(10).step(0.001).name('uFlowfieldStrength')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value').min(0).max(10).step(0.001).name('uFlowfieldFrequency')

// Add fullscreen functionality
debugObject.toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        // Request fullscreen for the canvas
        canvas.requestFullscreen();
    } else {
        // Exit fullscreen if already in fullscreen mode
        document.exitFullscreen();
    }
};

// Add the fullscreen button to the GUI
gui.add(debugObject, 'toggleFullscreen').name('Toggle Fullscreen');

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    
    // Update controls
    controls.update()

    //gpgpu update
    gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime

    gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime
    gpgpu.computation.compute()

    //update uniform
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

    // Render normal scene
    renderer.render(scene, camera)

    //log time and utime
    
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()