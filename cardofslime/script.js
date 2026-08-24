// ==========================================
// 1. PARAMÈTRES ET AUDIO
// ==========================================
const settingImages = ['img/setting.png', 'img/settings1.png', 'img/settings2.png', 'img/settings3.png', 'img/settings5.png'];
let currentSettingIndex = 0; let soundEnabled = true; let musicStarted = false;

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('show');
    currentSettingIndex = (currentSettingIndex + 1) % settingImages.length;
    if(document.getElementById('settings-btn-img')) document.getElementById('settings-btn-img').src = settingImages[currentSettingIndex];
}
function toggleSound() {
    soundEnabled = document.getElementById('sound-toggle').checked;
    const bgm = document.getElementById('bg-music');
    if (bgm) { if (soundEnabled) bgm.play().catch(()=>{}); else bgm.pause(); }
}
function startMusic() {
    if(!musicStarted && soundEnabled) {
        const bgm = document.getElementById('bg-music');
        if(bgm) { bgm.volume = 0.3; bgm.play().catch(()=>{}); }
        musicStarted = true;
    }
}
function playSound(id) {
    if (!soundEnabled) return;
    const sound = document.getElementById(id);
    if(sound) { sound.currentTime = 0; sound.volume = 0.5; sound.play().catch(()=>{}); }
}
function setGameSize(sizeType) {
    document.getElementById('game-container').className = `size-${sizeType}`;
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-sz-${sizeType}`).classList.add('active');
}

// ==========================================
// 2. BASE DE DONNÉES (UNITÉS, SORTS, VOL, CIBLAGE)
// ==========================================
// isFlying: true (Vole), targetsAir: true (Peut taper en l'air)
const cardDatabase = {
    // Unités Sol
    slime: { id: "slime", type: "troop", name: "Slime", cost: 3, hp: 600, dmg: 40, range: 4, speed: 4, atkSpeed: 1000, isFlying: false, targetsAir: false, color: "#4CAF50", img: "assets/skins/slime.png" },
    slimeuse: { id: "slimeuse", type: "troop", name: "Slimeuse", cost: 3, hp: 200, dmg: 90, range: 30, speed: 5, atkSpeed: 1000, isRanged: true, isFlying: false, targetsAir: true, color: "#8BC34A", img: "assets/skins/slimeuse.png" },
    mega: { id: "mega", type: "troop", name: "MEGA Slime", cost: 8, hp: 2500, dmg: 150, range: 5, speed: 2, atkSpeed: 2000, isFlying: false, targetsAir: false, color: "#9C27B0", img: "assets/skins/mega.png" },
    boule: { id: "boule", type: "troop", name: "La Boule", cost: 4, hp: 800, dmg: 100, range: 4, speed: 7, atkSpeed: 1500, targetBuilding: true, isFlying: false, targetsAir: false, color: "#FF9800", img: "assets/skins/boule.png" },
    
    // Unités Volantes
    helicoton: { id: "helicoton", type: "troop", name: "Hélicoton", cost: 3, hp: 300, dmg: 50, range: 20, speed: 5, atkSpeed: 900, isRanged: true, isFlying: true, targetsAir: true, color: "#fff", img: "assets/skins/helicoton.png" },
    dragon: { id: "dragon", type: "troop", name: "Dragon", cost: 4, hp: 800, dmg: 80, range: 15, speed: 4, atkSpeed: 1200, isRanged: true, isFlying: true, targetsAir: true, color: "#1e90ff", img: "assets/skins/dragon.png" },
    
    // Bâtiments
    usine: { id: "usine", type: "building", name: "Usine", cost: 4, hp: 800, lifetime: 30, spawnRate: 10000, spawnId: "slime", speed: 0, range: 0, color: "#5c4033", img: "assets/skins/usine.png" },
    canon: { id: "canon", type: "building", name: "Canon", cost: 3, hp: 900, lifetime: 40, dmg: 70, range: 35, speed: 0, atkSpeed: 1100, isRanged: true, targetsAir: true, color: "#888", img: "assets/skins/canon.png" },
    barriere: { id: "barriere", type: "building", name: "Barrière", cost: 4, hp: 1000, lifetime: 40, dmg: 20, range: 15, speed: 0, atkSpeed: 1000, stunDuration: 0.5, isRanged: true, targetsAir: false, color: "#ffd700", img: "assets/skins/barriere.png" },
    
    // Sorts
    tornade: { id: "tornade", type: "spell", name: "Tornade", cost: 3, dmg: 150, radius: 15, color: "#9E9E9E", img: "assets/skins/tornade.png" },
    boule_sort: { id: "boule_sort", type: "spell", name: "Boule Sort", cost: 2, dmg: 50, radius: 15, pushback: true, slowDuration: 3, color: "#32cd32", img: "assets/skins/boule_sort.png" },
    marais: { id: "marais", type: "spell_spawn", name: "Marais", cost: 5, duration: 10000, spawnRate: 2000, spawnId: "mini_slime", radius: 15, color: "#8A2BE2", img: "assets/skins/marais.png" },
    
    // Unités cachées (Invoquées)
    mini_slime: { id: "mini_slime", type: "troop", name: "Mini", hp: 150, dmg: 20, range: 4, speed: 5, atkSpeed: 1000, isFlying: false, targetsAir: false, color: "#8A2BE2", hidden: true }
};

let playerDeck = ["slime", "slimeuse", "helicoton", "barriere", "boule_sort", "marais"];
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
    // Affiche toutes les cartes sauf les cartes "cachées" comme le mini slime
    Object.keys(cardDatabase).filter(k => !cardDatabase[k].hidden).forEach(cardId => {
        const card = cardDatabase[cardId];
        const div = document.createElement('div');
        div.className = `card-select-item ${tempSelectedDeck.includes(cardId) ? 'selected' : ''}`;
        if(card.img) div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${card.img}')`;
        div.innerHTML = `<span style="position:absolute; top:-5px; left:-5px; background:#39ff14; color:#000; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-family:'Luckiest Guy'; border: 1px solid #000;">${card.cost}</span>
                         <span style="margin-top:auto; background:rgba(0,0,0,0.8); padding:2px; border-radius:3px; text-align:center; width:100%; font-size: 10px;">${card.name}</span>`;
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
function closeMultiMenu() {
    document.getElementById('multi-menu').style.display = 'none'; document.getElementById('main-menu').style.display = 'flex';
    if(peer) peer.destroy();
}
function hostGame() {
    document.getElementById('net-status').innerText = "Ouverture du salon " + currentCOSCode + "...";
    peer = new Peer(currentCOSCode);
    peer.on('open', () => { isHost = true; document.getElementById('net-status').innerText = "En attente d'un adversaire..."; });
    peer.on('connection', (connection) => {
        conn = connection; setupConnectionEvents();
        document.getElementById('net-status').innerText = "Connecté ! Lancement..."; setTimeout(startMultiplayerGame, 1000);
    });
}
function joinGame() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if (!code.startsWith("COS") || code.length !== 7) { document.getElementById('net-status').innerText = "Format invalide"; return; }
    document.getElementById('net-status').innerText = "Recherche de " + code + "...";
    peer = new Peer();
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
            if (data.spellType === 'spell') castSpell(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
            else if (data.spellType === 'spell_spawn') castSpellSpawn(cardDatabase[data.cardId], isHost ? 'player' : 'enemy', 100 - data.x, 100 - data.y);
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

// TIMER ET MORT SUBITE
let gameTime = 180; let slimeRate = 1.5; let slimeAcc = 0; let enemySlimeAcc = 0; let doubleSlimeActive = false;
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
    createTower('base_p', 'player', 50, 92, 3000, "Base", 80, 50);
    createTower('tower_p_l', 'player', 25, 75, 1500, "Tour", 60, 60);
    createTower('tower_p_r', 'player', 75, 75, 1500, "Tour", 60, 60);

    createTower('base_e', 'enemy', 50, 8, 3000, "Base", 80, 50);
    createTower('tower_e_l', 'enemy', 25, 25, 1500, "Tour", 60, 60);
    createTower('tower_e_r', 'enemy', 75, 25, 1500, "Tour", 60, 60);
}
function restartGame() {
    isGameOver = false; document.getElementById('game-over-overlay').style.display = 'none';
    document.querySelectorAll('.entity, .projectile, .particle, .dmg-text, .spell-puddle').forEach(e => e.remove());
    activeEntities = []; activeProjectiles = []; activeSpells = [];
    currentSlime = 5; enemySlime = 5; updateSlimeUI();
    gameTime = 180; slimeRate = 1.5; doubleSlimeActive = false; document.getElementById('game-timer').classList.remove('timer-danger');
    setupTowers();
}
function endGame(winnerTeam) {
    isGameOver = true; document.getElementById('game-over-overlay').style.display = 'flex';
    const title = document.getElementById('game-over-title');
    if (winnerTeam === 'player') { title.innerText = "VICTOIRE !"; title.style.color = "#39ff14"; } 
    else if (winnerTeam === 'enemy') { title.innerText = "DÉFAITE !"; title.style.color = "#ff3366"; }
    else { title.innerText = "ÉGALITÉ !"; title.style.color = "#fff"; }
}

function createTower(id, team, x, y, hp, name, width, height) {
    const el = document.createElement('div');
    el.className = `entity building team-${team}`;
    el.style.left = `${x}%`; el.style.top = `${y}%`; el.style.width = `${width}px`; el.style.height = `${height}px`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>${name}`;
    arena.appendChild(el);
    // Les tours tapent en l'air et au sol (targetsAir: true)
    activeEntities.push({ id: id, team: team, x: x, y: y, hp: hp, maxHp: hp, dmg: 50, range: 25, speed: 0, atkSpeed: 1000, isRanged: true, isFlying: false, targetsAir: true, targetBuilding: false, stunTimer: 0, slowTimer: 0, lastAttack: 0, element: el, hpBar: el.querySelector('.entity-hp-fill') });
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
        if(data.img) div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url('${data.img}')`;
        div.dataset.cost = data.cost; div.innerHTML = `<div class="cost">${data.cost}</div><div class="name" style="color:${data.color}">${data.name}</div>`;
        div.addEventListener('click', () => selectCard(index)); handContainer.appendChild(div);
    });
    document.getElementById('next-card').innerHTML = `<div class="cost">${cardDatabase[nextCard].cost}</div><div class="name">${cardDatabase[nextCard].name}</div>`;
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

    if (cardData.type !== 'spell' && cardData.type !== 'spell_spawn' && clickY < 50) return;

    currentSlime -= cardData.cost; updateSlimeUI(); playSound('sfx-spawn');

    if (cardData.type === 'spell') castSpell(cardData, 'player', clickX, clickY);
    else if (cardData.type === 'spell_spawn') castSpellSpawn(cardData, 'player', clickX, clickY);
    else spawnEntity(cardData, 'player', clickX, clickY);

    if (conn && conn.open) conn.send({ type: 'spawn', cardId: hand[selectedCardIndex], x: clickX, y: clickY, spellType: cardData.type });

    drawPile.push(hand[selectedCardIndex]); hand[selectedCardIndex] = nextCard; nextCard = drawPile.shift();
    selectedCardIndex = null; deployZone.style.display = 'none'; updateUI();
}

