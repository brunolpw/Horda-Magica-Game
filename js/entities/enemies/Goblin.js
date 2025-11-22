class Goblin extends Enemy {
    /**
     * @param {THREE.Vector3} position - A posição inicial do Goblin.
     */
    constructor(position, isSummon = false) {
        // Passa as propriedades do Goblin (de `entityProps`) e a função que cria o modelo 3D
        // para o construtor da classe pai (Enemy).
        const props = { ...entityProps.goblin, type: 'goblin' };
        // CORREÇÃO: Passa o status 'isSummon' para a classe pai
        super(props, createGoblinModel, position, isSummon);
    }
}