/* ==============================================================
   1. INIT & GESTION DE L'ÉCRAN
============================================================== */
const urlParams = new URLSearchParams(window.location.search);
const forceMode = urlParams.get('mode');

window.addEventListener('DOMContentLoaded', () => {
    if (forceMode === 'solo') {
        document.getElementById('net-button').style.display = 'none';
        document.getElementById('menu-separator').style.display = 'none';
    } else if (forceMode === 'multi') {
        document.getElementById('main-menu').style.display = 'none';
        showNetworkMenu();
    }
});

function autoFullscreen() {
    if (!document.getElementById('game-container').classList.contains('size-full')) {
        setGameSize('wide');
    }
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    const btns = document.querySelectorAll('.size-options .btn-size:not(#btn-lang-fr):not(#btn-lang-en)');
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

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) {
        setGameSize('wide');
    }
});

/* ==============================================================
   2. GESTION DES PARAMÈTRES ET DE LA LANGUE
============================================================== */
let currentLanguage = 'fr';

function setLanguage(lang) {
    currentLanguage = lang;
    const btnFr = document.getElementById('btn-lang-fr');
    const btnEn = document.getElementById('btn-lang-en');
    const hubImg = document.getElementById('hub-img');

    if (lang === 'fr') {
        btnFr.classList.add('active');
        btnEn.classList.remove('active');
        hubImg.src = '../img/retourhub.png';
    } else if (lang === 'en') {
        btnEn.classList.add('active');
        btnFr.classList.remove('active');
        hubImg.src = '../img/returbhub.png';
    }
}

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

/* ==============================================================
   3. GESTION AUDIO ET UTILITAIRES DE MOTEUR 
============================================================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
}
function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    let left = lineIntersectsLine(x1,y1,x2,y2, rx,ry,rx,ry+rh);
    let right = lineIntersectsLine(x1,y1,x2,y2, rx+rw,ry,rx+rw,ry+rh);
    let top = lineIntersectsLine(x1,y1,x2,y2, rx,ry,rx+rw,ry);
    let bottom = lineIntersectsLine(x1,y1,x2,y2, rx,ry+rh,rx+rw,ry+rh);
    return left || right || top || bottom || (x1 > rx && x1 < rx+rw && y1 > ry && y1 < ry+rh);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } 
    else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } 
    else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } 
    else if (type === 'bounce') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }
    else if (type === 'boss_spawn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(150, now + 1.0);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.5);
        osc.start(now); osc.stop(now + 1.5);
    }
}

let engineOsc = null; let engineGain = null; let isEngineRunning = false;
function updateEngineSound(isMoving) {
    if (audioCtx.state === 'suspended') return; 
    
    if (!engineOsc) {
        engineOsc = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        engineOsc.type = 'triangle'; 
        engineOsc.frequency.value = 35; 
        engineGain.gain.value = 0;
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
    }

    const now = audioCtx.currentTime;
    if (isMoving && !isEngineRunning) {
        isEngineRunning = true;
        engineOsc.frequency.setTargetAtTime(70, now, 0.2); 
        engineGain.gain.setTargetAtTime(0.08, now, 0.2); 
    } else if (!isMoving && isEngineRunning) {
        isEngineRunning = false;
        engineOsc.frequency.setTargetAtTime(35, now, 0.3); 
        engineGain.gain.setTargetAtTime(0.01, now, 0.3); 
    }
}

/* ==============================================================
   4. ASSETS ET CLASSES DU JEU
============================================================== */
const imgs = {};
const imgFiles = {
    'map': '../img/maptankslime.png',
    'obs1': '../img/obs1.png', 'obs2': '../img/obs2.png', 'obs3': '../img/obs3.png', 
    'obs4': '../img/obs4.png', 'obs5': '../img/obs5.png',
    'slime_bleu': '../img/slimebleu.png', 'slime_rouge': '../img/slimerouge.png', 'slime_noir': '../img/slimenoir.png'
};
Object.keys(imgFiles).forEach(k => { 
    imgs[k] = new Image(); 
    imgs[k].src = imgFiles[k]; 
});

let gameMode = 'solo_survival'; 
let gameActive = false; let loopRunning = false; let myTeam = 1; 
let peer = null, conn = null;
let tanks = [], bullets = [], particles = [], walls = [];
let wave = 1, p1Wins = 0, p2Wins = 0;

