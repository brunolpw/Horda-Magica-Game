// js/entities/Goblin.js
class Goblin extends Enemy {
    constructor() {
        super(entityProps.goblin);
    }
    // Não precisa de um método 'update' aqui, pois ele usará o da classe Enemy (perseguir o jogador).
}