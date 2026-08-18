// =========================================================
// 1. SCRIPTS D'INTERFACE (ANIMATION, TAILLE)
// =========================================================

// --- ANIMATION EXACTE DU BOUTON SETTINGS ---
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
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
    let modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    container.classList.remove('size-classic', 'size-wide', 'size-full');
    if (size === 'classic') { container.classList.add('size-classic'); document.getElementById('btn-sz-classic').classList.add('active'); if (document.fullscreenElement) document.exitFullscreen(); } 
    else if (size === 'wide') { container.classList.add('size-wide'); document.getElementById('btn-sz-wide').classList.add('active'); if (document.fullscreenElement) document.exitFullscreen(); } 
    else if (size === 'full') { container.classList.add('size-full'); document.getElementById('btn-sz-full').classList.add('active'); if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); }
}

function autoFullscreen() { if (!document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide'); }
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide'); });

// =========================================================
// 2. MOTEUR DE JEU MOBA ARAM
// =========================================================

const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

const MAP_WIDTH = 3500; 
const MAP_HEIGHT = 1000;
const mapImg = new Image();
mapImg.src = 'assets/mapsol.png';

// Zones de furtivité (ajustées pour la map)
const PUDDLE_ZONES = [
    { yMin: 0, yMax: 280 },   // Flaques du Haut
    { yMin: 720, yMax: 1000 } // Flaques du Bas
];

let cameraX = 0; let cameraY = 0;
let mouseX = 0; let mouseY = 0; let worldMouseX = 0; let worldMouseY = 0;
let gameActive = false;
let players = []; let turrets = []; let projectiles = []; let clickMarkers = [];
let locSelections = [];

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
    worldMouseX = mouseX + cameraX; worldMouseY = mouseY + cameraY;
});

