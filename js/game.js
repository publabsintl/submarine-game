// Advanced Submarine Battle Simulator
// Main game file with modular structure

// ==================== Scene Setup ====================
function initScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 100, 50); // Angled for better water highlights
    scene.add(sunLight);
    
    const ambientLight = new THREE.AmbientLight(0x00008b, 0.3); // Lower intensity
    scene.add(ambientLight);
    
    scene.fog = new THREE.FogExp2(0x00008b, 0.025);
    
    return { scene, camera, renderer, sunLight, ambientLight };
}

// ==================== Water Surface ====================
function createWaterSurface(scene) {
    // Create a more detailed water texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    ctx.fillStyle = '#001a33'; // Darker base color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Smaller grid for more detail
    ctx.strokeStyle = '#0066aa';
    ctx.lineWidth = 2;
    const gridSize = 32;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20); // Finer detail
    
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000, 64, 64);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x001a33, // Darker, richer blue
        map: texture,
        shininess: 90,
        specular: 0x666666,
        side: THREE.FrontSide
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene.add(water);
    
    // Enhanced horizon line
    const horizonGeometry = new THREE.RingGeometry(450, 470, 32); // Thicker
    const horizonMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff99, // Slight yellow tint
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    horizon.rotation.x = -Math.PI / 2;
    horizon.position.y = 1; // Higher up
    scene.add(horizon);
    
    return water;
}

// ==================== Sky Environment ====================
function createSkybox(scene) {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x99D6FF, // Brighter, cooler sky
        side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    const cloudCount = 50;
    const cloudGeometry = new THREE.SphereGeometry(5, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7 
    });
    
    const clouds = [];
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = 300 + Math.random() * 150;
        const height = 100 + Math.random() * 100;
        
        cloud.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        cloud.scale.set(
            1 + Math.random() * 2, 
            0.5 + Math.random(), 
            1 + Math.random() * 2
        );
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    return { sky, clouds };
}

// ==================== Environment Objects ====================
function createEnvironmentObjects(scene) {
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x553311, 
        transparent: true, 
        opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -25;
    scene.add(floor);
    
    const underwaterObjects = [];
    
    const rockGeometry = new THREE.SphereGeometry(2, 16, 16);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const rock1 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock1.position.set(-10, -23, -10);
    scene.add(rock1);
    underwaterObjects.push(rock1);
    
    const rock2 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock2.position.set(15, -23, 5);
    scene.add(rock2);
    underwaterObjects.push(rock2);
    
    const rock3 = new THREE.Mesh(rockGeometry, rockMaterial);
    rock3.position.set(-20, -23, 15);
    rock3.scale.set(1.5, 1, 1.5);
    scene.add(rock3);
    underwaterObjects.push(rock3);
    
    const corals = [];
    function createCoral(x, z) {
        const coralGeometry = new THREE.ConeGeometry(2, 5, 32);
        const coralMaterial = new THREE.MeshPhongMaterial({ 
            color: Math.random() > 0.5 ? 0xff6699 : 0xffaa00 
        });
        const coral = new THREE.Mesh(coralGeometry, coralMaterial);
        coral.position.set(x, -22, z);
        coral.rotation.y = Math.random() * Math.PI;
        scene.add(coral);
        corals.push(coral);
        underwaterObjects.push(coral);
    }
    
    for (let i = 0; i < 20; i++) {
        createCoral(Math.random() * 100 - 50, Math.random() * 100 - 50);
    }
    
    const bubbleCount = 100;
    const bubbleGeometry = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount * 3; i += 3) {
        bubblePositions[i] = Math.random() * 100 - 50;
        bubblePositions[i + 1] = -Math.random() * 20 - 5;
        bubblePositions[i + 2] = Math.random() * 100 - 50;
    }
    bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.6
    });
    const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
    scene.add(bubbles);
    
    const islands = [];
    function createIsland(x, z, size) {
        const islandGeometry = new THREE.CylinderGeometry(size, size * 1.2, 1, 32);
        const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xddbb88 });
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.set(x, 0.5, z);
        scene.add(island);
        islands.push(island);
        
        const underwaterGeometry = new THREE.CylinderGeometry(size * 1.2, size * 0.8, 25, 32);
        const underwaterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x553311, 
            transparent: true,
            opacity: 0.9
        });
        const underwaterPart = new THREE.Mesh(underwaterGeometry, underwaterMaterial);
        underwaterPart.position.set(x, -12, z);
        scene.add(underwaterPart);
        underwaterObjects.push(underwaterPart);
        
        const palmCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < palmCount; i++) {
            createPalmTree(
                x + Math.random() * size * 0.8 - size * 0.4,
                z + Math.random() * size * 0.8 - size * 0.4,
                size * 0.2
            );
        }
    }
    
    function createPalmTree(x, z, size) {
        const trunkGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 5, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, size * 2.5 + 0.5, z);
        scene.add(trunk);
        
        const leavesGeometry = new THREE.ConeGeometry(size * 2, size * 3, 8);
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, size * 5 + 0.5, z);
        leaves.rotation.x = Math.PI * 0.1;
        leaves.rotation.z = Math.random() * Math.PI * 2;
        scene.add(leaves);
    }
    
    createIsland(-40, -60, 10);
    createIsland(50, 30, 8);
    createIsland(-20, 40, 5);
    createIsland(70, -40, 6);
    
    return { floor, underwaterObjects, bubbles, islands };
}

