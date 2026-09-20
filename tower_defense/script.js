/* =========================================
   1. MENU ET PARAMÈTRES
========================================= */
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0; settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if (!settingsBtnImg.src.includes('settings4.png')) settingsBtnImg.src = '../img/setting.png';
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    settingsBtnImg.src = '../img/settings4.png'; toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
}

function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }

function setGameSize(size) {
    const container = document.getElementById('game-container');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));
    
    if (size === 'classic') {
        document.getElementById('btn-sz-classic').classList.add('active');
        container.style.transform = 'scale(0.8)';
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        document.getElementById('btn-sz-wide').classList.add('active');
        container.style.transform = 'scale(1.1)'; 
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        document.getElementById('btn-sz-full').classList.add('active');
        container.style.transform = 'scale(1.35)';
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
}

document.addEventListener("DOMContentLoaded", () => { setGameSize('wide'); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) setGameSize('wide'); });

/* =========================================
   2. VARIABLES GLOBALES ET SETUP
========================================= */
let isGameStarted = false; 
let shakeAmount = 0;       

const targetModes = ['first', 'closest', 'strongest'];
const targetModeNames = {'first': 'Premier', 'closest': 'Plus Proche', 'strongest': 'Plus Fort'};

const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d'); 

const logicalWidth = 600;
const logicalHeight = 450;
const tileSize = 30; 
const cols = 20; 
const rows = 15;

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * ratio;
    canvas.height = logicalHeight * ratio;
    canvas.style.width = logicalWidth + "px";
    canvas.style.height = logicalHeight + "px";
    ctx.scale(ratio, ratio);
}
resizeCanvas();

let gold = 150, lives = 20, wave = 0, isWaveActive = false, enemiesToSpawn = [], spawnTimer = 0, gameOver = false;
let towers = [], enemies = [], projectiles = [], particles = [], empWaves = [], floatingTexts = [];
let selectedTowerType = 1, hoveredGrid = {x: -1, y: -1}, selectedTowerInstance = null;
let autoWave = false; let gameSpeed = 1; let timeAccumulator = 0; let lastTime = 0;
let skeletonsUnlocked = false; 

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'shoot_normal') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot_ricochet') { 
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot_armor') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'shoot_sniper') { 
        osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'shoot_aoe') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.04, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'shoot_poison') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.linearRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'hit') { 
        osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        gain.gain.setValueAtTime(0.008, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'kill') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'base_damage') { 
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'game_over') { 
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now); osc.stop(now + 1.5);
    } else if (type === 'ui_buy') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'ui_upgrade') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'ui_sell') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }
}

const imgs = {};
const imgFiles = {
    'map': 'img/map.png', 'fantassin': 'img/fantassin.png', 'tirreur': 'img/tirreur.png', 
    'blindé': 'img/blindé.png', 'sniper': 'img/sniper.png', 'bombardier': 'img/bombardier.png', 'alchimiste': 'img/alchimiste.png',
    'gobelin': 'img/gobelin.png', 'squelette': 'img/squelette.png', 'boss1': 'img/boss1.png', 'boss2': 'img/boss2.png'
};
Object.keys(imgFiles).forEach(k => { imgs[k] = new Image(); imgs[k].src = imgFiles[k]; });

const pathCoords = [
    {x: 0, y: 2}, {x: 4, y: 2}, {x: 4, y: 10}, {x: 10, y: 10},
    {x: 10, y: 4}, {x: 16, y: 4}, {x: 16, y: 12}, {x: 19, y: 12}
];

let mapGrid = Array(cols).fill().map(() => Array(rows).fill(0));
for(let i=0; i<pathCoords.length-1; i++) {
    let p1 = pathCoords[i], p2 = pathCoords[i+1];
    let x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
    let y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
    for(let x=x1; x<=x2; x++) {
        for(let y=y1; y<=y2; y++) { mapGrid[x][y] = 1; }
    }
}