// --- CLICS : GAUCHE = ATTAQUE, DROIT = BOUGER ---
canvas.addEventListener('mousedown', e => {
    if(!gameActive || players[0].isDead) return;
    
    // CLIC DROIT : Déplacement libre
    if (e.button === 2) { 
        players[0].autoAttackTarget = null; // Annule l'attaque automatique
        players[0].setMovementTarget(worldMouseX, worldMouseY);
        clickMarkers.push({x: worldMouseX, y: worldMouseY, life: 20, color: '#00f0ff'});
    }
    
    // CLIC GAUCHE : Verrouiller une cible pour l'Auto-Attack
    if (e.button === 0) { 
        let clickedEnemy = null;
        // Vérifie si on a cliqué sur un adversaire ou une tourelle ennemie
        let enemies = [...players, ...turrets].filter(ent => ent.team !== players[0].team && !ent.isDead);
        
        enemies.forEach(ent => {
            // Ne peut pas cliquer sur un ennemi invisible
            if(ent.currentPuddle !== -1 && ent.revealTimer === 0 && ent.currentPuddle !== players[0].currentPuddle) return;
            
            if(Math.hypot(worldMouseX - ent.x, worldMouseY - ent.y) < ent.radius + 20) {
                clickedEnemy = ent;
            }
        });

        if(clickedEnemy) {
            players[0].autoAttackTarget = clickedEnemy;
            clickMarkers.push({x: clickedEnemy.x, y: clickedEnemy.y, life: 20, color: '#ff007f'}); // Marqueur Rouge
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault()); // Empêche le menu Windows du Clic Droit

// --- CLAVIER : Lancer les sorts directement vers la souris ---
window.addEventListener('keydown', e => {
    if(!gameActive || players[0].isDead) return;
    let key = e.key.toLowerCase();
    
    if(key === keyboardKeys.s1) players[0].castSpell('s1', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s2) players[0].castSpell('s2', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s3) players[0].castSpell('s3', worldMouseX, worldMouseY);
    if(key === keyboardKeys.ult) players[0].castSpell('ult', worldMouseX, worldMouseY);
});

const charData = {
    seth: { name: "Seth", color: '#ff007f', hp: 1500, speed: 6, radius: 25, range: 80 },
    teemo: { name: "Scout", color: '#39ff14', hp: 900, speed: 7, radius: 20, range: 300 },
    gunner: { name: "ADC", color: '#ffbf00', hp: 850, speed: 6, radius: 22, range: 350 },
    slime: { name: "Slime", color: '#00ffcc', hp: 2000, speed: 5, radius: 30, range: 80 },
    mage: { name: "Mage", color: '#9d00ff', hp: 800, speed: 5.5, radius: 22, range: 300 },
    ninja: { name: "Ninja", color: '#00f0ff', hp: 1000, speed: 8, radius: 22, range: 90 }
};

// --- CLASSE TOURELLE ---
class Turret {
    constructor(id, team, x, y, color) {
        this.id = id; this.team = team; this.x = x; this.y = y;
        this.radius = 50; this.maxHp = 3000; this.hp = this.maxHp;
        this.color = color; this.isDead = false;
        this.range = 400; this.attackTimer = 0;
    }
    update() {
        if(this.isDead) return;
        if(this.attackTimer > 0) this.attackTimer--;
        
        let target = null; let minDist = this.range;
        players.forEach(p => {
            if(!p.isDead && p.team !== this.team) {
                // La tourelle ne voit pas les joueurs furtifs
                if(p.currentPuddle !== -1 && p.revealTimer === 0) return;
                
                let d = Math.hypot(p.x - this.x, p.y - this.y);
                if(d < minDist) { minDist = d; target = p; }
            }
        });
        
        // Attaque ciblée
        if(target && this.attackTimer === 0) {
            projectiles.push(new Projectile(this.x, this.y, 0, 0, this, 100, 15, target)); // Projectile téléguidé
            this.attackTimer = 60; // 1 attaque par seconde
        }
    }
    draw() {
        if(this.isDead) return;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#333'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = this.color; ctx.stroke();
        
        // Barre de vie de la tourelle
        ctx.fillStyle = '#222'; ctx.fillRect(this.x - 40, this.y - 70, 80, 8);
        ctx.fillStyle = this.color; ctx.fillRect(this.x - 40, this.y - 70, 80 * (this.hp / this.maxHp), 8);
    }
    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.isDead = true; checkWin(); }
    }
}

// --- CLASSE JOUEUR ---
class Player {
    constructor(id, team, x, y, type) {
        this.id = id; this.team = team; this.x = x; this.y = y; 
        this.charType = type; this.color = charData[type].color;
        this.baseSpeed = charData[type].speed; this.radius = charData[type].radius;
        this.attackRange = charData[type].range;
        this.maxHp = charData[type].hp; this.hp = this.maxHp; this.shield = 0;
        
        this.target = null; this.autoAttackTarget = null; this.angle = 0;
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

        // LOGIQUE D'AUTO-ATTACK
        if (this.autoAttackTarget) {
            if(this.autoAttackTarget.isDead) {
                this.autoAttackTarget = null;
            } else {
                let dist = Math.hypot(this.autoAttackTarget.x - this.x, this.autoAttackTarget.y - this.y);
                if (dist > this.attackRange) {
                    this.setMovementTarget(this.autoAttackTarget.x, this.autoAttackTarget.y); // Avance vers la cible
                } else {
                    this.target = null; // S'arrête
                    if (this.cds.basic === 0) {
                        this.castSpell('basic', this.autoAttackTarget.x, this.autoAttackTarget.y);
                    }
                }
            }
        }

        // DEPLACEMENT
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

        // CHECK DES FLAQUES
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
        let isStealthyToSelf = false;

        // GESTION VISIBILITÉ
        if (this.currentPuddle !== -1 && this.revealTimer === 0) {
            if (this.id === 1) {
                alpha = 0.5; isStealthyToSelf = true; // Je vois que je suis invisible
            } else {
                let p1Puddle = players[0].currentPuddle;
                if (p1Puddle === this.currentPuddle) alpha = 0.5; 
                else alpha = 0.0; // Ennemi totalement invisible pour moi
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

        // INDICATEUR VISUEL DE FURTIVITÉ
        if(isStealthyToSelf) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 15, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.textAlign = 'center'; ctx.font = "bold 14px Arial";
            ctx.fillText("FURTIF", this.x, this.y + this.radius + 30);
        }

        // BARRE DE VIE
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#222'; ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60, 8);
        ctx.fillStyle = (this.team === 1) ? '#39ff14' : '#ff007f';
        ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60 * (this.hp / this.maxHp), 8);
        
        ctx.textAlign = 'center';
        if (this.stunTimer > 0) { ctx.fillStyle = "yellow"; ctx.fillText("STUN", this.x, this.y - this.radius - 35); }
        ctx.globalAlpha = 1.0; 
    }

    // LES SORTS FONT DES VRAIS DEGATS ET PARTENT
    castSpell(slot, targetX, targetY) {
        if(this.isDead || this.stunTimer > 0 || this.actionLock > 0 || this.cds[slot] > 0) return;
        
        this.revealTimer = 60; // Devient visible 1 seconde
        this.target = null; // S'arrête pour tirer
        
        let dx = targetX - this.x; let dy = targetY - this.y;
        let dist = Math.hypot(dx, dy) || 1;
        dx /= dist; dy /= dist; // Vecteur directionnel propre

        if (this.charType === 'gunner') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*18, dy*18, this, 60)); this.cds.basic = 15; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, dx*12, dy*12, this, 90)); this.cds.s1 = 200; }
            if (slot === 's2') { this.x -= dx*100; this.y -= dy*100; this.cds.s2 = 300; } // Recul
            if (slot === 's3') { projectiles.push(new Projectile(targetX, targetY, 0, 0, this, 50, 40)); this.cds.s3 = 400; } // Mine
            if (slot === 'ult') { projectiles.push(new Projectile(this.x, this.y, dx*30, dy*30, this, 300, 30)); this.cds.ult = 1200; this.actionLock = 20;}
        } else if (this.charType === 'ninja') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*20, dy*20, this, 40)); this.cds.basic = 20; }
            if (slot === 's1') { this.x += dx*150; this.y += dy*150; projectiles.push(new Projectile(this.x, this.y, dx*25, dy*25, this, 50)); this.cds.s1 = 240; } // Dash + Tir
            if (slot === 's2') { this.x += dx*200; this.y += dy*200; this.cds.s2 = 300; }
            if (slot === 's3') { projectiles.push(new Projectile(this.x, this.y, dx*15, dy*15, this, 40)); this.cds.s3 = 100; }
            if (slot === 'ult') {
                let enemy = players.find(p => p.team !== this.team && !p.isDead);
                if(enemy) { this.x = enemy.x; this.y = enemy.y; enemy.takeDamage(200); enemy.stunTimer = 60; }
                this.cds.ult = 1000;
            }
        } else if (this.charType === 'mage') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*12, dy*12, this, 50)); this.cds.basic = 25; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, dx*8, dy*8, this, 30)); this.cds.s1 = 300; } // stun dans proj
            if (slot === 's2') { projectiles.push(new Projectile(this.x, this.y, dx*6, dy*6, this, 150, 25)); this.cds.s2 = 400; } // grosse boule
            if (slot === 's3') { this.shield += 200; this.cds.s3 = 600; }
            if (slot === 'ult') { projectiles.push(new Projectile(this.x, this.y, dx*35, dy*35, this, 250, 40)); this.cds.ult = 900; } // Laser
        } else {
            // Seth, Slime, Teemo par défaut si non spécifié
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*15, dy*15, this, 50)); this.cds.basic = 30; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 100)); this.cds.s1 = 200; }
            if (slot === 's2') { projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 100)); this.cds.s2 = 200; }
            if (slot === 's3') { projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 100)); this.cds.s3 = 200; }
            if (slot === 'ult') { projectiles.push(new Projectile(this.x, this.y, dx*20, dy*20, this, 300, 30)); this.cds.ult = 1000; }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        if(this.shield > 0) { this.shield -= amount; if(this.shield < 0) { amount = Math.abs(this.shield); this.shield = 0; } else return; }
        
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.isDead = true; checkWin(); }
    }
}