// INVOCATIONS
function spawnEntity(data, team, x, y) {
    const el = document.createElement('div');
    el.className = `entity team-${team} ${data.type === 'building' ? 'building' : ''} ${data.isFlying ? 'is-flying' : ''}`;
    el.dataset.id = data.id;
    if (data.img) el.style.backgroundImage = `url('${data.img}')`; else el.style.backgroundColor = data.color;
    
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.innerHTML = `<div class="entity-hp-container"><div class="entity-hp-fill"></div></div>${data.type === 'building' ? data.name : ''}`;
    arena.appendChild(el);

    activeEntities.push({
        id: Math.random().toString(36).substr(2, 9),
        team: team, x: x, y: y, color: data.color, hp: data.hp, maxHp: data.hp, dmg: data.dmg || 0, 
        range: data.range, speed: data.speed, atkSpeed: data.atkSpeed || 1000, 
        isRanged: data.isRanged || false, targetBuilding: data.targetBuilding || false,
        isFlying: data.isFlying || false, targetsAir: data.targetsAir || false,
        stunDuration: data.stunDuration || null, // Si c'est la barrière
        lifetime: data.lifetime || null, spawnRate: data.spawnRate || null, spawnId: data.spawnId || null, lastSpawn: 0,
        stunTimer: 0, slowTimer: 0, lastAttack: 0, element: el, hpBar: el.querySelector('.entity-hp-fill')
    });
}

