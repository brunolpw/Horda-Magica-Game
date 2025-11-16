// Este arquivo contém a lógica e o estado do jogador.

// --- Variáveis de Estado do Jogador ---
let player;
let playerName = 'Mago Anônimo';
let score = 0;
let playerHP = 100;
let maxHP = 100;
let killStats = { goblin: 0, orc: 0, troll: 0, necromancer: 0, ghost: 0, skeleton: 0, skeleton_warrior: 0, skeleton_archer: 0 };
let killsSinceLastPotion = 0;

let playerLevel = 1;
let experiencePoints = 0;
const baseExperience = 100;
let pendingLevelUps = 0;
let passiveHealTimer = 0;

let playerSpeed = 0.15;
let projectileCooldown = 0;
let baseCooldown = 30;

// NOVO: Timers para o novo sistema de habilidades
let specialGlobalCooldown = 0; // Cooldown após usar uma magia
let chargeTimer = 0; // Timer para gerar a próxima carga
const CHARGE_TIME_MAX = 1200; // 20 segundos a 60fps

// --- Definições de Habilidades (Upgrades) ---
const upgrades = {
    increase_damage: {
        type: 'attribute', icon: '💥', title: "Poder Arcano", maxLevel: 5,
        description: (level) => `Aumenta o dano do ataque básico em +${level * 2} pontos.`,
        apply: () => { /* O dano é calculado dinamicamente */ }
    },
    increase_attack_speed: {
        type: 'attribute', icon: '⚡️', title: "Celeridade", maxLevel: 5,
        description: (level) => `Aumenta a velocidade de ataque em +5%.`,
        apply: () => { baseCooldown = Math.max(5, baseCooldown * 0.95); }
    },
    increase_move_speed: {
        type: 'attribute', icon: '🏃', title: "Passos Ligeiros", maxLevel: 5,
        description: (level) => `Aumenta sua velocidade de movimento em +7%.`,
        apply: () => { playerSpeed *= 1.07; }
    },
    increase_max_hp: {
        type: 'attribute', icon: '❤️', title: "Vigor", maxLevel: 5,
        description: (level) => `Aumenta a vida máxima em +20.`,
        apply: () => { maxHP += 20; playerHP += 20; }
    },
    increase_xp_gain: {
        type: 'attribute', icon: '🎓', title: "Sede de Conhecimento", maxLevel: 5,
        description: (level) => `Aumenta o ganho de experiência em +${level * 20}%.`,
        apply: () => { /* A EXP é calculada dinamicamente */ }
    },
    auto_heal: {
        type: 'attribute', icon: '✨', title: "Regeneração", maxLevel: 5,
        description: (level) => level < 5 ? `Recupera ${level + 1} de HP a cada 5 segundos.` : `Recupera 10 de HP a cada 5 segundos.`,
        apply: () => { /* A lógica é gerenciada no loop animate */ }
    },
    missil_fogo_etereo: {
        type: 'active', icon: '🔥', title: "Míssil de Fogo Etéreo", maxLevel: 5,
        getChargeCost: () => 7,
        description: (level) => `Dispara um míssil teleguiado que atravessa paredes e queima o alvo, causando dano extra a mortos-vivos.`
    },
    explosao_energia: {
        type: 'active', icon: '🌀', title: "Explosão de Energia", maxLevel: 5, getChargeCost: () => 10,
        description: (level) => `Libera uma explosão de projéteis em todas as direções. Mais projéteis com o nível.`
    },
    corrente_raios: {
        type: 'active', icon: '⛓️', title: "Corrente de Raios", maxLevel: 5, getChargeCost: () => 8,
        description: (level) => `Eletrifica seu próximo ataque, ricocheteando e aplicando dano contínuo.`
    },
    carga_explosiva: {
        type: 'active', icon: '💣', title: "Carga Explosiva", maxLevel: 5, getChargeCost: () => 15,
        description: (level) => `Lança uma granada teleguiada que explode em área. Nv. 4+ libera fragmentos.`
    },
    runa_fogo: {
        type: 'active', icon: '♨️', title: "Runa de Fogo", maxLevel: 5, getChargeCost: () => 12,
        description: (level) => `Coloca uma armadilha de fogo invisível no chão que explode e queima inimigos.`
    },
    runa_gelo: {
        type: 'active', icon: '❄️', title: "Runa de Gelo", maxLevel: 5, getChargeCost: () => 12,
        description: (level) => `Coloca uma armadilha de gelo invisível que explode e congela inimigos.`
    },
    runa_raio: {
        type: 'active', icon: '⚡', title: "Runa de Raio", maxLevel: 5, getChargeCost: () => 12,
        description: (level) => `Coloca uma armadilha elétrica invisível que explode e eletrifica inimigos.`
    },
    lanca_de_gelo: {
        type: 'active', icon: '🧊', title: "Lança de Gelo", maxLevel: 5, getChargeCost: () => 10,
        description: (level) => `Dispara uma lança de gelo perfurante que atravessa inimigos.
Nv. 5: A lança explode no final.`
    }
};

