// js/entities/Player.js
class Player extends Entity {
    constructor() {
        super({ hp: 100, speed: 0.15 }); // Propriedades base

        // Adiciona o modelo 3D
        const model = createWizardModel();
        this.add(model);

        // Atributos de Estado
        this.level = 1;
        this.experiencePoints = 0;
        this.pendingLevelUps = 0;
        this.killsSinceLastPotion = 0;
        this.score = 0;

        // Atributos de Combate e Habilidades
        this.projectileCooldown = 0;
        this.baseCooldown = 30;
        this.specialGlobalCooldown = 0;
        this.chargeTimer = CHARGE_TIME_MAX;

        // Status e Timers
        this.passiveHealTimer = 0;
        this.slowTimer = 0;
        this.burnTimer = 0;
        this.electrifiedTimer = 0;
        this.isBlinded = false;

        // Configuração do `userData` para compatibilidade e novas propriedades
        this.userData = {
            upgrades: {},
            activeAbility: null,
            abilityCharges: {},
            experienceForNextLevel: baseExperience,
        };
    }

    update(keys, obstacles, pointer, camera, targetRing) {
        this._handleMovement(keys, obstacles);
        this._updateAiming(pointer, camera, targetRing);
        this._updatePassiveAbilities();

        // Atualiza cooldowns globais
        this.projectileCooldown = Math.max(0, this.projectileCooldown - 1);
        this.specialGlobalCooldown = Math.max(0, this.specialGlobalCooldown - 1);

        // Lógica de recarga de habilidade ativa
        if (this.userData.activeAbility) {
            this.chargeTimer = Math.max(0, this.chargeTimer - 1);
            if (this.chargeTimer <= 0) {
                this.userData.abilityCharges[this.userData.activeAbility] = (this.userData.abilityCharges[this.userData.activeAbility] || 0) + 1;
                this.chargeTimer = CHARGE_TIME_MAX; // Reseta o timer
            }
        }
    }

