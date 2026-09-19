/* =========================================
   1. MENU ET PARAMÈTRES
========================================= */
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

// Préchargement des images d'animation
animFrames.forEach(src => { const img = new Image(); img.src = src; });

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
   2. MOTEUR DE JEU (TOWER DEFENSE)
========================================= */
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
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // Plus sûr que ctx.scale()
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas); // AMÉLIORATION: Écouteur ajouté

let gold = 150, lives = 20, wave = 0, isWaveActive = false, enemiesToSpawn = [], spawnTimer = 0, gameOver = false;
let towers = [], enemies = [], projectiles = [], particles = [], empWaves = [], floatingTexts = [];
let selectedTowerType = 1, hoveredGrid = {x: -1, y: -1}, selectedTowerInstance = null;
let autoWave = false; let gameSpeed = 1; let timeAccumulator = 0; let lastTime = 0;
let skeletonsUnlocked = false; 

// AMÉLIORATION: Déblocage global de l'audio au premier clic
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.body.addEventListener('click', function unlockAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.body.removeEventListener('click', unlockAudio);
}, { once: true });

function playSound(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    // Logique audio identique à ton code original
    if (type === 'shoot_normal') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot_aoe') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.04, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } // ... Reste de tes sons (Hit, Kill, etc.)
}

const imgs = {};
const imgFiles = { 'map': 'img/map.png', 'fantassin': 'img/fantassin.png', /* ... tes images ... */ };
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
    5: { name: 'Bombardier', cost: 90, range: 120, damage: 75, cooldown: 100, skin: 'bombardier', pColor: '#fdba74', type: 'aoe' }, 
    // ... tes autres tours
};

canvas.addEventListener('mousemove', (e) => { 
    const rect = canvas.getBoundingClientRect(); 
    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;
    hoveredGrid.x = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize); 
    hoveredGrid.y = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize); 
});

canvas.addEventListener('mouseleave', () => { hoveredGrid = {x: -1, y: -1}; });

canvas.addEventListener('click', (e) => {
    if (gameOver) return; 
    
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

// --- INTERFACE JS ---
window.selectTower = (t) => { 
    selectedTowerType = t; selectedTowerInstance = null; document.getElementById('upgrade-panel').style.display = 'none'; 
    document.querySelectorAll('#tower-selection button').forEach(b => b.classList.remove('selected')); 
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
        let speedBuff = Math.round((1 - selectedTowerInstance.cdMax / towerDefs[selectedTowerInstance.tK].cooldown) * 100);
        document.getElementById('tower-stats').innerHTML = `Niveau: <span style="color:var(--text-color)">${selectedTowerInstance.level}/3</span><br>Puissance: <span style="color:var(--text-color)">${selectedTowerInstance.damage}</span><br>Portée: <span style="color:var(--text-color)">${selectedTowerInstance.range}</span><br>Vit. Attaque: <span style="color:var(--accent)">+${speedBuff}%</span>`;
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
    // Logique de spawn... (identique à ton code)
}

/* (Tes classes Enemy, Tower, FloatingText restent globalement identiques) */
// ...

class Projectile {
    // ... (constructor reste le même)
    update() {
        // ... (Logique Pierce / déplacement) ...
        
        let dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.hypot(dx, dy);
        if (dist < this.speed) { 
            let actualDmg = this.target.armorBroken ? this.dmg * 1.5 : this.dmg;

            if(this.type === 'aoe') {
                let splashRadius = 50 + (this.level * 15);
                enemies.forEach(e => { 
                    // AMÉLIORATION: Pré-test AABB pour optimiser Math.hypot sur les AoE
                    if (Math.abs(e.x - this.x) > splashRadius + e.radius) return;
                    if (Math.abs(e.y - this.y) > splashRadius + e.radius) return;

                    if(Math.hypot(e.x - this.x, e.y - this.y) <= splashRadius + e.radius) {
                        let splashDmg = e.armorBroken ? this.dmg * 1.5 : this.dmg;
                        e.hp -= splashDmg;
                        // ... (textes flottants)
                    }
                });
                playSound('hit');
            } 
            // ... reste des types d'impacts
        }
    }
}

function updateUI() { 
    document.getElementById('gold-display').innerText = gold; 
    document.getElementById('lives-display').innerText = lives; 
    if(selectedTowerInstance) updateUpgradePanel(); 
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = (timestamp - lastTime) / (1000 / 60); 
    lastTime = timestamp;
    
    // ... Logique de boucle de jeu
    requestAnimationFrame(gameLoop);
}

// Lancement
updateUI(); requestAnimationFrame(gameLoop);

/* =========================================
   3. GESTION DU SWIPE (TACTILE)
========================================= */
const gamesHubList = ["../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html"];

let touchstartX = 0; let touchstartY = 0;
let touchendX = 0; let touchendY = 0;

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    let diffX = touchendX - touchstartX;
    let diffY = touchendY - touchstartY;

    // AMÉLIORATION: Ne swipe de jeu que si le mouvement horizontal est plus grand que le mouvement vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < -swipeThreshold) navigateGames(1);
        if (diffX > swipeThreshold) navigateGames(-1);
    }
}

function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => currentPath.includes(game.split('/')[1]));
    if (currentIndex === -1) return;
    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

document.addEventListener('touchstart', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });
