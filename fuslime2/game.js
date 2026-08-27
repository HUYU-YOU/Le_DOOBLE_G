// =========================================================
// 1. PARAMÈTRES, VIDÉO DE FOND ET ENGRENAGE
// =========================================================

const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval = null;
let currentFrame = 0;
const settingsBtnImg = document.getElementById('settings-btn-img');

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    if (settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        if (settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
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
    if (settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { 
        if (settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; 
    }, 300);
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('show');
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.src = isDark ? 'assets/backgroundnight.mp4' : 'assets/daybackground.mp4';
        bgVideo.play();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    let fsToggle = document.getElementById('fs-toggle');
    if (fsToggle) fsToggle.checked = !!document.fullscreenElement;
});

// --- GESTION AUDIO (YOUTUBE) ---
let ytPlayer;
let isMuted = localStorage.getItem('isMuted') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('music-toggle');
    if(musicToggle) musicToggle.checked = !isMuted;
});

function toggleMusic() {
    isMuted = !document.getElementById('music-toggle').checked;
    localStorage.setItem('isMuted', isMuted);
    if (ytPlayer && ytPlayer.mute) {
        if (isMuted) ytPlayer.mute();
        else {
            ytPlayer.unMute();
            ytPlayer.playVideo();
        }
    }
}

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-audio', {
        height: '0', width: '0', videoId: '4RaguYU_SQI',
        playerVars: { 'autoplay': 1, 'controls': 0, 'showinfo': 0, 'autohide': 1, 'loop': 1, 'playlist': '4RaguYU_SQI' },
        events: { 'onReady': (e) => { if (isMuted) e.target.mute(); else e.target.unMute(); } }
    });
}


// =========================================================
// 2. MOTEUR DU JEU FUSLIME 2 (MATTER.JS & PHYSIQUE)
// =========================================================

const isLocalFile = window.location.protocol === 'file:';

const TAILLE_IMAGE_EN_PIXELS = 256; 

// 🔥 NOUVELLE BAISSE DE 20% APPLIQUÉE 🔥
const SLIMES = [
    { level: 1,  radius: 25,  zoom: 1.85, points: 2,    texture: 'assets/slime2.png',  color: '#aaffaa' }, // 1. Vert (Parfait, inchangé)
    { level: 2,  radius: 36,  zoom: 1.85, points: 4,    texture: 'assets/slime3.png',  color: '#aaaaff' }, // 2. Orange (Parfait, inchangé)
    { level: 3,  radius: 50,  zoom: 0.89, points: 8,    texture: 'assets/slime4.png',  color: '#ffffaa' }, // 3. Rose (-20% encore)
    { level: 4,  radius: 65,  zoom: 1.18, points: 16,   texture: 'assets/slime5.png',  color: '#ffaaff' }, // 4. (-20% encore)
    { level: 5,  radius: 82,  zoom: 1.18, points: 32,   texture: 'assets/slime6.png',  color: '#aaffff' }, // -20%
    { level: 6,  radius: 100, zoom: 1.18, points: 64,   texture: 'assets/slime7.png',  color: '#ffccaa' }, // -20%
    { level: 7,  radius: 120, zoom: 1.18, points: 128,  texture: 'assets/slime8.png',  color: '#aaccff' }, // -20%
    { level: 8,  radius: 140, zoom: 1.18, points: 256,  texture: 'assets/slime9.png',  color: '#ccaaff' }, // -20%
    { level: 9,  radius: 165, zoom: 1.18, points: 512,  texture: 'assets/slime10.png', color: '#ff9999' }, // -20%
    { level: 10, radius: 190, zoom: 1.18, points: 1024, texture: 'assets/slime11.png', color: '#99ff99' }, // -20%
    { level: 11, radius: 215, zoom: 1.18, points: 2048, texture: 'assets/slime12.png', color: '#9999ff' }, // -20%
    { level: 12, radius: 245, zoom: 1.18, points: 4096, texture: 'assets/slime13.png', color: '#ffffff' }  // -20%
];

SLIMES.forEach(slime => {
    slime.imageLoaded = false;
    const img = new Image();
    img.onload = () => { slime.imageLoaded = true; };
    img.onerror = () => { console.warn("L'image " + slime.texture + " n'a pas pu être chargée."); };
    img.src = slime.texture;
});

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events;

