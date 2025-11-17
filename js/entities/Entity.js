// js/entities/Entity.js
class Entity extends THREE.Group {
    constructor(props = {}) {
        super();
        this.hp = props.hp || 100;
        this.maxHP = props.hp || 100;
        this.speed = props.speed || 0;
        this.isAlive = true;

        // Armazena as propriedades originais para referência
        this.props = props;
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        // A lógica específica de morte (remover da cena, etc.) será tratada pelas classes filhas.
    }

    update() { } // Método a ser implementado pelas classes filhas
}