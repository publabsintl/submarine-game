import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { PlayerStats } from './playerStats.js';
import { CombatSystem } from './combatSystem.js';
import { WaveManager } from './waveManager.js';
import { PickupSystem } from './pickupSystem.js';
import { EnvironmentSystem } from './environmentSystem.js';
import { FishSystem } from './fishSystem.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
// Hemisphere light for sky/ground gradient lighting
const hemiLight = new THREE.HemisphereLight(0x99D6FF, 0x004466, 0.7);
scene.add(hemiLight);

// Ambient light for overall scene brightness
const ambientLight = new THREE.AmbientLight(0x6699cc, 0.5);
scene.add(ambientLight);

// Create a very subtle directional light
const sunLight = new THREE.DirectionalLight(0xffffcc, 0.1);
sunLight.position.set(1000, 2000, 1000);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight);
scene.add(sunLight.target);

// Add a spotlight attached to the camera for underwater visibility only
const cameraLight = new THREE.SpotLight(0x6699cc, 0.7);
cameraLight.position.set(0, 1, 2); // Position slightly in front and above
cameraLight.target.position.set(0, -2, -10); // Target in front and below camera
cameraLight.angle = Math.PI / 10; // Narrow angle
cameraLight.penumbra = 1.0; // Maximum soft edges
cameraLight.decay = 1.5;
cameraLight.distance = 40;
cameraLight.visible = false; // Initially off
camera.add(cameraLight);
camera.add(cameraLight.target);
scene.add(camera); // Add camera to scene so the light works

// Initial fog
scene.fog = new THREE.FogExp2(0x00008b, 0.025);

// Game variables
let submarine;
let water;
let waterSurfaceFromBelow; // New variable for water surface viewed from below
let sky;
const underwaterObjects = [];
const aboveWaterObjects = []; // New array for above-water objects
let torpedoes = []; // Initialize torpedoes array
let enemyTorpedoes = []; // Initialize enemy torpedoes array
let keys = {}; // Changed from const to let
let targetY = -15; // Default submarine depth
const waterLevel = 0;
const islands = []; // Array to store island positions and sizes for collision detection

// Global time scale to control animation speed (0.4 = slower speed)
let timeScale = 0.4;

// Game systems
let playerStats;
let combatSystem;
let waveManager;
let pickupSystem;
let environmentSystem;
let fishSystem;
let gameActive = false;

// Camera variables
let cameraMode = 'follow'; // 'follow' or 'distant'
let cameraDistance = 15; // Default camera distance
let cameraHeight = 5; // Default camera height
let currentCameraPosition = new THREE.Vector3();
let targetCameraPosition = new THREE.Vector3();
let cameraLerpFactor = 0.05; // Controls how quickly camera catches up (lower = more lag)

// Create water surface
function createWaterSurface() {
    // Create a more realistic water texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 1024;
    
    // Create solid lighter blue background
    ctx.fillStyle = '#0099cc';  // Lighter blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle wave patterns
    ctx.globalAlpha = 0.2;
    
    // Draw multiple subtle wave layers with similar light blue colors
    drawWavePattern(ctx, canvas.width, canvas.height, 25, '#00b8e6', 0.15);
    drawWavePattern(ctx, canvas.width, canvas.height, 40, '#33ccff', 0.1);
    
    // Add some noise texture
    addNoiseTexture(ctx, canvas.width, canvas.height, 0.03);
    
    // Add subtle highlights
    addHighlights(ctx, canvas.width, canvas.height, 0.08);
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);  // Reduced repeat to make pattern less obvious
    
    // Water material with improved texture
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x0099cc, // Consistent lighter blue
        map: texture,
        shininess: 100,
        specular: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide
    });
    
    // Water geometry (expanded plane for larger map)
    const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = waterLevel;
    
    // Add vertices displacement for waves
    const vertices = water.geometry.attributes.position.array;
    const waves = [];
    for (let i = 0; i < vertices.length; i += 3) {
        waves.push({
            x: vertices[i],
            y: vertices[i + 1],
            z: vertices[i + 2],
            ang: Math.random() * Math.PI * 2,
            amp: Math.random() * 0.1 + 0.1,
            speed: Math.random() * 0.05 + 0.02
        });
    }
    water.waves = waves;
    
    scene.add(water);
    
    // Create a second water surface that's visible from below
    const waterFromBelowMaterial = new THREE.MeshPhongMaterial({
        color: 0x006699, // Slightly darker blue for underwater view
        map: texture,
        shininess: 50,
        specular: 0x333333,
        transparent: true,
        opacity: 0.7,
        side: THREE.BackSide // Only visible from below
    });
    
    // Use the same geometry for consistency
    waterSurfaceFromBelow = new THREE.Mesh(waterGeometry.clone(), waterFromBelowMaterial);
    waterSurfaceFromBelow.rotation.x = -Math.PI / 2;
    waterSurfaceFromBelow.position.y = waterLevel - 0.1; // Slightly below the main water surface
    waterSurfaceFromBelow.visible = false; // Initially hidden, will be shown only when underwater
    scene.add(waterSurfaceFromBelow);
    
    return water;
}

