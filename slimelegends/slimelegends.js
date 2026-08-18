// =========================================================
// 1. TES SCRIPTS D'INTERFACE (ANIMATION, TAILLE, SWIPE)
// =========================================================

// --- ANIMATION DU BOUTON SETTINGS ---
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if (!settingsBtnImg.src.includes('settings4.png')) { settingsBtnImg.src = '../img/setting.png'; }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
}

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('show');
}

// --- GESTION DE LA TAILLE DU JEU ---
function setGameSize(size) {
    const container = document.getElementById('game-container');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        container.classList.add('size-classic');
        document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } 
    else if (size === 'wide') {
        container.classList.add('size-wide');
        document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } 
    else if (size === 'full') {
        container.classList.add('size-full');
        document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.log(e));
        }
    }
}

function autoFullscreen() {
    if (!document.getElementById('game-container').classList.contains('size-full')) {
        setGameSize('wide');
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) {
        setGameSize('wide');
    }
});

// --- SCRIPT DE NAVIGATION PAR SWIPE ---
const gamesHubList = [
    "../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html",
    "../cyber_smash/index.html", "../guessthemanga/index.html", "../drawer/index.html",
    "../texas_poker/index.html", "../blindtest/index.html", "../2048slime/index.html",
    "../worms/index.html"
];
let touchstartX = 0; let touchendX = 0; let swipeMouseX = 0; let endSwipeMouseX = 0;

function handleSwipeGesture(start, end) {
    const swipeThreshold = 75; 
    if (end < start - swipeThreshold) navigateGames(1);
    if (end > start + swipeThreshold) navigateGames(-1);
}
function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => currentPath.includes(game.split('/')[1]));
    if (currentIndex === -1) return;
    window.location.href = gamesHubList[(currentIndex + direction + gamesHubList.length) % gamesHubList.length];
}
function isProtectedElement(e) { 
    return e.target.tagName.toLowerCase() === 'canvas' || e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input'; 
}
document.addEventListener('touchstart', e => { if (isProtectedElement(e)) return; touchstartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', e => { if (isProtectedElement(e)) return; touchendX = e.changedTouches[0].screenX; handleSwipeGesture(touchstartX, touchendX); }, { passive: true });
document.addEventListener('mousedown', e => { if (isProtectedElement(e)) return; swipeMouseX = e.screenX; });
document.addEventListener('mouseup', e => { if (isProtectedElement(e)) return; endSwipeMouseX = e.screenX; handleSwipeGesture(swipeMouseX, endSwipeMouseX); });


// =========================================================
// 2. MOTEUR DE JEU MOBA ARAM (Mécanique Flaque et Visée)
// =========================================================

const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

const MAP_WIDTH = 3500; 
const MAP_HEIGHT = 1000;

// Chargement de l'image de la carte dans assets/
const mapImg = new Image();
mapImg.src = 'assets/mapsol.png';

const PUDDLE_ZONES = [
    { yMin: 0, yMax: 250 },   // Bordure Haute
    { yMin: 750, yMax: 1000 } // Bordure Basse
];

let cameraX = 0; let cameraY = 0;
let mouseX = 0; let mouseY = 0; let worldMouseX = 0; let worldMouseY = 0;
let gameActive = false;
let players = []; let projectiles = []; let clickMarkers = [];
let locSelections = [];

let activeSpellSlot = null; 
let keyboardKeys = { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };

document.getElementById('keyboard-layout').addEventListener('change', (e) => {
    let isQwerty = e.target.value === 'qwerty';
    keyboardKeys = isQwerty ? { s1: 'q', s2: 'w', s3: 'e', ult: 'r' } : { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };
    document.getElementById('key-s1').innerText = keyboardKeys.s1.toUpperCase();
    document.getElementById('key-s2').innerText = keyboardKeys.s2.toUpperCase();
    document.getElementById('key-s3').innerText = keyboardKeys.s3.toUpperCase();
    document.getElementById('key-ult').innerText = keyboardKeys.ult.toUpperCase();
});

window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    worldMouseX = mouseX + cameraX;
    worldMouseY = mouseY + cameraY;
});

