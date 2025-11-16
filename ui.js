// Este arquivo contém toda a lógica para manipular a interface do usuário (UI) e a Heads-Up Display (HUD).

// --- Variáveis de UI ---
let scoreDisplay, hpBar, specialBar, killPointsDisplay, gameOverModal, finalScoreDisplay, playerNameDisplay, healingMessage, startMenuModal, waveLevelDisplay;
let playerLevelDisplay, levelUpMessage, xpTextDisplay, levelUpModal, upgradeOptionsContainer, knownUpgradesContainer;
let activeAbilityHud, activeAbilityIcon, activeAbilityProgressBar, activeAbilityKillCount;
let spellbookModal, spellbookGrid, openSpellbookButton;

const enemyLabelsContainer = document.getElementById('enemy-labels-container');
const enemyLabels = new Map();
const powerUpLabels = new Map();
const floatingTexts = [];

// --- Funções de Inicialização da UI ---

function setupUIElements() {
    scoreDisplay = document.getElementById('score-display');
    hpBar = document.getElementById('hp-bar');
    gameOverModal = document.getElementById('game-over-modal');
    finalScoreDisplay = document.getElementById('final-score');
    playerNameDisplay = document.getElementById('player-name-display');
    healingMessage = document.getElementById('healing-message');
    startMenuModal = document.getElementById('start-menu-modal');
    playerLevelDisplay = document.getElementById('player-level-display');
    levelUpMessage = document.getElementById('level-up-message');
    xpTextDisplay = document.getElementById('xp-text-display');
    waveLevelDisplay = document.getElementById('wave-level-display');
    levelUpModal = document.getElementById('level-up-modal');
    upgradeOptionsContainer = document.getElementById('upgrade-options-container');
    knownUpgradesContainer = document.getElementById('known-upgrades-container');
    activeAbilityHud = document.getElementById('active-ability-hud');
    activeAbilityIcon = document.getElementById('active-ability-icon');
    activeAbilityProgressBar = document.getElementById('active-ability-progress-bar');
    activeAbilityKillCount = document.getElementById('active-ability-kill-count');
    spellbookModal = document.getElementById('spellbook-modal');
    spellbookGrid = document.getElementById('spellbook-grid');
    openSpellbookButton = document.getElementById('open-spellbook-button');

    document.getElementById('level-up-prompt-button').onclick = () => {
        showLevelUpOptions();
    };
}

// --- Funções de Atualização da HUD ---

