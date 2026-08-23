// ==========================================
// 1. GESTION DES PARAMÈTRES ET AUDIO
// ==========================================
const settingImages = ['img/setting.png', 'img/settings1.png', 'img/settings2.png', 'img/settings3.png', 'img/settings5.png'];
let currentSettingIndex = 0;
let soundEnabled = true;
let musicStarted = false;

// Ouvre la modale et cycle l'image (Exactement ton système)
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');

    currentSettingIndex = (currentSettingIndex + 1) % settingImages.length;
    const imgEl = document.getElementById('settings-btn-img');
    if(imgEl) imgEl.src = settingImages[currentSettingIndex];
}

// Active / Désactive le son
function toggleSound() {
    soundEnabled = document.getElementById('sound-toggle').checked;
    const bgm = document.getElementById('bg-music');
    if (bgm) {
        if (soundEnabled) bgm.play().catch(()=>{});
        else bgm.pause();
    }
}

function startMusic() {
    if(!musicStarted && soundEnabled) {
        const bgm = document.getElementById('bg-music');
        if(bgm) { bgm.volume = 0.3; bgm.play().catch(() => {}); }
        musicStarted = true;
    }
}

function playSound(id) {
    if (!soundEnabled) return;
    const sound = document.getElementById(id);
    if(sound) { sound.currentTime = 0; sound.volume = 0.5; sound.play().catch(()=>{}); }
}

// Gère la taille du conteneur du jeu
function setGameSize(sizeType) {
    document.getElementById('game-container').className = `size-${sizeType}`;
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-sz-${sizeType}`).classList.add('active');
    
    if (sizeType === 'full') {
        if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
    } else {
        if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }
}


// ==========================================
// 2. CONFIGURATION DES CARTES & DECK BUILDER
// ==========================================
const cardDatabase = {
    slime: { id: "slime", type: "troop", name: "Slime", cost: 3, hp: 600, dmg: 40, range: 4, speed: 4, atkSpeed: 1000, color: "#4CAF50", img: "img/SLIME.png" },
    slimeuse: { id: "slimeuse", type: "troop", name: "Slimeuse", cost: 3, hp: 200, dmg: 90, range: 30, speed: 5, atkSpeed: 1000, isRanged: true, color: "#8BC34A", img: "assets/skins/adcsud.png" },
    mage: { id: "mage", type: "troop", name: "Mage", cost: 4, hp: 350, dmg: 60, range: 25, speed: 4, atkSpeed: 1200, isRanged: true, color: "#03A9F4", img: "assets/skins/mangesud.png" },
    boule: { id: "boule", type: "troop", name: "La Boule", cost: 4, hp: 800, dmg: 100, range: 4, speed: 7, atkSpeed: 1500, targetBuilding: true, color: "#FF9800", img: "assets/skins/setsud.png" },
    mega: { id: "mega", type: "troop", name: "MEGA Slime", cost: 8, hp: 2500, dmg: 150, range: 5, speed: 2, atkSpeed: 2000, color: "#9C27B0", img: "assets/skins/ninjasud.png" },
    tornade: { id: "tornade", type: "spell", name: "Tornade", cost: 3, dmg: 150, radius: 15, color: "#9E9E9E", img: "" }
};

let playerDeck = ["slime", "slimeuse", "mage", "boule", "mega", "tornade"];
let tempSelectedDeck = [...playerDeck];

function openDeckBuilder() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('deck-builder-menu').style.display = 'flex';
    renderDeckPool();
}

function closeDeckBuilder() {
    document.getElementById('deck-builder-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

function renderDeckPool() {
    const pool = document.getElementById('deck-pool');
    pool.innerHTML = '';
    
    Object.keys(cardDatabase).forEach(cardId => {
        const card = cardDatabase[cardId];
        const div = document.createElement('div');
        div.className = `card-select-item ${tempSelectedDeck.includes(cardId) ? 'selected' : ''}`;
        
        if(card.img) div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${card.img}')`;
        
        div.innerHTML = `
            <span style="position:absolute; top:-5px; left:-5px; background:#39ff14; color:#000; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-family:'Luckiest Guy'; border: 1px solid #000;">${card.cost}</span>
            <span style="margin-top:auto; background:rgba(0,0,0,0.8); padding:2px; border-radius:3px; text-align:center; width:100%;">${card.name}</span>
        `;
        
        div.onclick = () => {
            if (tempSelectedDeck.includes(cardId)) {
                if(tempSelectedDeck.length > 1) tempSelectedDeck = tempSelectedDeck.filter(id => id !== cardId);
            } else {
                if (tempSelectedDeck.length < 6) tempSelectedDeck.push(cardId);
            }
            renderDeckPool();
        };
        pool.appendChild(div);
    });

    document.getElementById('deck-counter').innerText = `Sélectionnées : ${tempSelectedDeck.length} / 6`;
    document.getElementById('validate-deck-btn').disabled = tempSelectedDeck.length !== 6;
}