class Projectile {
    constructor(x, y, vx, vy, owner, dmg, size=10, homingTarget=null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; 
        this.owner = owner; this.dmg = dmg; this.radius = size;
        this.homingTarget = homingTarget; // Pour la tourelle
        this.active = true; this.life = 100;
    }
    update() {
        if(this.homingTarget && !this.homingTarget.isDead) {
            let dx = this.homingTarget.x - this.x; let dy = this.homingTarget.y - this.y;
            let dist = Math.hypot(dx, dy);
            this.vx = (dx/dist) * 12; this.vy = (dy/dist) * 12;
        }

        this.x += this.vx; this.y += this.vy; this.life--;
        if(this.life <= 0 || this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT) this.active = false;

        let targets = [...players, ...turrets].filter(ent => ent.team !== this.owner.team && !ent.isDead);
        
        targets.forEach(ent => {
            if (this.active && Math.hypot(ent.x - this.x, ent.y - this.y) < ent.radius + this.radius) {
                ent.takeDamage(this.dmg); this.active = false;
                clickMarkers.push({x: this.x, y: this.y, life: 15, color: this.owner.color, isExplosion: true});
            }
        });

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.owner.color; ctx.fill();
    }
}

// --- INTELLIGENCE DU BOT ---
function updateBot(bot) {
    if (bot.isDead || bot.stunTimer > 0) return;
    let target = players[0]; // Cherche le joueur 1
    if (target.isDead) return;

    let p1Visible = true;
    if (target.currentPuddle !== -1 && target.revealTimer === 0 && target.currentPuddle !== bot.currentPuddle) {
        p1Visible = false; // P1 est invisible pour le bot
    }

    if (p1Visible) {
        let dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        
        if (dist > bot.attackRange) { bot.setMovementTarget(target.x, target.y); } 
        else { bot.target = null; } // À portée, il s'arrête
        
        // Attaque s'il est à portée
        if (dist < bot.attackRange + 50 && bot.cds.basic === 0 && Math.random() < 0.1) {
            bot.castSpell('basic', target.x, target.y);
        }
        // Lance ses sorts au hasard
        if (dist < 400 && Math.random() < 0.02) {
            let spells = ['s1', 's2', 's3', 'ult'];
            let s = spells[Math.floor(Math.random()*spells.length)];
            if(bot.cds[s] === 0) bot.castSpell(s, target.x, target.y);
        }
    } else {
        bot.target = null; // Ne bouge plus s'il ne voit personne
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
    
    // id, team, x, y, type
    players = [
        new Player(1, 1, 400, MAP_HEIGHT / 2, locSelections[0]),
        new Player(2, 2, MAP_WIDTH - 400, MAP_HEIGHT / 2, locSelections[1])
    ];

    // id, team, x, y, color
    turrets = [
        new Turret(3, 1, 600, MAP_HEIGHT / 2, '#00f0ff'),
        new Turret(4, 2, MAP_WIDTH - 600, MAP_HEIGHT / 2, '#ff007f')
    ];

    cameraX = players[0].x - window.innerWidth / 2;
    cameraY = players[0].y - window.innerHeight / 2;

    gameActive = true; resizeCanvas(); gameLoop();
}

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);