function updateUI() {
    if (!playerNameDisplay) return;

    playerNameDisplay.textContent = playerName;
    scoreDisplay.textContent = `Pontuação: ${score}`;
    playerLevelDisplay.textContent = playerLevel;

    const experienceForNextLevel = player.userData.experienceForNextLevel || baseExperience;
    const xpPercent = (experiencePoints / experienceForNextLevel) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercent}%`;
    xpTextDisplay.textContent = `${Math.floor(experiencePoints)}/${experienceForNextLevel}`;

    waveLevelDisplay.textContent = currentWave;

    const hpPercent = Math.max(0, playerHP / maxHP) * 100;
    hpBar.style.width = `${hpPercent}%`;
    const hpTextDisplay = document.getElementById('hp-text-display');
    hpTextDisplay.textContent = `${Math.floor(playerHP)}/${Math.floor(maxHP)}`;

    const activeAbilityId = player.userData.activeAbility;
    if (activeAbilityId) {
        activeAbilityHud.classList.remove('hidden');
        const abilityTitle = document.getElementById('active-ability-title');
        const ability = upgrades[activeAbilityId]; // Apenas para obter o ícone e o título
        const charges = player.userData.abilityCharges[activeAbilityId] || 0;

        // A barra de progresso agora mostra o tempo para a próxima carga
        const progressPercent = ((CHARGE_TIME_MAX - chargeTimer) / CHARGE_TIME_MAX) * 100;

        activeAbilityIcon.textContent = ability.icon;
        activeAbilityProgressBar.style.width = `${progressPercent}%`;
        activeAbilityKillCount.textContent = `x${charges}`; // Mostra o número de cargas

        const level = player.userData.upgrades[activeAbilityId] || 1;
        abilityTitle.textContent = `${ability.title} (Nv. ${level})`;

        if (charges > 0) {
            activeAbilityHud.classList.add('ready');
        } else {
            activeAbilityHud.classList.remove('ready');
        }

        // Feedback visual para o cooldown global
        if (specialGlobalCooldown > 0) {
            activeAbilityHud.style.borderColor = '#4a5568'; // Borda cinza escura
            activeAbilityHud.style.opacity = '0.6'; // Fica semitransparente
            activeAbilityProgressBar.style.backgroundColor = '#6b7280'; // Barra cinza
        } else {
            activeAbilityHud.style.opacity = '1';
            activeAbilityHud.style.borderColor = charges > 0 ? '#ffc700' : '#4a5568'; // Amarelo se pronto, cinza escuro se não
            activeAbilityProgressBar.style.backgroundColor = ''; // Volta à cor padrão do CSS
        }

        // Lógica de cor da mira para as runas
        if (charges > 0) {
            // Reseta o indicador de alcance antes de decidir se deve mostrá-lo
            rangeIndicator.visible = false;

            // Efeitos visuais para habilidades carregadas
            if (activeAbilityId === 'corrente_raios') { // Lógica para Corrente de Raios
                if (Math.random() < 0.5) { // Efeito de faíscas
                    const sparkGeo = new THREE.SphereGeometry(0.08, 8, 8);
                    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
                    const spark = new THREE.Mesh(sparkGeo, sparkMat);
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 0.8;
                    spark.position.set(player.position.x + Math.cos(angle) * radius, 0.5 + Math.random(), player.position.z + Math.sin(angle) * radius);
                    scene.add(spark);
                    setTimeout(() => scene.remove(spark), 150 + Math.random() * 150);
                }
                const jumpDistance = [5, 8, 11, 14, 17][level - 1];
                rangeIndicator.scale.set(jumpDistance, jumpDistance, 1);
                rangeIndicator.visible = true;
            } else if (activeAbilityId === 'explosao_energia') { // Lógica para Explosão de Energia
                const radius = 25; // Raio da explosão
                rangeIndicator.scale.set(radius, radius, 1);
                rangeIndicator.visible = true;
            } else {
                rangeIndicator.visible = false;
            }

            const isRune = activeAbilityId.startsWith('runa_');
            if (isRune) {
                const runeLevel = player.userData.upgrades[activeAbilityId] || 1;
                const runeRadius = [5, 5, 6, 6, 7][runeLevel - 1];
                const baseRingRadius = 1.5; // O raio com que o targetRing foi criado
                const targetScale = runeRadius / baseRingRadius;

                // Efeito de pulsação
                const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.05;
                const finalScale = targetScale * pulse;
                targetRing.scale.set(finalScale, finalScale, finalScale);

                // Define a cor da mira com base no tipo de runa
                const runeColors = {
                    'runa_fogo': 0xff4500,
                    'runa_gelo': 0x87CEFA,
                    'runa_raio': 0xfde047
                };
                targetRing.material.color.setHex(runeColors[activeAbilityId]);
            } else {
                // Reseta a escala para habilidades que não são runas
                targetRing.scale.set(1, 1, 1);
                targetRing.material.color.setHex(0xffffff); // Garante que a cor volte ao branco
            }
        } else {
            // Reseta a escala quando a habilidade não está pronta
            rangeIndicator.visible = false;
            targetRing.scale.set(1, 1, 1);
            targetRing.material.color.setHex(0xffffff);
        }

    } else {
        activeAbilityHud.classList.add('hidden');
    }

    // Mostra o botão do grimório se o jogador tiver mais de uma magia ativa
    const activeAbilities = Object.keys(player.userData.upgrades).filter(key => upgrades[key].type === 'active');
    if (activeAbilities.length > 0) {
        openSpellbookButton.classList.remove('hidden');
    } else {
        openSpellbookButton.classList.add('hidden');
    }

    const timerDisplay = document.getElementById('powerup-timers-display');
    let timersHTML = '';
    if (repulsionBubbleTimer > 0) timersHTML += `<span class="powerup-active">Bolha Repulsora! (${Math.ceil(repulsionBubbleTimer/60)}s)</span>`;
    if (cloneTimer > 0) timersHTML += `<span class="powerup-active">Clone Ativo! (${Math.ceil(cloneTimer/60)}s)</span>`;
    if (freezingAuraTimer > 0) timersHTML += `<span class="powerup-active">Aura Congelante! (${Math.ceil(freezingAuraTimer/60)}s)</span>`;
    if (flamingAuraTimer > 0) timersHTML += `<span class="powerup-active">Aura Flamejante! (${Math.ceil(flamingAuraTimer/60)}s)</span>`;
    if (electrifyingAuraTimer > 0) timersHTML += `<span class="powerup-active">Aura Eletrizante! (${Math.ceil(electrifyingAuraTimer/60)}s)</span>`;
    if (expBoostTimer > 0) timersHTML += `<span class="powerup-active">EXP em Dobro! (${Math.ceil(expBoostTimer/60)}s)</span>`;

    const totalSpheres = shieldLayers.reduce((acc, layer) => acc + layer.spheres.length, 0);
    if (totalSpheres > 0) timersHTML += `<span class="powerup-active">Escudo Ativo! (${totalSpheres} esferas)</span>`;
    timerDisplay.innerHTML = timersHTML;
}

function updateEnemyUI() {
    const tempV = new THREE.Vector3();
    enemies.forEach(enemy => {
        const uiElements = enemyLabels.get(enemy.uuid);
        if (!uiElements) return;

        if (enemy.userData.isBoss && uiElements.hpBar) {
            uiElements.hpBar.style.backgroundColor = '#FFD700';
        }

        const { nameLabel, hpBar, hpFill, armorBar, armorFill, summonMarker, frozenMarker, electrifiedMarker } = uiElements;
        const modelHeight = enemy.userData.modelHeight || 1.0;

        const labelBaseY = enemy.position.y + modelHeight;
        tempV.set(enemy.position.x, labelBaseY, enemy.position.z);
        tempV.project(camera);

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tempV.y * 0.5 + 0.5) * window.innerHeight;

        nameLabel.style.left = `${x}px`;
        nameLabel.style.top = `${y - 8}px`;

        if (enemy.userData.armor > 0) {
            armorBar.style.display = 'block';
            armorBar.style.left = `${x}px`;
            armorBar.style.top = `${y}px`;
            hpBar.style.left = `${x}px`;
            hpBar.style.top = `${y + 8}px`;
        } else {
            if (armorBar) armorBar.style.display = 'none';
            hpBar.style.left = `${x}px`;
            hpBar.style.top = `${y}px`;
        }

        if (armorFill) armorFill.style.width = `${(enemy.userData.armor / enemy.userData.maxArmor) * 100}%`;
        hpFill.style.width = `${(enemy.userData.hp / enemy.userData.maxHP) * 100}%`;

        if (summonMarker) {
            summonMarker.style.left = `${x}px`;
            summonMarker.style.top = `${y - 18}px`;
        }

        if (frozenMarker) {
            frozenMarker.style.display = enemy.userData.isFrozen ? 'block' : 'none';
            if (enemy.userData.isFrozen) {
                frozenMarker.style.left = `${x}px`;
                frozenMarker.style.top = `${y - 18}px`;
            }
        }

        if (electrifiedMarker) {
            electrifiedMarker.style.display = enemy.userData.electrifiedTimer > 0 ? 'block' : 'none';
            if (enemy.userData.electrifiedTimer > 0) {
                electrifiedMarker.style.left = `${x + 10}px`;
                electrifiedMarker.style.top = `${y - 18}px`;
            }
        }
    });
}

function updatePowerUpLabels() {
    const tempV = new THREE.Vector3();
    powerUps.forEach(powerUp => {
        const label = powerUpLabels.get(powerUp.uuid);
        if (!label) return;

        const height = powerUp.userData.geometry.parameters.height || 0.5;
        tempV.set(powerUp.position.x, powerUp.position.y + height, powerUp.position.z);
        tempV.project(camera);

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tempV.y * 0.5 + 0.5) * window.innerHeight;

        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
    });
}

function updateFloatingText() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life--;
        ft.position.add(ft.velocity);

        if (ft.life <= 0) {
            ft.element.remove();
            floatingTexts.splice(i, 1);
        } else {
            const tempV = ft.position.clone().project(camera);
            ft.element.style.left = `${(tempV.x * 0.5 + 0.5) * window.innerWidth}px`;
            ft.element.style.top = `${(-tempV.y * 0.5 + 0.5) * window.innerHeight}px`;
            ft.element.style.opacity = ft.life / 60;
        }
    }
}

// --- Funções de Criação/Remoção de Elementos da UI ---

function createEnemyUI(enemy, name) {
    const label = document.createElement('div');
    label.className = 'enemy-label';
    label.textContent = name;
    enemyLabelsContainer.appendChild(label);

    const hpBarContainer = document.createElement('div');
    hpBarContainer.className = 'enemy-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'enemy-hp-fill';
    hpBarContainer.appendChild(hpFill);

    const armorBarContainer = document.createElement('div');
    armorBarContainer.className = 'enemy-armor-bar';
    const armorFill = document.createElement('div');
    armorFill.className = 'enemy-hp-fill';
    armorFill.style.backgroundColor = '#A9A9A9';
    armorBarContainer.appendChild(armorFill);

    enemyLabelsContainer.appendChild(hpBarContainer);

    let summonMarker = null;
    if (enemy.userData.isSummon) {
        summonMarker = document.createElement('div');
        summonMarker.className = 'summon-marker';
        enemyLabelsContainer.appendChild(summonMarker);
    }

    const frozenMarker = document.createElement('div');
    frozenMarker.className = 'frozen-marker';
    frozenMarker.innerHTML = '❄️';
    frozenMarker.style.display = 'none';
    enemyLabelsContainer.appendChild(frozenMarker);

    const electrifiedMarker = document.createElement('div');
    electrifiedMarker.className = 'electrified-marker';
    electrifiedMarker.innerHTML = '⚡';
    electrifiedMarker.style.display = 'none';
    enemyLabelsContainer.appendChild(electrifiedMarker);

    enemyLabels.set(enemy.uuid, { nameLabel: label, hpBar: hpBarContainer, hpFill: hpFill, armorBar: armorBarContainer, armorFill: armorFill, summonMarker: summonMarker, frozenMarker: frozenMarker, electrifiedMarker: electrifiedMarker });
}

function removeEnemyUI(enemy) {
    const uiElements = enemyLabels.get(enemy.uuid);
    if (uiElements) {
        Object.values(uiElements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        enemyLabels.delete(enemy.uuid);
    }
}

function createPowerUpLabel(powerUp, type) {
    let text = 'Item';
    switch (type) {
        case 'potion': text = 'Cura'; break;
        case 'shield': text = 'Escudo'; break;
        case 'repulsionBubble': text = 'Bolha Repulsora'; break;
        case 'clone': text = 'Clone'; break;
        case 'freezingAura': text = 'Aura Congelante'; break; // NOVO
        case 'flamingAura': text = 'Aura Flamejante'; break;
        case 'electrifyingAura': text = 'Aura Eletrizante'; break;
        case 'expBoost': text = 'EXP em Dobro'; break;
    }

    const label = document.createElement('div');
    label.className = 'powerup-label';
    label.textContent = text;
    enemyLabelsContainer.appendChild(label);
    powerUpLabels.set(powerUp.uuid, label);
}

function removePowerUpLabel(powerUp) {
    const label = powerUpLabels.get(powerUp.uuid);
    if (label) {
        enemyLabelsContainer.removeChild(label);
        powerUpLabels.delete(powerUp.uuid);
    }
}

function createFloatingText(text, position, color = 'white', fontSize = '1rem') {
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;
    textElement.style.color = color;
    textElement.style.fontSize = fontSize;

    document.getElementById('floating-text-container').appendChild(textElement);

    floatingTexts.push({
        element: textElement,
        position: position.clone(),
        life: 60,
        velocity: new THREE.Vector3(0, 0.03, 0)
    });
}

// --- Funções de Feedback Visual e Modais ---

function displayHealingMessage(amount) {
    healingMessage.textContent = `+${amount} HP!`;
    healingMessage.style.opacity = 1;
    healingMessage.style.transform = 'translate(-50%, -50%)';
    healingMessage.style.transition = 'none';

    setTimeout(() => {
        healingMessage.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
        healingMessage.style.opacity = 0;
        healingMessage.style.transform = 'translate(-50%, -150%)';
    }, 10);
}

function displayLevelUpMessage() {
    levelUpMessage.textContent = `LEVEL ${playerLevel}!`;
    levelUpMessage.style.opacity = 1;
    levelUpMessage.style.transform = 'translate(-50%, -50%)';
    levelUpMessage.style.transition = 'none';

    setTimeout(() => {
        levelUpMessage.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
        levelUpMessage.style.opacity = 0;
        levelUpMessage.style.transform = 'translate(-50%, -150%)';
    }, 10);
}

function showLevelUpOptions() {
    isGamePaused = true;
    pendingLevelUps--;

    if (pendingLevelUps <= 0) {
        document.getElementById('level-up-prompt-button').classList.add('hidden');
    }

    levelUpModal.classList.remove('hidden');
    upgradeOptionsContainer.innerHTML = '';
    knownUpgradesContainer.innerHTML = '';
    document.getElementById('confirm-upgrade-container').classList.add('hidden');
    const playerUpgrades = player.userData.upgrades;
    const activeAbility = player.userData.activeAbility;

    const availableUpgradeKeys = Object.keys(upgrades).filter(key => {
        const currentLevel = playerUpgrades[key] || 0;
        return currentLevel < upgrades[key].maxLevel;
    });

    const chosenUpgrades = [];
    while (chosenUpgrades.length < 3 && availableUpgradeKeys.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableUpgradeKeys.length);
        const upgradeId = availableUpgradeKeys.splice(randomIndex, 1)[0];
        chosenUpgrades.push(upgradeId);
    }

    chosenUpgrades.forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId] || 0;
        const nextLevel = currentLevel + 1;
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.onclick = () => selectUpgrade(upgradeId, false);
        let cardHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-description">${upgrade.description(nextLevel)}</div>`;

        if (upgrade.type === 'active' && activeAbility && activeAbility !== upgradeId) {
            cardHTML += `<div class="upgrade-replace-text">Substitui ${upgrades[activeAbility].title}</div>`;
        }
        cardHTML += `<div class="upgrade-level">${currentLevel > 0 ? `Nível ${currentLevel} ➔ ${nextLevel}` : 'APRENDER'}</div>`;
        card.innerHTML = cardHTML;
        upgradeOptionsContainer.appendChild(card);
    });

    Object.keys(playerUpgrades).forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId];
        const isMaxLevel = currentLevel >= upgrade.maxLevel;

        const card = document.createElement('div');
        card.className = 'upgrade-card';
        if (isMaxLevel) card.classList.add('opacity-50', 'cursor-not-allowed');

        let cardHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-level">${isMaxLevel ? 'NÍVEL MÁXIMO' : `Nível ${currentLevel} ➔ ${currentLevel + 1}`}</div>
            <div class="upgrade-description">${upgrade.description(isMaxLevel ? currentLevel : currentLevel + 1)}</div>`;

        if (upgrade.type === 'active') cardHTML += `<div class="upgrade-replace-text">Clique para equipar</div>`;
        card.innerHTML = cardHTML;

        if (upgradeId === activeAbility) card.classList.add('selected');
        if (!isMaxLevel) card.onclick = () => selectUpgrade(upgradeId, isMaxLevel);

        knownUpgradesContainer.appendChild(card);
    });
}

function selectUpgrade(upgradeId, isMaxLevel) {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return;

    if (!isMaxLevel) {
        player.userData.upgrades[upgradeId] = (player.userData.upgrades[upgradeId] || 0) + 1;

        if (upgrade.type === 'active' && player.userData.activeAbility !== upgradeId) {
            const isNew = !player.userData.upgrades[upgradeId] || player.userData.upgrades[upgradeId] === 1;
            if (isNew) killPoints = 0;
            player.userData.activeAbility = upgradeId;
        }

        if (upgrade.apply) upgrade.apply();
        displayLevelUpMessage();

        // Fecha o modal de level up e volta ao jogo para evitar inconsistências
        levelUpModal.classList.add('hidden');
        isGamePaused = false;
        if (pendingLevelUps > 0) document.getElementById('level-up-prompt-button').classList.remove('hidden');
        updateUI();
    } else if (upgrade.type === 'active') {
        const isNew = player.userData.activeAbility !== upgradeId;
        if (isNew) killPoints = 0;
        player.userData.activeAbility = upgradeId;
        promptEquipActiveAbility();
    }
}

function promptEquipActiveAbility() {
    upgradeOptionsContainer.innerHTML = '<p class="text-lg text-gray-300 col-span-3 text-center">Escolha a magia que deseja manter equipada.</p>';
    knownUpgradesContainer.innerHTML = '';

    const playerUpgrades = player.userData.upgrades;
    const activeAbilities = Object.keys(playerUpgrades).filter(key => upgrades[key].type === 'active');

    activeAbilities.forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId];
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-level">Nível ${currentLevel}</div>
            <div class="upgrade-description">${upgrade.description(currentLevel)}</div>
        `;

        if (upgradeId === player.userData.activeAbility) card.classList.add('selected');

        card.onclick = () => {
            if (player.userData.activeAbility !== upgradeId) {
                const newAbility = upgrades[upgradeId];
                const newMaxKills = newAbility.getKillCost(player.userData.upgrades[upgradeId] || 1);
                if (killPoints > newMaxKills) killPoints = newMaxKills;
            }
            player.userData.activeAbility = upgradeId;
            promptEquipActiveAbility();
        };
        knownUpgradesContainer.appendChild(card);
    });

    const confirmContainer = document.getElementById('confirm-upgrade-container');
    confirmContainer.classList.remove('hidden');
    document.getElementById('confirm-upgrade-button').onclick = () => {
        levelUpModal.classList.add('hidden');
        isGamePaused = false;
        if (pendingLevelUps > 0) {
            document.getElementById('level-up-prompt-button').classList.remove('hidden');
        }
        updateUI();
    };
}

