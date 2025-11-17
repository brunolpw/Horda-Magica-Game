// Este arquivo contém a lógica para habilidades e power-ups.

// --- Variáveis de Estado de Power-ups e Habilidades ---
let shieldLayers = [];
let expBoostAuraMesh;
let expBoostTimer = 0;
let rangeIndicator;
let flamingAuraTimer = 0;
let electrifyingAuraTimer = 0;
let freezingAuraTimer = 0;
let freezingAuraMesh;
let goblinKingAuraMesh;
let smokeParticles = [];
const numSmokeParticles = 50;
let repulsionBubbleTimer = 0;
let repulsionBubbleMesh;
let clone = null;
let cloneTimer = 0;
let powerUpTimer = 0;
const activeRunes = [];

// --- Funções de Criação de Efeitos Visuais ---

function createRepulsionBubbleMesh() {
    const bubbleRadius = 4;
    const geometry = new THREE.SphereGeometry(bubbleRadius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    repulsionBubbleMesh = new THREE.Mesh(geometry, material);
    scene.add(repulsionBubbleMesh);
}

function createFreezingAuraMesh() {
    const auraRadius = 6;
    const geometry = new THREE.TorusGeometry(auraRadius, 0.1, 16, 100);
    const material = new THREE.MeshBasicMaterial({
        color: 0x87CEFA,
        transparent: true,
        opacity: 0.7
    });
    freezingAuraMesh = new THREE.Mesh(geometry, material);
    freezingAuraMesh.rotation.x = Math.PI / 2;
    scene.add(freezingAuraMesh);
}

function createFlamingAuraMesh() {
    const group = new THREE.Group();
    const particleCount = 25; // Aumentado para um efeito mais denso
    const particleGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeo, particleMat);
        particle.userData = {
            angle: Math.random() * Math.PI * 2,
            radius: 5.5 + Math.random(), // 5.5 to 6.5
            speed: 0.03 + Math.random() * 0.02,
            yOffset: (Math.random() - 0.5) * 2
        };
        group.add(particle);
    }

    // Anel delimitador
    const ringGeo = new THREE.TorusGeometry(6, 0.1, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
}

function createElectrifyingAuraMesh() {
    const group = new THREE.Group();
    const auraRadius = 6;

    // Anel delimitador
    const ringGeo = new THREE.TorusGeometry(auraRadius, 0.1, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return group;
}

function createGoblinKingAuraMesh() {
    const auraRadius = 15;
    const geometry = new THREE.TorusGeometry(auraRadius, 0.2, 16, 100);
    const material = new THREE.MeshBasicMaterial({
        color: 0x32CD32,
        transparent: true,
        opacity: 0.5
    });
    goblinKingAuraMesh = new THREE.Mesh(geometry, material);
    goblinKingAuraMesh.rotation.x = Math.PI / 2;
    goblinKingAuraMesh.visible = false;
    scene.add(goblinKingAuraMesh);
}

function createSmokeParticles() {
    const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const smokeGeometry = new THREE.PlaneGeometry(0.5, 0.5);

    for (let i = 0; i < numSmokeParticles; i++) {
        const particle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        particle.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.01, Math.random() * 0.02 + 0.01, (Math.random() - 0.5) * 0.01),
            life: Math.random() * 120
        };
        smokeParticles.push(particle);
    }
}

function createExpBoostAuraMesh() {
    const geometry = new THREE.TorusGeometry(0.7, 0.05, 16, 100);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0.8
    });
    expBoostAuraMesh = new THREE.Mesh(geometry, material);
    expBoostAuraMesh.rotation.x = Math.PI / 2;
    expBoostAuraMesh.visible = false;
    scene.add(expBoostAuraMesh);
}

