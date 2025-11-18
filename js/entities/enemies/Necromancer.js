// js/entities/enemies/Necromancer.js
class Necromancer extends Enemy {
    constructor() {
        super(entityProps.necromancer);
        this.summonCooldown = Math.random() * 240; // Cooldown inicial aleatório (até 4s)
        this.summonInterval = 480; // Invoca a cada 8 segundos
        this.attackCooldown = 120; // Ataca a cada 2 segundos
        this.attackTimer = Math.random() * 120;
        this.minDistance = 10;
        this.maxDistance = 15;
    }

    update(player, target, finalSpeed) {
        // Let the parent class handle status effects
        super.update(player, target, finalSpeed, true); // `true` prevents parent movement

        let moveDirection = new THREE.Vector3();

        // Kiting Logic
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < this.minDistance) {
            moveDirection.subVectors(this.position, player.position).normalize();
        } else if (distanceToPlayer > this.maxDistance) {
            moveDirection.subVectors(player.position, this.position).normalize();
        }

        // Attack Logic
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            createProjectile('necro_bolt', attackDirection, this.position);
            this.attackTimer = this.attackCooldown;
        }

        // Summoning Logic
        this.summonCooldown = Math.max(0, this.summonCooldown - 1);
        if (this.summonCooldown <= 0 && enemies.length < maxActiveEnemies) {
            const summonType = Math.random() < 0.7 ? 'skeleton' : 'skeleton_archer';
            const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            createEnemy(summonType, this.position.clone().add(offset), true);
            this.summonCooldown = this.summonInterval;
        }

        // Apply movement
        const newPosition = this.position.clone().addScaledVector(moveDirection, finalSpeed);
        handleStandardMovement(this, newPosition, finalSpeed);
    }
}