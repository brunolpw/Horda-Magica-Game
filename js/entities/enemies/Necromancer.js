class Necromancer extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Necromante.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.necromancer, type: 'necromancer' };
        super(props, createNecromancerModel, position, isSummon);

        // Propriedades específicas do Necromante
        this.summonCooldown = Math.random() * 240; // Cooldown inicial aleatório (até 4s)
        this.summonInterval = 480; // Invoca a cada 8 segundos
        this.attackCooldown = 120; // Ataca a cada 2 segundos
        this.attackTimer = Math.random() * 120;
    }

    update(player, obstacles) {
        // Lógica de invocação
        this.summonCooldown = Math.max(0, this.summonCooldown - 1);
        if (this.summonCooldown <= 0 && enemies.length < maxActiveEnemies) {
            const summonRoll = Math.random() * 100;
            let summonType = summonRoll < 50 ? 'skeleton' : (summonRoll < 80 ? 'skeleton_archer' : 'skeleton_warrior');
            
            const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            createEnemy(summonType, this.mesh.position.clone().add(offset), true);
            this.summonCooldown = this.summonInterval;
        }

        // Lógica de ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.mesh.position).normalize();
            createProjectile('necro_bolt', attackDirection, this.mesh.position);
            this.attackTimer = this.attackCooldown;
        }

        // A lógica de kiting (manter distância) é tratada na classe pai.
        // O Necromante não foge, então não precisamos definir `isFleeing`.
        // Apenas garantimos que a lógica de movimento padrão seja chamada.
        super.update(player, obstacles);
    }

    // Sobrescreve o método de colisão para não causar dano de toque
    checkPlayerCollision(player) {
        // Necromantes não causam dano de contato.
    }
}