// Pickup System Module for Submarine Game
// THREE is loaded globally from index.html

// Pickup system class to handle ammo boxes and other collectibles
window.PickupSystem = class PickupSystem {
    constructor(scene, playerStats) {
        this.scene = scene;
        this.playerStats = playerStats;
        
        // Pickup properties
        this.pickups = [];
        this.maxPickups = 8; // Increased maximum number of pickups
        this.spawnInterval = 12000; // 12 seconds between spawns (reduced from 15s)
        this.lastSpawnTime = 0;
        this.pickupCollisionRadius = 3;
        
        // Ocean floor level (will be set by game.js)
        this.oceanFloorLevel = -25;
        
        // Pickup types and their effects
        this.pickupTypes = {
            // Small ammo box
            ammoSmall: {
                color: 0x00ffff, // Cyan
                amount: 25,
                scale: 0.8, // Smaller size
                probability: 0.5, // 50% chance
                effect: (submarine) => {
                    this.playerStats.addAmmo(25);
                    this.showPickupMessage('Ammo +25');
                }
            },
            // Medium ammo box
            ammoMedium: {
                color: 0x00ffff, // Cyan
                amount: 50,
                scale: 1.0, // Normal size
                probability: 0.3, // 30% chance
                effect: (submarine) => {
                    this.playerStats.addAmmo(50);
                    this.showPickupMessage('Ammo +50');
                }
            },
            // Large ammo box
            ammoLarge: {
                color: 0x00ffff, // Cyan
                amount: 75,
                scale: 1.2, // Larger size
                probability: 0.2, // 20% chance
                effect: (submarine) => {
                    this.playerStats.addAmmo(75);
                    this.showPickupMessage('Ammo +75');
                }
            },
            // Small health box
            healthSmall: {
                color: 0x00ff00, // Green
                amount: 10,
                scale: 0.8, // Smaller size
                probability: 0.5, // 50% chance
                effect: (submarine) => {
                    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 10);
                    this.playerStats.updateUI();
                    this.showPickupMessage('Health +10');
                }
            },
            // Medium health box
            healthMedium: {
                color: 0x00ff00, // Green
                amount: 25,
                scale: 1.0, // Normal size
                probability: 0.3, // 30% chance
                effect: (submarine) => {
                    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 25);
                    this.playerStats.updateUI();
                    this.showPickupMessage('Health +25');
                }
            },
            // Large health box
            healthLarge: {
                color: 0x00ff00, // Green
                amount: 45,
                scale: 1.2, // Larger size
                probability: 0.2, // 20% chance
                effect: (submarine) => {
                    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 45);
                    this.playerStats.updateUI();
                    this.showPickupMessage('Health +45');
                }
            }
        };
        
        // Track health vs ammo drop ratio to ensure balance
        this.healthDropCount = 0;
        this.ammoDropCount = 0;
    }
    
    // Initialize the pickup system
    initialize() {
        // Spawn initial pickups
        this.spawnPickup('ammoMedium');
        this.spawnPickup('healthMedium');
    }
    
    // Update function called each frame
    update(submarine, deltaTime) {
        // Check for collisions with submarine
        this.checkPickupCollisions(submarine);
        
        // Animate pickups
        this.animatePickups(deltaTime);
        
        // Spawn new pickups over time
        const currentTime = performance.now();
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            // Determine if we should spawn health or ammo based on current ratio
            // Try to maintain a 40% health to 60% ammo ratio
            const healthRatio = this.healthDropCount / (this.healthDropCount + this.ammoDropCount + 0.001);
            
            // Pick type based on current ratio
            let pickupCategory;
            if (healthRatio < 0.4) {
                pickupCategory = 'health'; // Need more health
            } else {
                pickupCategory = 'ammo'; // Need more ammo
            }
            
            // Spawn the pickup
            this.spawnRandomPickup(pickupCategory);
            this.lastSpawnTime = currentTime;
        }
    }
    
    // Spawn a new pickup
    spawnPickup(type = 'ammoMedium') {
        // Don't spawn if we already have max pickups
        if (this.pickups.length >= this.maxPickups) {
            return;
        }
        
        // Get pickup properties
        const pickupProps = this.pickupTypes[type];
        if (!pickupProps) return;
        
        // Create pickup mesh
        const pickup = this.createPickupMesh(type, pickupProps.color, pickupProps.scale);
        
        // Find a valid position for the pickup (away from islands)
        const position = this.findSafePickupPosition();
        
        // Position pickup on ocean floor
        pickup.position.set(position.x, position.y, position.z);
        
        // Add to scene
        this.scene.add(pickup);
        
        // Store pickup data
        this.pickups.push({
            mesh: pickup,
            type: type,
            effect: pickupProps.effect,
            bobHeight: 0.5 + Math.random() * 0.5, // Random bob height
            bobSpeed: 0.5 + Math.random() * 0.5,  // Random bob speed
            rotationSpeed: 0.001 + Math.random() * 0.02, // Random rotation speed
            spawnTime: performance.now()
        });
        
        // Update drop count
        if (type.startsWith('health')) {
            this.healthDropCount++;
        } else {
            this.ammoDropCount++;
        }
    }
    
    // Find a safe position for a pickup away from islands and obstacles
    findSafePickupPosition() {
        const safeDistance = 15; // Minimum distance from island centers
        const maxAttempts = 20; // Maximum number of attempts to find a safe position
        let attempts = 0;
        
        // Get islands from the environment system if available
        const islands = window.gameInstance && 
                       window.gameInstance.environmentSystem && 
                       window.gameInstance.environmentSystem.islands || [];
        
        while (attempts < maxAttempts) {
            // Generate random position
            const x = Math.random() * 200 - 100;
            const z = Math.random() * 200 - 100;
            const y = this.oceanFloorLevel + 1.5; // Slightly above ocean floor
            
            // Check distance from all islands
            let isSafe = true;
            
            for (const island of islands) {
                const dx = x - island.x;
                const dz = z - island.z;
                const distanceToIsland = Math.sqrt(dx * dx + dz * dz);
                
                // If too close to island, position is not safe
                if (distanceToIsland < island.size + safeDistance) {
                    isSafe = false;
                    break;
                }
            }
            
            // If position is safe, return it
            if (isSafe) {
                return { x, y, z };
            }
            
            attempts++;
        }
        
        // If we couldn't find a safe position after max attempts,
        // just return a random position as fallback
        console.log("Could not find safe pickup position after max attempts");
        return {
            x: Math.random() * 200 - 100,
            z: Math.random() * 200 - 100,
            y: this.oceanFloorLevel + 1.5
        };
    }
    
    // Spawn a random pickup of the given category
    spawnRandomPickup(category) {
        const types = Object.keys(this.pickupTypes).filter(type => type.startsWith(category));
        const probabilities = types.map(type => this.pickupTypes[type].probability);
        const sum = probabilities.reduce((a, b) => a + b, 0);
        const random = Math.random() * sum;
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += probabilities[i];
            if (random < cumulative) {
                this.spawnPickup(types[i]);
                return;
            }
        }
    }
    
    // Create pickup mesh
    createPickupMesh(type, color, scale = 1.0) {
        // Create group for pickup
        const group = new THREE.Group();
        group.scale.multiplyScalar(scale);
        
        // Create box for pickup
        let geometry, material;
        
        if (type.startsWith('ammo')) {
            // Ammo box
            geometry = new THREE.BoxGeometry(2, 1, 2);
            material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 100,
                specular: 0xffffff
            });
            
            const box = new THREE.Mesh(geometry, material);
            box.position.y = 0.5;
            group.add(box);
            
            // Add torpedoes on top for ammo boxes
            const torpedoCount = type === 'ammoSmall' ? 1 : (type === 'ammoMedium' ? 2 : 3);
            
            for (let i = 0; i < torpedoCount; i++) {
                const torpedo = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8),
                    new THREE.MeshPhongMaterial({ color: 0xaaaaaa })
                );
                torpedo.rotation.z = Math.PI / 2;
                torpedo.position.set(0, 1.2, (i - (torpedoCount-1)/2) * 0.5);
                group.add(torpedo);
            }
        } else if (type.startsWith('health')) {
            // Health pickup (medical cross)
            geometry = new THREE.BoxGeometry(2, 1, 2);
            material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 100,
                specular: 0xffffff
            });
            
            const box = new THREE.Mesh(geometry, material);
            box.position.y = 0.5;
            group.add(box);
            
            // Add medical cross on top
            const crossThickness = type === 'healthSmall' ? 0.2 : (type === 'healthMedium' ? 0.3 : 0.4);
            const crossSize = type === 'healthSmall' ? 1.0 : (type === 'healthMedium' ? 1.2 : 1.4);
            
            // Horizontal part of cross
            const hCross = new THREE.Mesh(
                new THREE.BoxGeometry(crossSize, crossThickness, crossThickness),
                new THREE.MeshPhongMaterial({ color: 0xffffff })
            );
            hCross.position.y = 1.2;
            group.add(hCross);
            
            // Vertical part of cross
            const vCross = new THREE.Mesh(
                new THREE.BoxGeometry(crossThickness, crossThickness, crossSize),
                new THREE.MeshPhongMaterial({ color: 0xffffff })
            );
            vCross.position.y = 1.2;
            group.add(vCross);
        }
        
        // Add glow effect
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        
        const glowSize = 2.5 * scale;
        const glowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(glowSize, 16, 16),
            glowMaterial
        );
        group.add(glowSphere);
        
        // Add pickup name
        group.name = type;
        
        return group;
    }
    
    // Check for collisions between submarine and pickups
    checkPickupCollisions(submarine) {
        if (!submarine) return;
        
        // Get submarine position
        const subPosition = submarine.position.clone();
        
        // Check each pickup
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Calculate distance
            const distance = subPosition.distanceTo(pickup.mesh.position);
            
            // Check if within collision radius
            if (distance < this.pickupCollisionRadius) {
                // Apply pickup effect
                pickup.effect(submarine);
                
                // Play sound
                this.playPickupSound(pickup.type);
                
                // Remove pickup
                this.scene.remove(pickup.mesh);
                this.pickups.splice(i, 1);
            }
        }
    }
    
    // Animate pickups
    animatePickups(deltaTime) {
        const time = performance.now() * 0.001; // Convert to seconds
        
        for (const pickup of this.pickups) {
            // Bob up and down
            pickup.mesh.position.y = this.oceanFloorLevel + 1.5 + 
                Math.sin(time * pickup.bobSpeed) * pickup.bobHeight;
            
            // Rotate
            pickup.mesh.rotation.y += pickup.rotationSpeed;
            
            // Pulse glow effect
            const glowPulse = 0.3 + 0.1 * Math.sin(time * 2);
            pickup.mesh.children[pickup.mesh.children.length - 1].material.opacity = glowPulse;
        }
    }
    
    // Play pickup sound
    playPickupSound(type) {
        // Create audio context if it doesn't exist
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('Web Audio API not supported:', e);
                return;
            }
        }
        
        // Create oscillator
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();
        
        // Set properties based on pickup type
        if (type.startsWith('ammo')) {
            // Ammo pickup sound (higher pitch)
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, window.audioContext.currentTime + 0.1);
        } else if (type.startsWith('health')) {
            // Health pickup sound (lower pitch)
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(330, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(660, window.audioContext.currentTime + 0.2);
        }
        
        // Set volume envelope
        gainNode.gain.setValueAtTime(0.3, window.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.3);
        
        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(window.audioContext.currentTime + 0.3);
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

// PickupSystem class is now available globally as window.PickupSystem