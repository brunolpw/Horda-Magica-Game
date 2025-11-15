        // Variáveis do Three.js
        let scene, camera, renderer;
        let raycaster, mouse;
        const pointer = new THREE.Vector2();
        
        let player, targetRing;
        let playerName = 'Mago Anônimo'; // NOVO: Nome do jogador
        let score = 0;
        let playerHP = 100;
        let maxHP = 100;
        let killPoints = 0;
        const maxKillPoints = 5; // NOVO: Contadores de abates por tipo
        let killStats = { goblin: 0, orc: 0, troll: 0, necromancer: 0, ghost: 0, skeleton: 0, skeleton_warrior: 0, skeleton_archer: 0 };
        let killsSinceLastPotion = 0; // NOVO: Contador para spawn de poção por kill
        const killsPerItemSpawn = 30; // NOVO: Limite de abates para garantir um item aleatório

        // NOVO: Timers e referências para os novos poderes
        let tripleShotTimer = 0;
        // let shieldTimer = 0; // REMOVIDO: O escudo não usa mais timer
        // let shieldSpheres = []; // Antigo
        let shieldLayers = []; // NOVO: Array de camadas        
        let expBoostAuraMesh; // NOVO: Efeito visual para o bônus de EXP
        let expBoostTimer = 0; // NOVO: Timer para o EXP em dobro

        // NOVO: Indicador de alcance da habilidade
        let rangeIndicator;
        let rangeIndicatorTimer = 0;

        // NOVO: Variáveis de Level
        let playerLevel = 1;
        let experiencePoints = 0;
        const baseExperience = 100; // XP base para o Lvl 2
        let pendingLevelUps = 0; // NOVO: Contador para level ups pendentes
        // NOVO: Cura passiva (Lvl 3+)
        let passiveHealTimer = 0;
        const passiveHealInterval = 300; // 5 segundos (60fps)


        // NOVO: Power-up Aura Congelante
        let freezingAuraTimer = 0;
        let freezingAuraMesh;
