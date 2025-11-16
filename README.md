# Horda Mágica 3D

**Horda Mágica** é um jogo de sobrevivência 3D do gênero *roguelite/bullet-heaven*, onde você controla um mago poderoso que deve enfrentar hordas infinitas de monstros. A cada nível, você aprimora suas habilidades e se torna mais forte para enfrentar desafios cada vez maiores, incluindo chefes épicos.

---

## ✨ Habilidades do Mago

A progressão do mago é feita através de um sistema de level up, onde você pode escolher entre aprimorar atributos passivos ou aprender/melhorar magias ativas.

### Habilidades Passivas (Atributos)

| Ícone | Habilidade            | Efeito por Nível (1 a 5)                                                                                             |
| :---: | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
|  💥   | **Poder Arcano**      | Aumenta o dano do ataque básico em **+2 / +4 / +6 / +8 / +10** pontos.                                                |
|  ⚡️  | **Celeridade**        | Aumenta a velocidade de ataque em **+5% / +10% / +15% / +20% / +25%**.                                                 |
|  🏃   | **Passos Ligeiros**   | Aumenta a velocidade de movimento em **+7%** por nível.                                                              |
|  ❤️   | **Vigor**             | Aumenta a vida máxima em **+20** por nível.                                                                          |
|  🎓   | **Sede de Conhecimento** | Aumenta o ganho de experiência em **+20% / +40% / +60% / +80% / +100%**.                                             |
|  ✨   | **Regeneração**       | Recupera **2 / 3 / 4 / 5 / 10** de HP a cada 5 segundos.                                                             |

### Habilidades Ativas (Grimório)

São magias poderosas que agora funcionam com um sistema de **cargas acumuladas**.

#### Novo Sistema de Magias
*   **Recarga Híbrida:** A magia equipada ganha **1 carga a cada 20 segundos**. Cada **abate** reduz o tempo restante para a próxima carga em **1 segundo**.
*   **Cargas Ilimitadas:** Você pode acumular quantas cargas quiser! A estratégia é sua.
*   **Cooldown Global:** Após usar uma magia, há um **cooldown de 2 segundos** antes que outra possa ser usada.
*   **Grimório (📖):** Você pode pausar o jogo a qualquer momento para abrir seu Grimório e trocar a magia ativa entre as que já aprendeu. Trocar de magia zera o progresso da carga atual.

---

#### Míssil de Fogo Etéreo (🔥)
*   **Descrição:** Dispara um míssil teleguiado que atravessa paredes e obstáculos.
*   **Efeitos Especiais:**
    *   Aplica o status **Queimadura** (ver seção "Status Elementais").
    *   Causa **+10% de dano** em Esqueletos e Fantasmas.
*   **Evolução (Dano):** 25 / 35 / 45 / 50 / 55.

#### Explosão de Energia (🌀)
*   **Descrição:** Libera uma onda de projéteis teleguiados que atacam inimigos próximos. O número de projéteis aumenta com o nível.

#### Corrente de Raios (⛓️)
*   **Descrição:** Seu próximo ataque se transforma em um raio que ricocheteia entre múltiplos inimigos.
*   **Efeitos Especiais:**
    *   Aplica o status **Eletrificado** (ver seção "Status Elementais").
    *   Fantasmas recebem o dano do impacto, mas são imunes ao status Eletrificado.

#### Carga Explosiva (💣)
*   **Descrição:** Lança uma granada mágica **teleguiada** que persegue um inimigo e explode em uma grande área.
*   **Efeitos Especiais:**
    *   A partir do Nível 4, a explosão principal libera fragmentos que também explodem.

#### Novas Runas de Armadilha (♨️ / ❄️ / ⚡)
*   **Mecânica:** Habilidades de mira manual. Coloca uma runa visível no chão que é acionada quando um inimigo (exceto Fantasmas) pisa nela, explodindo após um curto período.
*   **Tipos:**
    *   **Runa de Fogo (♨️):** Causa dano e aplica **Queimadura**.
    *   **Runa de Gelo (❄️):** Causa dano e aplica **Congelamento**.
    *   **Runa de Raio (⚡):** Causa dano e aplica **Eletrificado**.
*   **Evolução:** O raio da explosão aumenta a cada nível.

