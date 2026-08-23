// =========================================================
// 1. ANIMATION DES PARAMÈTRES ET TAILLES D'ÉCRAN
// =========================================================

const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = [
    '../img/settings1.png', 
    '../img/settings2.png', 
    '../img/settings3.png', 
    '../img/settings4.png', 
    '../img/settings5.png'
];
let hoverInterval; 
let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); 
    hoverInterval = null;
    if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) { 
        settingsBtnImg.src = '../img/setting.png'; 
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); 
    hoverInterval = null;
    if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { 
        if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; 
    }, 300);
}

// AJOUT CRUCIAL : Attacher les événements au bouton pour que l'animation se lance
if (settingsBtnImg) {
    settingsBtnImg.addEventListener('mouseenter', startSettingsAnim);
    settingsBtnImg.addEventListener('mouseleave', stopSettingsAnim);
    settingsBtnImg.addEventListener('click', clickSettingsAnim);
}

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('show');
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    let btnClassic = document.getElementById('btn-sz-classic');
    let btnWide = document.getElementById('btn-sz-wide');
    let btnFull = document.getElementById('btn-sz-full');

    if (size === 'classic') { 
        container.classList.add('size-classic'); 
        if(btnClassic) btnClassic.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'wide') { 
        container.classList.add('size-wide'); 
        if(btnWide) btnWide.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'full') { 
        container.classList.add('size-full'); 
        if(btnFull) btnFull.classList.add('active'); 
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); 
    }
}

function autoFullscreen() { 
    const container = document.getElementById('game-container');
    if (container && !container.classList.contains('size-full')) setGameSize('wide'); 
}

document.addEventListener('fullscreenchange', () => { 
    const container = document.getElementById('game-container');
    if (!document.fullscreenElement && container && container.classList.contains('size-full')) {
        setGameSize('wide'); 
    }
});


// =========================================================
// 2. GESTION DES MODES DE JEU ET MENUS
// =========================================================

let selectedGameRule = 'nexus';
let locSelections = [];
let killsBlue = 0;
let killsRed = 0;
window.currentIsBot = window.currentIsBot || false; 

function openMenu(type) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-mode-menu').style.display = 'none';
    document.getElementById('local-menu').style.display = 'none';

    if (type === 'mode-select') {
        document.getElementById('game-mode-menu').style.display = 'flex';
    } else if (type === 'local') {
        document.getElementById('local-menu').style.display = 'flex';
    }
}

function selectBattleRule(rule, element) {
    selectedGameRule = rule;
    document.querySelectorAll('.card-mode').forEach(c => c.classList.remove('selected'));
    if(element) element.classList.add('selected');
}

function goToCharSelect() {
    document.getElementById('game-mode-menu').style.display = 'none';
    document.getElementById('local-menu').style.display = 'flex';
    document.getElementById('instruction-title').innerText = "Sélectionne ton Champion (J1)";
    locSelections = [];
    document.getElementById('start-local-btn').style.display = 'none';
    document.getElementById('char-select').style.display = 'grid';
}

function handleRestart() { 
    location.reload(); 
}

function prepareNetwork(mode) { 
    document.getElementById('main-menu').style.display = 'none'; 
    document.getElementById('network-menu').style.display = 'flex'; 
}

function selectNetChar(char, el) { 
    document.querySelectorAll('#net-char-grid .card').forEach(c => c.classList.remove('selected')); 
    if(el) el.classList.add('selected'); 
    let nameEl = document.getElementById('net-char-name'); 
    if(nameEl) nameEl.innerText = char.toUpperCase(); 
}

function hostGame() { 
    document.getElementById('my-id').innerText = "SERVEUR ARAM"; 
    document.getElementById('host-btn').style.display = 'none'; 
    document.getElementById('start-net-btn').style.display = 'inline-block'; 
}

function joinGame() { alert("Mode Réseau en maintenance. Teste le mode Local !"); }
function startNetworkGameHost() { alert("Mode Réseau en maintenance. Teste le mode Local !"); }


// =========================================================
// 3. MOTEUR DU MOBA ET PIERRE FEUILLE CISEAUX
// =========================================================

const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

const MAP_WIDTH = 3500; 
const MAP_HEIGHT = 1000;
const mapImg = new Image(); 
mapImg.src = 'assets/mapsol.png';

const PLAYABLE_X_MIN = 120; 
const PLAYABLE_X_MAX = 3380;
const PLAYABLE_Y_MIN = 260; 
const PLAYABLE_Y_MAX = 740; 

const PUDDLES = [
    { xMin: 780, xMax: 1080, yMin: 220, yMax: 330 }, 
    { xMin: 1150, xMax: 1800, yMin: 220, yMax: 330 },
    { xMin: 2250, xMax: 2650, yMin: 220, yMax: 330 }, 
    { xMin: 2850, xMax: 3150, yMin: 220, yMax: 330 },
    { xMin: 730, xMax: 1080, yMin: 670, yMax: 780 }, 
    { xMin: 1200, xMax: 1800, yMin: 670, yMax: 780 },
    { xMin: 2200, xMax: 2950, yMin: 670, yMax: 780 }, 
    { xMin: 3100, xMax: 3380, yMin: 670, yMax: 780 }
];

const skins = {};
const skinFiles = [
    'adcnorth', 'adcouest', 'adcsud', 'adcsudest', 'adcsudouest',
    'magenord', 'magenordest', 'mageouest', 'magesudouest', 'mangesud',
    'ninjanorth', 'ninjanorthouest', 'ninjaouest', 'ninjasud', 'ninjasudouest',
    'scoutnord', 'scoutnordouest', 'scoutouest', 'scoutsud', 'scoutsudouest',
    'setnord', 'setnordouest', 'setouest', 'setsouthest', 'setsud'
];

skinFiles.forEach(file => { 
    skins[file] = new Image(); 
    skins[file].src = `assets/skins/${file}.png`; 
});

let CAMERA_ZOOM = 1.0; 
let cameraX = 0; 
let cameraY = 0;
let mouseX = 0; 
let mouseY = 0; 
let worldMouseX = 0; 
let worldMouseY = 0;

let gameActive = false;
let players = []; 
let turrets = []; 
let nexuses = []; 
let projectiles = []; 
let clickMarkers = [];

// QWERTY par défaut dans le code
let keyboardKeys = { s1: 'q', s2: 'w', ult: 'e' };
let pendingSpell = null; 
let hoveredEnemy = null; 

