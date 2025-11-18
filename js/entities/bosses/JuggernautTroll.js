// js/entities/bosses/JuggernautTroll.js
class JuggernautTroll extends Enemy {
    constructor() {
        super(entityProps.juggernaut_troll);
        this.isBoss = true;
        this.armor = this.props.armor;
        this.maxArmor = this.props.armor;
        this.earthquakeCooldown = 600; // 10s

        // Sincroniza a armadura com o userData para a UI
        this.userData.armor = this.armor;
        this.userData.maxArmor = this.maxArmor;
    }

    takeDamage(amount) {
        if (this.armor > 0) {
            const armorDamage = Math.min(this.armor, amount);
            this.armor -= armorDamage;
            this.userData.armor = this.armor; // Sincroniza com a UI
            createFloatingText(Math.floor(armorDamage), this.position.clone().setY(this.modelHeight || 1.5), '#A9A9A9');
            amount -= armorDamage;
        }

        if (amount > 0) {
            super.takeDamage(amount); // Chama o takeDamage da classe Enemy para dano na vida
        }
    }

    update(player, target, finalSpeed) {
        // Aumenta o dano conforme perde vida
        const hpPercentage = this.hp / this.maxHP;
        this.damage = this.props.damage + Math.floor((1 - hpPercentage) * 20);

        // Lógica do Terremoto
        this.earthquakeCooldown = Math.max(0, this.earthquakeCooldown - 1);
        if (this.earthquakeCooldown <= 0) {
            triggerEarthquakeVisual(this.position, 25);
            // A lógica de dano do terremoto ainda está em game.js, será movida depois
            this.earthquakeCooldown = 600;
        }

        // Chama o update do pai para movimento e dano de contato
        super.update(player, target, finalSpeed);
    }
}