function showSpecialLevelUpOptions() {
    isGamePaused = true;
    levelUpModal.classList.remove('hidden');
    upgradeOptionsContainer.innerHTML = '<p class="text-lg text-yellow-400 col-span-3 text-center">O Arquilich foi derrotado! Escolha qualquer poder como sua recompensa.</p>';
    knownUpgradesContainer.innerHTML = '';
    document.getElementById('confirm-upgrade-container').classList.add('hidden');

    const playerUpgrades = player.userData.upgrades;

    Object.keys(upgrades).forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId] || 0;

        if (currentLevel < upgrade.maxLevel) {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-title">${upgrade.title}</div>
                <div class="upgrade-level">${currentLevel > 0 ? `Nível ${currentLevel} ➔ ${currentLevel + 1}` : 'APRENDER'}</div>
                <div class="upgrade-description">${upgrade.description(currentLevel + 1)}</div>
            `;
            card.onclick = () => {
                selectUpgrade(upgradeId, false);
            };
            knownUpgradesContainer.appendChild(card);
        }
    });
}

// --- Funções de Controle de Menu ---

function handleRestartClick() {
    gameOverModal.classList.add('hidden');
    startMenuModal.classList.remove('hidden');
}

function handleStartGameClick() {
    const playerNameInput = document.getElementById('mage-name').value.trim();
    if (playerNameInput.length === 0) {
        const input = document.getElementById('mage-name');
        input.placeholder = 'NOME OBRIGATÓRIO!';
        input.classList.add('border-red-500', 'border-2');
        setTimeout(() => input.classList.remove('border-red-500', 'border-2'), 1000);
        return;
    }
    startMenuModal.classList.add('hidden');
    startGame(playerNameInput);
}


function handleViewRankingClick() {
    window.loadRanking();
    document.getElementById('full-ranking-modal').classList.remove('hidden');
}

// --- Funções do Grimório ---

function openSpellbook() {
    if (isGameOver) return;
    isGamePaused = true;
    spellbookModal.classList.remove('hidden');
    spellbookGrid.innerHTML = '';

    const playerUpgrades = player.userData.upgrades;
    const activeAbilities = Object.keys(playerUpgrades).filter(key => upgrades[key].type === 'active');

    activeAbilities.forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId];
        const card = document.createElement('div');
        card.className = 'spellbook-card'; // Usa a nova classe CSS específica

        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-level">Nível ${currentLevel}</div>
        `;

        if (upgradeId === player.userData.activeAbility) {
            card.classList.add('selected');
        }

        card.onclick = () => equipSpell(upgradeId);
        spellbookGrid.appendChild(card);
    });
}

