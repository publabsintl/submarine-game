// Combat System Module for Submarine Game
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Combat system class to handle collisions, damage, and effects
class CombatSystem {
    constructor(scene, playerSubmarine, playerStats) {
        this.scene = scene;
        this.playerSubmarine = playerSubmarine;
        this.playerStats = playerStats;
        
        // Collision parameters
        this.playerCollisionRadius = 3;
        this.enemyCollisionRadius = 3;
        this.torpedoCollisionRadius = 1;
        
        // Damage values
        this.torpedoDamage = 50;      // Damage torpedo does to enemies
        this.collisionDamage = 10;    // Damage from colliding with enemies
        this.enemyTorpedoDamage = 2;  // Damage enemy torpedoes do to player
        
        // Cooldown tracking
        this.lastDamageTime = 0;
        this.damageCooldown = 1000;   // 1 second invulnerability after taking damage
        
        // Explosion particles
        this.explosionParticles = [];
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    // Set up event listeners for combat events
    setupEventListeners() {
        // Listen for torpedo hits
        document.addEventListener('torpedoHit', (event) => {
            this.handleTorpedoHit(event.detail.position, event.detail.radius || 2);
        });
        
        // Listen for enemy torpedo hits
        document.addEventListener('enemyTorpedoFired', (event) => {
            this.handleEnemyTorpedo(event.detail);
        });
    }
    
    // Update function called each frame
    update(enemies, torpedoes, deltaTime) {
        // Check for collisions between player and enemies
        this.checkPlayerEnemyCollisions(enemies);
        
        // Check for collisions between torpedoes and enemies
        this.checkTorpedoEnemyCollisions(torpedoes, enemies);
        
        // Update explosion particles
        this.updateExplosions(deltaTime);
    }
    
    // Check for collisions between player and enemies
    checkPlayerEnemyCollisions(enemies) {
        if (!this.playerSubmarine || !enemies) return;
        
        const currentTime = performance.now();
        if (currentTime - this.lastDamageTime < this.damageCooldown) {
            return; // Player is in invulnerability period
        }
        
        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            
            const distance = enemy.mesh.position.distanceTo(this.playerSubmarine.position);
            const collisionThreshold = this.playerCollisionRadius + this.enemyCollisionRadius;
            
            if (distance < collisionThreshold) {
                // Collision detected
                this.playerStats.takeDamage(this.collisionDamage);
                this.lastDamageTime = currentTime;
                
                // Create small explosion effect
                this.createExplosion(
                    new THREE.Vector3().addVectors(
                        this.playerSubmarine.position,
                        enemy.mesh.position
                    ).multiplyScalar(0.5),
                    1.5
                );
                
                // Apply knockback to player
                const knockbackDirection = new THREE.Vector3()
                    .subVectors(this.playerSubmarine.position, enemy.mesh.position)
                    .normalize();
                
                this.playerSubmarine.velocity.add(
                    knockbackDirection.multiplyScalar(0.2)
                );
                
                // Also damage the enemy
                enemy.takeDamage(this.collisionDamage);
                
                break; // Only process one collision per frame
            }
        }
    }
    
    // Check for collisions between torpedoes and enemies
    checkTorpedoEnemyCollisions(torpedoes, enemies) {
        if (!torpedoes || !enemies) return;
        
        for (let i = torpedoes.length - 1; i >= 0; i--) {
            const torpedo = torpedoes[i];
            
            for (const enemy of enemies) {
                if (enemy.isDestroyed) continue;
                
                const distance = enemy.mesh.position.distanceTo(torpedo.position);
                const collisionThreshold = this.torpedoCollisionRadius + this.enemyCollisionRadius;
                
                if (distance < collisionThreshold) {
                    // Torpedo hit enemy
                    enemy.takeDamage(this.torpedoDamage);
                    
                    // Create explosion effect
                    this.createExplosion(torpedo.position.clone(), 2);
                    
                    // Remove torpedo
                    this.scene.remove(torpedo);
                    torpedoes.splice(i, 1);
                    
                    // Dispatch torpedo hit event
                    const hitEvent = new CustomEvent('torpedoHit', {
                        detail: {
                            position: torpedo.position.clone(),
                            radius: 2
                        }
                    });
                    document.dispatchEvent(hitEvent);
                    
                    break; // Torpedo can only hit one enemy
                }
            }
        }
    }
    