const towerDefs = { 
    1: { name: 'Fantassin', cost: 20, range: 90, damage: 15, cooldown: 25, skin: 'fantassin', pColor: '#60a5fa', type: 'normal' }, 
    2: { name: 'Tireur', cost: 60, range: 100, damage: 20, cooldown: 40, skin: 'tirreur', pColor: '#fde047', type: 'ricochet' }, 
    3: { name: 'Blindé', cost: 120, range: 100, damage: 25, cooldown: 80, skin: 'blindé', pColor: '#a7f3d0', type: 'armorBreak' },
    4: { name: 'Sniper', cost: 100, range: 250, damage: 80, cooldown: 90, skin: 'sniper', pColor: '#fca5a5', type: 'pierce' },
    5: { name: 'Bombardier', cost: 90, range: 120, damage: 75, cooldown: 100, skin: 'bombardier', pColor: '#fdba74', type: 'aoe' }, 
    6: { name: 'Alchimiste', cost: 80, range: 110, damage: 15, cooldown: 60, skin: 'alchimiste', pColor: '#6ee7b7', type: 'poison' } 
};

/* =========================================
   3. GESTION SOURIS & UI
========================================= */
canvas.addEventListener('mousemove', (e) => { 
    const rect = canvas.getBoundingClientRect(); 
    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;
    hoveredGrid.x = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize); 
    hoveredGrid.y = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize); 
});

canvas.addEventListener('mouseleave', () => { hoveredGrid = {x: -1, y: -1}; });

canvas.addEventListener('click', (e) => {
    if (!isGameStarted || gameOver) return; 
    
    const rect = canvas.getBoundingClientRect(); 
    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;
    const hx = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize); 
    const hy = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize);
    
    const clickedTower = towers.find(t => Math.floor(t.x/tileSize) === hx && Math.floor(t.y/tileSize) === hy);
    
    if (clickedTower) { 
        selectedTowerInstance = clickedTower; 
        updateUpgradePanel(); 
        return; 
    }
    
    if (selectedTowerInstance) {
        selectedTowerInstance = null; 
        document.getElementById('upgrade-panel').style.display = 'none';
        return; 
    }
    
    if (hx < 0 || hx >= cols || hy < 0 || hy >= rows) return;
    if (mapGrid[hx][hy] === 1) { return; } 
    
    const def = towerDefs[selectedTowerType];
    if (gold >= def.cost) {
        gold -= def.cost; 
        towers.push(new Tower(hx, hy, selectedTowerType)); 
        playSound('ui_buy');
        updateUI();
    }
});

window.startGame = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isGameStarted = true;
    document.getElementById('start-screen').style.opacity = '0';
    setTimeout(() => document.getElementById('start-screen').style.display = 'none', 500);
};

window.cycleTargeting = () => {
    if (selectedTowerInstance) {
        let idx = targetModes.indexOf(selectedTowerInstance.targetMode);
        selectedTowerInstance.targetMode = targetModes[(idx + 1) % targetModes.length];
        document.getElementById('btn-target').innerText = "Cible: " + targetModeNames[selectedTowerInstance.targetMode];
        playSound('ui_upgrade'); 
    }
};

window.selectTower = (t) => { 
    selectedTowerType = t; selectedTowerInstance = null; document.getElementById('upgrade-panel').style.display = 'none'; 
    [1,2,3,4,5,6].forEach(id => document.getElementById(`btn-tower-${id}`).classList.remove('selected')); 
    document.getElementById(`btn-tower-${t}`).classList.add('selected'); 
};

window.upgradeSelectedTower = () => { 
    if (selectedTowerInstance && selectedTowerInstance.level < 3 && gold >= selectedTowerInstance.upgradeCost) { 
        gold -= selectedTowerInstance.upgradeCost; 
        selectedTowerInstance.upgrade(); 
        playSound('ui_upgrade');
        updateUI(); updateUpgradePanel(); 
    } 
};

window.sellSelectedTower = () => { 
    if (selectedTowerInstance) { 
        gold += Math.floor(selectedTowerInstance.totalValue * 0.6); towers = towers.filter(t => t !== selectedTowerInstance); 
        selectedTowerInstance = null; document.getElementById('upgrade-panel').style.display = 'none'; 
        playSound('ui_sell');
        updateUI(); 
    } 
};