let layoutSelect = document.getElementById('keyboard-layout');
if(layoutSelect) {
    layoutSelect.addEventListener('change', (e) => {
        let isQwerty = e.target.value === 'qwerty';
        keyboardKeys = isQwerty ? { s1: 'q', s2: 'w', ult: 'e' } : { s1: 'a', s2: 'z', ult: 'e' };
        document.getElementById('key-s1').innerText = keyboardKeys.s1.toUpperCase();
        document.getElementById('key-s2').innerText = keyboardKeys.s2.toUpperCase();
        document.getElementById('key-ult').innerText = keyboardKeys.ult.toUpperCase();
    });
}

const spellDescriptions = {
    ninja: { s1: "Lancer de Shuriken", s2: "Dash Assassin", ult: "Exécution Ciblée" },
    gunner: { s1: "Tir Pénétrant", s2: "Mine Explosive", ult: "Rayon Laser Géant" },
    slime: { s1: "Jet d'Acide", s2: "Soin & Bouclier", ult: "Tsunami Toxique" },
    seth: { s1: "Coup de Zone", s2: "Charge Lourde", ult: "Saut Destructeur" },
    mage: { s1: "Boule de Feu", s2: "Téléportation (TP)", ult: "Trou Noir" },
    teemo: { s1: "Fléchette Rapide", s2: "Sprint (+Vitesse)", ult: "Piège Toxique" }
};

window.addEventListener('wheel', e => {
    if(!gameActive) return;
    let zoomAmount = 0.1;
    
    if(e.deltaY > 0) {
        CAMERA_ZOOM = Math.max(0.6, CAMERA_ZOOM - zoomAmount);
    } else {
        CAMERA_ZOOM = Math.min(2.2, CAMERA_ZOOM + zoomAmount);
    }
    
    worldMouseX = (mouseX / CAMERA_ZOOM) + cameraX;
    worldMouseY = (mouseY / CAMERA_ZOOM) + cameraY;
});

window.addEventListener('mousemove', e => {
    mouseX = e.clientX; 
    mouseY = e.clientY;
    worldMouseX = (mouseX / CAMERA_ZOOM) + cameraX;
    worldMouseY = (mouseY / CAMERA_ZOOM) + cameraY;

    hoveredEnemy = null;
    if (gameActive && players.length > 0 && !players[0].isDead && !pendingSpell) {
        let enemies = [...players, ...turrets, ...nexuses].filter(ent => ent.team !== players[0].team && !ent.isDead);
        for (let ent of enemies) {
            if(ent.currentPuddle !== -1 && ent.revealTimer === 0 && ent.currentPuddle !== players[0].currentPuddle) continue;
            
            if(Math.hypot(worldMouseX - ent.x, worldMouseY - ent.y) < ent.radius + 40) { 
                hoveredEnemy = ent; 
                break; 
            }
        }
    }
});

