import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Environment system to handle the expanded underwater world
class EnvironmentSystem {
    constructor(scene) {
        this.scene = scene;
        this.underwaterObjects = [];
        this.aboveWaterObjects = [];
        this.islands = []; // Array to store island positions and sizes for collision detection
        this.waterLevel = 0;
        this.oceanFloorLevel = -25;
    }
    
    initialize() {
        // Create expanded ocean floor
        this.createOceanFloor();
        
        // Create underwater terrain features
        this.createUnderwaterTerrain();
        
        // Create islands
        this.createIslands();
        
        // Create underwater decorations
        this.createCoralReefs();
        this.createSeaweedForests();
        this.createRockFormations();
        
        // Create bubbles
        this.createBubbles();
        
        // Return the islands array for collision detection
        return {
            islands: this.islands,
            underwaterObjects: this.underwaterObjects,
            aboveWaterObjects: this.aboveWaterObjects
        };
    }
    
    createOceanFloor() {
        // Create a larger ocean floor
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x553311, // Sandy brown
            transparent: true, 
            opacity: 0.8
        });
        
        // Add some vertex displacement for uneven terrain
        const vertices = floorGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            // Skip the edges to keep them flat
            const x = vertices[i];
            const z = vertices[i + 2];
            const distFromCenter = Math.sqrt(x * x + z * z);
            
            if (distFromCenter < 900) {
                // Add some random height variation
                vertices[i + 1] = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 2 + 
                                  Math.random() * 0.5;
            }
        }
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = this.oceanFloorLevel;
        this.scene.add(floor);
        this.underwaterObjects.push(floor);
        
        // Store ocean floor position as a global constant
        window.OCEAN_FLOOR_LEVEL = this.oceanFloorLevel;
        
        // Create a deeper trench area
        this.createTrench();
    }
    
    createTrench() {
        // Create a deep ocean trench
        const trenchGeometry = new THREE.BoxGeometry(100, 15, 300);
        const trenchMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000033, 
            transparent: true, 
            opacity: 0.9
        });
        
        const trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
        trench.position.set(-150, this.oceanFloorLevel - 7.5, 0);
        this.scene.add(trench);
        this.underwaterObjects.push(trench);
        
        // Add some rock formations around the trench
        for (let i = 0; i < 12; i++) {
            const size = Math.random() * 5 + 3;
            const x = -150 + (Math.random() * 120 - 60);
            const z = (Math.random() * 320 - 160);
            
            // Only place rocks near the edges of the trench
            if (Math.abs(x - (-150)) < 40 && Math.abs(z) < 140) {
                continue;
            }
            
            this.createRockFormation(x, z, size, 0x222233);
        }
    }
    
    createUnderwaterTerrain() {
        // Create underwater hills
        for (let i = 0; i < 8; i++) {
            const radius = Math.random() * 30 + 20;
            const height = Math.random() * 8 + 5;
            
            const hillGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 16);
            const hillMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x554422, 
                transparent: true, 
                opacity: 0.9
            });
            
            const hill = new THREE.Mesh(hillGeometry, hillMaterial);
            
            // Position randomly but away from center
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 150 + 50;
            
            hill.position.set(
                Math.cos(angle) * distance,
                this.oceanFloorLevel + height / 2 - 0.5,
                Math.sin(angle) * distance
            );
            
            this.scene.add(hill);
            this.underwaterObjects.push(hill);
        }
        
        // Create a small underwater canyon
        const canyonGeometry = new THREE.BoxGeometry(20, 5, 100);
        const canyonMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x443322, 
            transparent: true, 
            opacity: 0.9
        });
        
        const canyon = new THREE.Mesh(canyonGeometry, canyonMaterial);
        canyon.position.set(80, this.oceanFloorLevel - 2.5, 70);
        canyon.rotation.y = Math.PI / 4;
        this.scene.add(canyon);
        this.underwaterObjects.push(canyon);
    }
    
    createIslands() {
        // Create more islands with varied sizes and positions
        // Main large island
        this.createIsland(-100, -120, 25, true);
        
        // Medium islands
        this.createIsland(120, 80, 15);
        this.createIsland(-60, 100, 18);
        this.createIsland(150, -90, 16);
        
        // Small islands
        this.createIsland(50, 150, 8);
        this.createIsland(-150, 30, 10);
        this.createIsland(80, -40, 7);
        this.createIsland(-30, -80, 9);
        this.createIsland(0, 180, 12);
        
        // Create a small archipelago (cluster of tiny islands)
        const archipelagoCenter = new THREE.Vector2(180, 30);
        for (let i = 0; i < 5; i++) {
            const offset = new THREE.Vector2(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );
            const position = archipelagoCenter.clone().add(offset);
            this.createIsland(position.x, position.y, Math.random() * 3 + 4);
        }
    }
    
    createIsland(x, z, size, isMainIsland = false) {
        // Island base (above water)
        const islandGeometry = new THREE.CylinderGeometry(size, size * 1.2, 1, 32);
        const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xddbb88 }); // Sandy color
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.set(x, 0.5, z); // Slightly above water
        this.scene.add(island);
        this.aboveWaterObjects.push(island);
        
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
        const palmCount = isMainIsland ? 
            Math.floor(Math.random() * 8) + 5 : // More palms on main island
            Math.floor(Math.random() * 3) + 1;  // Fewer on smaller islands
            
        for (let i = 0; i < palmCount; i++) {
            this.createPalmTree(
                x + Math.random() * size * 0.8 - size * 0.4,
                z + Math.random() * size * 0.8 - size * 0.4,
                size * 0.15
            );
        }
        
        // Add rocks to island
        const rockCount = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < rockCount; i++) {
            const rockSize = size * 0.2;
            const rockX = x + Math.random() * size * 0.7 - size * 0.35;
            const rockZ = z + Math.random() * size * 0.7 - size * 0.35;
            
            const rockGeometry = new THREE.SphereGeometry(rockSize, 8, 8);
            const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(rockX, 0.5, rockZ);
            this.scene.add(rock);
            this.aboveWaterObjects.push(rock);
        }
        
        // If this is the main island, add a small hut
        if (isMainIsland) {
            this.createHut(x, z, size);
        }
        
        // Store island position and size for collision detection
        this.islands.push({ x, z, size });
    }
    
    createPalmTree(x, z, size) {
        // Palm trunk
        const trunkGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 5, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, size * 2.5 + 0.5, z); // Above island
        this.scene.add(trunk);
        this.aboveWaterObjects.push(trunk);
        
        // Palm leaves
        const leavesCount = Math.floor(Math.random() * 2) + 3; // 3-4 leaf clusters
        
        for (let i = 0; i < leavesCount; i++) {
            const leafGeometry = new THREE.ConeGeometry(size * 2, size * 3, 8);
            const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // Forest green
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position at top of trunk with random rotation
            leaf.position.set(x, size * 5 + 0.5, z);
            
            // Random rotation around trunk
            const angle = (i / leavesCount) * Math.PI * 2;
            leaf.rotation.x = Math.PI * 0.1; // Tilt slightly upward
            leaf.rotation.y = angle;
            leaf.rotation.z = Math.PI * 0.25; // Tilt outward
            
            this.scene.add(leaf);
            this.aboveWaterObjects.push(leaf);
        }
        
        // Add coconuts
        if (Math.random() > 0.5) {
            const coconutCount = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < coconutCount; i++) {
                const coconutGeometry = new THREE.SphereGeometry(size * 0.4, 8, 8);
                const coconutMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
                const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);
                
                // Position near top of trunk
                const coconutAngle = Math.random() * Math.PI * 2;
                const coconutRadius = size * 0.5;
                
                coconut.position.set(
                    x + Math.cos(coconutAngle) * coconutRadius,
                    size * 4.8 + 0.5,
                    z + Math.sin(coconutAngle) * coconutRadius
                );
                
                this.scene.add(coconut);
                this.aboveWaterObjects.push(coconut);
            }
        }
    }
    
    createHut(x, z, islandSize) {
        // Position the hut near the center of the island
        const hutX = x + (Math.random() - 0.5) * islandSize * 0.5;
        const hutZ = z + (Math.random() - 0.5) * islandSize * 0.5;
        const hutSize = islandSize * 0.3;
        
        // Hut base (cylinder)
        const baseGeometry = new THREE.CylinderGeometry(hutSize, hutSize, hutSize * 0.8, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(hutX, hutSize * 0.4 + 0.5, hutZ);
        this.scene.add(base);
        this.aboveWaterObjects.push(base);
        
        // Hut roof (cone)
        const roofGeometry = new THREE.ConeGeometry(hutSize * 1.2, hutSize, 8);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D }); // Sienna
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(hutX, hutSize * 1.3 + 0.5, hutZ);
        this.scene.add(roof);
        this.aboveWaterObjects.push(roof);
        
        // Door
        const doorGeometry = new THREE.PlaneGeometry(hutSize * 0.4, hutSize * 0.6);
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4B3621, // Dark brown
            side: THREE.DoubleSide
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        
        // Position door on the side of the hut
        const doorAngle = Math.random() * Math.PI * 2;
        door.position.set(
            hutX + Math.cos(doorAngle) * hutSize * 1.01,
            hutSize * 0.4 + 0.5,
            hutZ + Math.sin(doorAngle) * hutSize * 1.01
        );
        door.rotation.y = doorAngle + Math.PI / 2;
        
        this.scene.add(door);
        this.aboveWaterObjects.push(door);
    }
    
    createCoralReefs() {
        // Create several coral reef clusters
        const reefCount = 12;
        
        for (let r = 0; r < reefCount; r++) {
            // Position reef clusters around the map
            const angle = (r / reefCount) * Math.PI * 2;
            const distance = Math.random() * 150 + 50;
            
            const reefX = Math.cos(angle) * distance;
            const reefZ = Math.sin(angle) * distance;
            
            // Create a cluster of corals
            const coralCount = Math.floor(Math.random() * 15) + 10;
            
            for (let i = 0; i < coralCount; i++) {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetZ = (Math.random() - 0.5) * 20;
                
                this.createCoral(
                    reefX + offsetX,
                    reefZ + offsetZ,
                    Math.random() > 0.7 // 30% chance of branching coral
                );
            }
        }
    }
    
    createCoral(x, z, isBranching = false) {
        if (isBranching) {
            // Branching coral
            const branchCount = Math.floor(Math.random() * 3) + 2;
            const coralHeight = Math.random() * 3 + 2;
            const baseWidth = Math.random() * 0.5 + 0.3;
            
            // Base color - vibrant colors for coral
            const hue = Math.random() * 60 + 300; // Purple to red range
            const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
            
            // Create main trunk
            const trunkGeometry = new THREE.CylinderGeometry(baseWidth, baseWidth * 1.5, coralHeight, 8);
            const coralMaterial = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 70,
                specular: 0xffffff
            });
            
            const trunk = new THREE.Mesh(trunkGeometry, coralMaterial);
            trunk.position.set(x, this.oceanFloorLevel + coralHeight / 2, z);
            this.scene.add(trunk);
            this.underwaterObjects.push(trunk);
            
            // Add branches
            for (let i = 0; i < branchCount; i++) {
                const branchHeight = coralHeight * (0.4 + Math.random() * 0.3);
                const branchWidth = baseWidth * (0.5 + Math.random() * 0.3);
                
                const branchGeometry = new THREE.CylinderGeometry(branchWidth, branchWidth, branchHeight, 8);
                const branch = new THREE.Mesh(branchGeometry, coralMaterial);
                
                // Position branch along the trunk
                const heightPosition = Math.random() * (coralHeight * 0.6) + coralHeight * 0.2;
                const angle = (i / branchCount) * Math.PI * 2;
                const radius = baseWidth * 0.8;
                
                branch.position.set(
                    x + Math.cos(angle) * radius,
                    this.oceanFloorLevel + heightPosition,
                    z + Math.sin(angle) * radius
                );
                
                // Rotate branch outward
                branch.rotation.x = Math.random() * 0.5 + 0.2;
                branch.rotation.y = angle;
                
                this.scene.add(branch);
                this.underwaterObjects.push(branch);
            }
        } else {
            // Regular coral
            const coralGeometry = new THREE.ConeGeometry(
                Math.random() * 1.5 + 0.5, // Radius
                Math.random() * 4 + 1,     // Height
                Math.floor(Math.random() * 5) + 3 // Segments
            );
            
            // Random vibrant color
            const hue = Math.random() * 60 + 300; // Purple to red range
            const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
            
            const coralMaterial = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 70,
                specular: 0xffffff
            });
            
            const coral = new THREE.Mesh(coralGeometry, coralMaterial);
            
            coral.position.set(x, this.oceanFloorLevel + coralGeometry.parameters.height / 2, z);
            coral.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(coral);
            this.underwaterObjects.push(coral);
        }
    }
    
    createSeaweedForests() {
        // Create several seaweed forest areas
        const forestCount = 8;
        
        for (let f = 0; f < forestCount; f++) {
            // Position forests around the map
            const angle = (f / forestCount) * Math.PI * 2;
            const distance = Math.random() * 120 + 80;
            
            const forestX = Math.cos(angle) * distance;
            const forestZ = Math.sin(angle) * distance;
            
            // Create a cluster of seaweed plants
            const plantCount = Math.floor(Math.random() * 20) + 15;
            
            for (let i = 0; i < plantCount; i++) {
                const offsetX = (Math.random() - 0.5) * 30;
                const offsetZ = (Math.random() - 0.5) * 30;
                
                this.createSeaweedPlant(
                    forestX + offsetX,
                    forestZ + offsetZ
                );
            }
        }
    }
    
    createSeaweedPlant(x, z) {
        const height = Math.random() * 8 + 5;
        const segments = Math.floor(height / 1.5);
        const width = Math.random() * 0.3 + 0.2;
        
        // Create a curved seaweed plant using a series of cylinders
        let currentX = x;
        let currentZ = z;
        let currentY = this.oceanFloorLevel;
        
        // Random curve direction
        const curveX = (Math.random() - 0.5) * 0.3;
        const curveZ = (Math.random() - 0.5) * 0.3;
        
        // Random green color
        const hue = Math.random() * 30 + 100; // Green range
        const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.4);
        
        const seaweedMaterial = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            shininess: 30
        });
        
        for (let i = 0; i < segments; i++) {
            const segmentHeight = height / segments;
            const segmentGeometry = new THREE.CylinderGeometry(
                width * (1 - i / segments * 0.7), // Taper toward top
                width * (1 - (i - 1) / segments * 0.7),
                segmentHeight,
                6
            );
            
            const segment = new THREE.Mesh(segmentGeometry, seaweedMaterial);
            
            // Position segment
            segment.position.set(
                currentX,
                currentY + segmentHeight / 2,
                currentZ
            );
            
            // Add slight random rotation for natural look
            segment.rotation.x = (Math.random() - 0.5) * 0.1;
            segment.rotation.z = (Math.random() - 0.5) * 0.1;
            
            this.scene.add(segment);
            this.underwaterObjects.push(segment);
            
            // Update position for next segment
            currentY += segmentHeight;
            currentX += curveX;
            currentZ += curveZ;
        }
        
        // Add leaf at the top for some plants
        if (Math.random() > 0.5) {
            const leafGeometry = new THREE.PlaneGeometry(width * 5, width * 8);
            const leafMaterial = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(currentX, currentY - width * 2, currentZ);
            leaf.rotation.x = Math.PI / 2;
            leaf.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(leaf);
            this.underwaterObjects.push(leaf);
        }
    }
    
    createRockFormations() {
        // Create rock formations around the map
        const formationCount = 15;
        
        for (let f = 0; f < formationCount; f++) {
            // Position formations around the map
            const angle = (f / formationCount) * Math.PI * 2;
            const distance = Math.random() * 180 + 20;
            
            const formationX = Math.cos(angle) * distance;
            const formationZ = Math.sin(angle) * distance;
            
            // Create a rock formation
            const rockCount = Math.floor(Math.random() * 5) + 3;
            const formationSize = Math.random() * 5 + 3;
            
            this.createRockFormation(formationX, formationZ, formationSize);
        }
    }
    
    createRockFormation(x, z, size, color = 0x666666) {
        // Create a central large rock
        const rockGeometry = new THREE.SphereGeometry(size, 8, 8);
        rockGeometry.scale(1, 0.7, 1); // Flatten slightly
        
        const rockMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 10
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, this.oceanFloorLevel + size * 0.7 / 2, z);
        rock.rotation.y = Math.random() * Math.PI;
        
        this.scene.add(rock);
        this.underwaterObjects.push(rock);
        
        // Add smaller rocks around it
        const smallRockCount = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < smallRockCount; i++) {
            const smallSize = size * (0.3 + Math.random() * 0.4);
            const angle = (i / smallRockCount) * Math.PI * 2;
            const distance = size * (0.8 + Math.random() * 0.3);
            
            const smallRockGeometry = new THREE.SphereGeometry(smallSize, 6, 6);
            smallRockGeometry.scale(1, 0.6, 1); // Flatten slightly
            
            // Slightly vary the color
            const smallRockMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
                shininess: 10
            });
            
            const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
            
            smallRock.position.set(
                x + Math.cos(angle) * distance,
                this.oceanFloorLevel + smallSize * 0.6 / 2,
                z + Math.sin(angle) * distance
            );
            
            smallRock.rotation.y = Math.random() * Math.PI;
            smallRock.rotation.x = (Math.random() - 0.5) * 0.2;
            
            this.scene.add(smallRock);
            this.underwaterObjects.push(smallRock);
        }
    }
    
    createBubbles() {
        // Create more bubbles for the expanded environment
        const bubbleCount = 300;
        const bubbleGeometry = new THREE.BufferGeometry();
        const bubblePositions = new Float32Array(bubbleCount * 3);
        
        for (let i = 0; i < bubbleCount * 3; i += 3) {
            bubblePositions[i] = Math.random() * 400 - 200; // x
            bubblePositions[i + 1] = -Math.random() * 20 - 5; // y
            bubblePositions[i + 2] = Math.random() * 400 - 200; // z
        }
        
        bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
        const bubbleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
        this.scene.add(bubbles);
        this.underwaterObjects.push(bubbles);
    }
}

export { EnvironmentSystem };