// Este arquivo contém a lógica para projéteis, incluindo criação, movimento e colisão.

const projectiles = [];

function createProjectile(type, direction, startPosition) {
    let props, geometry, material, isExplosive = false, explosionRadius = 0, explosionDamage = 0;

    if (type === 'explosion') {
        geometry = new THREE.SphereGeometry(0.3, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: 0x9333ea });
        props = { damage: 0, speed: 0.25 };
        isExplosive = true;
    } else if (type === 'ethereal_fire') {
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        material = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        props = { damage: 0, speed: 0.2 }; // Dano definido na chamada, velocidade moderada
        isExplosive = false;
    } else if (type === 'nova') {
        geometry = new THREE.SphereGeometry(0.2, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: 0xFF00FF });
        props = { damage: 0, speed: 0.125 };
        isExplosive = false;
    } else if (type === 'necro_bolt' || type === 'arrow' || type === 'weak' || type === 'strong') {
        props = projectileProps[type];
        if (!props) {
            console.error("Tipo de projétil desconhecido:", type);
            return;
        }
        geometry = (type === 'arrow') ? new THREE.CylinderGeometry(props.size, props.size, 1.0, 4) : new THREE.SphereGeometry(props.size, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: props.color });
    } else {
        console.error("Tipo de projétil desconhecido:", type);
        return;
    }
    
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(startPosition);
    projectile.position.y = 0.5; 

    projectile.userData = {
        type: type,
        damage: props.damage,
        speed: props.speed,
        direction: direction.normalize(),
        isExplosive: isExplosive,
        explosionRadius: explosionRadius,
        explosionDamage: explosionDamage,
        isHoming: false,
        target: null,
        hasBeenReflected: (type === 'necro_bolt' || type === 'arrow') ? null : true
    };

    projectiles.push(projectile);
    scene.add(projectile);
}

