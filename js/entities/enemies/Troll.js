// js/entities/Troll.js
// js/entities/enemies/Troll.js
class Troll extends Enemy {
    constructor() {
        super(entityProps.troll);
    }
    // Não precisa de um método 'update' aqui, pois ele usará o da classe Enemy (perseguir o jogador).
}