// --- Funções de Lógica do Jogador ---

function createWizardModel() {
    const group = new THREE.Group();
    const robeGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 8);
    const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x5b3c8f });
    const robe = new THREE.Mesh(robeGeometry, robeMaterial);
    robe.position.y = 0.5;
    robe.castShadow = true;
    group.add(robe);

    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    const hatGeometry = new THREE.ConeGeometry(0.35, 0.6, 8);
    const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x3a255a });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.7;
    hat.castShadow = true;
    group.add(hat);

    return group;
}

function createPlayer() {
    player = createWizardModel();
    player.position.set(0, 0, 0);
    player.userData = { maxHP: maxHP };
    scene.add(player);

    const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 100); // Geometria de rosca para dar espessura
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    targetRing = new THREE.Mesh(ringGeometry, ringMaterial);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.y = 0.01;
    scene.add(targetRing);
}

function handlePlayerMovement() {
    let dx = 0;
    let dz = 0;

    if (keys['w'] || keys['W'] || keys['ArrowUp']) dz = -1;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) dz = 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx = -1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dz !== 0) {
        let currentSpeed = playerSpeed;
        if (player.userData.slowTimer > 0) currentSpeed *= 0.7; // Reduz a velocidade em 30%
        const movementVector = new THREE.Vector2(dx, dz).normalize();
        const currentMovement = new THREE.Vector3(movementVector.x, 0, movementVector.y).multiplyScalar(currentSpeed);
        
        const angle = Math.atan2(movementVector.x, movementVector.y); 
        player.rotation.y = angle;
        
        const newPosition = player.position.clone().add(currentMovement);
        
        const tempPlayerBBox = new THREE.Box3();
        let collisionDetected = false;
        
        tempPlayer.position.copy(newPosition);
        tempPlayer.updateMatrixWorld();
        tempPlayerBBox.setFromObject(tempPlayer);

        for (const obstacle of obstacles) {
            obstacle.updateMatrixWorld();
            let obstacleBBox;
            if (obstacle.userData.collisionMesh) {
                obstacle.userData.collisionMesh.updateWorldMatrix(true, false);
                obstacleBBox = new THREE.Box3().setFromObject(obstacle.userData.collisionMesh);
            } else {
                obstacleBBox = new THREE.Box3().setFromObject(obstacle);
            }
            
            if (tempPlayerBBox.intersectsBox(obstacleBBox)) {
                collisionDetected = true;
                break;
            }
        }

        if (!collisionDetected) {
            player.position.copy(newPosition);
            player.position.x = Math.max(-mapSize, Math.min(mapSize, player.position.x));
            player.position.z = Math.max(-mapSize, Math.min(mapSize, player.position.z));
            targetRing.position.x = player.position.x;
            targetRing.position.z = player.position.z;
        }
    }
}

function damagePlayer(amount) {
    if (isGameOver) return;

    playerHP = Math.max(0, playerHP - amount);
    triggerCameraShake(0.5, 20);

    const robe = player.children[0];
    const originalColor = robe.material.color.getHex();
    robe.material.color.setHex(0xff0000);
    setTimeout(() => {
        if (player && player.children[0] && !isGameOver) {
            player.children[0].material.color.setHex(originalColor);
        }
    }, 100);
    updateUI();
    
    if (playerHP <= 0) {
        endGame();
    }
}

function gainExperience(amount) {
    let finalAmount = amount;
    const xpGainLevel = player.userData.upgrades.increase_xp_gain || 0; // Níveis 1-5
    if (xpGainLevel > 0) {
        const bonusPercentage = xpGainLevel * 0.20; // 20%, 40%, 60%, 80%, 100%
        const bonusAmount = Math.ceil(finalAmount * bonusPercentage);
        finalAmount += bonusAmount;
    }

    if (expBoostTimer > 0) {
        finalAmount *= 2;
    }

    createFloatingText(`+${Math.floor(finalAmount)} EXP`, player.position.clone().setY(2.0), '#FFFF00', '1.2rem');
    experiencePoints += finalAmount;
    
    while (experiencePoints >= player.userData.experienceForNextLevel) {
        levelUp();
    }

    updateUI();
}

