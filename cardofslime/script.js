// ==========================================
// 1. HUB ET PARAMÈTRES (Interface)
// ==========================================
let settingsAnimInterval;
let rotation = 0;
const settingsImg = document.getElementById('settings-btn-img');

function startSettingsAnim() {
    settingsAnimInterval = setInterval(() => {
        rotation += 5;
        if(settingsImg) settingsImg.style.transform = `rotate(${rotation}deg)`;
    }, 20);
}
function stopSettingsAnim() {
    clearInterval(settingsAnimInterval);
    if(settingsImg) {
        settingsImg.style.transform = `rotate(${rotation}deg) scale(1.1)`;
        setTimeout(() => { settingsImg.style.transform = `rotate(${rotation}deg) scale(1)`; }, 200);
    }
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if(modal) modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function setGameSize(sizeType) {
    const container = document.getElementById('game-container');
    const title = document.querySelector('.game-title');
    
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-sz-${sizeType}`);
    if(btn) btn.classList.add('active');
    
    if(container) container.className = `size-${sizeType}`;

    if (sizeType === 'full') {
        if(title) title.style.display = 'none';
        if(document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.log(e));
        }
    } else {
        if(title) title.style.display = 'block';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    }
}


// ==========================================
// 2. MOTEUR DE JEU (Deck & Énergie)
// ==========================================

// STATISTIQUES DES CARTES (Ajoute tes images dans "img")
const cardDatabase = {
    slime: { id: "slime", type: "troop", name: "Le Slime", cost: 3, hp: 600, dmg: 40, range: 4, speed: 4, atkSpeed: 1000, color: "#4CAF50", img: "../img/SLIME.png" },
    slimeuse: { id: "slimeuse", type: "troop", name: "La Slimeuse", cost: 3, hp: 200, dmg: 90, range: 25, speed: 5, atkSpeed: 800, color: "#8BC34A", img: "assets/skins/adcsud.png" },
    mage: { id: "mage", type: "troop", name: "Mage Slime", cost: 4, hp: 350, dmg: 60, range: 20, speed: 4, atkSpeed: 1200, color: "#03A9F4", img: "assets/skins/mangesud.png" },
    boule: { id: "boule", type: "troop", name: "La Boule", cost: 4, hp: 800, dmg: 100, range: 4, speed: 8, atkSpeed: 1500, targetBuilding: true, color: "#FF9800", img: "assets/skins/setsud.png" },
    mega: { id: "mega", type: "troop", name: "MEGA Slime", cost: 8, hp: 2500, dmg: 150, range: 5, speed: 2, atkSpeed: 2000, color: "#9C27B0", img: "assets/skins/ninjasud.png" },
    tornade: { id: "tornade", type: "spell", name: "Tornade", cost: 3, dmg: 150, radius: 15, color: "#9E9E9E", img: "" }
};

const myDeck = ["slime", "slimeuse", "mage", "boule", "mega", "tornade"];
let currentSlime = 5;
const MAX_SLIME = 10;
let hand = [], drawPile = [], nextCard = null;

// DOM Elements
const slimeBarFill = document.getElementById('slime-bar-fill');
const slimeCount = document.getElementById('slime-count');
const arena = document.getElementById('arena');
const handContainer = document.getElementById('hand');
const nextCardContainer = document.getElementById('next-card');

function initGame() {
    // Initialiser le deck
    drawPile = [...myDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift());
    nextCard = drawPile.shift();

    updateUI();
    setInterval(generateSlime, 1500);
    setInterval(updateCardsAffordability, 100);
    
    // Lancer la boucle de combat !
    requestAnimationFrame(gameLoop);
    
    // Lancer l'IA (Fait apparaitre un ennemi toutes les 4s)
    setInterval(enemyAI, 4000);
}

function generateSlime() {
    if (currentSlime < MAX_SLIME) {
        currentSlime++;
        updateSlimeUI();
    }
}

function updateSlimeUI() {
    const percentage = (currentSlime / MAX_SLIME) * 100;
    if(slimeBarFill) slimeBarFill.style.width = `${percentage}%`;
    if(slimeCount) slimeCount.innerText = `${currentSlime} / 10 Slimes`;
}

function updateUI() {
    if(!handContainer || !nextCardContainer) return;
    
    handContainer.innerHTML = '';
    hand.forEach((cardId, index) => {
        const cardEl = createCardElement(cardDatabase[cardId]);
        cardEl.addEventListener('click', () => playCard(index));
        handContainer.appendChild(cardEl);
    });
    
    nextCardContainer.innerHTML = '';
    nextCardContainer.appendChild(createCardElement(cardDatabase[nextCard], true));
}

function createCardElement(cardData, isMini = false) {
    const div = document.createElement('div');
    div.className = `card ${isMini ? 'mini' : ''}`;
    div.style.borderColor = cardData.color;
    // Applique l'image du skin sur la carte si elle existe
    if(cardData.img) {
        div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${cardData.img}')`;
    }
    div.dataset.cost = cardData.cost;
    
    div.innerHTML = `
        <div class="cost">${cardData.cost}</div>
        <div class="name" style="color: ${cardData.color}">${cardData.name}</div>
    `;
    return div;
}