function castSpell(spellData, casterTeam, targetX, targetY) {
    // Visuel
    const fx = document.createElement('div');
    fx.style.position = 'absolute'; fx.style.left = `${targetX}%`; fx.style.top = `${targetY}%`;
    fx.style.width = `${spellData.radius*4}px`; fx.style.height = `${spellData.radius*4}px`;
    fx.style.background = `radial-gradient(circle, ${spellData.color} 0%, rgba(158,158,158,0) 70%)`;
    fx.style.transform = 'translate(-50%, -50%)'; fx.style.zIndex = '10'; arena.appendChild(fx);
    setTimeout(() => fx.remove(), 800);

    const targetTeam = casterTeam === 'player' ? 'enemy' : 'player';
    
    activeEntities.forEach(ent => {
        if (ent.team === targetTeam) {
            const dx = ent.x - targetX; const dy = ent.y - targetY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < spellData.radius) {
                takeDamage(ent, spellData.dmg);
                // Si boule de slime : Ralentit et repousse (Pushback)
                if(spellData.pushback && !ent.id.includes('base') && !ent.id.includes('tower')) {
                    const angle = Math.atan2(dy, dx);
                    ent.x += Math.cos(angle) * 8; // Repoussé de 8%
                    ent.y += Math.sin(angle) * 8;
                    // Garder dans l'arène
                    ent.x = Math.max(5, Math.min(95, ent.x));
                    ent.y = Math.max(5, Math.min(95, ent.y));
                    ent.slowTimer = spellData.slowDuration; // Ralentit
                }
            }
        }
    });
}

