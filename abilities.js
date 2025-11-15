// Este arquivo contém a lógica para habilidades e power-ups.

// --- Variáveis de Estado de Power-ups e Habilidades ---
let tripleShotTimer = 0;
let shieldLayers = [];
let expBoostAuraMesh;
let expBoostTimer = 0;
let rangeIndicator;
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
    powerUp.position.y = height / 2;
    
    powerUp.userData = { type: type, ...props };

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
    
    if (killsSinceLastPotion >= killsPerItemSpawn) {
        spawnRandomItem();
        killsSinceLastPotion = 0;
    }
}

function spawnRandomItem(position = null) {
    const powerUpTypes = Object.keys(powerUpProps);
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
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
                case 'tripleShot':
                    const duration = playerLevel < 4 ? 1800 : 3600;
                    tripleShotTimer += duration;
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
                case 'expBoost':
                    expBoostTimer += data.duration;
                    break;
            }

            scene.remove(powerUp);
            removePowerUpLabel(powerUp);
            powerUps.splice(i, 1);
            updateUI();
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
        enemy.userData.hp -= damage;
        createFloatingText(damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#fde047');
        enemy.userData.electrifiedTimer = 300;
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
    const fallRadius = 7;
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