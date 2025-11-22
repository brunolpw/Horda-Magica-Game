class Skeleton extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Esqueleto.
     * @param {boolean} isSummon - Se foi invocado.
     */
    constructor(position, isSummon = false) {
        const props = { ...entityProps.skeleton, type: 'skeleton' };
        super(props, createSkeletonModel, position, isSummon);
    }

    update(player, obstacles) {
        // Esqueletos usam a lógica de movimento padrão da classe Enemy.
        super.update(player, obstacles);
    }
}