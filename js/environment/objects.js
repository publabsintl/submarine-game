import { scene } from '../utils/sceneSetup.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Arrays to track underwater objects
export const corals = [];
export const plants = [];
export let rock1, rock2, rock3;
export let floor;
export let bubbles;

// Collect all underwater objects for visibility toggling
export const underwaterObjects = [];

export function createEnvironmentObjects() {
    createOceanFloor();
    createRocks();
    createCorals();
    createPlants();
    createIslands();
    createBubbles();
    
    // Add all underwater objects to the array
    underwaterObjects.push(rock1, rock2, rock3, bubbles, ...corals, ...plants);
    
    return { underwaterObjects, floor, bubbles };
}

function createOceanFloor() {
    // Ocean floor
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x553311, // Sandy brown
        transparent: true, 
        opacity: 0.8
    });
    
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -25;
    scene.add(floor);
}

function createRocks() {
    // Rocks
    const rockGeometry = new THREE.SphereGeometry(2, 16, 16);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    rock1 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock1.position.set(-10, -23, -10);
    scene.add(rock1);
    
    rock2 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock2.position.set(15, -24, 5);
    rock2.scale.set(1.5, 1.5, 1.5);
    scene.add(rock2);
    
    rock3 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock3.position.set(-5, -24, 20);
    rock3.scale.set(0.7, 0.7, 0.7);
    scene.add(rock3);
}

function createCorals() {
    for (let i = 0; i < 20; i++) {
        createCoral(
            Math.random() * 100 - 50,
            Math.random() * 100 - 50
        );
    }
}

function createCoral(x, z) {
    const coralGeometry = new THREE.ConeGeometry(2, 5, 32);
    const coralMaterial = new THREE.MeshPhongMaterial({
        color: Math.random() > 0.5 ? 0xff6699 : 0xffaa00 
    });
    const coral = new THREE.Mesh(coralGeometry, coralMaterial);
    
    coral.position.set(x, -22, z);
    coral.rotation.y = Math.random() * Math.PI;
    scene.add(coral);
    corals.push(coral);
}

function createPlants() {
    for (let i = 0; i < 30; i++) {
        createPlant(
            Math.random() * 120 - 60,
            Math.random() * 120 - 60
        );
    }
}

function createPlant(x, z) {
    const plantGeometry = new THREE.CylinderGeometry(0.2, 0.5, 8, 8);
    const plantMaterial = new THREE.MeshPhongMaterial({ color: 0x00aa00 });
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    
    plant.position.set(x, -21, z);
    plant.rotation.x = Math.random() * 0.2;
    plant.rotation.z = Math.random() * 0.2;
    scene.add(plant);
    plants.push(plant);
}

function createIslands() {
    createIsland(-40, -60, 10); // Large island
    createIsland(50, 30, 8);    // Medium island
    createIsland(-20, 40, 5);   // Small island
    createIsland(70, -40, 6);   // Another island
}

function createIsland(x, z, size) {
    // Island base (above water)
    const islandGeometry = new THREE.CylinderGeometry(size, size * 1.2, 1, 32);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xddbb88 }); // Sandy color
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(x, 0.5, z); // Slightly above water
    scene.add(island);
    
    // Island underwater part
    const underwaterGeometry = new THREE.CylinderGeometry(size * 1.2, size * 0.8, 25, 32);
    const underwaterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x553311, 
        transparent: true,
        opacity: 0.9
    });
    const underwaterPart = new THREE.Mesh(underwaterGeometry, underwaterMaterial);
    underwaterPart.position.set(x, -12, z); // Below water
    scene.add(underwaterPart);
    underwaterObjects.push(underwaterPart);
    
    // Add palm trees to island
    const palmCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < palmCount; i++) {
        createPalmTree(
            x + Math.random() * size * 0.5 - size * 0.25,
            z + Math.random() * size * 0.5 - size * 0.25,
            size * 0.15
        );
    }
}

function createPalmTree(x, z, size) {
    // Palm trunk
    const trunkGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 5, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, size * 2.5 + 0.5, z); // Above island
    scene.add(trunk);
    
    // Palm leaves
    const leavesGeometry = new THREE.ConeGeometry(size * 2, size * 3, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // Forest green
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, size * 5 + 0.5, z); // Top of trunk
    leaves.rotation.x = Math.PI * 0.1; // Tilt slightly
    leaves.rotation.z = Math.random() * Math.PI * 2; // Random rotation
    scene.add(leaves);
}

function createBubbles() {
    // Bubbles
    const bubbleCount = 100;
    const bubbleGeometry = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    
    for (let i = 0; i < bubbleCount * 3; i += 3) {
        bubblePositions[i] = Math.random() * 100 - 50; // x
        bubblePositions[i + 1] = -Math.random() * 20 - 5; // y
        bubblePositions[i + 2] = Math.random() * 100 - 50; // z
    }
    
    bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.6
    });
    
    bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
    scene.add(bubbles);
}

// Function to animate bubbles
export function animateBubbles(cameraY) {
    if (!bubbles) return;
    
    // Only animate bubbles when underwater
    if (cameraY < 0) {
        const bubblePositions = bubbles.geometry.attributes.position.array;
        for (let i = 1; i < bubblePositions.length; i += 3) {
            bubblePositions[i] += 0.05; // Move bubbles upward
            
            // Reset bubbles that reach the surface
            if (bubblePositions[i] > -1) {
                bubblePositions[i] = -25; // Reset to bottom
                bubblePositions[i - 1] = Math.random() * 100 - 50; // New x
                bubblePositions[i + 1] = Math.random() * 100 - 50; // New z
            }
        }
        bubbles.geometry.attributes.position.needsUpdate = true;
        bubbles.visible = true;
    } else {
        // Hide bubbles when above water
        bubbles.visible = false;
    }
}