function createRangeIndicator() {
    const geometry = new THREE.RingGeometry(1, 1.1, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xffc700, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    rangeIndicator = new THREE.Mesh(geometry, material);
    rangeIndicator.rotation.x = -Math.PI / 2;
    rangeIndicator.visible = false;
    scene.add(rangeIndicator);
}

// --- Funções de Lógica de Power-ups ---

function createPowerUp(type = 'potion', position = null) {
    const props = powerUpProps[type];
    if (!props) {
        console.warn("Tipo de power-up desconhecido:", type);
        return;
    }
    
    const material = new THREE.MeshLambertMaterial({ color: props.color });
    const powerUp = new THREE.Mesh(props.geometry, material);
    
    if (position) {
        powerUp.position.copy(position);
    } else {
        const x = (Math.random() * mapSize * 2) - mapSize;
        const z = (Math.random() * mapSize * 2) - mapSize;
        powerUp.position.set(x, 0, z);
    }
    
    const height = props.geometry.parameters.height || 0.5;
    powerUp.position.y = height / 2 + 0.5; // Começa um pouco mais alto
    
    powerUp.userData = { type: type, ...props };

    powerUp.userData.initialY = powerUp.position.y; // Guarda a posição Y inicial para a animação
    powerUps.push(powerUp);
    scene.add(powerUp);
    
    createPowerUpLabel(powerUp, type);
}

function spawnPowerUps() {
    powerUpTimer++;
    const timeSpawnInterval = 300; 

    const baseSpawnChance = 0.2;
    const spawnChancePerLevel = 0.1;
    const spawnChance = Math.min(0.7, baseSpawnChance + (playerLevel - 1) * spawnChancePerLevel);

    if (powerUpTimer >= timeSpawnInterval) {
        if (Math.random() < spawnChance) { 
            const powerUpTypes = Object.keys(powerUpProps);
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            createPowerUp(randomType);
        }
        powerUpTimer = 0;
    }
    
    // Aumenta o requisito de abates após a onda 10
    const requiredKills = currentWave > 10 ? 70 : 30;

    if (killsSinceLastPotion >= requiredKills) {
        spawnRandomItem();
        killsSinceLastPotion = 0;
    }
}

function spawnRandomItem(position = null) {
    const randomType = getRandomWeightedPowerUp();
    createPowerUp(randomType, position);
}

function updatePowerUps() {
    if (!player) return;
    const playerBBox = new THREE.Box3().setFromObject(player);
    
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.updateMatrixWorld();
        
        const powerUpBBox = new THREE.Box3().setFromObject(powerUp);
        const size = new THREE.Vector3();
        powerUpBBox.getSize(size);
        powerUpBBox.expandByVector(size.multiplyScalar(3.0));

        if (playerBBox.intersectsBox(powerUpBBox)) {
            const data = powerUp.userData;
            
            switch(data.type) {
                case 'potion':
                    const healValue = data.healAmount;
                    const oldHP = playerHP;
                    playerHP = Math.min(maxHP, playerHP + healValue);
                    const actualHeal = playerHP - oldHP;
                    if (actualHeal > 0) {
                        displayHealingMessage(actualHeal);
                        createFloatingText(`+${actualHeal}`, player.position.clone().setY(1.5), '#00ff00', '1.5rem');
                    }
                    break;
                case 'shield':
                    createShield(shieldLayers.length + 1);
                    break;
                case 'repulsionBubble':
                    repulsionBubbleTimer += data.duration;
                    break;
                case 'clone':
                    if (!clone) createClone();
                    cloneTimer += data.duration;
                    break;
                case 'freezingAura':
                    freezingAuraTimer += data.duration;
                    break;
                case 'flamingAura':
                    flamingAuraTimer += data.duration;
                    break;
                case 'electrifyingAura':
                    electrifyingAuraTimer += data.duration;
                    break;
                case 'expBoost':
                    expBoostTimer += data.duration;
                    break;
            }

            scene.remove(powerUp);
            removePowerUpLabel(powerUp);
            powerUps.splice(i, 1);
            updateUI();
        } else {
            // Animação de flutuação
            const time = Date.now() * 0.002;
            powerUp.position.y = powerUp.userData.initialY + Math.sin(time + i) * 0.2;
            powerUp.rotation.y += 0.01;
        }
    }
}

// --- Funções de Lógica de Habilidades ---

function createClone() {
    if (clone) {
        scene.remove(clone);
    }
    clone = createWizardModel();
    clone.position.copy(player.position);
    clone.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.5;
        }
    });
    scene.add(clone);
}