function updateUpgradePanel() {
    const panel = document.getElementById('upgrade-panel');
    if (selectedTowerInstance) {
        panel.style.display = 'flex'; 
        document.getElementById('tower-name-display').innerText = selectedTowerInstance.name;
        document.getElementById('btn-target').innerText = "Cible: " + targetModeNames[selectedTowerInstance.targetMode];
        
        let speedBuff = Math.round((1 - selectedTowerInstance.cdMax / towerDefs[selectedTowerInstance.tK].cooldown) * 100);
        
        document.getElementById('tower-stats').innerHTML = `Niveau: <span style="color:#fff">${selectedTowerInstance.level}/3</span><br>Puissance: <span style="color:#fff">${selectedTowerInstance.damage}</span><br>Portée: <span style="color:#fff">${selectedTowerInstance.range}</span><br>Vit. Attaque: <span style="color:#39ff14">+${speedBuff}%</span>`;
        const btn = document.getElementById('btn-upgrade');
        if (selectedTowerInstance.level < 3) { btn.innerText = `Optimiser (${selectedTowerInstance.upgradeCost} ⚡)`; btn.disabled = gold < selectedTowerInstance.upgradeCost; } 
        else { btn.innerText = "MAX"; btn.disabled = true; }
    }
}

window.toggleAuto = () => { autoWave = !autoWave; document.getElementById('btn-auto').innerText = "Auto-Scan: " + (autoWave ? "ON" : "OFF"); document.getElementById('btn-auto').style.background = autoWave ? "var(--accent)" : "#4b5563"; if(autoWave && !isWaveActive && !gameOver) startWave(); };
window.toggleSpeed = () => {
    if (gameSpeed === 1) { gameSpeed = 1.5; document.getElementById('btn-speed').innerText = "Vitesse: x1.5"; document.getElementById('btn-speed').style.background = "#f59e0b"; }
    else if (gameSpeed === 1.5) { gameSpeed = 2; document.getElementById('btn-speed').innerText = "Vitesse: x2"; document.getElementById('btn-speed').style.background = "var(--danger)"; }
    else { gameSpeed = 1; document.getElementById('btn-speed').innerText = "Vitesse: x1"; document.getElementById('btn-speed').style.background = "#3b82f6"; }
};

window.startWave = () => { 
    if (!isWaveActive) { 
        wave++; document.getElementById('wave-display').innerText = wave; 
        generateWaveQueue(); 
        isWaveActive = true; document.getElementById('btn-wave').disabled = true; document.getElementById('btn-wave').innerText = "Analyse..."; 
    } 
};

function generateWaveQueue() { 
    enemiesToSpawn = []; 
    if (wave % 5 === 0) {
        if (wave % 10 === 5) enemiesToSpawn.push('boss1');
        else enemiesToSpawn.push('boss2');
        for(let i=0; i<Math.floor(wave/2); i++) enemiesToSpawn.push('squelette'); 
        return;
    }

    let count = 10 + (wave * 3); 
    for(let i=0; i<count; i++) { 
        if (skeletonsUnlocked && Math.random() > 0.6) enemiesToSpawn.push('squelette'); 
        else enemiesToSpawn.push('gobelin'); 
    } 
}