canvas.addEventListener('mousedown', e => {
    if(!gameActive || (players[0] && players[0].isDead)) return;

    if (e.button === 0) { // CLIC GAUCHE
        if (pendingSpell) {
            players[0].castSpell(pendingSpell, worldMouseX, worldMouseY);
            pendingSpell = null; 
            updateSpellUI();
            return;
        }
        
        if (hoveredEnemy) {
            players[0].autoAttackTarget = hoveredEnemy; 
            players[0].target = null; 
            clickMarkers.push({x: hoveredEnemy.x, y: hoveredEnemy.y, life: 20, color: '#ff007f'});
        }
    }

    if (e.button === 2) { // CLIC DROIT
        pendingSpell = null; 
        updateSpellUI();
        
        if (hoveredEnemy) {
            players[0].autoAttackTarget = hoveredEnemy; 
            players[0].target = null; 
            clickMarkers.push({x: hoveredEnemy.x, y: hoveredEnemy.y, life: 20, color: '#ff007f'});
        } else {
            players[0].autoAttackTarget = null; 
            players[0].setMovementTarget(worldMouseX, worldMouseY);
            clickMarkers.push({x: worldMouseX, y: worldMouseY, life: 20, color: '#00f0ff'});
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
    if(!gameActive || (players[0] && players[0].isDead)) return;
    let key = e.key.toLowerCase();
    
    // NOUVEAU : TOUCHE ESPACE POUR ATTAQUER LE PLUS PROCHE
    if (key === ' ') {
        e.preventDefault(); // Bloque le scroll de la page
        let closest = players[0].getClosestEnemy(players[0].x, players[0].y);
        if (closest) {
            players[0].autoAttackTarget = closest;
            players[0].target = null;
            clickMarkers.push({x: closest.x, y: closest.y, life: 20, color: '#ff007f'});
        }
        return;
    }

    let chosenSlot = null;
    if(key === keyboardKeys.s1) chosenSlot = 's1';
    if(key === keyboardKeys.s2) chosenSlot = 's2';
    if(key === keyboardKeys.ult) chosenSlot = 'ult';

    if (chosenSlot) {
        if (players[0].cds[chosenSlot] === 0 && players[0].stunTimer === 0) {
            pendingSpell = (pendingSpell === chosenSlot) ? null : chosenSlot; 
            updateSpellUI();
        }
    }
});

window.prepareSpell = function(slot) {
    if(players[0] && players[0].cds[slot] === 0 && players[0].stunTimer === 0 && !players[0].isDead) {
        pendingSpell = slot; 
        updateSpellUI();
    }
};

const charData = {
    seth: { name: "Seth", role: "bruiser", color: '#ff007f', hp: 1600, speed: 5.2, radius: 25, range: 120 },
    slime: { name: "Slime", role: "bruiser", color: '#00ffcc', hp: 2200, speed: 4.8, radius: 30, range: 350 },
    ninja: { name: "Ninja", role: "assassin", color: '#00f0ff', hp: 950, speed: 8.5, radius: 22, range: 120 },
    mage: { name: "Mage", role: "assassin", color: '#9d00ff', hp: 850, speed: 6.5, radius: 22, range: 450 },
    gunner: { name: "ADC", role: "marksman", color: '#ffbf00', hp: 800, speed: 6.0, radius: 22, range: 500 }, // RANGE 500
    teemo: { name: "Scout", role: "marksman", color: '#39ff14', hp: 850, speed: 7.2, radius: 20, range: 450 }
};

// =========================================================
// 4. ENTITÉS DU JEU
// =========================================================

class Nexus {
    constructor(team, x, y, color) {
        this.team = team; 
        this.x = x; 
        this.y = y; 
        this.role = "building";
        this.radius = 70; 
        this.maxHp = 4500; 
        this.hp = this.maxHp;
        this.color = color; 
        this.isDead = false; 
        this.pulse = 0;
    }
    
    update() { 
        this.pulse += 0.05; 
    }
    
    draw() {
        if (this.isDead) return;
        
        ctx.save(); 
        ctx.translate(this.x, this.y);
        
        ctx.beginPath(); 
        ctx.arc(0, 0, this.radius + Math.sin(this.pulse) * 8, 0, Math.PI*2); 
        ctx.fillStyle = this.team === 1 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)'; 
        ctx.fill();
        
        ctx.beginPath(); 
        ctx.moveTo(0, -this.radius); 
        ctx.lineTo(this.radius * 0.7, 0); 
        ctx.lineTo(0, this.radius); 
        ctx.lineTo(-this.radius * 0.7, 0); 
        ctx.closePath();
        
        ctx.fillStyle = this.color; 
        ctx.shadowBlur = 25; 
        ctx.shadowColor = this.color; 
        ctx.fill(); 
        ctx.lineWidth = 4; 
        ctx.strokeStyle = '#fff'; 
        ctx.stroke(); 
        ctx.shadowBlur = 0; 
        ctx.restore();
        
        ctx.fillStyle = '#222'; 
        ctx.fillRect(this.x - 50, this.y - 95, 100, 10); 
        ctx.fillStyle = this.color; 
        ctx.fillRect(this.x - 50, this.y - 95, 100 * (this.hp / this.maxHp), 10); 
        ctx.strokeStyle = '#000'; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(this.x - 50, this.y - 95, 100, 10);
    }
    
    takeDamage(amount, attacker) {
        if (selectedGameRule === 'nexus') { 
            let alliedTurret = turrets.find(t => t.team === this.team && !t.isDead); 
            if (alliedTurret) return; 
        }
        
        if (this.isDead) return; 
        this.hp -= amount; 
        if (this.hp <= 0) { 
            this.hp = 0; 
            this.isDead = true; 
            checkWin(); 
        }
    }
}

class Turret {
    constructor(id, team, x, y, color) {
        this.id = id; 
        this.team = team; 
        this.x = x; 
        this.y = y; 
        this.role = "building";
        this.radius = 45; 
        this.maxHp = 2500; 
        this.hp = this.maxHp;
        this.color = color; 
        this.isDead = false; 
        this.range = 500; // RANGE ÉGAL À L'ADC (500)
        this.attackTimer = 0;
    }
    
    update() {
        if(this.isDead) return;
        
        if(this.attackTimer > 0) this.attackTimer--;
        
        let target = null; 
        let minDist = this.range;
        
        players.forEach(p => {
            if(!p.isDead && p.team !== this.team) {
                if(p.currentPuddle !== -1 && p.revealTimer === 0) return;
                let d = Math.hypot(p.x - this.x, p.y - this.y);
                if(d < minDist) { 
                    minDist = d; 
                    target = p; 
                }
            }
        });
        
        if(target && this.attackTimer === 0) { 
            projectiles.push(new Projectile(this.x, this.y, 0, 0, this, 120, 14, target, this.range / 12, this.color)); 
            this.attackTimer = 60; 
        }
    }
    
    draw() {
        if(this.isDead) return;
        
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); 
        ctx.fillStyle = '#222'; 
        ctx.fill(); 
        ctx.lineWidth = 4; 
        ctx.strokeStyle = this.color; 
        ctx.stroke();
        
        ctx.fillStyle = '#111'; 
        ctx.fillRect(this.x - 40, this.y - 70, 80, 8); 
        ctx.fillStyle = this.color; 
        ctx.fillRect(this.x - 40, this.y - 70, 80 * (this.hp / this.maxHp), 8); 
        ctx.strokeStyle = '#000'; 
        ctx.strokeRect(this.x - 40, this.y - 70, 80, 8);
    }
    
    takeDamage(amount, attacker) {
        if (this.isDead) return; 
        this.hp -= amount; 
        if (this.hp <= 0) { 
            this.hp = 0; 
            this.isDead = true; 
            checkWin(); 
        }
    }
}

class Player {
    constructor(id, team, x, y, type, isAI = false) {
        this.id = id; 
        this.team = team; 
        this.spawnX = x; 
        this.spawnY = y;
        this.x = x; 
        this.y = y; 
        
        this.charType = type; 
        this.color = charData[type].color; 
        this.role = charData[type].role;
        this.baseSpeed = charData[type].speed; 
        this.radius = charData[type].radius;
        this.attackRange = charData[type].range;
        this.maxHp = charData[type].hp; 
        this.hp = this.maxHp; 
        this.shield = 0;
        
        this.isAI = isAI; 
        this.target = null; 
        this.autoAttackTarget = null; 
        this.angle = 0;
        this.cds = { basic: 0, s1: 0, s2: 0, ult: 0 };
        
        this.stunTimer = 0; 
        this.actionLock = 0; 
        this.isDead = false; 
        this.respawnTimer = 0;
        
        this.currentPuddle = -1; 
        this.revealTimer = 0;
        this.speedBuff = 0;
        this.attackAnim = 0; 
    }

    setMovementTarget(tx, ty) { 
        this.target = { x: tx, y: ty }; 
    }

    clampPosition() {
        this.x = Math.max(PLAYABLE_X_MIN + this.radius, Math.min(PLAYABLE_X_MAX - this.radius, this.x));
        this.y = Math.max(PLAYABLE_Y_MIN + this.radius, Math.min(PLAYABLE_Y_MAX - this.radius, this.y));
    }

