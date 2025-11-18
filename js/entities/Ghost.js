// js/entities/Ghost.js
class Ghost extends Enemy {
    constructor() {
        super(entityProps.ghost);
    }

    update(player, target, finalSpeed) {
        // Let the parent class handle status effects (fleeing, burning, etc.)
        // but skip its movement logic by passing `true`.
        super.update(player, target, finalSpeed, true);

        let moveDirection = new THREE.Vector3();
        let currentSpeed = finalSpeed;

        // The parent class's update method sets this.userData.isFleeing.
        // Ghosts, however, should ignore the clone and always target the player.
        if (this.userData.isFleeing) {
            moveDirection.subVectors(this.position, player.position).normalize();
        } else {
            moveDirection.subVectors(player.position, this.position).normalize();
        }

        const isSlowed = this.userData.freezeLingerTimer > 0 || this.userData.electrifiedTimer > 0;
        if (isSlowed) {
            currentSpeed *= (this.userData.electrifiedTimer > 0) ? 0 : 0.5;
        }

        // Apply movement directly, ignoring obstacles and the handleStandardMovement function.
        this.position.addScaledVector(moveDirection, currentSpeed);

        // The parent's update method already calls handleContactDamage, so we don't need to call it again.
    }
}