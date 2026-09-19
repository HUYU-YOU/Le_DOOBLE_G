// --- GESTION DE LA TAILLE ET DES PARAMETRES ---
function setGameSize(size) {
    const container = document.getElementById('game-container');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        container.classList.add('size-classic'); document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        container.classList.add('size-wide'); document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        container.classList.add('size-full'); document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
}

document.querySelectorAll('.btn-size').forEach(btn => {
    btn.addEventListener('click', (e) => setGameSize(e.target.dataset.size));
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide');
});

const settingsBtnImg = document.getElementById('settings-btn-img');
const settingsWrapper = document.getElementById('settings-btn-wrapper');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

settingsWrapper.addEventListener('mouseenter', () => {
    if (hoverInterval) return;
    currentFrame = 0; settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
});

settingsWrapper.addEventListener('mouseleave', () => {
    clearInterval(hoverInterval); hoverInterval = null;
    if (!settingsBtnImg.src.includes('settings4.png')) settingsBtnImg.src = '../img/setting.png';
});

settingsWrapper.addEventListener('click', () => {
    clearInterval(hoverInterval); hoverInterval = null;
    settingsBtnImg.src = '../img/settings4.png'; toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
});

function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }
document.getElementById('close-settings-btn').addEventListener('click', toggleSettings);

// --- MOTEUR DE JEU ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio Web API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = localStorage.getItem('isMuted') === 'true'; 

function forceAudioUnlock() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
['click', 'keydown', 'touchstart'].forEach(evt => document.addEventListener(evt, forceAudioUnlock, {once: true}));

function playSound(type) {
    if (isMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'drop') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'land') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'perfect') {
        osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'fail' || type === 'gameover') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'legendary') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(1500, now + 0.5);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

// Assets
const imgs = {};
const imgPaths = {
    1: '../img/cube1.png', 2: '../img/cube2.png', 3: '../img/cube3.png', 4: '../img/cube4.png',
    5: '../img/cube5.png', 6: '../img/cube6.png', 7: '../img/cube7.png',
    8: '../img/cube8.png', 9: '../img/cube9.png',  
    'map1': '../img/mapstax1.png', 'map2': '../img/mapstax2.png', 'map3': '../img/mapstax3.png'
};
const fallbackColors = {
    1: '#ff0055', 2: '#00f0ff', 3: '#39ff14', 4: '#b82aff', 5: '#ffaa00', 6: '#0055ff', 7: '#ff00ff',
    8: '#ffd700', 9: '#ffffff'
};

Object.keys(imgPaths).forEach(k => {
    imgs[k] = new Image(); imgs[k].src = imgPaths[k];
});

// Variables
let gameState = 'START'; 
let loopRunning = false;

let score = 0;
let bestScore = parseInt(localStorage.getItem('slimyStaxBestScore')) || 0; 
let perfectCount = 0;
let comboMultiplier = 1;

const BLOCK_SIZE = 80;
let blocks = [];
let activeBlock = null;

let cameraY = 0, targetCameraY = 0;
let towerSway = 0, targetTotalOffset = 0, currentTotalOffset = 0; 
let swingAngle = 0, swingSpeed = 0.02; 
const MAX_OFFSET_TOLERANCE = BLOCK_SIZE * 1.1; 

let particles = [], floatingTexts = [], stars = [];
for(let i=0; i<100; i++) {
    stars.push({ x: Math.random() * 1000, y: -Math.random() * 10000, s: Math.random() * 2 + 1, a: Math.random() });
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 1.0; this.vy = -2;
    }
    update() { this.y += this.vy; this.life -= 0.02; }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color; ctx.font = "bold 28px Rajdhani"; ctx.textAlign = "center";
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
    }
}