    update() {
        if (this.isDead) { 
            this.respawnTimer--; 
            if (this.respawnTimer <= 0) { 
                this.respawn(); 
            } 
            return; 
        }

        for(let key in this.cds) {
            if(this.cds[key] > 0) this.cds[key]--;
        }
        
        if(this.stunTimer > 0) this.stunTimer--; 
        if(this.actionLock > 0) this.actionLock--;
        if(this.revealTimer > 0) this.revealTimer--; 
        if(this.speedBuff > 0) this.speedBuff--;
        if(this.attackAnim > 0) this.attackAnim--;

        if (this.autoAttackTarget) {
            if(this.autoAttackTarget.isDead) { 
                this.autoAttackTarget = null; 
            } else {
                let dx = this.autoAttackTarget.x - this.x; 
                let dy = this.autoAttackTarget.y - this.y;
                let dist = Math.hypot(dx, dy); 
                
                this.angle = Math.atan2(dy, dx); 
                
                if (dist > this.attackRange) { 
                    this.target = { x: this.autoAttackTarget.x, y: this.autoAttackTarget.y }; 
                } else { 
                    this.target = null; 
                    if (this.cds.basic === 0) { 
                        this.castSpell('basic', this.autoAttackTarget.x, this.autoAttackTarget.y); 
                    } 
                }
            }
        }

        if (this.target && this.stunTimer === 0 && this.actionLock === 0) {
            let dx = this.target.x - this.x; 
            let dy = this.target.y - this.y;
            let dist = Math.hypot(dx, dy); 
            this.angle = Math.atan2(dy, dx);
            
            let currentSpeed = this.speedBuff > 0 ? this.baseSpeed * 1.5 : this.baseSpeed;
            
            if (dist > currentSpeed) { 
                this.x += (dx / dist) * currentSpeed; 
                this.y += (dy / dist) * currentSpeed; 
            } else { 
                this.x = this.target.x; 
                this.y = this.target.y; 
                this.target = null; 
            }
        }

        this.clampPosition();

        this.currentPuddle = -1;
        for (let i = 0; i < PUDDLES.length; i++) {
            let p = PUDDLES[i];
            if (this.x >= p.xMin && this.x <= p.xMax && this.y >= p.yMin && this.y <= p.yMax) { 
                this.currentPuddle = i; 
                break; 
            }
        }
    }

    getSkinFrame(octant) {
        let key = null; 
        let flip = false;
        
        switch(this.charType) {
            case 'ninja':
                if(octant===0) { key = 'ninjaouest'; flip = true; } 
                if(octant===1) { key = 'ninjasudouest'; flip = true; }
                if(octant===2) { key = 'ninjasud'; flip = false; } 
                if(octant===3) { key = 'ninjasudouest'; flip = false; }
                if(octant===4) { key = 'ninjaouest'; flip = false; } 
                if(octant===5) { key = 'ninjanorthouest'; flip = false; }
                if(octant===6) { key = 'ninjanorth'; flip = false; } 
                if(octant===7) { key = 'ninjanorthouest'; flip = true; } 
                break;
            case 'teemo':
                if(octant===0) { key = 'scoutouest'; flip = true; } 
                if(octant===1) { key = 'scoutsudouest'; flip = true; }
                if(octant===2) { key = 'scoutsud'; flip = false; } 
                if(octant===3) { key = 'scoutsudouest'; flip = false; }
                if(octant===4) { key = 'scoutouest'; flip = false; } 
                if(octant===5) { key = 'scoutnordouest'; flip = false; }
                if(octant===6) { key = 'scoutnord'; flip = false; } 
                if(octant===7) { key = 'scoutnordouest'; flip = true; } 
                break;
            case 'seth':
                if(octant===0) { key = 'setouest'; flip = true; } 
                if(octant===1) { key = 'setsouthest'; flip = false; } 
                if(octant===2) { key = 'setsud'; flip = false; } 
                if(octant===3) { key = 'setsouthest'; flip = true; } 
                if(octant===4) { key = 'setouest'; flip = false; } 
                if(octant===5) { key = 'setnordouest'; flip = false; }
                if(octant===6) { key = 'setnord'; flip = false; } 
                if(octant===7) { key = 'setnordouest'; flip = true; } 
                break;
            case 'gunner':
                if(octant===0) { key = 'adcouest'; flip = true; } 
                if(octant===1) { key = 'adcsudest'; flip = false; }
                if(octant===2) { key = 'adcsud'; flip = false; } 
                if(octant===3) { key = 'adcsudouest'; flip = false; }
                if(octant===4) { key = 'adcouest'; flip = false; } 
                if(octant===5) { key = 'adcouest'; flip = false; } 
                if(octant===6) { key = 'adcnorth'; flip = false; } 
                if(octant===7) { key = 'adcouest'; flip = true; } 
                break;
            case 'mage':
                if(octant===0) { key = 'mageouest'; flip = false; } 
                if(octant===1) { key = 'magesudouest'; flip = false; } 
                if(octant===2) { key = 'mangesud'; flip = false; } 
                if(octant===3) { key = 'magesudouest'; flip = true; }
                if(octant===4) { key = 'mageouest'; flip = true; } 
                if(octant===5) { key = 'magenordest'; flip = true; } 
                if(octant===6) { key = 'magenord'; flip = false; } 
                if(octant===7) { key = 'magenordest'; flip = false; } 
                break;
        }
        return { key, flip };
    }

