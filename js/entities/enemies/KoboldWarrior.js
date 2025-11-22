class KoboldWarrior extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Guerreiro Kobold.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.kobold_warrior, type: 'kobold_warrior' };
        super(props, createKoboldWarriorModel, position, isSummon);
    }

    update(player, obstacles) {
        // Lógica de fuga específica do Kobold
        if (!this.isFleeing && (this.hp / this.maxHP) < 0.7) { // CORREÇÃO: Limiar de 70%
            this.isFleeing = true;
        }
        // Chama a lógica da classe pai DEPOIS de definir o estado de fuga
        super.update(player, obstacles);
    }
}