function updateClone() {
    if (cloneTimer > 0 && clone) {
        cloneTimer--; // CORREÇÃO: Decrementa o timer do clone a cada frame.
        const direction = new THREE.Vector3().subVectors(clone.position, player.position).normalize();
        const movementVector = new THREE.Vector2(direction.x, direction.z).normalize();
        const currentMovement = new THREE.Vector3(movementVector.x, 0, movementVector.y).multiplyScalar(playerSpeed * 0.8);
        const newPosition = clone.position.clone().add(currentMovement);
        
        const tempCloneBBox = new THREE.Box3();
        let collisionDetected = false;

        tempPlayer.position.copy(newPosition);
        tempPlayer.updateMatrixWorld();
        tempCloneBBox.setFromObject(tempPlayer);

        for (const obstacle of obstacles) {
            obstacle.updateMatrixWorld();
            let obstacleBBox = obstacle.userData.collisionMesh ? new THREE.Box3().setFromObject(obstacle.userData.collisionMesh) : new THREE.Box3().setFromObject(obstacle);
            if (tempCloneBBox.intersectsBox(obstacleBBox)) {
                collisionDetected = true;
                break;
            }
        }

        if (!collisionDetected) {
            clone.position.copy(newPosition);
        } else {
            const newPositionX = clone.position.clone();
            newPositionX.x += currentMovement.x;
            tempPlayer.position.copy(newPositionX);
            tempPlayer.updateMatrixWorld();
            if (!obstacles.some(o => new THREE.Box3().setFromObject(tempPlayer).intersectsBox(new THREE.Box3().setFromObject(o.userData.collisionMesh || o)))) {
                clone.position.x = newPositionX.x;
            }

            const newPositionZ = clone.position.clone();
            newPositionZ.z += currentMovement.z;
            tempPlayer.position.copy(newPositionZ);
            tempPlayer.updateMatrixWorld();
            if (!obstacles.some(o => new THREE.Box3().setFromObject(tempPlayer).intersectsBox(new THREE.Box3().setFromObject(o.userData.collisionMesh || o)))) {
                clone.position.z = newPositionZ.z;
            }
        }
        clone.position.x = Math.max(-mapSize, Math.min(mapSize, clone.position.x));
        clone.position.z = Math.max(-mapSize, Math.min(mapSize, clone.position.z));
    } else if (clone) {
        scene.remove(clone);
        clone = null;
    }
}

function triggerChainLightning(startEnemy) {
    const level = player.userData.upgrades.corrente_raios || 1;
    const configs = [[2, 5, 20], [3, 8, 30], [5, 11, 40], [7, 14, 50], [10, 17, 55]];
    const [maxJumps, jumpDistance, damage] = configs[level - 1];
    const maxJumpDistanceSq = jumpDistance * jumpDistance;
    const chain = [startEnemy];
    let currentEnemy = startEnemy;

    for (let i = 0; i < maxJumps - 1; i++) {
        let closestEnemy = null;
        let minDistanceSq = maxJumpDistanceSq;

        enemies.forEach(enemy => {
            if (!chain.includes(enemy)) {
                // Fantasmas não podem ser alvo secundário da corrente
                if (enemy.userData.type === 'ghost') {
                    return;
                }
                const distanceSq = enemy.position.distanceToSquared(currentEnemy.position);
                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            chain.push(closestEnemy);
            currentEnemy = closestEnemy;
        } else {
            break;
        }
    }

    for (let i = 0; i < chain.length; i++) {
        const enemy = chain[i];
        let finalDamage = damage;
        finalDamage *= getWeaknessMultiplier('lightning', enemy.userData.type);
        enemy.userData.hp -= finalDamage;
        createFloatingText(Math.floor(finalDamage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#fde047'); // Amarelo elétrico
        if (enemy.userData.type !== 'ghost' && enemy.userData.type !== 'lightning_elemental') {
            enemy.userData.electrifiedTimer = 120; // Aplica paralisia por 2 segundos
        }
        enemy.userData.hitTimer = 10;

        let startPoint = (i > 0) ? chain[i - 1].position.clone() : player.position.clone();
        const endPoint = enemy.position.clone();
        startPoint.y = endPoint.y = 0.5;

        const distance = startPoint.distanceTo(endPoint);
        if (distance === 0) continue;

        const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.9 });
        const lightningSegment = new THREE.Mesh(geometry, material);

        lightningSegment.position.copy(startPoint).lerp(endPoint, 0.5);
        lightningSegment.lookAt(endPoint);
        lightningSegment.rotateX(Math.PI / 2);

        scene.add(lightningSegment);
        setTimeout(() => {
            lightningSegment.material.opacity = 0;
            setTimeout(() => scene.remove(lightningSegment), 100);
        }, 100);
    }
}

function createShield(layerIndex) {
    const numSpheres = 10;
    const baseRadius = 3.0;
    const radiusIncrement = 1.0;
    const radius = baseRadius + (layerIndex - 1) * radiusIncrement;

    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x00D7FE, emissive: 0x00D7FE, emissiveIntensity: 1 });
    
    const newLayer = { spheres: [], radius: radius, angleOffset: Math.random() * Math.PI * 2 };

    for (let i = 0; i < numSpheres; i++) {
        const sphere = new THREE.Mesh(geometry, material);
        newLayer.spheres.push(sphere);
        scene.add(sphere);
    }
    shieldLayers.push(newLayer);
}