class Block {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.state = 'swinging'; 
        this.vx = 0; this.vy = 0; 
        this.angle = 0; this.vAngle = 0;
        this.visualX = x; 
    }
    draw() {
        let drawX = this.x, drawY = this.y;

        if (this.state === 'landed') {
            let heightIndex = blocks.indexOf(this);
            let swayAmplitude = (Math.abs(currentTotalOffset) * 0.05) + (heightIndex * 0.5);
            let swayOffset = Math.sin(towerSway + heightIndex * 0.1) * swayAmplitude;
            let staticBend = heightIndex * currentTotalOffset * 0.012; 
            
            drawX += swayOffset + staticBend;
            this.visualX = drawX; 
        } else {
            this.visualX = this.x;
        }

        ctx.save();
        ctx.translate(drawX, drawY);

        if (this.state === 'dead') {
            this.angle += this.vAngle; ctx.rotate(this.angle);
        }

        if (this.type === 8) { ctx.shadowBlur = 20; ctx.shadowColor = 'var(--gold)'; }
        if (this.type === 9) { ctx.shadowBlur = 30; ctx.shadowColor = '#fff'; }
        
        if (imgs[this.type] && imgs[this.type].complete && imgs[this.type].naturalWidth > 0) {
            ctx.drawImage(imgs[this.type], -BLOCK_SIZE/2, -BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            ctx.fillStyle = fallbackColors[this.type] || '#fff';
            ctx.fillRect(-BLOCK_SIZE/2, -BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-BLOCK_SIZE/2, -BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        let angle = Math.random() * Math.PI * 2; let speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.color = color; this.life = 1.0; this.decay = Math.random() * 0.05 + 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw() { 
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; 
        ctx.shadowBlur = 10; ctx.shadowColor = this.color; 
        ctx.fillRect(this.x, this.y, 4, 4); ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; 
    }
}

function createParticles(x, y, color, count) { for(let i=0; i<count; i++) particles.push(new Particle(x, y, color)); }

document.addEventListener("DOMContentLoaded", () => {
    setGameSize('wide');
    updateHUD(); 
    startGame();
});

function startGame() {
    score = 0; perfectCount = 0; comboMultiplier = 1; 
    targetTotalOffset = 0; currentTotalOffset = 0; 
    cameraY = 0; targetCameraY = 0; towerSway = 0; swingSpeed = 0.02;
    particles = []; floatingTexts = [];
    
    blocks = [new Block(canvas.width/2, canvas.height - 50, Math.floor(Math.random()*7)+1)];
    blocks[0].state = 'landed'; blocks[0].visualX = canvas.width/2;
    
    spawnBlock();
    updateHUD();
    gameState = 'PLAYING';
    document.getElementById('game-over').style.display = 'none';
    
    if(!loopRunning) { loopRunning = true; requestAnimationFrame(gameLoop); }
}

document.getElementById('btn-replay').addEventListener('click', startGame);

function spawnBlock() {
    let spawnY = cameraY + 80;
    let type = Math.floor(Math.random() * 7) + 1;
    
    if (perfectCount >= 10) {
        type = 8; perfectCount = 0; playSound('legendary');
        floatingTexts.push(new FloatingText(canvas.width/2, spawnY - 50, "GOLDEN CUBE !", "var(--gold)"));
    } else if (Math.random() < 1/30) {
        type = 9; playSound('legendary');
        floatingTexts.push(new FloatingText(canvas.width/2, spawnY - 50, "LEGENDARY !", "#ffffff"));
    }

    activeBlock = new Block(canvas.width/2, spawnY, type);
    swingAngle = 0;
    swingSpeed = 0.02 + (blocks.length * 0.0015) + (Math.abs(currentTotalOffset) * 0.0001);
    if (swingSpeed > 0.08) swingSpeed = 0.08; // Cap pour que ça reste jouable
}

function updateHUD() {
    document.getElementById('ui-score').innerText = score;
    document.getElementById('ui-best').innerText = bestScore; 
    document.getElementById('ui-height').innerText = blocks.length;
    
    let comboBox = document.getElementById('combo-box');
    let comboUI = document.getElementById('ui-combo');
    if (perfectCount > 1) {
        comboUI.innerText = `x${perfectCount}`;
        comboBox.style.opacity = '1';
    } else {
        comboBox.style.opacity = '0';
    }
}

function dropBlock() {
    if (gameState !== 'PLAYING' || !activeBlock || activeBlock.state !== 'swinging') return;
    activeBlock.state = 'falling';
    activeBlock.vy = 2; // Léger boost de chute initial
    playSound('drop');
}

canvas.addEventListener('mousedown', dropBlock);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); dropBlock(); }, {passive: false});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
        if(e.target === document.body) e.preventDefault();
        dropBlock();
    }
});

