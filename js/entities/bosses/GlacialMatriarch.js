// js/entities/bosses/GlacialMatriarch.js
class GlacialMatriarch extends Enemy {
    constructor() {
        super(entityProps.glacial_matriarch);
        this.isBoss = true;
        this.shardLaunchCooldown = 480; // 8s
        this.icePrisonCooldown = 1200; // 20s
        this.isEnraged = false;
        this.shardShields = [];
        this.maxShards = 5;

        // Sincroniza para a lógica de colisão de projéteis
        this.userData.isBoss = true;
        this.userData.shardShields = this.shardShields;

        createIceShardShield(this, this.maxShards); // Cria o escudo inicial
    }

    update(player, target, finalSpeed) {
        // A lógica de status é tratada no update do pai, mas o movimento e ações são controlados aqui.
        super.update(player, target, finalSpeed, true); // `true` previne o movimento do pai

        // Lógica de Fúria (Nevasca)
        if (!this.isEnraged && this.hp / this.maxHP < 0.5) {
            this.isEnraged = true;
            triggerBlizzard(true);
        }

        // Movimento flutuante
        const moveDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(moveDirection, this.speed);
        handleStandardMovement(this, newPosition, this.speed);

        // Regenera cacos do escudo
        if (this.shardShields.length < this.maxShards && Math.random() < 0.005) {
            createIceShardShield(this, 1);
        }

        // Habilidades
        const furyMultiplier = this.isEnraged ? 0.6 : 1.0;
        this.shardLaunchCooldown = Math.max(0, this.shardLaunchCooldown - 1);
        if (this.shardLaunchCooldown <= 0 && this.shardShields.length > 0) {
            const shardToLaunch = this.shardShields.pop();
            scene.remove(shardToLaunch);
            const launchDir = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            createProjectile('ice_shard', launchDir, this.position);
            this.shardLaunchCooldown = 480 * furyMultiplier;
        }
    }
}