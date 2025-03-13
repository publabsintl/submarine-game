import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Import timeScale from game.js
let timeScale = 1.0; // Default value that will be updated

// Fish species with different colors, sizes, and behaviors
const FISH_SPECIES = [
    {
        name: "Tropical Fish",
        colors: [0xff5500, 0x00aaff, 0xffaa00, 0xff00ff, 0x55ff00],
        minSize: 0.3,
        maxSize: 0.6,
        speed: 0.05,
        schooling: true,
        schoolSize: 8,
        depth: { min: -10, max: -3 }
    },
    {
        name: "Angelfish",
        colors: [0xffff00, 0x00ffaa, 0xaaaaff],
        minSize: 0.4,
        maxSize: 0.7,
        speed: 0.03,
        schooling: true,
        schoolSize: 5,
        depth: { min: -12, max: -5 }
    },
    {
        name: "Shark",
        colors: [0x555555, 0x777777],
        minSize: 1.5,
        maxSize: 2.5,
        speed: 0.07,
        schooling: false,
        depth: { min: -20, max: -8 }
    },
    {
        name: "Manta Ray",
        colors: [0x000066, 0x0000aa],
        minSize: 2.0,
        maxSize: 3.0,
        speed: 0.04,
        schooling: false,
        depth: { min: -18, max: -6 }
    },
    {
        name: "Jellyfish",
        colors: [0xff00ff, 0xaa00ff, 0xff66ff],
        minSize: 0.5,
        maxSize: 1.2,
        speed: 0.01,
        schooling: true,
        schoolSize: 4,
        depth: { min: -15, max: -2 },
        verticalMovement: true
    }
];

class Fish {
    constructor(scene, species, position) {
        this.scene = scene;
        this.species = species;
        
        // Set random position if not provided
        this.position = position || new THREE.Vector3(
            Math.random() * 400 - 200,  // Expanded range for x
            Math.random() * (species.depth.max - species.depth.min) + species.depth.min,
            Math.random() * 400 - 200   // Expanded range for z
        );
        
        // Random size within species range
        this.size = Math.random() * (species.maxSize - species.minSize) + species.minSize;
        
        // Random color from species colors
        this.color = species.colors[Math.floor(Math.random() * species.colors.length)];
        
        // Movement properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();
        
        this.speed = species.speed * (Math.random() * 0.4 + 0.8); // Slight speed variation
        this.turnSpeed = 0.02;
        this.wanderStrength = 0.05;
        
        // Create the fish mesh
        this.mesh = this.createFishMesh();
        this.scene.add(this.mesh);
        
        // For schooling behavior
        this.schoolCenter = null;
        this.schoolRadius = 10;
        
        // For animation
        this.animationPhase = Math.random() * Math.PI * 2;
        this.animationSpeed = 5 + Math.random() * 3;
    }
    
    createFishMesh() {
        const group = new THREE.Group();
        
        // Different fish shapes based on species name
        if (this.species.name === "Shark") {
            return this.createSharkMesh();
        } else if (this.species.name === "Manta Ray") {
            return this.createMantaRayMesh();
        } else if (this.species.name === "Jellyfish") {
            return this.createJellyfishMesh();
        } else {
            return this.createTropicalFishMesh();
        }
    }
    
    createTropicalFishMesh() {
        const group = new THREE.Group();
        
        // Fish body
        const bodyGeometry = new THREE.ConeGeometry(this.size * 0.5, this.size * 1.5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 80,
            specular: 0xffffff
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.z = -this.size * 0.25;
        
        // Tail fin
        const tailGeometry = new THREE.PlaneGeometry(this.size * 0.8, this.size * 0.8);
        const tailMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 80,
            specular: 0xffffff,
            side: THREE.DoubleSide
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.z = -this.size * 1;
        tail.rotation.y = Math.PI / 2;
        
        // Side fins
        const finGeometry = new THREE.PlaneGeometry(this.size * 0.6, this.size * 0.3);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 80,
            specular: 0xffffff,
            side: THREE.DoubleSide
        });
        
        const leftFin = new THREE.Mesh(finGeometry, finMaterial);
        leftFin.position.set(-this.size * 0.4, 0, -this.size * 0.2);
        leftFin.rotation.y = Math.PI / 4;
        leftFin.rotation.z = -Math.PI / 6;
        
        const rightFin = new THREE.Mesh(finGeometry, finMaterial);
        rightFin.position.set(this.size * 0.4, 0, -this.size * 0.2);
        rightFin.rotation.y = -Math.PI / 4;
        rightFin.rotation.z = Math.PI / 6;
        