    _handleMovement(keys, obstacles) {
        let dx = 0;
        let dz = 0;

        if (keys['w'] || keys['W'] || keys['ArrowUp']) dz = -1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) dz = 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx = -1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dz !== 0) {
            let currentSpeed = this.speed;
            if (this.slowTimer > 0) {
                currentSpeed *= 0.1;
            }
            const movementVector = new THREE.Vector2(dx, dz).normalize();
            const currentMovement = new THREE.Vector3(movementVector.x, 0, movementVector.y).multiplyScalar(currentSpeed);
            
            this.rotation.y = Math.atan2(movementVector.x, movementVector.y);
            
            const newPosition = this.position.clone().add(currentMovement);
            
            // Reutiliza a lógica de colisão de `handleStandardMovement`
            handleStandardMovement(this, newPosition, currentSpeed);

            this.position.x = Math.max(-mapSize, Math.min(mapSize, this.position.x));
            this.position.z = Math.max(-mapSize, Math.min(mapSize, this.position.z));
        }
    }

    _updateAiming(pointer, camera, targetRing) {
        raycaster.setFromCamera(pointer, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(plane, intersection)) return;

        targetRing.position.copy(intersection);
        targetRing.position.y = 0.01;

        if (this.projectileCooldown <= 0 && !this.isBlinded) {
            const direction = new THREE.Vector3().subVectors(intersection, this.position).normalize();
            createProjectile('weak', direction, this.position);
            this.projectileCooldown = this.baseCooldown;
        }
    }

    _updatePassiveAbilities() {
        const autoHealLevel = this.userData.upgrades.auto_heal || 0;
        if (autoHealLevel > 0) {
            this.passiveHealTimer++;
            const healAmount = autoHealLevel < 5 ? autoHealLevel + 1 : 10;
            if (this.passiveHealTimer >= 300) { // 5 segundos
                this.heal(healAmount);
                this.passiveHealTimer = 0;
            }
        }

        if (this.slowTimer > 0) this.slowTimer--;
        if (this.burnTimer > 0) {
            this.burnTimer--;
            if (this.burnTimer % 60 === 0) this.takeDamage(2, true);
        }
        if (this.electrifiedTimer > 0) {
            this.electrifiedTimer--;
            if (this.electrifiedTimer % 60 === 0) this.takeDamage(2, true);
        }
    }

    takeDamage(amount, isElemental = false) {
        if (isGameOver) return;

        let finalDamage = amount;
        const shieldLevel = this.userData.upgrades.magic_shield || 0;
        if (shieldLevel > 0) {
            let reductionPercent = 0;
            if (isElemental && shieldLevel >= 4) {
                reductionPercent = shieldLevel === 4 ? 0.15 : 0.30;
            } else if (!isElemental) {
                reductionPercent = Math.min(0.3, shieldLevel * 0.1);
            }
            const reductionAmount = Math.max(1, Math.ceil(finalDamage * reductionPercent));
            finalDamage -= reductionAmount;
        }
        finalDamage = Math.max(0, finalDamage);

        super.takeDamage(finalDamage); // Chama o takeDamage da classe Entity

        triggerCameraShake(0.5, 20);
        const robe = this.children[0].children[0];
        const originalColor = robe.material.color.getHex();
        robe.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.isAlive) robe.material.color.setHex(originalColor);
        }, 100);

        updateUI();
        if (!this.isAlive) endGame();
    }

    heal(amount) {
        const oldHP = this.hp;
        this.hp = Math.min(this.maxHP, this.hp + amount);
        const actualHeal = this.hp - oldHP;
        if (actualHeal > 0) {
            displayHealingMessage(actualHeal);
            createFloatingText(`+${actualHeal}`, this.position.clone().setY(1.5), '#00ff00', '1.5rem');
        }
        updateUI();
    }

    gainExperience(amount) {
        let finalAmount = amount;
        const xpGainLevel = this.userData.upgrades.increase_xp_gain || 0;
        if (xpGainLevel > 0) {
            finalAmount += Math.ceil(finalAmount * (xpGainLevel * 0.20));
        }
        if (expBoostTimer > 0) {
            finalAmount *= 2;
        }

        createFloatingText(`+${Math.floor(finalAmount)} EXP`, this.position.clone().setY(2.0), '#FFFF00', '1.2rem');
        this.experiencePoints += finalAmount;
        
        while (this.experiencePoints >= this.userData.experienceForNextLevel) {
            this.levelUp();
        }
        updateUI();
    }

    levelUp() {
        this.experiencePoints -= this.userData.experienceForNextLevel;
        this.level++;
        this.pendingLevelUps++;
        document.getElementById('level-up-prompt-button').classList.remove('hidden');

        this.maxHP += 10;
        this.heal(10); // Cura 10 ao subir de nível

        this.userData.experienceForNextLevel = Math.floor(baseExperience * Math.pow(this.level, 1.2));
        displayLevelUpMessage();
    }

    attemptSpecialAttack() {
        const activeId = this.userData.activeAbility;
        if (!activeId || this.specialGlobalCooldown > 0 || !this.userData.abilityCharges[activeId] || this.userData.abilityCharges[activeId] <= 0 || this.isBlinded) {
            return;
        }

        const level = this.userData.upgrades[activeId] || 1;
        this.userData.abilityCharges[activeId]--;

        switch (activeId) {
            case 'missil_fogo_etereo': {
                let damage = [25, 35, 45, 50, 55][level - 1];
                damage = getArcanePowerBonus(damage);
                const target = findClosestEnemies(this.position, 1, true)[0];
                if (!target) return;
                const direction = new THREE.Vector3().subVectors(target.position, this.position).normalize();
                const proj = createProjectile('ethereal_fire', direction, this.position);
                if (proj) {
                    proj.userData.damage = damage;
                    proj.userData.isHoming = true;
                    proj.userData.target = target;
                }
                break;
            }
            // ... (outros casos de magias)
        }

        this.specialGlobalCooldown = 120; // 2 segundos
        updateUI();
    }

    equipSpell(spellId) {
        if (this.userData.activeAbility !== spellId) {
            this.userData.activeAbility = spellId;
            this.chargeTimer = CHARGE_TIME_MAX;
        }
        closeSpellbook();
        updateUI();
    }

    resetState() {
        this.hp = 100;
        this.maxHP = 100;
        this.speed = 0.15;
        this.isAlive = true;
        this.level = 1;
        this.experiencePoints = 0;
        this.pendingLevelUps = 0;
        this.killsSinceLastPotion = 0;
        this.score = 0;
        this.baseCooldown = 30;
        this.chargeTimer = CHARGE_TIME_MAX;
        this.userData = {
            upgrades: {},
            activeAbility: null,
            abilityCharges: {},
            experienceForNextLevel: baseExperience,
        };
        this.position.set(0, 0, 0);
    }
}

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