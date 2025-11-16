// Este arquivo contém a lógica para gerenciar as ondas de inimigos e os chefes.

// --- Variáveis de Estado das Ondas ---
let currentWave = 0;
let enemiesToSpawnThisWave = 0;
let enemiesAliveThisWave = 0;
let monstersInPreviousWave = 0;
let intraWaveSpawnTimer = 0;

// --- Variáveis de Estado dos Chefes ---
let isBossWave = false;
let currentBoss = null;
let killsForSoulHarvest = 0;

const maxActiveEnemies = 40;

// --- Funções de Gerenciamento de Ondas ---

function startNextWave() {
    currentWave++;

    const bossWaveCondition = currentWave === 7 || currentWave === 15 || currentWave === 30;
    if (bossWaveCondition) {
        let bossType;
        switch(currentWave) {
            case 7: bossType = 'goblin_king'; break;
            case 15: bossType = 'juggernaut_troll'; break;
            case 30:
                bossType = 'archlich';
                createBossShield(5);
                break;
        }

        if (bossType) createEnemy(bossType, new THREE.Vector3(0, 0, 0));
        isBossWave = true;
        currentBoss = enemies[enemies.length - 1];
    }

    monstersInPreviousWave = enemiesAliveThisWave;
    
    const growthRate = 1.3;
    const baseNum = monstersInPreviousWave > 0 ? monstersInPreviousWave : 5;
    const numMonsters = currentWave === 1 ? 5 : Math.floor(baseNum * growthRate);

    enemiesToSpawnThisWave = numMonsters;
    enemiesAliveThisWave = numMonsters;
    updateUI();
}

function spawnEnemies() {
    if (enemiesAliveThisWave <= 0 && !isBossWave) {
        startNextWave();
    }

    if (enemiesToSpawnThisWave > 0 && enemies.length < maxActiveEnemies) {
        intraWaveSpawnTimer++;
        if (intraWaveSpawnTimer >= 60) {
            const angle = Math.random() * Math.PI * 2;
            const radius = mapSize + 5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const position = new THREE.Vector3(x, 0, z);

            let type;
            const roll = Math.random() * 100;

            if (currentWave < 5) {
                type = 'goblin';
            } else if (currentWave < 8) {
                type = roll < 70 ? 'goblin' : 'orc';
            } else if (currentWave < 12) {
                if (roll < 50) type = 'goblin';
                else if (roll < 80) type = 'orc';
                else type = 'troll';
            } else if (currentWave < 15) {
                if (roll < 40) type = 'goblin';
                else if (roll < 65) type = 'orc';
                else if (roll < 85) type = 'troll';
                else type = 'necromancer';
            } else if (currentWave < 20) {
                if (roll < 20) type = 'goblin';
                else if (roll < 40) type = 'orc';
                else if (roll < 55) type = 'troll';
                else if (roll < 70) type = 'necromancer';
                else if (roll < 85) type = 'skeleton';
                else type = 'ghost';
            } else if (currentWave < 25) { // Ondas 20-24
                if (roll < 20) type = 'skeleton_warrior';
                else if (roll < 40) type = 'ghost';
                else if (roll < 55) type = 'necromancer';
                else if (roll < 75) type = 'fire_elemental';
                else if (roll < 90) type = 'ice_elemental';
                else type = 'lightning_elemental';
            } else if (currentWave < 30) { // Ondas 25-29 (Invocador aparece)
                if (roll < 20) type = 'fire_elemental';
                else if (roll < 40) type = 'ice_elemental';
                else if (roll < 60) type = 'lightning_elemental';
                else if (roll < 85) type = 'skeleton_warrior';
                else type = 'summoner_elemental';
            } else { // Onda 30+
                if (roll < 30) type = 'summoner_elemental';
                else if (roll < 60) type = 'juggernaut_troll'; // Juggernaut como inimigo comum
                else type = 'archlich'; // Arquilich como inimigo comum
            }

            createEnemy(type, position);
            enemiesToSpawnThisWave--;
            intraWaveSpawnTimer = 0;
        }
    }
}

function resetWaveState() {
    currentWave = 0;
    enemiesAliveThisWave = 0;
    isBossWave = false;
    currentBoss = null;
    enemiesToSpawnThisWave = 0;
    monstersInPreviousWave = 0;
    killsForSoulHarvest = 0;
}