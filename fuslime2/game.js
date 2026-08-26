// =========================================================
// 1. GESTION DES PARAMÈTRES ET DU CYCLE D'IMAGES
// =========================================================

const settingImages = ['img/setting.png', 'img/settings1.png', 'img/settings2.png', 'img/settings3.png', 'img/settings5.png'];
let currentSettingIndex = 0;
let hoverInterval;
const settingsBtnImg = document.getElementById('settings-btn-img');

function startSettingsAnim() {
    if (hoverInterval) return;
    currentSettingIndex = 0;
    if(settingsBtnImg) settingsBtnImg.src = settingImages[currentSettingIndex];
    hoverInterval = setInterval(() => {
        currentSettingIndex = (currentSettingIndex + 1) % settingImages.length;
        if(settingsBtnImg) settingsBtnImg.src = settingImages[currentSettingIndex];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); 
    hoverInterval = null;
    if (settingsBtnImg && !settingsBtnImg.src.includes('settings5.png')) { 
        settingsBtnImg.src = 'img/setting.png'; 
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); 
    hoverInterval = null;
    if(settingsBtnImg) settingsBtnImg.src = 'img/settings5.png';
    toggleSettings();
    setTimeout(() => { 
        if(settingsBtnImg) settingsBtnImg.src = 'img/setting.png'; 
    }, 300);
}

// Attacher les événements d'animation
if (settingsBtnImg) {
    settingsBtnImg.addEventListener('mouseenter', startSettingsAnim);
    settingsBtnImg.addEventListener('mouseleave', stopSettingsAnim);
    settingsBtnImg.addEventListener('click', clickSettingsAnim);
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if(modal) modal.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
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
    if(fsToggle) fsToggle.checked = !!document.fullscreenElement;
});

// --- GESTION AUDIO GLOBALE (YOUTUBE) ---
let ytPlayer;
let isMuted = localStorage.getItem('isMuted') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('music-toggle');
    if(musicToggle) musicToggle.checked = !isMuted;
});

// Fonction appelée par le checkbox du modal
function toggleMusic() {
    let musicToggle = document.getElementById('music-toggle');
    if(!musicToggle) return;
    isMuted = !musicToggle.checked; // Si c'est checké, on dé-mute (isMuted = false)
    localStorage.setItem('isMuted', isMuted);
    
    if (ytPlayer && ytPlayer.mute) {
        if (isMuted) ytPlayer.mute();
        else ytPlayer.unMute();
    }
}

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-audio', {
        height: '0',
        width: '0',
        videoId: '4RaguYU_SQI',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'showinfo': 0,
            'autohide': 1,
            'loop': 1,
            'playlist': '4RaguYU_SQI'
        },
        events: {
            'onReady': (e) => {
                if (isMuted) e.target.mute();
                else e.target.unMute();
            }
        }
    });
}


// =========================================================
// 2. MOTEUR DU JEU FUSLIME 2 (MATTER.JS)
// =========================================================

const SLIMES = [
    { level: 1, radius: 20, points: 2, texture: 'img/slime1.png', color: '#ffaaaa' },
    { level: 2, radius: 30, points: 4, texture: 'img/slime2.png', color: '#aaffaa' },
    { level: 3, radius: 42, points: 8, texture: 'img/slime3.png', color: '#aaaaff' },
    { level: 4, radius: 56, points: 16, texture: 'img/slime4.png', color: '#ffffaa' },
    { level: 5, radius: 72, points: 32, texture: 'img/slime5.png', color: '#ffaaff' },
    { level: 6, radius: 90, points: 64, texture: 'img/slime6.png', color: '#aaffff' },
    { level: 7, radius: 110, points: 128, texture: 'img/slime7.png', color: '#ffccaa' },
    { level: 8, radius: 135, points: 256, texture: 'img/slime8.png', color: '#aaccff' },
    { level: 9, radius: 160, points: 512, texture: 'img/slime9.png', color: '#ccaaff' },
    { level: 10, radius: 190, points: 1024, texture: 'img/slime10.png', color: '#ff9999' },
    { level: 11, radius: 220, points: 2048, texture: 'img/slime11.png', color: '#99ff99' },
    { level: 12, radius: 250, points: 4096, texture: 'img/slime12.png', color: '#9999ff' },
    { level: 13, radius: 280, points: 8192, texture: 'img/slime13.png', color: '#ffffff' }
];

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events;

