// js/entities/bosses/Archlich.js
class Archlich extends Enemy {
    constructor() {
        super(entityProps.archlich);
        this.isBoss = true;
        this.bonePrisonCooldown = 1200; // 20s
        this.soulShieldCharges = 5;

        // Sincroniza para a lógica de colisão de projéteis
        this.userData.isBoss = true;
        this.userData.soulShieldCharges = this.soulShieldCharges;

        createBossShield(this.soulShieldCharges);
    }

    update(player, target, finalSpeed) {
        // O Arquilich não se move, apenas flutua e usa habilidades.
        // A lógica de status é tratada no update do pai.
        super.update(player, target, finalSpeed, true); // `true` previne o movimento do pai

        // Colheita de Almas
        if (killsForSoulHarvest >= 5) {
            const numWarriors = Math.floor(killsForSoulHarvest / 5);
            for (let k = 0; k < numWarriors; k++) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);
                createEnemy('skeleton_warrior', this.position.clone().add(offset), true);
            }
            killsForSoulHarvest %= 5; // Mantém o resto
        }
    }
}