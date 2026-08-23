// ==========================================
// 1. GESTION UI / PARAMÈTRES
// ==========================================
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}
function setGameSize(sizeType) {
    document.getElementById('game-container').className = `size-${sizeType}`;
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-sz-${sizeType}`).classList.add('active');
}

// ==========================================
// 2. CONFIGURATION & STATS
// ==========================================
const cardDatabase = {
    slime: { id: "slime", type: "troop", name: "Slime", cost: 3, hp: 600, dmg: 40, range: 4, speed: 4, atkSpeed: 1000, color: "#4CAF50", img: "../img/SLIME.png" },
    slimeuse: { id: "slimeuse", type: "troop", name: "Slimeuse", cost: 3, hp: 200, dmg: 90, range: 30, speed: 5, atkSpeed: 1000, isRanged: true, color: "#8BC34A", img: "assets/skins/adcsud.png" },
    mage: { id: "mage", type: "troop", name: "Mage", cost: 4, hp: 350, dmg: 60, range: 25, speed: 4, atkSpeed: 1200, isRanged: true, color: "#03A9F4", img: "assets/skins/mangesud.png" },
    boule: { id: "boule", type: "troop", name: "La Boule", cost: 4, hp: 800, dmg: 100, range: 4, speed: 7, atkSpeed: 1500, targetBuilding: true, color: "#FF9800", img: "assets/skins/setsud.png" },
    mega: { id: "mega", type: "troop", name: "MEGA Slime", cost: 8, hp: 2500, dmg: 150, range: 5, speed: 2, atkSpeed: 2000, color: "#9C27B0", img: "assets/skins/ninjasud.png" },
    tornade: { id: "tornade", type: "spell", name: "Tornade", cost: 3, dmg: 150, radius: 15, color: "#9E9E9E" }
};

const myDeck = ["slime", "slimeuse", "mage", "boule", "mega", "tornade"];
const MAX_SLIME = 10;
let currentSlime = 5;
let enemySlime = 5; 

let hand = [], drawPile = [], nextCard = null;
let activeEntities = [];
let activeProjectiles = [];
let lastTime = performance.now();
let selectedCardIndex = null; // Carte en cours de placement

const arena = document.getElementById('arena');
const deployZone = document.getElementById('deploy-zone');

// ==========================================
// 3. INITIALISATION DU JEU & TOURS
// ==========================================
function initGame() {
    // Piocher
    drawPile = [...myDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift());
    nextCard = drawPile.shift();

    // Création des 6 Tours
    createTower('base_p', 'player', 50, 92, 3000, "Base", 80, 50);
    createTower('tower_p_l', 'player', 25, 75, 1500, "Tour", 60, 60);
    createTower('tower_p_r', 'player', 75, 75, 1500, "Tour", 60, 60);

    createTower('base_e', 'enemy', 50, 8, 3000, "Base", 80, 50);
    createTower('tower_e_l', 'enemy', 25, 25, 1500, "Tour", 60, 60);
    createTower('tower_e_r', 'enemy', 75, 25, 1500, "Tour", 60, 60);

    updateUI();
    setInterval(() => {
        if (currentSlime < MAX_SLIME) { currentSlime++; updateSlimeUI(); }
        if (enemySlime < MAX_SLIME) enemySlime++;
    }, 1500);
    setInterval(updateCardsAffordability, 100);
    
    // Clic sur l'arène pour placer l'unité
    arena.addEventListener('click', handleArenaClick);
    
    requestAnimationFrame(gameLoop);
    setInterval(enemyAI, 2000); // L'IA réfléchit toutes les 2s
}

function createTower(id, team, x, y, hp, name, width, height) {
    const el = document.createElement('div');
    el.className = `entity building team-${team}`;
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.style.width = `${width}px`; el.style.height = `${height}px`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>${name}`;
    arena.appendChild(el);

    activeEntities.push({
        id: id, team: team, x: x, y: y, hp: hp, maxHp: hp, 
        dmg: 50, range: 25, speed: 0, atkSpeed: 1000, isRanged: true, targetBuilding: false,
        lastAttack: 0, element: el, hpBar: el.querySelector('.entity-hp-fill')
    });
}

// ==========================================
// 4. INTERFACE & PLACEMENT (Drag/Click)
// ==========================================
function updateSlimeUI() {
    document.getElementById('slime-bar-fill').style.width = `${(currentSlime / MAX_SLIME) * 100}%`;
    document.getElementById('slime-count').innerText = `${currentSlime} / 10`;
}

