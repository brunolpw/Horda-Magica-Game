class KoboldShaman extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Xamã Kobold.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.kobold_shaman, type: 'kobold_shaman' };
        super(props, createKoboldShamanModel, position, isSummon);

        this.attackCooldown = 360; // Ataca a cada 6 segundos
        this.attackTimer = Math.random() * 180;
    }

    update(player, obstacles) {
        // Lógica de fuga específica do Kobold
        if (!this.isFleeing && (this.hp / this.maxHP) < 0.7) { // CORREÇÃO: Limiar de 70%
            this.isFleeing = true;
        }

        // CORREÇÃO: A lógica de ataque só acontece se o Xamã NÃO estiver fugindo.
        if (!this.isFleeing) {
            const distanceToPlayer = this.mesh.position.distanceTo(player.position);
            const idealDistance = 10;
            // A lógica de kiting (manter distância) será gerenciada pela classe pai
            // se não estiver fugindo. Aqui, focamos apenas no ataque.
            if (distanceToPlayer < idealDistance - 1) {
                this.attackTimer = Math.max(0, this.attackTimer - 1);
                if (this.attackTimer <= 0) {
                    const attackDirection = new THREE.Vector3().subVectors(player.position, this.mesh.position).normalize();
                    createProjectile('shaman_bolt', attackDirection, this.mesh.position);
                    this.attackTimer = this.attackCooldown;
                }
            }
        }
        // Chama a lógica da classe pai DEPOIS de definir o estado de fuga
        super.update(player, obstacles);
    }
}