#### Lança de Gelo Perfurante (🧊)
*   **Mecânica:** Dispara uma lança de gelo em linha reta que **perfura** múltiplos inimigos, aplicando o status **Congelado** em todos que atingir.
*   **Evolução:** Aumenta o dano, o número de alvos perfurados e a largura da lança.
*   **Nível 5 (Ultimate):** Ao atingir seu último alvo ou o limite do mapa, a lança **explode**, aplicando Congelamento em uma pequena área.

---

## 📦 Power-ups

Power-ups aparecem no mapa através de diferentes mecânicas (tempo, abates ou recompensa de chefe). As chances de cada item aparecer **não são iguais**.

### Taxa de Aparição Ponderada

| Power-up          | Chance de Aparição |
| ----------------- | :----------------: |
| Poção de Cura     |        45%         |
| Escudo            |        10%         |
| Bolha Repulsora   |        15%         |
| Clone             |         2%         |
| Aura Congelante   |         7%         |
| Aura Flamejante   |         7%         |
| Aura Eletrizante  |         7%         |
| EXP em Dobro      |         7%         |

### Aparição por Abates

Para garantir que o jogador sempre tenha acesso a itens, um power-up aleatório é garantido após um certo número de abates.

*   **Ondas 1-10:** 1 item a cada **30 abates**.
*   **A partir da Onda 11:** 1 item a cada **70 abates**.

### Descrição dos Power-ups
*   **Auras (Congelante, Flamejante, Eletrizante):** Cria uma aura elemental ao redor do mago que aplica o respectivo status em inimigos próximos.
*   **Bolha Repulsora:** Empurra inimigos para longe e concede **imunidade** a danos de auras inimigas e poças de fogo.

---

## ♨️ Status Elementais

Habilidades e auras podem aplicar status negativos nos inimigos, cada um com um efeito único e poderoso.

### Queimadura (Burn)
*   **Efeito:** Causa **10 de dano a cada 2 segundos** (total de 50 de dano em 10s).
*   **Efeito Adicional:** Faz o inimigo entrar em pânico e **fugir** do jogador.

### Congelamento (Frozen)
*   **Efeito:** Causa **5 de dano por segundo** (total de 50 de dano em 10s).
*   **Efeito Adicional:** Aplica **lentidão** de 50% no inimigo.

### Eletrificado (Electrified)
*   **Efeito:** Causa **25 de dano por segundo** (total de 50 de dano em 2s).
*   **Efeito Adicional:** **Paralisa** completamente o inimigo por 2 segundos.

---

## 🛡️ Fraquezas Elementais

Para adicionar mais estratégia ao combate, os inimigos elementais agora possuem fraquezas. Explorar a fraqueza de um inimigo aumenta todo o dano elemental causado a ele em **50%**.

*   🔥 **Fogo** é forte contra ⚡ **Raio**.
*   ⚡ **Raio** é forte contra ❄️ **Gelo**.
*   ❄️ **Gelo** é forte contra 🔥 **Fogo**.

---

## � Inimigos de Elite (Elementais)

A partir da Onda 20, inimigos elementais poderosos começam a aparecer, cada um com habilidades e imunidades únicas que exigem novas estratégias.

### Elemental de Fogo
*   **Comportamento:** Agressivo e rápido, deixa um rastro de fogo que causa dano contínuo.
*   **Habilidades:**
    *   **Imunidade a Fogo:** Não pode ser afetado pelo status de Queimadura.
    *   **Toque Incendiário:** Seu ataque de contato também aplica Queimadura no jogador.
    *   **Rastro de Chamas:** Deixa poças de fogo no chão que causam dano ao jogador.

### Elemental de Gelo
*   **Comportamento:** Um tanque lento e resistente, cercado por uma aura de controle.
*   **Habilidades:**
    *   **Imunidade a Gelo:** Não pode ser congelado ou sofrer lentidão.
    *   **Aura de Lentidão:** Reduz a velocidade de movimento do jogador que se aproxima.
    *   **Estilhaçar Congelante:** Ao ser derrotado, explode em uma onda de gelo que aplica lentidão ao jogador próximo.

