// ==========================================
// 1. GESTION DES PARAMETRES (AVEC TON ANIMATION JAVASCRIPT)
// ==========================================
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); }

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const fsToggle = document.getElementById('fs-toggle');
    if(fsToggle) fsToggle.checked = !!document.fullscreenElement;
});

// ANIMATION DES PARAMETRES (Hover / Click)
let hoverInterval; 
let currentFrame = 0;
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    const settingsBtnImg = document.getElementById('settings-btn-img');
    settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    const settingsBtnImg = document.getElementById('settings-btn-img');
    if (!settingsBtnImg.src.includes('settings4.png')) { 
        settingsBtnImg.src = '../img/setting.png'; 
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    const settingsBtnImg = document.getElementById('settings-btn-img');
    settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
}

// --- GESTION AUDIO GLOBALE ---
let isMuted = localStorage.getItem('isMuted') === 'true';
let musicStarted = false;

document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) musicToggle.checked = !isMuted;
    
    const settingsBtnImg = document.getElementById('settings-btn-img');
    if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png';
});

function toggleMusic() {
    const musicToggle = document.getElementById('music-toggle');
    isMuted = !musicToggle.checked;
    localStorage.setItem('isMuted', isMuted);
    
    const bgm = document.getElementById('bg-music');
    if (bgm) { if (!isMuted) bgm.play().catch(()=>{}); else bgm.pause(); }
}

function startMusic() {
    if(!musicStarted && !isMuted) {
        const bgm = document.getElementById('bg-music');
        if(bgm) { bgm.volume = 0.3; bgm.play().catch(()=>{}); }
        musicStarted = true;
    }
}

function playSound(id) {
    if (isMuted) return;
    const sound = document.getElementById(id);
    if(sound) { sound.currentTime = 0; sound.volume = 0.5; sound.play().catch(()=>{}); }
}