const engine = Engine.create();
const world = engine.world;

engine.positionIterations = 15;
engine.velocityIterations = 15;

const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;

const render = Render.create({
    canvas: document.getElementById('game-canvas'),
    engine: engine,
    options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false, 
        background: 'transparent'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// --- RACCOURCI CLAVIER "D" ---
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'd') {
        render.options.wireframes = !render.options.wireframes;
    }
});

// --- SEAU ---
const wallOptions = { isStatic: true, render: { visible: false }, restitution: 0.2, friction: 0.1 };
const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH, 50, wallOptions);
const leftWall = Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);
const rightWall = Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);
const loseLineY = 150; 
Composite.add(world, [ground, leftWall, rightWall]);

let currentSlime = null;
let currentSlimeLevel = 0;
let score = 0;
let canDrop = true;
let isGameOver = false;

let bestScore = localStorage.getItem('fuslime2_best_score') || 0;
document.getElementById('best-score').innerText = bestScore;

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioInitialized = false;

function playSound(type, level = 1) {
    if (!audioInitialized) return; 
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'merge') {
        osc.type = 'triangle';
        const baseFreq = 200 + (level * 50); 
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }
}

// --- EFFETS ---
function createEffects(x, y, points, slimeData) {
    const container = document.getElementById('effects-container');
    const text = document.createElement('div');
    text.className = 'floating-text';
    text.innerText = '+' + points;
    text.style.left = x + 'px';
    text.style.top = y + 'px';
    text.style.color = slimeData.color;
    container.appendChild(text);
    setTimeout(() => text.remove(), 800);

    for(let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = slimeData.color;
        p.style.width = (Math.random() * 12 + 6) + 'px';
        p.style.height = p.style.width;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 80 + 30;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        container.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }

    const scoreEl = document.getElementById('score').parentElement;
    scoreEl.classList.add('score-bump');
    setTimeout(() => scoreEl.classList.remove('score-bump'), 100);
}

function updateScore(points) {
    score += points;
    document.getElementById('score').innerText = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('fuslime2_best_score', bestScore);
        document.getElementById('best-score').innerText = bestScore;
    }
}

// L'échelle prend en compte le zoom individuel
function getScale(radius, customZoom) {
    return (radius * 2 * customZoom) / TAILLE_IMAGE_EN_PIXELS;
}

function getRenderOptions(slimeData, isGhost = false) {
    let options = {
        fillStyle: slimeData.color,
        strokeStyle: '#ffffff',
        lineWidth: 2,
        opacity: isGhost ? 0.5 : 1
    };

    if (slimeData.imageLoaded && !isLocalFile) {
        options.sprite = {
            texture: slimeData.texture,
            xScale: getScale(slimeData.radius, slimeData.zoom),
            yScale: getScale(slimeData.radius, slimeData.zoom)
        };
    }
    return options;
}

function spawnGhostSlime(x) {
    currentSlimeLevel = Math.floor(Math.random() * 3) + 1; 
    const slimeData = SLIMES[currentSlimeLevel - 1];

    currentSlime = Bodies.circle(x, 50, slimeData.radius, {
        isStatic: true,
        isSensor: true,
        label: 'ghost',
        slimeLevel: currentSlimeLevel,
        render: getRenderOptions(slimeData, true)
    });
    Composite.add(world, currentSlime);
}

function dropSlime() {
    if (!canDrop || isGameOver || !currentSlime) return;
    canDrop = false;
    audioInitialized = true; 
    playSound('drop');

    const x = currentSlime.position.x;
    const y = currentSlime.position.y;
    const slimeData = SLIMES[currentSlimeLevel - 1];

    Composite.remove(world, currentSlime);
    currentSlime = null;

    const realSlime = Bodies.circle(x, y, slimeData.radius, {
        restitution: 0.1, 
        friction: 0.005, 
        frictionAir: 0.001,
        density: 0.001 + (slimeData.level * 0.0005),
        label: 'slime',
        slimeLevel: currentSlimeLevel,
        render: getRenderOptions(slimeData, false)
    });

    Composite.add(world, realSlime);

    setTimeout(() => {
        if (!isGameOver) {
            spawnGhostSlime(GAME_WIDTH / 2);
            canDrop = true;
        }
    }, 700); 
}

