import { scene } from '../utils/sceneSetup.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Water surface and related elements
let water;
const waterLevel = 0; // Water surface at y=0

export function createWaterSurface() {
    // Create a textured water surface with a grid pattern to make it visibly distinct
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Fill with dark blue base color
    ctx.fillStyle = '#001a33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines for visual distinction
    ctx.strokeStyle = '#0066aa';
    ctx.lineWidth = 2;
    const gridSize = 32;
    
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    // Water surface with distinct color and dynamic opacity
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000, 64, 64);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x001a33, // Dark blue for water
        map: texture,
        shininess: 90,
        specular: 0x666666,
        side: THREE.FrontSide
    });
    
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = waterLevel;
    scene.add(water);
    
    // Create horizon line to better separate water and sky
    createHorizon();
    
    return water;
}

function createHorizon() {
    // Enhanced horizon line
    const horizonGeometry = new THREE.RingGeometry(450, 470, 32);
    const horizonMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff99, // Slight yellow tint
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    horizon.rotation.x = -Math.PI / 2;
    horizon.position.y = 1; // Higher up for better visibility
    scene.add(horizon);
}

// Function to animate water waves with enhanced amplitude
export function animateWater(time) {
    if (!water) return;
    
    const vertices = water.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        vertices[i + 1] = Math.sin(x * 0.1 + time) * 1.0 + Math.cos(z * 0.1 + time) * 0.6;
    }
    water.geometry.attributes.position.needsUpdate = true;
}

// Function to update water appearance based on camera position
export function updateWaterAppearance(cameraY, underwaterObjects, floor) {
    if (!water) return;
    
    if (cameraY < waterLevel) {
        // Underwater
        scene.fog.color.setHex(0x001133);
        scene.fog.density = 0.02; // Clearer underwater view
        
        water.material.transparent = true;
        water.material.opacity = 0.7;
        water.material.side = THREE.DoubleSide; // Show both sides underwater
        water.material.color.setHex(0x003366); // Blue underwater
        
        // Show underwater objects
        underwaterObjects.forEach(obj => obj.visible = true);
        floor.visible = true; // Show floor underwater
    } else {
        // Above water - Enhanced water-sky separation
        scene.fog.color.setHex(0x99D6FF); // Match sky
        scene.fog.density = 0.002; // Subtle definition
        
        water.material.transparent = false; // Completely opaque
        water.material.side = THREE.FrontSide; // Only show top side when above water
        water.material.color.setHex(0x001a33); // Dark blue for water surface
        
        // Hide underwater objects when above water
        underwaterObjects.forEach(obj => obj.visible = false);
        floor.visible = false; // Hide floor above water
    }
}
