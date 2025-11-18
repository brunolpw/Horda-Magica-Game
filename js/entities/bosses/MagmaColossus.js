// js/entities/bosses/MagmaColossus.js
class MagmaColossus extends Enemy {
    constructor() {
        super(entityProps.magma_colossus);
        this.isBoss = true;
        this.eruptionCooldown = 900; // 15s
        this.meteorShowerCooldown = 600; // 10s
        this.isEnraged = false;
    }

    update(player, target, finalSpeed) {
        // A lógica de status é tratada no update do pai, mas o movimento e ações são controlados aqui.
        super.update(player, target, finalSpeed, true); // `true` previne o movimento do pai

        // Lógica de Fúria
        if (!this.isEnraged && this.hp / this.maxHP < 0.5) {
            this.isEnraged = true;
            this.speed *= 1.5; // Aumenta a velocidade
        }

        // Movimento e rastro de lava
        const moveDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(moveDirection, this.speed);
        handleStandardMovement(this, newPosition, this.speed);
        if (Math.random() < 0.1) {
            createFirePuddle(this.position.clone(), 1.5, 480); // Poças maiores e mais duradouras
        }

        // Habilidades
        const furyMultiplier = this.isEnraged ? 0.7 : 1.0; // Ataques mais rápidos na fúria
        this.eruptionCooldown = Math.max(0, this.eruptionCooldown - 1);
        if (this.eruptionCooldown <= 0) {
            triggerEruption(this.position);
            this.eruptionCooldown = 900 * furyMultiplier;
        }
        this.meteorShowerCooldown = Math.max(0, this.meteorShowerCooldown - 1);
        if (this.meteorShowerCooldown <= 0) {
            triggerMeteorShower(5);
            this.meteorShowerCooldown = 600 * furyMultiplier;
        }
    }
}