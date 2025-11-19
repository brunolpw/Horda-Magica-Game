// js/entities/Enemy.js
class Enemy extends Entity {
    constructor(props) {
        super(props);

        this.score = props.score || 0;
        this.damage = props.damage || 5;
        this.type = props.name;
        this.modelHeight = props.modelHeight || 1.5;

        if (props.modelFn) {
            const model = props.modelFn();
            this.add(model);
        }

        createEnemyUI(this, props.name);

        // Inicializa o userData com todos os status necessários
        this.userData = {
            hp: this.hp,
            maxHP: this.maxHP,
            type: this.type,
            hitTimer: 0,
            modelHeight: this.modelHeight,
            damageCooldown: 0,
            isFleeing: false,
            isFrozen: false,
            freezeLingerTimer: 0,
            burnTimer: 0,
            electrifiedTimer: 0,
            auraDamageAccumulator: 0,
        };
    }

    // Sobrescreve o takeDamage para usar o userData e o hitTimer
    takeDamage(amount) {
        if (!this.isAlive) return;

        this.hp -= amount;
        this.userData.hp = this.hp; // Sincroniza com userData para a UI
        this.userData.hitTimer = 10; // Ativa o piscar

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    update(player, target, finalSpeed, skipMovement = false) {
        if (!this.isAlive) return;

        // Atualiza status (timers)
        if (this.userData.damageCooldown > 0) this.userData.damageCooldown--;
        if (this.userData.freezeLingerTimer > 0) this.userData.freezeLingerTimer--;
        if (this.userData.burnTimer > 0) this.userData.burnTimer--;
        if (this.userData.electrifiedTimer > 0) this.userData.electrifiedTimer--;

        // Lógica de Fuga (Kobolds e Queimadura)
        this.userData.isFleeing = (this.type.startsWith('Kobold') && (this.hp / this.maxHP) < 0.6) || this.userData.burnTimer > 0;

        // Lógica de Movimento
        let moveDirection = new THREE.Vector3();
        let currentSpeed = finalSpeed;

        if (this.userData.isFleeing) {
            moveDirection.subVectors(this.position, player.position).normalize();
        } else {
            moveDirection.subVectors(target.position, this.position).normalize();
        }

        const isSlowed = this.userData.freezeLingerTimer > 0 || this.userData.electrifiedTimer > 0;
        if (isSlowed) {
            currentSpeed *= (this.userData.electrifiedTimer > 0) ? 0 : 0.5;
        }

        if (!skipMovement) {
            const newPosition = this.position.clone().addScaledVector(moveDirection, currentSpeed);
            handleStandardMovement(this, newPosition, currentSpeed);
        }

        // Lógica de Dano de Contato
        this.handleContactDamage(player);
    }

    handleContactDamage(player) {
        if (this.userData.damageCooldown > 0 || this.userData.electrifiedTimer > 0) return;

        const playerBBox = new THREE.Box3().setFromObject(player);
        if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(this))) {
            player.takeDamage(this.damage);
            createFloatingText(this.damage, player.position.clone().setY(1.5), '#ff0000', '1.5rem');
            this.userData.damageCooldown = 60; // 1 segundo de cooldown
        }
    }

    die() {
        super.die();
        if (player) {
            player.score += this.score;
            player.gainExperience(this.score);
            player.killsSinceLastPotion++;
            if (player.killStats && this.props && player.killStats[this.props.name] !== undefined) {
                player.killStats[this.props.name]++;
            }
        }

        if (isBossWave) killsForSoulHarvest++;

        const index = enemies.findIndex(e => e.uuid === this.uuid);
        if (index > -1) {
            enemies.splice(index, 1);
        }

        scene.remove(this);
        removeEnemyUI(this);
        enemiesAliveThisWave--;
        updateUI();
    }
}