function castSpellSpawn(spellData, casterTeam, targetX, targetY) {
    const puddle = document.createElement('div'); puddle.className = 'spell-puddle';
    puddle.style.left = `${targetX}%`; puddle.style.top = `${targetY}%`;
    puddle.style.width = `${spellData.radius * 4}px`; puddle.style.height = `${spellData.radius * 4}px`;
    arena.appendChild(puddle);
    
    activeSpells.push({
        team: casterTeam, x: targetX, y: targetY, radius: spellData.radius, duration: spellData.duration, 
        spawnRate: spellData.spawnRate, spawnId: spellData.spawnId, lastSpawn: 0, element: puddle
    });
}

function enemyAI() {
    if (isGameOver || conn) return;
    const playableCards = Object.values(cardDatabase).filter(c => c.cost <= enemySlime && !c.hidden);
    if (playableCards.length > 0 && Math.random() > 0.4) {
        const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
        enemySlime -= cardToPlay.cost;
        if(cardToPlay.type === 'spell' || cardToPlay.type === 'spell_spawn') {
            const spellFn = cardToPlay.type === 'spell' ? castSpell : castSpellSpawn;
            spellFn(cardToPlay, 'enemy', 20 + Math.random()*60, 65 + Math.random()*20); // Vise le côté joueur
        } else {
            spawnEntity(cardToPlay, 'enemy', Math.random() > 0.5 ? 25 : 75, 15);
        }
        playSound('sfx-spawn');
    }
}