/* =========================================
   4. CLASSES DU JEU
========================================= */
class FloatingText {
    constructor(x, y, text, color, isCrit = false) {
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y - 10;
        this.text = text;
        this.color = color;
        this.life = 30;
        this.maxLife = 30;
        this.size = isCrit ? 20 : 14;
    }
    update() {
        this.y -= 0.8;
        this.life--;
        return this.life <= 0;
    }
    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px 'Segoe UI'`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

class Enemy {
    constructor(type, currentWave) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; 
        this.skin = type; 
        
        let hpScale = Math.pow(1.2, currentWave); 
        let baseHp = 30 + (currentWave * 20); 
        
        if(type === 'gobelin') { this.maxHp = baseHp * hpScale; this.speed = 1.3 + (currentWave*0.01); this.radius = 12; this.rew = 5; }
        if(type === 'squelette') { this.maxHp = baseHp * hpScale * 2.5; this.speed = 0.9 + (currentWave*0.01); this.radius = 15; this.rew = 12; }
        if(type === 'boss1') { this.maxHp = baseHp * hpScale * 15; this.speed = 0.6; this.radius = 25; this.rew = 500; this.abilityTimer = 0;} 
        if(type === 'boss2') { this.maxHp = baseHp * hpScale * 20; this.speed = 0.5; this.radius = 25; this.rew = 500; this.abilityTimer = 0;} 
        
        this.hp = this.maxHp; 
        this.debuffs = {}; this.armorBroken = false;
        
        this.path = pathCoords.map(p => ({ x: p.x * tileSize + tileSize/2, y: p.y * tileSize + tileSize/2 }));
        this.wpIndex = 1; 
        this.x = this.path[0].x; this.y = this.path[0].y;
    }
    
    applyDebuff(name, duration, power) { this.debuffs[name] = { timer: duration, power: power }; }

    draw() {
        let target = this.path[this.wpIndex] || this.path[this.path.length-1];
        let angle = Math.atan2(target.y - this.y, target.x - this.x);

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Animation de pulsation (Squish Slimesque)
        let squish = 1 + Math.sin(Date.now() / 150 + this.id.charCodeAt(0)) * 0.12;
        ctx.scale(1 / squish, squish);

        if (this.debuffs['slow'] || this.debuffs['armorBreak'] || this.debuffs['poison']) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, 0, Math.PI*2); 
            if (this.debuffs['poison']) ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            else if (this.debuffs['armorBreak']) ctx.fillStyle = 'rgba(99, 102, 241, 0.4)'; 
            else ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.fill();
        }

        ctx.rotate(angle);
        let img = imgs[this.skin];
        if (img && img.complete) {
            ctx.drawImage(img, -this.radius*1.5, -this.radius*1.5, this.radius*3, this.radius*3);
        } else {
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); 
            ctx.fillStyle = (this.type.includes('boss')) ? '#fff' : '#ef4444'; ctx.fill();
        }
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(this.x - 15, this.y - this.radius - 12, 30, 4); 
        ctx.fillStyle = (this.type.includes('boss')) ? '#f1c40f' : '#10b981'; ctx.fillRect(this.x - 15, this.y - this.radius - 12, 30 * (this.hp / this.maxHp), 4);
    }
    
    update() {
        let speedMult = 1; this.armorBroken = false;
        
        if (this.debuffs['slow']) { speedMult = this.debuffs['slow'].power; this.debuffs['slow'].timer--; if(this.debuffs['slow'].timer <= 0) delete this.debuffs['slow']; }
        if (this.debuffs['poison']) {
            if (this.debuffs['poison'].timer % 30 === 0) {
                this.hp -= this.debuffs['poison'].power; 
                particles.push({x: this.x, y: this.y, vx: 0, vy: -1, life: 10, color: '#10b981'});
                floatingTexts.push(new FloatingText(this.x, this.y, Math.floor(this.debuffs['poison'].power), '#10b981', false));
            }
            this.debuffs['poison'].timer--; if(this.debuffs['poison'].timer <= 0) delete this.debuffs['poison'];
        }
        if (this.debuffs['armorBreak']) { this.armorBroken = true; this.debuffs['armorBreak'].timer--; if(this.debuffs['armorBreak'].timer <= 0) delete this.debuffs['armorBreak']; }

        if (this.type === 'boss1') {
            this.abilityTimer++;
            if (this.abilityTimer >= 150) { 
                this.abilityTimer = 0;
                let minion = new Enemy('gobelin', wave);
                minion.x = this.x; minion.y = this.y; minion.wpIndex = this.wpIndex;
                enemies.push(minion);
            }
        }
        if (this.type === 'boss2') {
            this.abilityTimer++;
            if (this.abilityTimer >= 180) { 
                this.abilityTimer = 0;
                let activeTowers = towers.filter(t => t.disabledTimer <= 0);
                if(activeTowers.length > 0) {
                    let targetTower = activeTowers[Math.floor(Math.random() * activeTowers.length)];
                    targetTower.disabledTimer = 180; 
                    empWaves.push({x1: this.x, y1: this.y, x2: targetTower.x, y2: targetTower.y, life: 20});
                }
            }
        }

        let target = this.path[this.wpIndex];
        if(!target) return "reached_end"; 
        
        let dx = target.x - this.x; let dy = target.y - this.y; 
        let dist = Math.hypot(dx, dy); let cSpd = this.speed * speedMult;
        
        if (dist < cSpd) { 
            this.x = target.x; this.y = target.y; this.wpIndex++; 
            if (this.wpIndex >= this.path.length) return "reached_end"; 
        } 
        else { this.x += (dx / dist) * cSpd; this.y += (dy / dist) * cSpd; } 
        return "alive";
    }
}

class Tower {
    constructor(gx, gy, tK) {
        this.x = gx * tileSize + tileSize / 2; this.y = gy * tileSize + tileSize / 2; 
        this.tK = tK; let def = towerDefs[tK];
        this.name = def.name; this.skin = def.skin;
        this.dType = def.type; this.range = def.range; this.damage = def.damage; this.cdMax = def.cooldown; this.cd = 0;
        this.pColor = def.pColor; this.angle = 0; this.level = 1; this.baseCost = def.cost; 
        this.upgradeCost = Math.floor(def.cost * 1.5); this.totalValue = def.cost;
        this.disabledTimer = 0; 
        this.targetMode = 'first'; // Par défaut
    }
    
    upgrade() { 
        this.level++; 
        this.totalValue += this.upgradeCost; 
        this.damage = Math.floor(this.damage * 2.2); 
        if (this.dType !== 'ricochet') this.range += 25; 
        this.cdMax = Math.max(5, Math.floor(this.cdMax * 0.8)); 
        this.upgradeCost = Math.floor(this.upgradeCost * 1.6); 
    }
    
    draw() {
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(this.x - 14, this.y - 14, 28, 28);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        let img = imgs[this.skin];
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, -18, -18, 36, 36);
        } else {
            ctx.fillStyle = '#555'; ctx.fillRect(-10, -10, 20, 20);
        }

        ctx.restore();

        ctx.fillStyle = 'white'; for(let i=0; i<this.level; i++) ctx.fillRect(this.x - 6 + (i*5), this.y + 14, 3, 3);
        
        if (this.disabledTimer > 0) {
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'; ctx.fill(); 
            ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.stroke();
        }
    }
    
    update() {
        if (this.disabledTimer > 0) { this.disabledTimer--; return; }
        if (this.cd > 0) this.cd--; 
        
        let target = null;
        let bestVal = (this.targetMode === 'closest') ? Infinity : -Infinity;

        for (let e of enemies) { 
            let d = Math.hypot(e.x - this.x, e.y - this.y); 
            if (d <= this.range) {
                if (this.targetMode === 'closest') {
                    if (d < bestVal) { bestVal = d; target = e; }
                } 
                else if (this.targetMode === 'strongest') {
                    if (e.hp > bestVal) { bestVal = e.hp; target = e; }
                } 
                else { 
                    // 'first' - On estime la progression globale
                    let nextWp = Math.min(e.wpIndex, e.path.length - 1);
                    let distToNextWp = Math.hypot(e.path[nextWp].x - e.x, e.path[nextWp].y - e.y);
                    let progress = (e.wpIndex * 1000) - distToNextWp;
                    if (progress > bestVal) { bestVal = progress; target = e; }
                }
            } 
        }

        if (target) {
            let targetAngle = Math.atan2(target.y - this.y, target.x - this.x); 
            let diff = targetAngle - this.angle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff)); 
            this.angle += diff * 0.2; 

            let barrelX = this.x + Math.cos(this.angle) * 15;
            let barrelY = this.y + Math.sin(this.angle) * 15;

            if (this.cd <= 0 && Math.abs(diff) < 0.5) { 
                const soundMap = {1: 'shoot_normal', 2: 'shoot_ricochet', 3: 'shoot_armor', 4: 'shoot_sniper', 5: 'shoot_aoe', 6: 'shoot_poison'};
                playSound(soundMap[this.tK]);

                if (this.dType === 'pierce') {
                    projectiles.push(new Projectile(barrelX, barrelY, target, this.damage, this.pColor, this.dType, this.level, this.angle, this.range)); 
                } else {
                    let bounces = this.dType === 'ricochet' ? 1 + this.level : 0;
                    projectiles.push(new Projectile(barrelX, barrelY, target, this.damage, this.pColor, this.dType, this.level, 0, 0, bounces)); 
                }
                this.cd = this.cdMax; 
            }
        }
    }
}

class Projectile {
    constructor(x, y, target, dmg, color, type, level, angle = 0, range = 0, bounces = 0) { 
        this.x = x; this.y = y; this.target = target; this.dmg = dmg; this.color = color; this.type = type; 
        this.level = level; this.bounces = bounces;
        
        if (this.type === 'pierce') {
            this.speed = 25; this.angle = angle; this.maxDist = range; this.distTraveled = 0; this.hitSet = new Set(); 
        } else {
            this.speed = (type === 'aoe') ? 6 : 12; 
        }
    }
    
    draw() { 
        ctx.beginPath(); ctx.arc(this.x, this.y, (this.type==='aoe') ? 6 : 4, 0, Math.PI * 2); 
        ctx.fillStyle = this.color; ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fill(); ctx.shadowBlur = 0; 
    }
    
    update() {
        if (this.type === 'pierce') {
            this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; this.distTraveled += this.speed;
            enemies.forEach(e => {
                if (!this.hitSet.has(e.id) && Math.hypot(e.x - this.x, e.y - this.y) < e.radius + 8) {
                    this.hitSet.add(e.id);
                    let actualDmg = e.armorBroken ? this.dmg * 1.5 : this.dmg;
                    e.hp -= actualDmg;
                    playSound('hit');
                    floatingTexts.push(new FloatingText(e.x, e.y, Math.floor(actualDmg), this.color, e.armorBroken));
                    particles.push({x: this.x, y: this.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 10, color: this.color});
                }
            });
            return this.distTraveled > this.maxDist; 
        }
        
        if (!this.target || this.target.hp <= 0) return true; 

        let dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.hypot(dx, dy);
        if (dist < this.speed) { 
            let actualDmg = this.target.armorBroken ? this.dmg * 1.5 : this.dmg;

            if(this.type === 'aoe') {
                let splashRadius = 50 + (this.level * 15);
                enemies.forEach(e => { 
                    if(Math.hypot(e.x - this.x, e.y - this.y) <= splashRadius) {
                        let splashDmg = e.armorBroken ? this.dmg * 1.5 : this.dmg;
                        e.hp -= splashDmg;
                        floatingTexts.push(new FloatingText(e.x, e.y, Math.floor(splashDmg), this.color, e.armorBroken));
                    }
                });
                ctx.beginPath(); ctx.arc(this.x, this.y, splashRadius, 0, Math.PI*2); ctx.fillStyle = 'rgba(249, 115, 22, 0.3)'; ctx.fill();
                playSound('hit');
            } 
            else if (this.type === 'poison') {
                this.target.hp -= actualDmg;
                floatingTexts.push(new FloatingText(this.target.x, this.target.y, Math.floor(actualDmg), this.color, this.target.armorBroken));
                this.target.applyDebuff('poison', 150, this.level * 8); 
                this.target.applyDebuff('slow', 60, 0.5);
                playSound('hit');
            }
            else if (this.type === 'armorBreak') {
                this.target.hp -= actualDmg;
                floatingTexts.push(new FloatingText(this.target.x, this.target.y, Math.floor(actualDmg), this.color, this.target.armorBroken));
                this.target.applyDebuff('armorBreak', 120, 1.5); 
                this.target.applyDebuff('slow', 60, 0.7); 
                playSound('hit');
            }
            else if (this.type === 'ricochet') {
                this.target.hp -= actualDmg;
                floatingTexts.push(new FloatingText(this.target.x, this.target.y, Math.floor(actualDmg), this.color, this.target.armorBroken));
                playSound('hit');
                if (this.bounces > 0) {
                    let nextTarget = null; let minD = 150;
                    for(let e of enemies) {
                        if (e.id !== this.target.id && e.hp > 0) {
                            let d = Math.hypot(e.x - this.target.x, e.y - this.target.y);
                            if (d < minD) { minD = d; nextTarget = e; }
                        }
                    }
                    if (nextTarget) { projectiles.push(new Projectile(this.target.x, this.target.y, nextTarget, this.dmg * 0.8, this.color, 'ricochet', this.level, 0, 0, this.bounces - 1)); }
                }
            }
            else { 
                this.target.hp -= actualDmg; 
                floatingTexts.push(new FloatingText(this.target.x, this.target.y, Math.floor(actualDmg), this.color, this.target.armorBroken));
                playSound('hit');
            }
            
            for(let i=0; i<6; i++) particles.push({x: this.x, y: this.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 15, color: this.color}); 
            return true; 
        } 
        else { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; return false; }
    }
}

/* =========================================
   5. RENDU ET BOUCLE PRINCIPALE
========================================= */
function updateUI() { 
    document.getElementById('gold-display').innerText = gold; 
    document.getElementById('lives-display').innerText = lives; 
    [1,2,3,4,5,6].forEach(i => document.getElementById(`btn-tower-${i}`).disabled = gold < towerDefs[i].cost); 
    if(selectedTowerInstance) updateUpgradePanel(); 
}

function drawMapAndHover() {
    if (imgs['map'].complete && imgs['map'].naturalWidth !== 0) {
        ctx.drawImage(imgs['map'], 0, 0, logicalWidth, logicalHeight);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for(let x=0; x<logicalWidth; x+=tileSize) { ctx.fillRect(x, 0, 1, logicalHeight); }
    for(let y=0; y<logicalHeight; y+=tileSize) { ctx.fillRect(0, y, logicalWidth, 1); }

    ctx.fillStyle = 'rgba(40, 50, 70, 0.4)';
    for(let x=0; x<cols; x++) {
        for(let y=0; y<rows; y++) {
            if (mapGrid[x][y] === 1) ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }

    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'; ctx.fillRect(0, 2 * tileSize, tileSize, tileSize);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; ctx.fillRect(19 * tileSize, 12 * tileSize, tileSize, tileSize);
    
    if (selectedTowerInstance) { 
        ctx.beginPath(); ctx.arc(selectedTowerInstance.x, selectedTowerInstance.y, selectedTowerInstance.range, 0, Math.PI*2); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.stroke(); 
    }
    
    if (hoveredGrid.x >= 0 && !selectedTowerInstance) {
        const hx = hoveredGrid.x; const hy = hoveredGrid.y;
        let occupied = towers.some(t => Math.floor(t.x/tileSize) === hx && Math.floor(t.y/tileSize) === hy);
        let forbidden = (hx < 0 || hx >= cols || hy < 0 || hy >= rows || mapGrid[hx][hy] === 1);
        
        let hoveredTower = towers.find(t => Math.floor(t.x/tileSize) === hx && Math.floor(t.y/tileSize) === hy);
        if (hoveredTower) {
            ctx.beginPath(); 
            ctx.arc(hoveredTower.x, hoveredTower.y, hoveredTower.range, 0, Math.PI*2); 
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fill(); 
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.stroke();
        } else {
            ctx.fillStyle = (forbidden || occupied) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'; 
            ctx.fillRect(hx * tileSize, hy * tileSize, tileSize, tileSize);
            
            if (!forbidden && !occupied) { 
                ctx.beginPath(); ctx.arc(hx * tileSize + tileSize/2, hy * tileSize + tileSize/2, towerDefs[selectedTowerType].range, 0, Math.PI*2); 
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.stroke(); 
            }
        }
    }
}

function updateLogic() {
    if (isWaveActive) {
        spawnTimer++; 
        if (spawnTimer >= 45 && enemiesToSpawn.length > 0) { 
            enemies.push(new Enemy(enemiesToSpawn.shift(), wave)); spawnTimer = 0; 
        }
        if (enemiesToSpawn.length === 0 && enemies.length === 0) {
            isWaveActive = false; const btn = document.getElementById('btn-wave'); btn.disabled = false;
            btn.innerText = "Démarrer Scan !"; 
            gold += 50 + (wave * 15); 
            if (autoWave && !gameOver) setTimeout(() => { if(!isWaveActive && !gameOver) startWave(); }, 1500);
        }
    }
    towers.forEach(t => { t.update(); });
    for (let i = projectiles.length - 1; i >= 0; i--) { if (projectiles[i].update()) projectiles.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) particles.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { if (floatingTexts[i].update()) floatingTexts.splice(i, 1); }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i], status = e.update();
        if (status === "reached_end") { 
            shakeAmount = 15; // DÉCLENCHE LE SCREEN SHAKE
            lives -= (e.type.includes('boss')? 10 : 1); enemies.splice(i, 1); 
            playSound('base_damage');
            if (lives <= 0) { 
                gameOver = true; document.getElementById('game-over').style.display = 'block'; 
                document.getElementById('survive-message').innerText = `Vous avez survécu jusqu'à l'Anomalie ${wave}.`;
                playSound('game_over');
            } 
        } 
        else if (e.hp <= 0) { 
            gold += e.rew; 
            if (e.type === 'boss1') skeletonsUnlocked = true; 
            enemies.splice(i, 1); 
            playSound('kill');
        } 
    }
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = (timestamp - lastTime) / (1000 / 60); 
    lastTime = timestamp;
    if (deltaTime > 5) deltaTime = 5; 

    // On exécute la logique du jeu UNIQUEMENT si le jeu est lancé
    if (isGameStarted && !gameOver) {
        timeAccumulator += gameSpeed * deltaTime;
        while(timeAccumulator >= 1 && !gameOver) {
            updateLogic();
            timeAccumulator -= 1;
        }
    }

    // --- LE RENDU GRAPHIQUE SE FAIT TOUJOURS (Même sur l'écran d'accueil) ---
    ctx.clearRect(0, 0, logicalWidth, logicalHeight); 
    
    // APPLICATION DU SCREEN SHAKE
    ctx.save();
    if (shakeAmount > 0) {
        let dx = (Math.random() - 0.5) * shakeAmount;
        let dy = (Math.random() - 0.5) * shakeAmount;
        ctx.translate(dx, dy);
        shakeAmount *= 0.85; // Amortissement
        if (shakeAmount < 0.5) shakeAmount = 0;
    }

    drawMapAndHover();
    
    for (let i = empWaves.length - 1; i >= 0; i--) {
        let w = empWaves[i];
        ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${w.life/20})`; ctx.lineWidth = 3; ctx.stroke();
        w.life--; if(w.life <= 0) empWaves.splice(i, 1);
    }

    towers.forEach(t => t.draw());
    projectiles.forEach(p => p.draw());
    particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / 15); ctx.fillRect(p.x, p.y, 3, 3); ctx.globalAlpha = 1; });
    enemies.forEach(e => e.draw());
    floatingTexts.forEach(ft => ft.draw());
    
    ctx.restore(); // Fin du Screen Shake

    updateUI(); 
    requestAnimationFrame(gameLoop);
}

updateUI(); requestAnimationFrame(gameLoop);

/* =========================================
   6. GESTION DU SWIPE (TACTILE)
========================================= */
const gamesHubList = [
    "../cybertank/index.html",
    "../tower_defense/index.html",
    "../edgeofwar/index.html",
    "../cyber_smash/index.html",
    "../guessthemanga/index.html",
    "../drawer/index.html",
    "../texas_poker/index.html"
];

let touchstartX = 0;
let touchendX = 0;

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    if (touchendX < touchstartX - swipeThreshold) navigateGames(1);
    if (touchendX > touchstartX + swipeThreshold) navigateGames(-1);
}

function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => {
        let folderName = game.split('/')[1]; 
        return currentPath.includes(folderName);
    });
    if (currentIndex === -1) return;

    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

document.addEventListener('touchstart', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, { passive: true });
