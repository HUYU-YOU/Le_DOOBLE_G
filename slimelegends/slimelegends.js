const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

// --- DIMENSIONS ARAM DE TA MAP ---
const MAP_WIDTH = 3500; 
const MAP_HEIGHT = 1000;

// Chargement de l'image de la carte (celle que tu m'as fournie)
const mapImg = new Image();
mapImg.src = 'img/image_68bdea.jpg';

// Définition des "Flaques" (Zones de furtivité)
// Approximativement les bords haut et bas de l'image
const PUDDLE_ZONES = [
    { yMin: 0, yMax: 250 },   // Bordure Haute
    { yMin: 750, yMax: 1000 } // Bordure Basse
];

let cameraX = 0; let cameraY = 0;
let mouseX = 0; let mouseY = 0; let worldMouseX = 0; let worldMouseY = 0;

let gameActive = false;
let players = []; let projectiles = []; let clickMarkers = [];
let locSelections = [];

// --- REGLAGES ET CLAVIER ---
let activeSpellSlot = null; 
let keyboardKeys = { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

document.getElementById('keyboard-layout').addEventListener('change', (e) => {
    let isQwerty = e.target.value === 'qwerty';
    keyboardKeys = isQwerty ? { s1: 'q', s2: 'w', s3: 'e', ult: 'r' } : { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };
    document.getElementById('key-s1').innerText = keyboardKeys.s1.toUpperCase();
    document.getElementById('key-s2').innerText = keyboardKeys.s2.toUpperCase();
    document.getElementById('key-s3').innerText = keyboardKeys.s3.toUpperCase();
    document.getElementById('key-ult').innerText = keyboardKeys.ult.toUpperCase();
});

// --- SOURIS ET CAMÉRA ---
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

// --- CLASSES ET MECANIQUES MOBA ---
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
        
        // Furtivité (Flaques)
        this.currentPuddle = -1; // -1 = Pas dans une flaque
        this.revealTimer = 0; // Si on attaque, on est visible
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

        // CHECK DES FLAQUES DE SLIME (Invisibilité)
        this.currentPuddle = -1;
        for (let i = 0; i < PUDDLE_ZONES.length; i++) {
            if (this.y > PUDDLE_ZONES[i].yMin && this.y < PUDDLE_ZONES[i].yMax) {
                this.currentPuddle = i; // Enregistre dans quelle flaque il est
            }
        }
    }

    draw() {
        if (this.isDead) return;

        // CALCUL DE LA VISIBILITÉ (MÉCANIQUE DES FLAQUES)
        let alpha = 1.0;
        
        if (this.currentPuddle !== -1 && this.revealTimer === 0) {
            if (this.id === 1) {
                // Le joueur 1 se voit toujours, mais translucide
                alpha = 0.4; 
            } else {
                // L'ennemi (Bot) est dans une flaque
                let p1Puddle = players[0].currentPuddle;
                if (p1Puddle === this.currentPuddle) {
                    alpha = 0.5; // Ils sont dans la MÊME flaque = on le voit un peu
                } else {
                    alpha = 0.0; // Dans une autre flaque ou P1 n'est pas dedans = INVISIBLE !
                }
            }
        }

        // Si totalement invisible, on ne dessine rien !
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); 
        
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
        
        // Direction
        ctx.fillStyle = '#fff'; ctx.fillRect(this.radius - 10, -5, 15, 10);
        ctx.restore();

        // UI au-dessus de la tête (Seulement si visible)
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#222'; ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60, 8);
        ctx.fillStyle = (this.id === 1) ? '#39ff14' : '#ff007f';
        ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60 * (this.hp / this.maxHp), 8);
        
        ctx.textAlign = 'center';
        if (this.stunTimer > 0) { ctx.fillStyle = "yellow"; ctx.fillText("STUN", this.x, this.y - this.radius - 25); }
        ctx.globalAlpha = 1.0; // Reset
    }

    castSpell(slot, targetX, targetY) {
        if(this.isDead || this.stunTimer > 0 || this.actionLock > 0 || this.cds[slot] > 0) return;
        
        // Lancer un sort annule l'invisibilité pendant 1 seconde (60 frames)
        this.revealTimer = 60;

        this.target = null; 
        this.angle = Math.atan2(targetY - this.y, targetX - this.x);
        let dx = Math.cos(this.angle); let dy = Math.sin(this.angle);

        // Sorts Simplifiés pour l'exemple
        if (this.charType === 'gunner') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*18, dy*18, this, 60)); this.cds.basic = 15; }
            if (slot === 'ult') { projectiles.push(new Projectile(this.x, this.y, dx*30, dy*30, this, 300, 30)); this.cds.ult = 1200; this.actionLock = 20;}
        } else if (this.charType === 'ninja') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*20, dy*20, this, 40)); this.cds.basic = 20; }
            if (slot === 's1') { this.x += dx*100; this.y += dy*100; this.cds.s1 = 120; } // Dash
        } else {
            // Generique
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

    // Le bot est "intelligent" : s'il ne voit pas le joueur (car joueur furtif), il ne fait rien ou s'arrête !
    let p1Visible = true;
    if (target.currentPuddle !== -1 && target.revealTimer === 0 && target.currentPuddle !== bot.currentPuddle) {
        p1Visible = false; // P1 est caché !
    }

    if (p1Visible) {
        let dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        if (dist > 250) { bot.setMovementTarget(target.x, target.y); } 
        else { bot.target = null; }
        
        // Attaque
        if (dist < 400 && bot.cds.basic === 0 && Math.random() < 0.05) {
            bot.castSpell('basic', target.x, target.y);
        }
    } else {
        // P1 est invisible, le bot s'arrête et attend bêtement
        bot.target = null; 
    }
}

// --- INITIALISATION DU JEU ---
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
    
    // Spawn ARAM (Chacun à un bout du grand couloir)
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

// --- BOUCLE PRINCIPALE ---
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

    // Dessin de l'image de fond
    if (mapImg.complete) {
        ctx.drawImage(mapImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    } else {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }

    // Effets visuels des clics
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
