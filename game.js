        // Variáveis do Three.js
        let scene, camera, renderer;
        let raycaster, mouse;
        const pointer = new THREE.Vector2();
        
        // NOVO: Variáveis do Camera Shake
        let cameraShakeIntensity = 0;
        let cameraShakeDuration = 0;

        let isGameOver = true; // Inicia como TRUE para mostrar o menu
        let isGamePaused = false; // NOVO: Flag para pausar o jogo durante o level up
        let keys = {};
        let playerSlowTimer = 0;
        const enemies = []; const powerUps = [];
        const firePuddles = [];
        const statusParticles = [];

        // Variável temporária para checagem de colisão
        let tempPlayer; 

        // --- Funções de Inicialização ---

        function init() {
            // 1. Cena
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x334155); // Fundo escuro
            scene.fog = new THREE.Fog(0x334155, mapSize * 0.5, mapSize * 2.0); // Névoa

            // 2. Câmera (Top-Down Isométrica)
            const aspectRatio = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
            camera.position.set(10, 15, 10);
            camera.rotation.order = 'YXZ';
            camera.rotation.y = Math.PI / 4;
            camera.rotation.x = -Math.PI / 3;
            
            // 3. Renderizador
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true; // Habilita sombras
            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
            document.body.appendChild(renderer.domElement);

            // 4. Luzes e Sombras
            const ambientLight = new THREE.AmbientLight(0x404040, 3); // Luz ambiente
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Luz direcional principal
            directionalLight.position.set(20, 30, 15);
            directionalLight.target.position.set(0, 0, 0);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 1;
            directionalLight.shadow.camera.far = 100;
            directionalLight.shadow.camera.left = -mapSize * 1.5;
            directionalLight.shadow.camera.right = mapSize * 1.5;
            directionalLight.shadow.camera.top = mapSize * 1.5;
            directionalLight.shadow.camera.bottom = -mapSize * 1.5;
            scene.add(directionalLight);
            scene.add(directionalLight.target);

            createBlendedFloor(); // map.js
            raycaster = new THREE.Raycaster();
            populateObstacles(); // map.js
            setupInputs();
            tempPlayer = createWizardModel(); // player.js
            createRepulsionBubbleMesh();
            createFreezingAuraMesh();
            flamingAuraMesh = createFlamingAuraMesh(); scene.add(flamingAuraMesh);
            electrifyingAuraMesh = createElectrifyingAuraMesh(); scene.add(electrifyingAuraMesh);
            createSmokeParticles();
            createExpBoostAuraMesh();
            createRangeIndicator();
            createGoblinKingAuraMesh();
        }

        // NOVO: Função para encontrar os inimigos mais próximos (ou mais fortes)
        function findClosestEnemies(position, count, sortByStrength = false) {
            let sortedEnemies = enemies
                .map(enemy => ({
                    enemy,
                    distanceSq: enemy.position.distanceToSquared(position)
                }));

            if (sortByStrength) {
                // Ordena por HP máximo (mais forte) e depois por HP atual
                sortedEnemies.sort((a, b) => {
                    if (b.enemy.userData.maxHP !== a.enemy.userData.maxHP) return b.enemy.userData.maxHP - a.enemy.userData.maxHP;
                    return b.enemy.userData.hp - a.enemy.userData.hp;
                });
            } else {
                sortedEnemies.sort((a, b) => a.distanceSq - b.distanceSq);
            }

            return sortedEnemies.slice(0, count).map(item => item.enemy);
        }

        function setupInputs() {
            // Teclas de Movimento
            document.addEventListener('keydown', (e) => {
                keys[e.key] = true;
            });
            document.addEventListener('keyup', (e) => {
                keys[e.key] = false;
            });

            // Mira do Mouse
            document.addEventListener('mousemove', onPointerMove);
            window.addEventListener('resize', onWindowResize);
            
            // Ataque Especial com clique do mouse (botão esquerdo) - movido para setupUI
            document.addEventListener('mousedown', handleMouseClick);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function onPointerMove(event) {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        }

        function handleMouseClick(event) {
            if (event.button === 0 && !isGameOver && !isGamePaused) {
                attemptSpecialAttack();
            }
        }
        
        
        // --- Funções de Entidade e Spawning ---
        
        function createEnemy(type, position, isSummon = false) {
            const props = entityProps[type];
            const enemy = props.modelFn(); // Usa a função para criar o modelo

            enemy.position.copy(position);
            enemy.position.y = 0; // A altura é controlada dentro do modelo

            enemy.userData = {
                type: type,
                hp: props.hp,
                maxHP: props.hp,
                speed: props.speed,
                score: props.score,
                damage: props.damage,
                hitTimer: 0, // NOVO: Timer para feedback de hit
                modelHeight: props.modelHeight, // Guarda a altura para o label
                isSummon: isSummon, // NOVO: Marca se é uma invocação
                freezeLingerTimer: 0, // NOVO: Timer para o efeito de congelamento persistente
                damageCooldown: 0, // NOVO: Cooldown para o ataque do monstro
                auraDamageAccumulator: 0, // NOVO: Acumula dano da aura para feedback visual
                electrifiedTimer: 0, // NOVO: Timer para o status Eletrificado
                burnTimer: 0, // NOVO: Timer para o status Queimado
                fireTrailCooldown: 0, // NOVO: Cooldown para o rastro de fogo
                teleportCooldown: 0 // NOVO: Cooldown para o teleporte
            };

            // NOVO: Adiciona propriedades específicas para o Rei Goblin
            if (type === 'goblin_king') {
                enemy.userData.isBoss = true;
                enemy.userData.summonCooldown = 300; // Cooldown inicial de 5s
                enemy.userData.summonInterval = 900; // Invoca a cada 15 segundos
                enemy.userData.rockThrowCooldown = 0; // NOVO: Cooldown para o ataque de fuga
            }

            // NOVO: Adiciona propriedades para o Juggernaut Troll
            if (type === 'juggernaut_troll') {
                enemy.userData.isBoss = true;
                enemy.userData.armor = props.armor;
                enemy.userData.maxArmor = props.armor;
                enemy.userData.earthquakeCooldown = 600; // Cooldown de 10s
            }

            // NOVO: Adiciona propriedades para o Arquilich
            if (type === 'archlich') {
                enemy.userData.isBoss = true;
                enemy.userData.bonePrisonCooldown = 1200; // Cooldown de 20s
                enemy.userData.soulShieldCharges = 5;
                killsForSoulHarvest = 0; // Zera o contador de almas
            }

            // NOVO: Adiciona propriedades específicas para o Necromante
            if (type === 'necromancer') {
                enemy.userData.summonCooldown = Math.random() * 240; // Cooldown inicial aleatório (até 4s)
                enemy.userData.summonInterval = 480; // Invoca a cada 8 segundos
                enemy.userData.attackCooldown = 120; // Ataca a cada 2 segundos
                enemy.userData.attackTimer = Math.random() * 120; // Cooldown inicial aleatório
            }
            // NOVO: Adiciona propriedades para o Esqueleto Arqueiro
            if (type === 'skeleton_archer') {
                enemy.userData.attackCooldown = 60; // Ataca a cada 1 segundo
                enemy.userData.attackTimer = Math.random() * 60;
            }

            // NOVO: Adiciona propriedades para o Elemental de Gelo
            if (type === 'ice_elemental') {
                enemy.userData.auraRadius = 12; // Raio da aura de lentidão
                enemy.userData.shatterOnDeath = true; // Habilidade ao morrer
            }

            // NOVO: Adiciona propriedades para o Elemental de Raio
            if (type === 'lightning_elemental') {
                enemy.userData.teleportCooldown = 300; // Teleporta a cada 5s
                enemy.userData.isTeleporting = false;
            }

            // NOVO: Adiciona propriedades para o Invocador Elemental
            if (type === 'summoner_elemental') {
                enemy.userData.summonCooldown = 600; // Invoca a cada 10s
                enemy.userData.attackCooldown = 240; // Ataca a cada 4s
                enemy.userData.attackTimer = 120;
                enemy.userData.auraRadius = 10;
            }


            // NOVO: Guarda a cor original de cada parte do modelo para o feedback de hit
            enemy.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Garante que userData exista
                    child.userData.originalColor = child.material.color.getHex();
                }
            });

            enemies.push(enemy);
            scene.add(enemy);
            
            // Criação da UI 2D do inimigo
            createEnemyUI(enemy, props.name);
        }
        
        // --- Funções de Lógica do Jogo ---
        
        function updateAiming() {
            raycaster.setFromCamera(pointer, camera);

            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersection = new THREE.Vector3();
            
            raycaster.ray.intersectPlane(plane, intersection);

            if (intersection.x !== 0 && intersection.z !== 0) {
                const direction = new THREE.Vector3().subVectors(intersection, player.position);
                direction.y = 0; 
                
                targetRing.position.copy(intersection);
                targetRing.position.y = 0.01;
                
                // Ataque Automático
                // NOVO: A cadência de tiro aumenta com o nível.
                // Reduz o cooldown em 2 frames por nível, com um mínimo de 10.
                const currentCooldown = Math.max(10, baseCooldown - (playerLevel - 1) * 2);

                if (projectileCooldown <= 0) {
                    // Disparo normal
                    createProjectile('weak', direction, player.position);
                    projectileCooldown = currentCooldown;
                }
            }
        }

        function updateEnemies() {
            // CORREÇÃO: Posição do BBox do Player atualizada em checkPlayerCollisions

            // NOVO: Lógica da Aura do Rei Goblin
            let goblinKingAura = false;
            if (currentBoss && currentBoss.userData.type === 'goblin_king' && currentBoss.userData.hp > 0) {
                goblinKingAura = true;
            }
            const auraRadiusSq = 15 * 15; // Raio de 15 unidades
            const speedBoost = 1.25; // 25% mais rápido

            
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const enemyData = enemy.userData;

                // NOVO: Decrementa o cooldown de ataque do monstro
                if (enemyData.damageCooldown > 0) enemyData.damageCooldown--;

                // NOVO: Feedback de Hit (Piscar Branco)
                if (enemyData.electrifiedTimer > 0) {
                    // Efeito de piscar amarelo para Eletrificado (tem prioridade)
                    const flash = Math.abs(Math.sin(Date.now() * 0.05));
                    enemy.traverse((child) => {
                        if (child.isMesh && child.material && child.userData.originalColor) {
                            const originalColor = new THREE.Color(child.userData.originalColor);
                            const flashColor = new THREE.Color(0xFFFF00);
                            child.material.color.lerpColors(originalColor, flashColor, flash);
                        }
                    });
                } else if (enemyData.hitTimer > 0) {
                    enemy.traverse((child) => {
                        if (child.isMesh && child.material) {
                    if (!child.userData.originalColor) child.userData.originalColor = child.material.color.getHex();
                    child.material.color.setHex(0xFFFFFF);
                        }
                    });
                    enemyData.hitTimer--;
                } else {
                    // Volta à cor normal para todos os filhos do grupo
                    enemy.traverse((child) => {
                        if (child.isMesh && child.material && child.userData.originalColor) {
                            child.material.color.setHex(child.userData.originalColor);
                        }
                    });
                }
                
                // NOVO: Lógica da Bolha de Repulsão
                if (repulsionBubbleTimer > 0) {
                    const distanceToPlayer = enemy.position.distanceTo(player.position);
                    const repulsionRadius = 4; // Raio da bolha
                    if (distanceToPlayer < repulsionRadius) {
                        // Calcula a direção para empurrar o inimigo para longe
                        const pushDirection = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                        const pushSpeed = 0.1; // Força com que são empurrados
                        enemy.position.addScaledVector(pushDirection, pushSpeed);
                        continue; // Pula o resto da lógica de movimento normal
                    }
                }
            
            // CORREÇÃO: Toda a lógica abaixo foi movida para dentro do loop 'for'

            // NOVO: Define o alvo (fantasmas ignoram o clone)
            let target = player; // BUGFIX 1: Alvo padrão é o jogador
            if (clone && cloneTimer > 0 && enemyData.type !== 'ghost' && !enemyData.isBoss) {
                target = clone;
            } else {
                target = player;
            }
            const targetPos = target.position;

            // Lógica de congelamento persistente e dano por segundo
            let finalSpeed = enemyData.speed;
            if (goblinKingAura && enemyData.type === 'goblin' && !enemyData.isBoss && enemy.position.distanceToSquared(currentBoss.position) < auraRadiusSq) {
                finalSpeed *= speedBoost;
            }
            let isSlowed = false;
            // Imunidades ao congelamento
            if (enemyData.type !== 'ghost' && enemyData.type !== 'ice_elemental' && enemyData.type !== 'lightning_elemental' && !(enemyData.type === 'juggernaut_troll' && enemyData.armor > 0)) {
                const distanceToPlayer = enemy.position.distanceTo(player.position);
                const auraRadius = 6;

                if (freezingAuraTimer > 0 && distanceToPlayer < auraRadius) {
                    enemyData.freezeLingerTimer = 600; // 10 segundos
                }
                if (flamingAuraTimer > 0 && distanceToPlayer < auraRadius) {
                    if (enemyData.type !== 'fire_elemental') {
                        enemyData.burnTimer = 600; // 10 segundos
                    }
                }
                if (electrifyingAuraTimer > 0 && distanceToPlayer < auraRadius) {
                    if (enemyData.type !== 'lightning_elemental') {
                        enemyData.electrifiedTimer = 120; // 2 segundos
                    }
                }

                if (enemyData.freezeLingerTimer > 0) {
                    enemyData.freezeLingerTimer--;
                    enemyData.isFrozen = true;
                    isSlowed = true;

                    // Dano de 5 a cada 1 segundo (60 frames)
                    // Efeito de fumaça de gelo
                    if (enemyData.freezeLingerTimer > 0 && Math.random() < 0.2) {
                        const smokeGeo = new THREE.PlaneGeometry(0.4, 0.4);
                        const smokeMat = new THREE.MeshBasicMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.6 });
                        const particle = new THREE.Mesh(smokeGeo, smokeMat);
                        particle.position.copy(enemy.position).add(new THREE.Vector3(Math.random() - 0.5, Math.random() * enemyData.modelHeight, Math.random() - 0.5));
                        
                        const life = 30 + Math.random() * 30;
                        let currentLife = 0;
                        const interval = setInterval(() => {
                            currentLife++;
                            particle.position.y += 0.01;
                            particle.material.opacity = 0.6 * (1 - (currentLife / life));
                            if (currentLife >= life) {
                                clearInterval(interval);
                                scene.remove(particle);
                            }
                        }, 20);
                        scene.add(particle);
                    }

                    if (enemyData.freezeLingerTimer % 60 === 0) {
                        enemyData.hp -= 5;
                        enemyData.auraDamageAccumulator += 5;
                    }

                    // Mostra o dano acumulado a cada segundo
                    if (enemyData.auraDamageAccumulator >= 5 && enemyData.hp > 0) {
                        createFloatingText(Math.floor(enemyData.auraDamageAccumulator), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#87CEFA');
                        enemyData.auraDamageAccumulator = 0;
                    }
                }
            }
            // Se chegou aqui, não está congelado
            if (enemyData.freezeLingerTimer <= 0) {
                enemyData.isFrozen = false;
            }

            // Lógica de invocação do Necromante
            if (enemyData.type === 'necromancer') {
                enemyData.summonCooldown = Math.max(0, enemyData.summonCooldown - 1);
                
                if (enemyData.summonCooldown <= 0 && enemies.length < maxActiveEnemies) {
                    // NOVO: Invoca um tipo de esqueleto aleatório
                    const summonRoll = Math.random() * 100;
                    let summonType;
                    if (summonRoll < 50) summonType = 'skeleton';          // 50%
                    else if (summonRoll < 80) summonType = 'skeleton_archer'; // 30%
                    else summonType = 'skeleton_warrior';    // 20%

                    const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
                    const spawnPosition = enemy.position.clone().add(offset);
                    createEnemy(summonType, spawnPosition, true);
                    enemyData.summonCooldown = enemyData.summonInterval;
                }
            }

            // NOVO: Lógica do Rei Goblin
            if (enemyData.type === 'goblin_king') {
                enemyData.summonCooldown = Math.max(0, enemyData.summonCooldown - 1);
                if (enemyData.summonCooldown <= 0 && enemies.length < maxActiveEnemies) {
                    // Invoca entre 5 e 10 goblins
                    const summonCount = 5 + Math.floor(Math.random() * 6);
                    for (let j = 0; j < summonCount; j++) {
                        const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
                        const spawnPosition = enemy.position.clone().add(offset);
                        createEnemy('goblin', spawnPosition, true);
                    }
                    enemyData.summonCooldown = enemyData.summonInterval;
                }
            }

            // NOVO: Lógica do Arquilich
            if (enemyData.type === 'archlich') {
                // Colheita de Almas
                if (killsForSoulHarvest >= 5) {
                    const numWarriors = Math.floor(killsForSoulHarvest / 5);
                    for (let k = 0; k < numWarriors; k++) {
                        const offset = new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);
                        createEnemy('skeleton_warrior', enemy.position.clone().add(offset), true);
                    }
                    killsForSoulHarvest %= 5; // Mantém o resto
                }

                // Prisão de Ossos
                enemyData.bonePrisonCooldown = Math.max(0, enemyData.bonePrisonCooldown - 1);
                if (enemyData.bonePrisonCooldown <= 0) {
                    triggerBonePrison();
                    enemyData.bonePrisonCooldown = 1200; // Reseta cooldown
                }
            }

            // NOVO: Lógica do Juggernaut Troll
            if (enemyData.type === 'juggernaut_troll') {
                // Aumenta o dano conforme perde vida
                const hpPercentage = enemyData.hp / enemyData.maxHP;
                enemyData.damage = entityProps.juggernaut_troll.damage + Math.floor((1 - hpPercentage) * 20); // Adiciona até +20 de dano

                enemyData.earthquakeCooldown = Math.max(0, enemyData.earthquakeCooldown - 1);
                if (enemyData.earthquakeCooldown <= 0) {
                    // Efeito visual do terremoto
                    triggerCameraShake(0.8, 45);
                    triggerEarthquakeVisual(enemy.position, 25); // Efeito visual com raio máximo

                    // Lógica de dano em área com múltiplos raios
                    const distanceToPlayer = player.position.distanceTo(enemy.position);
                    let damageDealt = 0;

                    if (distanceToPlayer < 15) { // Raio 1: 15 unidades
                        damageDealt = 30;
                    } else if (distanceToPlayer < 20) { // Raio 2: 20 unidades
                        damageDealt = 25;
                    } else if (distanceToPlayer < 25) { // Raio 3: 25 unidades
                        damageDealt = 20;
                    }

                    if (damageDealt > 0) {
                        damagePlayer(damageDealt);
                        createFloatingText(damageDealt, player.position.clone().setY(1.5), '#ff4500', '1.5rem');
                    }
                    enemyData.earthquakeCooldown = 600; // Reseta cooldown
                }
            }

            // NOVO: Lógica do status Eletrificado
            if (enemyData.electrifiedTimer > 0 && !(enemyData.type === 'juggernaut_troll' && enemyData.armor > 0) && enemyData.type !== 'lightning_elemental') {
                enemyData.electrifiedTimer--; // Dura 2 segundos (120 frames)
                isSlowed = true; // Efeito de paralisia

                if (enemyData.electrifiedTimer % 60 === 0) { // Dano de 25 a cada 1 segundo
                    enemyData.hp -= 25;
                    if (enemyData.hp <= 0 && enemyData.isBoss) {
                        handleBossDefeat(enemy);
                    }
                    createFloatingText('25', enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#fde047');
                    enemyData.hitTimer = 5; // Pequeno feedback visual
                }
            }

            // NOVO: Lógica do status Queimado
            if (enemyData.burnTimer > 0 && enemyData.type !== 'ghost' && enemyData.type !== 'fire_elemental') {
                enemyData.burnTimer--; // Dura 10 segundos (600 frames)
                enemyData.isFleeing = true; // Ativa o status de fuga
            } else {
                enemyData.isFleeing = false; // Garante que o inimigo pare de fugir
            }

            // --- LÓGICA DE MOVIMENTO ---
            if (enemyData.isTeleporting) {
                continue; // Pula movimento se estiver se teleportando
            }
            if (isSlowed) { // Inimigos congelados ou eletrificados
                // Movimento lento ou paralisado
                const slowDirection = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const speedMultiplier = (enemyData.electrifiedTimer > 0) ? 0 : 0.5; // Paralisado se eletrificado
                enemy.position.addScaledVector(slowDirection, finalSpeed * speedMultiplier);
            } else if (enemyData.isFleeing) {
                // Lógica de Fuga
                const fleeDirection = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                enemy.position.addScaledVector(fleeDirection, finalSpeed);
            // BUGFIX 1: Comportamento de fuga específico para o Rei Goblin
            } else if (enemyData.type === 'goblin_king' && enemyData.hp / enemyData.maxHP < 0.3) {
                // Foge do jogador
                const fleeDirection = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(fleeDirection, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                // MELHORIA: Atira pedras enquanto foge
                enemyData.rockThrowCooldown = Math.max(0, enemyData.rockThrowCooldown - 1);
                if (enemyData.rockThrowCooldown <= 0) {
                    const rockTargetPosition = player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
                    triggerRockFall(rockTargetPosition);
                    enemyData.rockThrowCooldown = 240; // Atira a cada 4 segundos
                }

            } else if (enemyData.type === 'necromancer') {
                // Lógica de movimento do Necromante (kiting)
                 const distanceToPlayer = enemy.position.distanceTo(player.position);
                 const minDistance = 10; // Distância mínima que ele quer manter
                 const maxDistance = 15; // Distância máxima antes de se aproximar
                 let direction = new THREE.Vector3(0, 0, 0);
 
                 if (distanceToPlayer < minDistance) {
                     direction = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                 } else if (distanceToPlayer > maxDistance) {
                     direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                 }
 
                 if (enemyData.attackTimer > 0) {
                     enemyData.attackTimer--;
                 } else if (Math.abs(enemy.position.x) < mapSize && Math.abs(enemy.position.z) < mapSize) {
                    // Só ataca se estiver dentro do mapa
                     const attackDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                     createProjectile('necro_bolt', attackDirection, enemy.position);
                     enemyData.attackTimer = enemyData.attackCooldown;
                 }
 
                 if (direction.lengthSq() > 0) {
                     const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                     tempPlayer.position.copy(newPosition);
                     tempPlayer.updateMatrixWorld();
                     let fullEnemyBBox = new THREE.Box3().setFromObject(tempPlayer);
                     let collisionDetected = obstacles.some(o => fullEnemyBBox.intersectsBox(o.userData.collisionMesh ? new THREE.Box3().setFromObject(o.userData.collisionMesh) : new THREE.Box3().setFromObject(o)));
 
                     if (!collisionDetected) {
                         enemy.position.copy(newPosition);
                     }
                 }

            } else if (enemyData.type === 'skeleton_archer') {
                // Lógica de movimento do Arqueiro (similar ao Necromante)
                const distanceToPlayer = enemy.position.distanceTo(player.position);
                const minDistance = 15; // Distância mínima
                const maxDistance = 20; // Distância máxima
                let direction = new THREE.Vector3(0, 0, 0);

                if (distanceToPlayer < minDistance) {
                    direction = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                } else if (distanceToPlayer > maxDistance) {
                    direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                }

                if (enemyData.attackTimer > 0) {
                    enemyData.attackTimer--;
                } else if (Math.abs(enemy.position.x) < mapSize && Math.abs(enemy.position.z) < mapSize) {
                    // Só ataca se estiver dentro do mapa
                    const attackDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                    createProjectile('arrow', attackDirection, enemy.position);
                    enemyData.attackTimer = enemyData.attackCooldown;
                }

                if (direction.lengthSq() > 0) {
                    const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                    tempPlayer.position.copy(newPosition);
                    tempPlayer.updateMatrixWorld();
                    let fullEnemyBBox = new THREE.Box3().setFromObject(tempPlayer);
                    let collisionDetected = obstacles.some(o => fullEnemyBBox.intersectsBox(o.userData.collisionMesh ? new THREE.Box3().setFromObject(o.userData.collisionMesh) : new THREE.Box3().setFromObject(o)));
                    if (!collisionDetected) {
                        enemy.position.copy(newPosition);
                    }
                }
            } else if (enemyData.type === 'ghost') {
                // Lógica de movimento do Fantasma (ignora paredes)
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                enemy.position.addScaledVector(direction, finalSpeed);

            } else if (enemyData.type === 'fire_elemental') {
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                enemyData.fireTrailCooldown = Math.max(0, enemyData.fireTrailCooldown - 1);
                if (enemyData.fireTrailCooldown <= 0) {
                    createFirePuddle(enemy.position.clone());
                    enemyData.fireTrailCooldown = 45; // Deixa uma poça a cada 0.75s
                }
            } else if (enemyData.type === 'ice_elemental') {
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);
                if (enemy.position.distanceTo(player.position) < enemyData.auraRadius) {
                    playerSlowTimer = 120; // Aplica lentidão por 2 segundos
                }
            } else if (enemyData.type === 'lightning_elemental') {
                enemyData.teleportCooldown = Math.max(0, enemyData.teleportCooldown - 1);
                if (enemyData.teleportCooldown <= 0) {
                    triggerTeleport(enemy);
                    enemyData.teleportCooldown = 300; // Reseta cooldown
                } else {
                    // Movimento normal se não estiver teleportando
                    const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                    const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                    handleStandardMovement(enemy, newPosition, finalSpeed);
                }
            } else if (enemyData.type === 'summoner_elemental') {
                // Lógica de kiting
                const distanceToPlayer = enemy.position.distanceTo(player.position);
                const minDistance = 18;
                let direction = new THREE.Vector3(0, 0, 0);
                if (distanceToPlayer < minDistance) {
                    direction.subVectors(enemy.position, player.position).normalize();
                }
                if (direction.lengthSq() > 0) {
                    const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                    handleStandardMovement(enemy, newPosition, finalSpeed);
                }

                // Lógica de ataque
                enemyData.attackTimer = Math.max(0, enemyData.attackTimer - 1);
                if (enemyData.attackTimer <= 0) {
                    const attackDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                    createProjectile('necro_bolt', attackDirection, enemy.position);
                    projectiles[projectiles.length - 1].userData.damage = enemyData.damage;
                    enemyData.attackTimer = enemyData.attackCooldown;
                }

                // Lógica de invocação
                enemyData.summonCooldown = Math.max(0, enemyData.summonCooldown - 1);
                if (enemyData.summonCooldown <= 0) {
                    triggerElementalSummon(enemy.position);
                    enemyData.summonCooldown = 600;
                }
            } else {
                // Lógica de movimento padrão com colisão para outros inimigos
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);
            }
            
            // BUGFIX 2: Mantém os inimigos dentro do mapa
            if (Math.abs(enemy.position.x) > mapSize) {
                enemy.position.x = Math.sign(enemy.position.x) * mapSize;
            }
            if (Math.abs(enemy.position.z) > mapSize) {
                enemy.position.z = Math.sign(enemy.position.z) * mapSize;
            }

            // Lógica das Auras dos Inimigos
            if (repulsionBubbleTimer <= 0) { // Bolha protege contra auras
                if (enemyData.type === 'ice_elemental' && enemy.position.distanceTo(player.position) < enemyData.auraRadius) {
                    player.userData.slowTimer = 120;
                }
                if (enemyData.type === 'summoner_elemental' && enemy.position.distanceTo(player.position) < enemyData.auraRadius) {
                    player.userData.slowTimer = 60;
                    player.userData.burnTimer = 120;
                    player.userData.electrifiedTimer = 120;
                }
            }

            // Animação das partículas do Invocador
            if (enemyData.particles) {
                enemyData.particles.forEach(p => {
                    p.userData.angle += p.userData.speed;
                    p.position.set(
                        enemy.position.x + Math.cos(p.userData.angle) * p.userData.radius,
                        1.0,
                        enemy.position.z + Math.sin(p.userData.angle) * p.userData.radius
                    );
                });
            }

            // Checa colisão com o jogador APÓS o movimento
            const playerBBox = new THREE.Box3().setFromObject(player);
            // Inimigos de longa distância não causam dano de toque
            if (enemyData.type !== 'necromancer' && enemyData.type !== 'skeleton_archer') {
                if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(enemy))) {
                    if (enemyData.damageCooldown <= 0 && enemyData.electrifiedTimer <= 0) {
                        damagePlayer(enemyData.damage);
                        createFloatingText(enemyData.damage, player.position.clone().setY(1.5), '#ff0000', '1.5rem');
                        if (enemyData.type === 'fire_elemental') {
                            player.userData.burnTimer = 300; // Aplica queimadura no contato
                        }
                        enemyData.damageCooldown = 60; // Reseta o cooldown para 1 segundo (60 frames)
                    }
                }
            }

            enemy.updateMatrixWorld(); // Atualiza a matriz do inimigo para a verificação de morte
            
            if (enemyData.hp <= 0) {
                // NOVO: Lógica de derrota do chefe
                if (enemyData.isBoss) {
                    handleBossDefeat(enemy);
                    // A função handleBossDefeat já remove o inimigo
                    const index = enemies.indexOf(enemy);
                    if (index > -1) enemies.splice(index, 1);
                    scene.remove(enemy);
                    removeEnemyUI(enemy);
                    // A função handleBossDefeat já remove o inimigo
                    continue; // Pula para o próximo inimigo no loop
                }
                score += enemyData.score;

                if (enemyData.shatterOnDeath) {
                    triggerIceShatter(enemy.position);
                }

                gainExperience(enemyData.score); 
                if (isBossWave) killsForSoulHarvest++; // Contador para o Arquilich

                // Lógica de Recarga Híbrida: cada abate reduz o tempo de recarga
                const activeId = player.userData.activeAbility;
                if (activeId) {
                    chargeTimer = Math.max(0, chargeTimer - 60); // Reduz 1 segundo (60 frames)
                }
                killsSinceLastPotion++;

                if (killStats[enemyData.type] !== undefined) {
                    killStats[enemyData.type]++;
                }

                scene.remove(enemy);
                removeEnemyUI(enemy);
                enemies.splice(i, 1);

                enemiesAliveThisWave--; // NOVO: Decrementa contador da onda

                updateUI();
            }
        }
    }

    // NOVO: Função para lidar com movimento padrão e colisão
    function handleStandardMovement(enemy, newPosition, speed) {
        tempPlayer.position.copy(newPosition);
        tempPlayer.updateMatrixWorld();
        let fullEnemyBBox = new THREE.Box3().setFromObject(tempPlayer);
        let fullCollisionDetected = false;
        
        for (const obstacle of obstacles) {
            obstacle.updateMatrixWorld();
            let obstacleBBox = obstacle.userData.collisionMesh ? new THREE.Box3().setFromObject(obstacle.userData.collisionMesh) : new THREE.Box3().setFromObject(obstacle);
            if (fullEnemyBBox.intersectsBox(obstacleBBox)) {
                fullCollisionDetected = true;
                break;
            }
        }

        if (!fullCollisionDetected) {
            enemy.position.copy(newPosition);
        } else {
            const direction = new THREE.Vector3().subVectors(newPosition, enemy.position).normalize();
            // Tenta deslizar no eixo X
            const newPositionX = enemy.position.clone();
            newPositionX.x += direction.x * speed;
            tempPlayer.position.copy(newPositionX);
            tempPlayer.updateMatrixWorld();
            let enemyBBoxX = new THREE.Box3().setFromObject(tempPlayer);
            let collisionOnX = obstacles.some(o => enemyBBoxX.intersectsBox(o.userData.collisionMesh ? new THREE.Box3().setFromObject(o.userData.collisionMesh) : new THREE.Box3().setFromObject(o)));
            if (!collisionOnX) {
                enemy.position.x = newPositionX.x;
            }

            // Tenta deslizar no eixo Z
            const newPositionZ = enemy.position.clone();
            newPositionZ.z += direction.z * speed;
            tempPlayer.position.copy(newPositionZ);
            tempPlayer.updateMatrixWorld();
            let enemyBBoxZ = new THREE.Box3().setFromObject(tempPlayer);
            let collisionOnZ = obstacles.some(o => enemyBBoxZ.intersectsBox(o.userData.collisionMesh ? new THREE.Box3().setFromObject(o.userData.collisionMesh) : new THREE.Box3().setFromObject(o)));
            if (!collisionOnZ) {
                enemy.position.z = newPositionZ.z;
            }
        }
    }

    function createFirePuddle(position) {
        const puddleGeometry = new THREE.CircleGeometry(0.8, 16);
        const puddleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4500,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.position.copy(position);
        puddle.position.y = 0.03;
        puddle.rotation.x = -Math.PI / 2;
        scene.add(puddle);

        firePuddles.push({ mesh: puddle, life: 300 }); // Dura 5 segundos
    }

    function updateFirePuddles() {
        const playerBBox = new THREE.Box3().setFromObject(player);

        for (let i = firePuddles.length - 1; i >= 0; i--) {
            const puddle = firePuddles[i];
            puddle.life--;

            const puddleBBox = new THREE.Box3().setFromObject(puddle.mesh);
            if (playerBBox.intersectsBox(puddleBBox)) {
                if (repulsionBubbleTimer <= 0) { // Bolha protege do dano
                    damagePlayer(0.2); // Dano baixo, mas constante
                }
            }

            if (puddle.life <= 0) {
                scene.remove(puddle.mesh);
                firePuddles.splice(i, 1);
            }
        }
    }

    function updateStatusParticles() {
        // Partículas para status (Queimadura)
        enemies.forEach(enemy => {
            if (enemy.userData.burnTimer > 0 && Math.random() < 0.3) {
                const fireGeo = new THREE.SphereGeometry(0.1, 8, 8);
                const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.8 });
                const particle = new THREE.Mesh(fireGeo, fireMat);
                particle.position.copy(enemy.position).add(new THREE.Vector3(Math.random() - 0.5, Math.random() * enemy.userData.modelHeight, Math.random() - 0.5));
                statusParticles.push({ mesh: particle, life: 30 });
                scene.add(particle);
            }
        });

        // Atualiza a vida e posição das partículas
        for (let i = statusParticles.length - 1; i >= 0; i--) {
            const p = statusParticles[i];
            p.life--;
            p.mesh.position.y += 0.02;
            p.mesh.material.opacity = 0.8 * (p.life / 30);
            if (p.life <= 0) {
                scene.remove(p.mesh);
                statusParticles.splice(i, 1);
            }
        }
    }

        // NOVO: Função para iniciar o tremor da câmera
        function triggerCameraShake(intensity, duration) {
            // Garante que um novo tremor mais forte substitua um mais fraco
            cameraShakeIntensity = Math.max(cameraShakeIntensity, intensity);
            cameraShakeDuration = Math.max(cameraShakeDuration, duration);
        }

        // --- Ciclo de Jogo (Game Loop) ---

        function animate() {
            requestAnimationFrame(animate);

            // NOVO: Pausa o jogo se a flag estiver ativa
            if (isGamePaused) return;

            // CORREÇÃO: Checa se 'renderer' existe. Se não, o jogo não pode rodar.
            // O erro 'Cannot read properties of undefined (reading 'position')' 
            // acontece se 'player' não for definido, o que ocorre se 'startGame' falhar.
            // Mas 'startGame' só falha se 'removeShield' não existir.
            
            // CORREÇÃO 2: O erro 'Cannot read properties of undefined (reading 'position')'
            // A correção é garantir que 'removeShield' exista.
            
            if (isGameOver) {
                // Mesmo em "Game Over", precisamos renderizar a cena (para o menu)
                // mas não devemos tentar ler a posição do 'player' se ele não existir
                if (renderer) {
                    renderer.render(scene, camera);
                }
                return;
            }

            // A partir daqui, isGameOver = false, então 'player' DEVE existir.
            if (!player) return; // Proteção extra se 'startGame' falhar

            // 1. Lógica da Câmera: A câmera acompanha o jogador (Afastada +50%)
            const targetCameraX = player.position.x + 18;
            const targetCameraY = player.position.y + 27;
            const targetCameraZ = player.position.z + 18;

            // NOVO: Aplica o efeito de tremor da câmera
            if (cameraShakeDuration > 0) {
                cameraShakeDuration--;
                if (playerSlowTimer > 0) playerSlowTimer--; // Decrementa o timer global
                // A intensidade do tremor diminui conforme o tempo passa
                const currentShake = cameraShakeIntensity * (cameraShakeDuration / 20); 
                const shakeX = (Math.random() - 0.5) * currentShake;
                const shakeZ = (Math.random() - 0.5) * currentShake;

                camera.position.set(targetCameraX + shakeX, targetCameraY, targetCameraZ + shakeZ);
            } else {
                camera.position.set(targetCameraX, targetCameraY, targetCameraZ);
            }

            camera.lookAt(player.position);
            
            // Atualiza Cooldowns
            projectileCooldown = Math.max(0, projectileCooldown - 1);
            if (repulsionBubbleTimer > 0) repulsionBubbleTimer--; // NOVO: Decrementa timer da bolha
            if (freezingAuraTimer > 0) freezingAuraTimer--; // NOVO: Decrementa timer da aura
            if (flamingAuraTimer > 0) flamingAuraTimer--;
            if (electrifyingAuraTimer > 0) electrifyingAuraTimer--;
            if (expBoostTimer > 0) expBoostTimer--; // NOVO: Decrementa timer do EXP

            // NOVO: Lógica de recarga de habilidades
            if (specialGlobalCooldown > 0) specialGlobalCooldown--;

            const activeId = player.userData.activeAbility;
            if (activeId) {
                chargeTimer = Math.max(0, chargeTimer - 1);
                if (chargeTimer <= 0) {
                    player.userData.abilityCharges[activeId] = (player.userData.abilityCharges[activeId] || 0) + 1;
                    chargeTimer = CHARGE_TIME_MAX; // Reseta o timer
                    updateUI();
                }
            }

            if (repulsionBubbleTimer > 0) {
                repulsionBubbleMesh.visible = true;
                // Centraliza a bolha no jogador
                repulsionBubbleMesh.position.copy(player.position);
            } else {
                repulsionBubbleMesh.visible = false;
            }

            if (freezingAuraTimer > 0) {
                freezingAuraMesh.visible = true;
                freezingAuraMesh.position.copy(player.position);
            } else {
                freezingAuraMesh.visible = false;
            }

            if (flamingAuraTimer > 0) {
                flamingAuraMesh.visible = true;
                flamingAuraMesh.position.copy(player.position);
                flamingAuraMesh.children.forEach(particle => {
                    particle.userData.angle += particle.userData.speed;
                    particle.position.set(
                        Math.cos(particle.userData.angle) * particle.userData.radius,
                        particle.userData.yOffset,
                        Math.sin(particle.userData.angle) * particle.userData.radius
                    );
                });
            } else {
                flamingAuraMesh.visible = false;
            }

            if (electrifyingAuraTimer > 0) {
                electrifyingAuraMesh.visible = true;
                electrifyingAuraMesh.position.copy(player.position);

                // Gera novos arcos elétricos dinamicamente
                if (Math.random() < 0.4) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 6;
                    const lightningGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
                    const lightningMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
                    const arc = new THREE.Mesh(lightningGeo, lightningMat);
                    arc.position.set(player.position.x + Math.cos(angle) * radius, 0.5, player.position.z + Math.sin(angle) * radius);
                    arc.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    scene.add(arc);
                    setTimeout(() => scene.remove(arc), 100 + Math.random() * 100);
                }
            } else {
                electrifyingAuraMesh.visible = false;
            }

            if (freezingAuraTimer > 0) {
                smokeParticles.forEach(p => {
                    if (!p.parent) scene.add(p); // Adiciona à cena se não estiver
                    p.position.add(p.userData.velocity);
                    p.userData.life--;
                    p.material.opacity = (p.userData.life / 120) * 0.4;

                    if (p.userData.life <= 0) {
                        // Reseta a partícula na borda da aura
                        const angle = Math.random() * Math.PI * 2;
                        const radius = 6;
                        p.position.set(player.position.x + Math.cos(angle) * radius, 0.1, player.position.z + Math.sin(angle) * radius);
                        p.userData.life = 120;
                    }
                });
            } else {
                // Remove as partículas se a aura acabar
                smokeParticles.forEach(p => { if (p.parent) scene.remove(p); });
            }

            if (expBoostTimer > 0) {
                expBoostAuraMesh.visible = true;
                expBoostAuraMesh.position.copy(player.position);
                expBoostAuraMesh.position.y = 0.1; // Ligeiramente acima do chão
                expBoostAuraMesh.rotation.z += 0.02; // Animação de rotação simples
            } else {
                expBoostAuraMesh.visible = false;
            }

            if (rangeIndicator.visible) {
                rangeIndicator.position.copy(player.position);
            }

            if (goblinKingAuraMesh) {
                if (isBossWave && currentBoss && currentBoss.userData.type === 'goblin_king' && currentBoss.userData.hp > 0) {
                    goblinKingAuraMesh.visible = true;
                    goblinKingAuraMesh.position.copy(currentBoss.position);
                    goblinKingAuraMesh.position.y = 0.1;
                    goblinKingAuraMesh.rotation.z += 0.01; // Animação de rotação
                } else {
                    goblinKingAuraMesh.visible = false;
                }
            }

            // 2. Lógica do Jogador
            handlePlayerMovement();
            
            // NOVO: Força a atualização da matriz 3D do jogador
            // Isso garante que o escudo e os inimigos usem a posição ATUAL
            player.updateMatrixWorld(true);

            updateAiming();
            updateClone(); // NOVO: Atualiza a lógica do clone
            updatePowerUps(); // Checa colisão com poções e poderes
            updateRunes(); // NOVO: Atualiza a lógica das runas
            updateStatusParticles(); // NOVO: Atualiza partículas de status
            updateFirePuddles(); // NOVO: Atualiza as poças de fogo
            spawnEnemies();
            spawnPowerUps(); // Tenta spawnar poção
            
            // CORREÇÃO DE ORDEM:
            // 1. Move os inimigos
            updateEnemies();

            // 2. O Escudo ataca (e pode matar o inimigo que acabou de se mover)
            updateShield(); 

            // 4. Lógica dos Projéteis
            updateProjectiles();
            
            // 5. Atualiza a posição dos labels 2D e HP
            updateEnemyUI();
            updateFloatingText(); // NOVO: Atualiza o texto flutuante
            updatePowerUpLabels(); // NOVO: Atualiza labels dos itens
            updateUI(); // CORREÇÃO: Atualiza a HUD principal a cada frame

            updatePassivePlayerAbilities();

            // 6. Renderização
            renderer.render(scene, camera);
        }

        // NOVO: Função para lidar com a derrota de um chefe (movida para game.js)
        function handleBossDefeat(boss) {
            score += boss.userData.score;
            gainExperience(boss.userData.score);
            
            const numDrops = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < numDrops; i++) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
                spawnRandomItem(boss.position.clone().add(offset));
            }

            if (boss.userData.type === 'archlich') {
                showSpecialLevelUpOptions();
            }

            isBossWave = false;
            currentBoss = null;
            updateUI();
        }

        // Função startGame agora recebe o nome do jogador
        window.startGame = function (name) {
            playerName = name || 'Mago Anônimo';
            resetPlayerState();
            if (freezingAuraMesh) freezingAuraMesh.visible = false; // NOVO: Esconde a aura
            if (expBoostAuraMesh) expBoostAuraMesh.visible = false; // NOVO: Esconde a aura de EXP
            expBoostTimer = 0; // NOVO: Reseta timer de EXP
            if (goblinKingAuraMesh) goblinKingAuraMesh.visible = false; // NOVO: Esconde a aura do chefe
            if (rangeIndicator) rangeIndicator.visible = false; // NOVO: Esconde indicador de alcance

            resetWaveState();
            
            // CORREÇÃO: Define como "jogo iniciado" APENAS DEPOIS que tudo foi criado
            isGameOver = false;
        }

        function endGame() {
            isGameOver = true;
            
            finalScoreDisplay.textContent = score;
            gameOverModal.classList.remove('hidden');

            // Salva a pontuação com o nome do jogador e as estatísticas de abates
            window.saveScore(score, playerName, killStats, playerLevel, currentWave);
            
            if (repulsionBubbleMesh) repulsionBubbleMesh.visible = false;
            if (freezingAuraMesh) freezingAuraMesh.visible = false;
            if (clone) { scene.remove(clone); clone = null; }
            if (expBoostAuraMesh) expBoostAuraMesh.visible = false;
            if (goblinKingAuraMesh) goblinKingAuraMesh.visible = false;

            // Remove todos os labels quando o jogo termina
            enemyLabelsContainer.innerHTML = '';
            enemyLabels.clear();
            powerUpLabels.clear(); // NOVO: Limpa o mapa de labels dos itens
        }

        // Inicia a aplicação Three.js quando a janela estiver carregada
        window.onload = function () {
            if (window.setupUIElements) setupUIElements(); // Inicializa referências da UI
            // A configuração dos tooltips é chamada dentro de init()
            init();
            createPlayer(); // Cria o jogador uma vez para ter a referência em `startGame`
            animate();
            // A tela de menu fica visível no início (isGameOver = true)
        };