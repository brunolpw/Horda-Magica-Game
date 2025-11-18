// js/entities/FireElemental.js
class FireElemental extends Enemy {
    constructor() {
        super(entityProps.fire_elemental);
        this.fireTrailCooldown = 0;
    }

    update(player, target, finalSpeed) {
        // A lógica de status é tratada no update do pai
        super.update(player, target, finalSpeed);

        // Lógica do Rastro de Fogo
        this.fireTrailCooldown = Math.max(0, this.fireTrailCooldown - 1);
        if (this.fireTrailCooldown <= 0) {
            createFirePuddle(this.position.clone());
            this.fireTrailCooldown = 45; // Deixa uma poça a cada 0.75s
        }

        // Aplica o status de queimadura no contato
        if (this.userData.damageCooldown > 0) { // Se acabou de atacar
            player.userData.burnTimer = 300;
        }
    }
}