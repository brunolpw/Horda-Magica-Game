// Este arquivo contém a lógica para a criação do mapa e seus obstáculos.

const mapSize = 40;
const obstacles = [];

function createBlendedFloor() {
    const floorSize = mapSize * 2;
    
    const dirtGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    const dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    const dirtFloor = new THREE.Mesh(dirtGeometry, dirtMaterial);
    dirtFloor.rotation.x = -Math.PI / 2;
    dirtFloor.position.y = 0;
    dirtFloor.receiveShadow = true;
    scene.add(dirtFloor);

    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    const numPatches = 300; 
    const patchSize = 3; 
    const halfFloor = mapSize;

    for (let i = 0; i < numPatches; i++) {
        const patchGeometry = new THREE.PlaneGeometry(patchSize * (0.5 + Math.random()), patchSize * (0.5 + Math.random()));
        
        const x = (Math.random() * floorSize) - halfFloor;
        const z = (Math.random() * floorSize) - halfFloor;

        const grassPatch = new THREE.Mesh(patchGeometry, grassMaterial);
        grassPatch.rotation.x = -Math.PI / 2;
        grassPatch.position.set(x, 0.01, z); 
        grassPatch.receiveShadow = true;
        scene.add(grassPatch);
    }
}

function createTree(position) {
    const group = new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    const leavesGeometry = new THREE.DodecahedronGeometry(2);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3.5;
    leaves.castShadow = true;
    group.add(leaves);

    group.position.copy(position);
    group.position.y = 0; 
    
    group.userData.isObstacle = true;
    
    const collisionGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0); 
    const collisionMesh = new THREE.Mesh(collisionGeometry, new THREE.MeshBasicMaterial({ visible: false }));
    collisionMesh.position.y = 0.5;
    group.add(collisionMesh);
    group.userData.collisionMesh = collisionMesh;

    scene.add(group);
    obstacles.push(group);
}

function createWall(position, width, depth) {
    const height = 2;
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    
    wall.position.copy(position);
    wall.position.y = height / 2;
    wall.castShadow = true;

    wall.userData.isObstacle = true;
    
    scene.add(wall);
    obstacles.push(wall);
    return wall;
}

function populateObstacles() {
    obstacles.forEach(o => scene.remove(o));
    obstacles.length = 0;

    const numTrees = 50;
    const boundary = mapSize - 2;
    for (let i = 0; i < numTrees; i++) {
        const x = (Math.random() * boundary * 2) - boundary;
        const z = (Math.random() * boundary * 2) - boundary;
        createTree(new THREE.Vector3(x, 0, z));
    }

    const numWalls = 15;
    for (let i = 0; i < numWalls; i++) {
        const x = (Math.random() * boundary * 2) - boundary;
        const z = (Math.random() * boundary * 2) - boundary;
        const width = Math.random() < 0.5 ? 5 : 1; 
        const depth = width === 1 ? 5 : 1;
        createWall(new THREE.Vector3(x, 0, z), width, depth);
    }
}