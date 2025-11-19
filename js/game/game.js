        // Variáveis do Three.js
        let scene, camera, renderer;
        let raycaster;
        const pointer = new THREE.Vector2();
        
        // NOVO: Variáveis do Camera Shake
        let cameraShakeIntensity = 0;
        let cameraShakeDuration = 0;

        let player;
        let isGameOver = true; // Inicia como TRUE para mostrar o menu
        let isGamePaused = false; // NOVO: Flag para pausar o jogo durante o level up
        let keys = {};
        const stormConduits = [];
        const conduitBeams = [];
        const enemies = []; const powerUps = [];
        const traps = [];
        const firePuddles = [];

        // Variável temporária para checagem de colisão
        let tempPlayer; 
        let targetRing;

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
            tempPlayer = createWizardModel();
            createRepulsionBubbleMesh();
            createFreezingAuraMesh();
            flamingAuraMesh = createFlamingAuraMesh(); scene.add(flamingAuraMesh);
            electrifyingAuraMesh = createElectrifyingAuraMesh(); scene.add(electrifyingAuraMesh);

            const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 100);
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
            targetRing = new THREE.Mesh(ringGeometry, ringMaterial);
            targetRing.rotation.x = -Math.PI / 2;
            targetRing.position.y = 0.01;
            scene.add(targetRing);
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

                // NOVO: Comando de debug para subir de nível instantaneamente
                if ((e.key === 'l' || e.key === 'L') && playerName === 'a' && player && !isGameOver) {
                    // Calcula o XP necessário e o concede para acionar o level up naturalmente
                    const xpNeeded = player.userData.experienceForNextLevel - player.experiencePoints;
                    player.gainExperience(xpNeeded > 0 ? xpNeeded : 1); // Concede o XP ou 1 se já estiver cheio
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
                if (player) player.attemptSpecialAttack();
            }
        }
        
        function createEnemy(type, position, isSummon = false) {
            let enemy;

            if (type === 'goblin') {
                enemy = new Goblin();
            } else if (type === 'orc') {
                enemy = new Orc();
            } else if (type === 'troll') {
                enemy = new Troll();
            } else if (type === 'kobold') {
                enemy = new Kobold();
            } else if (type === 'kobold_warrior') {
                enemy = new KoboldWarrior();
            } else if (type === 'kobold_shaman') {
                enemy = new KoboldShaman();
            } else if (type === 'skeleton_archer') {
                enemy = new SkeletonArcher();
            } else if (type === 'necromancer') {
                enemy = new Necromancer();
            } else if (type === 'ghost') {
                enemy = new Ghost();
            } else if (type === 'fire_elemental') {
                enemy = new FireElemental();
            } else if (type === 'ice_elemental') {
                enemy = new IceElemental();
            } else if (type === 'summoner_elemental') {
                enemy = new SummonerElemental();
            } else if (type === 'goblin_king') {
                enemy = new GoblinKing();
            } else if (type === 'kobold_king') {
                enemy = new KoboldKing();
            } else if (type === 'juggernaut_troll') {
                enemy = new JuggernautTroll();
            } else if (type === 'archlich') {
                enemy = new Archlich();
            } else if (type === 'magma_colossus') {
                enemy = new MagmaColossus();
            } else if (type === 'glacial_matriarch') {
                enemy = new GlacialMatriarch();
            } else {
                // Lógica antiga para inimigos não refatorados
                return; // Impede a criação de inimigos não refatorados por enquanto
            }

            enemy.position.copy(position);
            enemies.push(enemy);
            scene.add(enemy);

            // NOVO: Adiciona propriedades para o Mestre Elemental
            // ... (outras lógicas específicas de chefes que serão refatoradas depois)

            // A criação da UI já é feita no construtor da classe Enemy
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

                // A classe Enemy agora lida com sua própria lógica de movimento, status e ataque.
                if (enemy.isAlive) {
                    let currentSpeed = enemy.speed;
                    // Aplica bônus de aura do Rei Goblin
                    if (goblinKingAura && enemy.type === 'Goblin' && !enemy.userData.isBoss && enemy.position.distanceToSquared(currentBoss.position) < auraRadiusSq) {
                        currentSpeed *= speedBoost;
                    }
                    // Define o alvo (jogador ou clone)
                    const target = (clone && cloneTimer > 0 && enemy.type !== 'Fantasma' && !enemy.userData.isBoss) ? clone : player;
                    
                    enemy.update(player, target, currentSpeed);
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
                    if (repulsionBubbleTimer <= 0 && player) {
                        player.takeDamage(0.2, true); // Dano baixo, mas constante e elemental
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
                if (repulsionBubbleTimer > 0) repulsionBubbleTimer--; // NOVO: Decrementa timer da bolha
                if (freezingAuraTimer > 0) freezingAuraTimer--; // NOVO: Decrementa timer da aura
                if (flamingAuraTimer > 0) flamingAuraTimer--;
                if (electrifyingAuraTimer > 0) electrifyingAuraTimer--;
                if (expBoostTimer > 0) expBoostTimer--; // NOVO: Decrementa timer do EXP


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
                player.update(keys, obstacles, pointer, camera, targetRing);
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

                updateUI(window.upgrades); // Garante que a UI seja atualizada a cada frame

                // 6. Renderização
                renderer.render(scene, camera);
            }

    // NOVO: Função para lidar com a derrota de um chefe (movida para game.js)
    function handleBossDefeat(boss) {
        if (player) player.score += boss.userData.score;
        if (player) player.gainExperience(boss.userData.score);
        
        const numDrops = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numDrops; i++) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            spawnRandomItem(boss.position.clone().add(offset));
        }

        if (boss.userData.type === 'archlich') {
            showSpecialLevelUpOptions(window.upgrades);
        }
        if (boss.userData.type === 'storm_sovereign') {
            // Limpa os conduítes e raios restantes
            stormConduits.forEach(c => scene.remove(c));
            stormConduits.length = 0;
            conduitBeams.forEach(b => scene.remove(b));
            conduitBeams.length = 0;
        }
        if (boss.userData.type === 'glacial_matriarch' && boss.userData.isEnraged) {
            triggerBlizzard(false); // Desativa a nevasca
        }
        // Remove os cacos de gelo restantes
        if (boss.userData.shardShields) {
            boss.userData.shardShields.forEach(shard => scene.remove(shard));
            boss.userData.shardShields.length = 0;
        }
        isBossWave = false;
        currentBoss = null;
        updateUI(window.upgrades);
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




    // Função startGame agora recebe o nome do jogador
    window.startGame = function (name) {
        playerName = name || 'Mago Anônimo';
        // Remove o jogador antigo e cria um novo para garantir um estado limpo.
        if (player) scene.remove(player);
        player = new Player(); scene.add(player);
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
        enemies.forEach(enemy => {
            if (enemy.userData.type === 'glacial_matriarch' && enemy.userData.shardShields) {
                const shields = enemy.userData.shardShields;
                shields.forEach((shard, index) => {
                    shard.userData.angle += 0.01;
                    const x = enemy.position.x + Math.cos(shard.userData.angle) * shard.userData.radius;
                    const z = enemy.position.z + Math.sin(shard.userData.angle) * shard.userData.radius;
                    shard.position.set(x, 1.5, z);
                    shard.lookAt(enemy.position);
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
                if (player) player.takeDamage(0.5, true); // Dano elemental contínuo
                break;
            }
        }
    }

    function endGame() {
        isGameOver = true;
        
        finalScoreDisplay.textContent = player.score;
        gameOverModal.classList.remove('hidden');
        
        // Salva a pontuação com o nome do jogador e as estatísticas de abates
        window.saveScore(player.score, playerName, player.killStats, player.level, currentWave);
        
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
        player = new Player(); scene.add(player);
        animate(); // Inicia o loop do jogo
        // A tela de menu fica visível no início (isGameOver = true)
};