canvas.addEventListener('mousedown', e => {
    if(!gameActive || players[0].isDead) return;
    if (e.button === 0) { // Clic Gauche : Bouger
        if(activeSpellSlot) { activeSpellSlot = null; updateSpellUI(); }
        players[0].setMovementTarget(worldMouseX, worldMouseY);
        clickMarkers.push({x: worldMouseX, y: worldMouseY, life: 20});
    }
    if (e.button === 2) { // Clic Droit : Lancer sort
        if(activeSpellSlot) {
            players[0].castSpell(activeSpellSlot, worldMouseX, worldMouseY);
            activeSpellSlot = null; updateSpellUI();
        } else {
            players[0].castSpell('basic', worldMouseX, worldMouseY);
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
    if(!gameActive || players[0].isDead) return;
    let key = e.key.toLowerCase();
    if(key === keyboardKeys.s1) players[0].castSpell('s1', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s2) players[0].castSpell('s2', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s3) players[0].castSpell('s3', worldMouseX, worldMouseY);
    if(key === keyboardKeys.ult) players[0].castSpell('ult', worldMouseX, worldMouseY);
});

window.prepareSpell = function(slot) {
    if(players[0].cds[slot] === 0 && players[0].isSilenced === 0) {
        activeSpellSlot = slot; updateSpellUI();
    }
};

const charData = {
    seth: { name: "Seth", color: '#ff007f', hp: 1500, speed: 6, radius: 25 },
    teemo: { name: "Scout", color: '#39ff14', hp: 900, speed: 7, radius: 20 },
    gunner: { name: "ADC", color: '#ffbf00', hp: 850, speed: 6, radius: 22 },
    slime: { name: "Slime", color: '#00ffcc', hp: 2000, speed: 5, radius: 30 },
    mage: { name: "Mage", color: '#9d00ff', hp: 800, speed: 5.5, radius: 22 },
    ninja: { name: "Ninja", color: '#00f0ff', hp: 1000, speed: 8, radius: 22 }
};

class Player {
    constructor(id, x, y, type) {
        this.id = id; this.x = x; this.y = y; 
        this.charType = type; this.color = charData[type].color;
        this.baseSpeed = charData[type].speed; this.radius = charData[type].radius;
        this.maxHp = charData[type].hp; this.hp = this.maxHp; this.shield = 0;
        
        this.target = null; this.angle = 0;
        this.cds = { s1: 0, s2: 0, s3: 0, ult: 0, basic: 0 };
        this.maxCds = { s1: 300, s2: 420, s3: 360, ult: 1200, basic: 30 };
        
        this.stunTimer = 0; this.actionLock = 0; this.isDead = false;
        
        this.currentPuddle = -1;
        this.revealTimer = 0;
    }

    setMovementTarget(tx, ty) { this.target = { x: tx, y: ty }; }

    update() {
        if (this.isDead) return;

        for(let key in this.cds) if(this.cds[key] > 0) this.cds[key]--;
        if(this.stunTimer > 0) this.stunTimer--;
        if(this.actionLock > 0) this.actionLock--;
        if(this.revealTimer > 0) this.revealTimer--;

        if (this.target && this.stunTimer === 0 && this.actionLock === 0) {
            let dx = this.target.x - this.x; let dy = this.target.y - this.y;
            let dist = Math.hypot(dx, dy);
            this.angle = Math.atan2(dy, dx);
            if (dist > this.baseSpeed) {
                this.x += (dx / dist) * this.baseSpeed;
                this.y += (dy / dist) * this.baseSpeed;
            } else {
                this.x = this.target.x; this.y = this.target.y; this.target = null;
            }
        }

        this.x = Math.max(this.radius, Math.min(MAP_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_HEIGHT - this.radius, this.y));

        this.currentPuddle = -1;
        for (let i = 0; i < PUDDLE_ZONES.length; i++) {
            if (this.y > PUDDLE_ZONES[i].yMin && this.y < PUDDLE_ZONES[i].yMax) {
                this.currentPuddle = i; 
            }
        }
    }

    draw() {
        if (this.isDead) return;

        let alpha = 1.0;
        if (this.currentPuddle !== -1 && this.revealTimer === 0) {
            if (this.id === 1) alpha = 0.4; 
            else {
                let p1Puddle = players[0].currentPuddle;
                if (p1Puddle === this.currentPuddle) alpha = 0.5; 
                else alpha = 0.0; 
            }
        }

        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); 
        
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
        
        ctx.fillStyle = '#fff'; ctx.fillRect(this.radius - 10, -5, 15, 10);
        ctx.restore();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#222'; ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60, 8);
        ctx.fillStyle = (this.id === 1) ? '#39ff14' : '#ff007f';
        ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60 * (this.hp / this.maxHp), 8);
        
        ctx.textAlign = 'center';
        if (this.stunTimer > 0) { ctx.fillStyle = "yellow"; ctx.fillText("STUN", this.x, this.y - this.radius - 25); }
        ctx.globalAlpha = 1.0; 
    }

    castSpell(slot, targetX, targetY) {
        if(this.isDead || this.stunTimer > 0 || this.actionLock > 0 || this.cds[slot] > 0) return;
        
        this.revealTimer = 60;
        this.target = null; 
        this.angle = Math.atan2(targetY - this.y, targetX - this.x);
        let dx = Math.cos(this.angle); let dy = Math.sin(this.angle);

        if (this.charType === 'gunner') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*18, dy*18, this, 60)); this.cds.basic = 15; }
            if (slot === 'ult') { projectiles.push(new Projectile(this.x, this.y, dx*30, dy*30, this, 300, 30)); this.cds.ult = 1200; this.actionLock = 20;}
        } else if (this.charType === 'ninja') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*20, dy*20, this, 40)); this.cds.basic = 20; }
            if (slot === 's1') { this.x += dx*100; this.y += dy*100; this.cds.s1 = 120; } 
        } else {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*15, dy*15, this, 50)); this.cds.basic = 30; }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.isDead = true; checkWin(); }
    }
}

