// Import all necessary components
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { initScene, scene, camera, renderer } from './utils/sceneSetup.js';
import { createWaterSurface, animateWater, updateWaterAppearance } from './environment/water.js';
import { createSkybox, animateClouds, updateSkyFog } from './environment/sky.js';
import { createEnvironmentObjects, animateBubbles, underwaterObjects, floor } from './environment/objects.js';
import { createSubmarine, torpedoes, shootTorpedo, updateTorpedoes } from './entities/submarine.js';

// Game variables
let submarine;
let water;
let skybox;
const keys = {};
let targetY = -15; // Default submarine depth

// Initialize the game
function initGame() {
    // Setup the scene, camera, and renderer
    initScene();
    
    // Create environment
    water = createWaterSurface();
    skybox = createSkybox();
    const { bubbles } = createEnvironmentObjects();
    
    // Create submarine
    submarine = createSubmarine();
    
    // Setup controls
    setupControls();
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Setup controls for submarine
function setupControls() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Surface submarine
        if (e.code === 'KeyT') {
            targetY = 0; // Surface to water level
        }
        
        // Dive submarine
        if (e.code === 'KeyG') {
            targetY = -15; // Dive
        }
        
        // Shoot torpedo
        if (e.code === 'Space' && !keys['SpaceHeld']) {
            keys['SpaceHeld'] = true;
            shootTorpedo();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Space') {
            keys['SpaceHeld'] = false;
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    
    // Animate water waves
    animateWater(time);
    
    // Animate clouds
    animateClouds(time);
    
    // Animate bubbles
    animateBubbles(camera.position.y);
    
    // Update submarine position
    updateSubmarinePosition();
    
    // Update torpedoes
    updateTorpedoes();
    
    // Update camera to follow submarine
    updateCamera();
    
    // Update environment based on camera position
    updateWaterAppearance(camera.position.y, underwaterObjects, floor);
    updateSkyFog(scene, camera.position.y);
    
    // Render the scene
    renderer.render(scene, camera);
}

// Update submarine position based on controls
function updateSubmarinePosition() {
    if (!submarine) return;
    
    // Movement speed
    const speed = 0.1;
    
    // Forward/backward movement
    if (keys['ArrowUp']) submarine.position.z -= speed;
    if (keys['ArrowDown']) submarine.position.z += speed;
    
    // Left/right movement
    if (keys['ArrowLeft']) submarine.position.x -= speed;
    if (keys['ArrowRight']) submarine.position.x += speed;
    
    // Smooth vertical movement
    submarine.position.y += (targetY - submarine.position.y) * 0.05;
}

// Update camera position to follow submarine
function updateCamera() {
    if (!submarine) return;
    
    camera.position.set(
        submarine.position.x, 
        submarine.position.y + 5, 
        submarine.position.z + 15
    );
    camera.lookAt(
        submarine.position.x, 
        submarine.position.y, 
        submarine.position.z
    );
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
