const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

// --- VARIABLES GLOBALES MOBA ---
const MAP_WIDTH = 3000; 
const MAP_HEIGHT = 3000;
let cameraX = 0; let cameraY = 0;
let mouseX = 0; let mouseY = 0;
let worldMouseX = 0; let worldMouseY = 0;

let gameActive = false;
let players = []; let projectiles = []; let clickMarkers = [];
let locSelections = [];

// Système de Sorts
let activeSpellSlot = null; // Quand on clique sur l'UI, ce sort est prêt à être lancé au Clic Droit
let keyboardKeys = { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };

// Empêche le menu contextuel du Clic Droit sur le Canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

// Mise à jour des touches selon AZERTY ou QWERTY
document.getElementById('keyboard-layout').addEventListener('change', (e) => {
    let isQwerty = e.target.value === 'qwerty';
    keyboardKeys = isQwerty ? { s1: 'q', s2: 'w', s3: 'e', ult: 'r' } : { s1: 'a', s2: 'z', s3: 'e', ult: 'r' };
    document.getElementById('key-s1').innerText = keyboardKeys.s1.toUpperCase();
    document.getElementById('key-s2').innerText = keyboardKeys.s2.toUpperCase();
    document.getElementById('key-s3').innerText = keyboardKeys.s3.toUpperCase();
    document.getElementById('key-ult').innerText = keyboardKeys.ult.toUpperCase();
});

// Suivi de la souris pour la caméra (Edge Panning) et la visée
window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    worldMouseX = mouseX + cameraX;
    worldMouseY = mouseY + cameraY;
});

// --- GESTION DES CLICS SOURIS ---
canvas.addEventListener('mousedown', e => {
    if(!gameActive || players[0].isDead) return;

    // CLIC GAUCHE : Se déplacer (si aucun sort n'est actif)
    if (e.button === 0) {
        if(activeSpellSlot) {
            // Annule le sort actif si on clic gauche pour bouger
            activeSpellSlot = null;
            updateSpellUI();
        }
        players[0].setMovementTarget(worldMouseX, worldMouseY);
        clickMarkers.push({x: worldMouseX, y: worldMouseY, life: 20});
    }
    
    // CLIC DROIT : Lancer le sort préalablement cliqué dans l'UI, ou une attaque de base
    if (e.button === 2) {
        if(activeSpellSlot) {
            players[0].castSpell(activeSpellSlot, worldMouseX, worldMouseY);
            activeSpellSlot = null; // Réinitialise
            updateSpellUI();
        } else {
            // Par défaut, attaque de base au clic droit
            players[0].castSpell('basic', worldMouseX, worldMouseY);
        }
    }
});

// --- GESTION DU CLAVIER (Quick-Cast) ---
window.addEventListener('keydown', e => {
    if(!gameActive || players[0].isDead) return;
    let key = e.key.toLowerCase();
    
    // Le joueur appuie sur une touche, le sort part direct vers la souris !
    if(key === keyboardKeys.s1) players[0].castSpell('s1', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s2) players[0].castSpell('s2', worldMouseX, worldMouseY);
    if(key === keyboardKeys.s3) players[0].castSpell('s3', worldMouseX, worldMouseY);
    if(key === keyboardKeys.ult) players[0].castSpell('ult', worldMouseX, worldMouseY);
});

// Clic sur l'interface pour préparer un sort
window.prepareSpell = function(slot) {
    if(players[0].cds[slot] === 0 && players[0].isSilenced === 0) {
        activeSpellSlot = slot;
        updateSpellUI();
    }
};

// --- DATA DES CHAMPIONS ---
const charData = {
    seth: { name: "Seth", color: '#ff007f', maxHp: 1500, speed: 6, armor: 30, radius: 25 },
    teemo: { name: "Scout", color: '#39ff14', maxHp: 900, speed: 7, armor: 10, radius: 20 },
    gunner: { name: "ADC", color: '#ffbf00', maxHp: 850, speed: 6, armor: 15, radius: 22 },
    slime: { name: "Slime", color: '#00ffcc', maxHp: 2000, speed: 5, armor: 40, radius: 30 },
    mage: { name: "Mage", color: '#9d00ff', maxHp: 800, speed: 5.5, armor: 10, radius: 22 },
    ninja: { name: "Ninja", color: '#00f0ff', maxHp: 1000, speed: 8, armor: 20, radius: 22 }
};