function checkCollision() {
    if (!activeBlock || activeBlock.state !== 'falling') return;

    let topBlock = blocks[blocks.length - 1];
    let topVisualX = topBlock.visualX || topBlock.x;
    
    if (activeBlock.y + BLOCK_SIZE/2 >= topBlock.y - BLOCK_SIZE/2) {
        let diffX = activeBlock.x - topVisualX; 
        
        if (Math.abs(diffX) <= BLOCK_SIZE * 0.55) {
            activeBlock.y = topBlock.y - BLOCK_SIZE;
            activeBlock.state = 'landed';
            
            let points = 10; let color = '#fff';

            if (Math.abs(diffX) <= 6) { // Tolérance Perfect
                activeBlock.x = topBlock.x; 
                points = 50; color = 'var(--perfect)'; perfectCount++;
                createParticles(topVisualX, activeBlock.y, color, 20);
                playSound('perfect');
                
                if (perfectCount >= 3) {
                    targetTotalOffset = 0; 
                    floatingTexts.push(new FloatingText(topVisualX, activeBlock.y - 70, "TOWER CENTERED!", "var(--p1)"));
                }
                floatingTexts.push(new FloatingText(topVisualX, activeBlock.y - 20, "PERFECT +50", color));
            } else {
                activeBlock.x = activeBlock.x - (topVisualX - topBlock.x); 
                perfectCount = 0;
                targetTotalOffset += diffX; 
                createParticles(activeBlock.x + (topVisualX - topBlock.x), activeBlock.y, '#fff', 10);
                playSound('land');
                floatingTexts.push(new FloatingText(activeBlock.x + (topVisualX - topBlock.x), activeBlock.y - 20, "+10", color));
            }

            if (activeBlock.type === 9) { points = 500; floatingTexts.push(new FloatingText(topVisualX, activeBlock.y - 50, "+500 LEGENDARY", "#fff")); }
            
            score += points * comboMultiplier;
            if (score > bestScore) { bestScore = score; localStorage.setItem('slimyStaxBestScore', bestScore); }
            
            if (activeBlock.type === 8) comboMultiplier = 2; else comboMultiplier = 1;

            blocks.push(activeBlock); updateHUD();
            targetCameraY -= BLOCK_SIZE;
            
            if (Math.abs(targetTotalOffset) > MAX_OFFSET_TOLERANCE) triggerGameOver();
            else { activeBlock = null; setTimeout(spawnBlock, 150); }
        } else {
            activeBlock.state = 'dead';
            activeBlock.vx = (Math.random() - 0.5) * 10;
            activeBlock.vy = -5;
            triggerGameOver();
        }
    }
}