    draw() {
        if (this.isDead) return;

        let alpha = 1.0; 
        
        if (this.currentPuddle !== -1 && this.revealTimer === 0) {
            if (this.id === 1) { 
                alpha = 0.4; 
            } else { 
                let p1Puddle = players[0].currentPuddle; 
                if (p1Puddle === this.currentPuddle) alpha = 0.4; 
                else alpha = 0.0; 
            }
        }

        if (alpha <= 0) return;

        ctx.save(); 
        ctx.globalAlpha = alpha; 
        ctx.translate(this.x, this.y);

        ctx.save(); 
        
        let pushForward = 0;
        if (this.attackAnim > 0) {
            pushForward = Math.sin((this.attackAnim / 15) * Math.PI) * 15; 
        }
        ctx.translate(Math.cos(this.angle) * pushForward, Math.sin(this.angle) * pushForward);

        if (this.target && this.stunTimer === 0 && this.actionLock === 0) {
            let squash = Math.sin(Date.now() / 80) * 0.08;
            ctx.scale(1 + squash, 1 - squash);
        }

        if (this.charType !== 'slime') {
            let deg = (this.angle * 180 / Math.PI + 360) % 360; 
            let octant = Math.floor((deg + 22.5) / 45) % 8; 
            let frame = this.getSkinFrame(octant); 
            let img = frame ? skins[frame.key] : null;

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.save(); 
                if (frame.flip) ctx.scale(-1, 1);
                let drawSize = this.radius * 2.8; 
                ctx.drawImage(img, -drawSize/2, -drawSize/2, drawSize, drawSize); 
                ctx.restore();
            } else { 
                ctx.rotate(this.angle); 
                ctx.beginPath(); 
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2); 
                ctx.fillStyle = this.color; 
                ctx.fill(); 
            }
        } else {
            ctx.rotate(this.angle); 
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2); 
            ctx.fillStyle = this.color; 
            ctx.fill();
            ctx.lineWidth = 3; 
            ctx.strokeStyle = '#000'; 
            ctx.stroke(); 
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(this.radius - 10, -5, 15, 10);
        }

        ctx.restore(); // On restaure uniquement l'échelle et la rotation du perso pour que la vie reste droite !

        // === MODIFICATION ICI : On dessine la barre de vie AVANT de restaurer la position X/Y globale ===
        ctx.globalAlpha = alpha; 
        ctx.fillStyle = '#222'; 
        // Note qu'ici on remplace "this.x - 30" par "-30" car on est déjà translaté au centre du joueur !
        ctx.fillRect(-30, -this.radius - 20, 60, 8);
        
        if(this.shield > 0) { 
            ctx.fillStyle = '#00f0ff'; 
            ctx.fillRect(-30, -this.radius - 20, 60, 8); 
        } else { 
            ctx.fillStyle = (this.team === 1) ? '#39ff14' : '#ff007f'; 
            ctx.fillRect(-30, -this.radius - 20, 60 * (this.hp / this.maxHp), 8); 
        }
        
        ctx.textAlign = 'center'; 
        if (this.stunTimer > 0) { 
            ctx.fillStyle = "yellow"; 
            ctx.fillText("STUN", 0, -this.radius - 35); 
        }
        
        // Et maintenant on restaure pour revenir aux coordonnées globales
        ctx.restore(); 
    }

    castSpell(slot, targetX, targetY) {
        if(this.isDead || this.stunTimer > 0 || this.actionLock > 0 || this.cds[slot] > 0) return;
        
        this.revealTimer = 60; 
        this.target = null; 
        this.attackAnim = 15; 
        
        let dx = targetX - this.x; 
        let dy = targetY - this.y;
        let dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx); 
        dx /= dist; 
        dy /= dist; 

        if (slot === 'basic') {
            if(this.charType === 'ninja' || this.charType === 'seth') { 
                this.meleeAttack(45, this.attackRange); 
            } else {
                let speed = 25; 
                let lifeTime = this.attackRange / speed; 
                let bDmg = (this.charType === 'gunner') ? 35 : 50;
                // ON PASSE this.autoAttackTarget POUR QUE LE PROJECTILE CIBLE
                projectiles.push(new Projectile(this.x, this.y, dx*speed, dy*speed, this, bDmg, 8, this.autoAttackTarget, lifeTime, this.color)); 
            }
            this.cds.basic = (this.charType === 'gunner') ? 15 : 25;
            return;
        }

        let cooldown = 0;
        
        switch(this.charType) {
            case 'ninja':
                if(slot==='s1') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*22, dy*22, this, 95, 15, null, 400/22, this.color)); 
                    cooldown=120; 
                }
                if(slot==='s2') { 
                    this.x += dx*150; 
                    this.y += dy*150; 
                    this.clampPosition(); 
                    this.meleeAttack(70, 120); 
                    cooldown=300; 
                } 
                if(slot==='ult') { 
                    let t = this.getClosestEnemy(targetX, targetY); 
                    if(t) { 
                        this.x = t.x - dx*50; 
                        this.y = t.y - dy*50; 
                        this.clampPosition(); 
                        this.meleeAttack(300, 150); 
                        t.stunTimer = 60; 
                    } 
                    cooldown=900; 
                } 
                break;
            case 'gunner':
                if(slot==='s1') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*30, dy*30, this, 100, 12, null, 700/30, this.color)); 
                    cooldown=180; 
                } 
                if(slot==='s2') { 
                    projectiles.push(new Projectile(targetX, targetY, 0, 0, this, 150, 40, null, 300, '#ffbf00')); 
                    cooldown=400; 
                } 
                if(slot==='ult') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*35, dy*35, this, 400, 50, null, 800/35, '#ff0000')); 
                    cooldown=1000; 
                } 
                break;
            case 'slime':
                if(slot==='s1') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*15, dy*15, this, 80, 25, null, 400/15, this.color)); 
                    cooldown=150; 
                }
                if(slot==='s2') { 
                    this.hp = Math.min(this.maxHp, this.hp + 150); 
                    this.shield += 200; 
                    clickMarkers.push({x: this.x, y: this.y, life: 30, color: '#00ffcc', isExplosion: true}); 
                    cooldown=500; 
                } 
                if(slot==='ult') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*10, dy*10, this, 250, 100, null, 600/10, this.color)); 
                    cooldown=900; 
                } 
                break;
            case 'seth':
                if(slot==='s1') { 
                    this.meleeAttack(100, 200); 
                    clickMarkers.push({x: this.x, y: this.y, life: 20, color: this.color, isExplosion: true}); 
                    cooldown=250; 
                } 
                if(slot==='s2') { 
                    this.x += dx*150; 
                    this.y += dy*150; 
                    this.clampPosition(); 
                    this.meleeAttack(70, 120); 
                    cooldown=300; 
                } 
                if(slot==='ult') { 
                    let jumpDist = Math.min(300, dist); 
                    this.x += dx * jumpDist; 
                    this.y += dy * jumpDist; 
                    this.clampPosition(); 
                    this.meleeAttack(250, 200); 
                    clickMarkers.push({x: this.x, y: this.y, life: 30, color: this.color, isExplosion: true}); 
                    cooldown=1200; 
                } 
                break;
            case 'mage':
                if(slot==='s1') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*18, dy*18, this, 120, 20, null, 500/18, '#ff5500')); 
                    cooldown=180; 
                } 
                if(slot==='s2') { 
                    this.x = targetX; 
                    this.y = targetY; 
                    this.clampPosition(); 
                    clickMarkers.push({x: this.x, y: this.y, life: 15, color: '#9d00ff', isExplosion: true}); 
                    cooldown=400; 
                } 
                if(slot==='ult') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*5, dy*5, this, 450, 60, null, 700/5, '#330066')); 
                    cooldown=1100; 
                } 
                break;
            case 'teemo':
                if(slot==='s1') { 
                    projectiles.push(new Projectile(this.x, this.y, dx*22, dy*22, this, 80, 10, null, 500/22, this.color)); 
                    cooldown=120; 
                } 
                if(slot==='s2') { 
                    this.speedBuff = 180; 
                    cooldown=400; 
                } 
                if(slot==='ult') { 
                    projectiles.push(new Projectile(targetX, targetY, 0, 0, this, 300, 35, null, 1000, this.color)); 
                    cooldown=800; 
                } 
                break;
        }
        
        this.cds[slot] = cooldown; 
    }

    getClosestEnemy(tx, ty) {
        let target = null; 
        let minDist = Infinity;
        let targets = [...players, ...turrets, ...nexuses].filter(ent => ent.team !== this.team && !ent.isDead);
        
        targets.forEach(ent => { 
            let d = Math.hypot(ent.x - tx, ent.y - ty); 
            if(d < minDist) { 
                minDist = d; 
                target = ent; 
            } 
        });
        
        return target;
    }

    meleeAttack(dmg, range) {
        let hitX = this.x + Math.cos(this.angle) * (range/2);
        let hitY = this.y + Math.sin(this.angle) * (range/2);

        let targets = [...players, ...turrets, ...nexuses].filter(ent => ent.team !== this.team && !ent.isDead);
        targets.forEach(ent => {
            if (Math.hypot(ent.x - hitX, ent.y - hitY) < ent.radius + (range/2)) {
                ent.takeDamage(dmg, this); 
                clickMarkers.push({x: ent.x, y: ent.y, life: 10, color: '#fff', isExplosion: true});
            }
        });
        clickMarkers.push({x: hitX, y: hitY, life: 10, color: '#fff', isSlash: true, angle: this.angle});
    }

    takeDamage(amount, attacker) {
        if (this.isDead) return;

        let multiplier = 1.0; 
        let isCrit = false;
        
        if (attacker && attacker.role) {
            if (attacker.role === 'bruiser' && this.role === 'assassin') { multiplier = 1.30; isCrit = true; }
            if (attacker.role === 'assassin' && this.role === 'marksman') { multiplier = 1.30; isCrit = true; }
            if (attacker.role === 'marksman' && this.role === 'bruiser') { multiplier = 1.30; isCrit = true; }
            if (attacker.role === 'assassin' && this.role === 'bruiser') { multiplier = 0.80; }
            if (attacker.role === 'marksman' && this.role === 'assassin') { multiplier = 0.80; }
            if (attacker.role === 'bruiser' && this.role === 'marksman') { multiplier = 0.80; }
        }

        let finalDamage = amount * multiplier;
        
        if(this.shield > 0) { 
            this.shield -= finalDamage; 
            if(this.shield < 0) { 
                finalDamage = Math.abs(this.shield); 
                this.shield = 0; 
            } else {
                return;
            }
        }
        
        this.hp -= finalDamage;
        
        if (isCrit) { 
            clickMarkers.push({x: this.x, y: this.y - 40, life: 30, color: '#ffbf00', isText: true, text: "EFFICACE!"}); 
        }

        if (this.hp <= 0) { 
            this.hp = 0; 
            this.isDead = true; 
            this.respawnTimer = 240; 
            if (this.team === 1) killsRed++; else killsBlue++;
            updateScoreHUD(); 
            checkWin(); 
        }
    }

    respawn() {
        this.isDead = false; 
        this.hp = this.maxHp; 
        this.shield = 0;
        this.x = this.spawnX; 
        this.y = this.spawnY;
        this.target = null; 
        this.autoAttackTarget = null; 
        this.stunTimer = 0;
        clickMarkers.push({x: this.x, y: this.y, life: 30, color: this.color, isExplosion: true});
    }
}

