import * as THREE from '/static/threejs/js/three.module.js';
import { OrbitControls } from '/static/threejs/js/OrbitControls.js';
import { GLTFLoader } from '/static/threejs/js/GLTFLoader.js';
import { DRACOLoader } from '/static/threejs/js/DRACOLoader.js';
import GUI from '/static/threejs/js/lil-gui.module.min.js';
import { GPUComputationRenderer } from '/static/threejs/js/GPUComputationRenderer.js';

// for post-processing
import { EffectComposer } from '/static/threejs/js/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/static/threejs/js/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/static/threejs/js/jsm/postprocessing/UnrealBloomPass.js';





// async function to load shaders
async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${url}`);
    }
    return await response.text();
}

// dynamically load shaders to get them working within django
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
// debug ui
const gui = new GUI({ width: 340 })
const debugObject = {}

// select the GUI container
const guiContainer = document.querySelector('.lil-gui');

// timeout variable to track inactivity
let hideGuiTimeout;
// show GUI/hide on mouse move
function showGUI() {
    guiContainer.style.opacity = '1';
    guiContainer.style.pointerEvents = 'auto';
    clearTimeout(hideGuiTimeout);
    hideGuiTimeout = setTimeout(() => {
        guiContainer.style.opacity = '0';
        guiContainer.style.pointerEvents = 'none';
    }, 2000);
}


document.addEventListener('mousemove', showGUI);

// hide GUI after mouse inactivity
hideGuiTimeout = setTimeout(() => {
    guiContainer.style.opacity = '0';
    guiContainer.style.pointerEvents = 'none';
}, 2500);




// canvas
const canvas = document.querySelector('canvas.webgl')
// scene
const scene = new THREE.Scene()
// loaders
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
    // update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // materials
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 5000)
camera.position.set(4.5, 4, 70 )
scene.add(camera)

// controls
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

debugObject.BackgroundColor = '#0e0f0d'
renderer.setClearColor(debugObject.BackgroundColor)

//load model
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/flowerpot.glb'); //returns a promise js waits till it loads

// "Flowers in Vase" 3D model by Michael Douglass
// Licensed under Creative Commons Attribution 4.0 (CC BY 4.0)
// Original model: https://sketchfab.com/3d-models/flowers-in-vase-b1047276fc7f4421b5f695ad9ff59e72
// License: https://creativecommons.org/licenses/by/4.0/
// Modifications: baked texture to vertex colors only, no modifications of original geometry
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/flowerpot.glb'); //returns a promise js waits till it loads
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/model.glb');

// const gltf = await gltfLoader.loadAsync('/static/threejs/models/polar_bear.glb');
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/chameleon.glb');
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/rose.glb');
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/bulbasaur.glb');

//test
// const gltf = await gltfLoader.loadAsync('/static/threejs/models/testoctopus.glb');


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
}
//reminder that GBA is 4x4 not 3x3
// console.log(baseParticlesTexture.image.data);

// particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [ gpgpu.particlesVariable ])

// uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.445) //half influenced
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(10)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.124)

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

//geometry
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
console.log("GUI Controllers:", gui.__controllers);

particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2)) //to send to vertex shader
particles.geometry.setAttribute('aColor' , baseGeometry.instance.attributes.color) //to send to vertex shader
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1)) //to send to vertex shader only 1 value needed

// material
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

// points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)


/**
 * Tweaks gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value').min(0).max(1).step(0.001).name('uFlowFieldInfluence')
 */
gui.addColor(debugObject, 'BackgroundColor').onChange(() => { renderer.setClearColor(debugObject.BackgroundColor) })




// post-processing
// render pass
const renderScene = new RenderPass(scene, camera);

//bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  //strength
    0.4,  //radius
    0.85  //threshold
);
// set initial - doesnt seems to load without
bloomPass.threshold = 0.41;
bloomPass.strength = 1.5;
bloomPass.radius = 0.33;

// create the composer (post-processing pipeline)
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// adjust renderer settings for bloom
renderer.toneMapping = THREE.REINHARD_TONE_MAPPING;
renderer.toneMappingExposure = 1.5;

debugObject.bloomThreshold = 0.41;
debugObject.bloomStrength = 1.5;
debugObject.bloomRadius = 0.33;

const bloomFolder = gui.addFolder('Bloom Effects');
bloomFolder.close();
bloomFolder.add(debugObject, 'bloomThreshold').min(0).max(1).step(0.01).onChange(value => {bloomPass.threshold = value;});
bloomFolder.add(debugObject, 'bloomStrength').min(0).max(3).step(0.1).onChange(value => {bloomPass.strength = value;});
bloomFolder.add(debugObject, 'bloomRadius').min(0).max(1).step(0.01).onChange(value => {bloomPass.radius = value;});





let latestSDNN = 0.445;

//gui for flowfield stuff
const flowFieldFolder = gui.addFolder('Flow Field');
flowFieldFolder.close()
const flowFieldInfluenceController = flowFieldFolder.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value').min(0).max(1).step(0.001).name('uFlowFieldInfluence');
const sizeController = flowFieldFolder.add(particles.material.uniforms.uSize, 'value').min(0.01).max(0.5).step(0.001).name('uSize');
flowFieldFolder.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, 'value').min(0).max(10).step(0.001).name('uFlowFieldStrength');
flowFieldFolder.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value').min(0).max(2).step(0.001).name('uFlowFieldFrequency');


let targetSize = 0.1; // used in upcoming lerp function
let lerpFactor = 0.03; // transition speed




let simulatedSDNN = 100;
function fetchAverageSDNN(numEntries = 10) {

    if (debugObject.simulateSDNN) {
    const step = Math.floor(Math.random() * 9) + 1;
    let direction;
    if (simulatedSDNN >= 150) {
        direction = -1;
    } else if (simulatedSDNN <= 50) {
        direction = 1;
    } else {
        direction = Math.random() < 0.5 ? -1 : 1;
    }
    
    let newSimulatedSDNN = simulatedSDNN + direction * step;

    if (newSimulatedSDNN > 150) {
        newSimulatedSDNN = 150;
    } else if (newSimulatedSDNN < 50) {
        newSimulatedSDNN = 50;
    }

    simulatedSDNN = newSimulatedSDNN;
    processSDNN(simulatedSDNN);
    return;
}

    // Otherwise, fetch from the API as before
    fetch(`/hrv/api/latest-sdnn/?num_entries=${numEntries}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const avgSDNN = data.average_sdnn;
            processSDNN(avgSDNN);
        })
        .catch(error => console.error('Error fetching average SDNN:', error));
}