function closeSpellbook() {
    spellbookModal.classList.add('hidden');
    isGamePaused = false;
}

function updateEnemyUI() {
    const tempV = new THREE.Vector3();
    enemies.forEach(enemy => {
        const uiElements = enemyLabels.get(enemy.uuid);
        if (!uiElements) return;

        if (enemy.userData.isBoss && uiElements.hpBar) {
            uiElements.hpBar.style.backgroundColor = '#FFD700';
        }

        const { nameLabel, hpBar, hpFill, armorBar, armorFill, summonMarker, frozenMarker, electrifiedMarker } = uiElements;
        const modelHeight = enemy.userData.modelHeight || 1.0;

        const labelBaseY = enemy.position.y + modelHeight;
        tempV.set(enemy.position.x, labelBaseY, enemy.position.z);
        tempV.project(camera);

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tempV.y * 0.5 + 0.5) * window.innerHeight;

        nameLabel.style.left = `${x}px`;
        nameLabel.style.top = `${y - 8}px`;

        if (enemy.userData.armor > 0) {
            armorBar.style.display = 'block';
            armorBar.style.left = `${x}px`;
            armorBar.style.top = `${y}px`;
            hpBar.style.left = `${x}px`;
            hpBar.style.top = `${y + 8}px`;
        } else {
            if (armorBar) armorBar.style.display = 'none';
            hpBar.style.left = `${x}px`;
            hpBar.style.top = `${y}px`;
        }

        if (armorFill) armorFill.style.width = `${(enemy.userData.armor / enemy.userData.maxArmor) * 100}%`;
        hpFill.style.width = `${(enemy.userData.hp / enemy.userData.maxHP) * 100}%`;

        if (summonMarker) {
            summonMarker.style.left = `${x}px`;
            summonMarker.style.top = `${y - 18}px`;
        }

        if (frozenMarker) {
            frozenMarker.style.display = enemy.userData.isFrozen ? 'block' : 'none';
            if (enemy.userData.isFrozen) {
                frozenMarker.style.left = `${x}px`;
                frozenMarker.style.top = `${y - 18}px`;
            }
        }

        if (electrifiedMarker) {
            electrifiedMarker.style.display = enemy.userData.electrifiedTimer > 0 ? 'block' : 'none';
            if (enemy.userData.electrifiedTimer > 0) {
                electrifiedMarker.style.left = `${x + 10}px`;
                electrifiedMarker.style.top = `${y - 18}px`;
            }
        }
    });
}