class Projectile {
    constructor(x, y, vx, vy, owner, dmg, size=10, homingTarget=null, life=100, color='#fff') {
        this.x = x; 
        this.y = y; 
        this.vx = vx; 
        this.vy = vy; 
        this.owner = owner; 
        this.dmg = dmg; 
        this.radius = size;
        this.homingTarget = homingTarget; 
        this.active = true; 
        this.life = life; 
        this.color = color;
        this.hitTargets = []; // Enregistre les cibles déjà touchées (Pour le piercing)
    }
    
    update() {
        if(this.homingTarget && !this.homingTarget.isDead) {
            let dx = this.homingTarget.x - this.x; 
            let dy = this.homingTarget.y - this.y;
            let dist = Math.hypot(dx, dy); 
            if (dist > 0) {
                this.vx = (dx/dist) * 12; 
                this.vy = (dy/dist) * 12;
            }
        }

        this.x += this.vx; 
        this.y += this.vy; 
        this.life--;
        
        if(this.life <= 0 || this.x < PLAYABLE_X_MIN || this.x > PLAYABLE_X_MAX || this.y < PLAYABLE_Y_MIN - 50 || this.y > PLAYABLE_Y_MAX + 50) {
            this.active = false;
        }

        let targets = [...players, ...turrets, ...nexuses].filter(ent => ent.team !== this.owner.team && !ent.isDead);
        
        targets.forEach(ent => {
            if (this.active && !this.hitTargets.includes(ent) && Math.hypot(ent.x - this.x, ent.y - this.y) < ent.radius + this.radius) {
                
                // Si c'est une auto-attaque (homingTarget existe), elle ne touche QUE sa cible et meurt
                if (this.homingTarget) {
                    if (ent === this.homingTarget) {
                        ent.takeDamage(this.dmg, this.owner); 
                        this.active = false; 
                        clickMarkers.push({x: this.x, y: this.y, life: 15, color: this.owner.color, isExplosion: true});
                    }
                } else {
                    // Si c'est un SORT, il TRAVERSE et touche tous les ennemis sur son passage (Piercing)
                    ent.takeDamage(this.dmg, this.owner); 
                    this.hitTargets.push(ent);
                    clickMarkers.push({x: this.x, y: this.y, life: 15, color: this.owner.color, isExplosion: true});
                }
            }
        });

        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); 
        ctx.fillStyle = this.color; 
        ctx.fill();
    }
}