function updateShield() {
    if (shieldLayers.length === 0) return;

    const time = Date.now() * 0.001;

    for (let l = shieldLayers.length - 1; l >= 0; l--) {
        const layer = shieldLayers[l];
        if (layer.spheres.length === 0) {
            shieldLayers.splice(l, 1);
            continue;
        }

        const numSpheres = layer.spheres.length;

        for (let i = numSpheres - 1; i >= 0; i--) {
            const sphere = layer.spheres[i];
            const angle = (time * (l % 2 === 0 ? 1 : -1)) + layer.angleOffset + (i * (Math.PI * 2 / numSpheres));
            sphere.position.x = player.position.x + Math.cos(angle) * layer.radius;
            sphere.position.z = player.position.z + Math.sin(angle) * layer.radius;
            sphere.position.y = 0.5;
            sphere.updateMatrixWorld();

            const sphereBBoxForProjectiles = new THREE.Box3().setFromObject(sphere);
            for (let p_idx = projectiles.length - 1; p_idx >= 0; p_idx--) {
                const proj = projectiles[p_idx];
                const projData = proj.userData;

                if (projData.hasBeenReflected === null) {
                    const projBBox = new THREE.Box3().setFromObject(proj);
                    if (sphereBBoxForProjectiles.intersectsBox(projBBox)) {
                        const reflectionVector = new THREE.Vector3().subVectors(proj.position, sphere.position).normalize();
                        projData.direction.copy(reflectionVector);
                        projData.type = 'weak';
                        projData.damage = 15;
                        projData.speed *= 1.2;
                        projData.hasBeenReflected = true;
                        proj.material.color.setHex(0x00D7FE);
                    }
                }
            }

            const sphereBBox = new THREE.Box3().setFromObject(sphere);
            let hitEnemy = null;

            for (const enemy of enemies) {
                const enemyBBox = new THREE.Box3().setFromObject(enemy);
                if (sphereBBox.intersectsBox(enemyBBox)) {
                    enemy.userData.hp -= projectileProps.weak.damage;
                    createFloatingText(projectileProps.weak.damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), 'white');
                    enemy.userData.hitTimer = 10;
                    hitEnemy = enemy;
                    break;
                }
            }

            if (hitEnemy) {
                scene.remove(sphere);
                layer.spheres.splice(i, 1);
                updateUI();
            }
        }
    }
}

function removeShield() {
    if (shieldLayers.length > 0) {
        shieldLayers.forEach(layer => {
            layer.spheres.forEach(sphere => scene.remove(sphere));
        });
        shieldLayers = [];
    }
}

function createBossShield(charges) {
    const numSpheres = charges;
    const radius = 3.0;
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x8A2BE2, emissive: 0x8A2BE2, emissiveIntensity: 1 });
    const newLayer = { spheres: [], radius: radius, angleOffset: 0 };

    for (let i = 0; i < numSpheres; i++) {
        const sphere = new THREE.Mesh(geometry, material);
        newLayer.spheres.push(sphere);
        scene.add(sphere);
    }
    shieldLayers.push(newLayer);
}