function updateSpellUI() {
    if(players.length === 0 || players[0].isDead) return;
    let p = players[0];
    
    ['s1', 's2', 's3', 'ult'].forEach(slot => {
        let box = document.getElementById(`spell-${slot}`);
        if(p.cds[slot] > 0) {
            box.classList.remove('ready'); box.classList.add('cooldown');
        } else {
            box.classList.add('ready'); box.classList.remove('cooldown');
        }
    });

    document.getElementById(`p1-hp-bar`).style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
    document.getElementById(`p1-hp-txt`).innerText = `${Math.floor(p.hp)} / ${p.maxHp}`;
}

function checkWin() {
    let t1Dead = turrets[0].isDead;
    let t2Dead = turrets[1].isDead;
    
    if(t1Dead || t2Dead) {
        gameActive = false;
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('winner-text').innerText = t2Dead ? `VICTOIRE !` : "DÉFAITE !";
        document.getElementById('winner-text').style.color = t2Dead ? '#39ff14' : '#ff007f';
    }
}

function gameLoop() {
    if (!gameActive) return;

    const panSpeed = 20; const edgeSize = 50;
    if (mouseX < edgeSize) cameraX -= panSpeed;
    if (mouseX > window.innerWidth - edgeSize) cameraX += panSpeed;
    if (mouseY < edgeSize) cameraY -= panSpeed;
    if (mouseY > window.innerHeight - edgeSize) cameraY += panSpeed;

    cameraX = Math.max(0, Math.min(MAP_WIDTH - window.innerWidth, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT - window.innerHeight, cameraY));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-cameraX, -cameraY);

    if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    else { ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT); }

    // Marqueurs visuels
    for (let i = clickMarkers.length - 1; i >= 0; i--) {
        let m = clickMarkers[i]; ctx.beginPath(); ctx.arc(m.x, m.y, 30 - m.life, 0, Math.PI*2);
        ctx.strokeStyle = m.color; ctx.lineWidth = 2; ctx.stroke();
        m.life--; if (m.life <= 0) clickMarkers.splice(i, 1);
    }

    // Tourelles
    turrets.forEach(t => { t.update(); t.draw(); });

    // Joueurs
    players[0].update(); updateBot(players[1]); players[1].update();
    players.forEach(p => p.draw());

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(); if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    ctx.restore(); updateSpellUI(); requestAnimationFrame(gameLoop);
}