// --- ENTITÉ JOUEUR (TOP-DOWN) ---
class Player {
    constructor(id, x, y, type) {
        this.id = id; this.x = x; this.y = y; 
        let c = charData[type]; this.charType = type; this.name = c.name;
        this.color = c.color; this.baseSpeed = c.speed; this.radius = c.radius;
        
        this.maxHp = c.maxHp; this.hp = this.maxHp; 
        this.armor = c.armor; this.shield = 0;
        
        // Cible de déplacement (Clic)
        this.target = null; this.angle = 0; // Direction regardée
        
        // Cooldowns (Frames: 60 = 1 sec)
        this.cds = { s1: 0, s2: 0, s3: 0, ult: 0, basic: 0 };
        this.maxCds = { s1: 300, s2: 420, s3: 360, ult: 1200, basic: 30 };
        if(this.charType === 'ninja') this.maxCds.s3 = 40; // Ninja S3 rapide
        
        // États
        this.isInvisible = false; this.isSilenced = 0; this.stunTimer = 0;
        this.actionLock = 0; this.isDead = false;
        
        this.ninjaGhostPos = null;
    }

    setMovementTarget(tx, ty) {
        this.target = { x: tx, y: ty };
    }

    update() {
        if (this.isDead) return;

        // Timers
        for(let key in this.cds) if(this.cds[key] > 0) this.cds[key]--;
        if(this.stunTimer > 0) this.stunTimer--;
        if(this.isSilenced > 0) this.isSilenced--;
        if(this.actionLock > 0) this.actionLock--;

        // Déplacement Top-Down
        if (this.target && this.stunTimer === 0 && this.actionLock === 0) {
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let dist = Math.hypot(dx, dy);
            
            // Rotation (Regarde où il marche)
            this.angle = Math.atan2(dy, dx);
            
            let currentSpeed = this.baseSpeed + (this.charType === 'teemo' && this.cds.s3 > this.maxCds.s3 - 180 ? 3 : 0);

            if (dist > currentSpeed) {
                this.x += (dx / dist) * currentSpeed;
                this.y += (dy / dist) * currentSpeed;
            } else {
                this.x = this.target.x; this.y = this.target.y;
                this.target = null; // Arrivé à destination
            }
        }

        // Limites de la Map
        this.x = Math.max(this.radius, Math.min(MAP_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_HEIGHT - this.radius, this.y));
    }

    draw() {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Tourne le personnage
        
        if (this.isInvisible) ctx.globalAlpha = 0.3;

        // Corps (Cercle)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Le "Nez" pour voir la direction
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.radius - 10, -5, 15, 10);

        ctx.restore();