function triggerRockFall(targetPosition) {
    const fallRadius = 6;
    const damage = 15;

    const targetGeometry = new THREE.RingGeometry(fallRadius - 0.5, fallRadius, 32);
    const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
    targetMarker.position.copy(targetPosition);
    targetMarker.position.y = 0.1;
    targetMarker.rotation.x = -Math.PI / 2;
    scene.add(targetMarker);

    setTimeout(() => {
        if (player.position.distanceToSquared(targetPosition) < fallRadius * fallRadius) {
            damagePlayer(damage);
            createFloatingText(damage, player.position.clone().setY(1.5), '#ff4500', '1.5rem');
        }
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        rock.position.copy(targetPosition); rock.position.y = 0.5; scene.add(rock);
        scene.remove(targetMarker);
        setTimeout(() => scene.remove(rock), 200);
    }, 1000);
}

function triggerJunkLaunch(position, isEnraged) {
    const bombCount = isEnraged ? 5 : 3;
    for (let i = 0; i < bombCount; i++) {
        setTimeout(() => {
            const targetPos = player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 15, 0, (Math.random() - 0.5) * 15));
            
            // Efeito visual da bomba sendo lançada
            const bombGeo = new THREE.SphereGeometry(0.4, 6, 6);
            const bombMat = new THREE.MeshLambertMaterial({ color: 0x594534 });
            const bomb = new THREE.Mesh(bombGeo, bombMat);
            bomb.position.copy(position);
            scene.add(bomb);

            // Animação simples de arco
            const duration = 60; // 1 segundo
            for (let t = 0; t < duration; t++) {
                setTimeout(() => {
                    if (!bomb.parent) return;
                    const progress = t / duration;
                    bomb.position.lerp(targetPos, 1 / (duration - t + 1));
                    bomb.position.y = Math.sin(progress * Math.PI) * 3; // Arco
                    if (t === duration - 1) {
                        scene.remove(bomb);
                        createScrapHazard(targetPos);
                    }
                }, t * (1000 / 60));
            }
        }, i * 200); // Lança as bombas em sequência
    }
}

function triggerIcePrison() {
    const numWalls = 16;
    const radius = 7;
    for (let i = 0; i < numWalls; i++) {
        const angle = (i / numWalls) * Math.PI * 2;
        const x = player.position.x + Math.cos(angle) * radius;
        const z = player.position.z + Math.sin(angle) * radius;
        
        const wall = createWall(new THREE.Vector3(x, 0, z), 0.8, 3.0);
        wall.material.color.setHex(0xADD8E6); // Cor de gelo
        wall.lookAt(player.position);
        
        setTimeout(() => { if (wall.parent) scene.remove(wall); obstacles.splice(obstacles.indexOf(wall), 1); }, 10000);
    }
}

function triggerBonePrison() {
    const numWalls = 12;
    const radius = 5;
    for (let i = 0; i < numWalls; i++) {
        const angle = (i / numWalls) * Math.PI * 2;
        const x = player.position.x + Math.cos(angle) * radius;
        const z = player.position.z + Math.sin(angle) * radius;
        
        const wall = createWall(new THREE.Vector3(x, 0, z), 0.5, 2.5);
        wall.material.color.setHex(0xf0e68c);
        
        setTimeout(() => {
            scene.remove(wall);
            obstacles.splice(obstacles.indexOf(wall), 1);
        }, 8000);
    }
}