function triggerGameOver() {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    playSound('gameover');
    
    let fallDir = targetTotalOffset > 0 ? 1 : -1;
    if (targetTotalOffset === 0) fallDir = Math.random() > 0.5 ? 1 : -1;

    blocks.forEach((b, i) => {
        if (i > 0) { 
            b.state = 'dead';
            b.vx = (Math.random() * 5 + 2) * fallDir; 
            b.vy = -Math.random() * 5 - 2;
            b.vAngle = (Math.random() - 0.5) * 0.2;
        }
    });

    if (activeBlock && activeBlock.state !== 'dead') {
        activeBlock.state = 'dead';
        activeBlock.vx = (Math.random() - 0.5) * 10;
        activeBlock.vy = -10; activeBlock.vAngle = (Math.random() - 0.5) * 0.5;
    }

    setTimeout(() => {
        document.getElementById('final-score').innerText = score;
        document.getElementById('final-height').innerText = blocks.length;
        document.getElementById('game-over').style.display = 'flex';
    }, 2500);
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        if (activeBlock && activeBlock.state === 'swinging') {
            swingAngle += swingSpeed;
            let amplitude = canvas.width / 2 - BLOCK_SIZE/2;
            activeBlock.x = canvas.width/2 + Math.sin(swingAngle) * amplitude;
        }
        
        if (activeBlock && activeBlock.state === 'falling') {
            activeBlock.vy += 1.8; // Gravité plus lourde et réactive
            activeBlock.y += activeBlock.vy;
            checkCollision();
        }
    }

    currentTotalOffset += (targetTotalOffset - currentTotalOffset) * 0.1;

    blocks.forEach(b => {
        if (b.state === 'dead') {
            b.x += b.vx || 0; b.vy += 0.5; b.y += b.vy;
        }
    });
    if (activeBlock && activeBlock.state === 'dead') {
        activeBlock.x += activeBlock.vx || 0; activeBlock.vy += 0.5; activeBlock.y += activeBlock.vy;
    }

    cameraY += (targetCameraY - cameraY) * 0.1;
    towerSway += 0.05 + (Math.abs(currentTotalOffset) * 0.0005);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let heightFactor = Math.min(1, Math.abs(cameraY) / 6000); 
    let r = Math.floor(5 * (1 - heightFactor));
    let g = Math.floor(5 * (1 - heightFactor));
    let b = Math.floor(8 + 30 * (1 - heightFactor));
    
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    grad.addColorStop(1, '#020205');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (heightFactor > 0.05) {
        ctx.save(); ctx.translate(0, -cameraY * 0.05); 
        stars.forEach(star => {
            if (star.y > cameraY - canvas.height && star.y < cameraY + canvas.height) {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.a * heightFactor})`;
                ctx.beginPath(); ctx.arc(star.x, star.y, star.s, 0, Math.PI*2); ctx.fill();
            }
        });
        ctx.restore();
    }

    let parallaxY = cameraY * 0.15; 
    ctx.save(); ctx.translate(0, -parallaxY);
    
    let bg1 = imgs['map1'], bg2 = imgs['map2'], bg3 = imgs['map3']; 
    
    if (bg1 && bg1.complete && bg1.naturalWidth > 0) {
        let scale1 = canvas.width / bg1.naturalWidth;
        let h1 = bg1.naturalHeight * scale1;
        let currentY = canvas.height - h1; 
        ctx.drawImage(bg1, 0, currentY, canvas.width, h1);
        
        if (bg2 && bg2.complete && bg2.naturalWidth > 0) {
            let scale2 = canvas.width / bg2.naturalWidth; let h2 = bg2.naturalHeight * scale2;
            currentY -= h2; ctx.drawImage(bg2, 0, currentY, canvas.width, h2);
            
            if (bg3 && bg3.complete && bg3.naturalWidth > 0) {
                let scale3 = canvas.width / bg3.naturalWidth; let h3 = bg3.naturalHeight * scale3;
                currentY -= h3;
                while (currentY + h3 > parallaxY - canvas.height) {
                    ctx.drawImage(bg3, 0, currentY, canvas.width, h3); currentY -= h3;
                }
            }
        }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(0, -cameraY);

    // Dessin de l'Aide Visuelle (Ghost Line)
    if (activeBlock && activeBlock.state === 'swinging') {
        ctx.beginPath();
        ctx.moveTo(activeBlock.x, activeBlock.y + BLOCK_SIZE/2);
        ctx.lineTo(activeBlock.x, blocks[blocks.length - 1].y);
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
        ctx.stroke();
        ctx.setLineDash([]);
    }

    blocks.forEach(b => b.draw());
    if (activeBlock) activeBlock.draw();
    
    for(let i=particles.length-1; i>=0; i--) {
        particles[i].update(); particles[i].draw();
        if(particles[i].life <= 0) particles.splice(i, 1);
    }
    
    for(let i=floatingTexts.length-1; i>=0; i--) {
        floatingTexts[i].update(); floatingTexts[i].draw();
        if(floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// --- GESTION DU SWIPE GLOBAL ---
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
    if (tag === 'button' || tag === 'canvas') return true;
    if (target.closest('#settings-modal') || target.closest('.settings-btn-wrapper')) return true;
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