function updatePowerUpLabels() {
    const tempV = new THREE.Vector3();
    powerUps.forEach(powerUp => {
        const label = powerUpLabels.get(powerUp.uuid);
        if (!label) return;

        const height = powerUp.userData.geometry.parameters.height || 0.5;
        tempV.set(powerUp.position.x, powerUp.position.y + height, powerUp.position.z);
        tempV.project(camera);

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tempV.y * 0.5 + 0.5) * window.innerHeight;

        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
    });
}

function updateFloatingText() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life--;
        ft.position.add(ft.velocity);

        if (ft.life <= 0) {
            ft.element.remove();
            floatingTexts.splice(i, 1);
        } else {
            const tempV = ft.position.clone().project(camera);
            ft.element.style.left = `${(tempV.x * 0.5 + 0.5) * window.innerWidth}px`;
            ft.element.style.top = `${(-tempV.y * 0.5 + 0.5) * window.innerHeight}px`;
            ft.element.style.opacity = ft.life / 60;
        }
    }
}

// --- Funções de Criação/Remoção de Elementos da UI ---

function createEnemyUI(enemy, name) {
    const label = document.createElement('div');
    label.className = 'enemy-label';
    label.textContent = name;
    enemyLabelsContainer.appendChild(label);

    const hpBarContainer = document.createElement('div');
    hpBarContainer.className = 'enemy-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'enemy-hp-fill';
    hpBarContainer.appendChild(hpFill);

    const armorBarContainer = document.createElement('div');
    armorBarContainer.className = 'enemy-armor-bar';
    const armorFill = document.createElement('div');
    armorFill.className = 'enemy-hp-fill';
    armorFill.style.backgroundColor = '#A9A9A9';
    armorBarContainer.appendChild(armorFill);

    enemyLabelsContainer.appendChild(hpBarContainer);

    let summonMarker = null;
    if (enemy.userData.isSummon) {
        summonMarker = document.createElement('div');
        summonMarker.className = 'summon-marker';
        enemyLabelsContainer.appendChild(summonMarker);
    }

    const frozenMarker = document.createElement('div');
    frozenMarker.className = 'frozen-marker';
    frozenMarker.innerHTML = '❄️';
    frozenMarker.style.display = 'none';
    enemyLabelsContainer.appendChild(frozenMarker);

    const electrifiedMarker = document.createElement('div');
    electrifiedMarker.className = 'electrified-marker';
    electrifiedMarker.innerHTML = '⚡';
    electrifiedMarker.style.display = 'none';
    enemyLabelsContainer.appendChild(electrifiedMarker);

    enemyLabels.set(enemy.uuid, { nameLabel: label, hpBar: hpBarContainer, hpFill: hpFill, armorBar: armorBarContainer, armorFill: armorFill, summonMarker: summonMarker, frozenMarker: frozenMarker, electrifiedMarker: electrifiedMarker });
}