function triggerEarthquakeVisual(position, maxRadius) {
    const geometry = new THREE.RingGeometry(0.1, 1, 64);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const ring = new THREE.Mesh(geometry, material);

    ring.position.copy(position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    let scale = 1;
    const expansionInterval = setInterval(() => {
        scale += 1;
        ring.scale.set(scale, scale, scale);

        if (scale > 15 && scale <= 20) {
            ring.material.color.setHex(0xff8c00);
        } else if (scale > 20) {
            ring.material.color.setHex(0xffd700);
        }

        if (scale >= maxRadius) {
            clearInterval(expansionInterval);
            scene.remove(ring);
        }
    }, 20);
}

function triggerTeleport(elemental) {
    elemental.userData.isTeleporting = true;

    // Animação de desaparecimento
    let scale = 1.0;
    const shrinkInterval = setInterval(() => {
        scale -= 0.1;
        if (scale <= 0) {
            clearInterval(shrinkInterval);
            
            // Lógica do teleporte
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 5; // Reaparece entre 5 e 10 unidades do jogador
            const newX = player.position.x + Math.cos(angle) * distance;
            const newZ = player.position.z + Math.sin(angle) * distance;
            elemental.position.set(newX, 0, newZ);

            // Animação de reaparecimento
            const growInterval = setInterval(() => {
                scale += 0.1;
                if (scale >= 1.0) {
                    clearInterval(growInterval);
                    elemental.scale.set(1, 1, 1);
                    elemental.userData.isTeleporting = false;

                    // Dispara projéteis ao reaparecer
                    const numProjectiles = 3 + Math.floor(Math.random() * 3); // 3 a 5 projéteis
                    for (let i = 0; i < numProjectiles; i++) {
                        const projAngle = Math.random() * Math.PI * 2;
                        const direction = new THREE.Vector3(Math.cos(projAngle), 0, Math.sin(projAngle));
                        createProjectile('weak', direction, elemental.position);
                    }
                } else { elemental.scale.set(scale, scale, scale); }
            }, 15);
        } else { elemental.scale.set(scale, scale, scale); }
    }, 15);
}

function triggerIceShatter(position) {
    const shatterRadius = 8;
    // Efeito visual da explosão de gelo
    triggerRuneExplosionVisual(position, 'runa_gelo');

    // Aplica lentidão ao jogador se estiver perto
    if (player.position.distanceToSquared(position) < shatterRadius * shatterRadius) {
        player.userData.slowTimer = 300; // 5 segundos de lentidão
        const slowIndicator = document.createElement('div');
        slowIndicator.className = 'floating-text';
        slowIndicator.textContent = 'Lento!';
        slowIndicator.style.color = '#87CEFA';
        slowIndicator.style.fontSize = '1.5rem';
        document.getElementById('floating-text-container').appendChild(slowIndicator);
        setTimeout(() => slowIndicator.remove(), 2000);
    }
}

function triggerEruption(position) {
    const numWaves = 5;
    for (let i = 0; i < numWaves; i++) {
        const angle = (i / numWaves) * Math.PI * 2 + Math.random() * 0.2;
        const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

        const waveGeo = new THREE.BoxGeometry(10, 0.5, 1);
        const waveMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.8 });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.copy(position);
        wave.lookAt(position.clone().add(direction));

        scene.add(wave);

        let distance = 0;
        const interval = setInterval(() => {
            distance += 0.5;
            wave.position.addScaledVector(direction, 0.5);
            if (new THREE.Box3().setFromObject(wave).intersectsBox(new THREE.Box3().setFromObject(player))) {
                damagePlayer(20);
            }
            if (distance > mapSize) {
                clearInterval(interval);
                scene.remove(wave);
            }
        }, 20);
    }
}

function triggerMeteorShower(count) {
    for (let i = 0; i < count; i++) {
        const targetPos = player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20));
        triggerRockFall(targetPos); // Reutiliza a lógica do rockfall com tema de meteoro
    }
}

function triggerOverload(position) {
    const numProjectiles = 12;
    for (let i = 0; i < numProjectiles; i++) {
        const angle = (i / numProjectiles) * Math.PI * 2;
        const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const proj = createProjectile('weak', direction, position);
        if(proj) proj.material.color.setHex(0xfde047);
    }
}

function triggerEchoSummon() {
    const echoType = ['magma', 'glacial', 'storm'][Math.floor(Math.random() * 3)];
    const position = new THREE.Vector3((Math.random() - 0.5) * (mapSize * 1.5), 0, (Math.random() - 0.5) * (mapSize * 1.5));

    let echoModel;
    let action;

    switch (echoType) {
        case 'magma':
            echoModel = createMagmaColossusModel();
            action = () => triggerEruption(position);
            break;
        case 'glacial':
            echoModel = createGlacialMatriarchModel();
            action = () => triggerIcePrison();
            break;
        case 'storm':
            echoModel = createStormSovereignModel();
            action = () => triggerEchoLightningWalls();
            break;
    }

    // Torna o modelo fantasmagórico
    echoModel.traverse(child => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.4;
        }
    });

    echoModel.position.copy(position);
    scene.add(echoModel);

    // O eco aparece, ataca e desaparece
    setTimeout(() => {
        action();
        setTimeout(() => {
            scene.remove(echoModel);
        }, 2000); // O modelo do eco desaparece 2s após o ataque
    }, 1500); // O ataque acontece 1.5s após o eco aparecer
}

