// js/entities/Enemy.js
class Enemy extends Entity {
    constructor(props) {
        // Passa as propriedades para a classe pai (Entity)
        super(props);

        this.score = props.score || 0;
        this.damage = props.damage || 5;
        this.type = props.name; // Para referência e UI
        this.modelHeight = props.modelHeight || 1.5;

        // Adiciona o modelo 3D específico deste inimigo
        if (props.modelFn) {
            const model = props.modelFn();
            this.add(model);
        }

        // Cria a UI (barra de vida, nome) para este inimigo
        // Assumimos que createEnemyUI é uma função global por enquanto
        createEnemyUI(this, props.name);

        // Copia as propriedades para o userData para manter a compatibilidade com a lógica antiga
        // Isso será removido gradualmente conforme a refatoração avança
        this.userData = {
            ...this.userData,
            type: this.type,
            hp: this.hp,
            maxHP: this.maxHP,
            speed: this.speed,
            score: this.score,
            damage: this.damage,
            hitTimer: 0,
            modelHeight: this.modelHeight,
        };
    }

    // Comportamento padrão: perseguir o jogador
    update(player, finalSpeed) {
        if (!this.isAlive) return;

        const direction = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        const newPosition = this.position.clone().addScaledVector(direction, finalSpeed);
        handleStandardMovement(this, newPosition, finalSpeed);
    }
}