// --- CONTRÔLES ---
const canvasEl = document.getElementById('game-canvas');

canvasEl.addEventListener('mousemove', (e) => {
    if (!canDrop || isGameOver || !currentSlime) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    let x = (e.clientX - rect.left) * scaleX;
    
    const slimeRadius = SLIMES[currentSlimeLevel - 1].radius;
    if (x < slimeRadius) x = slimeRadius;
    if (x > GAME_WIDTH - slimeRadius) x = GAME_WIDTH - slimeRadius;
    Matter.Body.setPosition(currentSlime, { x: x, y: 50 });
});

canvasEl.addEventListener('click', dropSlime);

canvasEl.addEventListener('touchmove', (e) => {
    if (!canDrop || isGameOver || !currentSlime) return;
    e.preventDefault();
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    let x = (e.touches[0].clientX - rect.left) * scaleX;
    
    const slimeRadius = SLIMES[currentSlimeLevel - 1].radius;
    if (x < slimeRadius) x = slimeRadius;
    if (x > GAME_WIDTH - slimeRadius) x = GAME_WIDTH - slimeRadius;
    Matter.Body.setPosition(currentSlime, { x: x, y: 50 });
}, { passive: false });

canvasEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    dropSlime();
});

// --- COLLISIONS ET FUSION ---
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        if (bodyA.label === 'slime' && bodyB.label === 'slime') {
            if (bodyA.slimeLevel === bodyB.slimeLevel && bodyA.slimeLevel < SLIMES.length) {
                
                if (bodyA.isMerging || bodyB.isMerging) continue;
                bodyA.isMerging = true;
                bodyB.isMerging = true;

                const newLevel = bodyA.slimeLevel + 1;
                const slimeData = SLIMES[newLevel - 1];
                const midX = (bodyA.position.x + bodyB.position.x) / 2;
                const midY = (bodyA.position.y + bodyB.position.y) / 2;

                const newSlime = Bodies.circle(midX, midY, slimeData.radius, {
                    restitution: 0.1,
                    friction: 0.005,
                    frictionAir: 0.001,
                    density: 0.001 + (slimeData.level * 0.0005),
                    label: 'slime',
                    slimeLevel: newLevel,
                    render: getRenderOptions(slimeData, false)
                });

                Composite.remove(world, [bodyA, bodyB]);
                Composite.add(world, newSlime);
                
                Matter.Body.setVelocity(newSlime, { 
                    x: (bodyA.velocity.x + bodyB.velocity.x) / 2, 
                    y: -4 
                });
                
                updateScore(slimeData.points);
                playSound('merge', newLevel);
                createEffects(midX, midY, slimeData.points, slimeData);
            }
        }
    }
});

// --- GAME OVER ---
Events.on(engine, 'beforeUpdate', () => {
    if (isGameOver) return;
    const bodies = Composite.allBodies(world);
    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (body.label === 'slime') {
            if (body.position.y < loseLineY && body.velocity.y > -0.5 && body.velocity.y < 0.5) {
                if (!body.warningTimer) body.warningTimer = 0;
                body.warningTimer++;
                if (body.warningTimer > 60) { 
                    gameOver();
                    break;
                }
            } else {
                body.warningTimer = 0;
            }
        }
    }
});

Events.on(render, 'afterRender', () => {
    const context = render.context;
    
    context.beginPath();
    context.moveTo(0, loseLineY);
    context.lineTo(GAME_WIDTH, loseLineY);
    context.strokeStyle = 'rgba(233, 69, 96, 0.7)';
    context.lineWidth = 2;
    context.setLineDash([10, 10]);
    context.stroke();
    context.setLineDash([]);

    const bodies = Composite.allBodies(world);
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if ((body.label === 'slime' || body.label === 'ghost') && body.slimeLevel) {
            const data = SLIMES[body.slimeLevel - 1];
            if (!data.imageLoaded || isLocalFile) { 
                context.fillStyle = "#000000"; 
                context.font = `bold ${body.circleRadius}px Arial`;
                context.fillText(body.slimeLevel, body.position.x, body.position.y);
            }
        }
    }
});

function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').classList.remove('hidden');
    if (currentSlime) Composite.remove(world, currentSlime); 
}

setTimeout(() => spawnGhostSlime(GAME_WIDTH / 2), 500);
