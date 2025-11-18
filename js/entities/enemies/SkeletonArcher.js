// js/entities/enemies/SkeletonArcher.js
class SkeletonArcher extends Enemy {
    constructor() {
        super(entityProps.skeleton_archer);
        this.attackCooldown = 60; // Ataca a cada 1 segundo
        this.attackTimer = Math.random() * 60;
        this.minDistance = 15;
        this.maxDistance = 20;
    }

    update(player, target, finalSpeed) {
        // First, let the parent class handle status effects like fleeing, burning, etc.
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
            createProjectile('arrow', attackDirection, this.position);
            this.attackTimer = this.attackCooldown;
        }

        // Apply movement
        const newPosition = this.position.clone().addScaledVector(moveDirection, finalSpeed);
        handleStandardMovement(this, newPosition, finalSpeed);
    }
}