// ==================== Submarine Entity ====================
function createSubmarine(scene) {
    const submarine = new THREE.Group();
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 10, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555, 
        specular: 0x333333 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    submarine.add(body);
    
    const towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const tower = new THREE.Mesh(towerGeometry, bodyMaterial);
    tower.position.set(0, 1.5, 0);
    body.add(tower);
    
    const finGeometry = new THREE.BoxGeometry(0.5, 0.5, 2);
    const fin1 = new THREE.Mesh(finGeometry, bodyMaterial);
    fin1.position.set(0, 0, 4);
    body.add(fin1);
    const fin2 = new THREE.Mesh(finGeometry, bodyMaterial);
    fin2.position.set(0, 0, -4);
    body.add(fin2);
    
    scene.add(submarine);
    submarine.position.set(0, -15, 0);
    
    const box = new THREE.Box3().setFromObject(submarine);
    const height = box.max.y - box.min.y;
    const fullySubmergedY = -height - 10;
    const halfSubmergedY = 0;
    
    return { submarine, fullySubmergedY, halfSubmergedY };
}

// ==================== Controls ====================
function setupControls(submarine, fullySubmergedY, halfSubmergedY, scene) {
    const keys = {};
    let targetY = submarine.position.y;
    
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'KeyT') targetY = halfSubmergedY;
        if (e.code === 'KeyG') targetY = fullySubmergedY;
        if (e.code === 'Space' && !keys['SpaceHeld']) {
            keys['SpaceHeld'] = true;
            shootTorpedo(scene, submarine, torpedoes);
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Space') keys['SpaceHeld'] = false;
    });
    
    return { keys, targetY, updateTargetY: (newY) => { targetY = newY; return targetY; } };
}

// Torpedo functionality
const torpedoes = [];

function shootTorpedo(scene, submarine, torpedoes) {
    const torpedoGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const torpedoMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
    torpedo.position.copy(submarine.position);
    torpedo.velocity = new THREE.Vector3(0, 0, -0.5);
    scene.add(torpedo);
    torpedoes.push(torpedo);
}

// ==================== Main Game Logic ====================
function initGame() {
    const { scene, camera, renderer } = initScene();
    const water = createWaterSurface(scene);
    const { sky, clouds } = createSkybox(scene);
    const { floor, underwaterObjects, bubbles } = createEnvironmentObjects(scene);
    const { submarine, fullySubmergedY, halfSubmergedY } = createSubmarine(scene);
    const controls = setupControls(submarine, fullySubmergedY, halfSubmergedY, scene);
    const keys = controls.keys;
    let targetY = controls.targetY;
    
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now() * 0.001;
        
        // Amplified water waves
        const vertices = water.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = Math.sin(x * 0.1 + time) * 1.0 + Math.cos(z * 0.1 + time) * 0.6;
        }
        water.geometry.attributes.position.needsUpdate = true;
        
        clouds.forEach(cloud => {
            cloud.position.x += Math.sin(time * 0.1) * 0.02;
            cloud.position.z += Math.cos(time * 0.1) * 0.02;
        });
        
        const bubblePositions = bubbles.geometry.attributes.position.array;
        for (let i = 1; i < bubblePositions.length; i += 3) {
            if (camera.position.y < 0) {
                bubblePositions[i] += 0.03;
                if (bubblePositions[i] > -5) bubblePositions[i] = -20;
            }
        }
        bubbles.geometry.attributes.position.needsUpdate = true;
        bubbles.visible = camera.position.y < 0;
        
        const speed = 0.1;
        if (keys['ArrowUp']) submarine.position.z -= speed;
        if (keys['ArrowDown']) submarine.position.z += speed;
        if (keys['ArrowLeft']) submarine.position.x -= speed;
        if (keys['ArrowRight']) submarine.position.x += speed;
        
        if (keys['KeyT']) targetY = halfSubmergedY;
        if (keys['KeyG']) targetY = fullySubmergedY;
        
        submarine.position.y += (targetY - submarine.position.y) * 0.1;
        
        torpedoes.forEach((torpedo, index) => {
            torpedo.position.add(torpedo.velocity);
            if (torpedo.position.distanceTo(submarine.position) > 50) {
                scene.remove(torpedo);
                torpedoes.splice(index, 1);
            }
        });
        
        camera.position.set(submarine.position.x, submarine.position.y + 5, submarine.position.z + 15);
        camera.lookAt(submarine.position.x, submarine.position.y, submarine.position.z);
        
        if (camera.position.y < 0) {
            scene.fog.color.setHex(0x001133);
            scene.fog.density = 0.02; // Clearer underwater view
            water.material.transparent = true;
            water.material.opacity = 0.7;
            water.material.side = THREE.DoubleSide;
            water.material.color.setHex(0x003366);
            underwaterObjects.forEach(obj => obj.visible = true);
            floor.visible = true;
        } else {
            scene.fog.color.setHex(0x99D6FF); // Match sky
            scene.fog.density = 0.002; // Subtle definition
            water.material.transparent = false;
            water.material.side = THREE.FrontSide;
            water.material.color.setHex(0x001a33);
            underwaterObjects.forEach(obj => obj.visible = false);
            floor.visible = false;
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Start the game
document.addEventListener('DOMContentLoaded', initGame);