    // Handle torpedo hit event
    handleTorpedoHit(position, radius) {
        // This is handled by the checkTorpedoEnemyCollisions method
        // but we keep this for external events
    }
    
    // Handle enemy torpedo
    handleEnemyTorpedo(torpedoData) {
        // Create enemy torpedo
        const torpedoGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const torpedoMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
        
        // Set torpedo position and direction
        torpedo.position.copy(torpedoData.position);
        torpedo.direction = torpedoData.direction.clone();
        torpedo.target = torpedoData.target.clone();
        torpedo.speed = 0.8; // Slightly slower than player torpedoes
        torpedo.lifeTime = 100;
        torpedo.isEnemyTorpedo = true;
        
        // Add to scene
        this.scene.add(torpedo);
        
        // Add to torpedoes array via event
        const addTorpedoEvent = new CustomEvent('addEnemyTorpedo', {
            detail: { torpedo }
        });
        document.dispatchEvent(addTorpedoEvent);
    }
    
    // Create explosion effect
    createExplosion(position, size = 2) {
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
        this.scene.add(explosion);
        
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
        
        // Add to explosions array for animation
        this.explosionParticles.push({
            mesh: explosion,
            velocities: velocities,
            lifetime: 20 // Frames until explosion disappears
        });
        
        // Play explosion sound
        this.playExplosionSound();
    }
    
    // Update explosion particles
    updateExplosions(deltaTime) {
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const explosion = this.explosionParticles[i];
            const positions = explosion.mesh.geometry.attributes.position.array;
            
            // Update particle positions
            for (let j = 0; j < positions.length / 3; j++) {
                const idx = j * 3;
                positions[idx] += explosion.velocities[j].x;
                positions[idx + 1] += explosion.velocities[j].y;
                positions[idx + 2] += explosion.velocities[j].z;
            }
            
            // Mark positions for update
            explosion.mesh.geometry.attributes.position.needsUpdate = true;
            
            // Decrease opacity over time
            explosion.mesh.material.opacity -= 0.04;
            
            // Decrease lifetime
            explosion.lifetime--;
            
            // Remove when fully transparent or lifetime ended
            if (explosion.mesh.material.opacity <= 0 || explosion.lifetime <= 0) {
                this.scene.remove(explosion.mesh);
                this.explosionParticles.splice(i, 1);
            }
        }
    }
    
    // Play explosion sound
    playExplosionSound() {
        // Create audio context if not exists
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported in this browser');
                return;
            }
        }
        
        // Create oscillator for explosion sound
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, window.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, window.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(window.audioContext.currentTime + 0.3);
    }
    
    // Check if player torpedo hits an enemy
    checkTorpedoHit(torpedoPosition, enemies) {
        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            
            const distance = enemy.mesh.position.distanceTo(torpedoPosition);
            if (distance < this.enemyCollisionRadius + this.torpedoCollisionRadius) {
                return enemy;
            }
        }
        return null;
    }
    
    // Check if enemy torpedo hits player
    checkEnemyTorpedoHit(torpedo) {
        if (!this.playerSubmarine) return false;
        
        const distance = this.playerSubmarine.position.distanceTo(torpedo.position);
        if (distance < this.playerCollisionRadius + this.torpedoCollisionRadius) {
            // Player hit by enemy torpedo
            this.playerStats.takeDamage(this.enemyTorpedoDamage);
            this.createExplosion(torpedo.position.clone(), 1.5);
            return true;
        }
        return false;
    }
}

// Export the CombatSystem class
export { CombatSystem };