function updateCardsAffordability() {
    if(!handContainer) return;
    const cards = handContainer.querySelectorAll('.card');
    cards.forEach(card => {
        const cost = parseInt(card.dataset.cost);
        if (currentSlime < cost) card.classList.add('disabled');
        else card.classList.remove('disabled');
    });
}


// ==========================================
// 3. MOTEUR DE COMBAT (Game Loop & Physique)
// ==========================================
let activeEntities = [];
let lastTime = performance.now();

// Initialisation des Bases
let playerBase = { id: 'base_p', name: "Base", team: 'player', x: 50, y: 90, hp: 3000, maxHp: 3000, element: document.getElementById('player-base') };
let enemyBase = { id: 'base_e', name: "Base", team: 'enemy', x: 50, y: 10, hp: 3000, maxHp: 3000, element: document.getElementById('enemy-base') };
activeEntities.push(playerBase, enemyBase);

function playCard(handIndex) {
    const cardData = cardDatabase[hand[handIndex]];
    if (currentSlime >= cardData.cost) {
        currentSlime -= cardData.cost;
        updateSlimeUI();

        if (cardData.type === 'spell') {
            castSpell(cardData, 'enemy');
        } else {
            // Spawn une troupe alliée
            spawnEntity(cardData, 'player', 20 + Math.random() * 60, 80);
        }

        drawPile.push(hand[handIndex]);
        hand[handIndex] = nextCard;
        nextCard = drawPile.shift();
        updateUI();
    }
}

function spawnEntity(data, team, startX, startY) {
    const el = document.createElement('div');
    el.className = `entity team-${team}`;
    el.dataset.id = data.id; // Pour CSS spécifique (ex: grossir le mega slime)
    
    // Gérer l'apparence (Couleur par défaut ou Image de Skin)
    el.style.backgroundColor = data.color;
    if (data.img) {
        el.style.backgroundImage = `url('${data.img}')`;
    }
    
    el.style.left = `${startX}%`;
    el.style.top = `${startY}%`;
    el.innerHTML = `
        <div class="entity-hp-container"><div class="entity-hp-fill"></div></div>
        ${data.name}
    `;
    arena.appendChild(el);

    const entity = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        team: team,
        x: startX,
        y: startY,
        hp: data.hp,
        maxHp: data.hp,
        dmg: data.dmg,
        range: data.range,
        speed: data.speed,
        atkSpeed: data.atkSpeed,
        targetBuilding: data.targetBuilding || false,
        lastAttack: 0,
        element: el,
        hpBar: el.querySelector('.entity-hp-fill')
    };

    activeEntities.push(entity);
}