function saveCustomDeck() {
    playerDeck = [...tempSelectedDeck];
    closeDeckBuilder();
}


// ==========================================
// 3. MULTIJOUEUR (PEERJS - CODE COS)
// ==========================================
let peer = null;
let conn = null;
let isHost = false;
let currentCOSCode = "";

function generateCOSCode() {
    return "COS" + Math.floor(1000 + Math.random() * 9000);
}

function openMultiMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('multi-menu').style.display = 'flex';
    currentCOSCode = generateCOSCode();
    document.getElementById('cos-code-display').innerText = currentCOSCode;
}

function closeMultiMenu() {
    document.getElementById('multi-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    if(peer) peer.destroy();
}

function hostGame() {
    document.getElementById('net-status').innerText = "Ouverture du salon " + currentCOSCode + "...";
    peer = new Peer(currentCOSCode); // Création du Peer avec l'ID COS
    
    peer.on('open', (id) => {
        isHost = true;
        document.getElementById('net-status').innerText = "En attente d'un adversaire...";
    });

    peer.on('connection', (connection) => {
        conn = connection;
        setupConnectionEvents();
        document.getElementById('net-status').innerText = "Adversaire connecté ! Lancement...";
        setTimeout(startMultiplayerGame, 1000);
    });
}

function joinGame() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if (!code.startsWith("COS") || code.length !== 7) {
        document.getElementById('net-status').innerText = "Format invalide (Exemple: COS4829)";
        return;
    }
    
    document.getElementById('net-status').innerText = "Recherche de " + code + "...";
    peer = new Peer();
    
    peer.on('open', () => {
        isHost = false;
        conn = peer.connect(code);
        setupConnectionEvents();
        setTimeout(() => {
            if(conn && conn.open) {
                document.getElementById('net-status').innerText = "Connecté ! Lancement...";
                startMultiplayerGame();
            } else {
                document.getElementById('net-status').innerText = "Impossible de joindre la partie.";
            }
        }, 1500);
    });
}

function setupConnectionEvents() {
    conn.on('data', (data) => {
        if (data.type === 'spawn') {
            // Le X et Y sont inversés car l'ennemi est de l'autre côté de l'écran
            spawnEntity(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
        }
    });
}

function startMultiplayerGame() {
    document.getElementById('multi-menu').style.display = 'none';
    initGameEngine();
}

function startSoloGame() {
    document.getElementById('main-menu').style.display = 'none';
    initGameEngine();
    setInterval(enemyAI, 2000); // Démarre l'IA si on est en solo
}


// ==========================================
// 4. MOTEUR DE JEU (GAME ENGINE)
// ==========================================
const MAX_SLIME = 10;
let currentSlime = 5; let enemySlime = 5; 
let hand = [], drawPile = [], nextCard = null;
let activeEntities = [], activeProjectiles = [];
let lastTime = performance.now();
let selectedCardIndex = null; 
let isGameOver = false;

const arena = document.getElementById('arena');
const deployZone = document.getElementById('deploy-zone');

function initGameEngine() {
    arena.style.display = 'block';
    document.getElementById('ui-container').style.display = 'flex';

    drawPile = [...playerDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift());
    nextCard = drawPile.shift();

    setupTowers();
    updateUI();

    setInterval(() => {
        if (!isGameOver && currentSlime < MAX_SLIME) { currentSlime++; updateSlimeUI(); }
        if (!isGameOver && enemySlime < MAX_SLIME && !conn) enemySlime++; // L'IA gagne de l'énergie si pas de multi
    }, 1500);
    setInterval(updateCardsAffordability, 100);
    
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

// UI DES CARTES ET DE L'ÉNERGIE
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

    // Si c'est une troupe, on ne peut la poser que sur sa moitié (Y > 50)
    if (cardData.type !== 'spell' && clickY < 50) return;

    currentSlime -= cardData.cost; updateSlimeUI();
    playSound('sfx-spawn');

    // Invocation
    if (cardData.type === 'spell') {
        castSpell(cardData, 'enemy', clickX, clickY);
    } else {
        spawnEntity(cardData, 'player', clickX, clickY);
        // Si multijoueur, on envoi la donnée
        if (conn && conn.open) {
            conn.send({ type: 'spawn', cardId: hand[selectedCardIndex], x: clickX, y: clickY });
        }
    }

    // Rotation du deck
    drawPile.push(hand[selectedCardIndex]);
    hand[selectedCardIndex] = nextCard;
    nextCard = drawPile.shift();
    selectedCardIndex = null; deployZone.style.display = 'none'; updateUI();
}


// ==========================================
// 5. COMBAT, PHYSIQUE ET IA
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
        team: team, x: x, y: y, color: data.color,
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
    fx.style.transform = 'translate(-50%, -50%)'; fx.style.zIndex = '10'; arena.appendChild(fx);
    setTimeout(() => fx.remove(), 800);

    activeEntities.forEach(ent => {
        if (ent.team === targetTeam && Math.sqrt(Math.pow(ent.x - targetX, 2) + Math.pow(ent.y - targetY, 2)) < 15) takeDamage(ent, spellData.dmg);
    });
}

