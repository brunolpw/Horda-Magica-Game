// js/entities/bosses/ElementalMaster.js
class ElementalMaster extends Enemy {
    constructor() {
        super(entityProps.elemental_master);
        this.isBoss = true;
        this.phase = 1;
        this.teleportCooldown = 480; // 8s
        this.fireMissileCooldown = 300; // 5s
        this.iceLanceCooldown = 420; // 7s
        this.chainLightningCooldown = 540; // 9s
        this.activeAura = null;
        this.auraChangeCooldown = 0;
        this.echoSummonCooldown = 0;
        this.furyAttackCooldown = 0;
        this.isTeleporting = false;

        // Sincroniza para a lógica de colisão de projéteis e UI
        this.userData.isBoss = true;
        this.userData.phase = this.phase;
        this.userData.crystals = this.children.find(c => c.userData.crystals).userData.crystals;
    }

    update(player, target, finalSpeed) {
        // O Mestre Elemental tem sua própria lógica de status e movimento
        // super.update(player, target, finalSpeed, true);

        this._checkPhaseTransition();
        this._animateCrystals();

        switch (this.phase) {
            case 1:
                this._phase1Behavior(player);
                break;
            case 2:
                this._phase2Behavior(player);
                break;
            case 3:
                this._phase3Behavior(player);
                break;
            case 4:
                this._phase4Behavior(player);
                break;
        }
    }

    _checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHP;
        if (this.phase === 1 && hpPercent <= 0.75) {
            this.phase = 2;
            this.activeAura = 'fire';
            this.auraChangeCooldown = 1200; // 20s
        } else if (this.phase === 2 && hpPercent <= 0.50) {
            this.phase = 3;
            this.activeAura = null;
            this.echoSummonCooldown = 900; // 15s
            this.teleportCooldown = 480;
        } else if (this.phase === 3 && hpPercent <= 0.25) {
            this.phase = 4;
            this.activeAura = 'fire';
            this.auraChangeCooldown = 60; // 1s
            this.furyAttackCooldown = 120; // 2s
            this.speed *= 1.2;
        }
        this.userData.phase = this.phase;
    }

    _animateCrystals() {
        if (!this.userData.crystals) return;
        const time = Date.now() * 0.001;
        this.userData.crystals.forEach((crystal, index) => {
            crystal.rotation.y += 0.02;
            crystal.position.y = 1.5 + Math.sin(time + index) * 0.2;

            let targetIntensity = 0.5;
            if (this.phase === 2 || this.phase === 4) {
                if ((this.activeAura === 'fire' && index === 0) || (this.activeAura === 'ice' && index === 1) || (this.activeAura === 'lightning' && index === 2)) {
                    targetIntensity = 3.0;
                }
            }
            crystal.material.emissiveIntensity += (targetIntensity - crystal.material.emissiveIntensity) * 0.1;
        });
    }

    _phase1Behavior(player) {
        this.teleportCooldown = Math.max(0, this.teleportCooldown - 1);
        if (this.teleportCooldown <= 0) {
            triggerTeleport(this, 25);
            this.teleportCooldown = 480;
        }

        this.fireMissileCooldown = Math.max(0, this.fireMissileCooldown - 1);
        if (this.fireMissileCooldown <= 0) {
            const proj = createProjectile('ethereal_fire', new THREE.Vector3().subVectors(player.position, this.position).normalize(), this.position);
            if (proj) { proj.userData.damage = 40; proj.userData.isHoming = true; proj.userData.target = player; }
            this.fireMissileCooldown = 300;
        }
    }

    _phase2Behavior(player) {
        const moveDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(moveDirection, this.speed * 0.5);
        handleStandardMovement(this, newPosition, this.speed * 0.5);

        this.auraChangeCooldown = Math.max(0, this.auraChangeCooldown - 1);
        if (this.auraChangeCooldown <= 0) {
            this.activeAura = this.activeAura === 'fire' ? 'ice' : this.activeAura === 'ice' ? 'lightning' : 'fire';
            this.auraChangeCooldown = 1200;
        }

        const auraRadius = 12;
        if (player.position.distanceToSquared(this.position) < auraRadius * auraRadius) {
            if (this.activeAura === 'fire') player.userData.burnTimer = Math.max(player.userData.burnTimer, 120);
            else if (this.activeAura === 'ice') player.userData.slowTimer = Math.max(player.userData.slowTimer, 60);
            else if (this.activeAura === 'lightning') player.userData.electrifiedTimer = Math.max(player.userData.electrifiedTimer, 60);
        }
    }

    _phase3Behavior(player) {
        this.teleportCooldown = Math.max(0, this.teleportCooldown - 1);
        if (this.teleportCooldown <= 0) {
            triggerTeleport(this, 25);
            this.teleportCooldown = 600;
        }

        this.echoSummonCooldown = Math.max(0, this.echoSummonCooldown - 1);
        if (this.echoSummonCooldown <= 0) {
            triggerEchoSummon();
            this.echoSummonCooldown = 900;
        }
    }

    _phase4Behavior(player) {
        // A lógica de movimento e ataque da fase 4 é complexa e será totalmente implementada
        // quando a lógica de ataque do chefe for movida para a classe.
        // Por enquanto, apenas o movimento agressivo.
        const moveDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(moveDirection, this.speed);
        handleStandardMovement(this, newPosition, this.speed);
    }
}