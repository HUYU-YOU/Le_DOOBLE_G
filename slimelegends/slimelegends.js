const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
const LOGICAL_WIDTH = 800; const LOGICAL_HEIGHT = 500;

let gameActive = false, players = [], projectiles = [], items = [];
let locSelections = [];

// Dictionnaire des touches (P1: ZQSD, P2: Flèches)
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousedown', e => { if(e.button === 0) keys['click'] = true; });
window.addEventListener('mouseup', e => { if(e.button === 0) keys['click'] = false; });

function getCtrl(id) {
    if (id === 1) return { 
        left: keys['q'], right: keys['d'], jump: keys['z'] || keys[' '], 
        basic: keys['click'] || keys['c'], s1: keys['a'], s2: keys['e'], s3: keys['f'], ult: keys['r'] 
    };
    if (id === 2) return { 
        left: keys['arrowleft'], right: keys['arrowright'], jump: keys['arrowup'], 
        basic: keys['m'], s1: keys['i'], s2: keys['o'], s3: keys['p'], ult: keys['l'] 
    };
}

// --- CLASSES DES PERSONNAGES ---
const charData = {
    seth: { name: "Seth", color: '#ff007f', maxHp: 1500, speed: 5, armor: 30 },
    teemo: { name: "Scout", color: '#39ff14', maxHp: 900, speed: 7, armor: 10 },
    gunner: { name: "ADC", color: '#ffbf00', maxHp: 850, speed: 6, armor: 15 },
    slime: { name: "Slime", color: '#00ffcc', maxHp: 2000, speed: 4, armor: 40 },
    mage: { name: "Mage", color: '#9d00ff', maxHp: 800, speed: 5, armor: 10 },
    ninja: { name: "Ninja", color: '#00f0ff', maxHp: 1000, speed: 8, armor: 20 }
};

class Player {
    constructor(id, x, type) {
        this.id = id; this.x = x; this.y = 100; this.w = 50; this.h = 80;
        let c = charData[type]; this.charType = type; this.name = c.name;
        this.color = c.color; this.speed = c.speed;
        
        // Stats MOBA
        this.maxHp = c.maxHp; this.hp = this.maxHp; 
        this.armor = c.armor; this.shield = 0;
        
        // Physique
        this.vx = 0; this.vy = 0; this.facing = id === 1 ? 1 : -1;
        this.grounded = false;
        
        // Cooldowns (Frames: 60 = 1 sec)
        this.cds = { s1: 0, s2: 0, s3: 0, ult: 0, basic: 0 };
        this.maxCds = { s1: 300, s2: 420, s3: 360, ult: 1200, basic: 30 };
        
        // États spéciaux
        this.isInvisible = false; this.isSilenced = 0; this.stunTimer = 0;
        this.actionLock = 0; // Empêche de bouger pendant une attaque
        this.isDead = false;

        // Variables spécifiques aux persos
        this.ninjaDashCount = 0; this.ninjaGhostPos = null;
        this.sethGrabTarget = null;
    }

    draw() {
        if (this.isDead) return;
        ctx.save();
        
        // Invisibilité (Teemo S1)
        if (this.isInvisible) ctx.globalAlpha = 0.2;
        
        ctx.fillStyle = this.color;
        
        // Animation de base (Rectangle)
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Indicateur de direction
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x + (this.facing === 1 ? this.w - 10 : 0), this.y + 10, 10, 10);

        // Indicateur Silence / Stun
        if (this.stunTimer > 0) { ctx.fillStyle = "yellow"; ctx.fillText("STUN", this.x, this.y - 10); }
        else if (this.isSilenced > 0) { ctx.fillStyle = "red"; ctx.fillText("SILENCE", this.x, this.y - 10); }

