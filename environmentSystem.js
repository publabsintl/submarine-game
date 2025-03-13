/**
 * Environment System for Submarine Game
 * Handles creation and management of the ocean floor, islands, and underwater objects
 */

// Environment System class
class EnvironmentSystem {
    constructor(scene) {
        this.scene = scene;
        this.underwaterObjects = [];
        this.aboveWaterObjects = [];
        this.islands = [];
        this.bubbles = null;
        this.oceanFloor = null;
        this.seaweed = []; // Array to store seaweed objects
    }

    /**
     * Initialize the environment system
     * @returns {Object} Environment objects for tracking
     */
    initialize() {
        console.log("Initializing environment system with a single massive ocean floor");
        
        this.createMassiveOceanFloor();
        this.createIslands();
        this.createUnderwaterVegetation();
        this.createBubbles();
        
        // Store ocean floor position as a global constant for collision detection
        window.OCEAN_FLOOR_LEVEL = this.oceanFloor.position.y;
        console.log("Set OCEAN_FLOOR_LEVEL to:", window.OCEAN_FLOOR_LEVEL);
        
        return {
            underwaterObjects: this.underwaterObjects,
            aboveWaterObjects: this.aboveWaterObjects,
            islands: this.islands
        };
    }
    
    /**
     * Create a single massive ocean floor
     */
    createMassiveOceanFloor() {
        // Create a detailed sand texture for the ocean floor
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 4096; // Very high resolution for better detail
        canvas.height = 4096;
        
        // Base sand color
        ctx.fillStyle = '#e0c9a6'; // Warm sand color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add sand grain texture
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 300000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2 + 0.5;
            const shade = Math.random() * 60;
            
            ctx.fillStyle = `rgb(${220 - shade}, ${190 - shade}, ${150 - shade})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some larger sand patterns
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 25 + 10;
            
            ctx.strokeStyle = '#c19a6b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Create texture from canvas
        const sandTexture = new THREE.CanvasTexture(canvas);
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(50, 50); // Very large repeat for a massive area
        
        // Create ocean floor material with texture
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffe0a0, // Bright sand color
            map: sandTexture,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
            emissive: 0xffaa55, // Orange-yellow emissive
            emissiveIntensity: 0.4
        });
        
        // Create a single MASSIVE floor plane as the base layer
        // Using an extremely large size to ensure it covers the entire playable area
        const worldSize = 20000; // Extremely large to ensure complete coverage
        const floorGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
        this.oceanFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.oceanFloor.rotation.x = -Math.PI / 2;
        this.oceanFloor.position.y = -25;
        
        // Add to scene and track in underwaterObjects array
        this.scene.add(this.oceanFloor);
        this.underwaterObjects.push(this.oceanFloor);
        
        console.log("Added massive ocean floor to scene:", this.oceanFloor);
    }
    
    /**
     * Create islands at various positions
     */
    createIslands() {
        // Create islands at various positions
        this.createIsland(-40, -60, 10);  // Large island
        this.createIsland(50, 30, 8);     // Medium island
        this.createIsland(-20, 40, 5);    // Small island
        this.createIsland(70, -40, 6);    // Another island
        this.createIsland(-80, 15, 7);    // Medium island
        this.createIsland(25, -75, 9);    // Large island 
        this.createIsland(10, 65, 4);     // Small island
        this.createIsland(-55, -25, 8);   // Medium-large island
        this.createIsland(60, 50, 6);     // Medium island
        this.createIsland(-5, 0, 11);     // Very large central island
    }
    
    /**
     * Create a single island
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {number} size - Size of the island
     */
    createIsland(x, z, size) {
        // Island base (above water)
        const islandGeometry = new THREE.CylinderGeometry(size, size * 1.2, 1, 32);
        const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xddbb88 }); // Sandy color
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.set(x, 0.5, z); // Slightly above water
        this.scene.add(island);
        this.aboveWaterObjects.push(island); // Add to above-water objects
        
        // Island underwater part
        const underwaterGeometry = new THREE.CylinderGeometry(size * 1.2, size * 0.8, 25, 32);
        const underwaterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x553311, 
            transparent: true,
            opacity: 0.9
        });
        const underwaterPart = new THREE.Mesh(underwaterGeometry, underwaterMaterial);
        underwaterPart.position.set(x, -12, z); // Below water
        this.scene.add(underwaterPart);
        this.underwaterObjects.push(underwaterPart);
        
        // Add palm trees to island
        const palmCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < palmCount; i++) {
            this.createPalmTree(
                x + Math.random() * size * 0.5 - size * 0.25,
                z + Math.random() * size * 0.5 - size * 0.25,
                size * 0.15
            );
        }
        
        // Store island position and size for collision detection
        this.islands.push({ x, z, size });
    }
    
    /**
     * Create a palm tree
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {number} size - Size of the palm tree
     */
    createPalmTree(x, z, size) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 5, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, size * 2.5 + 0.5, z);
        this.scene.add(trunk);
        this.aboveWaterObjects.push(trunk);
        
        // Tree top (leaves)
        const leavesGeometry = new THREE.SphereGeometry(size * 2, 8, 8);
        leavesGeometry.scale(1, 0.5, 1);
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x2E8B57 }); // Green
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, size * 5 + 0.5, z);
        this.scene.add(leaves);
        this.aboveWaterObjects.push(leaves);
    }
    
    /**
     * Create underwater vegetation (coral, plants)
     */
    createUnderwaterVegetation() {
        // Create underwater plants and coral at various positions
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 200 - 100;
            const z = Math.random() * 200 - 100;
            this.createCoral(x, z);
        }
        
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * 300 - 150;
            const z = Math.random() * 300 - 150;
            this.createSeaweed(x, z);
        }
    }
    
    /**
     * Create coral
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    createCoral(x, z) {
        // Coral base
        const coralGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const coralMaterial = new THREE.MeshPhongMaterial({ 
            color: Math.random() > 0.5 ? 0xFF6F61 : 0xFF9671, // Coral colors
            emissive: 0x331111,
            emissiveIntensity: 0.2
        });
        const coral = new THREE.Mesh(coralGeometry, coralMaterial);
        coral.position.set(x, -24, z); // Just above ocean floor
        coral.scale.set(1, 1.5, 1);
        this.scene.add(coral);
        this.underwaterObjects.push(coral);
    }
    
    /**
     * Create seaweed
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    createSeaweed(x, z) {
        // Create a more realistic seaweed using a vertex-based approach
        const height = Math.random() * 6 + 6; // Taller seaweed
        const segments = 8; // Number of segments
        
        // Create a simple cylinder for the seaweed
        const radius = 0.3;
        const radiusTop = 0.1; // Thinner at the top
        const seaweedGeometry = new THREE.CylinderGeometry(
            radiusTop, radius, height, 8, segments, true
        );
        
        // Move the vertices to create a tapered shape
        const positionAttribute = seaweedGeometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Calculate the segment height (0 at bottom, 1 at top)
            const segmentHeight = (vertex.y + height/2) / height;
            
            // Add some random variation to make it look more natural
            const variation = Math.sin(segmentHeight * Math.PI * 4) * 0.1;
            
            // Apply the variation to x and z
            vertex.x += variation;
            vertex.z += variation;
            
            // Update the position
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Update normals
        seaweedGeometry.computeVertexNormals();
        
        // Create a gradient material for the seaweed
        const seaweedMaterial = new THREE.MeshPhongMaterial({
            color: 0x2E8B57,   // Base green color
            emissive: 0x0A3A1A, // Slight glow
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9,
            shininess: 30,
            side: THREE.DoubleSide
        });
        
        // Create the seaweed mesh
        const seaweed = new THREE.Mesh(seaweedGeometry, seaweedMaterial);
        
        // Position at the specified location
        seaweed.position.set(x, -25 + height/2, z); // Base at ocean floor
        
        // Add slight random rotation for variety
        seaweed.rotation.y = Math.random() * Math.PI * 2;
        
        // Store animation parameters
        seaweed.userData = {
            height: height,
            segments: segments,
            swayFactor: Math.random() * 0.5 + 0.5, // Random sway intensity
            swayOffset: Math.random() * Math.PI * 2, // Random phase offset
            swaySpeed: Math.random() * 0.5 + 0.5,    // Random sway speed
            originalVertices: Array.from({ length: positionAttribute.count }, (_, i) => {
                const vertex = new THREE.Vector3();
                vertex.fromBufferAttribute(positionAttribute, i);
                return vertex.clone();
            })
        };
        
        this.scene.add(seaweed);
        this.underwaterObjects.push(seaweed);
        this.seaweed.push(seaweed);
    }
    
    /**
     * Create bubbles
     */
    createBubbles() {
        // Bubbles
        const bubbleCount = 2050; // Large number of bubbles
        const bubbleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const bubbleMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            emissive: 0xaaaaff,
            emissiveIntensity: 0.2
        });
        
        // Create bubble instances
        this.bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, bubbleCount);
        
        // Position each bubble with a better distribution
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        for (let i = 0; i < bubbleCount; i++) {
            // Distribute bubbles across the ocean floor
            position.set(
                Math.random() * 300 - 150, // X range
                Math.random() * 20 - 25,   // Start at various depths
                Math.random() * 300 - 150  // Z range
            );
            
            // Vary bubble sizes slightly for more natural look
            const bubbleScale = 0.7 + Math.random() * 0.6; // Scale between 0.7 and 1.3
            scale.set(bubbleScale, bubbleScale, bubbleScale);
            
            // Random rotation for variety
            quaternion.setFromEuler(new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ));
            
            // Compose the matrix and set it
            matrix.compose(position, quaternion, scale);
            this.bubbles.setMatrixAt(i, matrix);
        }
        
        // Ensure the instance matrix is marked for update
        this.bubbles.instanceMatrix.needsUpdate = true;
        
        this.scene.add(this.bubbles);
        this.underwaterObjects.push(this.bubbles);
    }
    
    /**
     * Update environment elements (e.g., animate bubbles)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Animate bubbles rising
        if (this.bubbles) {
            const dummy = new THREE.Object3D();
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            // Ensure we have a valid deltaTime
            const dt = deltaTime || 0.016;
            
            for (let i = 0; i < this.bubbles.count; i++) {
                // Get the current matrix for this bubble instance
                this.bubbles.getMatrixAt(i, matrix);
                
                // Decompose the matrix to get position, rotation, and scale
                matrix.decompose(position, quaternion, scale);
                
                // Move bubble upward with increased speed
                position.y += 2.0 * dt;
                
                // Add slight horizontal movement for more natural effect
                // Use unique values for each bubble based on its index
                position.x += Math.sin(Date.now() * 0.001 + i * 0.1) * 0.03;
                position.z += Math.cos(Date.now() * 0.001 + i * 0.17) * 0.03;
                
                // Reset bubble if it reaches the surface
                if (position.y > 0) {
                    position.y = -25;
                    position.x = Math.random() * 300 - 150;
                    position.z = Math.random() * 300 - 150;
                }
                
                // Compose the matrix back with the new position
                matrix.compose(position, quaternion, scale);
                
                // Update the instance matrix
                this.bubbles.setMatrixAt(i, matrix);
            }
            
            // Mark the instance matrix as needing an update
            this.bubbles.instanceMatrix.needsUpdate = true;
        }
        
        // Animate seaweed swaying with better performance
        if (this.seaweed && this.seaweed.length > 0) {
            // Current time for animation
            const time = Date.now() * 0.001;
            
            // Update each seaweed plant
            this.seaweed.forEach(seaweed => {
                if (seaweed.userData && seaweed.userData.originalVertices) {
                    const { height, swayFactor, swayOffset, swaySpeed, originalVertices } = seaweed.userData;
                    
                    // Get position attribute for direct manipulation
                    const positionAttribute = seaweed.geometry.getAttribute('position');
                    
                    // Only update positions every other frame to improve performance
                    if (Math.floor(time * 10) % 2 === 0) {
                        // Temporary vector for calculations
                        const vertex = new THREE.Vector3();
                        
                        // Process each vertex
                        for (let i = 0; i < positionAttribute.count; i++) {
                            // Get the original vertex position
                            const originalVertex = originalVertices[i];
                            
                            // Skip vertices at the very bottom (keep them fixed)
                            if (originalVertex.y < -height/2 + 0.5) continue;
                            
                            // Calculate how far up the seaweed this vertex is (0 at bottom, 1 at top)
                            const heightFactor = (originalVertex.y + height/2) / height;
                            
                            // Higher parts of the seaweed sway more
                            const swayStrength = heightFactor * heightFactor * swayFactor;
                            
                            // Create a wave-like motion that increases with height
                            const waveX = Math.sin(time * swaySpeed + swayOffset) * swayStrength;
                            const waveZ = Math.cos(time * swaySpeed * 0.7 + swayOffset) * swayStrength * 0.7;
                            
                            // Apply the wave motion to the vertex
                            vertex.copy(originalVertex);
                            vertex.x += waveX;
                            vertex.z += waveZ;
                            
                            // Update the position
                            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
                        }
                        
                        // Mark the attribute as needing an update
                        positionAttribute.needsUpdate = true;
                    }
                }
            });
        }
    }
}

// Export the environment system
window.EnvironmentSystem = EnvironmentSystem;
