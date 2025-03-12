import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Scene setup module
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: true });

// Lighting and fog
export const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
export const ambientLight = new THREE.AmbientLight(0x00008b, 0.5);

export function initScene() {
    // Set up renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Set up lights
    sunLight.position.set(0, 100, 100);
    scene.add(sunLight);
    scene.add(ambientLight);
    
    // Initial fog (will be updated dynamically based on camera position)
    scene.fog = new THREE.FogExp2(0x00008b, 0.025);
}
