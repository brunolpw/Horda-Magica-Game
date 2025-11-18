// js/entities/Orc.js
class Orc extends Enemy {
    constructor() {
        super(entityProps.orc);
    }
    // Não precisa de um método 'update' aqui, pois ele usará o da classe Enemy (perseguir o jogador).
}