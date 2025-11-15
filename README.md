# Horda Mágica 3D: Sobrevivência do Mago

Este é um jogo de sobrevivência 3D em estilo "roguelite", onde você controla um mago poderoso que deve enfrentar hordas intermináveis de monstros. A cada nível, você pode aprimorar suas habilidades e se tornar mais forte para sobreviver o maior tempo possível.

## Como Jogar

- **Movimentação**: Use as teclas `W`, `A`, `S`, `D` ou as setas do teclado para mover o mago.
- **Mira**: O mago mira automaticamente na direção do cursor do mouse.
- **Ataque Básico**: O mago ataca automaticamente na direção da mira.
- **Habilidade Ativa**: Clique com o **botão esquerdo** do mouse para usar a habilidade ativa quando a barra de abates estiver cheia.

## Habilidades do Mago

A cada nível, você pode escolher uma nova habilidade ou aprimorar uma já existente.

### Habilidades Ativas (Grimório)

*Você só pode ter uma habilidade ativa equipada por vez.*

#### **Míssil Mágico** (Custo: 5-10 Abates)
Dispara um ou mais projéteis teleguiados que perseguem os inimigos mais fortes na tela.
- **Nível 1-3**: Dispara 1 míssil.
- **Nível 4**: Dispara 2 mísseis.
- **Nível 5**: Dispara 3 mísseis.

#### **Explosão de Energia** (Custo: 10 Abates)
Libera uma chuva de projéteis teleguiados que buscam alvos em um raio de 30 unidades. Os projéteis são disparados em um padrão espiral e escalonado.
- **Nível 1**: 5 projéteis, 5 de dano cada.
- **Nível 2**: 7 projéteis, 10 de dano cada.
- **Nível 3**: 10 projéteis, 15 de dano cada.
- **Nível 4**: 15 projéteis, 20 de dano cada.
- **Nível 5**: 20 projéteis, 25 de dano cada.

#### **Corrente de Raios** (Custo: 8 Abates)
Eletrifica seu próximo ataque básico. Ao atingir um inimigo, um raio ricocheteia para alvos próximos, causando dano e aplicando o status "Eletrificado" (5 de dano por segundo).
- **Nível 1**: Ricocheteia 2 vezes, 20 de dano, 5 de alcance.
- **Nível 2**: Ricocheteia 3 vezes, 30 de dano, 8 de alcance.
- **Nível 3**: Ricocheteia 5 vezes, 40 de dano, 11 de alcance.
- **Nível 4**: Ricocheteia 7 vezes, 50 de dano, 14 de alcance.
- **Nível 5**: Ricocheteia 10 vezes, 55 de dano, 17 de alcance.

#### **Carga Explosiva** (Custo: 20 Abates)
Dispara um projétil que causa uma grande explosão ao atingir um alvo ou obstáculo.
- **Nível 1**: 50 de dano, 5 de raio.
- **Nível 2**: 60 de dano, 7 de raio.
- **Nível 3**: 70 de dano, 8 de raio.
- **Nível 4**: 80 de dano, 9 de raio. A explosão libera **3 fragmentos** que causam uma explosão menor.
- **Nível 5**: 100 de dano, 10 de raio. A explosão libera **5 fragmentos** que causam uma explosão menor.

### Habilidades Passivas (Atributos)

#### **Poder Arcano** (Máx. Nível 5)
Aumenta o dano do seu ataque básico em **+10%** por nível.

#### **Celeridade** (Máx. Nível 5)
Aumenta a velocidade do seu ataque básico em **+10%** por nível.

#### **Passos Ligeiros** (Máx. Nível 5)
Aumenta sua velocidade de movimento em **+7%** por nível.

#### **Vigor** (Máx. Nível 5)
Aumenta sua vida máxima em **+20** por nível.

#### **Sede de Conhecimento** (Máx. Nível 3)
Aumenta o ganho de experiência em **+20%** por nível.

#### **Regeneração** (Máx. Nível 5)
- **Nível 1-4**: Recupera **2-5** de HP a cada 5 segundos.
- **Nível 5**: Recupera **5** de HP a cada 3 segundos.

## Bestiário da Horda Mágica

Conheça os perigos que espreitam nas sombras.

---

### **Goblin**
Uma criatura pequena e rápida, geralmente encontrada em grandes números. Fracos individualmente, mas perigosos em grupo.
*   **Pontos de Vida**: 20
*   **Dano de Toque**: 10
*   **Experiência**: 7

---

### **Orc**
Mais robusto e forte que um goblin, o Orc é um guerreiro formidável que avança lentamente, mas com propósito.
*   **Pontos de Vida**: 50
*   **Dano de Toque**: 15
*   **Experiência**: 15

---

### **Troll**
Uma montanha de músculos e fúria. O Troll é extremamente resistente e lento, capaz de absorver uma grande quantidade de dano antes de cair.
*   **Pontos de Vida**: 100
*   **Dano de Toque**: 25
*   **Experiência**: 25

---

### **Fantasma**
Uma aparição etérea que ignora obstáculos físicos, flutuando diretamente em sua direção. É imune a efeitos de congelamento.
*   **Pontos de Vida**: 75
*   **Dano de Toque**: 25
*   **Experiência**: 30

---

### **Necromante**
Um conjurador sinistro que prefere manter distância. Ele ataca com projéteis mágicos e, mais perigosamente, invoca hordas de esqueletos para lutar por ele.
*   **Pontos de Vida**: 80
*   **Dano do Projétil**: 10
*   **Experiência**: 35
*   **Habilidade Especial**: Invoca Esqueletos, Esqueletos Arqueiros e Esqueletos Guerreiros a cada 8 segundos.

---

### **Esqueleto**
Os soldados básicos reanimados pelos Necromantes. Avançam sem medo para o combate corpo a corpo.
*   **Pontos de Vida**: 80
*   **Dano de Toque**: 25
*   **Experiência**: 35

---

### **Esqueleto Arqueiro**
Uma variante mais tática dos mortos-vivos. O Arqueiro mantém distância e dispara flechas, forçando o mago a se mover constantemente.
*   **Pontos de Vida**: 45
*   **Dano da Flecha**: 5
*   **Experiência**: 45

---

### **Esqueleto Guerreiro**
O mais forte dos lacaios esqueléticos. Equipado com armadura, é mais resistente e causa mais dano que seus irmãos descarnados.
*   **Pontos de Vida**: 200
*   **Dano de Toque**: 35
*   **Experiência**: 55