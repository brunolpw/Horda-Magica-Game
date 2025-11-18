// js/entities/LightningElemental.js
// js/entities/enemies/LightningElemental.js
class LightningElemental extends Enemy {
    constructor() {
        super(entityProps.lightning_elemental);
        this.teleportCooldown = 300; // Teleporta a cada 5s
        this.isTeleporting = false;
    }

    update(player, target, finalSpeed) {
        if (this.isTeleporting) return; // Não faz nada enquanto a animação de teleporte ocorre

        // A lógica de status é tratada no update do pai
        super.update(player, target, finalSpeed);

        this.teleportCooldown = Math.max(0, this.teleportCooldown - 1);

        if (this.teleportCooldown <= 0) {
            // A função triggerTeleport agora recebe a flag 'isTeleporting' do próprio objeto
            this.isTeleporting = true; 
            triggerTeleport(this);
            this.teleportCooldown = 300; // Reseta o cooldown
        }
    }
}