function removeEnemyUI(enemy) {
    const uiElements = enemyLabels.get(enemy.uuid);
    if (uiElements) {
        Object.values(uiElements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        enemyLabels.delete(enemy.uuid);
    }
}

function createPowerUpLabel(powerUp, type) {
    let text = 'Item';
    switch (type) {
        case 'potion': text = 'Cura'; break;
        case 'shield': text = 'Escudo'; break;
        case 'repulsionBubble': text = 'Bolha Repulsora'; break;
        case 'clone': text = 'Clone'; break;
        case 'freezingAura': text = 'Aura Congelante'; break; // NOVO
        case 'flamingAura': text = 'Aura Flamejante'; break;
        case 'electrifyingAura': text = 'Aura Eletrizante'; break;
        case 'expBoost': text = 'EXP em Dobro'; break;
    }

    const label = document.createElement('div');
    label.className = 'powerup-label';
    label.textContent = text;
    enemyLabelsContainer.appendChild(label);
    powerUpLabels.set(powerUp.uuid, label);
}

function removePowerUpLabel(powerUp) {
    const label = powerUpLabels.get(powerUp.uuid);
    if (label) {
        enemyLabelsContainer.removeChild(label);
        powerUpLabels.delete(powerUp.uuid);
    }
}

function createFloatingText(text, position, color = 'white', fontSize = '1rem') {
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;
    textElement.style.color = color;
    textElement.style.fontSize = fontSize;

    document.getElementById('floating-text-container').appendChild(textElement);

    floatingTexts.push({
        element: textElement,
        position: position.clone(),
        life: 60,
        velocity: new THREE.Vector3(0, 0.03, 0)
    });
}

// --- Funções de Feedback Visual e Modais ---

function displayHealingMessage(amount) {
    healingMessage.textContent = `+${amount} HP!`;
    healingMessage.style.opacity = 1;
    healingMessage.style.transform = 'translate(-50%, -50%)';
    healingMessage.style.transition = 'none';

    setTimeout(() => {
        healingMessage.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
        healingMessage.style.opacity = 0;
        healingMessage.style.transform = 'translate(-50%, -150%)';
    }, 10);
}

function displayLevelUpMessage() {
    levelUpMessage.textContent = `LEVEL ${playerLevel}!`;
    levelUpMessage.style.opacity = 1;
    levelUpMessage.style.transform = 'translate(-50%, -50%)';
    levelUpMessage.style.transition = 'none';

    setTimeout(() => {
        levelUpMessage.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
        levelUpMessage.style.opacity = 0;
        levelUpMessage.style.transform = 'translate(-50%, -150%)';
    }, 10);
}

function showLevelUpOptions() {
    isGamePaused = true;
    pendingLevelUps--;

    if (pendingLevelUps <= 0) {
        document.getElementById('level-up-prompt-button').classList.add('hidden');
    }

    levelUpModal.classList.remove('hidden');
    upgradeOptionsContainer.innerHTML = '';
    knownUpgradesContainer.innerHTML = '';
    document.getElementById('confirm-upgrade-container').classList.add('hidden');
    const playerUpgrades = player.userData.upgrades;
    const activeAbility = player.userData.activeAbility;

    const availableUpgradeKeys = Object.keys(upgrades).filter(key => {
        const currentLevel = playerUpgrades[key] || 0;
        return currentLevel < upgrades[key].maxLevel;
    });

    const chosenUpgrades = [];
    while (chosenUpgrades.length < 3 && availableUpgradeKeys.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableUpgradeKeys.length);
        const upgradeId = availableUpgradeKeys.splice(randomIndex, 1)[0];
        chosenUpgrades.push(upgradeId);
    }

    chosenUpgrades.forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId] || 0;
        const nextLevel = currentLevel + 1;
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.onclick = () => selectUpgrade(upgradeId, false);
        let cardHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-description">${upgrade.description(nextLevel)}</div>`;

        if (upgrade.type === 'active' && activeAbility && activeAbility !== upgradeId) {
            cardHTML += `<div class="upgrade-replace-text">Substitui ${upgrades[activeAbility].title}</div>`;
        }
        cardHTML += `<div class="upgrade-level">${currentLevel > 0 ? `Nível ${currentLevel} ➔ ${nextLevel}` : 'APRENDER'}</div>`;
        card.innerHTML = cardHTML;
        upgradeOptionsContainer.appendChild(card);
    });

    Object.keys(playerUpgrades).forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId];
        const isMaxLevel = currentLevel >= upgrade.maxLevel;

        const card = document.createElement('div');
        card.className = 'upgrade-card';
        if (isMaxLevel) card.classList.add('opacity-50', 'cursor-not-allowed');

        let cardHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-level">${isMaxLevel ? 'NÍVEL MÁXIMO' : `Nível ${currentLevel} ➔ ${currentLevel + 1}`}</div>
            <div class="upgrade-description">${upgrade.description(isMaxLevel ? currentLevel : currentLevel + 1)}</div>`;

        if (upgrade.type === 'active') cardHTML += `<div class="upgrade-replace-text">Clique para equipar</div>`;
        card.innerHTML = cardHTML;

        if (upgradeId === activeAbility) card.classList.add('selected');
        if (!isMaxLevel) card.onclick = () => selectUpgrade(upgradeId, isMaxLevel);

        knownUpgradesContainer.appendChild(card);
    });
}

function selectUpgrade(upgradeId, isMaxLevel) {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return;

    if (!isMaxLevel) {
        player.userData.upgrades[upgradeId] = (player.userData.upgrades[upgradeId] || 0) + 1;

        if (upgrade.type === 'active' && player.userData.activeAbility !== upgradeId) {
            const isNew = !player.userData.upgrades[upgradeId] || player.userData.upgrades[upgradeId] === 1;
            if (isNew) killPoints = 0;
            player.userData.activeAbility = upgradeId;
        }

        if (upgrade.apply) upgrade.apply();
        displayLevelUpMessage();
        promptEquipActiveAbility();
    } else if (upgrade.type === 'active') {
        const isNew = player.userData.activeAbility !== upgradeId;
        if (isNew) killPoints = 0;
        player.userData.activeAbility = upgradeId;
        promptEquipActiveAbility();
    }
}

function promptEquipActiveAbility() {
    upgradeOptionsContainer.innerHTML = '<p class="text-lg text-gray-300 col-span-3 text-center">Escolha a magia que deseja manter equipada.</p>';
    knownUpgradesContainer.innerHTML = '';

    const playerUpgrades = player.userData.upgrades;
    const activeAbilities = Object.keys(playerUpgrades).filter(key => upgrades[key].type === 'active');

    activeAbilities.forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId];
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-title">${upgrade.title}</div>
            <div class="upgrade-level">Nível ${currentLevel}</div>
            <div class="upgrade-description">${upgrade.description(currentLevel)}</div>
        `;

        if (upgradeId === player.userData.activeAbility) card.classList.add('selected');

        card.onclick = () => {
            if (player.userData.activeAbility !== upgradeId) {
                const newAbility = upgrades[upgradeId];
                const newMaxKills = newAbility.getKillCost(player.userData.upgrades[upgradeId] || 1);
                if (killPoints > newMaxKills) killPoints = newMaxKills;
            }
            player.userData.activeAbility = upgradeId;
            promptEquipActiveAbility();
        };
        knownUpgradesContainer.appendChild(card);
    });

    const confirmContainer = document.getElementById('confirm-upgrade-container');
    confirmContainer.classList.remove('hidden');
    document.getElementById('confirm-upgrade-button').onclick = () => {
        levelUpModal.classList.add('hidden');
        isGamePaused = false;
        if (pendingLevelUps > 0) {
            document.getElementById('level-up-prompt-button').classList.remove('hidden');
        }
        updateUI();
    };
}