class Projectile {
    constructor(x, y, vx, vy, owner, dmg, size=10) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; 
        this.owner = owner; this.dmg = dmg; this.radius = size;
        this.active = true; this.life = 100;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.life--;
        if(this.life <= 0 || this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT) this.active = false;

        players.forEach(p => {
            if (p !== this.owner && !p.isDead && this.active) {
                if (Math.hypot(p.x - this.x, p.y - this.y) < p.radius + this.radius) {
                    p.takeDamage(this.dmg); this.active = false;
                    clickMarkers.push({x: this.x, y: this.y, life: 15, color: this.owner.color, isExplosion: true});
                }
            }
        });

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.owner.color; ctx.fill();
    }
}

function updateBot(bot) {
    if (bot.isDead || bot.stunTimer > 0) return;
    let target = players[0];
    if (target.isDead) return;

    let p1Visible = true;
    if (target.currentPuddle !== -1 && target.revealTimer === 0 && target.currentPuddle !== bot.currentPuddle) {
        p1Visible = false; 
    }

    if (p1Visible) {
        let dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        if (dist > 250) { bot.setMovementTarget(target.x, target.y); } 
        else { bot.target = null; }
        
        if (dist < 400 && bot.cds.basic === 0 && Math.random() < 0.05) {
            bot.castSpell('basic', target.x, target.y);
        }
    } else {
        bot.target = null; 
    }
}

function chooseChar(type) {
    locSelections.push(type);
    document.getElementById('instruction-title').innerText = "Adversaire (IA)";
    if (locSelections.length === 2) {
        document.getElementById('char-select').style.display = 'none';
        document.getElementById('start-local-btn').style.display = 'block';
    }
}

function startLocalGame() {
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    players = [
        new Player(1, 400, MAP_HEIGHT / 2, locSelections[0]),
        new Player(2, MAP_WIDTH - 400, MAP_HEIGHT / 2, locSelections[1])
    ];

    cameraX = players[0].x - window.innerWidth / 2;
    cameraY = players[0].y - window.innerHeight / 2;

    gameActive = true;
    resizeCanvas();
    gameLoop();
}

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);

function updateSpellUI() {
    if(players.length === 0 || players[0].isDead) return;
    let p = players[0];
    
    ['s1', 's2', 's3', 'ult'].forEach(slot => {
        let box = document.getElementById(`spell-${slot}`);
        if(activeSpellSlot === slot) box.classList.add('active'); else box.classList.remove('active');
        if(p.cds[slot] > 0) {
            box.classList.remove('ready'); box.classList.add('cooldown');
            box.innerHTML = `<span class="key-hint">${keyboardKeys[slot].toUpperCase()}</span>${Math.ceil(p.cds[slot]/60)}`;
        } else {
            box.classList.add('ready'); box.classList.remove('cooldown');
            box.innerHTML = `<span class="key-hint">${keyboardKeys[slot].toUpperCase()}</span>`;
        }
    });

    document.getElementById(`p1-hp-bar`).style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
    document.getElementById(`p1-hp-txt`).innerText = `${Math.floor(p.hp)} / ${p.maxHp}`;
}

function checkWin() {
    let alive = players.filter(p => !p.isDead);
    if(alive.length <= 1) {
        gameActive = false;
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('winner-text').innerText = alive.length === 1 ? `VICTOIRE !` : "ÉGALITÉ !";
    }
}

function gameLoop() {
    if (!gameActive) return;

    // Edge Panning Caméra
    const panSpeed = 15; const edgeSize = 50;
    if (mouseX < edgeSize) cameraX -= panSpeed;
    if (mouseX > window.innerWidth - edgeSize) cameraX += panSpeed;
    if (mouseY < edgeSize) cameraY -= panSpeed;
    if (mouseY > window.innerHeight - edgeSize) cameraY += panSpeed;

    cameraX = Math.max(0, Math.min(MAP_WIDTH - window.innerWidth, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT - window.innerHeight, cameraY));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-cameraX, -cameraY);

    if (mapImg.complete) {
        ctx.drawImage(mapImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    } else {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }

    for (let i = clickMarkers.length - 1; i >= 0; i--) {
        let m = clickMarkers[i]; ctx.beginPath(); ctx.arc(m.x, m.y, 30 - m.life, 0, Math.PI*2);
        ctx.strokeStyle = m.isExplosion ? m.color : `rgba(0, 255, 0, ${m.life / 20})`; ctx.lineWidth = 2; ctx.stroke();
        m.life--; if (m.life <= 0) clickMarkers.splice(i, 1);
    }

    players[0].update(); updateBot(players[1]); players[1].update();
    players.forEach(p => p.draw());

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(); if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    if(activeSpellSlot && !players[0].isDead) {
        ctx.beginPath(); ctx.moveTo(players[0].x, players[0].y); ctx.lineTo(worldMouseX, worldMouseY);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.restore(); updateSpellUI(); requestAnimationFrame(gameLoop);
}
