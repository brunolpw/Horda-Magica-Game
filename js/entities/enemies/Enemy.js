class Enemy {
    constructor(props, modelFn, position, isSummon = false) {
        // Propriedades básicas do inimigo
        this.hp = props.hp;
        this.maxHP = props.hp;
        this.speed = props.speed;
        this.score = props.score;
        this.damage = props.damage;
        this.name = props.name;
        this.type = props.type; // 'goblin', 'orc', etc.

        // Propriedades de estado
        this.hitTimer = 0;
        this.damageCooldown = 0;
        this.isFrozen = false;
        this.freezeLingerTimer = 0;
        this.electrifiedTimer = 0;
        this.burnTimer = 0;
        this.auraDamageAccumulator = 0; // Acumula dano de auras
        this.isFleeing = false;
        this.isSummon = isSummon; // CORREÇÃO: Armazena o status de invocação

        // Cria o objeto 3D (mesh)
        this.mesh = modelFn();
        this.mesh.position.copy(position);
        this.mesh.position.y = 0;

        // Adiciona uma referência da classe ao mesh para fácil acesso
        this.mesh.userData.class = this;

        // Guarda a cor original para o feedback de dano
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.userData.originalColor = child.material.color.getHex();
            }
        });

        // Adiciona o inimigo à cena principal
        scene.add(this.mesh);
    }

    /**
     * Lógica de atualização chamada a cada frame.
     * @param {THREE.Object3D} player - A referência ao objeto do jogador.
     * @param {Array<THREE.Object3D>} obstacles - A lista de obstáculos no mapa.
     */
    update(player, obstacles) {
        // Decrementa timers
        if (this.damageCooldown > 0) this.damageCooldown--;

        // Lógica de feedback de dano (piscar branco)
        this.updateHitFeedback();

        // Lógica da Bolha de Repulsão
        if (repulsionBubbleTimer > 0) {
            const distanceToPlayer = this.mesh.position.distanceTo(player.position);
            const repulsionRadius = 4;
            if (distanceToPlayer < repulsionRadius) {
                const pushDirection = new THREE.Vector3().subVectors(this.mesh.position, player.position).normalize();
                const pushSpeed = 0.1;
                this.mesh.position.addScaledVector(pushDirection, pushSpeed);
                return; // Pula o resto da lógica de movimento
            }
        }

        // --- LÓGICA DE AURAS E STATUS ---
        let finalSpeed = this.speed;
        let isSlowed = false;

        // Aplicação das auras do jogador
        const distanceToPlayer = this.mesh.position.distanceTo(player.position);
        const auraRadius = 6;
        if (distanceToPlayer < auraRadius) {
            if (freezingAuraTimer > 0 && this.type !== 'ice_elemental') this.freezeLingerTimer = 600;
            if (flamingAuraTimer > 0 && this.type !== 'fire_elemental') this.burnTimer = 600;
            if (electrifyingAuraTimer > 0 && this.type !== 'lightning_elemental') this.electrifiedTimer = 120;
        }

        // Processamento do status de Congelamento
        if (this.freezeLingerTimer > 0) {
            this.freezeLingerTimer--;
            this.isFrozen = true;
            isSlowed = true;
            if (this.freezeLingerTimer % 60 === 0) { // Dano a cada segundo
                let damage = 5 * getWeaknessMultiplier('ice', this.type);
                this.takeDamage(damage);
                this.auraDamageAccumulator += damage;
            }
            if (this.auraDamageAccumulator >= 5 && this.hp > 0) {
                createFloatingText(Math.floor(this.auraDamageAccumulator), this.mesh.position.clone().setY(1.5), '#87CEFA');
                this.auraDamageAccumulator = 0;
            }
        } else {
            this.isFrozen = false;
        }

        // Processamento do status Eletrificado
        if (this.electrifiedTimer > 0) {
            this.electrifiedTimer--;
            isSlowed = true;
            if (this.electrifiedTimer % 60 === 0) { // Dano a cada segundo
                let damage = 25 * getWeaknessMultiplier('lightning', this.type);
                this.takeDamage(damage);
                createFloatingText(Math.floor(damage), this.mesh.position.clone().setY(this.mesh.userData.modelHeight || 1.5), '#fde047');
            }
        }

        // Efeito visual de piscar amarelo quando eletrificado
        if (this.electrifiedTimer > 0) {
            if (Math.random() > 0.5) {
                this.mesh.traverse(child => {
                    if (child.isMesh) child.material.color.setHex(0xfde047);
                });
            }
        }

        // Efeito visual de fogo quando queimado
        if (this.burnTimer > 0 && this.type !== 'ghost' && this.type !== 'fire_elemental') {
            if (Math.random() < 0.3) {
                const modelHeight = this.mesh.userData.modelHeight || 1.5;
                const particleSize = 0.1 + (modelHeight * 0.05); // Partículas maiores para monstros maiores
                const fireParticleGeo = new THREE.SphereGeometry(particleSize, 4, 4);
                const fireParticleMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff4500 : 0xffa500 });
                const fireParticle = new THREE.Mesh(fireParticleGeo, fireParticleMat);
                const offset = new THREE.Vector3((Math.random() - 0.5) * modelHeight * 0.8, Math.random() * modelHeight, (Math.random() - 0.5) * modelHeight * 0.8);
                fireParticle.position.copy(this.mesh.position).add(offset);
                scene.add(fireParticle);
                setTimeout(() => scene.remove(fireParticle), 200 + Math.random() * 200);
            }
        }

        // Processamento do status Queimadura (fuga)
        if (this.burnTimer > 0) {
            this.burnTimer--;
            if (this.type !== 'ghost' && this.type !== 'fire_elemental') {
                this.isFleeing = true;
            }
        } else if (this.isFleeing && !this.type.startsWith('kobold')) {
            // CORREÇÃO: Apenas para de fugir se não for um Kobold (que tem sua própria lógica de fuga).
            this.isFleeing = false;
        }

        // --- LÓGICA DE MOVIMENTO ---
        let target = player;
        if (clone && cloneTimer > 0 && this.type !== 'ghost' && !this.isBoss) {
            target = clone;
        }

        let direction;
        if (this.isFleeing) {
            // Foge do alvo
            direction = new THREE.Vector3().subVectors(this.mesh.position, target.position).normalize();
        } else {
            // Persegue o alvo
            direction = new THREE.Vector3().subVectors(target.position, this.mesh.position).normalize();
        }

        // Aplica lentidão se necessário
        const speedMultiplier = isSlowed ? (this.electrifiedTimer > 0 ? 0 : 0.5) : 1.0;
        const newPosition = this.mesh.position.clone().addScaledVector(direction, finalSpeed * speedMultiplier);
        
        // Usa a função global de movimento que já lida com colisões
        handleStandardMovement(this.mesh, newPosition, finalSpeed * speedMultiplier);

        // Lógica de colisão com o jogador para causar dano
        if (this.electrifiedTimer <= 0) { // CORREÇÃO: Só causa dano se não estiver paralisado
            this.checkPlayerCollision(player);
        }

        // CORREÇÃO: Mantém os inimigos refatorados dentro do mapa.
        if (Math.abs(this.mesh.position.x) > mapSize) {
            this.mesh.position.x = Math.sign(this.mesh.position.x) * mapSize;
        }
        if (Math.abs(this.mesh.position.z) > mapSize) {
            this.mesh.position.z = Math.sign(this.mesh.position.z) * mapSize;
        }
    }

    /**
     * Aplica o efeito visual de piscar quando o inimigo leva dano.
     */
    updateHitFeedback() {
        if (this.hitTimer > 0) {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.color.setHex(0xFFFFFF);
                }
            });
            this.hitTimer--;
        } else {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material && child.userData.originalColor) {
                    child.material.color.setHex(child.userData.originalColor);
                }
            });
        }
    }

    /**
     * Verifica a colisão com o jogador e aplica dano se necessário.
     * @param {THREE.Object3D} player 
     */
    checkPlayerCollision(player) {
        const playerBBox = new THREE.Box3().setFromObject(player);
        if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(this.mesh))) {
            if (this.damageCooldown <= 0) {
                // CORREÇÃO: Verifica se o dano é elemental para que o Escudo Mágico funcione corretamente.
                const isElemental = this.type.includes('elemental');
                damagePlayer(this.damage, isElemental);
                createFloatingText(this.damage, player.position.clone().setY(1.5), '#ff0000', '1.5rem');
                // Aplica queimadura no contato se for um elemental de fogo
                if (this.type === 'fire_elemental') {
                    player.userData.burnTimer = 300;
                }
                this.damageCooldown = 60; // Cooldown de 1 segundo
            }
        }
    }

    /**
     * Aplica dano a este inimigo.
     * @param {number} amount - A quantidade de dano a ser recebida.
     */
    takeDamage(amount) {
        this.hp -= amount;
        this.hitTimer = 10; // Ativa o feedback visual por 10 frames
    }

    /**
     * Verifica se o inimigo está morto.
     * @returns {boolean}
     */
    isDead() {
        return this.hp <= 0;
    }
}