function updateBot(bot) {
    if (bot.isDead || bot.stunTimer > 0) return;
    
    let target = players[0]; 
    
    if (target.isDead) {
        let objTarget = turrets.find(t => t.team === 1 && !t.isDead) || nexuses.find(n => n.team === 1 && !n.isDead);
        if (objTarget) {
            let dist = Math.hypot(objTarget.x - bot.x, objTarget.y - bot.y);
            if (dist > bot.attackRange) { 
                bot.setMovementTarget(objTarget.x, objTarget.y); 
            } else { 
                bot.target = null; 
                bot.angle = Math.atan2(objTarget.y - bot.y, objTarget.x - bot.x); 
                if (bot.cds.basic === 0) {
                    bot.autoAttackTarget = objTarget; // Le bot cible le batiment !
                    bot.castSpell('basic', objTarget.x, objTarget.y); 
                }
            }
        }
        return;
    }

    let p1Visible = true;
    if (target.currentPuddle !== -1 && target.revealTimer === 0 && target.currentPuddle !== bot.currentPuddle) { 
        p1Visible = false; 
    }

    if (p1Visible) {
        let dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        
        if (dist > bot.attackRange) { 
            bot.setMovementTarget(target.x, target.y); 
        } else { 
            bot.target = null; 
            bot.angle = Math.atan2(target.y - bot.y, target.x - bot.x); 
        }
        
        if (dist <= bot.attackRange + 40 && bot.cds.basic === 0) { 
            bot.autoAttackTarget = target; // Le bot cible le joueur !
            bot.castSpell('basic', target.x, target.y); 
        }

        if (dist < 550) {
            if (bot.cds.s1 === 0 && Math.random() < 0.08) bot.castSpell('s1', target.x, target.y);
            else if (bot.cds.s2 === 0 && Math.random() < 0.05) bot.castSpell('s2', target.x, target.y);
            else if (bot.cds.ult === 0 && (target.hp < target.maxHp * 0.6 || Math.random() < 0.03)) bot.castSpell('ult', target.x, target.y);
        }
    } else {
        bot.target = null; 
    }
}

function chooseChar(type) {
    locSelections.push(type);
    
    if (window.currentIsBot) {
        let pool = ['ninja', 'gunner', 'slime', 'seth', 'mage', 'teemo'];
        let botChar = pool[Math.floor(Math.random() * pool.length)];
        locSelections.push(botChar);
        startLocalGame();
    } else {
        let title = document.getElementById('instruction-title');
        if(title) title.innerText = "Joueur 2 : Choisis ton Champion";
        
        if (locSelections.length === 2) {
            let cs = document.getElementById('char-select'); 
            let slb = document.getElementById('start-local-btn');
            if(cs) cs.style.display = 'none'; 
            if(slb) slb.style.display = 'block';
        }
    }
}

function updateScoreHUD() {
    let blueScoreEl = document.getElementById('score-team-blue'); 
    let redScoreEl = document.getElementById('score-team-red'); 
    let titleEl = document.getElementById('score-mode-title');
    
    if (selectedGameRule === '3kills') {
        titleEl.innerText = "PREMIER À 3 KILLS"; 
        blueScoreEl.innerText = `J1 : ${killsBlue} / 3`; 
        redScoreEl.innerText = `${window.currentIsBot ? 'IA' : 'J2'} : ${killsRed} / 3`;
    } else {
        titleEl.innerText = "DESTRUCTION DU NEXUS"; 
        blueScoreEl.innerText = `J1 : ${killsBlue} Kills`; 
        redScoreEl.innerText = `${window.currentIsBot ? 'IA' : 'J2'} : ${killsRed} Kills`;
    }
}