function levelUp() {
    experiencePoints -= player.userData.experienceForNextLevel;
    playerLevel++;
    pendingLevelUps++;
    document.getElementById('level-up-prompt-button').classList.remove('hidden');

    player.userData.experienceForNextLevel = Math.floor(baseExperience * Math.pow(playerLevel, 1.5));
    displayLevelUpMessage();
}

function attemptSpecialAttack() {
    const activeId = player.userData.activeAbility;
    if (!activeId) return;

    // Verifica o cooldown global e se há cargas disponíveis
    if (specialGlobalCooldown > 0 || !player.userData.abilityCharges[activeId] || player.userData.abilityCharges[activeId] <= 0) {
        return;
    }

    const level = player.userData.upgrades[activeId] || 1;
    // Gasta uma carga
    player.userData.abilityCharges[activeId]--;

    switch (activeId) {
        case 'missil_fogo_etereo': {
            const damage = [25, 35, 45, 50, 55][level - 1];
            const target = findClosestEnemies(player.position, 1, true)[0];
            
            if (!target) return;

            const direction = new THREE.Vector3().subVectors(target.position, player.position).normalize();
            createProjectile('ethereal_fire', direction, player.position);
            const proj = projectiles[projectiles.length - 1];
            proj.userData.damage = damage;
            proj.userData.isHoming = true;
            proj.userData.target = target;
            proj.userData.hasBeenReflected = 'homing'; // Não pode ser refletido
            break;
        }
        case 'explosao_energia': {
            const sphereCounts = [5, 7, 10, 15, 20];
            const damages = [5, 10, 15, 20, 25];
            const numProjectiles = sphereCounts[level - 1];
            const damage = damages[level - 1];
            const radius = 25;

            const nearbyEnemies = enemies.filter(e => e.position.distanceTo(player.position) <= radius);
            if (nearbyEnemies.length === 0) return;

            const targets = [];
            for (let i = 0; i < numProjectiles; i++) {
                targets.push(nearbyEnemies[i % nearbyEnemies.length]);
            }

            for (let i = 0; i < numProjectiles; i++) {
                setTimeout(() => {
                    if (isGameOver) return;

                    const angle = (i / numProjectiles) * Math.PI * 4;
                    const initialDirection = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                    
                    createProjectile('nova', initialDirection, player.position);
                    const proj = projectiles[projectiles.length - 1];
                    proj.userData.damage = damage;
                    proj.userData.isHoming = true;
                    proj.userData.target = targets[i];
                    proj.userData.hasBeenReflected = 'homing';
                }, i * 50);
            }
            break;
        }
        case 'corrente_raios': {
            const jumpDistance = [5, 8, 11, 14, 17][level - 1];
            let closestEnemy = null;
            let minDistanceSq = jumpDistance * jumpDistance;

            enemies.forEach(enemy => {
                const distanceSq = enemy.position.distanceToSquared(player.position);
                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestEnemy = enemy;
                }
            });

            if (closestEnemy) {
                triggerChainLightning(closestEnemy);
            } else {
                return;
            }
            break;
        }
        case 'carga_explosiva': {
            raycaster.setFromCamera(pointer, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersection = new THREE.Vector3();
            if (!raycaster.ray.intersectPlane(plane, intersection)) return;

            const target = findClosestEnemies(player.position, 1, false)[0];
            if (!target) return;

            const direction = new THREE.Vector3().subVectors(target.position, player.position).normalize();
            
            createProjectile('explosion', direction, player.position);
            
            const lastProjectile = projectiles[projectiles.length - 1];
            lastProjectile.userData.isHoming = true;
            lastProjectile.userData.target = target;
            lastProjectile.userData.hasBeenReflected = 'homing';
            lastProjectile.userData.explosionRadius = [5, 7, 8, 9, 10][level - 1];
            lastProjectile.userData.explosionDamage = [50, 60, 70, 80, 100][level - 1];
            lastProjectile.userData.explosionLevel = level;
            break;
        }
        case 'runa_fogo':
        case 'runa_gelo':
        case 'runa_raio': {
            const position = targetRing.position.clone();
            createRune(activeId, position, level);
            break;
        }
        case 'lanca_de_gelo': {
            raycaster.setFromCamera(pointer, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersection = new THREE.Vector3();
            if (!raycaster.ray.intersectPlane(plane, intersection)) return;

            const direction = new THREE.Vector3().subVectors(intersection, player.position).normalize();
            createProjectile('ice_lance', direction, player.position);

            const lance = projectiles[projectiles.length - 1];
            lance.userData.damage = [40, 60, 60, 80, 100][level - 1];
            lance.userData.maxPierce = (level < 3) ? 3 : 5;
            lance.userData.width = (level < 4) ? 0.3 : 0.5;
            lance.scale.x = lance.scale.z = (level < 4) ? 1.0 : 1.5; // Aumenta a largura visual
            lance.userData.explodes = (level === 5);

            break;
        }
    }

    // Ativa o cooldown global
    specialGlobalCooldown = 120; // 2 segundos
    updateUI();
}

function updatePassivePlayerAbilities() {
    // Lógica da habilidade de Auto-Cura
    const autoHealLevel = player.userData.upgrades.auto_heal || 0;
    if (autoHealLevel > 0) {
        passiveHealTimer++;

        const healAmount = autoHealLevel < 5 ? autoHealLevel + 1 : 10;
        const currentHealInterval = 300; // 5 segundos

        if (passiveHealTimer >= currentHealInterval) {
            const oldHP = playerHP;
            playerHP = Math.min(maxHP, playerHP + healAmount);
            if (playerHP > oldHP) {
                createFloatingText(`+${playerHP - oldHP}`, player.position.clone().setY(1.5), '#00ff00');
            }
            passiveHealTimer = 0;
        }
    }

    // Lógica dos status negativos no jogador
    if (player.userData.slowTimer > 0) player.userData.slowTimer--; // Decrementa o timer correto
    if (player.userData.burnTimer > 0) {
        player.userData.burnTimer--;
        if (player.userData.burnTimer % 60 === 0) {
            damagePlayer(2); // 2 de dano de fogo por segundo
            createFloatingText('2', player.position.clone().setY(1.5), '#ff4500');
        }
    }
    if (player.userData.electrifiedTimer > 0) {
        player.userData.electrifiedTimer--;
        if (player.userData.electrifiedTimer % 60 === 0) {
            damagePlayer(2); // 2 de dano de raio por segundo
            createFloatingText('2', player.position.clone().setY(1.5), '#fde047');
        }
    }

    // Dano de queimadura nos inimigos (movido para cá para consistência)
    enemies.forEach(enemy => {
        if (enemy.userData.burnTimer > 0 && enemy.userData.burnTimer % 120 === 0) { // Queimadura
            let damage = 10;
            damage *= getWeaknessMultiplier('fire', enemy.userData.type);
            enemy.userData.hp -= damage;
            createFloatingText(Math.floor(damage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#ff4500');
            enemy.userData.hitTimer = 5;
        }
    });
}

function getWeaknessMultiplier(damageElement, enemyType) {
    const weaknesses = {
        'fire': 'lightning_elemental', // Fogo é forte contra Raio
        'ice': 'fire_elemental',      // Gelo é forte contra Fogo
        'lightning': 'ice_elemental'  // Raio é forte contra Gelo
    };

    if (weaknesses[damageElement] === enemyType) {
        return 1.5; // 50% de dano aumentado
    }

    return 1.0; // Dano normal
}

function resetPlayerState() {
    isGameOver = false;
    score = 0;
    maxHP = 100;
    playerHP = maxHP;
    
    playerLevel = 1;
    experiencePoints = 0;
    playerSpeed = 0.15; 
    pendingLevelUps = 0;

    killStats = { goblin: 0, orc: 0, troll: 0, necromancer: 0, ghost: 0, skeleton: 0, skeleton_warrior: 0, skeleton_archer: 0 };
    killsSinceLastPotion = 0;
    
    projectileCooldown = 0;
    baseCooldown = 30;
    passiveHealTimer = 0;
    specialGlobalCooldown = 0;
    chargeTimer = CHARGE_TIME_MAX;

    if (player) scene.remove(player);
    if (targetRing) scene.remove(targetRing);
    createPlayer();
    player.userData = {
        maxHP: 100,
        upgrades: {},
        activeAbility: null,
        abilityCharges: {},
        experienceForNextLevel: baseExperience,
        slowTimer: 0,
        burnTimer: 0,
        electrifiedTimer: 0
    };
}

function equipSpell(spellId) {
    if (player.userData.activeAbility !== spellId) {
        player.userData.activeAbility = spellId;
        // Zera o timer de carga ao trocar de magia para evitar exploits
        chargeTimer = CHARGE_TIME_MAX;
        console.log(`Magia equipada: ${spellId}`);
    }
    closeSpellbook();
    updateUI();
}