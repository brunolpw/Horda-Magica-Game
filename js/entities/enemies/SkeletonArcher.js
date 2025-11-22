class SkeletonArcher extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Arqueiro.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.skeleton_archer, type: 'skeleton_archer' };
        super(props, createSkeletonArcherModel, position, isSummon);

        // Propriedades específicas do Arqueiro
        this.attackCooldown = 60; // Ataca a cada 1 segundo
        this.attackTimer = Math.random() * 60;
    }

    update(player, obstacles) {
        const distanceToPlayer = this.mesh.position.distanceTo(player.position);
        const minDistance = 15; // Distância mínima que ele quer manter
        const maxDistance = 20; // Distância máxima antes de se aproximar
        let direction = new THREE.Vector3(0, 0, 0);

        if (distanceToPlayer < minDistance) {
            // Se muito perto, afasta-se
            direction.subVectors(this.mesh.position, player.position);
        } else if (distanceToPlayer > maxDistance) {
            // Se muito longe, aproxima-se
            direction.subVectors(player.position, this.mesh.position);
        }

        // Lógica de ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.mesh.position).normalize();
            createProjectile('arrow', attackDirection, this.mesh.position);
            this.attackTimer = this.attackCooldown;
        }

        // A lógica de movimento é tratada na classe pai, que já usa a 'direction'
        super.update(player, obstacles);
    }

    // Sobrescreve o método de colisão para não causar dano de toque
    checkPlayerCollision(player) {
        // Arqueiros não causam dano de contato.
    }
}