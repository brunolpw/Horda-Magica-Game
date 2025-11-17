// Este arquivo contém as definições de todas as entidades do jogo,
// incluindo suas propriedades e funções para criar seus modelos 3D.

// --- Definições de Projéteis ---
const projectileProps = {
    weak: { damage: 10, color: 0x3d3dff, size: 0.3, speed: 0.3 },
    shaman_bolt: { damage: 3, color: 0x9ACD32, size: 0.25, speed: 0.2 }, // NOVO
    strong: { damage: 50, color: 0xff3d3d, size: 0.5, speed: 0.4 }, // Mantido para referência
    necro_bolt: { damage: 15, color: 0x9400D3, size: 0.35, speed: 0.15 },
    arrow: { damage: 5, color: 0xCD853F, size: 0.1, speed: 0.5 }
};

// --- Definições de Power-Ups ---
const powerUpProps = {
    potion: { healAmount: 30, color: 0xff4d4d, geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8) },
    shield: { color: 0xFFD700, geometry: new THREE.IcosahedronGeometry(0.3, 0) },
    repulsionBubble: { duration: 900, color: 0xADD8E6, geometry: new THREE.SphereGeometry(0.3, 16, 16) },
    clone: { duration: 600, color: 0x87CEEB, geometry: new THREE.OctahedronGeometry(0.4) },
    freezingAura: { duration: 1200, color: 0x87CEFA, geometry: new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8, 2, 3) },
    flamingAura: { duration: 1200, color: 0xff4500, geometry: new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8, 3, 4) },
    electrifyingAura: { duration: 1200, color: 0xFFFF00, geometry: new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8, 4, 5) },
    expBoost: { duration: 3600, color: 0xFFFF00, geometry: new THREE.TorusKnotGeometry(0.3, 0.08, 50, 8, 1, 1) }
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

function createKoboldModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Marrom
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.scale.y = 0.7;
    body.position.y = 0.2;
    body.castShadow = true;
    group.add(body);
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 0.5;
    head.castShadow = true;
    group.add(head);
    return group;
}

function createKoboldWarriorModel() {
    const group = createKoboldModel();
    const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 }); // Cinza escuro
    const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.3, 6), armorMaterial);
    helmet.position.y = 0.6;
    group.add(helmet);
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), armorMaterial);
    shield.position.set(-0.25, 0.3, 0);
    shield.rotation.y = Math.PI / 4;
    group.add(shield);
    return group;
}

function createKoboldShamanModel() {
    const group = createKoboldModel();
    const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // Verde escuro
    group.traverse(child => {
        if (child.isMesh) {
            child.material = robeMaterial;
        }
    });
    const staffMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 }); // Indigo
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4), staffMaterial);
    staff.position.set(0.2, 0.4, 0);
    group.add(staff);
    return group;
}

function createKoboldKingModel() {
    const group = createKoboldModel();
    group.scale.set(1.8, 1.8, 1.8);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // Cinza
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 4, 6), crownMaterial);
    crown.position.y = 0.8;
    crown.rotation.x = Math.PI / 2;
    group.add(crown);

    // Adiciona uma "plataforma" simples
    const platformMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), platformMat);
    platform.position.y = -0.1;
    group.add(platform);
    return group;
}

function createElementalMasterModel() {
    const group = new THREE.Group();
    const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e }); // Dark blue, almost black
    const robeGeometry = new THREE.CylinderGeometry(0.5, 0.7, 2.0, 8);
    const robe = new THREE.Mesh(robeGeometry, robeMaterial);
    robe.position.y = 1.0;
    robe.castShadow = true;
    group.add(robe);

    // Floating crystals representing the elements
    const fireCrystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xff4500 }));
    const iceCrystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0x87CEFA }));
    const lightningCrystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xfde047 }));

    fireCrystal.position.set(1.2, 1.5, 0);
    iceCrystal.position.set(-0.6, 1.5, 1.04); // Equilateral triangle
    lightningCrystal.position.set(-0.6, 1.5, -1.04);

    group.add(fireCrystal, iceCrystal, lightningCrystal);
    group.userData.crystals = [fireCrystal, iceCrystal, lightningCrystal];

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

function createFireElementalModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.IcosahedronGeometry(0.6, 1);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xff4500,
        emissive: 0xff0000,
        emissiveIntensity: 1.5
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 0.8;
    core.castShadow = true;
    group.add(core);

    const pointLight = new THREE.PointLight(0xff4500, 2, 5);
    pointLight.position.y = 0.8;
    group.add(pointLight);

    return group;
}

function createIceElementalModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.DodecahedronGeometry(0.8, 0);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.0;
    core.castShadow = true;
    group.add(core);

    const pointLight = new THREE.PointLight(0xADD8E6, 2, 8);
    pointLight.position.y = 1.0;
    group.add(pointLight);

    return group;
}

function createLightningElementalModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.OctahedronGeometry(0.7, 0);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 2.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.0;
    core.castShadow = true;
    group.add(core);

    const pointLight = new THREE.PointLight(0xFFFF00, 2, 6);
    pointLight.position.y = 1.0;
    group.add(pointLight);

    return group;
}

function createSummonerElementalModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0x2d3748, // Dark gray-blue
        emissive: 0x4a5568,
        emissiveIntensity: 1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.0;
    core.castShadow = true;
    group.add(core);

    // Orbiting elemental particles
    const fireParticle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff4500 }));
    const iceParticle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0x87CEFA }));
    const lightningParticle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xFFFF00 }));

    fireParticle.userData = { angle: 0, radius: 1.5, speed: 0.02 };
    iceParticle.userData = { angle: Math.PI * 2/3, radius: 1.5, speed: 0.02 };
    lightningParticle.userData = { angle: Math.PI * 4/3, radius: 1.5, speed: 0.02 };

    group.add(fireParticle, iceParticle, lightningParticle);
    group.userData.particles = [fireParticle, iceParticle, lightningParticle];

    return group;
}

function createMagmaColossusModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xff2000,
        emissive: 0xdd1000,
        emissiveIntensity: 2.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.8;
    core.castShadow = true;
    group.add(core);

    // Armor plates
    const armorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    for (let i = 0; i < 10; i++) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), armorMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 0.3;
        plate.position.set(Math.cos(angle) * radius, 1.8, Math.sin(angle) * radius);
        plate.lookAt(core.position);
        group.add(plate);
    }
    return group;
}

function createGlacialMatriarchModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.ConeGeometry(0.8, 2.5, 8);
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.85,
        emissive: 0x87CEFA,
        emissiveIntensity: 1.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.25;
    core.castShadow = true;
    group.add(core);

    // Partículas de gelo flutuantes
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < 15; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), particleMat);
        particle.position.set((Math.random() - 0.5) * 2, Math.random() * 2.5, (Math.random() - 0.5) * 2);
        group.add(particle);
    }

    group.userData.isBossModel = true; // Flag para identificar o modelo do chefe
    return group;
}

function createStormSovereignModel() {
    const group = new THREE.Group();
    const coreMaterial = new THREE.MeshLambertMaterial({
        color: 0xfde047,
        emissive: 0xfbbF24,
        emissiveIntensity: 2.5
    });

    // Corpo principal como uma esfera pulsante
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), coreMaterial);
    core.position.y = 1.5;
    group.add(core);

    // Partículas elétricas ao redor
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), coreMaterial);
        particle.position.set((Math.random() - 0.5) * 4, 1.5 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 4);
        group.add(particle);
    }
    return group;
}