### Elemental de Raio
*   **Comportamento:** Extremamente rápido e imprevisível, difícil de acertar.
*   **Habilidades:**
    *   **Imunidade Elemental:** Imune aos status de Congelamento e Eletrificado.
    *   **Teleporte Elétrico:** A cada 5 segundos, teleporta-se para uma nova posição perto do jogador e libera uma rajada de projéteis elétricos.

### Invocador Elemental (A partir da Onda 25)
*   **Comportamento:** Um inimigo de suporte que se mantém à distância, atacando com magia e invocando reforços.
*   **Habilidades:**
    *   **Invocação Elemental:** Periodicamente, invoca um dos três tipos de elementais (Fogo, Gelo ou Raio) para se juntar à batalha.
    *   **Aura Tri-elemental:** Possui uma aura que aplica simultaneamente os status de Queimadura, Lentidão e Eletrificado no jogador que se aproxima.

---

## Chefes (Bosses)

Chefes poderosos surgem em ondas específicas para testar suas habilidades.

### Onda 7: Rei Goblin

O líder supremo dos goblins. Ele não luta sozinho, preferindo fortalecer e comandar suas tropas para sobrecarregar o jogador.

**Habilidades:**
- **Chamado da Horda**: Periodicamente, invoca um grupo de goblins.
- **Aura Real**: Concede um bônus de velocidade de movimento a todos os goblins próximos.
- **Fuga Covarde**: Tenta fugir quando sua vida está baixa, atirando pedras como defesa.

### Onda 20: Juggernaut Troll

Uma besta colossal coberta por uma armadura de pedra. O Juggernaut Troll é um teste de pura resistência e dano bruto, forçando o jogador a quebrar suas defesas.

**Habilidades:**
- **Armadura de Pedra**: Possui 1000 pontos de armadura que devem ser destruídos antes que sua vida possa ser danificada. Enquanto tem armadura, é imune a efeitos de status.
- **Fúria**: Seu dano de contato aumenta conforme sua vida diminui.
- **Terremoto**: Periodicamente, bate no chão, causando dano em área ao seu redor.

### Onda 35: Arquilich

Um mestre da necromancia que utiliza táticas profanas para controlar o campo de batalha.

**Habilidades:**
- **Escudo de Almas**: Começa a batalha com 5 esferas de alma que absorvem projéteis.
- **Colheita de Almas**: A cada 5 monstros que o jogador derrota, o Arquilich invoca um Esqueleto Guerreiro.
- **Prisão de Ossos**: Periodicamente, cria um círculo de paredes de osso ao redor do jogador.
**Recompensa Especial**: Ao ser derrotado, abre uma tela de melhoria que permite ao jogador escolher **qualquer habilidade** do jogo.

### Ondas 50, 60, 70, 80: Chefes Elementais

Nestas ondas, você enfrentará um dos três Lordes Elementais, sorteado aleatoriamente. Cada um deve aparecer pelo menos uma vez.

#### Colosso de Magma (🔥)
*   **Tema:** Força bruta e negação de área. Transforma o campo de batalha em um inferno.
*   **Habilidades:** Deixa um rastro de lava, dispara ondas de fogo e invoca uma chuva de meteoros. Entra em fúria com vida baixa.

#### Matriarca Glacial (❄️)
*   **Tema:** Controle e defesa. Foca em paralisar o jogador para desferir ataques letais.
*   **Habilidades:** Protegida por um escudo de cacos de gelo que bloqueiam projéteis, cria prisões de gelo e invoca uma nevasca com vida baixa.

#### Soberano da Tempestade (⚡)
*   **Tema:** Velocidade e imprevisibilidade. Um teste de reflexos e gerenciamento de múltiplos alvos.
*   **Habilidades:** O chefe é invulnerável. Para derrotá-lo, você deve destruir os 3 "conduítes" que ele invoca, enquanto desvia de barreiras de raios e explosões de sobrecarga.

### Onda 90: A Calamidade Elemental

Prepare-se para o desafio supremo: enfrentar o **Colosso de Magma**, a **Matriarca Glacial** e o **Soberano da Tempestade** ao mesmo tempo!

*(Esta seção permanece como estava, detalhando os chefes Rei Goblin, Juggernaut Troll e Arquilich).*

*(Esta seção permanece como estava, detalhando os chefes Rei Goblin, Juggernaut Troll e Arquilich).*