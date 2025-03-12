import { scene } from '../utils/sceneSetup.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Sky and related elements
let sky;
let clouds = [];

export function createSkybox() {
    // Skybox (above-water experience)
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x99D6FF, // Brighter, cooler sky blue
        side: THREE.BackSide
    });
    
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Add clouds to the sky
    createClouds();
    
    return { sky, clouds };
}

function createClouds() {
    // Clouds in the sky
    const cloudCount = 50;
    const cloudGeometry = new THREE.SphereGeometry(5, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7 
    });
    
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = 300 + Math.random() * 150; // Spread across the sky
        const height = 100 + Math.random() * 100; // Above water level
        
        cloud.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        cloud.scale.set(
            1 + Math.random() * 2, 
            0.5 + Math.random(), 
            1 + Math.random() * 2
        );
        
        scene.add(cloud);
        clouds.push(cloud);
    }
}

// Function to animate clouds
export function animateClouds(time) {
    clouds.forEach(cloud => {
        cloud.position.x += Math.sin(time * 0.1) * 0.02;
        cloud.position.z += Math.cos(time * 0.1) * 0.02;
    });
}

// Function to update fog based on camera position
export function updateSkyFog(scene, cameraY) {
    if (cameraY < 0) {
        // Underwater fog
        scene.fog.color.setHex(0x001133);
        scene.fog.density = 0.02; // Clearer underwater view
    } else {
        // Above water fog
        scene.fog.color.setHex(0x99D6FF); // Match sky color
        scene.fog.density = 0.002; // Subtle definition
    }
}