let goblinKingAuraMesh; // NOVO: Malha para a aura do Rei Goblin

        // NOVO: Partículas de fumaça para a aura
        let smokeParticles = [];
        const numSmokeParticles = 50;
        
        // REMOVIDO: As habilidades de combate agora são gerenciadas pelo novo sistema de upgrades
        // let novaBombKills = 0;
        // const killsForNovaBomb = 10;
        let repulsionBubbleTimer = 0; // Timer para o novo power-up
        let repulsionBubbleMesh; // NOVO: Malha para o efeito visual da bolha

        // let chainLightningKills = 0;
        // const killsForChainLightning = 20;
        // let chainLightningCharged = false;

        let clone = null;
        let cloneTimer = 0;

        // NOVO: Variáveis do Camera Shake
        let cameraShakeIntensity = 0;
        let cameraShakeDuration = 0;

        let isGameOver = true; // Inicia como TRUE para mostrar o menu
        let isGamePaused = false; // NOVO: Flag para pausar o jogo durante o level up
        let keys = {};
        let playerSpeed = 0.15;
        const mapSize = 40; // AUMENTADO: Tamanho do mapa (X/Z)

        // Variáveis de Jogo
        const enemies = [];
        const projectiles = [];
        const powerUps = []; 
        const obstacles = []; // NOVO: Array para guardar obstáculos
        let projectileCooldown = 0; // Cooldown do ataque básico
        let baseCooldown = 30; // Cooldown base do ataque
        let specialCooldown = 0; // Cooldown do ataque especial

        // Variáveis do Sistema de Ondas
        let currentWave = 0;
        let enemiesToSpawnThisWave = 0;
        let enemiesAliveThisWave = 0;
        let monstersInPreviousWave = 0; // NOVO: Guarda o total da onda anterior
        // NOVO: Variáveis de Chefe
        let isBossWave = false;
        let currentBoss = null;
        let killsForSoulHarvest = 0; // Contador para o Arquilich

        let intraWaveSpawnTimer = 0;

        const maxActiveEnemies = 40; 
        let powerUpTimer = 0; 

        // Variável temporária para checagem de colisão
        let tempPlayer; 

        // Propriedades das Entidades

        const projectileProps = {
            weak: { damage: 10, color: 0x3d3dff, size: 0.3, speed: 0.3 },
            strong: { damage: 50, color: 0xff3d3d, size: 0.5, speed: 0.4 },
            necro_bolt: { damage: 15, color: 0x9400D3, size: 0.35, speed: 0.15 }, // NOVO: Projétil do Necromante
            arrow: { damage: 5, color: 0xCD853F, size: 0.1, speed: 0.5 } // NOVO: Flecha do Arqueiro
        };
        
        // NOVO: Propriedades dos Power-Ups (combinado poção e novos poderes)
        const powerUpProps = {
            potion: { healAmount: 30, color: 0xff4d4d, geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8) },
            tripleShot: { color: 0x00A8FF, geometry: new THREE.TorusGeometry(0.3, 0.1, 8, 16) }, // Duração dinâmica
            shield: { color: 0xFFD700, geometry: new THREE.IcosahedronGeometry(0.3, 0) }, // REMOVIDO: duration
            repulsionBubble: { duration: 900, color: 0xADD8E6, geometry: new THREE.SphereGeometry(0.3, 16, 16) }, // 15 segundos (900 / 60)
            clone: { duration: 1200, color: 0x87CEEB, geometry: new THREE.OctahedronGeometry(0.4) }, // NOVO: 20 segundos
            freezingAura: { duration: 1200, color: 0x87CEFA, geometry: new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8) }, // NOVO: 20 segundos
            expBoost: { duration: 3600, color: 0xFFFF00, geometry: new THREE.TorusKnotGeometry(0.3, 0.08, 50, 8) } // NOVO: EXP em dobro por 60s
        };

        // NOVO: Estrutura de dados para as melhorias com níveis
        const upgrades = {
            // --- MELHORIAS DE ATRIBUTOS (PASSIVAS) ---
            increase_damage: {
                type: 'attribute',
                icon: '💥',
                title: "Poder Arcano",
                maxLevel: 5,
                description: (level) => `Aumenta o dano do ataque básico em +10%.`,
                apply: () => { /* O dano é calculado dinamicamente */ }
            },
            increase_attack_speed: {
                type: 'attribute',
                icon: '⚡️',
                title: "Celeridade",
                maxLevel: 5,
                description: (level) => `Aumenta a velocidade de ataque em +10%.`,
                apply: () => { baseCooldown = Math.max(5, baseCooldown * 0.90); }
            },
            increase_move_speed: {
                type: 'attribute',
                icon: '🏃',
                title: "Passos Ligeiros",
                maxLevel: 5,
                description: (level) => `Aumenta sua velocidade de movimento em +7%.`,
                apply: () => { playerSpeed *= 1.07; }
            },
            increase_max_hp: {
                type: 'attribute',
                icon: '❤️',
                title: "Vigor",
                maxLevel: 5,
                description: (level) => `Aumenta a vida máxima em +20.`,
                apply: () => { maxHP += 20; playerHP += 20; }
            },
            increase_xp_gain: {
                type: 'attribute',
                icon: '🎓',
                title: "Sede de Conhecimento",
                maxLevel: 3,
                description: (level) => `Aumenta o ganho de experiência em +20%.`,
                apply: () => { /* A EXP é calculada dinamicamente */ }
            },
            auto_heal: {
                type: 'attribute',
                icon: '✨',
                title: "Regeneração",
                maxLevel: 5,
                description: (level) => level < 5 ? `Recupera ${level + 1} de HP a cada 5 segundos.` : `Recupera 5 de HP a cada 3 segundos.`,
                apply: () => { /* A lógica é gerenciada no loop animate */ }
            },
            // --- HABILIDADES ATIVAS ---
            missil_magico: {
                type: 'active', icon: '🔥', title: "Míssil Mágico", maxLevel: 5,
                getKillCost: (level) => level < 4 ? 5 : 10,
                description: (level) => `Dispara ${level < 4 ? 1 : (level === 4 ? 2 : 3)} míssil(eis) teleguiado(s) no(s) inimigo(s) mais forte(s).`
            },
            explosao_energia: {
                type: 'active', icon: '🌀', title: "Explosão de Energia", maxLevel: 5, getKillCost: () => 10,
                description: (level) => `Libera uma explosão de projéteis em todas as direções. Mais projéteis com o nível.`
            },
            corrente_raios: {
                type: 'active', icon: '⛓️', title: "Corrente de Raios", maxLevel: 5, getKillCost: () => 8,
                description: (level) => `Eletrifica seu próximo ataque, ricocheteando e aplicando dano contínuo.`
            },
            carga_explosiva: {
                type: 'active', icon: '💣', title: "Carga Explosiva", maxLevel: 5, getKillCost: () => 20,
                description: (level) => `Cria uma grande explosão. Nv. 4+ libera fragmentos explosivos.`
            }
        };

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

            // 5. Chão (Grama e Terra) - NOVO
            createBlendedFloor();

            // 6. Raycaster para mira
            raycaster = new THREE.Raycaster();

            // 7. Configura Obstáculos
            populateObstacles(); // NOVO: Cria árvores e paredes

            // 8. Setup de Inputs e Eventos
            setupInputs();

            // 9. Cria o Player Temporário para Colisão (NOVO)
            tempPlayer = createWizardModel();

            // NOVO: Cria a malha da bolha de repulsão
            createRepulsionBubbleMesh();

            // NOVO: Cria a malha da aura congelante
            createFreezingAuraMesh();

            // NOVO: Cria as partículas de fumaça
            createSmokeParticles();

            // NOVO: Cria a malha da aura de EXP
            createExpBoostAuraMesh();

            // NOVO: Cria o indicador de alcance
            createRangeIndicator();

            // NOVO: Cria a malha da aura do Rei Goblin
            createGoblinKingAuraMesh();

            // 10. O jogo inicia no menu (isGameOver = true)
        }
        // NOVO: Função para criar o chão misturado (Terra e Grama)
        function createBlendedFloor() {
            const floorSize = mapSize * 2;
            
            // 1. Base (Terra/Dirt)
            const dirtGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
            const dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 }); // Terra Marrom
            const dirtFloor = new THREE.Mesh(dirtGeometry, dirtMaterial);
            dirtFloor.rotation.x = -Math.PI / 2;
            dirtFloor.position.y = 0; // Base floor
            dirtFloor.receiveShadow = true;
            scene.add(dirtFloor);

            // 2. Grama (Patches)
            const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // Verde Oliva
            const numPatches = 300; 
            const patchSize = 3; 
            const halfFloor = mapSize;

            for (let i = 0; i < numPatches; i++) {
                // Varia o tamanho do patch de grama
                const patchGeometry = new THREE.PlaneGeometry(patchSize * (0.5 + Math.random()), patchSize * (0.5 + Math.random()));
                
                // Posiciona a grama aleatoriamente dentro do mapa
                const x = (Math.random() * floorSize) - halfFloor;
                const z = (Math.random() * floorSize) - halfFloor;

                const grassPatch = new THREE.Mesh(patchGeometry, grassMaterial);
                grassPatch.rotation.x = -Math.PI / 2;
                // Coloca a grama ligeiramente acima da terra para evitar z-fighting
                grassPatch.position.set(x, 0.01, z); 
                grassPatch.receiveShadow = true;
                scene.add(grassPatch);
            }
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

        // NOVO: Função para criar a malha visual da bolha de repulsão
        function createRepulsionBubbleMesh() {
            const bubbleRadius = 4; // Deve ser o mesmo que repulsionRadius em updateEnemies
            const geometry = new THREE.SphereGeometry(bubbleRadius, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0xADD8E6, // Azul claro, como no power-up
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide // Para ver de dentro e de fora
            });
            repulsionBubbleMesh = new THREE.Mesh(geometry, material);
            scene.add(repulsionBubbleMesh);
        }

        // NOVO: Função para criar a malha visual da Aura Congelante
        function createFreezingAuraMesh() {
            const auraRadius = 6; // Raio da aura
            const geometry = new THREE.TorusGeometry(auraRadius, 0.1, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: 0x87CEFA, // Azul Gelo
                transparent: true,
                opacity: 0.7
            });
            freezingAuraMesh = new THREE.Mesh(geometry, material);
            freezingAuraMesh.rotation.x = Math.PI / 2; // Deita o anel no chão
            scene.add(freezingAuraMesh);
        }
        
        // NOVO: Função para criar a malha visual da Aura do Rei Goblin
        function createGoblinKingAuraMesh() {
            const auraRadius = 15; // Raio da aura de velocidade
            const geometry = new THREE.TorusGeometry(auraRadius, 0.2, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: 0x32CD32, // Verde Lima
                transparent: true,
                opacity: 0.5
            });
            goblinKingAuraMesh = new THREE.Mesh(geometry, material);
            goblinKingAuraMesh.rotation.x = Math.PI / 2; // Deita o anel no chão
            goblinKingAuraMesh.visible = false; // Começa invisível
            scene.add(goblinKingAuraMesh);
        }

        // NOVO: Função para criar as partículas de fumaça
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

        // NOVO: Função para criar a malha visual da Aura de EXP
        function createExpBoostAuraMesh() {
            const geometry = new THREE.TorusGeometry(0.7, 0.05, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFF00, // Amarelo, como no power-up
                transparent: true,
                opacity: 0.8
            });
            expBoostAuraMesh = new THREE.Mesh(geometry, material);
            expBoostAuraMesh.rotation.x = Math.PI / 2; // Deita o anel no chão
            expBoostAuraMesh.visible = false; // Começa invisível
            scene.add(expBoostAuraMesh);
        }

        // NOVO: Função para criar o indicador de alcance
        function createRangeIndicator() {
            const geometry = new THREE.RingGeometry(1, 1.1, 64); // Raio inicial, será ajustado
            const material = new THREE.MeshBasicMaterial({ color: 0xffc700, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
            rangeIndicator = new THREE.Mesh(geometry, material);
            rangeIndicator.rotation.x = -Math.PI / 2;
            rangeIndicator.visible = false;
            scene.add(rangeIndicator);
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
        
        function createWizardModel() {
            const group = new THREE.Group();
            
            // Robe/Corpo (Cilindro com base mais larga)
            const robeGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 8);
            const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x5b3c8f }); // Roxo Profundo
            const robe = new THREE.Mesh(robeGeometry, robeMaterial);
            robe.position.y = 0.5; // Base no chão
            robe.castShadow = true;
            group.add(robe);

            // Cabeça (Esfera)
            const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc99 }); // Cor de pele
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.25;
            head.castShadow = true;
            group.add(head);

            // Chapéu (Cone)
            const hatGeometry = new THREE.ConeGeometry(0.35, 0.6, 8);
            const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x3a255a }); // Roxo Escuro
            const hat = new THREE.Mesh(hatGeometry, hatMaterial);
            hat.position.y = 1.7;
            hat.castShadow = true;
            group.add(hat);

            return group;
        }

        // NOVO: Modelo para o Rei Goblin
        function createGoblinKingModel() {
            const group = createGoblinModel(); // Começa com o modelo base
            
            // Aumenta o tamanho
            group.scale.set(2.0, 2.0, 2.0);

            // Muda a cor para um verde mais escuro e ameaçador
            const darkGreenMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 }); // Verde Mar
            group.traverse(child => {
                if (child.isMesh) {
                    child.material = darkGreenMaterial;
                }
            });

            // Adiciona uma coroa
            const crownGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
            const crownMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Dourado
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 1.0; // Posição relativa à cabeça do goblin (que está em 0.7)
            group.add(crown);

            return group;
        }

        // NOVO: Modelo para o Juggernaut Troll
        function createJuggernautTrollModel() {
            const group = createTrollModel(); // Começa com o modelo base

            // Aumenta o tamanho
            group.scale.set(1.5, 1.5, 1.5);

            // Adiciona cristais/pedras nas costas
            const crystalMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 }); // Cinza Ardósia
            const numCrystals = 8;
            for (let i = 0; i < numCrystals; i++) {
                const crystalGeometry = new THREE.ConeGeometry(0.2, 0.8, 4);
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);

                // Posiciona aleatoriamente no corpo
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.5 + 0.3;
                crystal.position.set(Math.cos(angle) * radius, Math.random() * 1.2 + 0.5, Math.sin(angle) * radius);
                crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                crystal.castShadow = true;
                group.add(crystal);
            }

            return group;
        }

        // NOVO: Modelo para o Arquilich
        function createArchlichModel() {
            const group = createNecromancerModel(); // Começa com o modelo base

            // Muda a cor para um tema mais fantasmagórico
            const lichMaterial = new THREE.MeshLambertMaterial({
                color: 0xADD8E6, // Azul claro
                transparent: true,
                opacity: 0.8
            });
            group.traverse(child => {
                if (child.isMesh) {
                    child.material = lichMaterial;
                }
            });

            // Adiciona uma aura esquelética
            const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const auraMaterial = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, transparent: true, opacity: 0.2, side: THREE.BackSide });
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            group.add(aura);

            return group;
        }

        // --- NOVAS FUNÇÕES DE MODELO DOS INIMIGOS ---

        function createGoblinModel() {
            const group = new THREE.Group();
            const material = new THREE.MeshLambertMaterial({ color: 0x6be070 }); // Verde Goblin

            // Corpo (esfera achatada)
            const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 6);
            const body = new THREE.Mesh(bodyGeometry, material);
            body.scale.y = 0.8; // Achata
            body.position.y = 0.3;
            body.castShadow = true;
            group.add(body);

            // Cabeça
            const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
            const head = new THREE.Mesh(headGeometry, material);
            head.position.y = 0.7;
            head.castShadow = true;
            group.add(head);

            return group;
        }

        function createOrcModel() {
            const group = new THREE.Group();
            const material = new THREE.MeshLambertMaterial({ color: 0xe0a06b }); // Cor de pele de Orc

            // Corpo (caixa robusta)
            const bodyGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.5);
            const body = new THREE.Mesh(bodyGeometry, material);
            body.position.y = 0.45;
            body.castShadow = true;
            group.add(body);

            // Cabeça
            const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const head = new THREE.Mesh(headGeometry, material);
            head.position.y = 1.1;
            head.castShadow = true;
            group.add(head);

            return group;
        }

        function createTrollModel() {
            const group = new THREE.Group();
            const material = new THREE.MeshLambertMaterial({ color: 0x6b75e0 }); // Azul/Roxo de Troll

            // Corpo (cilindro grande)
            const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
            const body = new THREE.Mesh(bodyGeometry, material);
            body.position.y = 0.75;
            body.castShadow = true;
            group.add(body);

            // Cabeça
            const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
            const head = new THREE.Mesh(headGeometry, material);
            head.position.y = 1.8;
            head.castShadow = true;
            group.add(head);

            return group;
        }

        function createNecromancerModel() {
            const group = new THREE.Group();
            
            // Robe (similar ao mago, mas mais escuro)
            const robeMaterial = new THREE.MeshLambertMaterial({ color: 0x3D0C02 }); // Marrom escuro
            const robeGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8);
            const robe = new THREE.Mesh(robeGeometry, robeMaterial);
            robe.position.y = 0.75;
            robe.castShadow = true;
            group.add(robe);

            // Capuz (cone sobre a cabeça)
            const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0x8A2BE2 }); // Roxo
            const hoodGeometry = new THREE.ConeGeometry(0.4, 0.7, 8);
            const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
            hood.position.y = 1.6;
            hood.castShadow = true;
            group.add(hood);

            return group;
        }

        // NOVO: Modelo para o Fantasma
        function createGhostModel() {
            const group = new THREE.Group();
            const material = new THREE.MeshLambertMaterial({
                color: 0xe0e0e0,
                transparent: true,
                opacity: 0.7
            });

            // Corpo em forma de sino
            const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.6, 1.2, 8);
            const body = new THREE.Mesh(bodyGeometry, material);
            body.position.y = 0.6;
            body.castShadow = true;
            group.add(body);

            // Cabeça
            const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const head = new THREE.Mesh(headGeometry, material);
            head.position.y = 1.4;
            head.castShadow = true;
            group.add(head);

            return group;
        }

        // NOVO: Modelos para os Esqueletos
        function createSkeletonModel() {
            const group = new THREE.Group();
            const material = new THREE.MeshLambertMaterial({ color: 0xf0e68c }); // Khaki/Osso

            // Corpo
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.3), material);
            body.position.y = 0.6;
            group.add(body);

            // Cabeça
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), material);
            head.position.y = 1.2;
            group.add(head);

            return group;
        }

        function createSkeletonWarriorModel() {
            const group = createSkeletonModel(); // Começa com o esqueleto base
            const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // Cinza

            // Elmo
            const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8), armorMaterial);
            helmet.position.y = 1.3;
            group.add(helmet);

            // Ombros
            const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.25), armorMaterial);
            shoulderL.position.set(-0.3, 0.9, 0);
            group.add(shoulderL);
            const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.25), armorMaterial);
            shoulderR.position.set(0.3, 0.9, 0);
            group.add(shoulderR);

            return group;
        }

        function createSkeletonArcherModel() {
            const group = createSkeletonModel(); // Começa com o esqueleto base
            const bowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Marrom

            // Arco (um Torus cortado)
            const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32, Math.PI), bowMaterial);
            bow.position.set(-0.3, 0.8, 0.2);
            bow.rotation.y = -Math.PI / 4;
            group.add(bow);

            return group;
        }

        // Propriedades das Entidades (ATUALIZADO com Modelos)
        const entityProps = {
            goblin: { hp: 20, speed: 0.05, score: 7, damage: 10, name: "Goblin", modelFn: createGoblinModel, modelHeight: 0.9 },
            orc: { hp: 50, speed: 0.04, score: 15, damage: 15, name: "Orc", modelFn: createOrcModel, modelHeight: 1.35 },
            troll: { hp: 100, speed: 0.03, score: 25, damage: 25, name: "Troll", modelFn: createTrollModel, modelHeight: 2.2 },
            necromancer: { hp: 80, speed: 0.025, score: 35, damage: 10, name: "Necromante", modelFn: createNecromancerModel, modelHeight: 1.9 },
            ghost: { hp: 75, speed: 0.06, score: 30, damage: 25, name: "Fantasma", modelFn: createGhostModel, modelHeight: 1.5 },
            // NOVOS INIMIGOS
            skeleton: { hp: 80, speed: 0.05, score: 35, damage: 25, name: "Esqueleto", modelFn: createSkeletonModel, modelHeight: 1.4 },
            skeleton_warrior: { hp: 200, speed: 0.04, score: 55, damage: 35, name: "Esqueleto Guerreiro", modelFn: createSkeletonWarriorModel, modelHeight: 1.5 },
            skeleton_archer: { hp: 45, speed: 0.05, score: 45, damage: 5, name: "Esqueleto Arqueiro", modelFn: createSkeletonArcherModel, modelHeight: 1.4 },
            // NOVO: Chefe
            goblin_king: { hp: 800, speed: 0.045, score: 500, damage: 30, name: "Rei Goblin", modelFn: createGoblinKingModel, modelHeight: 1.8 },
            juggernaut_troll: { hp: 2500, speed: 0.025, score: 1500, damage: 40, name: "Juggernaut Troll", modelFn: createJuggernautTrollModel, modelHeight: 3.3, armor: 1000 },
            archlich: { hp: 4000, speed: 0.03, score: 3000, damage: 0, name: "Arquilich", modelFn: createArchlichModel, modelHeight: 1.9 }
        };

        // Funções de criação de Obstáculos
        function createTree(position) { // ... (função createTree sem alterações)
            const group = new THREE.Group();

            // Tronco (Cylinder, Marrom) - Altura 3
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1.5;
            trunk.castShadow = true;
            group.add(trunk);

            // Folhagem (Dodecahedron/Cone, Verde)
            const leavesGeometry = new THREE.DodecahedronGeometry(2);
            const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 3.5;
            leaves.castShadow = true;
            group.add(leaves);

            group.position.copy(position);
            group.position.y = 0; 
            
            group.userData.isObstacle = true;
            
            // NOVO: Cria uma malha de colisão invisível que é pequena (apenas o tronco/base)
            // Usamos uma BoxGeometry de 1x1x1 na base para uma colisão precisa no chão.
            const collisionGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0); 
            const collisionMesh = new THREE.Mesh(collisionGeometry, new THREE.MeshBasicMaterial({ visible: false }));
            collisionMesh.position.y = 0.5; // Centraliza a malha de colisão no chão
            group.add(collisionMesh);
            group.userData.collisionMesh = collisionMesh; // Referência para ser usada no check

            scene.add(group);
            obstacles.push(group);
        }

        function createWall(position, width, depth) {
            const height = 2;
            const wallGeometry = new THREE.BoxGeometry(width, height, depth);
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 }); // Cinza de pedra
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            wall.position.copy(position);
            wall.position.y = height / 2;
            wall.castShadow = true;

            wall.userData.isObstacle = true;
            
            scene.add(wall);
            obstacles.push(wall);
            return wall; // CORREÇÃO: Retorna o objeto da parede criada
        }

        function populateObstacles() {
            // Limpa obstáculos antigos (necessário para o restart)
            obstacles.forEach(o => scene.remove(o));
            obstacles.length = 0;

            const numTrees = 50;
            const boundary = mapSize - 2; // Garante que não spawne na borda // ... (resto da função populateObstacles sem alterações)
            for (let i = 0; i < numTrees; i++) {
                const x = (Math.random() * boundary * 2) - boundary;
                const z = (Math.random() * boundary * 2) - boundary;
                createTree(new THREE.Vector3(x, 0, z));
            }

            const numWalls = 15;
            for (let i = 0; i < numWalls; i++) {
                const x = (Math.random() * boundary * 2) - boundary;
                const z = (Math.random() * boundary * 2) - boundary;
                // Varia a largura e profundidade para criar diferentes tipos de parede
                const width = Math.random() < 0.5 ? 5 : 1; 
                const depth = width === 1 ? 5 : 1;
                createWall(new THREE.Vector3(x, 0, z), width, depth);
            }
        }


        function createPlayer() {
            // Usa o novo modelo
            player = createWizardModel();
            player.position.set(0, 0, 0); // O modelo já está centralizado
            player.userData = { maxHP: maxHP }; // Guarda os dados do player no grupo
            scene.add(player);

            const ringGeometry = new THREE.RingGeometry(1.5, 1.6, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
            targetRing = new THREE.Mesh(ringGeometry, ringMaterial);
            targetRing.rotation.x = -Math.PI / 2;
            targetRing.position.y = 0.01;
            scene.add(targetRing);
        }

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
                electrifiedTimer: 0 // NOVO: Timer para o status Eletrificado
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
        
        // Cria a UI do Inimigo (Nome, HP, Marcador)
        function createEnemyUI(enemy, name) {
            // 1. Cria o Label do Nome
            const label = document.createElement('div');
            label.className = 'enemy-label';
            label.textContent = name;
            enemyLabelsContainer.appendChild(label);
            
            // 2. NOVO: Cria a Barra de Vida
            const hpBarContainer = document.createElement('div');
            hpBarContainer.className = 'enemy-hp-bar';
            
            const hpFill = document.createElement('div');
            hpFill.className = 'enemy-hp-fill';
            hpBarContainer.appendChild(hpFill);
            
            // NOVO: Cria a Barra de Armadura (se necessário)
            const armorBarContainer = document.createElement('div');
            armorBarContainer.className = 'enemy-armor-bar';
            const armorFill = document.createElement('div');
            armorFill.className = 'enemy-hp-fill'; // Reutiliza a classe, mas muda a cor
            armorFill.style.backgroundColor = '#A9A9A9'; // Cinza
            armorBarContainer.appendChild(armorFill);

            enemyLabelsContainer.appendChild(hpBarContainer);
            
            // 3. NOVO: Cria o Marcador de Invocação (se necessário)
            let summonMarker = null;
            if (enemy.userData.isSummon) {
                summonMarker = document.createElement('div');
                summonMarker.className = 'summon-marker';
                enemyLabelsContainer.appendChild(summonMarker);
            }

            // NOVO: Cria o marcador de congelado (inicialmente oculto)
            const frozenMarker = document.createElement('div');
            frozenMarker.className = 'frozen-marker';
            frozenMarker.innerHTML = '❄️'; // Ícone de floco de neve
            frozenMarker.style.display = 'none';
            enemyLabelsContainer.appendChild(frozenMarker);

            // NOVO: Cria o marcador de eletrificado (inicialmente oculto)
            const electrifiedMarker = document.createElement('div');
            electrifiedMarker.className = 'electrified-marker';
            electrifiedMarker.innerHTML = '⚡';
            electrifiedMarker.style.display = 'none';
            enemyLabelsContainer.appendChild(electrifiedMarker);

            // 4. Armazena todas as referências
            enemyLabels.set(enemy.uuid, { nameLabel: label, hpBar: hpBarContainer, hpFill: hpFill, armorBar: armorBarContainer, armorFill: armorFill, summonMarker: summonMarker, frozenMarker: frozenMarker, electrifiedMarker: electrifiedMarker });
        }
        
        // Remove a UI do Inimigo
        function removeEnemyUI(enemy) {
            const uiElements = enemyLabels.get(enemy.uuid);
            if (uiElements) {
                if (uiElements.nameLabel) {
                    enemyLabelsContainer.removeChild(uiElements.nameLabel);
                }
                if (uiElements.hpBar) {
                    enemyLabelsContainer.removeChild(uiElements.hpBar);
                }
                if (uiElements.armorBar && uiElements.armorBar.parentNode === enemyLabelsContainer) {
                    enemyLabelsContainer.removeChild(uiElements.armorBar);
                }
                if (uiElements.summonMarker) { // NOVO
                    enemyLabelsContainer.removeChild(uiElements.summonMarker);
                }
                if (uiElements.frozenMarker) { // NOVO
                    enemyLabelsContainer.removeChild(uiElements.frozenMarker);
                }
                if (uiElements.electrifiedMarker) { // NOVO
                    enemyLabelsContainer.removeChild(uiElements.electrifiedMarker);
                }
                enemyLabels.delete(enemy.uuid);
            }
        }

        // NOVO: Sistema de Ondas por Abates
        function startNextWave() {
            currentWave++;

            // NOVO: Lógica da Onda de Chefe
            if (currentWave % 10 === 0) {
                isBossWave = true;
                enemiesToSpawnThisWave = 1; // Apenas o chefe
                enemiesAliveThisWave = 1;
                monstersInPreviousWave = enemies.length; // Guarda o número atual para a próxima onda normal
                
                // Spawna o chefe correto para a onda
                let bossType;
                switch(currentWave) {
                    case 10:
                        bossType = 'goblin_king';
                        break;
                    case 20:
                        bossType = 'juggernaut_troll';
                        break;
                    case 30:
                        bossType = 'archlich';
                        createBossShield(5); // Cria o escudo de almas para o Arquilich
                        break;
                    // Adicionar outros chefes aqui
                }

                if (bossType) createEnemy(bossType, new THREE.Vector3(0, 0, 0));
                currentBoss = enemies[enemies.length - 1]; // Guarda a referência do chefe
                updateUI();
                return; // Interrompe a lógica de onda normal
            }

            monstersInPreviousWave = enemiesAliveThisWave; // Guarda o valor antes de resetar
            
            let numMonsters;
            if (currentWave === 1) {
                numMonsters = 5; // Onda inicial
            } else {
                // Aumenta em 30% da quantidade da onda anterior
                const growthRate = 1.3; // 30%
                const baseNum = monstersInPreviousWave > 0 ? monstersInPreviousWave : 5;
                numMonsters = Math.floor(baseNum * growthRate);
            }

            enemiesToSpawnThisWave = numMonsters;
            enemiesAliveThisWave = numMonsters;
            updateUI();
        }

        function spawnEnemies() { // Agora gerencia o spawn da onda atual
            // Se não há mais inimigos na onda, inicia a próxima
            if (isBossWave) {
                return; // Não spawna inimigos normais durante a onda de chefe
            }
            if (enemiesAliveThisWave <= 0) {
                startNextWave();
            }

            // Se ainda há inimigos para spawnar e não atingiu o limite da tela
            if (enemiesToSpawnThisWave > 0 && enemies.length < maxActiveEnemies) {
                intraWaveSpawnTimer++;
                // Spawna um inimigo a cada ~1 segundo
                if (intraWaveSpawnTimer >= 60) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = mapSize + 5;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const position = new THREE.Vector3(x, 0, z);

                    // A lógica de qual monstro aparece continua a mesma, baseada no nível da onda
                    let type;
                    const roll = Math.random() * 100;

                    if (currentWave < 5) {
                        type = 'goblin';
                    } else if (currentWave < 8) { // Ondas 5, 6, 7
                        type = roll < 70 ? 'goblin' : 'orc';
                    } else if (currentWave < 10) { // Ondas 8, 9
                        if (roll < 50) type = 'goblin';
                        else if (roll < 80) type = 'orc';
                        else type = 'troll';
                    } else if (currentWave < 12) { // Ondas 10, 11
                        if (roll < 40) type = 'goblin';
                        else if (roll < 65) type = 'orc';
                        else if (roll < 85) type = 'troll';
                        else type = 'necromancer';
                    } else { // Onda 12+
                        if (roll < 20) type = 'goblin';          // 20%
                        else if (roll < 40) type = 'orc';       // 20%
                        else if (roll < 60) type = 'troll';     // 20%
                        else if (roll < 80) type = 'necromancer'; // 20%
                        else type = 'ghost';                    // 20%
                    }

                    createEnemy(type, position);
                    enemiesToSpawnThisWave--;
                    intraWaveSpawnTimer = 0;
                }
            }
        }

        function createProjectile(type, direction, startPosition) {
            let props, geometry, material, isExplosive = false, explosionRadius = 0, explosionDamage = 0;

            if (type === 'explosion') {
                // Granada Explosiva (Roxa)
                geometry = new THREE.SphereGeometry(0.3, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0x9333ea }); // Roxo
                props = { damage: 0, speed: 0.25 }; // Dano direto é 0, velocidade mais lenta (granada)
                isExplosive = true;
            
            } else if (type === 'nova') {
                // NOVO: Projétil da Nova Mágica
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0xFF00FF }); // Rosa/Magenta para Explosão de Energia
                props = { damage: 0, speed: 0.125 }; // Dano definido pela habilidade, velocidade reduzida para teleguiado
                isExplosive = false;
            
            } else if (type === 'necro_bolt') {
                // NOVO: Projétil do Necromante
                props = projectileProps[type];
                geometry = new THREE.SphereGeometry(props.size, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: props.color });
                isExplosive = false;

            } else if (type === 'arrow') {
                // NOVO: Flecha do Arqueiro
                props = projectileProps[type];
                geometry = new THREE.CylinderGeometry(props.size, props.size, 1.0, 4);
                material = new THREE.MeshBasicMaterial({ color: props.color });
                isExplosive = false;

            } else { // weak or strong
                props = projectileProps[type];
                if (!props) {
                    console.error("Tipo de projétil desconhecido:", type);
                    return;
                }
                geometry = new THREE.SphereGeometry(props.size, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: props.color });
            }
            
            const projectile = new THREE.Mesh(geometry, material);

            projectile.position.copy(startPosition);
            // Posição do projétil na altura do centro do player (Y=0.5)
            projectile.position.y = 0.5; 

            projectile.userData = {
                type: type,
                damage: props.damage,
                speed: props.speed,
                direction: direction.normalize(),
                isExplosive: isExplosive,
                explosionRadius: explosionRadius,
                explosionDamage: explosionDamage,
                // NOVO: Adiciona uma flag para controlar a reflexão.
                // Projéteis do jogador não podem ser refletidos.
                // Projéteis inimigos podem ser refletidos uma vez.
                // Projéteis refletidos não podem ser refletidos novamente.
                // null = pode ser refletido, true = já foi refletido, 'homing' = nunca pode ser refletido.
                isHoming: false, // NOVO: Flag para projéteis teleguiados
                target: null,    // NOVO: Alvo do projétil teleguiado
                hasBeenReflected: (type === 'necro_bolt' || type === 'arrow') ? null : true
            };

            projectiles.push(projectile);
            scene.add(projectile);
        }
        
        // Função para criar poção (AGORA CRIA QUALQUER POWER-UP)
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
                // Posição aleatória dentro do mapa
                const x = (Math.random() * mapSize * 2) - mapSize;
                const z = (Math.random() * mapSize * 2) - mapSize;
                powerUp.position.set(x, 0, z);
            }
            
            // Posição Y baseada na altura da geometria
            const height = props.geometry.parameters.height || 0.5;
            powerUp.position.y = height / 2;
            
            powerUp.userData = {
                type: type,
                ...props // Copia todas as propriedades (healAmount, duration, damage, radius)
            };

            powerUps.push(powerUp);
            scene.add(powerUp);
            
            // NOVO: Cria o label para o power-up
            createPowerUpLabel(powerUp, type);
        }
        
        // NOVO: Função para criar label do Power-up
        function createPowerUpLabel(powerUp, type) {
            let text = 'Item';
            switch(type) {
                case 'potion': text = 'Cura'; break;
                case 'tripleShot': text = 'Tiro Múltiplo'; break;
                case 'shield': text = 'Escudo'; break;                
                case 'repulsionBubble': text = 'Bolha Repulsora'; break;
                case 'clone': text = 'Clone'; break; // NOVO: Adiciona o nome correto
                case 'freezingAura': text = 'Aura Congelante'; break; // NOVO
                case 'expBoost': text = 'EXP em Dobro'; break; // NOVO
            }

            const label = document.createElement('div');
            label.className = 'powerup-label';
            label.textContent = text;
            enemyLabelsContainer.appendChild(label); // Reutiliza o container
            powerUpLabels.set(powerUp.uuid, label);
        }

        // NOVO: Função para remover label do Power-up
        function removePowerUpLabel(powerUp) {
            const label = powerUpLabels.get(powerUp.uuid);
            if (label) {
                enemyLabelsContainer.removeChild(label);
                powerUpLabels.delete(powerUp.uuid);
            }
        }

        // Lógica de spawn de poção
        function spawnPowerUps() {
            // --- Lógica por tempo (Chance de 20% a cada 5 segundos) ---
            powerUpTimer++;
            const timeSpawnInterval = 300; 

            // NOVO: A chance de spawn aumenta com o nível do jogador
            // Nível 1: 20%, Nível 2: 30%, Nível 3: 40%, etc. (limitado a 70%)
            const baseSpawnChance = 0.2;
            const spawnChancePerLevel = 0.1;
            const spawnChance = Math.min(0.7, baseSpawnChance + (playerLevel - 1) * spawnChancePerLevel);

            if (powerUpTimer >= timeSpawnInterval) {
                if (Math.random() < spawnChance) { 
                    // NOVO: Todos os itens agora têm a mesma chance de aparecer.
                    const powerUpTypes = Object.keys(powerUpProps);
                    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                    createPowerUp(randomType);
                }
                powerUpTimer = 0;
            }
            
            // --- NOVO: Lógica por kills (SÓ SPAWNA POÇÃO) ---
            if (killsSinceLastPotion >= killsPerItemSpawn) {
                spawnRandomItem();
                killsSinceLastPotion = 0; // Reseta o contador
            }
        }
        
        // NOVO: Função para spawnar um item aleatório (usado pela lógica de kills)
        function spawnRandomItem(position = null) {
            // Pega todos os tipos de power-ups disponíveis (potion, tripleShot, etc.)
            const powerUpTypes = Object.keys(powerUpProps);
            // Escolhe um tipo aleatoriamente
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            // Cria o power-up em uma posição aleatória
            createPowerUp(randomType, position);
        }

        // NOVO: Função para criar o clone
        function createClone() {
            if (clone) { // Remove o clone antigo se existir
                scene.remove(clone);
            }

            clone = createWizardModel();
            clone.position.copy(player.position);

            // Torna o clone semitransparente
            clone.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone(); // Clona o material para não afetar o jogador
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });

            scene.add(clone);
        }
        // NOVO: Função para atualizar a lógica do clone
        function updateClone() {
            if (cloneTimer > 0 && clone) {
                // Lógica de movimento do clone (idêntica à do jogador)
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
                    let obstacleBBox;
                    if (obstacle.userData.collisionMesh) {
                        obstacle.userData.collisionMesh.updateWorldMatrix(true, false);
                        obstacleBBox = new THREE.Box3().setFromObject(obstacle.userData.collisionMesh);
                    } else {
                        obstacleBBox = new THREE.Box3().setFromObject(obstacle);
                    }
                    
                    if (tempCloneBBox.intersectsBox(obstacleBBox)) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (!collisionDetected) {
                    clone.position.copy(newPosition);
                } else {
                    // Tenta deslizar no eixo X
                    const newPositionX = clone.position.clone();
                    newPositionX.x += currentMovement.x;
                    tempPlayer.position.copy(newPositionX);
                    tempPlayer.updateMatrixWorld();
                    if (!obstacles.some(o => new THREE.Box3().setFromObject(tempPlayer).intersectsBox(new THREE.Box3().setFromObject(o.userData.collisionMesh || o)))) {
                        clone.position.x = newPositionX.x;
                    }

                    // Tenta deslizar no eixo Z
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
                // Remove o clone quando o tempo acaba
                scene.remove(clone);
                clone = null;
            }
        }

        // NOVO: Função para disparar o Raio de Energia
        function fireEnergyBeam() {
            // 1. Pega a direção da mira
            raycaster.setFromCamera(pointer, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersection = new THREE.Vector3();
            if (!raycaster.ray.intersectPlane(plane, intersection)) return;

            const direction = new THREE.Vector3().subVectors(intersection, player.position).normalize();

            // 2. Configura o raycaster para a colisão do raio
            const beamRaycaster = new THREE.Raycaster(player.position, direction);

            // 3. Checa colisão com obstáculos para determinar o comprimento do raio
            const obstacleIntersects = beamRaycaster.intersectObjects(obstacles, true);
            let beamLength = mapSize * 2; // Comprimento máximo
            if (obstacleIntersects.length > 0) {
                beamLength = obstacleIntersects.distance;
            }

            // 4. Checa colisão com inimigos
            const enemyIntersects = beamRaycaster.intersectObjects(enemies, true);
            const beamDamage = 150;
            enemyIntersects.forEach(intersect => {
                // Atinge apenas inimigos dentro do comprimento efetivo do raio
                if (intersect.distance < beamLength) {
                    let enemyGroup = intersect.object;
                    while (enemyGroup.parent && !enemyGroup.userData.hp) {
                        enemyGroup = enemyGroup.parent;
                    }
                    if (enemyGroup && enemyGroup.userData.hp) {
                        enemyGroup.userData.hp -= beamDamage;
                        enemyGroup.userData.hitTimer = 10;
                    }
                }
            });

            // 5. Cria o efeito visual do raio
            const beamStart = player.position.clone();
            beamStart.y = 0.5; // Altura do centro do mago
            const beamEnd = beamStart.clone().addScaledVector(direction, beamLength);
            
            const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, beamLength, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 });
            const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);

            beamMesh.position.copy(beamStart).add(beamEnd).divideScalar(2);
            beamMesh.lookAt(beamEnd);
            beamMesh.rotateX(Math.PI / 2);
            scene.add(beamMesh);
            setTimeout(() => scene.remove(beamMesh), 200);
        }

        // NOVO: Função para disparar a Corrente de Raios
        function triggerChainLightning(startEnemy) {
            const level = player.userData.upgrades.corrente_raios || 1;
            const configs = [[2, 5, 20], [3, 8, 30], [5, 11, 40], [7, 14, 50], [10, 17, 55]];
            const [maxJumps, jumpDistance, damage] = configs[level - 1];
            const maxJumpDistanceSq = jumpDistance * jumpDistance;
            const chain = [startEnemy];
            let currentEnemy = startEnemy;

            for (let i = 0; i < maxJumps; i++) {
                let closestEnemy = null; // CORREÇÃO: A variável estava sendo redeclarada
                let minDistanceSq = maxJumpDistanceSq; // Inicia com o alcance máximo

                // Encontra o inimigo mais próximo DENTRO DO ALCANCE
                enemies.forEach(enemy => {
                    if (!chain.includes(enemy)) {
                        const distanceSq = enemy.position.distanceToSquared(currentEnemy.position);
                        if (distanceSq < minDistanceSq) {
                            minDistanceSq = distanceSq;
                            closestEnemy = enemy;
                        }
                    }
                });

                if (closestEnemy) { // Se encontrou um inimigo dentro do alcance
                    chain.push(closestEnemy);
                    currentEnemy = closestEnemy;
                } else {
                    break; // Não há mais inimigos para saltar
                }
            }

            // Causa dano e cria o efeito visual
            for (let i = 0; i < chain.length; i++) {
                const enemy = chain[i];
                
                // CORREÇÃO: Aplica o dano a todos os alvos na corrente.
                enemy.userData.hp -= damage;
                createFloatingText(damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#fde047');
                enemy.userData.electrifiedTimer = 300; // 5 segundos
                enemy.userData.hitTimer = 10;

                let startPoint;
                // O primeiro raio sai do jogador, os seguintes saem do inimigo anterior.
                if (i > 0) {
                    startPoint = chain[i - 1].position.clone();
                } else {
                    startPoint = player.position.clone();
                }

                const endPoint = enemy.position.clone();
                startPoint.y = endPoint.y = 0.5; // Alinha os raios na altura do mago

                const distance = startPoint.distanceTo(endPoint);
                if (distance === 0) continue; // Evita criar um raio de comprimento zero

                const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
                const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.9 });
                const lightningSegment = new THREE.Mesh(geometry, material);

                // Posiciona e orienta o cilindro para conectar os dois pontos
                lightningSegment.position.copy(startPoint).lerp(endPoint, 0.5);
                lightningSegment.lookAt(endPoint);
                lightningSegment.rotateX(Math.PI / 2);

                scene.add(lightningSegment);
                // Animação de fade-out
                setTimeout(() => {
                    lightningSegment.material.opacity = 0;
                    setTimeout(() => scene.remove(lightningSegment), 100);
                }, 100);
            }
        }

        // NOVO: Lógica do Escudo do Chefe
        function createBossShield(charges) {
            // Reutiliza a lógica do escudo do jogador, mas com esferas roxas
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
            // Assume que só haverá um escudo de chefe por vez
            shieldLayers.push(newLayer);
        }



        // --- Funções de Lógica do Jogo ---
        
        function handlePlayerMovement() {
            let dx = 0;
            let dz = 0;

            if (keys['w'] || keys['W'] || keys['ArrowUp']) dz = -1;
            if (keys['s'] || keys['S'] || keys['ArrowDown']) dz = 1;
            if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx = -1;
            if (keys['d'] || keys['D'] || keys['ArrowRight']) dx = 1;

            if (dx !== 0 || dz !== 0) {
                const movementVector = new THREE.Vector2(dx, dz).normalize();
                const currentMovement = new THREE.Vector3(movementVector.x, 0, movementVector.y).multiplyScalar(playerSpeed);
                
                // Rotação do jogador para a direção do movimento
                const angle = Math.atan2(movementVector.x, movementVector.y); 
                player.rotation.y = angle;
                
                const newPosition = player.position.clone().add(currentMovement);
                
                // Bounding box do player na nova posição
                const tempPlayerBBox = new THREE.Box3();
                
                let collisionDetected = false;
                
                // Usa o player temporário para checar a colisão antes de mover o player real
                tempPlayer.position.copy(newPosition);
                tempPlayer.updateMatrixWorld();
                tempPlayerBBox.setFromObject(tempPlayer);

                for (const obstacle of obstacles) {
                    obstacle.updateMatrixWorld();
                    
                    let obstacleBBox;

                    // NOVO: Usa a malha de colisão pequena se for uma árvore
                    if (obstacle.userData.collisionMesh) {
                        obstacle.userData.collisionMesh.updateWorldMatrix(true, false);
                        obstacleBBox = new THREE.Box3().setFromObject(obstacle.userData.collisionMesh);
                    } else {
                        // Usa o BBox completo para paredes
                        obstacleBBox = new THREE.Box3().setFromObject(obstacle);
                    }
                    
                    if (tempPlayerBBox.intersectsBox(obstacleBBox)) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (!collisionDetected) {
                    // Aplica o movimento real
                    player.position.copy(newPosition);
                    
                    // Mantém o player dentro dos limites do mapa
                    player.position.x = Math.max(-mapSize, Math.min(mapSize, player.position.x));
                    player.position.z = Math.max(-mapSize, Math.min(mapSize, player.position.z));
                    
                    targetRing.position.x = player.position.x;
                    targetRing.position.z = player.position.z;
                }
            }
        }

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
                    // Lógica de ataque aprimorada por nível e power-up
                    if (tripleShotTimer > 0) { // Apenas o power-up concede tiro múltiplo
                        const angles = [-0.1745, 0, 0.1745]; // 3 projéteis
                        angles.forEach(angle => {
                            const shotDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                            createProjectile('weak', shotDirection, player.position);
                        });
                    } else {
                        // Disparo normal
                        createProjectile('weak', direction, player.position);
                    }
                    projectileCooldown = currentCooldown;
                }
            }
        }

        // NOVO: Função de ativação da HABILIDADE ATIVA
        function attemptSpecialAttack() {
            const activeId = player.userData.activeAbility;
            if (!activeId) return;

            const ability = upgrades[activeId];
            const level = player.userData.upgrades[activeId] || 1;

            if (killPoints < ability.getKillCost(level) || specialCooldown > 0) return;

            // Lógica específica para cada habilidade
            switch (activeId) {
                case 'missil_magico': { // Míssil Mágico
                    const numMissiles = level >= 4 ? (level === 4 ? 2 : 3) : 1;
                    const damage = level === 1 ? 25 : (level === 2 ? 35 : 50);
                    const targets = findClosestEnemies(player.position, numMissiles, true);
                    
                    if (targets.length === 0) return; // Não gasta a habilidade se não houver alvos

                    targets.forEach(target => {
                        const direction = new THREE.Vector3().subVectors(target.position, player.position).normalize();
                        createProjectile('strong', direction, player.position);
                        projectiles[projectiles.length - 1].userData.damage = damage;
                    });
                    break;
                }
                case 'explosao_energia': { // Explosão de Energia
                    const sphereCounts = [5, 7, 10, 15, 20];
                    const damages = [5, 10, 15, 20, 25];
                    const numProjectiles = sphereCounts[level - 1];
                    const damage = damages[level - 1];
                    const radius = 30;

                    // Encontra inimigos próximos
                    const nearbyEnemies = enemies.filter(e => e.position.distanceTo(player.position) <= radius);

                    // Se não houver inimigos, não gasta a habilidade
                    if (nearbyEnemies.length === 0) {
                        return;
                    }

                    // Cria uma lista de alvos, repetindo se necessário
                    const targets = [];
                    for (let i = 0; i < numProjectiles; i++) {
                        targets.push(nearbyEnemies[i % nearbyEnemies.length]);
                    }

                    // Lança os projéteis de forma escalonada
                    for (let i = 0; i < numProjectiles; i++) {
                        setTimeout(() => {
                            if (isGameOver) return; // Não lança se o jogo acabou no meio do timeout

                            // Direção inicial em espiral para o efeito visual
                            const angle = (i / numProjectiles) * Math.PI * 4; // * 4 para dar mais voltas
                            const initialDirection = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                            
                            createProjectile('nova', initialDirection, player.position);
                            const proj = projectiles[projectiles.length - 1];
                            proj.userData.damage = damage;
                            proj.userData.isHoming = true;
                            proj.userData.target = targets[i];
                            proj.userData.hasBeenReflected = 'homing'; // Impede reflexão
                        }, i * 50); // Delay de 50ms entre cada projétil
                    }
                    break;
                }
                case 'corrente_raios': { // Corrente de Raios
                    // COMPORTAMENTO NOVO: Disparo instantâneo no alvo mais próximo.
                    const jumpDistance = [5, 8, 11, 14, 17][level - 1];
                    let closestEnemy = null;
                    let minDistanceSq = jumpDistance * jumpDistance;

                    // Encontra o inimigo mais próximo DENTRO DO ALCANCE
                    enemies.forEach(enemy => {
                        const distanceSq = enemy.position.distanceToSquared(player.position);
                        if (distanceSq < minDistanceSq) {
                            minDistanceSq = distanceSq;
                            closestEnemy = enemy;
                        }
                    });

                    // Se encontrou um alvo, dispara. Senão, não gasta a habilidade.
                    if (closestEnemy) {
                        triggerChainLightning(closestEnemy);
                    } else {
                        return; // Não consome a habilidade se não houver alvos no alcance.
                    }
                    break;
                }
                case 'carga_explosiva': { // Carga Explosiva
                    // Pega a direção da mira do mouse
                    raycaster.setFromCamera(pointer, camera);
                    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                    const intersection = new THREE.Vector3();
                    if (!raycaster.ray.intersectPlane(plane, intersection)) return;

                    const direction = new THREE.Vector3().subVectors(intersection, player.position).normalize();
                    
                    // Cria o projétil explosivo
                    createProjectile('explosion', direction, player.position);
                    
                    // Define os atributos da explosão com base no nível
                    const lastProjectile = projectiles[projectiles.length - 1];
                    lastProjectile.userData.explosionRadius = [5, 7, 8, 9, 10][level - 1];
                    lastProjectile.userData.explosionDamage = [50, 60, 70, 80, 100][level - 1];
                    lastProjectile.userData.explosionLevel = level;
                    break;
                }
            }

            // Reseta o cooldown e os pontos de abate
            killPoints = 0;
            specialCooldown = 180; // 3 segundos
            updateUI();
        }


        function updatePowerUps() {
            if (!player) return; // Proteção
            // A BBox do player já foi atualizada em animate()
            const playerBBox = new THREE.Box3().setFromObject(player);
            
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const powerUp = powerUps[i];
                powerUp.updateMatrixWorld();
                
                // NOVO: Aumenta a área de colisão do item para facilitar a coleta
                // Cria uma BBox maior em torno do item para a checagem
                const powerUpBBox = new THREE.Box3().setFromObject(powerUp);
                const size = new THREE.Vector3();
                powerUpBBox.getSize(size);
                powerUpBBox.expandByVector(size.multiplyScalar(3.0)); // Aumenta a caixa em 300%

                if (playerBBox.intersectsBox(powerUpBBox)) {
                    // Colisão detectada - Coletar item
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
                            // NOVO: A duração depende do nível do jogador
                            const duration = playerLevel < 4 
                                ? 1800  // 30 segundos
                                : 3600; // 60 segundos
                            tripleShotTimer += duration;
                            break;
                        
                        case 'shield':
                            // NOVO: Adiciona uma nova camada ao escudo
                            createShield(shieldLayers.length + 1); // +1 para o raio
                            break;

                        case 'repulsionBubble':
                            // NOVO: Ativa a bolha de repulsão
                            repulsionBubbleTimer += data.duration;
                            break;
                        
                        case 'clone':
                            // NOVO: Ativa o clone
                            if (!clone) createClone();
                            cloneTimer += data.duration;
                            break;
                        
                        case 'freezingAura':
                            // NOVO: Ativa a aura congelante
                            freezingAuraTimer += data.duration;
                            break;

                        case 'expBoost':
                            // NOVO: Ativa o bônus de EXP
                            expBoostTimer += data.duration;
                            break;
                    }

                    // Remove o item do mapa
                    scene.remove(powerUp);
                    removePowerUpLabel(powerUp); // NOVO: Remove o label do item
                    powerUps.splice(i, 1);
                    updateUI();
                }
            }
        }
        
    // NOVO: Lógica da Explosão (usada pelo projétil)
    function triggerBigExplosion(position, radius, damage, level) {
            // Efeito visual simples (Flash)
            const flashGeometry = new THREE.SphereGeometry(radius * 0.5, 16, 16);
            const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            flash.position.copy(position);
            flash.position.y = 0.5;
            scene.add(flash);
            
            // Animação do Flash (cresce e desaparece)
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

            // Causa dano em área
            const radiusSq = radius * radius;
            enemies.forEach(enemy => {
                if (enemy.position.distanceToSquared(position) <= radiusSq) {
                    enemy.userData.hp -= damage;
                    createFloatingText(damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#ff4500');
                    enemy.userData.hitTimer = 10; // Ativa o feedback de hit
                }
            });

            // NOVO: Gera fragmentos para níveis 4 e 5
            const spawnShards = level && level >= 4;
            if (spawnShards) {
                const numShards = level === 4 ? 3 : 5;
                for (let i = 0; i < numShards; i++) {
                    const shardDirection = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                    // Cria um projétil do tipo 'explosion', que explode ao colidir
                    createProjectile('explosion', shardDirection, position);
                    const shard = projectiles[projectiles.length - 1];
                    // Define que a explosão do fragmento é menor e causa metade do dano
                    shard.userData.explosionRadius = radius / 2;
                    shard.userData.explosionDamage = damage / 2;
                    shard.userData.explosionLevel = 0; // Fragmentos não geram mais fragmentos
                }
            }
        }

        // NOVO: Lógica do Escudo (Múltiplas Camadas)
        function createShield(layerIndex) {
            const numSpheres = 10;
            const baseRadius = 3.0; // Raio inicial de 3 unidades
            const radiusIncrement = 1.0; // Cada camada adiciona 1 unidade
            const radius = baseRadius + (layerIndex - 1) * radiusIncrement; // 3, 4, 5...

            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshLambertMaterial({ color: 0x00D7FE, emissive: 0x00D7FE, emissiveIntensity: 1 });
            
            const newLayer = {
                spheres: [],
                radius: radius,
                angleOffset: Math.random() * Math.PI * 2 // Offset aleatório para cada camada
            };

            for (let i = 0; i < numSpheres; i++) {
                const sphere = new THREE.Mesh(geometry, material);
                newLayer.spheres.push(sphere);
                scene.add(sphere);
            }
            shieldLayers.push(newLayer);
        }

        // NOVO: Lógica de atualização do Escudo
        function updateShield() {
            if (shieldLayers.length === 0) return;

            const time = Date.now() * 0.001; // Tempo para órbita

            for (let l = shieldLayers.length - 1; l >= 0; l--) {
                const layer = shieldLayers[l];
                
                // Checa se a camada está vazia
                if (layer.spheres.length === 0) {
                    shieldLayers.splice(l, 1);
                    continue;
                }

                const numSpheres = layer.spheres.length;

                for (let i = numSpheres - 1; i >= 0; i--) {
                    const sphere = layer.spheres[i];
                    
                    // 1. Atualiza Posição da Esfera (Órbita)
                    const angle = (time * (l % 2 === 0 ? 1 : -1)) + layer.angleOffset + (i * (Math.PI * 2 / numSpheres));
                    sphere.position.x = player.position.x + Math.cos(angle) * layer.radius;
                    sphere.position.z = player.position.z + Math.sin(angle) * layer.radius;
                    sphere.position.y = 0.5; // Altura do Mago

                    // CORREÇÃO: Força a atualização da posição 3D ANTES da checagem
                    sphere.updateMatrixWorld();

                    // NOVO: 2. Checa Colisão com Projéteis Inimigos
                    const sphereBBoxForProjectiles = new THREE.Box3().setFromObject(sphere);
                    for (let p_idx = projectiles.length - 1; p_idx >= 0; p_idx--) {
                        const proj = projectiles[p_idx];
                        const projData = proj.userData;

                        // Checa apenas projéteis inimigos que não foram refletidos
                        if (projData.hasBeenReflected === null) { // Checa se pode ser refletido
                            const projBBox = new THREE.Box3().setFromObject(proj);
                            if (sphereBBoxForProjectiles.intersectsBox(projBBox)) {
                                // NOVO: Reflete o projétil em vez de destruir
                                const reflectionVector = new THREE.Vector3().subVectors(proj.position, sphere.position).normalize();
                                
                                projData.direction.copy(reflectionVector);
                                projData.type = 'weak'; // Transforma em projétil do jogador
                                projData.damage = 15; // Dano de reflexão do escudo
                                projData.speed *= 1.2; // Aumenta um pouco a velocidade
                                projData.hasBeenReflected = true; // Marca para não refletir de novo

                                // Muda a cor para a cor do escudo
                                proj.material.color.setHex(0x00D7FE);

                                // A esfera não é mais destruída, apenas reflete.
                            }
                        }
                    }

                    // 2. Checa Colisão com Inimigos
                    const sphereBBox = new THREE.Box3().setFromObject(sphere);
                    let hitEnemy = null;

                    for (const enemy of enemies) {
                        const enemyBBox = new THREE.Box3().setFromObject(enemy);
                        
                        if (sphereBBox.intersectsBox(enemyBBox)) {
                            // Causa dano
                            enemy.userData.hp -= projectileProps.weak.damage; // 10 de dano
                            createFloatingText(projectileProps.weak.damage, enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), 'white');
                            enemy.userData.hitTimer = 10; // Ativa o feedback de hit
                            hitEnemy = enemy;
                            break; // Esfera só acerta um inimigo
                        }
                    }

                    // 3. Remove a esfera se ela atingiu algo
                    if (hitEnemy) {
                        scene.remove(sphere);
                        layer.spheres.splice(i, 1);
                        updateUI(); // Atualiza a contagem de esferas
                    }
                }
            }
        }
        
        // NOVO: Função para remover todas as camadas do escudo (chamada no restart)
        function removeShield() {
            if (shieldLayers.length > 0) {
                shieldLayers.forEach(layer => {
                    layer.spheres.forEach(sphere => {
                        scene.remove(sphere);
                    });
                });
                shieldLayers = []; // Limpa o array de camadas
            }
            // A UI será atualizada na próxima chamada updateUI()
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
                if (enemyData.damageCooldown > 0) {
                    enemyData.damageCooldown--;
                }

                // NOVO: Feedback de Hit (Piscar Branco)
                if (enemyData.hitTimer > 0) {
                    // CORREÇÃO: Percorre os filhos para aplicar o efeito
                    enemy.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.color.setHex(0xffffff);
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
            let target;
            if (enemyData.type === 'ghost') {
                target = player;
            } else {
                target = clone && cloneTimer > 0 ? clone : player;
            }
            const targetPos = target.position;

            // Lógica de congelamento persistente e dano por segundo
            let finalSpeed = enemyData.speed;
            if (goblinKingAura && enemyData.type === 'goblin' && enemy.position.distanceToSquared(currentBoss.position) < auraRadiusSq) {
                finalSpeed *= speedBoost;
            }
            let isSlowed = false;
            // Juggernaut com armadura é imune a slow
            if (enemyData.type !== 'ghost' && !(enemyData.type === 'juggernaut_troll' && enemyData.armor > 0)) {
                const isInAura = freezingAuraTimer > 0 && enemy.position.distanceTo(player.position) < 6;

                if (isInAura) {
                    enemyData.freezeLingerTimer = 300; // 5 segundos
                }

                if (enemyData.freezeLingerTimer > 0) {
                    enemyData.freezeLingerTimer--;
                    enemyData.isFrozen = true;
                    isSlowed = true;

                    // Aplica dano contínuo
                    const damagePerFrame = 5 / 60;
                    enemyData.hp -= damagePerFrame;
                    enemyData.auraDamageAccumulator += damagePerFrame;

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
                    // Invoca 5 goblins normais
                    for (let j = 0; j < 5; j++) {
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
            if (enemyData.electrifiedTimer > 0 && !(enemyData.type === 'juggernaut_troll' && enemyData.armor > 0)) {
                enemyData.electrifiedTimer--;
                if (enemyData.electrifiedTimer % 60 === 0) { // Causa dano a cada segundo
                    enemyData.hp -= 5;
                    if (enemyData.hp <= 0 && enemyData.isBoss) {
                        handleBossDefeat(enemy);
                    }
                    createFloatingText('5', enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#fde047');
                    enemyData.hitTimer = 5; // Pequeno feedback visual
                }
            }

            // --- LÓGICA DE MOVIMENTO ---
            if (isSlowed) { // Inimigos congelados têm prioridade de movimento
                // Movimento lento se estiver congelado
                const slowDirection = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
                enemy.position.addScaledVector(slowDirection, finalSpeed * 0.5);
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

            // Checa colisão com o jogador APÓS o movimento
            const playerBBox = new THREE.Box3().setFromObject(player);
            // Inimigos de longa distância não causam dano de toque
            if (enemyData.type !== 'necromancer' && enemyData.type !== 'skeleton_archer') {
                if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(enemy))) {
                    if (enemyData.damageCooldown <= 0) {
                        damagePlayer(enemyData.damage);
                        createFloatingText(enemyData.damage, player.position.clone().setY(1.5), '#ff0000', '1.5rem');
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
                    continue; // Pula para o próximo inimigo no loop
                }
                score += enemyData.score;
                gainExperience(enemyData.score); 
                if (isBossWave) killsForSoulHarvest++; // Contador para o Arquilich

                // CORREÇÃO: Incrementa os abates e limita ao máximo da habilidade ativa.
                const activeId = player.userData.activeAbility;
                if (activeId) {
                    const ability = upgrades[activeId];
                    const maxKills = ability.getKillCost(player.userData.upgrades[activeId] || 1);
                    killPoints = Math.min(maxKills, killPoints + 1);
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

    // MELHORIA: Função para o efeito visual do Terremoto
    function triggerEarthquakeVisual(position, maxRadius) {
        const geometry = new THREE.RingGeometry(0.1, 1, 64); // Começa pequeno
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4500, // Cor inicial (dano máximo)
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
        const animationDuration = 30; // frames
        const expansionInterval = setInterval(() => {
            scale += 1;
            ring.scale.set(scale, scale, scale);

            // Muda a cor para indicar a zona de dano
            if (scale > 15 && scale <= 20) {
                ring.material.color.setHex(0xff8c00); // Laranja
            } else if (scale > 20) {
                ring.material.color.setHex(0xffd700); // Amarelo
            }

            if (scale >= maxRadius) {
                clearInterval(expansionInterval);
                scene.remove(ring);
            }
        }, 20); // Velocidade da expansão
    }

    // NOVO: Função para a habilidade de "Chuva de Pedras" do Rei Goblin
    function triggerRockFall(targetPosition) {
        const fallRadius = 7;
        const damage = 15;

        // 1. Efeito visual do alvo no chão
        const targetGeometry = new THREE.RingGeometry(fallRadius - 0.5, fallRadius, 32);
        const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
        targetMarker.position.copy(targetPosition);
        targetMarker.position.y = 0.1;
        targetMarker.rotation.x = -Math.PI / 2;
        scene.add(targetMarker);

        // Animação de aviso
        setTimeout(() => {
            // 2. Causa dano se o jogador estiver na área
            if (player.position.distanceToSquared(targetPosition) < fallRadius * fallRadius) {
                damagePlayer(damage);
                createFloatingText(damage, player.position.clone().setY(1.5), '#ff4500', '1.5rem');
            }

            // 3. Efeito visual da pedra caindo (simples)
            const rockGeometry = new THREE.DodecahedronGeometry(1);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.copy(targetPosition);
            rock.position.y = 0.5;
            scene.add(rock);

            // Remove os efeitos visuais
            scene.remove(targetMarker);
            setTimeout(() => scene.remove(rock), 200);

        }, 1000); // 1 segundo de aviso antes do impacto
    }

    // NOVO: Função para lidar com a derrota de um chefe
    function handleBossDefeat(boss) {
        score += boss.userData.score;
        gainExperience(boss.userData.score);
        
        // Dropa múltiplos power-ups
        const numDrops = Math.floor(Math.random() * 3) + 3; // 3 a 5 drops
        for (let i = 0; i < numDrops; i++) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            spawnRandomItem(boss.position.clone().add(offset));
        }

        // Recompensa especial do Arquilich
        if (boss.userData.type === 'archlich') {
            showSpecialLevelUpOptions();
            return; // Interrompe a lógica padrão de remoção para esperar a escolha do jogador
        }

        // Remove o chefe da cena
        const index = enemies.indexOf(boss);
        if (index > -1) enemies.splice(index, 1);
        scene.remove(boss);
        removeEnemyUI(boss);

        // Finaliza a onda de chefe
        isBossWave = false;
        currentBoss = null;
        enemiesAliveThisWave = 0; // Zera para a próxima onda começar
        updateUI();
    }

    // NOVO: Função para a Prisão de Ossos
    function triggerBonePrison() {
        const numWalls = 12;
        const radius = 5;
        for (let i = 0; i < numWalls; i++) {
            const angle = (i / numWalls) * Math.PI * 2;
            const x = player.position.x + Math.cos(angle) * radius;
            const z = player.position.z + Math.sin(angle) * radius;
            
            // Cria uma parede de "osso" temporária
            const wall = createWall(new THREE.Vector3(x, 0, z), 0.5, 2.5);
            wall.material.color.setHex(0xf0e68c); // Cor de osso
            
            // Remove a parede após 8 segundos
            setTimeout(() => {
                scene.remove(wall);
                obstacles.splice(obstacles.indexOf(wall), 1);
            }, 8000);
        }
    }

        // NOVO: Funções de Level Up
        function gainExperience(amount) {
            let finalAmount = amount;

            // NOVO: Aplica o bônus da Sede de Conhecimento, arredondando para cima
            const xpGainLevel = player.userData.upgrades.increase_xp_gain || 0;
            if (xpGainLevel > 0) {
                const bonusPercentage = xpGainLevel * 0.20; // 20% por nível
                const bonusAmount = Math.ceil(finalAmount * bonusPercentage);
                finalAmount += bonusAmount;
            }

            // NOVO: Aplica o bônus do Power-up de EXP em Dobro
            if (expBoostTimer > 0) {
                finalAmount *= 2;
            }


            createFloatingText(`+${finalAmount} EXP`, player.position.clone().setY(2.0), '#FFFF00', '1.2rem');

            experiencePoints += finalAmount;
            
            // Permite múltiplos level ups de uma vez (ex: explosão)
            while (experiencePoints >= player.userData.experienceForNextLevel) {
                levelUp();
            }

            // A UI será atualizada no loop animate
            updateUI();
        }

        function levelUp() {
            experiencePoints -= player.userData.experienceForNextLevel; // Subtrai o custo e mantém o excesso
            playerLevel++;
            pendingLevelUps++; // NOVO: Incrementa o contador de level ups pendentes
            document.getElementById('level-up-prompt-button').classList.remove('hidden'); // Mostra o botão

            // CORREÇÃO: Aumenta o custo para o próximo nível
            player.userData.experienceForNextLevel = Math.floor(baseExperience * Math.pow(playerLevel, 1.5));

            // Toca a animação de level up no personagem
            displayLevelUpMessage();
        }

        // NOVO: Função restaurada para atualizar os projéteis
        function updateProjectiles() {
            const tempBBox = new THREE.Box3();

            for (let i = projectiles.length - 1; i >= 0; i--) {
                const projectile = projectiles[i];
                const projData = projectile.userData;
                
                let hit = false;

                // Lógica de reflexão da Bolha Repulsora
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

                // NOVO: Lógica para projéteis teleguiados
                if (projData.isHoming && projData.target && projData.target.userData.hp > 0) {
                    const targetPosition = projData.target.position;
                    const directionToTarget = new THREE.Vector3().subVectors(targetPosition, projectile.position).normalize();
                    
                    // Interpola suavemente a direção atual para a direção do alvo
                    projData.direction.lerp(directionToTarget, 0.1);
                } else if (projData.isHoming) {
                    // Se o alvo morreu, o projétil continua em linha reta
                    projData.isHoming = false;
                }

                // Checa colisão de projéteis inimigos com o jogador
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

                // Checa colisão com inimigos (apenas projéteis do jogador)
                if (projData.type !== 'necro_bolt' && projData.type !== 'arrow') {
                    for (const enemy of enemies) {
                        const enemyBBox = new THREE.Box3().setFromObject(enemy);
                        if (tempBBox.intersectsBox(enemyBBox)) {
                            // Calcula o dano final com bônus do Poder Arcano
                            const damageLevel = player.userData.upgrades.increase_damage || 0;
                            let finalDamage = projData.damage; // Usa o dano base do projétil
                            if (damageLevel > 0) {
                                const bonusPercentage = damageLevel * 0.10; // 10% por nível
                                const bonusAmount = Math.ceil(projData.damage * bonusPercentage);
                                finalDamage += bonusAmount;
                            }

                            // NOVO: Dano na armadura primeiro
                            if (enemy.userData.isBoss && enemy.userData.soulShieldCharges > 0) {
                                // Escudo de Almas do Arquilich absorve o projétil
                                enemy.userData.soulShieldCharges--;
                                removeShield(); // Remove o escudo visual antigo
                                if (enemy.userData.soulShieldCharges > 0) createBossShield(enemy.userData.soulShieldCharges); // Recria com menos esferas
                                hit = true; // Marca como acerto para o projétil ser destruído
                            } else if (enemy.userData.armor > 0) {
                                const armorDamage = Math.min(enemy.userData.armor, finalDamage);
                                enemy.userData.armor -= armorDamage;
                                finalDamage -= armorDamage;
                                createFloatingText(Math.floor(armorDamage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), '#A9A9A9'); // Cinza
                            }

                            if (hit || finalDamage <= 0) continue; // Se o escudo absorveu ou não há mais dano
                            enemy.userData.hp -= finalDamage;
                            createFloatingText(Math.floor(finalDamage), enemy.position.clone().setY(enemy.userData.modelHeight || 1.5), 'white');
                            enemy.userData.hitTimer = 10;

                            // Lógica da Corrente de Raios foi movida para attemptSpecialAttack

                            hit = true;
                            break;
                        }
                    }
                }

                // Rotaciona a flecha
                if (projData.type === 'arrow') {
                    projectile.lookAt(projectile.position.clone().add(projData.direction));
                    projectile.rotateX(Math.PI / 2);
                }

                // Remove projéteis que saem do mapa
                if (Math.abs(projectile.position.x) > mapSize + 5 || Math.abs(projectile.position.z) > mapSize + 5) {
                    scene.remove(projectile);
                    projectiles.splice(i, 1);
                    continue;
                }

                // Checa colisão com obstáculos
                if (!hit) {
                    for (const obstacle of obstacles) { // ...
                        obstacle.updateMatrixWorld();
                        let obstacleBBox = obstacle.userData.collisionMesh ? new THREE.Box3().setFromObject(obstacle.userData.collisionMesh) : new THREE.Box3().setFromObject(obstacle);
                        if (tempBBox.intersectsBox(obstacleBBox)) {
                            hit = true;
                            break;
                        }
                    }
                }

                // Remove o projétil se ele atingiu algo
                if (hit) {
                    if (projData.isExplosive) {
                        triggerBigExplosion(projectile.position, projData.explosionRadius, projData.explosionDamage, projData.explosionLevel);
                    }
                    scene.remove(projectile);
                    projectiles.splice(i, 1);
                }
            }
        }

        // NOVO: Função para iniciar o tremor da câmera
        function triggerCameraShake(intensity, duration) {
            // Garante que um novo tremor mais forte substitua um mais fraco
            cameraShakeIntensity = Math.max(cameraShakeIntensity, intensity);
            cameraShakeDuration = Math.max(cameraShakeDuration, duration);
        }

        // NOVO: Função dedicada para checar dano NO JOGADOR
        // Isso garante que o escudo rode primeiro
        function damagePlayer(amount) {
            if (isGameOver) return;

            playerHP = Math.max(0, playerHP - amount);
            
            // NOVO: Ativa o tremor da câmera ao receber dano
            triggerCameraShake(0.5, 20); // Intensidade 0.5, duração de 20 frames

            // Feedback visual de dano no Mago (pisca o robe)
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
            // acontece se 'player' for 'undefined' E 'isGameOver' for 'false'.
            // Isso acontece se 'startGame' falhar (por causa de 'removeShield').
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
            // O erro 'Cannot read properties of undefined (reading 'position')'
            // indica que 'player' é nulo.
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

            camera.lookAt(player.position);
            
            // Atualiza Cooldowns
            projectileCooldown = Math.max(0, projectileCooldown - 1);
            specialCooldown = Math.max(0, specialCooldown - 1);
            if (tripleShotTimer > 0) tripleShotTimer--; // NOVO: Decrementa timer
            if (repulsionBubbleTimer > 0) repulsionBubbleTimer--; // NOVO: Decrementa timer da bolha
            if (cloneTimer > 0) cloneTimer--; // NOVO: Decrementa timer do clone
            if (freezingAuraTimer > 0) freezingAuraTimer--; // NOVO: Decrementa timer da aura
            if (expBoostTimer > 0) expBoostTimer--; // NOVO: Decrementa timer do EXP

            // NOVO: Atualiza a visibilidade e posição da bolha de repulsão
            if (repulsionBubbleTimer > 0) {
                repulsionBubbleMesh.visible = true;
                // Centraliza a bolha no jogador
                repulsionBubbleMesh.position.copy(player.position);
            } else {
                repulsionBubbleMesh.visible = false;
            }

            // NOVO: Atualiza a visibilidade e posição da aura congelante
            if (freezingAuraTimer > 0) {
                freezingAuraMesh.visible = true;
                freezingAuraMesh.position.copy(player.position);
            } else {
                freezingAuraMesh.visible = false;
            }

            // NOVO: Atualiza as partículas de fumaça
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

            // NOVO: Atualiza a aura de EXP Boost
            if (expBoostTimer > 0) {
                expBoostAuraMesh.visible = true;
                expBoostAuraMesh.position.copy(player.position);
                expBoostAuraMesh.position.y = 0.1; // Ligeiramente acima do chão
                expBoostAuraMesh.rotation.z += 0.02; // Animação de rotação simples
            } else {
                expBoostAuraMesh.visible = false;
            }

            // MELHORIA: Atualiza o indicador de alcance
            if (rangeIndicator.visible) {
                rangeIndicator.position.copy(player.position);
            }

            // NOVO: Atualiza a aura do Rei Goblin
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

            // 3. Lógica de Inimigos e Spawning
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

            // NOVO: Garante que a UI seja atualizada a cada frame
            updateUI();

            // NOVO: Lógica da habilidade de Auto-Cura
            const autoHealLevel = player.userData.upgrades.auto_heal || 0;
            if (autoHealLevel > 0) {
                passiveHealTimer++;

                const healAmount = Math.floor(Math.min(5, autoHealLevel + 1)); // Nível 1 cura 2, Nível 2 cura 3, etc.
                const currentHealInterval = autoHealLevel < 5 ? 300 : 180; // 5 segundos para Nv 1-4, 3 segundos para Nv 5

                if (passiveHealTimer >= currentHealInterval) {
                    const oldHP = playerHP;
                    playerHP = Math.min(maxHP, playerHP + healAmount);
                    if (playerHP > oldHP) {
                        createFloatingText(`+${playerHP - oldHP}`, player.position.clone().setY(1.5), '#00ff00');
                    }
                    passiveHealTimer = 0;
                }
            }

            // 6. Renderização
            renderer.render(scene, camera);
        }

        // Função startGame agora recebe o nome do jogador
        window.startGame = function (name) {
            playerName = name || 'Mago Anônimo';

            // Limpa o estado anterior
            isGameOver = false;
            score = 0;
            playerHP = maxHP;
            
            // NOVO: Reseta o Level
            playerLevel = 1;
            experiencePoints = 0;
            playerSpeed = 0.15; 
            pendingLevelUps = 0; // NOVO: Reseta level ups pendentes

            killPoints = 0;
            killStats = { goblin: 0, orc: 0, troll: 0, necromancer: 0, ghost: 0, skeleton: 0, skeleton_warrior: 0, skeleton_archer: 0 }; // NOVO: Reseta killStats
            killsSinceLastPotion = 0; // NOVO: Reseta contador de poção
            
            // NOVO: Reseta timers e estados dos novos poderes
            tripleShotTimer = 0;
            removeShield(); // Garante que o escudo seja removido
            repulsionBubbleTimer = 0; 
            if (clone) scene.remove(clone); // NOVO: Remove clone se existir
            clone = null; cloneTimer = 0;             
            freezingAuraTimer = 0; 
            if (freezingAuraMesh) freezingAuraMesh.visible = false; // NOVO: Esconde a aura
            if (expBoostAuraMesh) expBoostAuraMesh.visible = false; // NOVO: Esconde a aura de EXP
            expBoostTimer = 0; // NOVO: Reseta timer de EXP
            if (goblinKingAuraMesh) goblinKingAuraMesh.visible = false; // NOVO: Esconde a aura do chefe
            if (rangeIndicator) rangeIndicator.visible = false; // NOVO: Esconde indicador de alcance

            // NOVO: Reseta o estado das ondas
            currentWave = 0;
            enemiesAliveThisWave = 0;
            // NOVO: Reseta estado do chefe
            isBossWave = false;
            currentBoss = null;

            enemiesToSpawnThisWave = 0;
            monstersInPreviousWave = 0;

            powerUpTimer = 0; 
            projectileCooldown = 0;
            specialCooldown = 0;
            passiveHealTimer = 0; // NOVO: Reseta timer da cura
            
            // Limpa as entidades 3D e seus labels
            enemies.forEach(e => { scene.remove(e); removeEnemyUI(e); });
            projectiles.forEach(p => scene.remove(p));
            powerUps.forEach(p => { scene.remove(p); removePowerUpLabel(p); }); // Limpa labels dos itens
            enemies.length = 0;
            projectiles.length = 0;
            powerUps.length = 0; 
            enemyLabelsContainer.innerHTML = '';
            enemyLabels.clear();
            powerUpLabels.clear(); // NOVO: Limpa o mapa de labels dos itens
            
            // Garante que os obstáculos não sejam removidos
            // Obstáculos são criados/repopulados dentro de init/populateObstacles

            if (player) scene.remove(player);
            if (targetRing) scene.remove(targetRing);
            createPlayer();
            player.userData = { maxHP: 100, upgrades: {}, activeAbility: null, experienceForNextLevel: baseExperience }; // Reseta os atributos e upgrades do jogador
            
            // Reset UI
            startMenuModal.classList.add('hidden');
            gameOverModal.classList.add('hidden');
            // NOVO: Garante que o botão de level up esteja escondido no início
            document.getElementById('level-up-prompt-button').classList.add('hidden');

            
            // NOVO: Spawna um power-up especial obrigatório no início
            const specialPowers = ['tripleShot', 'shield', 'explosion'];
            const randomType = specialPowers[Math.floor(Math.random() * specialPowers.length)];
            // Spawna perto do jogador
            createPowerUp(randomType, new THREE.Vector3(3, 0, 3)); 

            updateUI();

            // CORREÇÃO: Define como "jogo iniciado" APENAS DEPOIS que tudo foi criado
            isGameOver = false;
        }

        function endGame() {
            isGameOver = true;
            
            finalScoreDisplay.textContent = score;
            gameOverModal.classList.remove('hidden');

            // Salva a pontuação com o nome do jogador e as estatísticas de abates
            window.saveScore(score, playerName, killStats, playerLevel, currentWave);
            
            // NOVO: Garante que a bolha desapareça no fim do jogo
            if (repulsionBubbleMesh) {
                repulsionBubbleMesh.visible = false;
            }

            // NOVO: Garante que a aura desapareça no fim do jogo
            if (freezingAuraMesh) {
                freezingAuraMesh.visible = false;
            }

            // NOVO: Garante que o clone desapareça no fim do jogo
            if (clone) {
                scene.remove(clone);
                clone = null;
            }
            // NOVO: Garante que a aura de EXP desapareça no fim do jogo
            if (expBoostAuraMesh) {
                expBoostAuraMesh.visible = false;
            }

            // NOVO: Garante que a aura do chefe desapareça
            if (goblinKingAuraMesh) {
                goblinKingAuraMesh.visible = false;
            }

            // Remove todos os labels quando o jogo termina
            enemyLabelsContainer.innerHTML = '';
            enemyLabels.clear();
            powerUpLabels.clear(); // NOVO: Limpa o mapa de labels dos itens
        }

        // --- Funções de Controle da UI (Menu) ---
        function handleRestartClick() {
            gameOverModal.classList.add('hidden');
            startMenuModal.classList.remove('hidden');
        }

        function handleStartGameClick() {
            const playerName = document.getElementById('mage-name').value.trim();
            if (playerName.length === 0) {
                const input = document.getElementById('mage-name');
                input.placeholder = 'NOME OBRIGATÓRIO!';
                input.classList.add('border-red-500', 'border-2');
                setTimeout(() => input.classList.remove('border-red-500', 'border-2'), 1000);
                return;
            }
            startMenuModal.classList.add('hidden');
            startGame(playerName); // Chama a função diretamente
        }

        // Inicia a aplicação Three.js quando a janela estiver carregada
        window.onload = function () {
            if (window.setupUIElements) setupUIElements(); // Inicializa referências da UI
            if (window.loadInitialRankingFromCache) loadInitialRankingFromCache(); // Carrega o ranking do cache
            // A configuração dos tooltips é chamada dentro de init()
            init();
            createPlayer(); // Cria o jogador uma vez para ter a referência em `startGame`
            animate();
            // A tela de menu fica visível no início (isGameOver = true)
        };