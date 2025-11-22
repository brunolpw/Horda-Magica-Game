class Orc extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Orc.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.orc, type: 'orc' };
        super(props, createOrcModel, position, isSummon);
    }

    update(player, obstacles) {
        // Orcs usam a lógica de movimento padrão da classe Enemy.
        super.update(player, obstacles);
    }
}