const engine = Engine.create();
const world = engine.world;

const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;

const render = Render.create({
    element: document.getElementById('game-container'),
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

// --- SEAU ---
const wallOptions = { isStatic: true, render: { visible: false } };
const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH, 50, wallOptions);
const leftWall = Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);
const rightWall = Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT, wallOptions);
const loseLineY = 150; 
Composite.add(world, [ground, leftWall, rightWall]);

// --- VARIABLES GLOBALES ---
let currentSlime = null;
let currentSlimeLevel = 0;
let score = 0;
let canDrop = true;
let isGameOver = false;

// --- GESTION DES SFX (WEB AUDIO API) ---
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
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'merge') {
        osc.type = 'triangle';
        const baseFreq = 300 + (level * 60); 
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }
}

// --- EFFETS VISUELS ---
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

    for(let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = slimeData.color;
        p.style.width = (Math.random() * 12 + 6) + 'px';
        p.style.height = p.style.width;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 60 + 30;
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
}

function getScale(radius) {
    const originalImageSize = 256; // Modifie cette valeur si tes slimes sont en 512px
    return (radius * 2) / originalImageSize;
}

function spawnGhostSlime(x) {
    currentSlimeLevel = Math.floor(Math.random() * 3) + 1; 
    const slimeData = SLIMES[currentSlimeLevel - 1];

    currentSlime = Bodies.circle(x, 50, slimeData.radius, {
        isStatic: true,
        isSensor: true,
        label: 'ghost',
        render: {
            sprite: {
                texture: slimeData.texture,
                xScale: getScale(slimeData.radius),
                yScale: getScale(slimeData.radius)
            },
            opacity: 0.8
        }
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
        restitution: 0.2, 
        friction: 0.1,
        density: 0.001 * slimeData.level,
        label: 'slime',
        slimeLevel: currentSlimeLevel,
        render: {
            sprite: {
                texture: slimeData.texture,
                xScale: getScale(slimeData.radius),
                yScale: getScale(slimeData.radius)
            }
        }
    });

    Composite.add(world, realSlime);

    setTimeout(() => {
        if (!isGameOver) {
            spawnGhostSlime(GAME_WIDTH / 2);
            canDrop = true;
        }
    }, 1000); 
}

// --- CONTRÔLES SOURIS ET TACTILE ---
const container = document.getElementById('game-container');

container.addEventListener('mousemove', (e) => {
    if (!canDrop || isGameOver || !currentSlime) return;
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    const slimeRadius = SLIMES[currentSlimeLevel - 1].radius;

    if (x < slimeRadius) x = slimeRadius;
    if (x > GAME_WIDTH - slimeRadius) x = GAME_WIDTH - slimeRadius;

    Matter.Body.setPosition(currentSlime, { x: x, y: 50 });
});

container.addEventListener('click', dropSlime);

container.addEventListener('touchmove', (e) => {
    if (!canDrop || isGameOver || !currentSlime) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    let x = e.touches[0].clientX - rect.left;
    const slimeRadius = SLIMES[currentSlimeLevel - 1].radius;
    if (x < slimeRadius) x = slimeRadius;
    if (x > GAME_WIDTH - slimeRadius) x = GAME_WIDTH - slimeRadius;
    Matter.Body.setPosition(currentSlime, { x: x, y: 50 });
}, { passive: false });

container.addEventListener('touchend', (e) => {
    e.preventDefault();
    dropSlime();
});

// --- FUSION (MERGE) ---
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
                    restitution: 0.2,
                    friction: 0.1,
                    density: 0.001 * slimeData.level,
                    label: 'slime',
                    slimeLevel: newLevel,
                    render: {
                        sprite: {
                            texture: slimeData.texture,
                            xScale: getScale(slimeData.radius),
                            yScale: getScale(slimeData.radius)
                        }
                    }
                });

                Composite.remove(world, [bodyA, bodyB]);
                Composite.add(world, newSlime);
                
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
    context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    context.lineWidth = 2;
    context.setLineDash([10, 10]);
    context.stroke();
    context.setLineDash([]);
});

function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').classList.remove('hidden');
    if (currentSlime) Composite.remove(world, currentSlime); 
}

// Lancement du premier Slime !
spawnGhostSlime(GAME_WIDTH / 2);