function triggerBigExplosion(position, radius, damage, level) {
    const flashGeometry = new THREE.SphereGeometry(radius * 0.5, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    flash.position.y = 0.5;
    scene.add(flash);
    
    let scale = 1.0;
    const interval = setInterval(() => {
        scale += 0.8;
        flash.scale.set(scale, scale, scale);
        flash.material.opacity -= 0.1;
        if (flash.material.opacity <= 0) {
            clearInterval(interval);
            scene.remove(flash);
        }
    }, 30);

    const radiusSq = radius * radius;
    enemies.forEach(enemy => {
        if (enemy.position.distanceToSquared(position) <= radiusSq) {
            enemy.userData.hp -= damage;
            createFloatingText(damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#ff4500');
            enemy.userData.hitTimer = 10;
        }
    });

    const spawnShards = level && level >= 4;
    if (spawnShards) {
        const numShards = level === 4 ? 3 : 5;
        for (let i = 0; i < numShards; i++) {
            const shardDirection = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            createProjectile('explosion', shardDirection, position);
            const shard = projectiles[projectiles.length - 1];
            shard.userData.explosionRadius = radius / 2;
            shard.userData.explosionDamage = damage / 2;
            shard.userData.explosionLevel = 0;
        }
    }
}

function updateProjectiles() {
    const tempBBox = new THREE.Box3();

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const projData = projectile.userData;
        
        let hit = false;

        if (repulsionBubbleTimer > 0 && projData.hasBeenReflected === null) {
            const distanceToPlayerSq = projectile.position.distanceToSquared(player.position);
            const repulsionRadius = 4;
            if (distanceToPlayerSq < repulsionRadius * repulsionRadius) {
                const reflectionVector = new THREE.Vector3().subVectors(projectile.position, player.position).normalize();
                projData.direction.copy(reflectionVector);
                projData.type = 'weak';
                projData.damage = 20;
                projData.speed *= 1.5;
                projData.hasBeenReflected = true;
                projectile.material.color.setHex(0x00D7FE);
                continue;
            }
        }

        projectile.position.addScaledVector(projData.direction, projData.speed);
        projectile.updateMatrixWorld();
        tempBBox.setFromObject(projectile);

        if (projData.isHoming && projData.target && projData.target.userData.hp > 0) {
            const targetPosition = projData.target.position;
            const directionToTarget = new THREE.Vector3().subVectors(targetPosition, projectile.position).normalize();
            projData.direction.lerp(directionToTarget, 0.1);
        } else if (projData.isHoming) {
            projData.isHoming = false;
        }

        if (projData.type === 'ethereal_fire') {
            // Lógica de rotação para o míssil de fogo
            projectile.lookAt(projectile.position.clone().add(projData.direction));
            projectile.rotateX(Math.PI / 2);
        }

        if (projData.type === 'necro_bolt' || projData.type === 'arrow') {
            const playerBBox = new THREE.Box3().setFromObject(player);
            if (tempBBox.intersectsBox(playerBBox)) {
                damagePlayer(projData.damage);
                createFloatingText(projData.damage, player.position.clone().setY(1.5), '#ff0000', '1.5rem');
                scene.remove(projectile);
                projectiles.splice(i, 1);
                continue;
            }
        }

        if (projData.type !== 'necro_bolt' && projData.type !== 'arrow') { // Projéteis do jogador
            for (const enemy of enemies) {
                const enemyBBox = new THREE.Box3().setFromObject(enemy);
                if (tempBBox.intersectsBox(enemyBBox)) {
                    const damageLevel = player.userData.upgrades.increase_damage || 0;
                    let finalDamage = projData.damage;
                    if (damageLevel > 0) {
                        // +2 de dano por nível (2, 4, 6, 8, 10)
                        const bonusAmount = damageLevel * 2;
                        finalDamage += bonusAmount;
                    }

                    // Lógica do Míssil de Fogo Etéreo
                    if (projData.type === 'ethereal_fire') {
                        const enemyType = enemy.userData.type;
                        if (enemyType.includes('skeleton') || enemyType === 'ghost') {
                            finalDamage = Math.ceil(finalDamage * 1.10); // +10% de dano
                        }
                        if (enemyType !== 'ghost') {
                            enemy.userData.burnTimer = 600; // 10 segundos de queimadura
                        }
                    }

                    if (enemy.userData.isBoss && enemy.userData.soulShieldCharges > 0) {
                        enemy.userData.soulShieldCharges--;
                        removeShield();
                        if (enemy.userData.soulShieldCharges > 0) createBossShield(enemy.userData.soulShieldCharges);
                        hit = true;
                    } else if (enemy.userData.armor > 0) {
                        const armorDamage = Math.min(enemy.userData.armor, finalDamage);
                        enemy.userData.armor -= armorDamage;
                        finalDamage -= armorDamage;
                        createFloatingText(Math.floor(armorDamage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#A9A9A9');
                    }

                    if (hit || finalDamage <= 0) continue;
                    enemy.userData.hp -= finalDamage;
                    createFloatingText(Math.floor(finalDamage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), 'white');
                    enemy.userData.hitTimer = 10;

                    hit = true;
                    break;
                }
            }
        }

        if (projData.type === 'arrow') {
            projectile.lookAt(projectile.position.clone().add(projData.direction));
            projectile.rotateX(Math.PI / 2);
        }

        if (Math.abs(projectile.position.x) > mapSize + 5 || Math.abs(projectile.position.z) > mapSize + 5) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
            continue;
        }

        // Míssil de Fogo Etéreo ignora obstáculos
        if (projData.type !== 'ethereal_fire') {
            if (!hit) {
                for (const obstacle of obstacles) {
                    obstacle.updateMatrixWorld();
                    let obstacleBBox = obstacle.userData.collisionMesh ? new THREE.Box3().setFromObject(obstacle.userData.collisionMesh) : new THREE.Box3().setFromObject(obstacle);
                    if (tempBBox.intersectsBox(obstacleBBox)) {
                        hit = true;
                        break;
                    }
                }
            }
        }

        if (hit) {
            if (projData.isExplosive) {
                triggerBigExplosion(projectile.position, projData.explosionRadius, projData.explosionDamage, projData.explosionLevel);
            }
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }
}