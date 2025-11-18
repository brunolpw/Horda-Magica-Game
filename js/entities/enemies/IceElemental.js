// js/entities/enemies/IceElemental.js
class IceElemental extends Enemy {
    constructor() {
        super(entityProps.ice_elemental);
        this.auraRadius = 12;
    }

    update(player, target, finalSpeed) {
        // The parent update will handle standard movement and contact damage.
        super.update(player, target, finalSpeed);

        // Aura Logic: Slows the player if they are within the aura radius.
        if (this.position.distanceTo(player.position) < this.auraRadius) {
            player.userData.slowTimer = 120; // Apply slow for 2 seconds
        }
    }

    die() {
        triggerIceShatter(this.position); // Specific on-death effect
        super.die(); // Calls the parent's die method to handle cleanup
    }
}