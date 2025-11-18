// js/entities/KoboldShaman.js
class KoboldShaman extends Enemy {
    constructor() {
        super(entityProps.kobold_shaman);
        this.attackCooldown = 360;
        this.attackTimer = 0;
        this.idealDistance = 10;
    }

    // Sobrescreve o método update para adicionar o comportamento de kiting e ataque
    update(player, target, finalSpeed, isSlowed) {
        // A lógica de fuga e status é gerenciada na classe pai (Enemy)
        // Aqui, implementamos apenas o que é único para o Xamã

        if (this.userData.isFleeing) {
            // Se estiver fugindo, usa a lógica de movimento da classe pai
            super.update(player, target, finalSpeed, isSlowed);
            return;
        }

        // Lógica de ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            createProjectile('shaman_bolt', attackDirection, this.position);
            this.attackTimer = this.attackCooldown;
        }

        // A lógica de movimento de kiting será adicionada aqui em um próximo passo
        super.update(player, target, finalSpeed, isSlowed);
    }
}