function triggerEchoLightningWalls() {
    const echoConduits = [];
    for (let i = 0; i < 3; i++) {
        const conduit = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({visible: false}));
        conduit.position.set((Math.random() - 0.5) * mapSize, 1.5, (Math.random() - 0.5) * mapSize);
        echoConduits.push(conduit);
    }
    // Usa a mesma lógica do chefe, mas com objetos temporários
    updateConduitBeams(echoConduits);
    setTimeout(() => updateConduitBeams([]), 5000); // Os raios desaparecem após 5s
}

function createScrapHazard(position) {
    const hazardType = ['oil', 'smoke'][Math.floor(Math.random() * 2)]; // Mola será implementada depois
    let hazardMesh;

    if (hazardType === 'oil') {
        const oilGeo = new THREE.CircleGeometry(2.5, 16);
        const oilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        hazardMesh = new THREE.Mesh(oilGeo, oilMat);
        hazardMesh.rotation.x = -Math.PI / 2;
    } else { // smoke
        const smokeGeo = new THREE.SphereGeometry(6, 16, 16); // Aumentado o raio para 6
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x808080, transparent: true, opacity: 0.4 });
        hazardMesh = new THREE.Mesh(smokeGeo, smokeMat);
    }

    hazardMesh.position.copy(position);
    hazardMesh.position.y = 0.1;
    scene.add(hazardMesh);

    traps.push({
        mesh: hazardMesh,
        type: hazardType,
        life: 900 // Dura 15 segundos
    });
}

function triggerElementalSummon(position) {
    const elementals = ['fire_elemental', 'ice_elemental', 'lightning_elemental'];
    const typeToSummon = elementals[Math.floor(Math.random() * elementals.length)];

    const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
    const spawnPosition = position.clone().add(offset);

    createEnemy(typeToSummon, spawnPosition, true);
}