let keys = { w:false, a:false, s:false, d:false, arrowup:false, arrowleft:false, arrowdown:false, arrowright:false };
let mouse = { x: 400, y: 300, down: false };
let jMove = { x: 0, y: 0 }; 
let jAim = { x: 0, y: 0, firing: false };

class Tank {
    constructor(id, x, y, skin, color, team) {
        this.id = id; this.x = x; this.y = y; this.w = 48; this.h = 48;
        this.skin = skin; this.color = color; this.team = team;
        this.vx = 0; this.vy = 0; this.speed = 3.5;
        this.angle = 0; this.turretAngle = 0; 
        this.hp = 3; this.maxHp = 3; this.cd = 0; 
        this.isAI = false; this.isBoss = false;
    }
    update() {
        if (this.cd > 0) this.cd--;

        let nextX = this.x + this.vx; let nextY = this.y + this.vy;
        let collideX = false, collideY = false;
        
        for(let w of walls) {
            if (nextX + this.w/2 > w.x && nextX - this.w/2 < w.x + w.w && this.y + this.h/2 > w.y && this.y - this.h/2 < w.y + w.h) collideX = true;
            if (this.x + this.w/2 > w.x && this.x - this.w/2 < w.x + w.w && nextY + this.h/2 > w.y && nextY - this.h/2 < w.y + w.h) collideY = true;
        }

        if(nextX - this.w/2 < 0 || nextX + this.w/2 > canvas.width) collideX = true;
        if(nextY - this.h/2 < 0 || nextY + this.h/2 > canvas.height) collideY = true;

        if (!collideX) this.x = nextX;
        if (!collideY) this.y = nextY;
        if (this.vx !== 0 || this.vy !== 0) this.angle = Math.atan2(this.vy, this.vx);

        if (this.isAI && gameMode !== 'client') {
            let p1 = tanks.find(t => t.team !== this.team && t.hp > 0); 
            if(p1) {
                let isDuel = (gameMode === 'solo_1v1');
                let iq = isDuel ? 2.0 : Math.min(wave / 15, 1); 

                let dx = p1.x - this.x; let dy = p1.y - this.y;
                let dist = Math.hypot(dx, dy);
                let baseAngle = Math.atan2(dy, dx);
                
                let hasLOS = true;
                for(let w of walls) {
                    if (lineIntersectsRect(this.x, this.y, p1.x, p1.y, w.x, w.y, w.w, w.h)) {
                        hasLOS = false; break;
                    }
                }

                let aimJitter = isDuel ? 0 : 0.15 - (iq * 0.1); 
                if (hasLOS) { this.turretAngle = baseAngle + (Math.random() - 0.5) * aimJitter; } 
                else if (isDuel) { this.turretAngle = baseAngle + (Math.random() > 0.5 ? 0.7 : -0.7); } 
                else { this.turretAngle = baseAngle + (Math.random() - 0.5) * aimJitter; }

                let dodgeVx = 0; let dodgeVy = 0; let dodging = false;
                let dodgeRadius = 150 + (iq * 100); 
                
                for(let b of bullets) {
                    if (b.team !== this.team) {
                        let bx = b.x; let by = b.y;
                        let bDist = Math.hypot(bx - this.x, by - this.y);
                        
                        if (bDist < dodgeRadius) {
                            let bLen = Math.hypot(b.vx, b.vy);
                            let bdx = b.vx / bLen; let bdy = b.vy / bLen;
                            let tx = this.x - bx; let ty = this.y - by;
                            let dot = (tx * bdx + ty * bdy);
                            
                            if (dot > 0 && dot < dodgeRadius) {
                                let projX = bx + bdx * dot; let projY = by + bdy * dot;
                                let distToLine = Math.hypot(this.x - projX, this.y - projY);
                                if (distToLine < this.w * 1.5) {
                                    let cross = (tx * bdy - ty * bdx);
                                    let dodgeDir = Math.sign(cross) || 1;
                                    dodgeVx += -bdy * dodgeDir * this.speed * 2.5;
                                    dodgeVy += bdx * dodgeDir * this.speed * 2.5;
                                    dodging = true;
                                }
                            }
                        }
                    }
                }

                let safeDist = this.isBoss ? 150 : 250;
                if (isDuel) safeDist = 180; 

                if (dodging) {
                    this.vx = dodgeVx; this.vy = dodgeVy;
                } else {
                    if (!hasLOS && isDuel) {
                        this.vx = Math.cos(baseAngle) * this.speed * 0.9; this.vy = Math.sin(baseAngle) * this.speed * 0.9;
                    } else if (dist > safeDist) {
                        this.vx = Math.cos(baseAngle) * this.speed * 0.6; this.vy = Math.sin(baseAngle) * this.speed * 0.6;
                    } else if (dist < safeDist / 2) {
                        this.vx = -Math.cos(baseAngle) * this.speed * 0.6; this.vy = -Math.sin(baseAngle) * this.speed * 0.6;
                    } else {
                        if (isDuel) {
                            this.vx = -Math.sin(baseAngle) * this.speed * 0.8; this.vy = Math.cos(baseAngle) * this.speed * 0.8;
                        } else { this.vx = 0; this.vy = 0; }
                    }
                }
                
                for(let other of tanks) {
                    if (other !== this && other.hp > 0 && other.team === this.team) {
                        let odx = this.x - other.x; let ody = this.y - other.y;
                        let odist = Math.hypot(odx, ody);
                        let minSpace = (this.w/2 + other.w/2) + 15; 
                        if (odist < minSpace && odist > 0) {
                            let pushForce = (minSpace - odist) / minSpace;
                            this.vx += (odx / odist) * pushForce * 2; this.vy += (ody / odist) * pushForce * 2;
                        }
                    }
                }

                let avoidVx = 0; let avoidVy = 0; let margin = 25; 
                for(let w of walls) {
                    if (this.x + this.w/2 + margin > w.x && this.x - this.w/2 - margin < w.x + w.w &&
                        this.y + this.h/2 + margin > w.y && this.y - this.h/2 - margin < w.y + w.h) {
                        
                        let testX = this.x; let testY = this.y;
                        if (this.x < w.x) testX = w.x; else if (this.x > w.x + w.w) testX = w.x + w.w;
                        if (this.y < w.y) testY = w.y; else if (this.y > w.y + w.h) testY = w.y + w.h;
                        
                        let distX = this.x - testX; let distY = this.y - testY;
                        let distance = Math.hypot(distX, distY);
                        
                        if (distance < margin + this.w/2) {
                            if(distance === 0) { avoidVx += (Math.random()-0.5)*5; avoidVy += (Math.random()-0.5)*5; } 
                            else {
                                let push = (margin + this.w/2 - distance) / (margin + this.w/2);
                                avoidVx += (distX / distance) * this.speed * push * 3.5;
                                avoidVy += (distY / distance) * this.speed * push * 3.5;
                            }
                        }
                    }
                }
                this.vx += avoidVx; this.vy += avoidVy;

                let currentSpeed = Math.hypot(this.vx, this.vy);
                let maxSpeed = this.isBoss ? this.speed * 0.7 : this.speed * (isDuel ? 1.05 : 0.9);
                if (currentSpeed > maxSpeed) {
                    this.vx = (this.vx / currentSpeed) * maxSpeed; this.vy = (this.vy / currentSpeed) * maxSpeed;
                }

                let fireRate = (this.isBoss ? 0.03 : 0.015) + (iq * 0.02);
                if (isDuel) fireRate = 0.08; 
                
                if (this.cd === 0 && Math.random() < fireRate) shoot(this);
            }
        }
    }
    draw(ctx) {
        if(this.hp <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = this.isBoss ? 25 : 15; 
        ctx.shadowColor = this.color;
        ctx.rotate(this.turretAngle - Math.PI / 2);
        
        let img = imgs[this.skin];
        if (img && img.complete && img.naturalWidth !== 0) { ctx.drawImage(img, -this.w/2, -this.h/2, this.w, this.h); } 
        else {
            ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.beginPath(); ctx.rect(-this.w/2, -this.h/2, this.w, this.h); ctx.fill(); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(this.w/2, 0); ctx.lineTo(this.w/2 + 25, 0); ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(this.x - 20, this.y - this.h/2 - 12, 40, 5);
        ctx.fillStyle = this.color; ctx.fillRect(this.x - 20, this.y - this.h/2 - 12, 40 * (this.hp/this.maxHp), 5);
    }
}

class Bullet {
    constructor(x, y, angle, color, team) {
        this.x = x; this.y = y; this.vx = Math.cos(angle) * 8; this.vy = Math.sin(angle) * 8;
        this.color = color; this.team = team; this.bounces = 1; this.life = 300; this.history = []; 
    }
    update() {
        this.history.push({x: this.x, y: this.y}); if(this.history.length > 5) this.history.shift();
        let nextX = this.x + this.vx; let nextY = this.y + this.vy; let bounced = false;

        for(let w of walls) {
            if (nextX > w.x && nextX < w.x + w.w && nextY > w.y && nextY < w.y + w.h) {
                if (this.bounces > 0) {
                    let min = Math.min(Math.abs(nextX - w.x), Math.abs((w.x + w.w) - nextX), Math.abs(nextY - w.y), Math.abs((w.y + w.h) - nextY));
                    if (min === Math.abs(nextX - w.x) || min === Math.abs((w.x + w.w) - nextX)) this.vx *= -1; else this.vy *= -1;
                    this.bounces--; bounced = true; createParticles(this.x, this.y, this.color, 5); playSound('bounce'); 
                } else this.life = 0; 
            }
        }
        if(!bounced) {
            if (nextX < 0 || nextX > canvas.width) { if(this.bounces > 0){ this.vx *= -1; this.bounces--; playSound('bounce'); } else this.life = 0; }
            if (nextY < 0 || nextY > canvas.height) { if(this.bounces > 0){ this.vy *= -1; this.bounces--; playSound('bounce'); } else this.life = 0; }
        }

        this.x += this.vx; this.y += this.vy; this.life--;

        for(let t of tanks) {
            if (t.hp > 0 && t.team !== this.team) {
                let dist = Math.hypot(this.x - t.x, this.y - t.y);
                if (dist < (t.w/2 - 2)) { 
                    t.hp--; this.life = 0; createParticles(this.x, this.y, this.color, 15);
                    if(t.hp <= 0) { playSound('explosion'); handleKill(this.team, t.team); } 
                    else { playSound('hit'); }
                }
            }
        }
    }
    draw(ctx) {
        ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.beginPath();
        if(this.history.length > 0) { ctx.moveTo(this.history[0].x, this.history[0].y); for(let p of this.history) ctx.lineTo(p.x, p.y); }
        ctx.lineTo(this.x, this.y); ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; let angle = Math.random() * Math.PI * 2; let speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.color = color; this.life = 1.0; this.decay = Math.random() * 0.05 + 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw(ctx) { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fillRect(this.x, this.y, 4, 4); ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; }
}

function generateMap() {
    walls = [
        {x: 350, y: 250, w: 100, h: 100, img: 'obs5', rotated: false}, 
        {x: 150, y: 100, w: 50, h: 150, img: 'obs1', rotated: true},  
        {x: 600, y: 350, w: 50, h: 150, img: 'obs2', rotated: true},  
        {x: 150, y: 450, w: 150, h: 50, img: 'obs3', rotated: false}, 
        {x: 500, y: 100, w: 150, h: 50, img: 'obs4', rotated: false}  
    ];
}

function createParticles(x, y, color, count) { for(let i=0; i<count; i++) particles.push(new Particle(x, y, color)); }

function shoot(tank) {
    if (tank.cd <= 0 && tank.hp > 0) {
        playSound('shoot'); 
        let bx = tank.x + Math.cos(tank.turretAngle) * (tank.w/2 + 8);
        let by = tank.y + Math.sin(tank.turretAngle) * (tank.h/2 + 8);
        bullets.push(new Bullet(bx, by, tank.turretAngle, tank.color, tank.team));
        tank.cd = tank.isBoss ? 30 : 40; 
    }
}

/* ==============================================================
   5. LOGIQUE DU JEU (Vagues, Matchs, PVP)
============================================================== */
function handleKill(killerTeam, deadTeam) {
    if (!gameActive) return; 

    if (gameMode === 'solo_survival') {
        if (deadTeam === 2) {
            let aliveEnemies = tanks.filter(t => t.team === 2 && t.hp > 0).length;
            if (aliveEnemies === 0) { setTimeout(() => { if(gameActive) { wave++; spawnWave(wave); } }, 1000); }
        } else if (deadTeam === 1) {
            endGame(currentLanguage === 'fr' ? "DÉTRUIT" : "DESTROYED", (currentLanguage === 'fr' ? "Vagues Survéçues" : "Waves Survived") + ` : ${wave}`);
        }
    } else if (gameMode === 'solo_1v1') {
        if (deadTeam === 1) endGame(currentLanguage === 'fr' ? "DÉFAITE" : "DEFEAT", currentLanguage === 'fr' ? "Le Bot a été plus fort..." : "The Bot overpowered you...");
        else endGame(currentLanguage === 'fr' ? "VICTOIRE" : "VICTORY", currentLanguage === 'fr' ? "Cible neutralisée avec succès !" : "Target successfully neutralized!");
    } else if (gameMode === 'host' || gameMode === 'client') {
        if (gameMode === 'host') {
            if (deadTeam === 1) p2Wins++; else p1Wins++;
            let msg = (deadTeam === 1 && myTeam === 1) ? (currentLanguage === 'fr' ? "ÉLIMINÉ" : "ELIMINATED") : (currentLanguage === 'fr' ? "VICTOIRE" : "VICTORY");
            let stats = `Score global : P1(${p1Wins}) - P2(${p2Wins})`;
            endGame(msg, stats);
            if(conn && conn.open) conn.send({ type: 'game_over', msg: deadTeam===2 ? "ÉLIMINÉ" : "VICTOIRE", stats: stats, p1Wins: p1Wins, p2Wins: p2Wins });
        }
    }
}

function getSafeSpawn() {
    let x, y, safe;
    do {
        safe = true; x = 650 + Math.random() * 100; y = 50 + Math.random() * 500;
        for(let w of walls) { if (x + 40 > w.x && x - 40 < w.x + w.w && y + 40 > w.y && y - 40 < w.y + w.h) { safe = false; break; } }
    } while(!safe);
    return {x, y};
}

function spawnWave(w) {
    let hudP1 = document.getElementById('hud-p1');
    if (w % 3 === 0) {
        playSound('boss_spawn'); 
        hudP1.innerText = currentLanguage === 'fr' ? `⚠️ VAGUE ${w} : BOSS ! ⚠️` : `⚠️ WAVE ${w} : BOSS ! ⚠️`;
        hudP1.classList.add('boss');
        let spawn = getSafeSpawn(); let b = new Tank('boss_'+w, spawn.x, spawn.y, 'slime_noir', '#b82aff', 2);
        b.isAI = true; b.isBoss = true; b.w = 80; b.h = 80; b.speed = 2.0; b.hp = 2 + (w / 3); b.maxHp = b.hp;
        tanks.push(b);
    } else {
        hudP1.innerText = (currentLanguage === 'fr' ? "VAGUE : " : "WAVE : ") + w;
        hudP1.classList.remove('boss');
        let count = Math.min(w, 5); 
        for(let i=0; i<count; i++) {
            let spawn = getSafeSpawn(); let t = new Tank('ai_'+i, spawn.x, spawn.y, 'slime_rouge', '#ff007f', 2);
            t.isAI = true; t.hp = 1; t.maxHp = 1; tanks.push(t);
        }
    }
}

function initGame(mode) {
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    gameMode = mode; tanks = []; bullets = []; particles = []; generateMap();
    let hudP1 = document.getElementById('hud-p1'); let hudP2 = document.getElementById('hud-p2');
    hudP1.classList.remove('boss');

    if (mode === 'solo_survival') {
        wave = 1;
        let p = new Tank('p1', 100, 300, 'slime_bleu', '#00f0ff', 1); p.hp = 3; p.maxHp = 3; tanks.push(p);
        hudP2.innerText = ""; spawnWave(wave);
    } else if (mode === 'solo_1v1') {
        let p = new Tank('p1', 100, 300, 'slime_bleu', '#00f0ff', 1); p.hp = 3; p.maxHp = 3; tanks.push(p);
        let b = new Tank('bot', 700, 300, 'slime_rouge', '#ff007f', 2); b.isAI = true; b.hp = 3; b.maxHp = 3; tanks.push(b);
        hudP1.innerText = currentLanguage === 'fr' ? "JOUEUR" : "PLAYER"; 
        hudP2.innerText = "BOT IA"; hudP2.style.color = "var(--p2)"; hudP2.style.textShadow = "0 0 10px var(--p2)";
    } else if (mode === 'host') {
        let p1 = new Tank('p1', 100, 300, 'slime_bleu', '#00f0ff', 1); p1.hp = 3; p1.maxHp = 3; tanks.push(p1);
        let p2 = new Tank('p2', 700, 300, 'slime_rouge', '#ff007f', 2); p2.hp = 3; p2.maxHp = 3; tanks.push(p2);
        hudP1.innerText = "P1: " + p1Wins; hudP2.innerText = "P2: " + p2Wins; hudP2.style.color = "var(--p2)"; hudP2.style.textShadow = "0 0 10px var(--p2)";
    }

    document.querySelectorAll('.overlay').forEach(e => e.style.display = 'none');
    document.getElementById('hud').style.display = 'flex';
    gameActive = true;
    if (!loopRunning) { loopRunning = true; requestAnimationFrame(gameLoop); }
}

function startMode(mode) { myTeam = 1; initGame(mode); }

function requestRestart() {
    if (gameMode === 'host' || gameMode === 'client') { if (conn && conn.open) conn.send({type: 'restart'}); }
    restartRound();
}

function restartRound() {
    document.getElementById('game-over').style.display = 'none';
    if (gameMode === 'solo_survival' || gameMode === 'solo_1v1') { initGame(gameMode); } 
    else if (gameMode === 'host') { initGame('host'); } 
    else if (gameMode === 'client') {
        tanks = []; bullets = []; particles = []; gameActive = true; 
        document.getElementById('hud-p1').innerText = "P1: " + p1Wins; document.getElementById('hud-p2').innerText = "P2: " + p2Wins;
    }
}

function showNetworkMenu() { document.getElementById('main-menu').style.display = 'none'; document.getElementById('network-menu').style.display = 'flex'; }
function hideOnlineMenu() { 
    if(forceMode === 'multi') { window.location.href = '../index.html'; } 
    else { document.getElementById('network-menu').style.display = 'none'; document.getElementById('main-menu').style.display = 'flex'; if(peer) { peer.destroy(); peer = null; } }
}

function hostGame() {
    let status = document.getElementById('status-text');
    status.style.color = "var(--p1)"; status.innerText = currentLanguage === 'fr' ? "Génération du canal..." : "Generating channel..."; 
    let code = 'TNK' + Math.floor(1000 + Math.random() * 9000);
    if (peer) peer.destroy(); peer = new Peer(code);
    peer.on('open', id => {
        document.getElementById('my-id').innerText = id;
        try { navigator.clipboard.writeText(id).catch(e=>{}); } catch(e){}
        status.innerText = currentLanguage === 'fr' ? "Code copié ! En attente du Joueur 2..." : "Code copied! Waiting for Player 2...";
        gameMode = 'host'; myTeam = 1; p1Wins = 0; p2Wins = 0;
    });
    peer.on('connection', connection => {
        conn = connection;
        conn.on('open', () => { status.innerText = currentLanguage === 'fr' ? "Adversaire connecté ! Lancement..." : "Opponent joined! Launching..."; setTimeout(() => initGame('host'), 1000); });
        setupConnection();
    });
}

function joinGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    const hostId = document.getElementById('join-id').value.trim().toUpperCase();
    if(!hostId) return;
    let status = document.getElementById('status-text');
    status.style.color = "var(--p2)"; status.innerText = currentLanguage === 'fr' ? "Connexion à l'hôte..." : "Connecting to host...";
    if (peer) peer.destroy(); peer = new Peer();
    peer.on('open', () => {
        conn = peer.connect(hostId, { reliable: true }); gameMode = 'client'; myTeam = 2; p1Wins = 0; p2Wins = 0;
        conn.on('open', () => { status.innerText = currentLanguage === 'fr' ? "Connecté ! Synchronisation..." : "Connected! Synchronizing..."; setTimeout(() => initGame('client'), 1000); });
        setupConnection();
    });
    peer.on('error', (err) => { status.style.color = "var(--p2)"; status.innerText = err.type === 'peer-unavailable' ? (currentLanguage === 'fr' ? "Partie introuvable." : "Game not found.") : "Erreur : " + err.type; });
}

function setupConnection() {
    conn.on('data', data => {
        if (gameMode === 'host' && data.type === 'input') {
            let p2 = tanks.find(t => t.team === 2);
            if(p2) { p2.vx = data.vx; p2.vy = data.vy; p2.turretAngle = data.turretAngle; if(data.shoot) shoot(p2); }
        }
        if (gameMode === 'client') {
            if(data.type === 'state') { 
                if (bullets.length > data.bullets.length && data.bullets.length > 0) playSound('bounce');
                if (tanks.length > data.tanks.length) playSound('explosion');
                tanks = data.tanks; bullets = data.bullets; if(data.particles) particles.push(...data.particles); 
            }
            if(data.type === 'game_over') { p1Wins = data.p1Wins; p2Wins = data.p2Wins; endGame(data.msg, data.stats); }
            if(data.type === 'restart') { restartRound(); }
        }
        if (gameMode === 'host' && data.type === 'restart') { restartRound(); }
    });
}

function endGame(title, stats) {
    gameActive = false; updateEngineSound(false); 
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('end-message').innerText = title;
    document.getElementById('end-message').style.color = title.includes('VICTOIRE') || title.includes('VICTORY') ? 'var(--p1)' : (title.includes('DÉFAITE') || title.includes('DEFEAT') ? 'var(--p2)' : '#fff');
    document.getElementById('end-stats').innerText = stats;
}

/* ==============================================================
   6. CONTROLES & BOUCLE DE JEU
============================================================== */
window.addEventListener('keydown', e => { let k=e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = true; });
window.addEventListener('keyup', e => { let k=e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = false; });
canvas.addEventListener('mousemove', e => { let rect = canvas.getBoundingClientRect(); mouse.x = (e.clientX - rect.left) / (rect.width / canvas.width); mouse.y = (e.clientY - rect.top) / (rect.height / canvas.height); });
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

const joyMove = document.getElementById('joy-move'); const knobMove = document.getElementById('knob-move');
const joyAim = document.getElementById('joy-aim'); const knobAim = document.getElementById('knob-aim');
function handleJoystick(e, isMove) {
    e.preventDefault();
    let touch = e.targetTouches[0]; let zone = isMove ? joyMove : joyAim; let knob = isMove ? knobMove : knobAim;
    if(!touch) { knob.style.transform = `translate(-50%, -50%)`; if(isMove) { jMove.x = 0; jMove.y = 0; } else { jAim.firing = false; } return; }
    let rect = zone.getBoundingClientRect(); let cx = rect.left + rect.width/2; let cy = rect.top + rect.height/2;
    let dx = touch.clientX - cx; let dy = touch.clientY - cy; let dist = Math.hypot(dx, dy); let maxDist = rect.width/2 - 20;
    if (dist > maxDist) { dx = (dx/dist)*maxDist; dy = (dy/dist)*maxDist; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    let nx = dx / maxDist; let ny = dy / maxDist;
    if(isMove) { jMove.x = nx; jMove.y = ny; } else { jAim.x = nx; jAim.y = ny; jAim.firing = true; }
}
joyMove.addEventListener('touchstart', e => handleJoystick(e, true)); joyMove.addEventListener('touchmove', e => handleJoystick(e, true)); joyMove.addEventListener('touchend', e => handleJoystick(e, true));
joyAim.addEventListener('touchstart', e => handleJoystick(e, false)); joyAim.addEventListener('touchmove', e => handleJoystick(e, false)); joyAim.addEventListener('touchend', e => handleJoystick(e, false));

function update() {
    if(!gameActive) { updateEngineSound(false); return; }

    let myTank = tanks.find(t => t.team === myTeam);
    let isMoving = false;

    if (myTank && myTank.hp > 0) {
        myTank.vx = 0; myTank.vy = 0;
        if (keys.w || keys.arrowup) myTank.vy = -myTank.speed;
        if (keys.s || keys.arrowdown) myTank.vy = myTank.speed;
        if (keys.a || keys.arrowleft) myTank.vx = -myTank.speed;
        if (keys.d || keys.arrowright) myTank.vx = myTank.speed;
        if (jMove.x !== 0 || jMove.y !== 0) { myTank.vx = jMove.x * myTank.speed; myTank.vy = jMove.y * myTank.speed; }
        if (myTank.vx !== 0 && myTank.vy !== 0 && jMove.x === 0) { myTank.vx *= 0.707; myTank.vy *= 0.707; }
        if (myTank.vx !== 0 || myTank.vy !== 0) isMoving = true;

        let isShooting = false;
        if (jAim.firing) { myTank.turretAngle = Math.atan2(jAim.y, jAim.x); isShooting = true; } 
        else { myTank.turretAngle = Math.atan2(mouse.y - myTank.y, mouse.x - myTank.x); if (mouse.down) isShooting = true; }

        if(isShooting && gameMode !== 'client') shoot(myTank);
        if (gameMode === 'client' && conn && conn.open) conn.send({type: 'input', vx: myTank.vx, vy: myTank.vy, turretAngle: myTank.turretAngle, shoot: isShooting });
    }

    updateEngineSound(isMoving);

    if (gameMode !== 'client') {
        tanks.forEach(t => { if(t.update) t.update(); });
        for(let i=bullets.length-1; i>=0; i--) { bullets[i].update(); if(bullets[i].life <= 0) bullets.splice(i, 1); }
        tanks = tanks.filter(t => t.hp > 0);
        if(gameMode === 'host' && conn && conn.open) conn.send({type: 'state', tanks: tanks, bullets: bullets});
    }
    particles.forEach(p => p.update()); particles = particles.filter(p => p.life > 0);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let mapImg = imgs['map'];
    if (mapImg && mapImg.complete && mapImg.naturalWidth !== 0) { ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height); }

    for(let w of walls) {
        let img = imgs[w.img];
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.save(); ctx.translate(w.x + w.w/2, w.y + w.h/2); 
            if (w.rotated) { ctx.rotate(Math.PI / 2); ctx.drawImage(img, -w.h/2, -w.w/2, w.h, w.w); } 
            else { ctx.drawImage(img, -w.w/2, -w.h/2, w.w, w.h); }
            ctx.restore();
        } else {
            ctx.shadowBlur = 15; ctx.shadowColor = '#0055ff'; ctx.fillStyle = 'rgba(0, 40, 100, 0.4)'; ctx.strokeStyle = '#0088ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w.x+5, w.y+5); ctx.lineTo(w.x+w.w-5, w.y+w.h-5); ctx.stroke(); ctx.shadowBlur = 0;
        }
    }

    tanks.forEach(t => { if(t.draw) t.draw(ctx); else Object.assign(new Tank(), t).draw(ctx); });
    bullets.forEach(b => { if(b.draw) b.draw(ctx); else Object.assign(new Bullet(), b).draw(ctx); });
    particles.forEach(p => p.draw(ctx));
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

/* ==============================================================
   7. NAVIGATION SWIPE
============================================================== */
const gamesHubList = [
    "../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html",
    "../cyber_smash/index.html", "../guessthemanga/index.html", "../drawer/index.html",
    "../texas_poker/index.html", "../blindtest/index.html", "../2048slime/index.html", "../worms/index.html"
];
let globalTouchStartX = 0, globalTouchStartY = 0, globalTouchEndX = 0, globalTouchEndY = 0;
function handleSwipeGesture() {
    const swipeThreshold = 75; 
    let diffX = globalTouchEndX - globalTouchStartX; let diffY = globalTouchEndY - globalTouchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < -swipeThreshold) navigateGames(1);       
        else if (diffX > swipeThreshold) navigateGames(-1);  
    } else {
        if (diffY < -swipeThreshold) navigateGames(1);       
        else if (diffY > swipeThreshold) navigateGames(-1);  
    }
}
function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => { let folderName = game.split('/')[1]; return currentPath.includes(folderName); });
    if (currentIndex === -1) return;
    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}
function isExcludedElement(target) {
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'button') return true;
    if (target.closest('#gameCanvas') || target.closest('.joystick-zone')) return true;
    return false;
}
document.addEventListener('touchstart', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchStartX = e.changedTouches[0].screenX; globalTouchStartY = e.changedTouches[0].screenY;
}, { passive: true });
document.addEventListener('touchend', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchEndX = e.changedTouches[0].screenX; globalTouchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });
let isMouseDown = false;
document.addEventListener('mousedown', e => {
    if (isExcludedElement(e.target)) return;
    isMouseDown = true; globalTouchStartX = e.screenX; globalTouchStartY = e.screenY;
});
document.addEventListener('mouseup', e => {
    if (isExcludedElement(e.target) || !isMouseDown) { isMouseDown = false; return; }
    isMouseDown = false; globalTouchEndX = e.screenX; globalTouchEndY = e.screenY;
    handleSwipeGesture();
});