        // Barres de vie au-dessus de la tête
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60, 8);
        ctx.fillStyle = (this.id === 1) ? '#39ff14' : '#ff007f';
        ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60 * (this.hp / this.maxHp), 8);
        
        // États
        ctx.textAlign = 'center';
        if (this.stunTimer > 0) { ctx.fillStyle = "yellow"; ctx.fillText("STUN", this.x, this.y - this.radius - 25); }
        else if (this.isSilenced > 0) { ctx.fillStyle = "red"; ctx.fillText("SILENCE", this.x, this.y - this.radius - 25); }
    }

    // --- LE SYSTÈME DE SORTS TOP-DOWN ---
    castSpell(slot, targetX, targetY) {
        if(this.isDead || this.stunTimer > 0 || this.actionLock > 0 || this.cds[slot] > 0) return;
        if((slot !== 'basic' && slot !== 'ult') && this.isSilenced > 0) return;

        // S'arrête pour lancer le sort et regarde la cible
        this.target = null; 
        this.angle = Math.atan2(targetY - this.y, targetX - this.x);

        let dx = Math.cos(this.angle);
        let dy = Math.sin(this.angle);

        // 1. SETH
        if (this.charType === 'seth') {
            if (slot === 'basic') { this.meleeAttack(50, 60); this.cds.basic = 30; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, dx*15, dy*15, this, 'hook', 40)); this.cds.s1 = 300; this.actionLock = 20;}
            if (slot === 'ult') {
                this.x = targetX; this.y = targetY; // Dash ultime
                let hit = this.getEnemyInMeleeRange(80);
                if(hit) { hit.takeDamage(300, this); hit.stunTimer = 60; }
                this.cds.ult = 1200; this.actionLock = 40;
                createExplosion(this.x, this.y, this.color);
            }
        }
        // 2. TEEMO
        if (this.charType === 'teemo') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*12, dy*12, this, 'dart', 30)); this.cds.basic = 20; this.isInvisible = false; }
            if (slot === 's1') { this.isInvisible = true; this.cds.s1 = 600; } 
            if (slot === 's2') { projectiles.push(new Projectile(this.x, this.y, dx*12, dy*12, this, 'silence', 20)); this.cds.s2 = 400; this.isInvisible = false;}
            if (slot === 's3') { this.cds.s3 = 400; } // Vitesse passive
            if (slot === 'ult') { 
                projectiles.push(new Projectile(this.x, this.y, 0, 0, this, 'mine', 200)); // Pose une mine sur place
                this.cds.ult = 900; this.isInvisible = false;
            }
        }
        // 3. GUNNER
        if (this.charType === 'gunner') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*18, dy*18, this, 'bullet', 60)); this.cds.basic = 15; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, 0, 0, this, 'mine', 100)); this.cds.s1 = 300; }
            if (slot === 's2') { 
                this.x -= dx * 100; this.y -= dy * 100; // Recule
                projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 'net', 40));
                this.cds.s2 = 420;
            }
            if (slot === 'ult') {
                this.actionLock = 30; // Temps de charge
                setTimeout(() => {
                    if(this.isDead || this.stunTimer > 0) return;
                    projectiles.push(new Projectile(this.x, this.y, dx*25, dy*25, this, 'laser', 300));
                }, 500);
                this.cds.ult = 1200;
            }
        }
        // 4. SLIME
        if (this.charType === 'slime') {
            if (slot === 'basic') { this.meleeAttack(40, 60); this.cds.basic = 40; }
            if (slot === 's1') { 
                this.takeDamage(50, this); 
                projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 'slimeball', 150));
                this.cds.s1 = 200; this.actionLock = 20;
            }
            if (slot === 'ult') {
                this.maxHp += 200; this.hp += 500; this.armor += 20;
                if(this.hp > this.maxHp) this.hp = this.maxHp;
                this.radius += 5;
                this.cds.ult = 1800; createExplosion(this.x, this.y, '#00ffcc');
            }
        }
        // 5. MAGE
        if (this.charType === 'mage') {
            if (slot === 'basic') { projectiles.push(new Projectile(this.x, this.y, dx*12, dy*12, this, 'magic', 45)); this.cds.basic = 25; }
            if (slot === 's1') { projectiles.push(new Projectile(this.x, this.y, dx*8, dy*8, this, 'stunball', 30)); this.cds.s1 = 400; this.actionLock = 15; }
            if (slot === 's2') { projectiles.push(new Projectile(this.x, this.y, dx*6, dy*6, this, 'megaball', 150)); this.cds.s2 = 480; this.actionLock = 20; }
            if (slot === 'ult') {
                this.actionLock = 40;
                // Laser instantané sur toute la longueur
                projectiles.push(new Projectile(this.x, this.y, dx*30, dy*30, this, 'laser', 250));
                this.cds.ult = 900;
            }
        }
        // 6. NINJA
        if (this.charType === 'ninja') {
            if (slot === 'basic') { this.meleeAttack(35, 50); this.cds.basic = 20; }
            if (slot === 's1') { 
                this.x += dx * 100; this.y += dy * 100; // Dash
                projectiles.push(new Projectile(this.x, this.y, dx*20, dy*20, this, 'kunai', 50));
                this.cds.s1 = 240; this.actionLock = 10;
            }
            if (slot === 's2') { 
                this.x += dx * 200; this.y += dy * 200; // Dash long
                let hit = this.getEnemyInMeleeRange(80); // Stun sur le chemin
                if(hit) { hit.takeDamage(40, this); hit.stunTimer = 60; }
                this.cds.s2 = 300; this.actionLock = 10;
            }
            if (slot === 's3') {
                if (!this.ninjaGhostPos) {
                    this.ninjaGhostPos = {x: this.x, y: this.y};
                    this.x += dx * 150; this.y += dy * 150;
                    this.cds.s3 = 30; // Court CD pour réactiver
                } else {
                    this.x = this.ninjaGhostPos.x; this.y = this.ninjaGhostPos.y;
                    this.ninjaGhostPos = null;
                    this.cds.s3 = 400; // Vrai CD
                }
            }
            if (slot === 'ult') {
                let targetEnemy = players.find(p => p !== this && !p.isDead);
                if (targetEnemy) {
                    this.x = targetEnemy.x - 30; this.y = targetEnemy.y - 30;
                    targetEnemy.takeDamage(200, this);
                    targetEnemy.stunTimer = 30;
                    createExplosion(targetEnemy.x, targetEnemy.y, this.color);
                }
                this.cds.ult = 1000;
            }
        }
    }

    meleeAttack(dmg, range) {
        let hit = this.getEnemyInMeleeRange(range);
        if (hit) hit.takeDamage(dmg, this);
    }

    getEnemyInMeleeRange(range) {
        return players.find(p => p !== this && !p.isDead && Math.hypot(p.x - this.x, p.y - this.y) < range + this.radius);
    }

    takeDamage(amount, attacker) {
        if (this.isDead) return;
        let multiplier = 100 / (100 + this.armor);
        let actualDmg = amount * multiplier;

        if (this.shield > 0) {
            if (this.shield >= actualDmg) { this.shield -= actualDmg; return; }
            else { actualDmg -= this.shield; this.shield = 0; }
        }

        this.hp -= actualDmg;
        
        if (attacker && attacker.charType === 'mage') {
            attacker.shield += actualDmg * 0.3; 
        }

        if (this.hp <= 0) {
            this.hp = 0; this.isDead = true;
            checkWin();
        }
    }
}

