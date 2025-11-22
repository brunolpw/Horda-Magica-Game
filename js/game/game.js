        // Variáveis do Three.js
        let scene, camera, renderer;
        let raycaster, mouse;
        const pointer = new THREE.Vector2();
        
        // NOVO: Variáveis do Camera Shake
        let cameraShakeIntensity = 0;
        let cameraShakeDuration = 0;

        let isGameOver = true; // Inicia como TRUE para mostrar o menu
        let isDebugMode = false; // NOVO: Flag para o modo de depuração
        let isGamePaused = false; // NOVO: Flag para pausar o jogo durante o level up
        let keys = {};
        let playerSlowTimer = 0;
        const stormConduits = [];
        const conduitBeams = [];
        const enemies = []; const powerUps = [];
        const traps = [];
        const firePuddles = [];

        // Helper para normalizar referências a inimigos que podem ser
        // instâncias da classe Enemy ou meshes puros.
        function getEnemyRef(enemyItem) {
            const isClassBased = enemyItem instanceof Enemy;
            const mesh = isClassBased ? enemyItem.mesh : enemyItem;
            const data = isClassBased ? enemyItem : (mesh && mesh.userData) ? mesh.userData : {};
            return { isClassBased, mesh, data };
        }
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
                .map(enemy => {
                    const isClassBased = enemy instanceof Enemy;
                    const mesh = isClassBased ? enemy.mesh : enemy;
                    return {
                        enemy,
                        distanceSq: mesh.position.distanceToSquared(position)
                    };
                });

            if (sortByStrength) {
                // Ordena por HP máximo (mais forte) e depois por HP atual
                sortedEnemies.sort((a, b) => {
                    const dataA = a.enemy instanceof Enemy ? a.enemy : a.enemy.userData;
                    const dataB = b.enemy instanceof Enemy ? b.enemy : b.enemy.userData;
                    if (dataB.maxHP !== dataA.maxHP) return dataB.maxHP - dataA.maxHP;
                    return dataB.hp - dataA.hp;
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

                // NOVO: Lógica de debug para ganhar EXP
                if (isDebugMode && (e.key === 'l' || e.key === 'L') && !isGamePaused) {
                    const xpNeeded = player.userData.experienceForNextLevel - experiencePoints;
                    gainExperience(xpNeeded);
                }

                // NOVO: Lógica de debug para invocar inimigos
                if (isDebugMode && !isGamePaused && !isGameOver) {
                    let enemyType;
                    switch (e.key) {
                        case '1': enemyType = 'goblin'; break;
                        case '2': enemyType = 'orc'; break;
                        case '3': enemyType = 'troll'; break;
                        case '4': enemyType = 'necromancer'; break;
                        case '5': enemyType = 'skeleton_warrior'; break;
                        case '6': enemyType = 'fire_elemental'; break;
                        case '7': enemyType = 'ice_elemental'; break;
                        case '8': enemyType = 'lightning_elemental'; break;
                        case '9': enemyType = 'ghost'; break;
                    }

                    if (enemyType) {
                        const spawnPosition = new THREE.Vector3(0, 0, 0); // AJUSTE: Spawna no centro do mapa.
                        createEnemy(enemyType, spawnPosition);
                    }
                }
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
            if (event.button === 0 && !isGameOver && !isGamePaused) { // Garante que nenhuma magia seja usada com o jogo pausado
                attemptSpecialAttack();
            }
        }
        
        
        // --- Funções de Entidade e Spawning ---
        
        function createEnemy(type, position, isSummon = false) {
            // REATORAÇÃO: Se o tipo for 'goblin', usa a nova classe.
            if (type === 'goblin') {
                const goblin = new Goblin(position, isSummon); // CORREÇÃO: Passa o status 'isSummon'
                enemies.push(goblin);
                createEnemyUI(goblin.mesh, entityProps.goblin.name); // A UI ainda precisa do mesh
                return; // Sai da função para não executar o código antigo.
            }
            if (type === 'kobold') {
                const kobold = new Kobold(position, isSummon);
                enemies.push(kobold);
                createEnemyUI(kobold.mesh, entityProps.kobold.name);
                return;
            }
            if (type === 'kobold_warrior') {
                const warrior = new KoboldWarrior(position, isSummon);
                enemies.push(warrior);
                createEnemyUI(warrior.mesh, entityProps.kobold_warrior.name);
                return;
            }
            if (type === 'kobold_shaman') {
                const shaman = new KoboldShaman(position, isSummon);
                enemies.push(shaman);
                createEnemyUI(shaman.mesh, entityProps.kobold_shaman.name);
                return; // Sai da função para não executar o código antigo.
            }
            if (type === 'orc') {
                const orc = new Orc(position, isSummon);
                enemies.push(orc);
                createEnemyUI(orc.mesh, entityProps.orc.name);
                return;
            }
            if (type === 'troll') {
                const troll = new Troll(position, isSummon);
                enemies.push(troll);
                createEnemyUI(troll.mesh, entityProps.troll.name);
                return;
            }
            if (type === 'necromancer') {
                const necromancer = new Necromancer(position, isSummon);
                enemies.push(necromancer);
                createEnemyUI(necromancer.mesh, entityProps.necromancer.name);
                return;
            }
            if (type === 'skeleton') {
                const skeleton = new Skeleton(position, isSummon);
                enemies.push(skeleton);
                createEnemyUI(skeleton.mesh, entityProps.skeleton.name);
                return;
            }
            if (type === 'skeleton_warrior') {
                const warrior = new SkeletonWarrior(position, isSummon);
                enemies.push(warrior);
                createEnemyUI(warrior.mesh, entityProps.skeleton_warrior.name);
                return;
            }
            if (type === 'skeleton_archer') {
                const archer = new SkeletonArcher(position, isSummon);
                enemies.push(archer);
                createEnemyUI(archer.mesh, entityProps.skeleton_archer.name);
                return;
            }

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

            // NOVO: Adiciona propriedades para o Rei Kobold
            if (type === 'kobold_king') {
                enemy.userData.isBoss = true;
                enemy.userData.junkLaunchCooldown = 600; // 10s
                enemy.userData.summonCooldown = 900; // 15s
                enemy.userData.isEnraged = false;
            }

            // NOVO: Adiciona propriedades para o Mestre Elemental
            if (type === 'elemental_master') {
                enemy.userData.isBoss = true;
                enemy.userData.phase = 1;
                enemy.userData.teleportCooldown = 480; // 8s
                enemy.userData.fireMissileCooldown = 300; // 5s
                enemy.userData.iceLanceCooldown = 420; // 7s
                enemy.userData.chainLightningCooldown = 540; // 9s
                enemy.userData.activeAura = null;
                enemy.userData.auraChangeCooldown = 0;
                enemy.userData.echoSummonCooldown = 0;
                enemy.userData.furyAttackCooldown = 0;
                enemy.userData.isTeleporting = false;
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
            // NOVO: Adiciona propriedades para o Xamã Kobold
            if (type === 'kobold_shaman') {
                enemy.userData.isRanged = true; // Marca como inimigo de longa distância
                enemy.userData.attackCooldown = 360; // Ataca a cada 6 segundos
                enemy.userData.attackTimer = Math.random() * 180;
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

            // NOVO: Adiciona propriedades para o Colosso de Magma
            if (type === 'magma_colossus') {
                enemy.userData.isBoss = true;
                enemy.userData.eruptionCooldown = 900; // 15s
                enemy.userData.meteorShowerCooldown = 600; // 10s
                enemy.userData.isEnraged = false;
            }

            // NOVO: Adiciona propriedades para a Matriarca Glacial
            if (type === 'glacial_matriarch') {
                enemy.userData.isBoss = true;
                enemy.userData.shardLaunchCooldown = 480; // 8s
                enemy.userData.icePrisonCooldown = 1200; // 20s
                enemy.userData.isEnraged = false;
                enemy.userData.shardShields = [];
                enemy.userData.maxShards = 5;
                createIceShardShield(enemy); // Cria o escudo inicial
            }

            // NOVO: Adiciona propriedades para o Soberano da Tempestade
            if (type === 'storm_sovereign') {
                enemy.userData.isBoss = true;
                enemy.userData.isInvulnerable = true;
                enemy.userData.teleportCooldown = 480; // 8s
                createStormConduits(enemy, 3);
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

                if (projectileCooldown <= 0 && !player.userData.isBlinded) {
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

                // --- LÓGICA DE REATORAÇÃO (COEXISTÊNCIA) ---
                if (enemy instanceof Enemy) {
                    // Se for uma instância da nova classe Enemy, delega a lógica.
                    enemy.update(player, obstacles);

                    if (enemy.isDead()) {
                        score += enemy.score;
                        gainExperience(enemy.score);
                        if (isBossWave) killsForSoulHarvest++;
                        chargeTimer = Math.max(0, chargeTimer - 60);
                        killsSinceLastPotion++;
                        if (killStats[enemy.type] !== undefined) {
                            killStats[enemy.type]++;
                        }

                        scene.remove(enemy.mesh);
                        removeEnemyUI(enemy.mesh); // A UI usa o mesh como chave
                        enemies.splice(i, 1);
                        enemiesAliveThisWave--;
                        updateUI();
                    }
                    continue; // Pula para o próximo inimigo do loop
                }
                // --- FIM DA LÓGICA DE REATORAÇÃO ---

                // O código abaixo só será executado para inimigos do sistema antigo.
                const enemyData = enemy.userData; 

                // NOVO: Decrementa o cooldown de ataque do monstro
                if (enemyData.damageCooldown > 0) {
                    enemyData.damageCooldown--;
                }

                // NOVO: Feedback de Hit (Piscar Branco)
                if (enemyData.hitTimer > 0) {
                    // CORREÇÃO: Percorre os filhos para aplicar o efeito
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
                
            // CORREÇÃO: Toda a lógica abaixo foi movida para dentro do loop 'for'

            // NOVO: Define o alvo (fantasmas ignoram o clone)
            let target = player; // BUGFIX 1: Alvo padrão é o jogador
            if (clone && cloneTimer > 0 && enemyData.type !== 'ghost' && !enemyData.isBoss) {
                target = clone;
            } else {
                target = player;
            }
            const targetPos = target.position;

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


            // --- LÓGICA DE MOVIMENTO ---
            let finalSpeed = enemyData.speed;
            if (goblinKingAura && enemyData.type === 'goblin' && !enemyData.isBoss && enemy.position.distanceToSquared(currentBoss.position) < auraRadiusSq) {
                finalSpeed *= speedBoost;
            }
            if (enemyData.isTeleporting) {
                continue; // Pula movimento se estiver se teleportando
            }
            if (enemyData.type === 'goblin_king' && enemyData.hp / enemyData.maxHP < 0.3) { // Fuga do Rei Goblin
                // Foge do jogador
                const fleeDirection = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(fleeDirection, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                enemyData.rockThrowCooldown = Math.max(0, enemyData.rockThrowCooldown - 1);
                if (enemyData.rockThrowCooldown <= 0) {
                    const rockTargetPosition = player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
                    triggerRockFall(rockTargetPosition);
                    enemyData.rockThrowCooldown = 240; // Atira a cada 4 segundos
                }
            } else if (enemyData.isFleeing) {
                // Lógica de Fuga para outros inimigos
                let fleeSpeed = finalSpeed;
                if (isSlowed) fleeSpeed *= 0.5; // Aplica lentidão à fuga

                const fleeDirection = new THREE.Vector3().subVectors(enemy.position, player.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(fleeDirection, fleeSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);
            } else if (enemyData.type === 'kobold_king') {
                // Fúria
                if (!enemyData.isEnraged && enemyData.hp / enemyData.maxHP < 0.5) {
                    enemyData.isEnraged = true;
                    enemyData.speed *= 1.3;
                }
                // Movimento
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                // Habilidades
                const furyMultiplier = enemyData.isEnraged ? 0.6 : 1.0;
                enemyData.junkLaunchCooldown = Math.max(0, enemyData.junkLaunchCooldown - 1);
                if (enemyData.junkLaunchCooldown <= 0) {
                    triggerJunkLaunch(enemy.position, enemyData.isEnraged);
                    enemyData.junkLaunchCooldown = 600 * furyMultiplier;
                }

                enemyData.summonCooldown = Math.max(0, enemyData.summonCooldown - 1);
                if (enemyData.summonCooldown <= 0) {
                    // Invoca um grupo de kobolds perto dele
                    spawnKoboldGroup(enemy.position);
                    enemyData.summonCooldown = 900 * furyMultiplier;
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
                    enemyData.fireTrailCooldown = 45;
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
            } else if (enemyData.type === 'magma_colossus') {
                // Fúria
                if (!enemyData.isEnraged && enemyData.hp / enemyData.maxHP < 0.5) {
                    enemyData.isEnraged = true;
                    enemyData.speed *= 1.5; // Aumenta a velocidade
                }

                // Movimento e rastro de lava
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);
                if (Math.random() < 0.1) {
                    createFirePuddle(enemy.position.clone(), 1.5, 480); // Poças maiores e mais duradouras
                }

                // Habilidades
                const furyMultiplier = enemyData.isEnraged ? 0.7 : 1.0; // Ataques mais rápidos na fúria
                enemyData.eruptionCooldown = Math.max(0, enemyData.eruptionCooldown - 1);
                if (enemyData.eruptionCooldown <= 0) {
                    triggerEruption(enemy.position);
                    enemyData.eruptionCooldown = 900 * furyMultiplier;
                }
                enemyData.meteorShowerCooldown = Math.max(0, enemyData.meteorShowerCooldown - 1);
                if (enemyData.meteorShowerCooldown <= 0) {
                    triggerMeteorShower(5);
                    enemyData.meteorShowerCooldown = 600 * furyMultiplier;
                }
            } else if (enemyData.type === 'glacial_matriarch') {
                // Fúria (Nevasca)
                if (!enemyData.isEnraged && enemyData.hp / enemyData.maxHP < 0.5) {
                    enemyData.isEnraged = true;
                    triggerBlizzard(true);
                }

                // Movimento flutuante
                const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                // Regenera cacos do escudo
                if (enemyData.shardShields.length < enemyData.maxShards) {
                    if (Math.random() < 0.005) { // Chance de regenerar
                        createIceShardShield(enemy, 1);
                    }
                }

                // Habilidades
                const furyMultiplier = enemyData.isEnraged ? 0.6 : 1.0;
                enemyData.shardLaunchCooldown = Math.max(0, enemyData.shardLaunchCooldown - 1);
                if (enemyData.shardLaunchCooldown <= 0 && enemyData.shardShields.length > 0) {
                    const shardToLaunch = enemyData.shardShields.pop();
                    scene.remove(shardToLaunch);
                    const launchDir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
                    createProjectile('ice_shard', launchDir, enemy.position);
                    enemyData.shardLaunchCooldown = 480 * furyMultiplier;
                }

                enemyData.icePrisonCooldown = Math.max(0, enemyData.icePrisonCooldown - 1);
                if (enemyData.icePrisonCooldown <= 0) {
                    triggerIcePrison();
                    enemyData.icePrisonCooldown = 1200 * furyMultiplier;
                }
            } else if (enemyData.type === 'storm_sovereign') {
                // Movimento errático
                const randomDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                const newPosition = enemy.position.clone().addScaledVector(randomDir, finalSpeed);
                handleStandardMovement(enemy, newPosition, finalSpeed);

                // Animação de pulsação
                const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
                enemy.scale.set(scale, scale, scale);

                enemyData.teleportCooldown = Math.max(0, enemyData.teleportCooldown - 1);
                if (enemyData.teleportCooldown <= 0) {
                    triggerTeleport(enemy);
                }

            } else if (enemyData.type === 'elemental_master') {
                // Lógica de Fases
                const hpPercent = enemyData.hp / enemyData.maxHP;
                if (enemyData.phase === 1 && hpPercent <= 0.75) {
                    enemyData.phase = 2;
                    // Inicia a fase 2 com a aura de fogo
                    enemyData.activeAura = 'fire';
                    enemyData.auraChangeCooldown = 1200; // 20 segundos
                    // Para de atacar com magias por um tempo para focar na aura
                    enemyData.fireMissileCooldown = 300;
                    enemyData.iceLanceCooldown = 300;
                } else if (enemyData.phase === 2 && hpPercent <= 0.50) {
                    enemyData.phase = 3;
                    enemyData.activeAura = null; // Desativa as auras
                    enemyData.echoSummonCooldown = 900; // 15s para o primeiro eco
                    enemyData.teleportCooldown = 480; // Volta a se teleportar
                } else if (enemyData.phase === 3 && hpPercent <= 0.25) {
                    enemyData.phase = 4;
                    enemyData.activeAura = 'fire'; // Começa o ciclo de pulsos com fogo
                    enemyData.auraChangeCooldown = 60; // Pulsa a cada 1 segundo
                    enemyData.furyAttackCooldown = 120; // Começa a atacar furiosamente após 2s
                    // Aumenta a velocidade na fase final
                    enemyData.speed *= 1.2;
                }

                // Animação dos cristais
                if (enemyData.crystals) {
                    const time = Date.now() * 0.001;
                    enemyData.crystals.forEach((crystal, index) => {
                        crystal.rotation.y += 0.02;
                        crystal.position.y = 1.5 + Math.sin(time + index) * 0.2;

                        // Lógica de brilho da aura ativa
                        let targetIntensity = 0.5;
                        if (enemyData.phase === 2 || enemyData.phase === 4) {
                            if (
                                (enemyData.activeAura === 'fire' && index === 0) ||
                                (enemyData.activeAura === 'ice' && index === 1) ||
                                (enemyData.activeAura === 'lightning' && index === 2)
                            ) {
                                targetIntensity = 3.0; // Brilha intensamente
                            }
                        }
                        // Suaviza a transição da intensidade
                        crystal.material.emissiveIntensity += (targetIntensity - crystal.material.emissiveIntensity) * 0.1;
                    });
                }

                // Comportamento da Fase 1
                if (enemyData.phase === 1) {
                    enemyData.teleportCooldown = Math.max(0, enemyData.teleportCooldown - 1);
                    if (enemyData.teleportCooldown <= 0) {
                        triggerTeleport(enemy, 25); // Teleporta para mais longe
                        enemyData.teleportCooldown = 480;
                    }

                    // Ataques
                    enemyData.fireMissileCooldown = Math.max(0, enemyData.fireMissileCooldown - 1);
                    if (enemyData.fireMissileCooldown <= 0) {
                        const proj = createProjectile('ethereal_fire', new THREE.Vector3().subVectors(player.position, enemy.position).normalize(), enemy.position);
                        if(proj) { proj.userData.damage = 40; proj.userData.isHoming = true; proj.userData.target = player; }
                        enemyData.fireMissileCooldown = 300;
                    }
                } else if (enemyData.phase === 2) {
                    // Movimento lento e ameaçador
                    const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                    const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed * 0.5);
                    handleStandardMovement(enemy, newPosition, finalSpeed);

                    // Lógica de troca de aura
                    enemyData.auraChangeCooldown = Math.max(0, enemyData.auraChangeCooldown - 1);
                    if (enemyData.auraChangeCooldown <= 0) {
                        if (enemyData.activeAura === 'fire') enemyData.activeAura = 'ice';
                        else if (enemyData.activeAura === 'ice') enemyData.activeAura = 'lightning';
                        else enemyData.activeAura = 'fire';
                        enemyData.auraChangeCooldown = 1200; // Reseta para 20s
                    }

                    // Aplica efeito da aura se o jogador estiver perto
                    const auraRadius = 12;
                    if (player.position.distanceToSquared(enemy.position) < auraRadius * auraRadius) {
                        if (enemyData.activeAura === 'fire') {
                            player.userData.burnTimer = Math.max(player.userData.burnTimer, 120);
                        } else if (enemyData.activeAura === 'ice') {
                            player.userData.slowTimer = Math.max(player.userData.slowTimer, 60);
                        } else if (enemyData.activeAura === 'lightning') {
                            player.userData.electrifiedTimer = Math.max(player.userData.electrifiedTimer, 60);
                        }
                    }
                } else if (enemyData.phase === 3) {
                    // Comportamento de ataque e teleporte similar à fase 1
                    enemyData.teleportCooldown = Math.max(0, enemyData.teleportCooldown - 1);
                    if (enemyData.teleportCooldown <= 0) {
                        triggerTeleport(enemy, 25);
                        enemyData.teleportCooldown = 600; // Teleporta a cada 10s
                    }

                    enemyData.fireMissileCooldown = Math.max(0, enemyData.fireMissileCooldown - 1);
                    if (enemyData.fireMissileCooldown <= 0) {
                        const proj = createProjectile('ethereal_fire', new THREE.Vector3().subVectors(player.position, enemy.position).normalize(), enemy.position);
                        if(proj) { proj.userData.damage = 40; proj.userData.isHoming = true; proj.userData.target = player; }
                        enemyData.fireMissileCooldown = 420; // Ataca com menos frequência
                    }

                    // Invocação de Ecos
                    enemyData.echoSummonCooldown = Math.max(0, enemyData.echoSummonCooldown - 1);
                    if (enemyData.echoSummonCooldown <= 0) {
                        triggerEchoSummon();
                        enemyData.echoSummonCooldown = 900; // 15s de cooldown
                    }
                } else if (enemyData.phase === 4) {
                    // Movimento agressivo
                    const direction = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                    const newPosition = enemy.position.clone().addScaledVector(direction, finalSpeed);
                    handleStandardMovement(enemy, newPosition, finalSpeed);

                    // Auras Pulsantes
                    enemyData.auraChangeCooldown = Math.max(0, enemyData.auraChangeCooldown - 1);
                    if (enemyData.auraChangeCooldown <= 0) {
                        const auraRadius = 15; // Raio aumentado
                        if (player.position.distanceToSquared(enemy.position) < auraRadius * auraRadius) {
                            if (enemyData.activeAura === 'fire') player.userData.burnTimer = Math.max(player.userData.burnTimer, 120);
                            else if (enemyData.activeAura === 'ice') player.userData.slowTimer = Math.max(player.userData.slowTimer, 60);
                            else if (enemyData.activeAura === 'lightning') player.userData.electrifiedTimer = Math.max(player.userData.electrifiedTimer, 60);
                        }
                        // Cicla para a próxima aura
                        if (enemyData.activeAura === 'fire') enemyData.activeAura = 'ice';
                        else if (enemyData.activeAura === 'ice') enemyData.activeAura = 'lightning';
                        else enemyData.activeAura = 'fire';
                        enemyData.auraChangeCooldown = 60; // Pulsa a cada 1s
                    }

                    // Ataques Furiosos
                    enemyData.furyAttackCooldown = Math.max(0, enemyData.furyAttackCooldown - 1);
                    if (enemyData.furyAttackCooldown <= 0) {
                        // Lança duas Lanças de Gelo
                        const dir1 = new THREE.Vector3().subVectors(player.position, enemy.position).normalize().applyAxisAngle(new THREE.Vector3(0,1,0), -0.1);
                        const dir2 = new THREE.Vector3().subVectors(player.position, enemy.position).normalize().applyAxisAngle(new THREE.Vector3(0,1,0), 0.1);
                        createProjectile('ice_lance', dir1, enemy.position).userData.damage = 50;
                        createProjectile('ice_lance', dir2, enemy.position).userData.damage = 50;

                        // Corrente de Raios aprimorada
                        const target = findClosestEnemies(enemy.position, 1, false)[0] || player;
                        triggerChainLightning(target, 5); // Simula nível 5

                        enemyData.furyAttackCooldown = 240; // Ataca a cada 4s
                    }
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
            // Inimigos de longa distância (apenas o Xamã que não foi refatorado ainda) não causam dano de toque
            if (enemyData.type !== 'kobold_shaman' && enemyData.electrifiedTimer <= 0) {
                if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(enemy))) {
                    if (enemyData.damageCooldown <= 0) {
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

                // NOVO: Cada abate reduz o tempo de recarga da próxima carga em 1 segundo (60 frames)
                chargeTimer = Math.max(0, chargeTimer - 60);

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

    function createFirePuddle(position, radius = 0.8, life = 300) {
        const puddleGeometry = new THREE.CircleGeometry(radius, 16);
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

        firePuddles.push({ mesh: puddle, life: life });
    }

    function updateFirePuddles() {
        const playerBBox = new THREE.Box3().setFromObject(player);

        for (let i = firePuddles.length - 1; i >= 0; i--) {
            const puddle = firePuddles[i];
            puddle.life--;

            const puddleBBox = new THREE.Box3().setFromObject(puddle.mesh);
            if (playerBBox.intersectsBox(puddleBBox)) {
                if (repulsionBubbleTimer <= 0) {
                    damagePlayer(0.2); // Dano baixo, mas constante
                }
            }

            if (puddle.life <= 0) {
                scene.remove(puddle.mesh);
                firePuddles.splice(i, 1);
            }
        }
    }

    function updateTraps() {
        const playerBBox = new THREE.Box3().setFromObject(player);
        let isPlayerInSmoke = false;

        for (let i = traps.length - 1; i >= 0; i--) {
            const trap = traps[i];
            trap.life--;

            if (trap.life <= 0) {
                scene.remove(trap.mesh);
                // Se for uma nuvem de fumaça que sumiu, garante que o jogador não fique cego
                if (trap.type === 'smoke') {
                    const blindIndicator = document.getElementById('blind-indicator');
                    if (blindIndicator) blindIndicator.classList.add('hidden');
                }
                traps.splice(i, 1);
                continue;
            }

            if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(trap.mesh))) {
                if (trap.type === 'oil') {
                    player.userData.slowTimer = Math.max(player.userData.slowTimer, 2); // Aplica lentidão forte por 2 frames
                } else if (trap.type === 'spring') {
                    // Lógica da mola (implementação futura)
                } else if (trap.type === 'smoke') {
                    isPlayerInSmoke = true;
                }
            }
        }

        // Atualiza o status de cegueira do jogador
        player.userData.isBlinded = isPlayerInSmoke;
        const blindIndicator = document.getElementById('blind-indicator');
        if (blindIndicator) {
            blindIndicator.classList.toggle('hidden', !isPlayerInSmoke);
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

            // Animação do Escudo Mágico
            if (magicShieldMesh) {
                magicShieldMesh.position.copy(player.position);
                magicShieldMesh.rotation.z += 0.02;
            }

            camera.lookAt(player.position);
            
            // Atualiza Cooldowns
            projectileCooldown = Math.max(0, projectileCooldown - 1);
            specialGlobalCooldown = Math.max(0, specialGlobalCooldown - 1);
            if (repulsionBubbleTimer > 0) repulsionBubbleTimer--; // NOVO: Decrementa timer da bolha
            if (freezingAuraTimer > 0) freezingAuraTimer--; // NOVO: Decrementa timer da aura
            if (flamingAuraTimer > 0) flamingAuraTimer--;
            if (electrifyingAuraTimer > 0) electrifyingAuraTimer--;
            if (expBoostTimer > 0) expBoostTimer--; // NOVO: Decrementa timer do EXP

            // NOVO: Lógica de recarga de habilidade ativa
            const activeId = player.userData.activeAbility;
            if (activeId) {
                chargeTimer = Math.max(0, chargeTimer - 1);
                if (chargeTimer <= 0) {
                    player.userData.abilityCharges[activeId] = (player.userData.abilityCharges[activeId] || 0) + 1;
                    chargeTimer = CHARGE_TIME_MAX; // Reseta o timer para a próxima carga
                    updateUI(); // Atualiza a UI para mostrar a nova carga
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
                
                // Remove arcos antigos
                for (let i = electrifyingAuraMesh.children.length - 1; i >= 0; i--) {
                    const child = electrifyingAuraMesh.children[i];
                    if (child.userData.isArc) {
                        scene.remove(child);
                        electrifyingAuraMesh.remove(child);
                    }
                }

                // Cria novos arcos elétricos aleatórios
                if (Math.random() < 0.7) { // Chance aumentada para um efeito mais intenso
                    const auraRadius = 6;
                    const radius1 = Math.random() * auraRadius;
                    const radius2 = Math.random() * auraRadius;
                    const angle1 = Math.random() * Math.PI * 2;
                    const angle2 = Math.random() * Math.PI * 2; // Ângulo totalmente aleatório
                    
                    const p1 = new THREE.Vector3(Math.cos(angle1) * radius1, 0.5, Math.sin(angle1) * radius1);
                    const p2 = new THREE.Vector3(Math.cos(angle2) * radius2, 0.5, Math.sin(angle2) * radius2);
                    const arc = createLightningArc(p1, p2);
                    electrifyingAuraMesh.add(arc); // Adiciona ao grupo para ser posicionado corretamente
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
            updateTraps(); // NOVO: Atualiza a lógica das armadilhas do chefe
            updateFirePuddles(); // NOVO: Atualiza as poças de fogo
            spawnEnemies();
            spawnPowerUps(); // Tenta spawnar poção
            
            // CORREÇÃO DE ORDEM:
            // 1. Move os inimigos
            updateEnemies();

            // 2. O Escudo ataca (e pode matar o inimigo que acabou de se mover)
            updateShield(); 

            updateBossShields(); // NOVO: Atualiza escudos de chefes
            checkBeamCollisions(); // NOVO: Checa colisão com raios do chefe
            // 4. Lógica dos Projéteis
            updateProjectiles();
            
            // 5. Atualiza a posição dos labels 2D e HP
            updateEnemyUI();
            updateFloatingText(); // NOVO: Atualiza o texto flutuante
            updatePowerUpLabels(); // NOVO: Atualiza labels dos itens

            updatePassivePlayerAbilities();
            updateUI(); // Garante que a UI seja atualizada a cada frame

            // 6. Renderização
            renderer.render(scene, camera);
        }

        // NOVO: Função para lidar com a derrota de um chefe (movida para game.js)
        function handleBossDefeat(boss) {
            // CORREÇÃO DE SEGURANÇA: Impede a execução se o chefe for nulo ou indefinido.
            if (!boss) return;

            // --- LÓGICA DE REATORAÇÃO (COEXISTÊNCIA) ---
            const isClassBased = boss instanceof Enemy;
            const data = isClassBased ? boss : boss.userData;
            const position = isClassBased ? boss.mesh.position : boss.position;
            // --- FIM DA LÓGICA DE REATORAÇÃO ---

            score += data.score;
            gainExperience(data.score);
            
            const numDrops = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < numDrops; i++) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
                spawnRandomItem(position.clone().add(offset));
            }

            if (data.type === 'archlich') {
                showSpecialLevelUpOptions();
            }
            if (data.type === 'storm_sovereign') {
                // Limpa os conduítes e raios restantes
                stormConduits.forEach(c => scene.remove(c));
                stormConduits.length = 0;
                conduitBeams.forEach(b => scene.remove(b));
                conduitBeams.length = 0;
            }
            if (data.type === 'glacial_matriarch' && data.isEnraged) {
                triggerBlizzard(false); // Desativa a nevasca
            }
            // Remove os cacos de gelo restantes
            if (data.shardShields) {
                data.shardShields.forEach(shard => scene.remove(shard));
                data.shardShields.length = 0;
            }
            isBossWave = false;
            currentBoss = null;
            updateUI();
        }

        function createIceShardShield(boss, count = 5) {
            const shardGeo = new THREE.BoxGeometry(0.2, 1.5, 0.2);
            const shardMat = new THREE.MeshLambertMaterial({ color: 0xE0FFFF, emissive: 0xADD8E6, emissiveIntensity: 1 });

            for (let i = 0; i < count; i++) {
                const shard = new THREE.Mesh(shardGeo, shardMat);
                shard.userData.isShield = true; // Flag para colisão de projétil
                shard.userData.angle = (boss.userData.shardShields.length / boss.userData.maxShards) * Math.PI * 2;
                shard.userData.radius = 3.5;
                shard.userData.boss = boss; // Referência ao chefe
                boss.userData.shardShields.push(shard);
                scene.add(shard);
            }
        }

        function createStormConduits(boss, count) {
            const conduitGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
            const conduitMat = new THREE.MeshLambertMaterial({ color: 0x9400D3, emissive: 0x8A2BE2, emissiveIntensity: 1.5 });

            for (let i = 0; i < count; i++) {
                const conduit = new THREE.Mesh(conduitGeo, conduitMat);
                const angle = (i / count) * Math.PI * 2;
                const radius = 20;
                conduit.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
                
                conduit.userData = {
                    isConduit: true,
                    boss: boss,
                    hp: boss.userData.maxHP / count,
                    maxHP: boss.userData.maxHP / count
                };
                
                stormConduits.push(conduit);
                scene.add(conduit);
            }
            updateConduitBeams();
        }




        // Função startGame agora recebe o nome do jogador e uma flag de debug
        window.startGame = function (name, forceDebug = false) {
            playerName = name || 'Mago Anônimo';
            isDebugMode = forceDebug; // NOVO: Ativa o modo debug via flag
            resetPlayerState();
            if (freezingAuraMesh) freezingAuraMesh.visible = false; // NOVO: Esconde a aura
            if (expBoostAuraMesh) expBoostAuraMesh.visible = false; // NOVO: Esconde a aura de EXP
            expBoostTimer = 0; // NOVO: Reseta timer de EXP
            if (goblinKingAuraMesh) goblinKingAuraMesh.visible = false; // NOVO: Esconde a aura do chefe
            if (rangeIndicator) rangeIndicator.visible = false; // NOVO: Esconde indicador de alcance

            resetWaveState();
            // Limpa conduítes e raios de jogos anteriores
            stormConduits.forEach(c => scene.remove(c));
            stormConduits.length = 0;
            conduitBeams.forEach(b => scene.remove(b));
            conduitBeams.length = 0;

            triggerBlizzard(false); // Garante que a nevasca não esteja ativa

            // NOVO: Se for modo debug, spawna todos os power-ups
            if (isDebugMode) {
                showDebugWindow(); // NOVO: Mostra a janela de atalhos
                Object.keys(powerUpProps).forEach(type => {
                    createPowerUp(type);
                });
            } else {
                hideDebugWindow(); // NOVO: Garante que a janela esteja oculta
            }
            
            // CORREÇÃO: Define como "jogo iniciado" APENAS DEPOIS que tudo foi criado
            isGameOver = false;
        }
        
        function createLightningArc(p1, p2) {
            const distance = p1.distanceTo(p2);
            const arcGeo = new THREE.CylinderGeometry(0.05, 0.05, distance, 5);
            const arcMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const arc = new THREE.Mesh(arcGeo, arcMat);
            
            arc.position.copy(p1).lerp(p2, 0.5);
            arc.lookAt(p2);
            arc.rotateX(Math.PI / 2);
            
            arc.userData.isArc = true;

            // O arco é removido no próximo frame, criando o efeito de piscar
            return arc;
        }

        function updateBossShields() {
            enemies.forEach(enemyItem => {
                // Pode ser uma instância da classe Enemy ou um mesh puro
                const isClassBased = enemyItem instanceof Enemy;
                const mesh = isClassBased ? enemyItem.mesh : enemyItem;
                const data = mesh.userData || (isClassBased ? enemyItem : {});

                if (data.type === 'glacial_matriarch' && data.shardShields) {
                    const shields = data.shardShields;
                    shields.forEach((shard) => {
                        shard.userData.angle += 0.01;
                        const x = mesh.position.x + Math.cos(shard.userData.angle) * shard.userData.radius;
                        const z = mesh.position.z + Math.sin(shard.userData.angle) * shard.userData.radius;
                        shard.position.set(x, 1.5, z);
                        shard.lookAt(mesh.position);
                    });
                }
            });
        }

        function triggerBlizzard(isActive) {
            if (isActive) {
                scene.fog.near = 10;
                scene.fog.far = 35;
            } else {
                scene.fog.near = mapSize * 0.5;
                scene.fog.far = mapSize * 2.0;
            }
        }

        function updateConduitBeams() {
            // Limpa raios antigos
            conduitBeams.forEach(beam => scene.remove(beam));
            conduitBeams.length = 0;

            if (stormConduits.length < 2) return;

            for (let i = 0; i < stormConduits.length; i++) {
                const startPoint = stormConduits[i].position;
                const endPoint = stormConduits[(i + 1) % stormConduits.length].position;

                const distance = startPoint.distanceTo(endPoint);
                const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
                const beamMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.6 });
                const beam = new THREE.Mesh(beamGeo, beamMat);

                beam.position.copy(startPoint).lerp(endPoint, 0.5);
                beam.lookAt(endPoint);
                beam.rotateX(Math.PI / 2);

                beam.userData.isBeam = true;
                conduitBeams.push(beam);
                scene.add(beam);
            }
        }

        function checkBeamCollisions() {
            if (conduitBeams.length === 0) return;

            const playerBBox = new THREE.Box3().setFromObject(player);
            for (const beam of conduitBeams) {
                if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(beam))) {
                    damagePlayer(0.5); // Dano contínuo
                    break;
                }
            }
        }

        function endGame() {
            isGameOver = true;
            
            finalScoreDisplay.textContent = score;
            gameOverModal.classList.remove('hidden');

            // Salva a pontuação com o nome do jogador e as estatísticas de abates
            window.saveScore(score, playerName, killStats, playerLevel, currentWave);
            
            if (repulsionBubbleMesh) repulsionBubbleMesh.visible = false;
            // Limpa conduítes e raios ao final do jogo
            stormConduits.forEach(c => scene.remove(c));
            if (magicShieldMesh) scene.remove(magicShieldMesh);
            stormConduits.length = 0;
            conduitBeams.forEach(b => scene.remove(b));
            conduitBeams.length = 0;

            triggerBlizzard(false); // Garante que a nevasca seja desativada
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