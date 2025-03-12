import { submarine, fullySubmergedY, halfSubmergedY, shootTorpedo } from '../entities/submarine.js';

// Controls state
export const keys = {};
export let targetY = fullySubmergedY;

export function setupControls(submarine) {
    // Key down event listener
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Surface submarine
        if (e.code === 'KeyT') {
            targetY = halfSubmergedY; // Surface to y=0
        }
        
        // Dive submarine
        if (e.code === 'KeyG') {
            targetY = fullySubmergedY; // Dive
        }
        
        // Shoot torpedo
        if (e.code === 'Space' && !keys['SpaceHeld']) {
            keys['SpaceHeld'] = true;
            shootTorpedo();
        }
    });
    
    // Key up event listener
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        
        // Reset space key held state
        if (e.code === 'Space') {
            keys['SpaceHeld'] = false;
        }
    });
}

// Function to update submarine position based on controls
export function updateSubmarinePosition(submarine) {
    // Movement speed
    const speed = 0.1;
    
    // Forward/backward movement
    if (keys['ArrowUp']) submarine.position.z -= speed;
    if (keys['ArrowDown']) submarine.position.z += speed;
    
    // Left/right movement
    if (keys['ArrowLeft']) submarine.position.x -= speed;
    if (keys['ArrowRight']) submarine.position.x += speed;
    
    // Smoothly interpolate to targetY with faster adjustment
    submarine.position.y += (targetY - submarine.position.y) * 0.1;
}