// --- Definições de Inimigos (Stats) ---
const entityProps = {
    kobold: { hp: 10, speed: 0.065, score: 3, damage: 5, name: "Kobold", modelFn: createKoboldModel, modelHeight: 0.7 },
    kobold_warrior: { hp: 15, speed: 0.06, score: 5, damage: 7, name: "Guerreiro Kobold", modelFn: createKoboldWarriorModel, modelHeight: 0.8 },
    kobold_shaman: { hp: 5, speed: 0.05, score: 7, damage: 3, name: "Xamã Kobold", modelFn: createKoboldShamanModel, modelHeight: 0.8 },
    kobold_king: { hp: 1200, speed: 0.035, score: 800, damage: 15, name: "Rei Kobold Sucateiro", modelFn: createKoboldKingModel, modelHeight: 1.5 },
    goblin: { hp: 20, speed: 0.05, score: 7, damage: 10, name: "Goblin", modelFn: createGoblinModel, modelHeight: 0.9 },
    orc: { hp: 50, speed: 0.04, score: 15, damage: 15, name: "Orc", modelFn: createOrcModel, modelHeight: 1.35 },
    troll: { hp: 100, speed: 0.03, score: 25, damage: 25, name: "Troll", modelFn: createTrollModel, modelHeight: 2.2 },
    ghost: { hp: 75, speed: 0.06, score: 30, damage: 25, name: "Fantasma", modelFn: createGhostModel, modelHeight: 1.5 },
    skeleton: { hp: 80, speed: 0.05, score: 35, damage: 25, name: "Esqueleto", modelFn: createSkeletonModel, modelHeight: 1.4 },
    skeleton_warrior: { hp: 200, speed: 0.04, score: 55, damage: 35, name: "Esqueleto Guerreiro", modelFn: createSkeletonWarriorModel, modelHeight: 1.5 },
    skeleton_archer: { hp: 45, speed: 0.05, score: 45, damage: 5, name: "Esqueleto Arqueiro", modelFn: createSkeletonArcherModel, modelHeight: 1.4 },
    goblin_king: { hp: 800, speed: 0.045, score: 500, damage: 30, name: "Rei Goblin", modelFn: createGoblinKingModel, modelHeight: 1.8 },
    juggernaut_troll: { hp: 2500, speed: 0.025, score: 1500, damage: 40, name: "Juggernaut Troll", modelFn: createJuggernautTrollModel, modelHeight: 3.3, armor: 1000 },
    archlich: { hp: 4000, speed: 0.03, score: 3000, damage: 0, name: "Arquilich", modelFn: createArchlichModel, modelHeight: 1.9 },
    necromancer: { hp: 80, speed: 0.025, score: 35, damage: 10, name: "Necromante", modelFn: createNecromancerModel, modelHeight: 1.9 },
    fire_elemental: { hp: 250, speed: 0.055, score: 40, damage: 25, name: "Elemental de Fogo", modelFn: createFireElementalModel, modelHeight: 1.5 },
    ice_elemental: { hp: 500, speed: 0.045, score: 45, damage: 20, name: "Elemental de Gelo", modelFn: createIceElementalModel, modelHeight: 1.6 },
    lightning_elemental: { hp: 200, speed: 0.065, score: 45, damage: 15, name: "Elemental de Raio", modelFn: createLightningElementalModel, modelHeight: 1.5 },
    summoner_elemental: { hp: 150, speed: 0.025, score: 70, damage: 5, name: "Invocador Elemental", modelFn: createSummonerElementalModel, modelHeight: 1.6 },
    magma_colossus: { hp: 6000, speed: 0.02, score: 5000, damage: 50, name: "Colosso de Magma", modelFn: createMagmaColossusModel, modelHeight: 3.0 },
    glacial_matriarch: { hp: 7500, speed: 0.025, score: 7500, damage: 20, name: "Matriarca Glacial", modelFn: createGlacialMatriarchModel, modelHeight: 2.8 },
    storm_sovereign: { hp: 10000, speed: 0.04, score: 10000, damage: 30, name: "Soberano da Tempestade", modelFn: createStormSovereignModel, modelHeight: 2.5 },
    elemental_master: { hp: 20000, speed: 0.03, score: 25000, damage: 50, name: "Mestre Elemental", modelFn: createElementalMasterModel, modelHeight: 2.5 }
};