function updateUI() {
    const handContainer = document.getElementById('hand');
    handContainer.innerHTML = '';
    hand.forEach((cardId, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        if (index === selectedCardIndex) div.classList.add('selected');
        
        const data = cardDatabase[cardId];
        if(data.img) div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url('${data.img}')`;
        div.dataset.cost = data.cost;
        div.innerHTML = `<div class="cost">${data.cost}</div><div class="name" style="color:${data.color}">${data.name}</div>`;
        
        div.addEventListener('click', () => selectCard(index));
        handContainer.appendChild(div);
    });
    
    document.getElementById('next-card').innerHTML = `<div class="cost">${cardDatabase[nextCard].cost}</div><div class="name">${cardDatabase[nextCard].name}</div>`;
}

function updateCardsAffordability() {
    document.querySelectorAll('#hand .card').forEach(card => {
        card.classList.toggle('disabled', currentSlime < parseInt(card.dataset.cost));
    });
}

function selectCard(index) {
    const cost = cardDatabase[hand[index]].cost;
    if (currentSlime < cost) return; // Trop cher
    
    if (selectedCardIndex === index) {
        // Désélectionner
        selectedCardIndex = null;
        deployZone.style.display = 'none';
    } else {
        // Sélectionner
        selectedCardIndex = index;
        deployZone.style.display = 'flex';
    }
    updateUI();
}

function handleArenaClick(e) {
    if (selectedCardIndex === null) return; // Aucune carte sélectionnée

    // Récupérer les coordonnées du clic en %
    const rect = arena.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const cardData = cardDatabase[hand[selectedCardIndex]];

    // Vérifier si le placement est valide (moitié sud pour les troupes, n'importe où pour le sort)
    if (cardData.type !== 'spell' && clickY < 50) {
        // Optionnel : petit effet rouge pour dire "Action impossible"
        return; 
    }

    // On paye et on place
    currentSlime -= cardData.cost;
    updateSlimeUI();

    if (cardData.type === 'spell') castSpell(cardData, 'enemy', clickX, clickY);
    else spawnEntity(cardData, 'player', clickX, clickY);

    // Rotation du deck
    drawPile.push(hand[selectedCardIndex]);
    hand[selectedCardIndex] = nextCard;
    nextCard = drawPile.shift();
    
    selectedCardIndex = null;
    deployZone.style.display = 'none';
    updateUI();
}

// ==========================================
// 5. INVOCATION & INTELLIGENCE ARTIFICIELLE
// ==========================================
function spawnEntity(data, team, x, y) {
    const el = document.createElement('div');
    el.className = `entity team-${team}`;
    el.dataset.id = data.id;
    if (data.img) el.style.backgroundImage = `url('${data.img}')`;
    else el.style.backgroundColor = data.color;
    
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>`;
    arena.appendChild(el);

    activeEntities.push({
        id: Math.random().toString(36).substr(2, 9),
        team: team, x: x, y: y,
        hp: data.hp, maxHp: data.hp, dmg: data.dmg, range: data.range, speed: data.speed, 
        atkSpeed: data.atkSpeed, isRanged: data.isRanged || false, targetBuilding: data.targetBuilding || false,
        lastAttack: 0, element: el, hpBar: el.querySelector('.entity-hp-fill')
    });
}

function castSpell(spellData, targetTeam, targetX, targetY) {
    const fx = document.createElement('div');
    fx.style.position = 'absolute'; fx.style.left = `${targetX}%`; fx.style.top = `${targetY}%`;
    fx.style.width = '120px'; fx.style.height = '120px';
    fx.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(158,158,158,0) 70%)';
    fx.style.transform = 'translate(-50%, -50%)'; fx.style.animation = 'spawn 0.3s ease-out';
    fx.style.zIndex = '10';
    arena.appendChild(fx);

    setTimeout(() => fx.remove(), 800);

    // Dégâts de zone (distance approximative)
    activeEntities.forEach(ent => {
        if (ent.team === targetTeam) {
            const dx = ent.x - targetX; const dy = ent.y - targetY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 15) takeDamage(ent, spellData.dmg);
        }
    });
}

function enemyAI() {
    // Le bot regarde ce qu'il peut acheter
    const affordableCards = Object.values(cardDatabase).filter(c => c.cost <= enemySlime && c.type !== 'spell');
    if (affordableCards.length > 0) {
        // Bot tire à pile ou face pour jouer ou économiser
        if(Math.random() > 0.4) {
            const cardToPlay = affordableCards[Math.floor(Math.random() * affordableCards.length)];
            enemySlime -= cardToPlay.cost;
            // Bot choisit une ligne gauche (25%) ou droite (75%)
            const spawnX = Math.random() > 0.5 ? 25 : 75;
            spawnEntity(cardToPlay, 'enemy', spawnX, 15);
        }
    }
}

// ==========================================
// 6. SYSTÈME DE COMBAT ET PHYSIQUE
// ==========================================
function getDistance(ent1, ent2) {
    return Math.sqrt(Math.pow(ent1.x - ent2.x, 2) + Math.pow(ent1.y - ent2.y, 2));
}