// Helper function to draw wave patterns
function drawWavePattern(ctx, width, height, waveHeight, color, opacity) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;  // Thinner lines
    ctx.globalAlpha = opacity;
    
    for (let y = 0; y < height; y += waveHeight) {
        ctx.beginPath();
        
        // Start at the left edge
        ctx.moveTo(0, y);
        
        // Create a wavy line across the canvas
        for (let x = 0; x < width; x += 15) {
            const variance = Math.random() * waveHeight / 3;
            ctx.lineTo(x, y + variance);
        }
        
        ctx.stroke();
    }
}

// Helper function to add noise texture
function addNoiseTexture(ctx, width, height, intensity) {
    ctx.globalAlpha = intensity;
    
    for (let i = 0; i < width * height * 0.05; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 2 + 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // Random blue-white shade
        const shade = Math.floor(Math.random() * 100 + 155);
        ctx.fillStyle = `rgb(${shade}, ${shade + 30}, ${shade + 50})`;
        ctx.fill();
    }
}

// Helper function to add highlights
function addHighlights(ctx, width, height, intensity) {
    ctx.globalAlpha = intensity;
    
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 5 + 1;
        
        // Create radial gradient for highlight
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create skybox
function createSkybox() {
    // Skybox
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x99D6FF, // Bright blue
        side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Create clouds
    const clouds = [];
    for (let i = 0; i < 20; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 10 + 5, 8, 8);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            Math.random() * 400 - 200,
            Math.random() * 50 + 50,
            Math.random() * 400 - 200
        );
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    return { sky, clouds };
}

// Create environment objects
function createEnvironmentObjects() {
    // Ocean floor
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x553311, // Sandy brown
        transparent: true, 
        opacity: 0.8
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -25;
    scene.add(floor);
    
    // Store ocean floor position as a global constant
    window.OCEAN_FLOOR_LEVEL = floor.position.y;
    
    // Rocks
    const rockGeometry = new THREE.SphereGeometry(2, 16, 16);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    const rock1 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock1.position.set(-10, -23, -10);
    scene.add(rock1);
    underwaterObjects.push(rock1);
    
    const rock2 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock2.position.set(15, -24, 5);
    rock2.scale.set(1.5, 1.5, 1.5);
    scene.add(rock2);
    underwaterObjects.push(rock2);
    
    const rock3 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock3.position.set(-5, -24, 20);
    rock3.scale.set(0.7, 0.7, 0.7);
    scene.add(rock3);
    underwaterObjects.push(rock3);
    
    // Corals
    for (let i = 0; i < 20; i++) {
        createCoral(
            Math.random() * 100 - 50,
            Math.random() * 100 - 50
        );
    }
    
    // Plants
    for (let i = 0; i < 30; i++) {
        createPlant(
            Math.random() * 120 - 60,
            Math.random() * 120 - 60
        );
    }
    
    // Islands
    createIsland(-40, -60, 10); // Large island
    createIsland(50, 30, 8);    // Medium island
    createIsland(-20, 40, 5);   // Small island
    createIsland(70, -40, 6);   // Another island
    
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
    
    const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
    scene.add(bubbles);
    underwaterObjects.push(bubbles);
    
    return { floor, bubbles };
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
    underwaterObjects.push(coral);
}

function createPlant(x, z) {
    const plantGeometry = new THREE.CylinderGeometry(0.2, 0.5, 8, 8);
    const plantMaterial = new THREE.MeshPhongMaterial({ color: 0x00aa00 });
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    
    plant.position.set(x, -21, z);
    plant.rotation.x = Math.random() * 0.2;
    plant.rotation.z = Math.random() * 0.2;
    scene.add(plant);
    underwaterObjects.push(plant);
}

function createIsland(x, z, size) {
    // Island base (above water)
    const islandGeometry = new THREE.CylinderGeometry(size, size * 1.2, 1, 32);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xddbb88 }); // Sandy color
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(x, 0.5, z); // Slightly above water
    scene.add(island);
    aboveWaterObjects.push(island); // Add to above-water objects
    
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
    
    // Store island position and size for collision detection
    islands.push({ x, z, size });
}

