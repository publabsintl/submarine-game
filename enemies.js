// THREE is loaded globally from index.html

// Array of computer-generated enemy names
const ENEMY_NAMES = [
    "Red October", "Typhoon", "Akula", "Seawolf", "Virginia",
    "Ohio", "Triton", "Nautilus", "Trident", "Poseidon",
    "Kraken", "Leviathan", "Barracuda", "Stingray", "Hammerhead",
    "Mako", "Shark", "Piranha", "Orca", "Narwhal"
];

// Enemy class to manage enemy submarines
window.Enemy = class Enemy {
    constructor(scene, position, size = 1.0) {
        this.scene = scene;
        this.position = position || new THREE.Vector3(
            Math.random() * 200 - 100,  // Random x position
            -Math.random() * 15 - 5,    // Random depth below water
            Math.random() * 200 - 100   // Random z position
        );
        this.size = size;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();
        this.rotationSpeed = 0.01;
        this.maxSpeed = 0.1;
        this.detectionRange = 50; // How far the enemy can detect the player
        this.attackRange = 30;    // How close the enemy needs to be to attack
        this.health = 100;
        this.isDestroyed = false;
        this.lastTorpedoTime = 0;
        this.torpedoCooldown = 5000; // 5 seconds between torpedo shots
        
        // Generate a random name for this enemy
        this.name = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
        
        this.mesh = this.createEnemySubmarine();
        this.scene.add(this.mesh);
    }
    
    createEnemySubmarine() {
        // Create enemy submarine mesh
        const group = new THREE.Group();
        
        // Submarine body - red cylinder for enemy
        const bodyGeometry = new THREE.CylinderGeometry(1 * this.size, 1 * this.size, 6 * this.size, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xaa0000 }); // Red color for enemy
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate to horizontal position
        
        // Submarine conning tower (sail)
        const towerGeometry = new THREE.CylinderGeometry(0.5 * this.size, 0.5 * this.size, 1.5 * this.size, 8);
        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0xaa0000 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 1 * this.size;
        
        // Add parts to group
        group.add(body);
        group.add(tower);
        
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
        context.fillStyle = '#FF9999'; // Light red for enemy names
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeText(this.name, canvas.width / 2, 30);
        context.fillText(this.name, canvas.width / 2, 30);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        // Create sprite
        const nameSprite = new THREE.Sprite(spriteMaterial);
        nameSprite.scale.set(5 * this.size, 1.25 * this.size, 1);
        nameSprite.position.set(0, 3 * this.size, 0); // Position above submarine
        
        // Add to group
        group.add(nameSprite);
        
        // Create health bar
        this.healthBarCanvas = document.createElement('canvas');
        this.healthBarContext = this.healthBarCanvas.getContext('2d');
        this.healthBarCanvas.width = 100;
        this.healthBarCanvas.height = 20;
        
        // Create initial health bar texture
        this.updateHealthBar();
        
        // Create health bar sprite
        this.healthBarTexture = new THREE.CanvasTexture(this.healthBarCanvas);
        const healthBarMaterial = new THREE.SpriteMaterial({
            map: this.healthBarTexture,
            transparent: true
        });
        
        this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
        this.healthBarSprite.scale.set(4 * this.size, 0.8 * this.size, 1);
        this.healthBarSprite.position.set(0, 4 * this.size, 0); // Position above name
        
        // Add health bar to group
        group.add(this.healthBarSprite);
        
        // Set initial position
        group.position.copy(this.position);
        
        return group;
    }
    
    updateHealthBar() {
        const ctx = this.healthBarContext;
        const width = this.healthBarCanvas.width;
        const height = this.healthBarCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        
        // Calculate health percentage
        const healthPercent = Math.max(0, this.health) / 100;
        const barWidth = width * healthPercent;
        
        // Choose color based on health percentage
        if (healthPercent > 0.6) {
            ctx.fillStyle = '#00FF00'; // Green
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = '#FFFF00'; // Yellow
        } else {
            ctx.fillStyle = '#FF0000'; // Red
        }
        
        // Draw health bar
        ctx.fillRect(0, 0, barWidth, height);
        
        // Add border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        // Update texture if it exists
        if (this.healthBarTexture) {
            this.healthBarTexture.needsUpdate = true;
        }
    }
    
    update(playerSubmarine, deltaTime) {
        if (this.isDestroyed) return;
        
        // Calculate distance to player
        const distanceToPlayer = this.mesh.position.distanceTo(playerSubmarine.position);
        
        if (distanceToPlayer < this.detectionRange) {
            // Player detected - pursue
            const directionToPlayer = new THREE.Vector3()
                .subVectors(playerSubmarine.position, this.mesh.position)
                .normalize();
            
            // Gradually turn towards player
            this.direction.lerp(directionToPlayer, 0.02);
            this.direction.normalize();
            
            // Accelerate towards player in all dimensions (including depth)
            this.velocity.x += this.direction.x * 0.005;
            this.velocity.z += this.direction.z * 0.005;
            
            // Track player's depth (y-coordinate)
            const depthDifference = playerSubmarine.position.y - this.mesh.position.y;
            // Apply a smaller factor for vertical movement to make it more realistic
            this.velocity.y += Math.sign(depthDifference) * 0.002;
            
            // If in attack range, fire torpedo occasionally
            if (distanceToPlayer < this.attackRange) {
                const currentTime = performance.now();
                if (currentTime - this.lastTorpedoTime > this.torpedoCooldown) {
                    this.fireTorpedo(playerSubmarine.position);
                    this.lastTorpedoTime = currentTime;
                }
            }
        } else {
            // Random movement when player not detected
            if (Math.random() < 0.01) {
                // Occasionally change direction
                this.direction.x += (Math.random() - 0.5) * 0.2;
                this.direction.z += (Math.random() - 0.5) * 0.2;
                this.direction.normalize();
            }
            
            // Move forward in current direction
            this.velocity.x += this.direction.x * 0.002;
            this.velocity.z += this.direction.z * 0.002;
        }
        
        // Apply drag to slow down
        this.velocity.multiplyScalar(0.98);
        
        // Limit maximum speed
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Update position
        this.mesh.position.add(this.velocity);
        
        // Update rotation to face direction of movement
        const targetRotation = Math.atan2(this.direction.x, this.direction.z);
        this.mesh.rotation.y = targetRotation;
        
        // Random vertical movement (bobbing)
        this.mesh.position.y += Math.sin(performance.now() * 0.001) * 0.01;
        
        // Keep within bounds
        this.keepInBounds();
    }
    
    keepInBounds() {
        const bounds = 150;
        const minDepth = -20;
        const maxDepth = -2;
        
        // X boundaries
        if (this.mesh.position.x > bounds) {
            this.mesh.position.x = bounds;
            this.direction.x *= -1;
        } else if (this.mesh.position.x < -bounds) {
            this.mesh.position.x = -bounds;
            this.direction.x *= -1;
        }
        
        // Z boundaries
        if (this.mesh.position.z > bounds) {
            this.mesh.position.z = bounds;
            this.direction.z *= -1;
        } else if (this.mesh.position.z < -bounds) {
            this.mesh.position.z = -bounds;
            this.direction.z *= -1;
        }
        
        // Y (depth) boundaries
        if (this.mesh.position.y < minDepth) {
            this.mesh.position.y = minDepth;
            this.velocity.y *= -0.5;
        } else if (this.mesh.position.y > maxDepth) {
            this.mesh.position.y = maxDepth;
            this.velocity.y *= -0.5;
        }
    }
    
    fireTorpedo(targetPosition) {
        // Get the current difficulty level from the wave manager if available
        let difficultyLevel = 1;
        if (window.currentDifficultyLevel !== undefined) {
            difficultyLevel = window.currentDifficultyLevel;
        }
        
        // Calculate accuracy based on difficulty level (1-5)
        // Higher difficulty = more accurate shots
        const accuracyVariance = this.calculateAccuracyVariance(difficultyLevel);
        
        // Apply random deviation to the target position based on accuracy
        const adjustedTarget = targetPosition.clone();
        
        // Add random deviation to x, y, and z coordinates (3D space)
        adjustedTarget.x += (Math.random() - 0.5) * accuracyVariance;
        adjustedTarget.y += (Math.random() - 0.5) * accuracyVariance * 0.5; // Less variance in depth for more accurate shots
        adjustedTarget.z += (Math.random() - 0.5) * accuracyVariance;
        
        // Calculate direction to the adjusted target
        const adjustedDirection = new THREE.Vector3()
            .subVectors(adjustedTarget, this.mesh.position)
            .normalize();
        
        // Create a new torpedo event that the main game can handle
        const torpedoFiredEvent = new CustomEvent('enemyTorpedoFired', {
            detail: {
                position: this.mesh.position.clone(),
                direction: adjustedDirection,
                target: adjustedTarget
            }
        });
        document.dispatchEvent(torpedoFiredEvent);
    }
    
    calculateAccuracyVariance(difficultyLevel) {
        // Scale from 1-5 difficulty
        // Difficulty 1: Large variance (inaccurate) = 15 (reduced from 30)
        // Difficulty 5: Small variance (accurate) = 2 (reduced from 5)
        const maxVariance = 15; // Reduced from 30 for better accuracy at low difficulty
        const minVariance = 2;  // Reduced from 5 for better accuracy at high difficulty
        
        // Linear interpolation between max and min variance based on difficulty
        return maxVariance - ((difficultyLevel - 1) / 4) * (maxVariance - minVariance);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Update health bar appearance
        this.updateHealthBar();
        
        if (this.health <= 0 && !this.isDestroyed) {
            this.destroy();
        }
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Create explosion event
        const explosionEvent = new CustomEvent('enemyDestroyed', {
            detail: {
                position: this.mesh.position.clone(),
                size: this.size * 2
            }
        });
        document.dispatchEvent(explosionEvent);
        
        // Hide the submarine
        this.mesh.visible = false;
        
        // Remove from scene after a delay
        setTimeout(() => {
            this.scene.remove(this.mesh);
        }, 1000);
    }
}