class Projectile {
    constructor(x, y, vx, vy, owner, type, dmg) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; 
        this.owner = owner; this.type = type; this.dmg = dmg;
        this.radius = 10; this.active = true;
        this.life = 100; // Dure un certain temps
        
        if(type === 'mine') { this.radius = 20; this.vx = 0; this.vy = 0; this.life = 1000; }
        if(type === 'laser') { this.radius = 30; this.life = 30; } // Laser = gros projectile rapide
        if(type === 'megaball') { this.radius = 25; }
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
        if(this.life <= 0 || this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT) this.active = false;

        players.forEach(p => {
            if (p !== this.owner && !p.isDead && this.active) {
                if (Math.hypot(p.x - this.x, p.y - this.y) < p.radius + this.radius) {
                    
                    if(this.type === 'hook') { p.target = {x: this.owner.x, y: this.owner.y}; p.stunTimer = 20; }
                    if(this.type === 'silence') { p.isSilenced = 120; }
                    if(this.type === 'stunball') { p.stunTimer = 90; }
                    
                    p.takeDamage(this.dmg, this.owner);
                    
                    if(this.type !== 'laser') this.active = false; // Le laser transperce
                    createExplosion(this.x, this.y, this.owner.color);
                }
            }
        });

        // Dessin
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.owner.color;
        if(this.type === 'mine' && this.owner.id !== players[0].id) ctx.globalAlpha = 0; // Mine invisible pour l'ennemi
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createExplosion(x, y, color) {
    clickMarkers.push({x: x, y: y, life: 15, color: color, isExplosion: true});
}

// --- LOGIQUE IA DU BOT (Puisque Local) ---
function updateBot(bot) {
    if (bot.isDead || bot.stunTimer > 0) return;
    let target = players[0];
    if (target.isDead) return;

    let dist = Math.hypot(target.x - bot.x, target.y - bot.y);
    
    // Le bot marche vers le joueur
    if (dist > 150) {
        bot.setMovementTarget(target.x, target.y);
    } else {
        bot.target = null; // S'arrête pour taper
    }

    // Le bot lance des sorts s'il est à portée
    if (dist < 400 && Math.random() < 0.02) {
        let spells = ['s1', 's2', 's3', 'ult'];
        let randomSpell = spells[Math.floor(Math.random() * spells.length)];
        if(bot.cds[randomSpell] === 0) bot.castSpell(randomSpell, target.x, target.y);
    }
    if (dist < 100 && bot.cds.basic === 0) {
        bot.castSpell('basic', target.x, target.y);
    }
}

// --- GESTION DU JEU ET UI ---
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
    