        ctx.restore();
    }

    update(ctrl) {
        if (this.isDead) return;

        // Diminution des timers
        for(let key in this.cds) if(this.cds[key] > 0) this.cds[key]--;
        if(this.stunTimer > 0) this.stunTimer--;
        if(this.isSilenced > 0) this.isSilenced--;
        if(this.actionLock > 0) this.actionLock--;

        // Physique / Gravité
        this.vy += 0.8; // Gravité
        this.x += this.vx; this.y += this.vy;
        
        // Sol basique
        if (this.y + this.h > 450) { 
            this.y = 450 - this.h; this.vy = 0; this.grounded = true; 
            if(this.actionLock === 0) this.vx *= 0.8; // Friction
        } else {
            this.grounded = false;
        }

        // Mur
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > LOGICAL_WIDTH) this.x = LOGICAL_WIDTH - this.w;

        // Mouvement (Si non stun et non lock)
        if (this.stunTimer === 0 && this.actionLock === 0) {
            let currentSpeed = this.speed + (this.charType === 'teemo' && this.cds.s3 > this.maxCds.s3 - 180 ? 4 : 0);
            
            if (ctrl.left) { this.vx = -currentSpeed; this.facing = -1; }
            if (ctrl.right) { this.vx = currentSpeed; this.facing = 1; }
            if (ctrl.jump && this.grounded) { this.vy = -15; }

            // Sorts
            if (ctrl.basic && this.cds.basic === 0) this.castSpell('basic');
            if (this.isSilenced === 0) {
                if (ctrl.s1 && this.cds.s1 === 0) this.castSpell('s1');
                if (ctrl.s2 && this.cds.s2 === 0) this.castSpell('s2');
                if (ctrl.s3 && this.cds.s3 === 0) this.castSpell('s3');
                if (ctrl.ult && this.cds.ult === 0) this.castSpell('ult');
            }
        }

        // Ulti Seth (Grab en vol)
        if (this.sethGrabTarget) {
            this.sethGrabTarget.x = this.x;
            this.sethGrabTarget.y = this.y - 40;
            if (this.grounded && this.vy === 0) {
                this.sethGrabTarget.takeDamage(300, this);
                this.sethGrabTarget.stunTimer = 60;
                this.sethGrabTarget = null;
                this.actionLock = 0;
            }
        }
    }

    // --- LE CŒUR DU MOBA : LES COMPÉTENCES ---
    castSpell(slot) {
        let px = this.x + this.w/2; let py = this.y + this.h/2;
        
        // ==========================================
        // 1. SETH (Brawler)
        if (this.charType === 'seth') {
            if (slot === 'basic') { this.meleeAttack(50, 40); this.cds.basic = 30; }
            if (slot === 's1') { 
                projectiles.push(new Projectile(px, py, this.facing * 15, 0, this, 'hook', 40));
                this.cds.s1 = 300; 
            }
            if (slot === 'ult') {
                let hit = this.getEnemyInMeleeRange(60);
                if (hit) {
                    this.sethGrabTarget = hit;
                    this.vy = -20; // Super saut
                    this.actionLock = 100;
                    hit.stunTimer = 100;
                }
                this.cds.ult = 1200;
            }
        }

        // ==========================================
        // 2. TEEMO (Scout)
        if (this.charType === 'teemo') {
            if (slot === 'basic') { projectiles.push(new Projectile(px, py, this.facing * 12, 0, this, 'dart', 30)); this.cds.basic = 20; this.isInvisible = false; }
            if (slot === 's1') { this.isInvisible = true; this.cds.s1 = 600; } 
            if (slot === 's2') { projectiles.push(new Projectile(px, py, this.facing * 12, 0, this, 'silence', 20)); this.cds.s2 = 400; this.isInvisible = false;}
            if (slot === 's3') { this.cds.s3 = 400; }
            if (slot === 'ult') { 
                projectiles.push(new Projectile(px, py, this.facing * 5, 0, this, 'clone', 200));
                this.cds.ult = 900; this.isInvisible = false;
            }
        }

        // ==========================================
        // 3. ADC (Gunner)
        if (this.charType === 'gunner') {
            if (slot === 'basic') { projectiles.push(new Projectile(px, py, this.facing * 18, 0, this, 'bullet', 60)); this.cds.basic = 15; }
            if (slot === 's1') { projectiles.push(new Projectile(px, 440, 0, 0, this, 'mine', 100)); this.cds.s1 = 300; }
            if (slot === 's2') { 
                this.vx = -this.facing * 15; this.vy = -5;
                projectiles.push(new Projectile(px, py, this.facing * 10, 0, this, 'net', 40));
                this.cds.s2 = 420;
            }
            if (slot === 'ult') {
                this.actionLock = 60; // Channeling
                setTimeout(() => {
                    if(this.isDead || this.stunTimer > 0) return;
                    projectiles.push(new Projectile(px, py, this.facing * 25, 0, this, 'laser', 300));
                }, 1000);
                this.cds.ult = 1200;
            }
        }

        // ==========================================
        // 4. TANK (Slime)
        if (this.charType === 'slime') {
            let dmgScaling = (this.maxHp - this.hp) * 0.1;
            
            if (slot === 'basic') { this.meleeAttack(40 + dmgScaling, 50); this.cds.basic = 40; }
            if (slot === 's1') { 
                this.takeDamage(100, this); 
                projectiles.push(new Projectile(px, py, this.facing * 10, 0, this, 'slimeball', 150 + dmgScaling));
                items.push({x: this.x - 50, y: 430, type: 'slimechunk'});
                this.cds.s1 = 200;
            }
            if (slot === 'ult') {
                this.maxHp += 200; this.hp += 500; this.armor += 20;
                if(this.hp > this.maxHp) this.hp = this.maxHp;
                this.w += 10; this.h += 10;
                this.cds.ult = 1800;
            }
        }

        // ==========================================
        // 5. MAGE
        if (this.charType === 'mage') {
            if (slot === 'basic') { 
                projectiles.push(new Projectile(px, py, this.facing * 10, 0, this, 'magic', 45)); 
                this.cds.basic = 25; 
            }
            if (slot === 's1') { projectiles.push(new Projectile(px, py, this.facing * 8, 0, this, 'stunball', 30)); this.cds.s1 = 400; }
            if (slot === 's2') { projectiles.push(new Projectile(px, py, this.facing * 6, 0, this, 'megaball', 150)); this.cds.s2 = 480; }
            if (slot === 'ult') {
                this.actionLock = 30;
                players.forEach(p => {
                    if (p !== this && p.y > this.y - 50 && p.y < this.y + 100) {
                        if ((this.facing === 1 && p.x > this.x) || (this.facing === -1 && p.x < this.x)) {
                            p.takeDamage(250, this);
                        }
                    }
                });
                this.cds.ult = 900;
            }
        }

        // ==========================================
        // 6. NINJA
        if (this.charType === 'ninja') {
            if (slot === 'basic') { this.meleeAttack(35, 40); this.cds.basic = 20; }
            
            if (slot === 's1') { 
                this.vx = this.facing * 20; this.actionLock = 15;
                projectiles.push(new Projectile(px, py, this.facing * 25, 0, this, 'kunai', 50));
                this.cds.s1 = 240;
            }
            if (slot === 's2') { 
                this.vx = this.facing * 25; this.actionLock = 10;
                let hit = this.getEnemyInMeleeRange(100);
                if(hit) { hit.takeDamage(40, this); hit.stunTimer = 60; }
                this.cds.s2 = 300;
            }
            if (slot === 's3') {
                if (!this.ninjaGhostPos) {
                    this.ninjaGhostPos = {x: this.x, y: this.y};
                    this.vx = this.facing * 15;
                    this.cds.s3 = 30; // Court CD
                } else {
                    this.x = this.ninjaGhostPos.x; this.y = this.ninjaGhostPos.y;
                    this.ninjaGhostPos = null;
                    this.cds.s3 = 400; // Vrai CD
                }
            }
            if (slot === 'ult') {
                let target = players.find(p => p !== this && !p.isDead && !p.isInvisible);
                if (target) {
                    this.x = target.x - (this.facing * 40);
                    this.y = target.y;
                    target.takeDamage(200, this);
                    target.vy = -15; // Bump
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
        let hitBoxCenter = this.x + (this.facing * range);
        return players.find(p => p !== this && !p.isDead && Math.abs(p.x - hitBoxCenter) < range);
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

// --- PROJECTILES ---
class Projectile {
    constructor(x, y, vx, vy, owner, type, dmg) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; 
        this.owner = owner; this.type = type; this.dmg = dmg;
        this.w = 15; this.h = 15; this.active = true;
        if(type === 'mine') { this.w = 20; this.h = 5; }
        if(type === 'laser') { this.w = 800; this.h = 20; }
        if(type === 'clone') { this.w = 50; this.h = 80; }
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if(this.x < -100 || this.x > 900) this.active = false;

        players.forEach(p => {
            if (p !== this.owner && !p.isDead && this.active) {
                if (this.x < p.x + p.w && this.x + this.w > p.x && this.y < p.y + p.h && this.y + this.h > p.y) {
                    
                    if(this.type === 'hook') { p.vx = -this.vx; p.stunTimer = 20; }
                    if(this.type === 'silence') { p.isSilenced = 120; }
                    if(this.type === 'stunball') { p.stunTimer = 90; }
                    if(this.type === 'net') { p.vx = this.vx; }
                    
                    p.takeDamage(this.dmg, this.owner);
                    
                    if(this.type !== 'laser') this.active = false;
                }
            }
        });

        ctx.fillStyle = this.owner.color;
        if(this.type === 'mine' && this.owner.id !== players[0].id) ctx.globalAlpha = 0;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.globalAlpha = 1;
    }
}

// --- GESTION DU JEU ---
function chooseChar(type) {
    locSelections.push(type);
    document.getElementById('instruction-title').innerText = "Sélection Joueur 2";
    if (locSelections.length === 2) {
        document.getElementById('char-select').style.display = 'none';
        document.getElementById('start-local-btn').style.display = 'block';
    }
}

function startLocalGame() {
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'grid';
    
    players = [
        new Player(1, 150, locSelections[0]),
        new Player(2, 600, locSelections[1])
    ];

    document.getElementById('p1-name').innerText = players[0].name;
    document.getElementById('p2-name').innerText = players[1].name;
    document.getElementById('h1').style.display = 'block';
    document.getElementById('h2').style.display = 'block';

    gameActive = true;
    gameLoop();
}

function updateUI() {
    players.forEach(p => {
        let prefix = `p${p.id}`;
        let hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
        document.getElementById(`${prefix}-hp-bar`).style.width = `${hpPct}%`;
        document.getElementById(`${prefix}-hp-txt`).innerText = `${Math.floor(p.hp)} / ${p.maxHp}`;
        
        let cdKeys = ['s1', 's2', 's3', 'ult'];
        cdKeys.forEach((key, idx) => {
            let box = document.getElementById(`${prefix}-cd${idx < 3 ? idx+1 : ''}`);
            if(box) {
                if(p.cds[key] === 0) box.classList.add('ready');
                else box.classList.remove('ready');
            }
        });
        let ultBox = document.getElementById(`${prefix}-ult`);
        if(p.cds.ult === 0) ultBox.classList.add('ready'); else ultBox.classList.remove('ready');
    });
}

function checkWin() {
    let alive = players.filter(p => !p.isDead);
    if(alive.length <= 1) {
        gameActive = false;
        document.getElementById('game-over-overlay').style.display = 'flex';
        document.getElementById('winner-text').innerText = alive.length === 1 ? `VICTOIRE DE ${alive[0].name.toUpperCase()} !` : "MATCH NUL !";
        document.getElementById('winner-text').style.color = alive.length === 1 ? alive[0].color : "white";
    }
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    players.forEach(p => { p.update(getCtrl(p.id)); p.draw(); });

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI*2); ctx.fill();
        players.forEach(p => {
            if(p.charType === 'slime' && Math.abs(p.x - it.x) < 30 && Math.abs(p.y - it.y) < 30) {
                p.hp += 50; if(p.hp > p.maxHp) p.hp = p.maxHp;
                items.splice(i, 1);
            }
        });
    }

    updateUI();
    requestAnimationFrame(gameLoop);
}