// EnemyManager class to handle multiple enemies
window.EnemyManager = class EnemyManager {
    constructor(scene, maxEnemies = 25) {
        this.scene = scene;
        this.enemies = [];
        this.maxEnemies = maxEnemies; // Set a high default max for wave system
        this.spawnInterval = 20000; // 20 seconds between spawns (used in auto-spawn mode)
        this.lastSpawnTime = 0;
        this.enemyTorpedoes = []; // Track enemy torpedoes
        this.combatSystem = null; // Will be set by game.js
    }
    
    // Set the combat system reference
    setCombatSystem(combatSystem) {
        this.combatSystem = combatSystem;
    }
    
    initialize() {
        // Set up event listeners for torpedo hits
        document.addEventListener('torpedoHit', (event) => {
            const position = event.detail.position;
            const radius = event.detail.radius || 2;
            
            // Check if any enemies are hit
            this.enemies.forEach(enemy => {
                if (!enemy.isDestroyed) {
                    const distance = enemy.mesh.position.distanceTo(position);
                    if (distance < radius) {
                        enemy.takeDamage(50); // Torpedo does 50 damage
                    }
                }
            });
        });
        
        // Listen for enemy torpedo creation
        document.addEventListener('addEnemyTorpedo', (event) => {
            this.enemyTorpedoes.push(event.detail.torpedo);
        });
    }
    
    // Clear all enemies (used when starting a new wave)
    clearEnemies() {
        // Remove all enemies from the scene
        this.enemies.forEach(enemy => {
            if (enemy.mesh && enemy.mesh.parent) {
                this.scene.remove(enemy.mesh);
            }
        });
        
        // Clear the enemies array
        this.enemies = [];
        
        // Clear enemy torpedoes
        this.enemyTorpedoes.forEach(torpedo => {
            if (torpedo && torpedo.parent) {
                this.scene.remove(torpedo);
            }
        });
        
        this.enemyTorpedoes = [];
    }
    
    spawnEnemy() {
        // No limit check here - we trust the wave manager to call this
        // the correct number of times based on the current wave
        const enemy = new Enemy(this.scene);
        this.enemies.push(enemy);
        return enemy;
    }
    
    update(playerSubmarine, deltaTime) {
        // Update existing enemies
        this.enemies.forEach(enemy => {
            enemy.update(playerSubmarine, deltaTime);
        });
        
        // Remove destroyed enemies
        this.enemies = this.enemies.filter(enemy => {
            return enemy.mesh.parent !== null;
        });
        
        // Update enemy torpedoes
        this.updateEnemyTorpedoes(playerSubmarine);
    }
    
    // Update enemy torpedoes
    updateEnemyTorpedoes(playerSubmarine) {
        for (let i = this.enemyTorpedoes.length - 1; i >= 0; i--) {
            const torpedo = this.enemyTorpedoes[i];
            
            // Move torpedo forward in its direction (including depth)
            torpedo.position.x += torpedo.direction.x * torpedo.speed;
            torpedo.position.y += torpedo.direction.y * torpedo.speed;
            torpedo.position.z += torpedo.direction.z * torpedo.speed;
            
            // Check for collision with player
            if (this.combatSystem && this.combatSystem.checkEnemyTorpedoHit(torpedo)) {
                // Remove the torpedo
                this.scene.remove(torpedo);
                this.enemyTorpedoes.splice(i, 1);
                continue;
            }
            
            // Prevent torpedoes from going below the ocean floor
            if (torpedo.position.y < -25) { // Ocean floor level
                // Create a small explosion effect
                if (this.combatSystem) {
                    this.combatSystem.createExplosion(torpedo.position.clone(), 0.5);
                }
                
                // Remove the torpedo
                this.scene.remove(torpedo);
                this.enemyTorpedoes.splice(i, 1);
                continue;
            }
            
            // Decrease lifetime
            torpedo.lifeTime--;
            
            // Remove torpedo if it's too old
            if (torpedo.lifeTime <= 0) {
                this.scene.remove(torpedo);
                this.enemyTorpedoes.splice(i, 1);
            }
        }
    }
    
    // Check if player collides with any enemies
    checkPlayerCollision(playerPosition, playerRadius = 3) {
        for (const enemy of this.enemies) {
            if (!enemy.isDestroyed) {
                const distance = enemy.mesh.position.distanceTo(playerPosition);
                if (distance < playerRadius + (enemy.size * 3)) {
                    return true;
                }
            }
        }
        return false;
    }
}

// Enemy and EnemyManager classes are now available globally as window.Enemy and window.EnemyManager