function takeDamage(entity, amount) {
    if (entity.hp <= 0) return; 
    entity.hp -= amount;
    
    // Texte de dégât flottant
    const txt = document.createElement('div');
    txt.className = `dmg-text team-${entity.team}`;
    txt.innerText = `-${amount}`;
    txt.style.left = `${entity.x}%`;
    txt.style.top = `${entity.y}%`;
    arena.appendChild(txt);
    setTimeout(() => txt.remove(), 1000);

    if(entity.element) {
        entity.element.style.filter = 'brightness(2) contrast(1.5)';
        setTimeout(() => { if(entity.element) entity.element.style.filter = 'none'; }, 100);
        if (entity.hpBar) entity.hpBar.style.width = `${Math.max(0, (entity.hp / entity.maxHp) * 100)}%`;
    }
}

function shootProjectile(attacker, target) {
    const proj = document.createElement('div');
    proj.className = 'projectile';
    proj.style.left = `${attacker.x}%`; proj.style.top = `${attacker.y}%`;
    arena.appendChild(proj);

    activeProjectiles.push({
        x: attacker.x, y: attacker.y,
        target: target, dmg: attacker.dmg,
        team: attacker.team, element: proj, speed: 40
    });
}

function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // --- NETTOYAGE DES MORTS ---
    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            if (ent.element && !ent.element.classList.contains('dead')) {
                ent.element.classList.add('dead');
                setTimeout(() => ent.element.remove(), 300);
            }
            if(ent.id === 'base_p') { alert("DÉFAITE !"); location.reload(); }
            if(ent.id === 'base_e') { alert("VICTOIRE MAGISTRALE !"); location.reload(); }
            return false;
        }
        return true;
    });

    // --- GESTION DES PROJECTILES ---
    activeProjectiles = activeProjectiles.filter(p => {
        if(p.target.hp <= 0) { p.element.remove(); return false; } // Cible morte pendant le vol
        
        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 2) {
            // Impact !
            takeDamage(p.target, p.dmg);
            p.element.remove();
            return false;
        } else {
            // Vol
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * p.speed * dt;
            p.y += Math.sin(angle) * p.speed * dt;
            p.element.style.left = `${p.x}%`;
            p.element.style.top = `${p.y}%`;
            return true;
        }
    });

    // --- COMPORTEMENT DES UNITÉS ---
    activeEntities.forEach(unit => {
        if (unit.speed === 0) {
            // C'EST UNE TOUR (Elle attaque juste)
            let closestTarget = null; let minDistance = 999;
            activeEntities.forEach(target => {
                if (target.team !== unit.team) {
                    let dist = getDistance(unit, target);
                    if (dist < minDistance) { minDistance = dist; closestTarget = target; }
                }
            });
            if (closestTarget && minDistance <= unit.range && currentTime - unit.lastAttack >= unit.atkSpeed) {
                shootProjectile(unit, closestTarget);
                unit.lastAttack = currentTime;
            }
            return; 
        }

        // C'EST UNE TROUPE (Cherche cible et se déplace)
        let closestTarget = null; let minDistance = 999;
        activeEntities.forEach(target => {
            if (target.team !== unit.team) {
                if (unit.targetBuilding && target.speed !== 0) return; // Le chevaucheur ignore les troupes
                let dist = getDistance(unit, target);
                if (dist < minDistance) { minDistance = dist; closestTarget = target; }
            }
        });

        if (closestTarget) {
            if (minDistance <= unit.range) {
                // ATTAQUE !
                unit.element.classList.remove('is-walking');
                if (currentTime - unit.lastAttack >= unit.atkSpeed) {
                    unit.element.classList.remove('is-attacking');
                    void unit.element.offsetWidth; 
                    unit.element.classList.add('is-attacking');
                    
                    if (unit.isRanged) shootProjectile(unit, closestTarget);
                    else takeDamage(closestTarget, unit.dmg);
                    
                    unit.lastAttack = currentTime;
                }
            } else {
                // DÉPLACEMENT AVEC GESTION DE LA RIVIÈRE
                unit.element.classList.add('is-walking');
                unit.element.classList.remove('is-attacking');
                
                let targetX = closestTarget.x;
                let targetY = closestTarget.y;

                // Pathfinding du pauvre : Si je dois traverser la rivière, je vise le pont le plus proche
                if ((unit.y > 50 && targetY < 50) || (unit.y < 50 && targetY > 50)) {
                    // Je suis d'un côté et la cible de l'autre
                    let targetBridgeX = (unit.x < 50) ? 25 : 75; // Pont gauche ou droit
                    
                    // Si je ne suis pas encore aligné avec le pont
                    if (Math.abs(unit.x - targetBridgeX) > 2) {
                        targetX = targetBridgeX;
                        targetY = unit.y; // Marche à l'horizontale d'abord
                    }
                }
                
                const dx = targetX - unit.x;
                const dy = targetY - unit.y;
                const angle = Math.atan2(dy, dx);
                
                unit.x += Math.cos(angle) * unit.speed * dt * (arena.offsetHeight / arena.offsetWidth);
                unit.y += Math.sin(angle) * unit.speed * dt;
                
                unit.element.style.left = `${unit.x}%`;
                unit.element.style.top = `${unit.y}%`;
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// Lancement
if(document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initGame); } 
else { initGame(); }
