// js/entities/bosses/StormSovereign.js
class StormSovereign extends Enemy {
    constructor() {
        super(entityProps.storm_sovereign);
        this.isBoss = true;
        this.isInvulnerable = true;
        this.teleportCooldown = 480; // 8s

        this.conduits = [];
        this.beams = [];

        this.userData.isBoss = true;
        this.userData.isInvulnerable = true;

        this._createConduits(3);
    }

    update(player, target, finalSpeed) {
        // O Soberano não tem lógica de status como os outros, então não chamamos super.update()

        // Movimento errático
        const randomDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        const newPosition = this.position.clone().addScaledVector(randomDir, this.speed);
        handleStandardMovement(this, newPosition, this.speed);

        // Animação de pulsação
        const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
        this.scale.set(scale, scale, scale);

        this.teleportCooldown = Math.max(0, this.teleportCooldown - 1);
        if (this.teleportCooldown <= 0) {
            triggerTeleport(this);
            this.teleportCooldown = 480;
        }

        // Atualiza e verifica os raios
        this._updateBeams();
        this._checkBeamCollisions(player);
    }

    // Método para ser chamado quando um conduíte é destruído
    onConduitDestroyed() {
        this._updateBeams();
        if (this.conduits.length === 0) {
            this.isInvulnerable = false; // Fica vulnerável
            handleBossDefeat(this);
        }
    }

    _createConduits(count) {
        const conduitGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const conduitMat = new THREE.MeshLambertMaterial({ color: 0x9400D3, emissive: 0x8A2BE2, emissiveIntensity: 1.5 });

        for (let i = 0; i < count; i++) {
            const conduit = new THREE.Mesh(conduitGeo, conduitMat);
            const angle = (i / count) * Math.PI * 2;
            const radius = 20;
            conduit.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
            
            conduit.userData = {
                isConduit: true,
                boss: this, // Referência de volta para o chefe
                hp: this.maxHP / count,
                maxHP: this.maxHP / count
            };
            
            this.conduits.push(conduit);
            scene.add(conduit);
        }
        this._updateBeams();
    }

    _updateBeams() {
        this.beams.forEach(beam => scene.remove(beam));
        this.beams.length = 0;

        if (this.conduits.length < 2) return;

        for (let i = 0; i < this.conduits.length; i++) {
            const startPoint = this.conduits[i].position;
            const endPoint = this.conduits[(i + 1) % this.conduits.length].position;

            const distance = startPoint.distanceTo(endPoint);
            const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.6 });
            const beam = new THREE.Mesh(beamGeo, beamMat);

            beam.position.copy(startPoint).lerp(endPoint, 0.5);
            beam.lookAt(endPoint);
            beam.rotateX(Math.PI / 2);

            this.beams.push(beam);
            scene.add(beam);
        }
    }

    _checkBeamCollisions(player) {
        const playerBBox = new THREE.Box3().setFromObject(player);
        for (const beam of this.beams) {
            if (playerBBox.intersectsBox(new THREE.Box3().setFromObject(beam))) {
                damagePlayer(0.5, true); // Dano elemental contínuo
                break;
            }
        }
    }
}