// ==========================================
// 2. BASE DE DONNÉES EXACTE DES SKINS
// ==========================================
const cardDatabase = {
    slime: { 
        id: "slime", type: "troop", name: "Slime", cost: 3, hp: 600, dmg: 40, range: 4, speed: 4, atkSpeed: 1000, targetsAir: false,
        skins: { 
            front: { idle: ['assets/skins/slime.png'], attack: ['assets/skins/slimeattack1.png', 'assets/skins/slimeattack2.png'] },
            back:  { idle: ['assets/skins/slimeback.png'], attack: ['assets/skins/slimeback.png'] }
        }
    },
    slimeuse: { 
        id: "slimeuse", type: "troop", name: "Slimeuse", cost: 3, hp: 200, dmg: 90, range: 25, speed: 5, atkSpeed: 1000, isRanged: true, targetsAir: true,
        skins: {
            front: { idle: ['assets/skins/slimeuse.png'], attack: ['assets/skins/slimeuseattack.png'] },
            back:  { idle: ['assets/skins/slimeuseback.png'], attack: ['assets/skins/slimeuseback.png'] }
        }
    },
    mega: { 
        id: "mega", type: "troop", name: "MEGA", cost: 8, hp: 2500, dmg: 150, range: 5, speed: 2, atkSpeed: 2000, targetsAir: false,
        skins: {
            front: { idle: ['assets/skins/golem.png'], attack: ['assets/skins/golemattack.png'] },
            back:  { idle: ['assets/skins/golemback.png'], attack: ['assets/skins/golemattackback.png'] }
        }
    },
    boule: { 
        id: "boule", type: "troop", name: "La Boule", cost: 4, hp: 800, dmg: 100, range: 4, speed: 7, atkSpeed: 1500, targetBuilding: true, targetsAir: false,
        skins: {
            front: { idle: ['assets/skins/boule.png'], attack: ['assets/skins/boule.png'] },
            back:  { idle: ['assets/skins/bouleback.png'], attack: ['assets/skins/bouleback.png'] }
        }
    },
    helicoton: { 
        id: "helicoton", type: "troop", name: "Hélicoton", cost: 3, hp: 300, dmg: 50, range: 20, speed: 5, atkSpeed: 900, isRanged: true, isFlying: true, targetsAir: true,
        skins: {
            front: { idle: ['assets/skins/helicoton.png'], attack: ['assets/skins/helicotonattack.png'] },
            back:  { idle: ['assets/skins/helictonback.png'], attack: ['assets/skins/helictonback.png'] }
        }
    },
    dragon: { 
        id: "dragon", type: "troop", name: "Dragon", cost: 4, hp: 800, dmg: 80, range: 15, speed: 4, atkSpeed: 1200, isRanged: true, isFlying: true, targetsAir: true,
        skins: {
            front: { idle: ['assets/skins/drake1.png', 'assets/skins/drake2.png'], attack: ['assets/skins/drake1.png', 'assets/skins/drake2.png'] },
            back:  { idle: ['assets/skins/drakeback1.png', 'assets/skins/drakeback2.png'], attack: ['assets/skins/drakeback1.png', 'assets/skins/drakeback2.png'] }
        }
    },
    usine: { 
        id: "usine", type: "building", name: "Usine", cost: 4, hp: 800, lifetime: 30, spawnRate: 10000, spawnId: "slime", speed: 0, range: 0,
        isStacked: true,
        skins: {
            front: { base: 'assets/skins/tourback.png', top: 'assets/skins/tour.png' }, 
            back: { base: 'assets/skins/tourback.png', top: 'assets/skins/tour.png' }
        }
    },
    barriere: { 
        id: "barriere", type: "building", name: "Barrière", cost: 4, hp: 1000, lifetime: 40, dmg: 20, range: 15, speed: 0, atkSpeed: 1000, stunDuration: 0.5, isRanged: true, targetsAir: false,
        skins: {
            front: { idle: ['assets/skins/electric1.png', 'assets/skins/electric2.png'], attack: ['assets/skins/electric1.png', 'assets/skins/electric2.png'] },
            back:  { idle: ['assets/skins/electric1.png', 'assets/skins/electric2.png'], attack: ['assets/skins/electric1.png', 'assets/skins/electric2.png'] }
        }
    },
    canon: { 
        id: "canon", type: "building", name: "Canon", cost: 3, hp: 900, lifetime: 40, dmg: 70, range: 30, speed: 0, atkSpeed: 1100, isRanged: true, targetsAir: true, hasTurret: true,
        skins: {
            front: { base: 'assets/skins/supportcanon.png', turret: 'assets/skins/canon.png' },
            back:  { base: 'assets/skins/suportcanonback.png', turret: 'assets/skins/canonback_rotatif.png' }
        }
    },
    tornade: { 
        id: "tornade", type: "spell_tornado", name: "Tornade", cost: 3, dmg: 15, radius: 15, 
        anim: ['assets/skins/tornade1.png', 'assets/skins/tornade2.png', 'assets/skins/tornadeback1.png', 'assets/skins/tornadeback2.png']
    },
    boule_sort: { 
        id: "boule_sort", type: "spell_puddle", name: "Boule Sort", cost: 2, dmg: 50, radius: 15, pushback: true, slowDuration: 3, duration: 5000,
        projectile: 'assets/skins/boulespell.png', anim: ['assets/skins/splashboule.png']
    },
    marais: { 
        id: "marais", type: "spell_spawn", name: "Marais", cost: 5, duration: 10000, spawnRate: 2000, spawnId: "mini_slime", radius: 15,
        anim: ['assets/skins/marais1.png', 'assets/skins/marais2.png', 'assets/skins/marais3.png']
    },
    mini_slime: { 
        id: "mini_slime", type: "troop", name: "Mini", hp: 150, dmg: 20, range: 4, speed: 5, atkSpeed: 1000, targetsAir: false, hidden: true,
        skins: {
            front: { idle: ['assets/skins/slime.png'], attack: ['assets/skins/slimeattack1.png'] },
            back:  { idle: ['assets/skins/slimeback.png'], attack: ['assets/skins/slimeback.png'] }
        }
    }
};

let playerDeck = ["slime", "slimeuse", "dragon", "tornade", "boule_sort", "marais"];
let tempSelectedDeck = [...playerDeck];

function openDeckBuilder() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('deck-builder-menu').style.display = 'flex'; renderDeckPool();
}
function closeDeckBuilder() {
    document.getElementById('deck-builder-menu').style.display = 'none'; document.getElementById('main-menu').style.display = 'flex';
}
function renderDeckPool() {
    const pool = document.getElementById('deck-pool'); pool.innerHTML = '';
    Object.keys(cardDatabase).filter(k => !cardDatabase[k].hidden).forEach(cardId => {
        const card = cardDatabase[cardId];
        const div = document.createElement('div');
        div.className = `card-select-item ${tempSelectedDeck.includes(cardId) ? 'selected' : ''}`;
        
        let bgImg = (card.hasTurret || card.isStacked) ? card.skins.front.base : (card.skins ? card.skins.front.idle[0] : (card.projectile || card.anim[0]));
        
        // Empêche les "doubles images" avec background-repeat: no-repeat !
        div.style.backgroundImage = `url('${bgImg}'), linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('assets/skins/mapday.jpeg')`;
        div.style.backgroundSize = 'contain, cover, cover';
        div.style.backgroundPosition = 'center, center, center';
        div.style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat';

        div.innerHTML = `<span style="position:absolute; top:-5px; left:-5px; background:#39ff14; color:#000; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-family:'Luckiest Guy'; border: 1px solid #000;">${card.cost}</span>`;
        div.onclick = () => {
            if (tempSelectedDeck.includes(cardId)) { if(tempSelectedDeck.length > 1) tempSelectedDeck = tempSelectedDeck.filter(id => id !== cardId); } 
            else { if (tempSelectedDeck.length < 6) tempSelectedDeck.push(cardId); }
            renderDeckPool();
        };
        pool.appendChild(div);
    });
    document.getElementById('deck-counter').innerText = `Sélectionnées : ${tempSelectedDeck.length} / 6`;
    document.getElementById('validate-deck-btn').disabled = tempSelectedDeck.length !== 6;
}
function saveCustomDeck() { playerDeck = [...tempSelectedDeck]; closeDeckBuilder(); }