function createPalmTree(x, z, size) {
    // Palm trunk
    const trunkGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 5, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, size * 2.5 + 0.5, z); // Above island
    scene.add(trunk);
    aboveWaterObjects.push(trunk); // Add to above-water objects
    
    // Palm leaves
    const leavesGeometry = new THREE.ConeGeometry(size * 2, size * 3, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // Forest green
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, size * 5 + 0.5, z); // Top of trunk
    leaves.rotation.x = Math.PI * 0.1; // Tilt slightly
    leaves.rotation.z = Math.random() * Math.PI * 2; // Random rotation
    scene.add(leaves);
    aboveWaterObjects.push(leaves); // Add to above-water objects
}

// Create submarine
function createSubmarine(color = 0x333344, playerName = null) {
    // Submarine body - simple cylinder for now
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 6, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Rotate to horizontal position
    
    // Submarine conning tower (sail)
    const towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    const towerMaterial = new THREE.MeshPhongMaterial({ color: color });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 1;
    
    // Group all submarine parts
    submarine = new THREE.Group();
    submarine.add(body);
    submarine.add(tower);
    
    // Set initial position
    submarine.position.set(0, -5, 0);
    
    // Add physics properties
    submarine.velocity = new THREE.Vector3(0, 0, 0);
    submarine.direction = new THREE.Vector3(0, 0, 1); // Forward direction vector
    submarine.rotationSpeed = 0.03;
    submarine.maxSpeed = 0.3;
    submarine.acceleration = 0.01;
    submarine.drag = 0.98;
    
    // Add player name if provided
    if (playerName) {
        // Create a canvas for the name text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Set canvas background to transparent
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillStyle = '#FFFFFF';
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeText(playerName, canvas.width / 2, 30);
        context.fillText(playerName, canvas.width / 2, 30);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        // Create sprite
        const nameSprite = new THREE.Sprite(spriteMaterial);
        nameSprite.scale.set(5, 1.25, 1);
        nameSprite.position.set(0, 3, 0); // Position above submarine
        
        // Add to submarine
        submarine.add(nameSprite);
        
        // Store player name
        submarine.playerName = playerName;
    }
    
    // Add to scene
    scene.add(submarine);
    
    return submarine;
}

// Set up controls
function setupControls() {
    // Track key states
    keys = {};
    
    // Key down event
    document.addEventListener('keydown', (event) => {
        keys[event.key] = true;
        
        // Handle torpedo firing with spacebar
        if (event.code === 'Space') {
            fireTorpedo();
        }
        
        // Toggle camera mode with 'C' key
        if (event.key === 'c' || event.key === 'C') {
            cameraMode = cameraMode === 'follow' ? 'distant' : 'follow';
        }
        
        // Adjust camera distance with '+' and '-' keys
        if (event.key === '+' || event.key === '=') {
            cameraDistance = Math.min(cameraDistance + 2, 30);
        }
        if (event.key === '-' || event.key === '_') {
            cameraDistance = Math.max(cameraDistance - 2, 5);
        }
        
        // Toggle camera light with 'L' key
        if (event.key === 'l' || event.key === 'L') {
            cameraLight.visible = !cameraLight.visible;
        }
    });
    
    // Key up event
    document.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });
}

// Shoot torpedo
function fireTorpedo() {
    if (!submarine) return;
    
    // Check if player has ammo
    if (playerStats && !playerStats.useAmmo(1)) {
        // Play "out of ammo" sound
        playSound('empty', 0.5);
        return; // No ammo left
    }
    
    const torpedoGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const torpedoMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    
    const torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
    
    // Position torpedo at submarine's front
    torpedo.position.copy(submarine.position);
    
    // Use the direction vector to position the torpedo at the front
    const offset = submarine.direction.clone().multiplyScalar(5);
    torpedo.position.add(offset);
    
    // Set torpedo direction based on submarine's direction
    torpedo.direction = submarine.direction.clone();
    torpedo.speed = 1.0; // Torpedo speed
    torpedo.lifeTime = 100; // How long the torpedo lives before disappearing
    
    // Add to scene and torpedoes array
    scene.add(torpedo);
    torpedoes.push(torpedo);
    
    // Play torpedo launch sound
    playSound('torpedo', 0.7);
}

