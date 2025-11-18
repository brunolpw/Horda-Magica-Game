// js/entities/KoboldShaman.js
class KoboldShaman extends Enemy {
    constructor() {
        super(entityProps.kobold_shaman);
        this.attackCooldown = 360;
        this.attackTimer = Math.random() * 180; // Start with a random cooldown
        this.idealDistance = 10;
    }

    // Sobrescreve o método update para adicionar o comportamento de kiting e ataque
    update(player, target, finalSpeed) {
        // First, let the parent class handle status effects like fleeing, burning, etc.
        // We call the parent's update method but prevent it from moving the enemy.
        super.update(player, target, finalSpeed, true); // `true` prevents parent movement

        let moveDirection = new THREE.Vector3();
        let currentSpeed = finalSpeed;

        // If the parent class determined the enemy should flee, respect that.
        if (this.userData.isFleeing) {
            moveDirection.subVectors(this.position, player.position).normalize();
        } else {
            // Kiting Logic: maintain ideal distance
            const distanceToPlayer = this.position.distanceTo(player.position);
            if (distanceToPlayer < this.idealDistance - 1) { // Too close, move away
                moveDirection.subVectors(this.position, player.position).normalize();
            } else if (distanceToPlayer > this.idealDistance + 1) { // Too far, move closer
                moveDirection.subVectors(player.position, this.position).normalize();
            }
        }

        // Lógica de ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            createProjectile('shaman_bolt', attackDirection, this.position);
            this.attackTimer = this.attackCooldown;
        }

        // Apply movement
        const newPosition = this.position.clone().addScaledVector(moveDirection, currentSpeed);
        handleStandardMovement(this, newPosition, currentSpeed);
// js/entities/enemies/KoboldShaman.js
class KoboldShaman extends Enemy {
    constructor() {
        super(entityProps.kobold_shaman);
        this.attackCooldown = 360;
        this.attackTimer = Math.random() * 180; // Start with a random cooldown
        this.idealDistance = 10;
    }

    // Sobrescreve o método update para adicionar o comportamento de kiting e ataque
    update(player, target, finalSpeed) {
        // First, let the parent class handle status effects like fleeing, burning, etc.
        // We call the parent's update method but prevent it from moving the enemy.
        super.update(player, target, finalSpeed, true); // `true` prevents parent movement

        let moveDirection = new THREE.Vector3();
        let currentSpeed = finalSpeed;

        // If the parent class determined the enemy should flee, respect that.
        if (this.userData.isFleeing) {
            moveDirection.subVectors(this.position, player.position).normalize();
        } else {
            // Kiting Logic: maintain ideal distance
            const distanceToPlayer = this.position.distanceTo(player.position);
            if (distanceToPlayer < this.idealDistance - 1) { // Too close, move away
                moveDirection.subVectors(this.position, player.position).normalize();
            } else if (distanceToPlayer > this.idealDistance + 1) { // Too far, move closer
                moveDirection.subVectors(player.position, this.position).normalize();
            }
        }

        // Lógica de ataque
        this.attackTimer = Math.max(0, this.attackTimer - 1);
        if (this.attackTimer <= 0) {
            const attackDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
            createProjectile('shaman_bolt', attackDirection, this.position);
            this.attackTimer = this.attackCooldown;
        }

        // Apply movement
        const newPosition = this.position.clone().addScaledVector(moveDirection, currentSpeed);
        handleStandardMovement(this, newPosition, currentSpeed);
    }
}
    }
}