        // Add all parts to group
        group.add(body);
        group.add(tail);
        group.add(leftFin);
        group.add(rightFin);
        
        // Store references for animation
        this.tail = tail;
        this.leftFin = leftFin;
        this.rightFin = rightFin;
        
        // Set initial position
        group.position.copy(this.position);
        
        return group;
    }
    
    createSharkMesh() {
        const group = new THREE.Group();
        
        // Shark body
        const bodyGeometry = new THREE.CylinderGeometry(this.size * 0.4, this.size * 0.2, this.size * 3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 30,
            specular: 0x333333
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        
        // Shark head
        const headGeometry = new THREE.ConeGeometry(this.size * 0.4, this.size * 1, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 30,
            specular: 0x333333
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.rotation.x = -Math.PI / 2;
        head.position.z = this.size * 2;
        
        // Dorsal fin
        const dorsalGeometry = new THREE.PlaneGeometry(this.size * 1.2, this.size * 0.8);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 30,
            specular: 0x333333,
            side: THREE.DoubleSide
        });
        const dorsalFin = new THREE.Mesh(dorsalGeometry, finMaterial);
        dorsalFin.position.set(0, this.size * 0.8, this.size * 0.5);
        dorsalFin.rotation.x = Math.PI / 6;
        
        // Tail fin
        const tailGeometry = new THREE.PlaneGeometry(this.size * 1.5, this.size * 1);
        const tail = new THREE.Mesh(tailGeometry, finMaterial);
        tail.position.z = -this.size * 1.5;
        tail.rotation.y = Math.PI / 2;
        
        // Side fins
        const sideFinGeometry = new THREE.PlaneGeometry(this.size * 1, this.size * 0.5);
        
        const leftFin = new THREE.Mesh(sideFinGeometry, finMaterial);
        leftFin.position.set(-this.size * 0.6, -this.size * 0.2, this.size * 0.5);
        leftFin.rotation.y = Math.PI / 4;
        leftFin.rotation.z = -Math.PI / 6;
        
        const rightFin = new THREE.Mesh(sideFinGeometry, finMaterial);
        rightFin.position.set(this.size * 0.6, -this.size * 0.2, this.size * 0.5);
        rightFin.rotation.y = -Math.PI / 4;
        rightFin.rotation.z = Math.PI / 6;
        
        // Add all parts to group
        group.add(body);
        group.add(head);
        group.add(dorsalFin);
        group.add(tail);
        group.add(leftFin);
        group.add(rightFin);
        
        // Store references for animation
        this.tail = tail;
        this.leftFin = leftFin;
        this.rightFin = rightFin;
        
        // Set initial position
        group.position.copy(this.position);
        
        return group;
    }
    
    createMantaRayMesh() {
        const group = new THREE.Group();
        
        // Manta body - use a flattened sphere
        const bodyGeometry = new THREE.SphereGeometry(this.size, 16, 16);
        bodyGeometry.scale(1.5, 0.3, 1);
        
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 50,
            specular: 0x666666
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Wings - use planes
        const wingGeometry = new THREE.PlaneGeometry(this.size * 3, this.size * 1.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 50,
            specular: 0x666666,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-this.size * 1.5, 0, 0);
        leftWing.rotation.y = Math.PI / 6;
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(this.size * 1.5, 0, 0);
        rightWing.rotation.y = -Math.PI / 6;
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(this.size * 0.1, this.size * 0.05, this.size * 2, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.z = -this.size * 1;
        tail.rotation.x = Math.PI / 2;
        
        // Add all parts to group
        group.add(body);
        group.add(leftWing);
        group.add(rightWing);
        group.add(tail);
        
        // Store references for animation
        this.leftWing = leftWing;
        this.rightWing = rightWing;
        
        // Set initial position
        group.position.copy(this.position);
        
        return group;
    }
    
    createJellyfishMesh() {
        const group = new THREE.Group();
        
        // Jellyfish bell (dome)
        const bellGeometry = new THREE.SphereGeometry(this.size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bellMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.7,
            shininess: 100,
            specular: 0xffffff
        });
        const bell = new THREE.Mesh(bellGeometry, bellMaterial);
        
        // Tentacles
        const tentacleCount = 8;
        this.tentacles = [];
        
        for (let i = 0; i < tentacleCount; i++) {
            const tentacleGeometry = new THREE.CylinderGeometry(this.size * 0.05, this.size * 0.01, this.size * 2, 4);
            const tentacleMaterial = new THREE.MeshPhongMaterial({ 
                color: this.color,
                transparent: true,
                opacity: 0.6,
                shininess: 100,
                specular: 0xffffff
            });
            const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
            
            const angle = (i / tentacleCount) * Math.PI * 2;
            const radius = this.size * 0.7;
            
            tentacle.position.set(
                Math.cos(angle) * radius,
                -this.size,
                Math.sin(angle) * radius
            );
            
            tentacle.rotation.x = Math.PI / 2;
            
            group.add(tentacle);
            this.tentacles.push(tentacle);
        }
        
        // Add bell to group
        group.add(bell);
        
        // Set initial position
        group.position.copy(this.position);
        
        return group;
    }
    
    update(deltaTime, otherFish, obstacles) {
        // Skip if not visible
        if (!this.mesh.visible) return;
        
        // Animation time
        const time = performance.now() * 0.001;
        
        // Calculate steering forces
        let steering = new THREE.Vector3();
        
        // Schooling behavior for schooling species
        if (this.species.schooling && otherFish) {
            // Find school center
            if (!this.schoolCenter) {
                // Find nearby fish of same species
                const sameFish = otherFish.filter(fish => 
                    fish !== this && 
                    fish.species.name === this.species.name &&
                    fish.mesh.position.distanceTo(this.mesh.position) < 50
                );
                
                if (sameFish.length > 0) {
                    // Calculate average position
                    const center = new THREE.Vector3();
                    sameFish.forEach(fish => center.add(fish.mesh.position));
                    center.divideScalar(sameFish.length);
                    
                    this.schoolCenter = center;
                }
            }
            
            // Move toward school center
            if (this.schoolCenter) {
                const toSchool = new THREE.Vector3().subVectors(this.schoolCenter, this.mesh.position);
                const distance = toSchool.length();
                
                if (distance > this.schoolRadius) {
                    // Outside school radius, steer toward center
                    toSchool.normalize().multiplyScalar(0.02);
                    steering.add(toSchool);
                } else if (distance < this.schoolRadius * 0.5) {
                    // Too close to center, steer away slightly
                    toSchool.normalize().multiplyScalar(-0.01);
                    steering.add(toSchool);
                }
                
                // Occasionally update school center
                if (Math.random() < 0.005) {
                    this.schoolCenter = null;
                }
            }
        }
        
        // Obstacle avoidance
        if (obstacles) {
            for (const obstacle of obstacles) {
                if (!obstacle.position) continue;
                
                const toObstacle = new THREE.Vector3().subVectors(obstacle.position, this.mesh.position);
                const distance = toObstacle.length();
                const avoidanceRadius = (obstacle.size || 5) + this.size * 5;
                
                if (distance < avoidanceRadius) {
                    // Steer away from obstacle
                    const avoidanceForce = toObstacle.normalize().multiplyScalar(-0.1 * (avoidanceRadius / Math.max(distance, 0.1)));
                    steering.add(avoidanceForce);
                }
            }
        }
        
        // Random wandering behavior
        if (Math.random() < 0.02) {
            const wanderForce = new THREE.Vector3(
                (Math.random() - 0.5) * this.wanderStrength,
                this.species.verticalMovement ? (Math.random() - 0.5) * this.wanderStrength * 0.5 : 0,
                (Math.random() - 0.5) * this.wanderStrength
            );
            steering.add(wanderForce);
        }
        
        // Apply steering force to direction
        this.direction.add(steering).normalize();
        
        // Set velocity based on direction and speed
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        
        // Update position
        this.mesh.position.add(this.velocity);
        
        // Update rotation to face direction of movement
        if (this.velocity.length() > 0.001) {
            const targetRotation = Math.atan2(this.direction.x, this.direction.z);
            this.mesh.rotation.y = targetRotation;
        }
        
        // Animate fish parts based on species
        if (this.species.name === "Tropical Fish" || this.species.name === "Angelfish") {
            // Tail swishing
            if (this.tail) {
                this.tail.rotation.z = Math.sin(time * this.animationSpeed) * 0.3;
            }
            
            // Fin movement
            if (this.leftFin && this.rightFin) {
                this.leftFin.rotation.z = -Math.PI / 6 + Math.sin(time * this.animationSpeed * 0.7) * 0.1;
                this.rightFin.rotation.z = Math.PI / 6 - Math.sin(time * this.animationSpeed * 0.7) * 0.1;
            }
        } else if (this.species.name === "Shark") {
            // Tail swishing for shark
            if (this.tail) {
                this.tail.rotation.z = Math.sin(time * this.animationSpeed * 0.5) * 0.2;
            }
        } else if (this.species.name === "Manta Ray") {
            // Wing flapping for manta ray
            if (this.leftWing && this.rightWing) {
                this.leftWing.rotation.z = Math.sin(time * this.animationSpeed * 0.3) * 0.15;
                this.rightWing.rotation.z = -Math.sin(time * this.animationSpeed * 0.3) * 0.15;
            }
        } else if (this.species.name === "Jellyfish") {
            // Bell pulsing and tentacle movement
            this.mesh.scale.y = 0.9 + Math.sin(time * this.animationSpeed * 0.2) * 0.1;
            
            // Tentacle movement
            if (this.tentacles) {
                this.tentacles.forEach((tentacle, i) => {
                    const offset = i * 0.2;
                    tentacle.rotation.x = Math.PI / 2 + Math.sin(time * this.animationSpeed * 0.3 + offset) * 0.1;
                    tentacle.rotation.z = Math.sin(time * this.animationSpeed * 0.2 + offset) * 0.1;
                });
            }
            
            // Vertical movement for jellyfish
            this.mesh.position.y += Math.sin(time * this.animationSpeed * 0.1) * 0.01;
        }
        
        // Keep within bounds and depth range
        this.keepInBounds();
    }
    
    keepInBounds() {
        const bounds = 200; // Expanded bounds
        const minDepth = this.species.depth.min;
        const maxDepth = this.species.depth.max;
        
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
            this.direction.y *= -1;
        } else if (this.mesh.position.y > maxDepth) {
            this.mesh.position.y = maxDepth;
            this.direction.y *= -1;
        }
    }
}