// Simple sound system
function playSound(type, volume = 1.0) {
    // Create audio context if not exists
    if (!window.audioContext) {
        try {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported in this browser');
            return;
        }
    }
    
    // Create oscillator for sound
    const oscillator = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    
    // Set sound type
    switch (type) {
        case 'torpedo':
            // Torpedo launch sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, window.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(volume, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.2);
            break;
            
        case 'empty':
            // Out of ammo sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(100, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, window.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(volume * 0.3, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);
            break;
            
        default:
            // Default sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, window.audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.5, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(window.audioContext.currentTime + 0.3);
}

// Update torpedo positions
function updateTorpedoes() {
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        const torpedo = torpedoes[i];
        
        // Move torpedo forward in its direction
        torpedo.position.x += torpedo.direction.x * torpedo.speed;
        torpedo.position.z += torpedo.direction.z * torpedo.speed;
        
        // Apply slight downward trajectory underwater
        if (torpedo.position.y < waterLevel) {
            torpedo.position.y -= 0.05;
        }
        
        // Prevent torpedoes from going below the ocean floor
        if (torpedo.position.y < window.OCEAN_FLOOR_LEVEL) {
            // Torpedo hit the ocean floor - create a small explosion effect
            createExplosion(torpedo.position.clone(), 0.5); // Small explosion
            
            // Remove the torpedo
            scene.remove(torpedo);
            torpedoes.splice(i, 1);
            continue; // Skip the rest of the loop for this torpedo
        }
        
        // Decrease lifetime
        torpedo.lifeTime--;
        
        // Remove torpedo if it's too old
        if (torpedo.lifeTime <= 0) {
            scene.remove(torpedo);
            torpedoes.splice(i, 1);
        }
    }
}

// Create explosion effect
function createExplosion(position, size) {
    // Create particle system for explosion
    const particleCount = 30;
    const explosionGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Initialize particles at the explosion center
    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = position.x;
        particlePositions[i + 1] = position.y;
        particlePositions[i + 2] = position.z;
    }
    
    explosionGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create particle material with glowing effect
    const explosionMaterial = new THREE.PointsMaterial({
        color: 0xff9900,
        size: size || 1.0,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    // Create the particle system
    const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
    scene.add(explosion);
    
    // Store particle velocities
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
        // Random direction for each particle
        velocities.push({
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3,
            z: (Math.random() - 0.5) * 0.3
        });
    }
    
    // Add to underwater objects to ensure it's only visible underwater
    underwaterObjects.push(explosion);
    
    // Animate the explosion
    const animateExplosion = () => {
        // Update positions based on velocities
        const positions = explosion.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            
            // Update positions
            positions[idx] += velocities[i].x;
            positions[idx + 1] += velocities[i].y;
            positions[idx + 2] += velocities[i].z;
        }
        
        // Mark positions for update
        explosion.geometry.attributes.position.needsUpdate = true;
        
        // Decrease opacity over time
        explosion.material.opacity -= 0.02;
        
        // Remove when fully transparent
        if (explosion.material.opacity <= 0) {
            scene.remove(explosion);
            const index = underwaterObjects.indexOf(explosion);
            if (index > -1) {
                underwaterObjects.splice(index, 1);
            }
            return;
        }
        
        // Continue animation
        requestAnimationFrame(animateExplosion);
    };
    
    // Start animation
    animateExplosion();
}

// Animation functions
function animateWater(time) {
    if (!water || !water.waves) return;
    
    const vertices = water.geometry.attributes.position.array;
    const waves = water.waves;
    
    for (let i = 0; i < vertices.length / 3; i++) {
        const wave = waves[i];
        vertices[i * 3 + 2] = wave.z + Math.sin(wave.ang) * wave.amp;
        wave.ang += wave.speed * timeScale; // Apply time scale
    }
    
    water.geometry.attributes.position.needsUpdate = true;
}

function animateClouds(time) {
    if (!sky) return;
    
    // Animate clouds if needed
}

