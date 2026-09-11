// =========================================================
// 1. PARAMÈTRES, VIDÉO DE FOND ET ENGRENAGE
// =========================================================

// --- BOUTON PARAMÈTRES (compatible Hub : images dans ../img/) ---
// En standalone (hors du hub), ../img/ n'existe pas → fallback ⚙️ en CSS.
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
const SETTINGS_BASE_IMG = '../img/setting.png';
let hoverInterval = null;
let currentFrame = 0;
const settingsBtnImg = document.getElementById('settings-btn-img');
let settingsImgOk = !!settingsBtnImg;

if (settingsBtnImg) {
    settingsBtnImg.addEventListener('error', () => {
        settingsImgOk = false;
        settingsBtnImg.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.className = 'settings-fallback';
        fallback.textContent = '⚙️';
        settingsBtnImg.parentElement.appendChild(fallback);
    });
}

function startSettingsAnim() {
    if (!settingsImgOk || hoverInterval) return;
    currentFrame = 0;
    settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100);
}

function stopSettingsAnim() {
    clearInterval(hoverInterval);
    hoverInterval = null;
    if (settingsImgOk && !settingsBtnImg.src.includes('settings4.png')) {
        settingsBtnImg.src = SETTINGS_BASE_IMG;
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval);
    hoverInterval = null;
    if (settingsImgOk) {
        settingsBtnImg.src = animFrames[3];
        setTimeout(() => { settingsBtnImg.src = SETTINGS_BASE_IMG; }, 300);
    }
    toggleSettings();
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

// NOTE FIX : avant, les sprites étaient désactivés en file:// (isLocalFile),
// ce qui faisait apparaître des cercles colorés au lieu des slimes.
// Matter.js fait juste un drawImage → ça marche très bien en local.
const isLocalFile = false;

// FIX HITBOX : les PNG ont tous des tailles différentes ET du padding transparent.
// Avant, le scale utilisait une fausse constante 256px → le cercle physique
// dépassait largement le dessin du slime.
// `opaqueMin` = plus petit côté de la zone RÉELLEMENT visible (bbox alpha mesurée).
// Le sprite est calé pour que le dessin fasse ~2% de plus que le hitbox.
// `fit` optionnel par niveau permet d'écarter l'image du cercle (art plus grand que la hitbox).
const HITBOX_FIT = 0.98;

const SLIMES = [
    { level: 1,  radius: 25,  opaqueMin: 88,  points: 2,    texture: 'assets/slime1.png',  color: '#aaffaa' }, 
    { level: 2,  radius: 36,  opaqueMin: 108, points: 4,    texture: 'assets/slime2.png',  color: '#aaaaff' }, 
    { level: 3,  radius: 50,  opaqueMin: 144, points: 8,    texture: 'assets/slime3.png',  color: '#ffffaa' }, 
    { level: 4,  radius: 65,  opaqueMin: 191, points: 16,   texture: 'assets/slime4.png',  color: '#ffaaff' }, 
    { level: 5,  radius: 82,  opaqueMin: 188, fit: 1.18, points: 32,   texture: 'assets/slime5.png',  color: '#aaffff' }, 
    { level: 6,  radius: 100, opaqueMin: 203, fit: 1.06, points: 64,   texture: 'assets/slime6.png',  color: '#ffccaa' }, 
    { level: 7,  radius: 120, opaqueMin: 224, points: 128,  texture: 'assets/slime7.png',  color: '#aaccff' }, 
    { level: 8,  radius: 140, opaqueMin: 262, points: 256,  texture: 'assets/slime8.png',  color: '#ccaaff' }, 
    { level: 9,  radius: 165, opaqueMin: 281, points: 512,  texture: 'assets/slime9.png',  color: '#ff9999' },
    { level: 10, radius: 190, opaqueMin: 333, points: 1024, texture: 'assets/slime10.png', color: '#99ff99' },
    { level: 11, radius: 215, opaqueMin: 535, points: 2048, texture: 'assets/slime11.png', color: '#9999ff' },
    { level: 12, radius: 245, opaqueMin: 583, points: 4096, texture: 'assets/slime12.png', color: '#ffffff' }  
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

// --- SEAU ET LIGNE DE DÉFAITE ---
const wallOptions = { isStatic: true, render: { visible: false }, restitution: 0.2, friction: 0.1 };
const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH, 50, wallOptions);
const leftWall = Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);
const rightWall = Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);

const loseLineY = 110; 

Composite.add(world, [ground, leftWall, rightWall]);

let currentSlime = null;
let currentSlimeLevel = 0;
let score = 0;
let canDrop = true;
let isGameOver = false;

// 🔥 NOUVEAU : Chrono global pour contrer le spam
let overflowTimer = 0;

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

// L'échelle est calculée sur la zone opaque réelle du PNG :
// le dessin visible fait HITBOX_FIT × diamètre du hitbox (légèrement plus grand que le cercle)
function getScale(radius, slimeData) {
    const fit = slimeData.fit || HITBOX_FIT;
    return (radius * 2 * fit) / slimeData.opaqueMin;
}

function getRenderOptions(slimeData, isGhost = false) {
    let options = {
        fillStyle: slimeData.color,
        strokeStyle: '#ffffff',
        lineWidth: 2,
        opacity: isGhost ? 0.5 : 1
    };

    if (slimeData.imageLoaded && !isLocalFile) {
        const scale = getScale(slimeData.radius, slimeData);
        options.sprite = {
            texture: slimeData.texture,
            xScale: scale,
            yScale: scale
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

// --- Z-ORDER : petits slimes TOUJOURS devant les gros ---
// Matter.js dessine les bodies dans l'ordre du world (le premier = le plus en arrière).
// On re-trie chaque frame par niveau DÉCROISSANT : niveau 12 en premier (fond),
// niveau 1 en dernier (premier plan). Les petits slimes ne sont donc jamais
// cachés par les gros ou leurs accessoires visuels.
Events.on(engine, 'beforeUpdate', () => {
    world.bodies.sort((a, b) => (b.slimeLevel || 0) - (a.slimeLevel || 0));
    if (world.cache) world.cache.allBodies = null;
});

// --- GAME OVER : ANTI-SPAM SYSTEM ---
Events.on(engine, 'beforeUpdate', () => {
    if (isGameOver) return;
    const bodies = Composite.allBodies(world);
    let slimeAboveLine = false;

    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (body.label === 'slime') {
            // Tolérance augmentée à 2.5 pour ignorer les sursauts.
            // (Un nouveau slime qui tombe aura une vélocité bien plus grande que 2.5 en arrivant à cette ligne)
            if (body.position.y < loseLineY && body.velocity.y > -2.5 && body.velocity.y < 2.5) {
                slimeAboveLine = true;
                break;
            }
        }
    }

    if (slimeAboveLine) {
        overflowTimer++;
        if (overflowTimer > 90) { // Environ 1.5 secondes pleines au-dessus de la ligne
            gameOver();
        }
    } else {
        // Redescend doucement, empêche le reset brutal avec le spam
        if (overflowTimer > 0) overflowTimer -= 2;
        if (overflowTimer < 0) overflowTimer = 0;
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