function triggerRuneExplosionVisual(position, type) {
    const numParticles = 12;
    let particleColor;

    switch (type) {
        case 'runa_fogo':
            particleColor = 0xff4500;
            const fireRingGeo = new THREE.RingGeometry(0.1, 1, 64);
            const fireRingMat = new THREE.MeshBasicMaterial({ color: particleColor, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
            const fireRing = new THREE.Mesh(fireRingGeo, fireRingMat);
            fireRing.position.copy(position);
            fireRing.position.y = 0.1;
            fireRing.rotation.x = -Math.PI / 2;
            scene.add(fireRing);

            let scale = 1;
            const expansionInterval = setInterval(() => {
                scale += 1.5;
                fireRing.scale.set(scale, scale, scale);
                fireRing.material.opacity -= 0.05;
                if (fireRing.material.opacity <= 0) {
                    clearInterval(expansionInterval);
                    scene.remove(fireRing);
                }
            }, 15);
            break;

        case 'runa_gelo':
            particleColor = 0x87CEFA;
            const iceGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
            for (let i = 0; i < numParticles; i++) {
                const iceMat = new THREE.MeshBasicMaterial({ color: particleColor, transparent: true });
                const shard = new THREE.Mesh(iceGeo, iceMat);
                shard.position.copy(position);
                shard.position.y = 0.4;
                const angle = (i / numParticles) * Math.PI * 2;
                const speed = 0.1 + Math.random() * 0.1;
                shard.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
                scene.add(shard);
                setTimeout(() => scene.remove(shard), 500 + Math.random() * 200);
            }
            break;

        case 'runa_raio':
            particleColor = 0xfde047;
            const lightningGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
            for (let i = 0; i < numParticles / 2; i++) {
                const lightningMat = new THREE.MeshBasicMaterial({ color: particleColor, transparent: true });
                const segment = new THREE.Mesh(lightningGeo, lightningMat);
                segment.position.copy(position);
                segment.position.y = 0.5;
                segment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                scene.add(segment);
                setTimeout(() => {
                    segment.material.opacity = 0;
                    setTimeout(() => scene.remove(segment), 100);
                }, 100 + Math.random() * 100);
            }
            break;
    }
}

// --- Lógica das Runas ---

function createRune(type, position, level) {
    const radius = [3, 4, 5, 6, 7][level - 1];
    const damage = [20, 25, 30, 35, 40][level - 1];
    const activationTime = level <= 3 ? 30 : 60; // 0.5s para Nv 1-3, 1s para Nv 4-5
    let statusEffect, statusTimer;

    let runeColor;
    switch (type) {
        case 'runa_fogo':
            statusEffect = 'burnTimer';
            statusTimer = 300; // 5s
            runeColor = 0xff4500;
            break;
        case 'runa_gelo':
            statusEffect = 'freezeLingerTimer';
            statusTimer = 300; // 5s
            runeColor = 0x87CEFA;
            break;
        case 'runa_raio':
            statusEffect = 'electrifiedTimer';
            statusTimer = 300; // 5s
            runeColor = 0xfde047;
            break;
    }

    const runeGeometry = new THREE.CircleGeometry(radius, 64);
    const runeMaterial = new THREE.MeshBasicMaterial({ color: runeColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const runeMesh = new THREE.Mesh(runeGeometry, runeMaterial);
    runeMesh.position.copy(position);
    runeMesh.position.y = 0.02;
    runeMesh.rotation.x = -Math.PI / 2;
    scene.add(runeMesh);

    const rune = {
        type: type,
        position: position,
        radius: radius,
        damage: damage,
        statusEffect: statusEffect,
        statusTimer: statusTimer,
        activationTime: activationTime,
        activationTimer: -1, // Inicia inativo
        mesh: runeMesh // Guarda a referência do modelo 3D
    };

    activeRunes.push(rune);
}

function updateRunes() {
    for (let i = activeRunes.length - 1; i >= 0; i--) {
        const rune = activeRunes[i];

        // Se a runa ainda não foi ativada, checa por inimigos
        if (rune.activationTimer < 0) {
            let triggered = false;
            for (const enemy of enemies) {
                // Fantasmas não ativam runas
                if (enemy.userData.type === 'ghost') continue;

                if (enemy.position.distanceToSquared(rune.position) < rune.radius * rune.radius) {
                    triggered = true;
                    rune.activationTimer = rune.activationTime;
                    // Efeito visual de ativação
                    rune.mesh.material.opacity = 1.0;
                    rune.mesh.scale.set(1.2, 1.2, 1.2);
                    break;
                }
            }
        } else {
            // Se a runa foi ativada, conta o tempo para explodir
            rune.activationTimer--;
            if (rune.activationTimer <= 0) {
                // Explode!
                triggerRuneExplosionVisual(rune.position, rune.type);
                triggerCameraShake(0.6, 30);
                const radiusSq = rune.radius * rune.radius;

                enemies.forEach(enemy => {
                    if (enemy.position.distanceToSquared(rune.position) <= radiusSq) {
                        let finalDamage = rune.damage;
                        let damageElement = '', damageColor = '#ff8c00';
                        if (rune.type === 'runa_fogo') { damageElement = 'fire'; damageColor = '#ff4500'; }
                        else if (rune.type === 'runa_gelo') { damageElement = 'ice'; damageColor = '#87CEFA'; }
                        else if (rune.type === 'runa_raio') { damageElement = 'lightning'; damageColor = '#fde047'; }

                        finalDamage *= getWeaknessMultiplier(damageElement, enemy.userData.type);

                        enemy.userData.hp -= finalDamage;
                        createFloatingText(
                            Math.floor(finalDamage), 
                            enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), 
                            damageColor);
                        enemy.userData.hitTimer = 10;

                        // Aplica status (fantasmas são imunes a todos os status de runas)
                        if (enemy.userData.type !== 'ghost' && enemy.userData.type !== 'fire_elemental' && enemy.userData.type !== 'ice_elemental' && enemy.userData.type !== 'lightning_elemental') {
                            enemy.userData[rune.statusEffect] = rune.statusTimer;
                        }
                    }
                });

                // Remove a runa da lista
                scene.remove(rune.mesh);
                activeRunes.splice(i, 1);
            }
        }
    }
}

function getRandomWeightedPowerUp() {
    const weights = {
        'potion': 45,
        'shield': 10,
        'repulsionBubble': 15,
        'clone': 3,
        'freezingAura': 7,
        'flamingAura': 7,
        'electrifyingAura': 7,
        'expBoost': 7
    };

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const type in weights) {
        if (random < weights[type]) {
            return type;
        }
        random -= weights[type];
    }
}