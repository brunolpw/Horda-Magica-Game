// js/entities/bosses/KoboldKing.js
class KoboldKing extends Enemy {
    constructor() {
        super(entityProps.kobold_king);
        this.isBoss = true;
        this.junkLaunchCooldown = 600; // 10s
        this.summonCooldown = 900; // 15s
        this.isEnraged = false;
    }

    update(player, target, finalSpeed) {
        // The parent's update handles basic status timers, but we control movement and actions here.
        super.update(player, target, finalSpeed, true); // `true` prevents parent movement

        // Enrage logic
        if (!this.isEnraged && this.hp / this.maxHP < 0.5) {
            this.isEnraged = true;
            this.speed *= 1.3;
        }

        // Standard chase logic
        const moveDirection = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(moveDirection, this.speed); // Use this.speed for enrage
        handleStandardMovement(this, newPosition, this.speed);

        // Abilities
        const furyMultiplier = this.isEnraged ? 0.6 : 1.0;

        this.junkLaunchCooldown = Math.max(0, this.junkLaunchCooldown - 1);
        if (this.junkLaunchCooldown <= 0) {
            triggerJunkLaunch(this.position, this.isEnraged);
            this.junkLaunchCooldown = 600 * furyMultiplier;
        }

        this.summonCooldown = Math.max(0, this.summonCooldown - 1);
        if (this.summonCooldown <= 0) {
            spawnKoboldGroup(this.position);
            this.summonCooldown = 900 * furyMultiplier;
        }
    }
}