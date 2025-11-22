class SkeletonWarrior extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Esqueleto Guerreiro.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.skeleton_warrior, type: 'skeleton_warrior' };
        super(props, createSkeletonWarriorModel, position, isSummon);
    }

    update(player, obstacles) {
        // Esqueletos Guerreiros usam a lógica de movimento padrão da classe Enemy.
        super.update(player, obstacles);
    }
}