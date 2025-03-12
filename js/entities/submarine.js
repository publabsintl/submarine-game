import { scene } from '../utils/sceneSetup.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Submarine properties
export let submarine;
export const fullySubmergedY = -15; // Default submarine depth
export const halfSubmergedY = 0; // Surface level

export function createSubmarine() {
    // Create submarine group
    submarine = new THREE.Group();
    
    // Create submarine body
    createSubmarineBody();
    
    // Add submarine to scene
    scene.add(submarine);
    submarine.position.set(0, fullySubmergedY, 0);
    
    return submarine;
}

function createSubmarineBody() {
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 10, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555, 
        specular: 0x333333,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    submarine.add(body);

    // Conning tower
    const towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const tower = new THREE.Mesh(towerGeometry, bodyMaterial);
    tower.position.set(0, 1.5, 0);
    body.add(tower);

    // Fins
    const finGeometry = new THREE.BoxGeometry(0.5, 0.5, 2);
    const fin1 = new THREE.Mesh(finGeometry, bodyMaterial);
    fin1.position.set(0, 0, 4);
    body.add(fin1);
    const fin2 = new THREE.Mesh(finGeometry, bodyMaterial);
    fin2.position.set(0, 0, -4);
    body.add(fin2);
}

// Torpedo functionality
export const torpedoes = [];

export function shootTorpedo() {
    const torpedoGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const torpedoMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffff00,
        emissive: 0x996600
    });
    const torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
    
    // Set torpedo position to submarine's position
    torpedo.position.copy(submarine.position);
    
    // Set torpedo velocity
    torpedo.velocity = new THREE.Vector3(0, 0, -0.5);
    
    // Add torpedo to scene and torpedoes array
    scene.add(torpedo);
    torpedoes.push(torpedo);
}

export function updateTorpedoes() {
    // Update each torpedo position
    torpedoes.forEach((torpedo, index) => {
        torpedo.position.add(torpedo.velocity);
        
        // Remove torpedoes that have gone too far
        if (torpedo.position.distanceTo(submarine.position) > 50) {
            scene.remove(torpedo);
            torpedoes.splice(index, 1);
        }
    });
}
