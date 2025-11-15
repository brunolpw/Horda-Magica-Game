// Este arquivo contém as definições de todas as entidades do jogo,
// incluindo suas propriedades e funções para criar seus modelos 3D.

// --- Definições de Projéteis ---
const projectileProps = {
    weak: { damage: 10, color: 0x3d3dff, size: 0.3, speed: 0.3 },
    strong: { damage: 50, color: 0xff3d3d, size: 0.5, speed: 0.4 },
    necro_bolt: { damage: 15, color: 0x9400D3, size: 0.35, speed: 0.15 },
    arrow: { damage: 5, color: 0xCD853F, size: 0.1, speed: 0.5 }
};

// --- Definições de Power-Ups ---
const powerUpProps = {
    potion: { healAmount: 30, color: 0xff4d4d, geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8) },
    tripleShot: { color: 0x00A8FF, geometry: new THREE.TorusGeometry(0.3, 0.1, 8, 16) },
    shield: { color: 0xFFD700, geometry: new THREE.IcosahedronGeometry(0.3, 0) },
    repulsionBubble: { duration: 900, color: 0xADD8E6, geometry: new THREE.SphereGeometry(0.3, 16, 16) },
    clone: { duration: 1200, color: 0x87CEEB, geometry: new THREE.OctahedronGeometry(0.4) },
    freezingAura: { duration: 1200, color: 0x87CEFA, geometry: new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8) },
    expBoost: { duration: 3600, color: 0xFFFF00, geometry: new THREE.TorusKnotGeometry(0.3, 0.08, 50, 8) }
};

// --- Funções de Criação de Modelos de Inimigos ---

function createGoblinModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0x6be070 });
    const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.scale.y = 0.8;
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 0.7;
    head.castShadow = true;
    group.add(head);
    return group;
}

function createOrcModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0xe0a06b });
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.5);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);
    return group;
}

function createTrollModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0x6b75e0 });
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);
    const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);
    return group;
}

function createNecromancerModel() {
    const group = new THREE.Group();
    const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x3D0C02 });
    const robeGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8);
    const robe = new THREE.Mesh(robeGeometry, robeMaterial);
    robe.position.y = 0.75;
    robe.castShadow = true;
    group.add(robe);
    const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0x8A2BE2 });
    const hoodGeometry = new THREE.ConeGeometry(0.4, 0.7, 8);
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.y = 1.6;
    hood.castShadow = true;
    group.add(hood);
    return group;
}

function createGhostModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({
        color: 0xe0e0e0,
        transparent: true,
        opacity: 0.7
    });
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.6, 1.2, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);
    return group;
}

function createSkeletonModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0xf0e68c });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.3), material);
    body.position.y = 0.6;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), material);
    head.position.y = 1.2;
    group.add(head);
    return group;
}

function createSkeletonWarriorModel() {
    const group = createSkeletonModel();
    const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8), armorMaterial);
    helmet.position.y = 1.3;
    group.add(helmet);
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.25), armorMaterial);
    shoulderL.position.set(-0.3, 0.9, 0);
    group.add(shoulderL);
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.25), armorMaterial);
    shoulderR.position.set(0.3, 0.9, 0);
    group.add(shoulderR);
    return group;
}

function createSkeletonArcherModel() {
    const group = createSkeletonModel();
    const bowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32, Math.PI), bowMaterial);
    bow.position.set(-0.3, 0.8, 0.2);
    bow.rotation.y = -Math.PI / 4;
    group.add(bow);
    return group;
}

function createGoblinKingModel() {
    const group = createGoblinModel();
    group.scale.set(2.0, 2.0, 2.0);
    const darkGreenMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
    group.traverse(child => {
        if (child.isMesh) {
            child.material = darkGreenMaterial;
        }
    });
    const crownGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 1.0;
    group.add(crown);
    return group;
}

function createJuggernautTrollModel() {
    const group = createTrollModel();
    group.scale.set(1.5, 1.5, 1.5);
    const crystalMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const numCrystals = 8;
    for (let i = 0; i < numCrystals; i++) {
        const crystalGeometry = new THREE.ConeGeometry(0.2, 0.8, 4);
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5 + 0.3;
        crystal.position.set(Math.cos(angle) * radius, Math.random() * 1.2 + 0.5, Math.sin(angle) * radius);
        crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        crystal.castShadow = true;
        group.add(crystal);
    }
    return group;
}

function createArchlichModel() {
    const group = createNecromancerModel();
    const lichMaterial = new THREE.MeshLambertMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.8
    });
    group.traverse(child => {
        if (child.isMesh) {
            child.material = lichMaterial;
        }
    });
    const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const auraMaterial = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, transparent: true, opacity: 0.2, side: THREE.BackSide });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    group.add(aura);
    return group;
}

// --- Definições de Inimigos (Stats) ---
const entityProps = {
    goblin: { hp: 20, speed: 0.05, score: 7, damage: 10, name: "Goblin", modelFn: createGoblinModel, modelHeight: 0.9 },
    orc: { hp: 50, speed: 0.04, score: 15, damage: 15, name: "Orc", modelFn: createOrcModel, modelHeight: 1.35 },
    troll: { hp: 100, speed: 0.03, score: 25, damage: 25, name: "Troll", modelFn: createTrollModel, modelHeight: 2.2 },
    necromancer: { hp: 80, speed: 0.025, score: 35, damage: 10, name: "Necromante", modelFn: createNecromancerModel, modelHeight: 1.9 },
    ghost: { hp: 75, speed: 0.06, score: 30, damage: 25, name: "Fantasma", modelFn: createGhostModel, modelHeight: 1.5 },
    skeleton: { hp: 80, speed: 0.05, score: 35, damage: 25, name: "Esqueleto", modelFn: createSkeletonModel, modelHeight: 1.4 },
    skeleton_warrior: { hp: 200, speed: 0.04, score: 55, damage: 35, name: "Esqueleto Guerreiro", modelFn: createSkeletonWarriorModel, modelHeight: 1.5 },
    skeleton_archer: { hp: 45, speed: 0.05, score: 45, damage: 5, name: "Esqueleto Arqueiro", modelFn: createSkeletonArcherModel, modelHeight: 1.4 },
    goblin_king: { hp: 800, speed: 0.045, score: 500, damage: 30, name: "Rei Goblin", modelFn: createGoblinKingModel, modelHeight: 1.8 },
    juggernaut_troll: { hp: 2500, speed: 0.025, score: 1500, damage: 40, name: "Juggernaut Troll", modelFn: createJuggernautTrollModel, modelHeight: 3.3, armor: 1000 },
    archlich: { hp: 4000, speed: 0.03, score: 3000, damage: 0, name: "Arquilich", modelFn: createArchlichModel, modelHeight: 1.9 }
};