// 4. Extract the SDNN processing into a helper function:
function processSDNN(avgSDNN) {
    const hrvLowThreshold = debugObject.hrvLowThreshold;
    const hrvHighThreshold = debugObject.hrvHighThreshold;

    // Normalize SDNN
    let normalizedSDNN;
    if (avgSDNN <= hrvLowThreshold) {
        normalizedSDNN = 0; // bad SDNN
    } else if (avgSDNN >= hrvHighThreshold) {
        normalizedSDNN = 1; // good SDNN
    } else {
        normalizedSDNN = (avgSDNN - hrvLowThreshold) / (hrvHighThreshold - hrvLowThreshold);
    }

    // Scale flow field influence (0.6 → 0)
    const updatedFlowFieldInfluence = (1 - normalizedSDNN) * 0.6;
    gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence.value = updatedFlowFieldInfluence;
    flowFieldInfluenceController.setValue(updatedFlowFieldInfluence);

    // Calculate new target size for smooth transition
    const minSize = 0.1;
    const maxSize = 0.5;
    targetSize = normalizedSDNN * (maxSize - minSize) + minSize;

    // Update SDNN text and document title
    const sdnnValueElement = document.getElementById('sdnn-value');
    if (sdnnValueElement) {
        sdnnValueElement.innerText = avgSDNN.toFixed(2);
    }
    document.title = `SDNN: ${avgSDNN.toFixed(2)}`;

    updateFavicon(normalizedSDNN);

    console.log(`Updated SDNN: ${avgSDNN} | Normalized: ${normalizedSDNN} | uSize: ${targetSize} | uFlowFieldInfluence: ${updatedFlowFieldInfluence}`);
}

function updateFavicon(normalizedSDNN) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    const red = Math.round(255 * (1 - normalizedSDNN));
    const green = Math.round(255 * normalizedSDNN);
    const color = `rgb(${red}, ${green}, 0)`;

    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const faviconUrl = canvas.toDataURL("image/png");
    const favicon = document.getElementById("favicon");
    favicon.href = faviconUrl;
}


fetchAverageSDNN(10); // initial call
setInterval(() => fetchAverageSDNN(10), 2000);



/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

//rotation debug
debugObject.autoRotate = false;
debugObject.rotationSpeed = 0.05;
debugObject.rotationRadius = 69.6;
const rotationFolder = gui.addFolder('Rotation').close();
rotationFolder.add(debugObject, 'rotationSpeed').min(0).max(3).step(0.01).name('Rotation Speed');
rotationFolder.add(debugObject, 'rotationRadius').min(10).max(100).step(0.1).name('Rotation Radius');
rotationFolder.add(debugObject, 'autoRotate').name('Auto Rotate');


// sdnn debug
debugObject.hrvLowThreshold = 50;
debugObject.hrvHighThreshold = 150;
const stressFolder = gui.addFolder('Stress Settings').close();
stressFolder.add(debugObject, 'hrvLowThreshold').min(10).max(200).step(1).name('Stressed Threshold');
stressFolder.add(debugObject, 'hrvHighThreshold').min(10).max(200).step(1).name('Not Stressed Threshold');
//sim changes
debugObject.simulateSDNN = false;
stressFolder.add(debugObject, 'simulateSDNN').name("Simulate SDNN changes");

debugObject.showSDNN = false;
stressFolder.add(debugObject, 'showSDNN').name('Show SDNN').onChange(value => {
    const sdnnContainer = document.getElementById('current-sdnn');
    if (sdnnContainer) {
        sdnnContainer.style.display = value ? 'block' : 'none';
    } else {
        console.warn('SDNN container not found');
    }
});

// fullscreen button
debugObject.toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};
gui.add(debugObject, 'toggleFullscreen').name('Toggle Fullscreen');





const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    if (!debugObject.autoRotate) {
        controls.update();
    }

    // smooth transition of uSize
    particles.material.uniforms.uSize.value += (targetSize - particles.material.uniforms.uSize.value) * lerpFactor;
    sizeController.setValue(particles.material.uniforms.uSize.value);

    // rotate camera
    if (debugObject.autoRotate) {
        camera.position.x = Math.sin(elapsedTime * debugObject.rotationSpeed) * debugObject.rotationRadius;
        camera.position.z = Math.cos(elapsedTime * debugObject.rotationSpeed) * debugObject.rotationRadius;
        camera.lookAt(scene.position);
    }

    // GPGPU update
    gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
    gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;
    gpgpu.computation.compute();

    // uppdate particle texture
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture;

    composer.render();

    window.requestAnimationFrame(tick);
};





tick()

