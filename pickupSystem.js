// Pickup System Module for Submarine Game
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Pickup system class to handle ammo boxes and other collectibles
class PickupSystem {
    constructor(scene, playerStats) {
        this.scene = scene;
        this.playerStats = playerStats;
        
        // Pickup properties
        this.pickups = [];
        this.maxPickups = 5; // Maximum number of pickups at once
        this.spawnInterval = 15000; // 15 seconds between spawns
        this.lastSpawnTime = 0;
        this.pickupCollisionRadius = 3;
        
        // Ocean floor level (will be set by game.js)
        this.oceanFloorLevel = -25;
        
        // Pickup types and their effects
        this.pickupTypes = {
            ammo: {
                color: 0x00ffff, // Cyan
                amount: 100,
                effect: (submarine) => {
                    this.playerStats.addAmmo(100);
                    this.showPickupMessage('Ammo +100');
                }
            },
            health: {
                color: 0x00ff00, // Green
                amount: 25,
                effect: (submarine) => {
                    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 25);
                    this.playerStats.updateUI();
                    this.showPickupMessage('Health +25');
                }
            }
        };
    }
    
    // Initialize the pickup system
    initialize() {
        // Spawn initial pickups
        this.spawnPickup('ammo');
    }
    
    // Update function called each frame
    update(submarine, deltaTime) {
        // Check for collisions with submarine
        this.checkPickupCollisions(submarine);
        
        // Spawn new pickups periodically
        const currentTime = performance.now();
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            // Determine which pickup to spawn based on player needs
            let pickupType = 'ammo'; // Default to ammo
            
            // If player health is low, spawn health pickup
            if (this.playerStats && this.playerStats.health < this.playerStats.maxHealth * 0.5) {
                pickupType = Math.random() < 0.7 ? 'health' : 'ammo'; // 70% chance of health when low
            }
            
            this.spawnPickup(pickupType);
            this.lastSpawnTime = currentTime;
        }
        
        // Animate pickups
        this.animatePickups(deltaTime);
    }
    
    // Spawn a new pickup
    spawnPickup(type = 'ammo') {
        // Don't spawn if we already have max pickups
        if (this.pickups.length >= this.maxPickups) {
            return;
        }
        
        // Get pickup properties
        const pickupProps = this.pickupTypes[type];
        if (!pickupProps) return;
        
        // Create pickup mesh
        const pickup = this.createPickupMesh(type, pickupProps.color);
        
        // Position pickup on ocean floor
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        const y = this.oceanFloorLevel + 1.5; // Slightly above ocean floor
        
        pickup.position.set(x, y, z);
        
        // Add to scene
        this.scene.add(pickup);
        
        // Store pickup data
        this.pickups.push({
            mesh: pickup,
            type: type,
            effect: pickupProps.effect,
            bobHeight: 0.5 + Math.random() * 0.5, // Random bob height
            bobSpeed: 0.5 + Math.random() * 0.5,  // Random bob speed
            rotationSpeed: 0.01 + Math.random() * 0.02, // Random rotation speed
            spawnTime: performance.now()
        });
    }
    
    // Create pickup mesh
    createPickupMesh(type, color) {
        // Create group for pickup
        const group = new THREE.Group();
        
        // Create box for pickup
        let geometry, material;
        
        if (type === 'ammo') {
            // Ammo box
            geometry = new THREE.BoxGeometry(2, 1, 2);
            material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                shininess: 30
            });
            
            const box = new THREE.Mesh(geometry, material);
            group.add(box);
            
            // Add torpedo-like cylinders on top
            const torpedoGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
            const torpedoMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
            
            for (let i = 0; i < 3; i++) {
                const torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
                torpedo.rotation.x = Math.PI / 2; // Lay flat
                torpedo.position.set(
                    (i - 1) * 0.5, // Spread out horizontally
                    0.5, // On top of box
                    0
                );
                group.add(torpedo);
            }
        } else if (type === 'health') {
            // Health pickup (medical cross)
            geometry = new THREE.BoxGeometry(2, 1, 2);
            material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                shininess: 30
            });
            
            const box = new THREE.Mesh(geometry, material);
            group.add(box);
            
            // Add cross on top
            const crossMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
            
            // Horizontal part of cross
            const hGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.3);
            const hCross = new THREE.Mesh(hGeometry, crossMaterial);
            hCross.position.y = 0.5;
            group.add(hCross);
            
            // Vertical part of cross
            const vGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
            const vCross = new THREE.Mesh(vGeometry, crossMaterial);
            vCross.position.y = 0.5;
            group.add(vCross);
        }
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.multiplyScalar(1.5);
        group.add(glow);
        
        // Store type in mesh for easy reference
        group.userData.type = type;
        
        return group;
    }
    
    // Check for collisions between submarine and pickups
    checkPickupCollisions(submarine) {
        if (!submarine) return;
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Calculate distance
            const distance = submarine.position.distanceTo(pickup.mesh.position);
            
            // Check if within collision radius
            if (distance < this.pickupCollisionRadius) {
                // Apply pickup effect
                pickup.effect(submarine);
                
                // Remove pickup
                this.scene.remove(pickup.mesh);
                this.pickups.splice(i, 1);
                
                // Play pickup sound
                this.playPickupSound();
            }
        }
    }
    
    // Animate pickups
    animatePickups(deltaTime) {
        const time = performance.now() * 0.001;
        
        for (const pickup of this.pickups) {
            // Bob up and down
            const bobOffset = Math.sin(time * pickup.bobSpeed) * pickup.bobHeight;
            pickup.mesh.position.y = this.oceanFloorLevel + 1.5 + bobOffset;
            
            // Rotate
            pickup.mesh.rotation.y += pickup.rotationSpeed;
            
            // Pulse glow
            const glow = pickup.mesh.children[pickup.mesh.children.length - 1];
            if (glow) {
                glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
            }
        }
    }
    
    // Play pickup sound
    playPickupSound() {
        // Create audio context if not exists
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported in this browser');
                return;
            }
        }
        
        // Create oscillator for pickup sound
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, window.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1760, window.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, window.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(window.audioContext.currentTime + 0.2);
    }
    
    // Show pickup message
    showPickupMessage(text) {
        if (!this.playerStats) return;
        
        // Use player stats message system
        this.playerStats.showMessage(text, 1500);
    }
    
    // Clear all pickups
    clearPickups() {
        for (const pickup of this.pickups) {
            this.scene.remove(pickup.mesh);
        }
        this.pickups = [];
    }
}

// Export the PickupSystem class
export { PickupSystem };