class FishSystem {
    constructor(scene) {
        this.scene = scene;
        this.fishes = [];
        this.obstacles = []; // Will store islands and other obstacles
    }
    
    initialize(fishCount = 100) {
        // Create fish of different species
        for (const species of FISH_SPECIES) {
            // Determine how many of this species to create
            let count;
            if (species.schooling) {
                // Create schools
                const schoolCount = Math.floor(fishCount * 0.15 / species.schoolSize);
                
                for (let s = 0; s < schoolCount; s++) {
                    // Create a school center
                    const schoolCenter = new THREE.Vector3(
                        Math.random() * 400 - 200,
                        Math.random() * (species.depth.max - species.depth.min) + species.depth.min,
                        Math.random() * 400 - 200
                    );
                    
                    // Create fish in this school
                    for (let i = 0; i < species.schoolSize; i++) {
                        // Position near school center
                        const offset = new THREE.Vector3(
                            (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 5,
                            (Math.random() - 0.5) * 10
                        );
                        
                        const position = schoolCenter.clone().add(offset);
                        const fish = new Fish(this.scene, species, position);
                        this.fishes.push(fish);
                    }
                }
            } else {
                // Non-schooling species (like sharks)
                count = Math.floor(fishCount * 0.05); // 5% of total for each non-schooling species
                
                for (let i = 0; i < count; i++) {
                    const fish = new Fish(this.scene, species);
                    this.fishes.push(fish);
                }
            }
        }
    }
    
    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }
    
    // Method to update the timeScale from game.js
    setTimeScale(value) {
        timeScale = value;
    }
    
    update(deltaTime, playerPosition) {
        // Get the latest timeScale value from game.js
        if (window.timeScale !== undefined) {
            timeScale = window.timeScale;
        }
        
        // Apply timeScale to deltaTime
        const scaledDeltaTime = deltaTime * timeScale;
        
        // Add player submarine as an obstacle
        const playerObstacle = {
            position: playerPosition,
            size: 5
        };
        
        const allObstacles = [...this.obstacles, playerObstacle];
        
        // Update all fish
        this.fishes.forEach(fish => {
            fish.update(scaledDeltaTime, this.fishes, allObstacles);
            
            // Hide fish when above water
            if (fish.mesh.position.y > -1) {
                fish.mesh.visible = false;
            } else {
                fish.mesh.visible = true;
            }
            
            // Hide fish that are too far from player (optimization)
            const distanceToPlayer = fish.mesh.position.distanceTo(playerPosition);
            if (distanceToPlayer > 250) {
                fish.mesh.visible = false;
            }
        });
    }
}

export { FishSystem };