// ==========================================
// 3. MULTIJOUEUR ET ÉMOTES
// ==========================================
let peer = null, conn = null, isHost = false, currentCOSCode = "";

function generateCOSCode() { return "COS" + Math.floor(1000 + Math.random() * 9000); }
function openMultiMenu() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('multi-menu').style.display = 'flex';
    currentCOSCode = generateCOSCode(); document.getElementById('cos-code-display').innerText = currentCOSCode;
}
function closeMultiMenu() { document.getElementById('multi-menu').style.display = 'none'; document.getElementById('main-menu').style.display = 'flex'; if(peer) peer.destroy(); }
function hostGame() {
    document.getElementById('net-status').innerText = "Ouverture du salon " + currentCOSCode + "..."; peer = new Peer(currentCOSCode);
    peer.on('open', () => { isHost = true; document.getElementById('net-status').innerText = "En attente d'un adversaire..."; });
    peer.on('connection', (connection) => { conn = connection; setupConnectionEvents(); document.getElementById('net-status').innerText = "Connecté ! Lancement..."; setTimeout(startMultiplayerGame, 1000); });
}
function joinGame() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if (!code.startsWith("COS") || code.length !== 7) { document.getElementById('net-status').innerText = "Format invalide"; return; }
    document.getElementById('net-status').innerText = "Recherche de " + code + "..."; peer = new Peer();
    peer.on('open', () => {
        isHost = false; conn = peer.connect(code); setupConnectionEvents();
        setTimeout(() => {
            if(conn && conn.open) { document.getElementById('net-status').innerText = "Connecté !"; startMultiplayerGame(); } 
            else { document.getElementById('net-status').innerText = "Impossible de joindre la partie."; }
        }, 1500);
    });
}
function setupConnectionEvents() {
    conn.on('data', (data) => {
        if (data.type === 'spawn') {
            if (data.spellType === 'spell' || data.spellType === 'spell_tornado') castSpell(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
            else if (data.spellType === 'spell_puddle' || data.spellType === 'spell_spawn') castSpellPuddle(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
            else spawnEntity(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
        } else if (data.type === 'emote') { showEmote(data.emote, 'enemy'); }
    });
}
function sendEmote(emoji) { showEmote(emoji, 'player'); if(conn && conn.open) conn.send({type: 'emote', emote: emoji}); }
function showEmote(emoji, team) {
    const base = activeEntities.find(e => e.id === (team === 'player' ? 'base_p' : 'base_e')); if(!base) return;
    const b = document.createElement('div'); b.className = 'emote-bubble'; b.innerText = emoji;
    b.style.left = `${base.x}%`; b.style.top = `${base.y}%`; arena.appendChild(b);
    setTimeout(() => b.remove(), 2000);
}
function startMultiplayerGame() { document.getElementById('multi-menu').style.display = 'none'; initGameEngine(); }
function startSoloGame() { document.getElementById('main-menu').style.display = 'none'; initGameEngine(); setInterval(enemyAI, 2000); }


// ==========================================
// 4. MOTEUR DE JEU (GAME ENGINE)
// ==========================================
const MAX_SLIME = 10;
let currentSlime = 5; let enemySlime = 5; 
let hand = [], drawPile = [], nextCard = null;
let activeEntities = [], activeProjectiles = [], activeSpells = [];
let lastTime = performance.now();
let selectedCardIndex = null; let isGameOver = false;

let gameTime = 180; let slimeRate = 2.5; let slimeAcc = 0; let enemySlimeAcc = 0; let doubleSlimeActive = false;
const arena = document.getElementById('arena'); const deployZone = document.getElementById('deploy-zone');

function initGameEngine() {
    arena.style.display = 'block'; document.getElementById('ui-container').style.display = 'flex';
    document.getElementById('game-timer').style.display = 'block'; document.getElementById('emote-panel').style.display = 'flex';
    drawPile = [...playerDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift()); nextCard = drawPile.shift();
    setupTowers(); updateUI();
    arena.addEventListener('click', handleArenaClick);
    lastTime = performance.now(); requestAnimationFrame(gameLoop);
}

function setupTowers() {
    createTower('base_p', 'player', 50, 92, 5000, "assets/skins/tourroyaleback.png", 96, 96);
    createTower('tower_p_l', 'player', 25, 75, 2500, "assets/skins/tourback.png", 72, 72);
    createTower('tower_p_r', 'player', 75, 75, 2500, "assets/skins/tourback.png", 72, 72);

    createTower('base_e', 'enemy', 50, 8, 5000, "assets/skins/touroryale.png", 96, 96);
    createTower('tower_e_l', 'enemy', 25, 25, 2500, "assets/skins/tour.png", 72, 72);
    createTower('tower_e_r', 'enemy', 75, 25, 2500, "assets/skins/tour.png", 72, 72);
}

function createTower(id, team, x, y, hp, img, width, height) {
    const el = document.createElement('div');
    el.className = `entity building team-${team}`;
    el.style.left = `${x}%`; el.style.top = `${y}%`; el.style.width = `${width}px`; el.style.height = `${height}px`;
    el.style.backgroundImage = `url('${img}')`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>`;
    arena.appendChild(el);
    
    let lane = x < 50 ? 'left' : (x > 50 ? 'right' : 'center');
    
    activeEntities.push({ id: id, team: team, x: x, y: y, lane: lane, hp: hp, maxHp: hp, dmg: 50, range: 35, speed: 0, atkSpeed: 1000, isRanged: true, isFlying: false, targetsAir: true, targetBuilding: false, stunTimer: 0, slowTimer: 0, lastAttack: 0, element: el, hpBar: el.querySelector('.entity-hp-fill') });
}

function restartGame() {
    isGameOver = false; document.getElementById('game-over-overlay').style.display = 'none';
    document.querySelectorAll('.entity, .projectile, .particle, .dmg-text, .spell-puddle, .spell-anim').forEach(e => e.remove());
    activeEntities = []; activeProjectiles = []; activeSpells = [];
    currentSlime = 5; enemySlime = 5; updateSlimeUI();
    gameTime = 180; slimeRate = 2.5; doubleSlimeActive = false; document.getElementById('game-timer').classList.remove('timer-danger');
    setupTowers();
}

function endGame(winnerTeam) {
    isGameOver = true; document.getElementById('game-over-overlay').style.display = 'flex';
    const title = document.getElementById('game-over-title');
    if (winnerTeam === 'player') { title.innerText = "VICTOIRE !"; title.style.color = "#39ff14"; } 
    else if (winnerTeam === 'enemy') { title.innerText = "DÉFAITE !"; title.style.color = "#ff3366"; }
    else { title.innerText = "ÉGALITÉ !"; title.style.color = "#fff"; }
}

function updateSlimeUI() {
    document.getElementById('slime-bar-fill').style.width = `${(currentSlime / MAX_SLIME) * 100}%`;
    document.getElementById('slime-count').innerText = `${currentSlime} / 10`;
}

function updateUI() {
    const handContainer = document.getElementById('hand'); handContainer.innerHTML = '';
    hand.forEach((cardId, index) => {
        const div = document.createElement('div');
        div.className = `card ${selectedCardIndex === index ? 'selected' : ''} ${currentSlime < cardDatabase[cardId].cost ? 'disabled' : ''}`;
        const data = cardDatabase[cardId];
        let bgImg = (data.hasTurret || data.isStacked) ? data.skins.front.base : (data.skins ? data.skins.front.idle[0] : (data.projectile || data.anim[0]));
        
        div.style.backgroundImage = `url('${bgImg}'), linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('assets/skins/mapday.jpeg')`;
        div.style.backgroundSize = 'contain, cover, cover';
        div.style.backgroundPosition = 'center, center, center';
        div.style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat';

        div.dataset.cost = data.cost; div.innerHTML = `<div class="cost">${data.cost}</div>`;
        div.addEventListener('click', () => selectCard(index)); handContainer.appendChild(div);
    });
    
    let nextData = cardDatabase[nextCard];
    let nextBg = (nextData.hasTurret || nextData.isStacked) ? nextData.skins.front.base : (nextData.skins ? nextData.skins.front.idle[0] : (nextData.projectile || nextData.anim[0]));
    document.getElementById('next-card').style.backgroundImage = `url('${nextBg}'), linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('assets/skins/mapday.jpeg')`;
    document.getElementById('next-card').style.backgroundSize = 'contain, cover, cover';
    document.getElementById('next-card').style.backgroundPosition = 'center, center, center';
    document.getElementById('next-card').style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat';
    document.getElementById('next-card').innerHTML = `<div class="cost">${nextData.cost}</div>`;
}

function selectCard(index) {
    if (currentSlime < cardDatabase[hand[index]].cost) return; 
    selectedCardIndex = selectedCardIndex === index ? null : index;
    deployZone.style.display = selectedCardIndex !== null ? 'flex' : 'none'; updateUI();
}

function handleArenaClick(e) {
    if (selectedCardIndex === null || isGameOver) return;
    const rect = arena.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100; const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const cardData = cardDatabase[hand[selectedCardIndex]];

    if (cardData.type !== 'spell' && cardData.type !== 'spell_puddle' && cardData.type !== 'spell_spawn' && cardData.type !== 'spell_tornado' && clickY < 50) return;

    currentSlime -= cardData.cost; updateSlimeUI(); playSound('sfx-spawn');

    if (cardData.type === 'spell' || cardData.type === 'spell_tornado') castSpell(cardData, 'player', clickX, clickY);
    else if (cardData.type === 'spell_puddle' || cardData.type === 'spell_spawn') castSpellPuddle(cardData, 'player', clickX, clickY);
    else spawnEntity(cardData, 'player', clickX, clickY);

    if (conn && conn.open) conn.send({ type: 'spawn', cardId: hand[selectedCardIndex], x: clickX, y: clickY, spellType: cardData.type });

    drawPile.push(hand[selectedCardIndex]); hand[selectedCardIndex] = nextCard; nextCard = drawPile.shift();
    selectedCardIndex = null; deployZone.style.display = 'none'; updateUI();
}

function spawnEntity(data, team, x, y) {
    const el = document.createElement('div');
    el.className = `entity team-${team} ${data.type === 'building' ? 'building' : ''} ${data.isFlying ? 'is-flying' : ''}`;
    el.dataset.id = data.id;
    let initFacing = team === 'player' ? 'back' : 'front';
    let initLane = x < 50 ? 'left' : 'right';

    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>`;
    
    let turretEl = null; let topEl = null;
    
    if (data.hasTurret) {
        el.style.backgroundImage = `url('${data.skins[initFacing].base}')`;
        turretEl = document.createElement('div'); turretEl.className = 'turret';
        turretEl.style.backgroundImage = `url('${data.skins[initFacing].turret}')`; el.appendChild(turretEl);
    } else if (data.isStacked) {
        el.style.backgroundImage = `url('${data.skins[initFacing].base}')`;
        topEl = document.createElement('div'); topEl.className = 'stacked-top';
        topEl.style.backgroundImage = `url('${data.skins[initFacing].top}')`; el.appendChild(topEl);
    }

    arena.appendChild(el);
    activeEntities.push({
        id: Math.random().toString(36).substr(2, 9),
        team: team, x: x, y: y, lane: initLane, color: data.color, hp: data.hp, maxHp: data.hp, dmg: data.dmg || 0, 
        range: data.range, speed: data.speed, atkSpeed: data.atkSpeed || 1000, 
        isRanged: data.isRanged || false, targetBuilding: data.targetBuilding || false,
        isFlying: data.isFlying || false, targetsAir: data.targetsAir || false,
        hasTurret: data.hasTurret || false, isStacked: data.isStacked || false, skins: data.skins, facing: initFacing,
        state: 'idle', animTimer: 0, animFrame: 0,
        stunDuration: data.stunDuration || null, lifetime: data.lifetime || null, spawnRate: data.spawnRate || null, spawnId: data.spawnId || null, lastSpawn: 0,
        stunTimer: 0, slowTimer: 0, lastAttack: 0, element: el, turretElement: turretEl, hpBar: el.querySelector('.entity-hp-fill')
    });
}

function castSpell(spellData, casterTeam, targetX, targetY) {
    if (spellData.id === 'tornade') {
        for(let i=0; i<3; i++) {
            const fx = document.createElement('div'); fx.className = 'spell-anim';
            fx.style.width = '60px'; fx.style.height = '60px';
            arena.appendChild(fx);
            let offsetX = (Math.random() - 0.5) * 15; let offsetY = (Math.random() - 0.5) * 15;

            activeSpells.push({ 
                type: 'tornado', team: casterTeam, 
                x: targetX + offsetX, y: targetY + offsetY, 
                vx: (Math.random() - 0.5) * 4, vy: casterTeam === 'player' ? -8 : 8,
                anim: spellData.anim, element: fx, timer: 0, frame: Math.floor(Math.random()*4), 
                duration: 3500, dmg: spellData.dmg, tickTimer: 0
            });
        }
    } else {
        const fx = document.createElement('div'); fx.className = 'spell-anim';
        fx.style.left = `${targetX}%`; fx.style.top = `${targetY}%`; fx.style.width = `${spellData.radius*4}px`; fx.style.height = `${spellData.radius*4}px`;
        arena.appendChild(fx);
        activeSpells.push({ type: 'instant', x: targetX, y: targetY, anim: spellData.anim, element: fx, timer: 0, frame: 0, maxTime: 0.8 });

        const targetTeam = casterTeam === 'player' ? 'enemy' : 'player';
        activeEntities.forEach(ent => {
            if (ent.team === targetTeam && Math.sqrt(Math.pow(ent.x - targetX, 2) + Math.pow(ent.y - targetY, 2)) < spellData.radius) takeDamage(ent, spellData.dmg);
        });
    }
}

function castSpellPuddle(spellData, casterTeam, targetX, targetY) {
    const puddle = document.createElement('div'); puddle.className = 'spell-puddle';
    puddle.style.left = `${targetX}%`; puddle.style.top = `${targetY}%`;
    puddle.style.width = `${spellData.radius * 4}px`; puddle.style.height = `${spellData.radius * 4}px`;
    if(spellData.anim && spellData.anim.length > 0) { puddle.style.backgroundImage = `url('${spellData.anim[0]}')`; }
    arena.appendChild(puddle);
    
    activeSpells.push({
        type: spellData.type === 'spell_puddle' ? 'puddle' : 'spawner',
        team: casterTeam, x: targetX, y: targetY, radius: spellData.radius, duration: spellData.duration, 
        spawnRate: spellData.spawnRate, spawnId: spellData.spawnId, lastSpawn: 0, anim: spellData.anim, element: puddle, timer: 0, frame: 0,
        dmg: spellData.dmg, slowDuration: spellData.slowDuration, pushback: spellData.pushback, triggered: false
    });
}

function enemyAI() {
    if (isGameOver || conn) return;
    const playableCards = Object.values(cardDatabase).filter(c => c.cost <= enemySlime && !c.hidden);
    if (playableCards.length > 0 && Math.random() > 0.4) {
        const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
        enemySlime -= cardToPlay.cost;
        if(cardToPlay.type.includes('spell')) {
            const spellFn = cardToPlay.type === 'spell' || cardToPlay.type === 'spell_tornado' ? castSpell : castSpellPuddle;
            spellFn(cardToPlay, 'enemy', 20 + Math.random()*60, 65 + Math.random()*20);
        } else { spawnEntity(cardToPlay, 'enemy', Math.random() > 0.5 ? 25 : 75, 15); }
        playSound('sfx-spawn');
    }
}

function createParticles(x, y, color) {
    for(let i=0; i<6; i++) {
        const p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color || '#39ff14'; p.style.left = `${x}%`; p.style.top = `${y}%`;
        const angle = Math.random() * Math.PI * 2; const dist = 15 + Math.random() * 40;
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`); p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        arena.appendChild(p); setTimeout(() => p.remove(), 500);
    }
}

function takeDamage(entity, amount) {
    if (entity.hp <= 0) return; entity.hp -= amount; playSound('sfx-hit');
    const txt = document.createElement('div'); txt.className = `dmg-text team-${entity.team}`; txt.innerText = `-${Math.round(amount)}`; txt.style.left = `${entity.x}%`; txt.style.top = `${entity.y}%`;
    arena.appendChild(txt); setTimeout(() => txt.remove(), 1000);
    if(entity.element) {
        entity.element.style.filter = 'brightness(2) contrast(1.5)'; setTimeout(() => { if(entity.element) entity.element.style.filter = 'none'; }, 100);
        if (entity.hpBar) entity.hpBar.style.width = `${Math.max(0, (entity.hp / entity.maxHp) * 100)}%`;
    }
}

function shootProjectile(attacker, target) {
    const proj = document.createElement('div'); proj.className = 'projectile'; 
    proj.style.left = `${attacker.x}%`; proj.style.top = `${attacker.y}%`; 
    if(cardDatabase['boule_sort'] && cardDatabase['boule_sort'].projectile) {
        proj.style.backgroundImage = `url('${cardDatabase['boule_sort'].projectile}')`; proj.style.backgroundColor = 'transparent'; proj.style.width = '20px'; proj.style.height = '20px';
    }
    arena.appendChild(proj);
    activeProjectiles.push({ x: attacker.x, y: attacker.y, target: target, dmg: attacker.dmg, team: attacker.team, stunDuration: attacker.stunDuration, element: proj, speed: 40 });
}

// ==========================================
// 6. BOUCLE PRINCIPALE (GAME LOOP)
// ==========================================
function gameLoop(currentTime) {
    if (isGameOver) { requestAnimationFrame(gameLoop); return; }
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    gameTime -= dt;
    if (gameTime <= 60 && !doubleSlimeActive) {
        doubleSlimeActive = true; slimeRate = 1.25; 
        document.getElementById('game-timer').classList.add('timer-danger'); document.getElementById('alert-message').style.display = 'block';
    }
    if (gameTime <= 0) { endGame('tie'); return; }
    const mins = Math.floor(gameTime / 60); const secs = Math.floor(gameTime % 60);
    document.getElementById('game-timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    slimeAcc += dt; enemySlimeAcc += dt;
    if(slimeAcc >= slimeRate) { slimeAcc = 0; if(currentSlime < MAX_SLIME) { currentSlime++; updateSlimeUI(); updateUI(); } }
    if(enemySlimeAcc >= slimeRate && !conn) { enemySlimeAcc = 0; if(enemySlime < MAX_SLIME) enemySlime++; }

    activeSpells = activeSpells.filter(spell => {
        spell.timer += dt;
        if(spell.timer > 0.15 && spell.anim && spell.anim.length > 1) { 
            spell.timer = 0; spell.frame++;
            spell.element.style.backgroundImage = `url('${spell.anim[spell.frame % spell.anim.length]}')`;
        }
        
        if (spell.type === 'tornado') {
            spell.duration -= dt * 1000;
            spell.x += spell.vx * dt; spell.y += spell.vy * dt;
            spell.element.style.left = `${spell.x}%`; spell.element.style.top = `${spell.y}%`;

            spell.tickTimer += dt;
            if(spell.tickTimer > 0.3) {
                spell.tickTimer = 0;
                const targetTeam = spell.team === 'player' ? 'enemy' : 'player';
                activeEntities.forEach(ent => {
                    if (ent.team === targetTeam && Math.hypot(ent.x - spell.x, ent.y - spell.y) < 12) {
                        takeDamage(ent, spell.dmg);
                        if (!ent.id.includes('base') && !ent.id.includes('tower')) {
                            ent.x += (spell.x - ent.x) * 0.1; ent.y += (spell.y - ent.y) * 0.1; 
                        }
                    }
                });
            }
            if(spell.duration <= 0) { spell.element.remove(); return false; }
        }
        else if (spell.type === 'instant') {
            spell.maxTime -= dt; if(spell.maxTime <= 0) { spell.element.remove(); return false; }
        } else {
            spell.duration -= dt * 1000;
            if (spell.type === 'puddle' && !spell.triggered) {
                spell.triggered = true;
                const targetTeam = spell.team === 'player' ? 'enemy' : 'player';
                activeEntities.forEach(ent => {
                    if (ent.team === targetTeam && Math.sqrt(Math.pow(ent.x - spell.x, 2) + Math.pow(ent.y - spell.y, 2)) < spell.radius) {
                        takeDamage(ent, spell.dmg);
                        if(spell.pushback && !ent.id.includes('base') && !ent.id.includes('tower')) {
                            const angle = Math.atan2(ent.y - spell.y, ent.x - spell.x); ent.x += Math.cos(angle) * 8; ent.y += Math.sin(angle) * 8; ent.slowTimer = spell.slowDuration;
                        }
                    }
                });
            }
            if (spell.type === 'spawner') {
                spell.lastSpawn += dt * 1000;
                if(spell.lastSpawn >= spell.spawnRate) {
                    spell.lastSpawn = 0; const angle = Math.random() * Math.PI * 2; const dist = Math.random() * spell.radius;
                    spawnEntity(cardDatabase[spell.spawnId], spell.team, spell.x + Math.cos(angle) * dist, spell.y + Math.sin(angle) * dist);
                }
            }
            if(spell.duration <= 0) { spell.element.remove(); return false; }
        }
        return true;
    });

    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            playSound('sfx-die'); createParticles(ent.x, ent.y, ent.color || '#fff');
            if (ent.element) ent.element.remove();
            if(ent.id === 'base_p') endGame('enemy'); if(ent.id === 'base_e') endGame('player');
            return false;
        }
        return true;
    });

    activeProjectiles = activeProjectiles.filter(p => {
        if(p.target.hp <= 0) { p.element.remove(); return false; } 
        const dx = p.target.x - p.x; const dy = p.target.y - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < 2) { 
            takeDamage(p.target, p.dmg); 
            if(p.stunDuration) p.target.stunTimer = p.stunDuration;
            p.element.remove(); return false; 
        } else {
            const angle = Math.atan2(dy, dx); p.x += Math.cos(angle) * p.speed * dt; p.y += Math.sin(angle) * p.speed * dt;
            p.element.style.left = `${p.x}%`; p.element.style.top = `${p.y}%`; return true;
        }
    });

    activeEntities.forEach(unit => {
        let currentSpeed = unit.speed; let currentAtkSpeed = unit.atkSpeed;
        if (unit.stunTimer > 0) { unit.stunTimer -= dt; unit.state = 'idle'; unit.element.classList.add('stunned'); return; } 
        else { unit.element.classList.remove('stunned'); }

        if (unit.slowTimer > 0) { unit.slowTimer -= dt; currentSpeed *= 0.5; currentAtkSpeed *= 2; unit.element.classList.add('slowed'); } 
        else { unit.element.classList.remove('slowed'); }

        if (unit.spawnRate) { unit.lastSpawn += dt * 1000; if (unit.lastSpawn >= unit.spawnRate) { unit.lastSpawn = 0; spawnEntity(cardDatabase[unit.spawnId], unit.team, unit.x, unit.y + (unit.team === 'player' ? -5 : 5)); } }
        if (unit.lifetime) { unit.hp -= (unit.maxHp / unit.lifetime) * dt; if (unit.hpBar) unit.hpBar.style.width = `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%`; }

        let closestTarget = null; let minDistance = 999;
        let aggroRadius = 25;

        if (!unit.targetBuilding && unit.speed > 0) {
            activeEntities.forEach(target => {
                if (target.team !== unit.team && (!target.isFlying || unit.targetsAir)) {
                    let dist = Math.hypot(unit.x - target.x, unit.y - target.y);
                    if (dist < aggroRadius && dist < minDistance) { minDistance = dist; closestTarget = target; }
                }
            });
        }

        if (!closestTarget) {
            let minLaneDist = 999;
            activeEntities.forEach(target => {
                if (target.team !== unit.team && target.speed === 0) {
                    let targetLane = target.x < 50 ? 'left' : (target.x > 50 ? 'right' : 'center');
                    if (targetLane === unit.lane || targetLane === 'center' || target.id.includes('base')) {
                        let dist = Math.hypot(unit.x - target.x, unit.y - target.y);
                        if (dist < minLaneDist) { minLaneDist = dist; closestTarget = target; }
                    }
                }
            });
            if (!closestTarget) {
                activeEntities.forEach(target => {
                    if (target.team !== unit.team && target.speed === 0) {
                        let dist = Math.hypot(unit.x - target.x, unit.y - target.y);
                        if (dist < minLaneDist) { minLaneDist = dist; closestTarget = target; }
                    }
                });
            }
        }

        if (closestTarget) {
            let distToTarget = Math.hypot(unit.x - closestTarget.x, unit.y - closestTarget.y);
            if(!unit.id.includes('base') && !unit.id.includes('tower')) { unit.facing = (closestTarget.y < unit.y) ? 'back' : 'front'; }

            if (unit.hasTurret) {
                let dx = closestTarget.x - unit.x; let dy = closestTarget.y - unit.y;
                let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
                unit.turretElement.style.transform = `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`;
            }

            if (distToTarget <= unit.range) {
                unit.state = 'attack';
                if (currentTime - unit.lastAttack >= currentAtkSpeed) {
                    if (unit.isRanged) shootProjectile(unit, closestTarget); else takeDamage(closestTarget, unit.dmg);
                    unit.lastAttack = currentTime;
                }
            } else if (unit.speed > 0) {
                unit.state = 'idle';
                let targetX = closestTarget.x; let targetY = closestTarget.y;
                if (!unit.isFlying && ((unit.y > 50 && targetY < 50) || (unit.y < 50 && targetY > 50))) {
                    let targetBridgeX = (closestTarget.x < 50) ? 25 : 75; 
                    if (Math.abs(unit.x - targetBridgeX) > 2) { targetX = targetBridgeX; targetY = unit.y; }
                }
                const dx = targetX - unit.x; const dy = targetY - unit.y; const angle = Math.atan2(dy, dx);
                unit.x += Math.cos(angle) * currentSpeed * dt * (arena.offsetHeight / arena.offsetWidth);
                unit.y += Math.sin(angle) * currentSpeed * dt;
                unit.element.style.left = `${unit.x}%`; unit.element.style.top = `${unit.y}%`;
            }
        } else { unit.state = 'idle'; }

        if (unit.skins && !unit.hasTurret && !unit.isStacked && !unit.id.includes('base') && !unit.id.includes('tower')) {
            unit.animTimer += dt;
            if (unit.animTimer > 0.15) { 
                unit.animTimer = 0; unit.animFrame++;
                let skinState = unit.skins[unit.facing][unit.state] || unit.skins[unit.facing]['idle'];
                if(skinState) {
                    unit.element.style.backgroundImage = `url('${skinState[unit.animFrame % skinState.length]}')`;
                }
            }
        }
    });
    requestAnimationFrame(gameLoop);
}