// OUTILS DE COMBAT
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
    const proj = document.createElement('div'); proj.className = 'projectile'; proj.style.left = `${attacker.x}%`; proj.style.top = `${attacker.y}%`; arena.appendChild(proj);
    activeProjectiles.push({ 
        x: attacker.x, y: attacker.y, target: target, dmg: attacker.dmg, 
        team: attacker.team, stunDuration: attacker.stunDuration, // On transmet le Stun !
        element: proj, speed: 40 
    });
}

// ==========================================
// 6. BOUCLE PRINCIPALE (GAME LOOP)
// ==========================================
function gameLoop(currentTime) {
    if (isGameOver) { requestAnimationFrame(gameLoop); return; }
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // TIMER ET DOUBLE SLIME
    gameTime -= dt;
    if (gameTime <= 60 && !doubleSlimeActive) {
        doubleSlimeActive = true; slimeRate = 0.75; 
        document.getElementById('game-timer').classList.add('timer-danger');
        document.getElementById('alert-message').style.display = 'block';
    }
    if (gameTime <= 0) { endGame('tie'); return; }
    const mins = Math.floor(gameTime / 60); const secs = Math.floor(gameTime % 60);
    document.getElementById('game-timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // RÉGÉNÉRATION ÉNERGIE
    slimeAcc += dt; enemySlimeAcc += dt;
    if(slimeAcc >= slimeRate) { slimeAcc = 0; if(currentSlime < MAX_SLIME) { currentSlime++; updateSlimeUI(); updateUI(); } }
    if(enemySlimeAcc >= slimeRate && !conn) { enemySlimeAcc = 0; if(enemySlime < MAX_SLIME) enemySlime++; }

    // SORTS CONTINUS (MARAIS)
    activeSpells = activeSpells.filter(spell => {
        spell.duration -= dt * 1000; spell.lastSpawn += dt * 1000;
        if(spell.lastSpawn >= spell.spawnRate) {
            spell.lastSpawn = 0;
            const angle = Math.random() * Math.PI * 2; const dist = Math.random() * spell.radius;
            spawnEntity(cardDatabase[spell.spawnId], spell.team, spell.x + Math.cos(angle) * dist, spell.y + Math.sin(angle) * dist);
        }
        if(spell.duration <= 0) { spell.element.remove(); return false; }
        return true;
    });

    // NETTOYAGE MORTS
    activeEntities = activeEntities.filter(ent => {
        if (ent.hp <= 0) {
            playSound('sfx-die'); createParticles(ent.x, ent.y, ent.color || '#fff');
            if (ent.element) ent.element.remove();
            if(ent.id === 'base_p') endGame('enemy'); if(ent.id === 'base_e') endGame('player');
            return false;
        }
        return true;
    });

    // PROJECTILES
    activeProjectiles = activeProjectiles.filter(p => {
        if(p.target.hp <= 0) { p.element.remove(); return false; } 
        const dx = p.target.x - p.x; const dy = p.target.y - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < 2) { 
            takeDamage(p.target, p.dmg); 
            if(p.stunDuration) p.target.stunTimer = p.stunDuration; // Appliquer le STUN
            p.element.remove(); return false; 
        } 
        else {
            const angle = Math.atan2(dy, dx); p.x += Math.cos(angle) * p.speed * dt; p.y += Math.sin(angle) * p.speed * dt;
            p.element.style.left = `${p.x}%`; p.element.style.top = `${p.y}%`; return true;
        }
    });

    // UNITÉS & BÂTIMENTS
    activeEntities.forEach(unit => {
        // GESTION DU STUN (Étourdissement)
        if (unit.stunTimer > 0) {
            unit.stunTimer -= dt;
            unit.element.classList.remove('is-walking', 'is-attacking');
            unit.element.classList.add('stunned');
            return; // L'unité passe son tour
        } else {
            unit.element.classList.remove('stunned');
        }

        // GESTION DU SLOW (Ralentissement)
        let currentSpeed = unit.speed;
        let currentAtkSpeed = unit.atkSpeed;
        if (unit.slowTimer > 0) {
            unit.slowTimer -= dt;
            currentSpeed *= 0.5; // Va deux fois moins vite
            currentAtkSpeed *= 2; // Met deux fois plus de temps à taper
            unit.element.classList.add('slowed');
        } else {
            unit.element.classList.remove('slowed');
        }

        // Usine à slime
        if (unit.spawnRate) {
            unit.lastSpawn += dt * 1000;
            if (unit.lastSpawn >= unit.spawnRate) {
                unit.lastSpawn = 0; spawnEntity(cardDatabase[unit.spawnId], unit.team, unit.x, unit.y + (unit.team === 'player' ? -5 : 5));
            }
        }
        
        // Vieillerie des bâtiments
        if (unit.lifetime) {
            unit.hp -= (unit.maxHp / unit.lifetime) * dt; 
            if (unit.hpBar) unit.hpBar.style.width = `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%`;
        }

        if (unit.speed === 0 && !unit.isRanged) return; // Si bâtiment non armé, on passe

        // CIBLAGE (Prend en compte cible Air/Sol)
        let closestTarget = null; let minDistance = 999;
        activeEntities.forEach(target => {
            if (target.team !== unit.team) {
                if (target.isFlying && !unit.targetsAir) return; // Ignore l'aérien si on ne tape qu'au sol
                if (unit.targetBuilding && target.speed !== 0) return; // La boule ignore les troupes
                
                let dist = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
                if (dist < minDistance) { minDistance = dist; closestTarget = target; }
            }
        });

        if (closestTarget) {
            let distToTarget = Math.sqrt(Math.pow(unit.x - closestTarget.x, 2) + Math.pow(unit.y - closestTarget.y, 2));
            if (distToTarget <= unit.range) {
                if(unit.speed > 0) unit.element.classList.remove('is-walking');
                if (currentTime - unit.lastAttack >= currentAtkSpeed) {
                    if(unit.speed > 0) { unit.element.classList.remove('is-attacking'); void unit.element.offsetWidth; unit.element.classList.add('is-attacking'); }
                    if (unit.isRanged) shootProjectile(unit, closestTarget);
                    else takeDamage(closestTarget, unit.dmg);
                    unit.lastAttack = currentTime;
                }
            } else if (unit.speed > 0) {
                unit.element.classList.add('is-walking'); unit.element.classList.remove('is-attacking');
                let targetX = closestTarget.x; let targetY = closestTarget.y;
                
                // Ponts pour les unités AU SOL
                if (!unit.isFlying && ((unit.y > 50 && targetY < 50) || (unit.y < 50 && targetY > 50))) {
                    let targetBridgeX = (unit.x < 50) ? 25 : 75; 
                    if (Math.abs(unit.x - targetBridgeX) > 2) { targetX = targetBridgeX; targetY = unit.y; }
                }
                
                const dx = targetX - unit.x; const dy = targetY - unit.y;
                const angle = Math.atan2(dy, dx);
                unit.x += Math.cos(angle) * currentSpeed * dt * (arena.offsetHeight / arena.offsetWidth);
                unit.y += Math.sin(angle) * currentSpeed * dt;
                unit.element.style.left = `${unit.x}%`; unit.element.style.top = `${unit.y}%`;
            }
        }
    });
    requestAnimationFrame(gameLoop);
}
