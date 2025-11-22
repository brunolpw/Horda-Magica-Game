class Troll extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Troll.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.troll, type: 'troll' };
        super(props, createTrollModel, position, isSummon);
    }

    update(player, obstacles) {
        // Trolls usam a lógica de movimento padrão da classe Enemy.
        super.update(player, obstacles);
    }
}