function createParticles(x, y, color) {
    for(let i=0; i<6; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color || '#39ff14';
        p.style.left = `${x}%`; p.style.top = `${y}%`;
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 40;
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        arena.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }
}

function enemyAI() {
    if (isGameOver || conn) return; // Pas d'IA en multijoueur
    const troopCards = Object.values(cardDatabase).filter(c => c.type === 'troop');
    const affordableCards = troopCards.filter(c => c.cost <= enemySlime);
    
    if (affordableCards.length > 0 && Math.random() > 0.3) {
        const cardToPlay = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        enemySlime -= cardToPlay.cost;
        spawnEntity(cardToPlay, 'enemy', Math.random() > 0.5 ? 25 : 75, 15);
        playSound('sfx-spawn');
    }
}

function takeDamage(entity, amount) {
    if (entity.hp <= 0) return; 
    entity.hp -= amount;
    playSound('sfx-hit');
    
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

// LA BOUCLE TEMPORELLE
function gameLoop(currentTime) {
    if (isGameOver) { requestAnimationFrame(gameLoop); return; }

    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // --- NETTOYAGE DES MORTS ---
    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            playSound('sfx-die');
            createParticles(ent.x, ent.y, ent.color || '#fff');
            if (ent.element) ent.element.remove();
            
            if(ent.id === 'base_p') endGame('enemy');
            if(ent.id === 'base_e') endGame('player');
            return false;
        }
        return true;
    });

    // --- PROJECTILES ---
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

    // --- UNITÉS ---
    activeEntities.forEach(unit => {
        if (unit.speed === 0) { // Tours
            let closestTarget = null; let minDistance = 999;
            activeEntities.forEach(target => {
                if (target.team !== unit.team) {
                    let dist = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
                    if (dist < minDistance) { minDistance = dist; closestTarget = target; }
                }
            });
            if (closestTarget && minDistance <= unit.range && currentTime - unit.lastAttack >= unit.atkSpeed) {
                shootProjectile(unit, closestTarget); unit.lastAttack = currentTime;
            }
            return; 
        }

        // Troupes
        let closestTarget = null; let minDistance = 999;
        activeEntities.forEach(target => {
            if (target.team !== unit.team) {
                if (unit.targetBuilding && target.speed !== 0) return; // Ignorer les unités si targetBuilding
                let dist = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
                if (dist < minDistance) { minDistance = dist; closestTarget = target; }
            }
        });

        if (closestTarget) {
            let distToTarget = Math.sqrt(Math.pow(unit.x - closestTarget.x, 2) + Math.pow(unit.y - closestTarget.y, 2));
            if (distToTarget <= unit.range) {
                // Attaque
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
                // Mouvement et Ponts
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