    // On spawn aux deux bouts de la map
    players = [
        new Player(1, 200, 200, locSelections[0]),
        new Player(2, MAP_WIDTH - 200, MAP_HEIGHT - 200, locSelections[1])
    ];

    // Initialiser Caméra sur le P1
    cameraX = players[0].x - window.innerWidth / 2;
    cameraY = players[0].y - window.innerHeight / 2;

    gameActive = true;
    resizeCanvas();
    gameLoop();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function updateSpellUI() {
    if(players.length === 0 || players[0].isDead) return;
    let p = players[0];
    
    // Mise à jour de la surbrillance (sort prêt à être lancé via Clic Droit)
    ['s1', 's2', 's3', 'ult'].forEach(slot => {
        let box = document.getElementById(`spell-${slot}`);
        if(activeSpellSlot === slot) box.classList.add('active');
        else box.classList.remove('active');
        
        if(p.cds[slot] > 0) {
            box.classList.remove('ready'); box.classList.add('cooldown');
            box.innerHTML = `<span class="key-hint">${keyboardKeys[slot].toUpperCase()}</span>${Math.ceil(p.cds[slot]/60)}`;
        } else {
            box.classList.add('ready'); box.classList.remove('cooldown');
            box.innerHTML = `<span class="key-hint">${keyboardKeys[slot].toUpperCase()}</span>`;
        }
    });

    // Barres de vie HUD
    let hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
    document.getElementById(`p1-hp-bar`).style.width = `${hpPct}%`;
    document.getElementById(`p1-hp-txt`).innerText = `${Math.floor(p.hp)} / ${p.maxHp}`;
}

function checkWin() {
    let alive = players.filter(p => !p.isDead);
    if(alive.length <= 1) {
        gameActive = false;
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('winner-text').innerText = alive.length === 1 ? `VICTOIRE !` : "MATCH NUL !";
        document.getElementById('winner-text').style.color = alive.length === 1 ? alive[0].color : "white";
    }
}

// --- BOUCLE PRINCIPALE ---
function gameLoop() {
    if (!gameActive) return;

    // --- 1. EDGE PANNING (Mouvement caméra) ---
    const panSpeed = 15;
    const edgeSize = 50;
    if (mouseX < edgeSize) cameraX -= panSpeed;
    if (mouseX > window.innerWidth - edgeSize) cameraX += panSpeed;
    if (mouseY < edgeSize) cameraY -= panSpeed;
    if (mouseY > window.innerHeight - edgeSize) cameraY += panSpeed;

    // Fixer la caméra à la map
    cameraX = Math.max(0, Math.min(MAP_WIDTH - window.innerWidth, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT - window.innerHeight, cameraY));

    // --- 2. RENDU VISUEL ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cameraX, -cameraY); // Application de la Caméra

    // Grille de Fond (Map)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (let x = 0; x <= MAP_WIDTH; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT); ctx.stroke(); }
    for (let y = 0; y <= MAP_HEIGHT; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y); ctx.stroke(); }

    // Marqueurs de Clic (Rond vert de destination)
    for (let i = clickMarkers.length - 1; i >= 0; i--) {
        let m = clickMarkers[i];
        ctx.beginPath();
        ctx.arc(m.x, m.y, 30 - m.life, 0, Math.PI*2);
        ctx.strokeStyle = m.isExplosion ? m.color : `rgba(0, 255, 0, ${m.life / 20})`;
        ctx.lineWidth = m.isExplosion ? 5 : 2;
        ctx.stroke();
        m.life--;
        if (m.life <= 0) clickMarkers.splice(i, 1);
    }

    // Mise à jour Joueurs et Bot
    players[0].update(); // P1 (Souris)
    updateBot(players[1]); // P2 (IA)
    players[1].update();

    // Dessin
    players.forEach(p => p.draw());

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    // Ligne de visée si un sort est actif
    if(activeSpellSlot && !players[0].isDead) {
        ctx.beginPath();
        ctx.moveTo(players[0].x, players[0].y);
        ctx.lineTo(worldMouseX, worldMouseY);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore(); // Fin de la zone caméra

    // Mise à jour de l'interface (HUD)
    updateSpellUI();

    requestAnimationFrame(gameLoop);
}
