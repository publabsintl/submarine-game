import { scene, camera, renderer } from './sceneSetup.js';
import { animateWater, updateWaterAppearance } from '../environment/water.js';
import { animateClouds, updateSkyFog } from '../environment/sky.js';
import { animateBubbles, underwaterObjects, floor } from '../environment/objects.js';
import { updateSubmarinePosition } from './controls.js';
import { submarine, updateTorpedoes } from '../entities/submarine.js';

// Animation loop
export function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    
    // Animate water waves
    animateWater(time);
    
    // Animate clouds
    animateClouds(time);
    
    // Animate bubbles
    animateBubbles(camera.position.y);
    
    // Update submarine position based on controls
    updateSubmarinePosition(submarine);
    
    // Update torpedoes
    updateTorpedoes();
    
    // Update camera to follow submarine
    updateCamera();
    
    // Update environment based on camera position
    updateEnvironment();
    
    // Render the scene
    renderer.render(scene, camera);
}

// Function to update camera position
function updateCamera() {
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

// Function to update environment based on camera position
function updateEnvironment() {
    // Update water appearance
    updateWaterAppearance(camera.position.y, underwaterObjects, floor);
    
    // Update sky fog
    updateSkyFog(scene, camera.position.y);
}
