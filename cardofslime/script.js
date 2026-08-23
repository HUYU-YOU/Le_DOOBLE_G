// ==========================================
// 1. UI & AUDIO
// ==========================================
let musicStarted = false;

function startMusic() {
    if(!musicStarted) {
        const bgm = document.getElementById('bg-music');
        if(bgm) { bgm.volume = 0.3; bgm.play().catch(e => console.log("Audio autoplay bloqué")); }
        musicStarted = true;
    }
}

function playSound(id) {
    const sound = document.getElementById(id);
    if(sound) { sound.currentTime = 0; sound.volume = 0.5; sound.play().catch(()=>{}); }
}

function toggleSettings() {
    document.getElementById('settings-modal').style.display = document.getElementById('settings-modal').style.display === 'none' ? 'flex' : 'none';
}
function setGameSize(sizeType) {
    document.getElementById('game-container').className = `size-${sizeType}`;
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-sz-${sizeType}`).classList.add('active');
}

// ==========================================
// 2. CONFIGURATION DES CARTES
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
let currentSlime = 5; let enemySlime = 5; 
let hand = [], drawPile = [], nextCard = null;
let activeEntities = [], activeProjectiles = [];
let lastTime = performance.now();
let selectedCardIndex = null; 
let isGameOver = false;

const arena = document.getElementById('arena');
const deployZone = document.getElementById('deploy-zone');

// ==========================================
// 3. INITIALISATION ET RELANCE (RESTART)
// ==========================================
function initGame() {
    drawPile = [...myDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift());
    nextCard = drawPile.shift();

    setupTowers();
    updateUI();

    // Génération de ressources globale
    setInterval(() => {
        if (!isGameOver && currentSlime < MAX_SLIME) { currentSlime++; updateSlimeUI(); }
        if (!isGameOver && enemySlime < MAX_SLIME) enemySlime++;
    }, 1500);
    setInterval(updateCardsAffordability, 100);
    setInterval(enemyAI, 2000); 
    
    arena.addEventListener('click', handleArenaClick);
    requestAnimationFrame(gameLoop);
}

function setupTowers() {
    createTower('base_p', 'player', 50, 92, 3000, "Base", 80, 50);
    createTower('tower_p_l', 'player', 25, 75, 1500, "Tour", 60, 60);
    createTower('tower_p_r', 'player', 75, 75, 1500, "Tour", 60, 60);

    createTower('base_e', 'enemy', 50, 8, 3000, "Base", 80, 50);
    createTower('tower_e_l', 'enemy', 25, 25, 1500, "Tour", 60, 60);
    createTower('tower_e_r', 'enemy', 75, 25, 1500, "Tour", 60, 60);
}

function restartGame() {
    isGameOver = false;
    document.getElementById('game-over-overlay').style.display = 'none';
    
    // Nettoyer l'arène
    document.querySelectorAll('.entity, .projectile, .particle, .dmg-text').forEach(e => e.remove());
    activeEntities = []; activeProjectiles = [];
    currentSlime = 5; enemySlime = 5; updateSlimeUI();
    
    setupTowers();
}

function endGame(winnerTeam) {
    isGameOver = true;
    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('game-over-title');
    
    overlay.style.display = 'flex';
    if (winnerTeam === 'player') {
        title.innerText = "VICTOIRE !";
        title.style.color = "#39ff14";
    } else {
        title.innerText = "DÉFAITE !";
        title.style.color = "#ff3366";
    }
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
// 4. INTERFACE ET PLACEMENT
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
        div.className = `card ${selectedCardIndex === index ? 'selected' : ''}`;
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
    document.querySelectorAll('#hand .card').forEach(card => card.classList.toggle('disabled', currentSlime < parseInt(card.dataset.cost)));
}

function selectCard(index) {
    if (currentSlime < cardDatabase[hand[index]].cost) return; 
    selectedCardIndex = selectedCardIndex === index ? null : index;
    deployZone.style.display = selectedCardIndex !== null ? 'flex' : 'none';
    updateUI();
}

function handleArenaClick(e) {
    if (selectedCardIndex === null || isGameOver) return;

    const rect = arena.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const cardData = cardDatabase[hand[selectedCardIndex]];

    if (cardData.type !== 'spell' && clickY < 50) return; // Limite de placement

    currentSlime -= cardData.cost; updateSlimeUI();
    playSound('sfx-spawn'); // FX AUDIO

    if (cardData.type === 'spell') castSpell(cardData, 'enemy', clickX, clickY);
    else spawnEntity(cardData, 'player', clickX, clickY);

    drawPile.push(hand[selectedCardIndex]);
    hand[selectedCardIndex] = nextCard;
    nextCard = drawPile.shift();
    
    selectedCardIndex = null; deployZone.style.display = 'none'; updateUI();
}

// ==========================================
// 5. INVOCATION, PARTICULES & IA
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
        team: team, x: x, y: y, color: data.color, // pour les particules
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
    fx.style.zIndex = '10'; arena.appendChild(fx);
    setTimeout(() => fx.remove(), 800);

    activeEntities.forEach(ent => {
        if (ent.team === targetTeam && getDistance({x:targetX, y:targetY}, ent) < 15) takeDamage(ent, spellData.dmg);
    });
}

// EXPLOSION DE PARTICULES
function createParticles(x, y, color) {
    for(let i=0; i<6; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color || '#39ff14';
        p.style.left = `${x}%`; p.style.top = `${y}%`;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 40; // distance d'éjection
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        
        arena.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }
}

function enemyAI() {
    if (isGameOver) return;
    const troopCards = Object.values(cardDatabase).filter(c => c.type === 'troop');
    const affordableCards = troopCards.filter(c => c.cost <= enemySlime);
    
    if (affordableCards.length > 0) {
        // L'IA économise parfois pour de grosses unités (30% de chances de ne rien faire)
        if(Math.random() > 0.3) {
            const cardToPlay = affordableCards[Math.floor(Math.random() * affordableCards.length)];
            enemySlime -= cardToPlay.cost;
            const spawnX = Math.random() > 0.5 ? 25 : 75; // Lane gauche ou droite
            spawnEntity(cardToPlay, 'enemy', spawnX, 15);
            playSound('sfx-spawn');
        }
    }
}

// ==========================================
// 6. SYSTÈME DE COMBAT & BOUCLE
// ==========================================
function getDistance(ent1, ent2) { return Math.sqrt(Math.pow(ent1.x - ent2.x, 2) + Math.pow(ent1.y - ent2.y, 2)); }

function takeDamage(entity, amount) {
    if (entity.hp <= 0) return; 
    entity.hp -= amount;
    playSound('sfx-hit'); // AUDIO IMPACT
    
    const txt = document.createElement('div');
    txt.className = `dmg-text team-${entity.team}`;
    txt.innerText = `-${amount}`;
    txt.style.left = `${entity.x}%`; txt.style.top = `${entity.y}%`;
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
    activeProjectiles.push({ x: attacker.x, y: attacker.y, target: target, dmg: attacker.dmg, team: attacker.team, element: proj, speed: 40 });
}

function gameLoop(currentTime) {
    if (isGameOver) {
        requestAnimationFrame(gameLoop);
        return; 
    }

    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // --- NETTOYAGE DES MORTS ---
    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            playSound('sfx-die'); // FX AUDIO MORT
            createParticles(ent.x, ent.y, ent.color || '#fff'); // FX VISUEL MORT
            
            if (ent.element) ent.element.remove();
            
            if(ent.id === 'base_p') endGame('enemy');
            if(ent.id === 'base_e') endGame('player');
            return false;
        }
        return true;
    });

    // --- GESTION DES PROJECTILES ---
    activeProjectiles = activeProjectiles.filter(p => {
        if(p.target.hp <= 0) { p.element.remove(); return false; } 
        const dx = p.target.x - p.x; const dy = p.target.y - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < 2) {
            takeDamage(p.target, p.dmg);
            p.element.remove(); return false;
        } else {
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * p.speed * dt; p.y += Math.sin(angle) * p.speed * dt;
            p.element.style.left = `${p.x}%`; p.element.style.top = `${p.y}%`;
            return true;
        }
    });

    // --- COMPORTEMENT DES UNITÉS ---
    activeEntities.forEach(unit => {
        if (unit.speed === 0) {
            let closestTarget = null; let minDistance = 999;
            activeEntities.forEach(target => {
                if (target.team !== unit.team) {
                    let dist = getDistance(unit, target);
                    if (dist < minDistance) { minDistance = dist; closestTarget = target; }
                }
            });
            if (closestTarget && minDistance <= unit.range && currentTime - unit.lastAttack >= unit.atkSpeed) {
                shootProjectile(unit, closestTarget); unit.lastAttack = currentTime;
            }
            return; 
        }

        let closestTarget = null; let minDistance = 999;
        activeEntities.forEach(target => {
            if (target.team !== unit.team) {
                if (unit.targetBuilding && target.speed !== 0) return; 
                let dist = getDistance(unit, target);
                if (dist < minDistance) { minDistance = dist; closestTarget = target; }
            }
        });

        if (closestTarget) {
            if (minDistance <= unit.range) {
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
                unit.element.classList.add('is-walking');
                unit.element.classList.remove('is-attacking');
                
                let targetX = closestTarget.x; let targetY = closestTarget.y;
                if ((unit.y > 50 && targetY < 50) || (unit.y < 50 && targetY > 50)) {
                    let targetBridgeX = (unit.x < 50) ? 25 : 75; 
                    if (Math.abs(unit.x - targetBridgeX) > 2) { targetX = targetBridgeX; targetY = unit.y; }
                }
                
                const dx = targetX - unit.x; const dy = targetY - unit.y;
                const angle = Math.atan2(dy, dx);
                
                unit.x += Math.cos(angle) * unit.speed * dt * (arena.offsetHeight / arena.offsetWidth);
                unit.y += Math.sin(angle) * unit.speed * dt;
                
                unit.element.style.left = `${unit.x}%`; unit.element.style.top = `${unit.y}%`;
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGame); 
else initGame();
