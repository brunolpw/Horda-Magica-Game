// js/entities/SummonerElemental.js
class SummonerElemental extends Enemy {
    constructor() {
        super(entityProps.summoner_elemental);
        this.summonCooldown = 600; // Invoca a cada 10s
        this.attackCooldown = 240; // Ataca a cada 4s
        this.attackTimer = 120;
        this.minDistance = 18;
        this.auraRadius = 10;
    }

    update(player, target, finalSpeed) {
        // A lógica de status é tratada no update do pai, mas o movimento é controlado aqui.
        super.update(player, target, finalSpeed, true); // `true` previne o movimento do pai

        let moveDirection = new THREE.Vector3();

        // Lógica de Kiting: Tenta manter distância do jogador
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < this.minDistance) {
            moveDirection.subVectors(this.position, player.position).normalize();
        }

        // Lógica de Ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            const proj = createProjectile('necro_bolt', attackDirection, this.position);
            if (proj) proj.userData.damage = this.damage;
            this.attackTimer = this.attackCooldown;
        }

        // Lógica de Invocação
        this.summonCooldown = Math.max(0, this.summonCooldown - 1);
        if (this.summonCooldown <= 0) {
            triggerElementalSummon(this.position);
            this.summonCooldown = 600;
        }

        // Aplica movimento
        const newPosition = this.position.clone().addScaledVector(moveDirection, finalSpeed);
        handleStandardMovement(this, newPosition, finalSpeed);
    }
}