function startLocalGame() {
    let lm = document.getElementById('local-menu'); 
    let hud = document.getElementById('hud');
    
    if(lm) lm.style.display = 'none'; 
    if(hud) hud.style.display = 'flex';
    
    killsBlue = 0; 
    killsRed = 0; 
    updateScoreHUD();
    
    players = [
        new Player(1, 1, PLAYABLE_X_MIN + 300, MAP_HEIGHT / 2, locSelections[0], false),
        new Player(2, 2, PLAYABLE_X_MAX - 300, MAP_HEIGHT / 2, locSelections[1], window.currentIsBot)
    ];
    
    nexuses = [ 
        new Nexus(1, PLAYABLE_X_MIN + 60, MAP_HEIGHT / 2, '#00f0ff'), 
        new Nexus(2, PLAYABLE_X_MAX - 60, MAP_HEIGHT / 2, '#ff007f') 
    ];
    
    turrets = [ 
        new Turret(3, 1, PLAYABLE_X_MIN + 450, MAP_HEIGHT / 2, '#00f0ff'), 
        new Turret(4, 2, PLAYABLE_X_MAX - 450, MAP_HEIGHT / 2, '#ff007f') 
    ];

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
    
    ['s1', 's2', 'ult'].forEach(slot => {
        let box = document.getElementById(`spell-${slot}`); 
        if (!box) return;

        let cdText = box.querySelector('.cd-text');
        if (!cdText) {
            cdText = document.createElement('div');
            cdText.className = 'cd-text';
            cdText.style.position = 'absolute';
            cdText.style.fontSize = '2em';
            cdText.style.fontWeight = 'bold';
            cdText.style.color = '#fff';
            cdText.style.textShadow = '0 0 10px #ff007f, 0 0 5px #000';
            cdText.style.zIndex = '10';
            box.appendChild(cdText);
        }

        if(pendingSpell === slot) {
            box.classList.add('active'); 
        } else {
            box.classList.remove('active');
        }
        
        if(p.cds[slot] > 0) { 
            box.classList.remove('ready'); 
            box.classList.add('cooldown'); 
            cdText.innerText = Math.ceil(p.cds[slot] / 60); 
        } else { 
            box.classList.add('ready'); 
            box.classList.remove('cooldown'); 
            cdText.innerText = "";
        }
    });

    let bar = document.getElementById(`p1-hp-bar`); 
    let txt = document.getElementById(`p1-hp-txt`);
    if(bar) bar.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`; 
    if(txt) txt.innerText = `${Math.floor(p.hp)} / ${p.maxHp}`;
}

function checkWin() {
    let gameOver = false; 
    let winnerText = ""; 
    let subText = ""; 
    let winColor = "#fff";

    if (selectedGameRule === '3kills') {
        if (killsBlue >= 3) { 
            gameOver = true; winnerText = "VICTOIRE !"; subText = "Tu as obtenu 3 éliminations !"; winColor = "#39ff14"; 
        } else if (killsRed >= 3) { 
            gameOver = true; winnerText = "DÉFAITE !"; subText = "L'adversaire a atteint 3 éliminations."; winColor = "#ff007f"; 
        }
    } else {
        let nexus1Dead = nexuses[0].isDead; 
        let nexus2Dead = nexuses[1].isDead;
        
        if (nexus2Dead) { 
            gameOver = true; winnerText = "VICTOIRE ÉPIQUE !"; subText = "Le Nexus adverse a été pulvérisé !"; winColor = "#39ff14"; 
        } else if (nexus1Dead) { 
            gameOver = true; winnerText = "DÉFAITE !"; subText = "Ton Nexus a été détruit..."; winColor = "#ff007f"; 
        }
    }
    
    if (gameOver) {
        gameActive = false;
        let overlay = document.getElementById('game-over-overlay'); 
        let wtext = document.getElementById('winner-text'); 
        let stext = document.getElementById('winner-subtext');
        
        if(overlay) overlay.style.display = 'flex';
        if(wtext) { wtext.innerText = winnerText; wtext.style.color = winColor; }
        if(stext) stext.innerText = subText;
    }
}

function gameLoop() {
    if (!gameActive) return;

    const panSpeed = 20 / CAMERA_ZOOM; 
    const edgeSize = 50;
    
    if (mouseX < edgeSize) cameraX -= panSpeed; 
    if (mouseX > window.innerWidth - edgeSize) cameraX += panSpeed;
    if (mouseY < edgeSize) cameraY -= panSpeed; 
    if (mouseY > window.innerHeight - edgeSize) cameraY += panSpeed;

    cameraX = Math.max(0, Math.min(MAP_WIDTH - window.innerWidth / CAMERA_ZOOM, cameraX)); 
    cameraY = Math.max(0, Math.min(MAP_HEIGHT - window.innerHeight / CAMERA_ZOOM, cameraY));

    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.save(); 
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM); 
    ctx.translate(-cameraX, -cameraY);

    if (mapImg.complete && mapImg.naturalWidth > 0) {
        ctx.drawImage(mapImg, 0, 0, MAP_WIDTH, MAP_HEIGHT); 
    } else { 
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT); 
    }

    nexuses.forEach(n => { n.update(); n.draw(); }); 
    turrets.forEach(t => { t.update(); t.draw(); });

    if (hoveredEnemy && !hoveredEnemy.isDead && !pendingSpell) {
        ctx.beginPath(); 
        ctx.arc(hoveredEnemy.x, hoveredEnemy.y, hoveredEnemy.radius + 12, 0, Math.PI * 2); 
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)"; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        
        ctx.beginPath(); 
        ctx.arc(players[0].x, players[0].y, players[0].attackRange, 0, Math.PI * 2); 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; 
        ctx.setLineDash([5, 5]); 
        ctx.lineWidth = 1; 
        ctx.stroke(); 
        ctx.setLineDash([]);
    }
    
    let p1 = players[0];
    if (p1 && p1.autoAttackTarget && !p1.autoAttackTarget.isDead) {
        let t = p1.autoAttackTarget; 
        ctx.beginPath(); 
        ctx.arc(t.x, t.y, t.radius + 15, 0, Math.PI * 2); 
        ctx.strokeStyle = "#ff007f"; 
        ctx.setLineDash([5, 5]); 
        ctx.lineWidth = 2; 
        ctx.stroke(); 
        ctx.setLineDash([]);
    }

    if (pendingSpell && !players[0].isDead) {
        let charType = players[0].charType;
        let spellName = spellDescriptions[charType] ? spellDescriptions[charType][pendingSpell] : "Attaque";
        let dx = worldMouseX - players[0].x; 
        let dy = worldMouseY - players[0].y;
        let dist = Math.hypot(dx, dy) || 1;
        
        ctx.save();
        ctx.translate(players[0].x, players[0].y);
        ctx.rotate(Math.atan2(dy, dx));
        
        if ((charType === 'mage' && pendingSpell === 's2') || (charType === 'seth' && pendingSpell === 'ult')) {
            let range = charType === 'mage' ? 400 : 300;
            let actualDist = Math.min(dist, range);
            ctx.beginPath(); 
            ctx.arc(actualDist, 0, charType === 'mage' ? 30 : 125, 0, Math.PI*2);
            ctx.fillStyle = "rgba(255, 0, 127, 0.2)"; 
            ctx.fill();
            ctx.lineWidth = 2; 
            ctx.strokeStyle = "#ff007f"; 
            ctx.stroke();
        } else {
            let spellRange = players[0].attackRange + 200; 
            ctx.fillStyle = "rgba(0, 240, 255, 0.1)"; 
            ctx.fillRect(0, -15, spellRange, 30);
            ctx.lineWidth = 2; 
            ctx.strokeStyle = "rgba(0, 240, 255, 0.5)"; 
            ctx.strokeRect(0, -15, spellRange, 30);
        }
        ctx.restore();

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; 
        ctx.fillRect(worldMouseX + 15, worldMouseY - 30, spellName.length * 8 + 30, 40);
        ctx.fillStyle = "#00f0ff"; 
        ctx.font = "bold 14px Arial"; 
        ctx.fillText(spellName, worldMouseX + 30 + (spellName.length * 4), worldMouseY - 5);
    }

    players[0].update(); 
    if (players[1]) {
        if (players[1].isAI) updateBot(players[1]);
        players[1].update();
    }
    
    players.forEach(p => p.draw());

    for (let i = clickMarkers.length - 1; i >= 0; i--) {
        let m = clickMarkers[i];
        if (m.isText) {
            ctx.fillStyle = m.color; 
            ctx.font = "bold 20px Arial"; 
            ctx.fillText(m.text, m.x, m.y - (30 - m.life)); 
        } else if (m.isSlash) {
            ctx.save(); 
            ctx.translate(m.x, m.y); 
            ctx.rotate(m.angle); 
            ctx.beginPath(); 
            ctx.arc(0, 0, 40, -Math.PI/3, Math.PI/3); 
            ctx.strokeStyle = `rgba(255, 255, 255, ${m.life / 10})`; 
            ctx.lineWidth = 10; 
            ctx.stroke(); 
            ctx.restore();
        } else {
            ctx.beginPath(); 
            ctx.arc(m.x, m.y, 30 - m.life, 0, Math.PI*2); 
            ctx.strokeStyle = m.isExplosion ? m.color : (m.color === '#00f0ff' ? `rgba(0,240,255,${m.life/20})` : `rgba(255,0,127,${m.life/20})`); 
            ctx.lineWidth = m.isExplosion ? 4 : 2; 
            ctx.stroke();
        }
        m.life--; 
        if (m.life <= 0) clickMarkers.splice(i, 1);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(); 
        if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    ctx.restore(); 
    updateSpellUI(); 
    requestAnimationFrame(gameLoop);
}