function animateBubbles(cameraY) {
    const bubbles = underwaterObjects.find(obj => obj instanceof THREE.Points);
    if (!bubbles) return;
    
    // Only animate bubbles when underwater
    if (cameraY < 0) {
        const bubblePositions = bubbles.geometry.attributes.position.array;
        for (let i = 1; i < bubblePositions.length; i += 3) {
            bubblePositions[i] += 0.05 * timeScale; // Apply time scale to bubble movement
            
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

function updateWaterAppearance(cameraY) {
    if (!water) return;
    
    // Update water appearance based on camera position
    if (cameraY < waterLevel) {
        // Underwater
        water.material.opacity = 0.7; // More opaque underwater
        water.material.color.setHex(0x003366); // Lighter blue underwater
        
        // Show underwater objects
        underwaterObjects.forEach(obj => {
            if (obj) obj.visible = true;
        });
        
        // Hide above-water objects
        aboveWaterObjects.forEach(obj => {
            if (obj) obj.visible = false;
        });
        
        // Lighting adjustments for underwater
        hemiLight.intensity = 0.3;
        sunLight.visible = false; // Hide directional light underwater
        ambientLight.intensity = 0.6;
        ambientLight.color.setHex(0x001133);
        
        // Enable camera spotlight underwater for better visibility
        cameraLight.visible = true;
        
        // Underwater fog (denser, blue-green)
        scene.fog.color.setHex(0x003366);
        scene.fog.density = 0.015; // Significantly reduced fog density for better underwater visibility
        
        // Show the second water surface from below
        waterSurfaceFromBelow.visible = true;
    } else {
        // Above water
        water.material.opacity = 0.8; // More transparent above water
        water.material.color.setHex(0x001a33); // Darker blue from above
        
        // Hide underwater objects
        underwaterObjects.forEach(obj => {
            if (obj) obj.visible = false;
        });
        
        // Show above-water objects
        aboveWaterObjects.forEach(obj => {
            if (obj) obj.visible = true;
        });
        
        // Lighting adjustments for above water - REMOVE DIRECTIONAL LIGHT
        hemiLight.intensity = 0.9;
        sunLight.visible = false; // Hide directional light completely above water
        ambientLight.intensity = 0.7;
        ambientLight.color.setHex(0x6699cc);
        
        // Disable camera spotlight above water
        cameraLight.visible = false;
        
        // Above water fog (less dense, sky blue)
        scene.fog.color.setHex(0x99D6FF);
        scene.fog.density = 0.01;
        
        // Hide the second water surface from below
        waterSurfaceFromBelow.visible = false;
    }
}

function updateSkyFog(cameraY) {
    // This function is now empty as we've moved the fog updates to updateWaterAppearance
}

// Update submarine position based on controls
function updateSubmarinePosition() {
    // Apply drag to slow down
    submarine.velocity.multiplyScalar(submarine.drag);
    
    // Handle keyboard controls
    if (keys.ArrowUp) {
        // Accelerate forward
        submarine.velocity.z += submarine.acceleration * Math.cos(submarine.rotation.y) * timeScale; // Apply time scale
        submarine.velocity.x += submarine.acceleration * Math.sin(submarine.rotation.y) * timeScale; // Apply time scale
    }
    if (keys.ArrowDown) {
        // Decelerate/reverse
        submarine.velocity.z -= submarine.acceleration * Math.cos(submarine.rotation.y) * timeScale; // Apply time scale
        submarine.velocity.x -= submarine.acceleration * Math.sin(submarine.rotation.y) * timeScale; // Apply time scale
    }
    
    // Always keep the direction vector pointing in the direction of the submarine's rotation
    // regardless of whether moving forward or backward
    submarine.direction.set(Math.sin(submarine.rotation.y), 0, Math.cos(submarine.rotation.y));
    
    if (keys.ArrowLeft) {
        // Turn left
        submarine.rotation.y += submarine.rotationSpeed * timeScale; // Apply time scale
        
        // Update direction vector after rotation
        submarine.direction.set(Math.sin(submarine.rotation.y), 0, Math.cos(submarine.rotation.y));
    }
    if (keys.ArrowRight) {
        // Turn right
        submarine.rotation.y -= submarine.rotationSpeed * timeScale; // Apply time scale
        
        // Update direction vector after rotation
        submarine.direction.set(Math.sin(submarine.rotation.y), 0, Math.cos(submarine.rotation.y));
    }
    if (keys.t) {
        // Surface
        if (submarine.position.y < waterLevel - 1) {
            submarine.velocity.y = 0.1 * timeScale; // Apply time scale
        }
    }
    if (keys.g) {
        // Dive
        submarine.velocity.y = -0.1 * timeScale; // Apply time scale
    }
    
    // Limit maximum speed
    const speed = submarine.velocity.length();
    if (speed > submarine.maxSpeed) {
        submarine.velocity.normalize().multiplyScalar(submarine.maxSpeed);
    }
    
    // Store current position before collision detection
    const nextPosition = new THREE.Vector3(
        submarine.position.x + submarine.velocity.x,
        submarine.position.y + submarine.velocity.y,
        submarine.position.z + submarine.velocity.z
    );
    
    // Check for collisions with islands
    let collision = false;
    let collisionNormal = new THREE.Vector3();
    let penetrationDepth = 0;
    
    for (const island of islands) {
        // Calculate horizontal distance to island center
        const dx = nextPosition.x - island.x;
        const dz = nextPosition.z - island.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        
        // Collision detection - add a buffer for submarine size
        const submarineRadius = 2; // Approximate submarine radius
        const collisionRadius = island.size * 1.2 + submarineRadius;
        
        if (horizontalDistance < collisionRadius) {
            // Collision detected
            collision = true;
            
            // Calculate collision normal (direction to push submarine away)
            collisionNormal.set(dx, 0, dz).normalize();
            
            // Calculate penetration depth
            penetrationDepth = collisionRadius - horizontalDistance;
            
            // Break out of loop after first collision
            break;
        }
    }
    
    if (collision) {
        // Apply bounce physics
        const bounceCoefficient = 0.5; // How bouncy the collision is
        
        // Calculate dot product to determine how much velocity is in the direction of the collision
        const velocityDotNormal = submarine.velocity.x * collisionNormal.x + 
                                  submarine.velocity.z * collisionNormal.z;
        
        // Apply impulse in the direction of the collision normal
        submarine.velocity.x -= (1 + bounceCoefficient) * velocityDotNormal * collisionNormal.x;
        submarine.velocity.z -= (1 + bounceCoefficient) * velocityDotNormal * collisionNormal.z;
        
        // Move submarine out of collision by penetration depth
        submarine.position.x += collisionNormal.x * penetrationDepth;
        submarine.position.z += collisionNormal.z * penetrationDepth;
    } else {
        // No collision, update position based on velocity
        submarine.position.add(submarine.velocity);
    }
    
    // Limit depth - don't go above water or below seabed
    if (submarine.position.y > waterLevel - 1) {
        submarine.position.y = waterLevel - 1;
        submarine.velocity.y = 0;
    }
    if (submarine.position.y < window.OCEAN_FLOOR_LEVEL) {
        // Ocean floor collision detected
        const bounceCoefficient = 0.3; // Less bouncy than island collisions
        
        // Apply bounce physics - reflect the vertical velocity
        submarine.velocity.y = -submarine.velocity.y * bounceCoefficient;
        
        // Move submarine to sit on the ocean floor
        submarine.position.y = window.OCEAN_FLOOR_LEVEL;
        
        // Apply some drag to horizontal velocity when hitting the floor
        submarine.velocity.x *= 0.9;
        submarine.velocity.z *= 0.9;
    }
}

// Update camera position to follow submarine
function updateCamera() {
    if (!submarine) return;
    
    // Calculate camera position based on submarine's direction and rotation
    const offset = new THREE.Vector3();
    
    if (cameraMode === 'follow') {
        // Position camera behind submarine based on its direction
        offset.copy(submarine.direction).multiplyScalar(-cameraDistance);
        offset.y = cameraHeight; // Add height
        
        targetCameraPosition.copy(submarine.position).add(offset);
    } else if (cameraMode === 'distant') {
        // Position camera further away for a wider view
        offset.copy(submarine.direction).multiplyScalar(-cameraDistance * 2);
        offset.y = cameraHeight * 2; // Higher view
        
        targetCameraPosition.copy(submarine.position).add(offset);
    }
    
    // Lerp camera position
    currentCameraPosition.lerp(targetCameraPosition, cameraLerpFactor);
    camera.position.copy(currentCameraPosition);
    
    // Look at the submarine
    camera.lookAt(submarine.position);
}

// Update UI elements
function updateUI() {
    // Only update if submarine exists
    if (!submarine) return;
    
    // Update depth gauge
    const depth = Math.abs(submarine.position.y - waterLevel);
    document.getElementById('depth-value').textContent = depth.toFixed(1) + ' m';
    
    // Update speed gauge
    const speed = Math.sqrt(
        submarine.velocity.x * submarine.velocity.x + 
        submarine.velocity.z * submarine.velocity.z
    ) * 10; // Scale for display
    document.getElementById('speed-value').textContent = speed.toFixed(1) + ' knots';
    
    // Update compass - only if submarine has direction property
    if (submarine.direction) {
        const angle = Math.atan2(submarine.direction.x, submarine.direction.z);
        const degrees = angle * (180 / Math.PI);
        document.getElementById('compass-needle').style.transform = `rotate(${degrees}deg)`;
    }
    
    // Update time scale display
    document.getElementById('timescale-value').textContent = timeScale.toFixed(1) + 'x';
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
    if (submarine) {
        updateSubmarinePosition();
        
        // Update camera
        updateCamera();
        
        // Update UI
        updateUI();
        
        // Update water appearance based on camera position
        updateWaterAppearance(camera.position.y);
        
        // Update sky fog
        updateSkyFog(camera.position.y);
    }
    
    // Update torpedoes
    updateTorpedoes();
    
    // Update game systems
    if (gameActive) {
        // Update player stats
        if (playerStats) {
            if (playerStats.updateUI) {
                playerStats.updateUI();
            }
        }
        
        // Update combat system
        if (combatSystem) {
            combatSystem.update();
        }
        
        // Update wave manager
        if (waveManager) {
            waveManager.update();
        }
        
        // Update pickup system
        if (pickupSystem) {
            pickupSystem.update();
        }
        
        // Update fish system
        if (fishSystem) {
            fishSystem.update(0.016 * timeScale, submarine.position); // Apply time scale to fish update
        }
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the game
function initGame(gameMode = 'single', playerSettings = null) {
    console.log(`Initializing game in ${gameMode} mode`);
    
    // Get difficulty level from player settings or default to 1
    const difficultyLevel = playerSettings && playerSettings.difficultyLevel
        ? playerSettings.difficultyLevel
        : 1;
    
    // Set global difficulty level
    window.currentDifficultyLevel = difficultyLevel;
    console.log(`Game difficulty set to: ${difficultyLevel}`);
    
    // Reset game state
    gameActive = true;
    torpedoes = [];
    enemyTorpedoes = [];
    
    // Create water and sky
    createWaterSurface();
    createSkybox();
    
    // Initialize enhanced environment system
    environmentSystem = new EnvironmentSystem(scene);
    const environmentObjects = environmentSystem.initialize();
    
    // Add environment objects to our tracking arrays
    underwaterObjects.push(...environmentObjects.underwaterObjects);
    aboveWaterObjects.push(...environmentObjects.aboveWaterObjects);
    islands.push(...environmentObjects.islands);
    
    // Initialize fish system
    fishSystem = new FishSystem(scene);
    fishSystem.setObstacles(islands);
    fishSystem.initialize(150); // Create 150 fish of various species
    
    // Initialize player stats system
    playerStats = new PlayerStats(
        100, // Initial health
        100, // Initial ammo
        3    // Initial lives
    );
    
    // Create submarine with player settings if provided
    if (playerSettings && gameMode === 'single') {
        createSubmarine(playerSettings.submarineColor, playerSettings.playerName);
    } else {
        createSubmarine();
    }
    
    // Initialize camera position
    if (submarine) {
        const initialOffset = new THREE.Vector3();
        initialOffset.copy(submarine.direction).multiplyScalar(-cameraDistance);
        initialOffset.y = cameraHeight;
        
        currentCameraPosition.copy(submarine.position).add(initialOffset);
        targetCameraPosition.copy(currentCameraPosition);
        camera.position.copy(currentCameraPosition);
    }
    
    // Set up controls
    setupControls();
    
    // Add key handlers for time scale adjustment
    document.addEventListener('keydown', function(event) {
        if (event.key === '[') {
            // Decrease time scale (slow down animations)
            timeScale = Math.max(0.1, timeScale - 0.1);
            console.log('Time Scale:', timeScale.toFixed(1));
            updateTimeScaleUI();
        } else if (event.key === ']') {
            // Increase time scale (speed up animations)
            timeScale = Math.min(2.0, timeScale + 0.1);
            console.log('Time Scale:', timeScale.toFixed(1));
            updateTimeScaleUI();
        }
    });
    
    // Set up time scale UI buttons
    setupTimeScaleControls();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Initialize enemy manager if in single player mode
    if (gameMode === 'single') {
        // Import and initialize enemy manager
        import('./enemies.js').then(({ EnemyManager }) => {
            const enemyCount = playerSettings ? playerSettings.enemyCount : 3;
            const enemyManager = new EnemyManager(scene, enemyCount);
            
            // Initialize combat system
            combatSystem = new CombatSystem(scene, submarine, playerStats);
            
            // Initialize pickup system
            pickupSystem = new PickupSystem(scene, playerStats);
            pickupSystem.oceanFloorLevel = window.OCEAN_FLOOR_LEVEL;
            pickupSystem.initialize();
            
            // Connect systems
            enemyManager.setCombatSystem(combatSystem);
            
            // Initialize wave manager
            waveManager = new WaveManager(scene, playerStats);
            waveManager.setEnemyManager(enemyManager);
            
            // Initialize enemy manager
            enemyManager.initialize();
            
            // Set up event listeners
            setupGameEventListeners(enemyManager);
            
            // Start the first wave
            waveManager.startGame();
            
            // Start animation loop
            animate();
            
            // Update game systems in animation loop
            const originalAnimate = animate;
            animate = function() {
                // Only run if game is active
                if (gameActive) {
                    originalAnimate();
                    
                    if (submarine) {
                        // Update enemy manager
                        enemyManager.update(submarine, 0.016); // Assuming ~60fps
                        
                        // Update combat system
                        combatSystem.update(enemyManager.enemies, torpedoes, 0.016);
                        
                        // Update pickup system
                        pickupSystem.update(submarine, 0.016);
                        
                        // Update wave manager
                        waveManager.update(0.016);
                    }
                }
            };
        });
    } else if (gameMode === 'multi') {
        // Multiplayer mode logic would go here
        // For now, just log that multiplayer is not yet implemented
        console.log('Multiplayer mode selected - functionality to be implemented');
        
        // Start animation loop for multiplayer
        animate();
    }
    
    // Set up game over event listener
    document.addEventListener('gameOver', handleGameOver);
    
    // Add key handlers for time scale adjustment
    document.addEventListener('keydown', function(event) {
        if (event.key === '[') {
            // Decrease time scale (slow down animations)
            timeScale = Math.max(0.1, timeScale - 0.1);
            console.log('Time Scale:', timeScale.toFixed(1));
        } else if (event.key === ']') {
            // Increase time scale (speed up animations)
            timeScale = Math.min(2.0, timeScale + 0.1);
            console.log('Time Scale:', timeScale.toFixed(1));
        }
    });
}

// Handle game over event
function handleGameOver(event) {
    gameActive = false;
    
    // Show game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.innerHTML = `
        <h2>GAME OVER</h2>
        <p>You reached Wave ${event.detail.wave}</p>
        <p>Highest Wave: ${event.detail.highestWave}</p>
        <button id="restart-button">Play Again</button>
    `;
    
    // Add CSS for game over screen
    const style = document.createElement('style');
    style.textContent = `
        #game-over-screen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            font-family: 'Arial', sans-serif;
            z-index: 2000;
        }
        
        #game-over-screen h2 {
            font-size: 36px;
            color: #ff3333;
            margin-bottom: 20px;
        }
        
        #game-over-screen p {
            font-size: 24px;
            margin: 10px 0;
        }
        
        #restart-button {
            background-color: #0066cc;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            margin-top: 20px;
            cursor: pointer;
            border-radius: 5px;
            transition: background-color 0.3s;
        }
        
        #restart-button:hover {
            background-color: #0088ff;
        }
    `;
    document.head.appendChild(style);
    
    // Add to body
    document.body.appendChild(gameOverScreen);
    
    // Add restart button event listener
    document.getElementById('restart-button').addEventListener('click', () => {
        // Remove game over screen
        document.body.removeChild(gameOverScreen);
        
        // Restart game
        initGame('single');
    });
}

// Set up game event listeners
function setupGameEventListeners(enemyManager) {
    // Listen for enemy torpedo fired events
    document.addEventListener('enemyTorpedoFired', (event) => {
        // This is handled by the combat system
    });
    
    // Listen for add enemy torpedo events
    document.addEventListener('addEnemyTorpedo', (event) => {
        enemyTorpedoes.push(event.detail.torpedo);
    });
    
    // Listen for player respawn events
    document.addEventListener('playerRespawn', () => {
        // Reset player submarine position
        if (submarine) {
            submarine.position.set(0, -5, 0);
            submarine.velocity = new THREE.Vector3(0, 0, 0);
        }
    });
}

// Set up time scale UI controls
function setupTimeScaleControls() {
    // Make timeScale available globally
    window.timeScale = timeScale;
    
    // Set up decrease button
    const decreaseButton = document.getElementById('decrease-timescale');
    if (decreaseButton) {
        decreaseButton.addEventListener('click', function() {
            timeScale = Math.max(0.1, timeScale - 0.1);
            updateTimeScaleUI();
        });
    }
    
    // Set up increase button
    const increaseButton = document.getElementById('increase-timescale');
    if (increaseButton) {
        increaseButton.addEventListener('click', function() {
            timeScale = Math.min(2.0, timeScale + 0.1);
            updateTimeScaleUI();
        });
    }
    
    // Initial update
    updateTimeScaleUI();
}

// Update time scale UI
function updateTimeScaleUI() {
    // Update global timeScale
    window.timeScale = timeScale;
    
    // Update UI display
    const timeScaleElement = document.getElementById('timescale-value');
    if (timeScaleElement) {
        timeScaleElement.textContent = timeScale.toFixed(1) + 'x';
    }
    
    console.log('Time Scale:', timeScale.toFixed(1));
}

// Export functions for use in index.html
export { initGame };

// Make initGame available globally
window.initGame = initGame;