function castSpell(spellData, targetTeam) {
    const targetY = targetTeam === 'enemy' ? 25 : 75;
    
    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.left = '50%'; fx.style.top = `${targetY}%`;
    fx.style.width = '120px'; fx.style.height = '120px';
    fx.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(158,158,158,0) 70%)';
    fx.style.transform = 'translate(-50%, -50%)';
    fx.style.animation = 'spawn 0.3s ease-out';
    arena.appendChild(fx);

    setTimeout(() => fx.remove(), 800);

    activeEntities.forEach(ent => {
        if (ent.team === targetTeam && !ent.id.includes('base') && ent.y > targetY - 20 && ent.y < targetY + 20) {
            takeDamage(ent, spellData.dmg);
        }
    });
}

function enemyAI() {
    // Fait spawn aléatoirement un ennemi (Slime ou Mage) pour tester
    const randomCard = Math.random() > 0.5 ? cardDatabase['slime'] : cardDatabase['mage'];
    spawnEntity(randomCard, 'enemy', 20 + Math.random() * 60, 20);
}

function getDistance(ent1, ent2) {
    const dx = ent1.x - ent2.x;
    const dy = ent1.y - ent2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function takeDamage(entity, amount) {
    if (entity.hp <= 0) return; 
    entity.hp -= amount;
    
    if(entity.element) {
        entity.element.style.filter = 'brightness(2) contrast(1.5)';
        setTimeout(() => { if(entity.element) entity.element.style.filter = 'none'; }, 100);
        
        if (entity.hpBar) {
            const percent = Math.max(0, (entity.hp / entity.maxHp) * 100);
            entity.hpBar.style.width = `${percent}%`;
        }
    }
}

// === BOUCLE PRINCIPALE (Calcule mouvements et combats) ===
function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // 1. Filtrer les morts
    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            if (ent.element && !ent.element.classList.contains('dead')) {
                ent.element.classList.add('dead');
                setTimeout(() => ent.element.remove(), 300);
            }
            if(ent.id === 'base_p') { alert("DÉFAITE - Ta base a été détruite !"); location.reload(); }
            if(ent.id === 'base_e') { alert("VICTOIRE - Tu as détruit leur base !"); location.reload(); }
            return false;
        }
        return true;
    });

    // 2. Mettre à jour chaque unité
    activeEntities.forEach(unit => {
        if (unit.id.includes('base')) return;

        let closestTarget = null;
        let minDistance = 999;

        // Trouver la cible
        activeEntities.forEach(potentialTarget => {
            if (potentialTarget.team !== unit.team) {
                if (unit.targetBuilding && !potentialTarget.id.includes('base')) return;
                let dist = getDistance(unit, potentialTarget);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestTarget = potentialTarget;
                }
            }
        });

        if (closestTarget) {
            if (minDistance <= unit.range) {
                // A PORTÉE : ATTAQUER
                unit.element.classList.remove('is-walking');
                
                if (currentTime - unit.lastAttack >= unit.atkSpeed) {
                    unit.element.classList.remove('is-attacking');
                    void unit.element.offsetWidth; // Force le reflow de l'animation
                    unit.element.classList.add('is-attacking');
                    
                    takeDamage(closestTarget, unit.dmg);
                    unit.lastAttack = currentTime;
                }
            } else {
                // TROP LOIN : MARCHER
                unit.element.classList.add('is-walking');
                unit.element.classList.remove('is-attacking');
                
                const dx = closestTarget.x - unit.x;
                const dy = closestTarget.y - unit.y;
                const angle = Math.atan2(dy, dx);
                
                // On inverse la vitesse pour l'axe Y si on va vers le haut (pour équilibrer les ratios d'écran)
                unit.x += Math.cos(angle) * unit.speed * dt * (arena.offsetHeight / arena.offsetWidth);
                unit.y += Math.sin(angle) * unit.speed * dt;
                
                unit.element.style.left = `${unit.x}%`;
                unit.element.style.top = `${unit.y}%`;
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// Initialisation
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
