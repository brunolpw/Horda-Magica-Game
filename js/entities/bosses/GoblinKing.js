// js/entities/bosses/GoblinKing.js
class GoblinKing extends Enemy {
    constructor() {
        super(entityProps.goblin_king);
        this.isBoss = true;
        this.summonCooldown = 300; // Cooldown inicial de 5s
        this.summonInterval = 900; // Invoca a cada 15 segundos
        this.rockThrowCooldown = 0;
    }

    update(player, target, finalSpeed) {
        // The parent's update handles basic status timers, but we control movement and actions here.
        super.update(player, target, finalSpeed, true); // `true` prevents parent movement

        let moveDirection = new THREE.Vector3();

        // Fleeing logic
        if (this.hp / this.maxHP < 0.3) {
            moveDirection.subVectors(this.position, player.position).normalize();

            // Rock throw logic while fleeing
            this.rockThrowCooldown = Math.max(0, this.rockThrowCooldown - 1);
            if (this.rockThrowCooldown <= 0) {
                const rockTargetPosition = player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
                triggerRockFall(rockTargetPosition);
                this.rockThrowCooldown = 240; // Throws a rock every 4 seconds
            }
        } else {
            // Standard chase logic
            moveDirection.subVectors(player.position, this.position).normalize();
        }

        // Summoning logic
        this.summonCooldown = Math.max(0, this.summonCooldown - 1);
        if (this.summonCooldown <= 0 && enemies.length < maxActiveEnemies) {
            const summonCount = 5 + Math.floor(Math.random() * 6);
            for (let j = 0; j < summonCount; j++) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
                createEnemy('goblin', this.position.clone().add(offset), true);
            }
            this.summonCooldown = this.summonInterval;
        }

        // Apply movement
        const newPosition = this.position.clone().addScaledVector(moveDirection, finalSpeed);
        handleStandardMovement(this, newPosition, finalSpeed);
    }
}