function showSpecialLevelUpOptions() {
    isGamePaused = true;
    levelUpModal.classList.remove('hidden');
    upgradeOptionsContainer.innerHTML = '<p class="text-lg text-yellow-400 col-span-3 text-center">O Arquilich foi derrotado! Escolha qualquer poder como sua recompensa.</p>';
    knownUpgradesContainer.innerHTML = '';
    document.getElementById('confirm-upgrade-container').classList.add('hidden');

    const playerUpgrades = player.userData.upgrades;

    Object.keys(upgrades).forEach(upgradeId => {
        const upgrade = upgrades[upgradeId];
        const currentLevel = playerUpgrades[upgradeId] || 0;

        if (currentLevel < upgrade.maxLevel) {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-title">${upgrade.title}</div>
                <div class="upgrade-level">${currentLevel > 0 ? `Nível ${currentLevel} ➔ ${currentLevel + 1}` : 'APRENDER'}</div>
                <div class="upgrade-description">${upgrade.description(currentLevel + 1)}</div>
            `;
            card.onclick = () => {
                selectUpgrade(upgradeId, false);
            };
            knownUpgradesContainer.appendChild(card);
        }
    });
}

// --- Funções de Controle de Menu ---

function handleRestartClick() {
    gameOverModal.classList.add('hidden');
    startMenuModal.classList.remove('hidden');
}

function handleStartGameClick() {
    const playerNameInput = document.getElementById('mage-name').value.trim();
    if (playerNameInput.length === 0) {
        const input = document.getElementById('mage-name');
        input.placeholder = 'NOME OBRIGATÓRIO!';
        input.classList.add('border-red-500', 'border-2');
        setTimeout(() => input.classList.remove('border-red-500', 'border-2'), 1000);
        return;
    }
    startMenuModal.classList.add('hidden');
    startGame(playerNameInput);
}

function handleViewRankingClick() {
    window.loadRanking();
    document.getElementById('full-ranking-modal').classList.remove('hidden');
}