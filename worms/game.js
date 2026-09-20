const urlParams = new URLSearchParams(window.location.search);
const forceMode = urlParams.get('mode');

document.addEventListener('DOMContentLoaded', () => {
    if (forceMode === 'solo') {
        document.getElementById('net-button').style.display = 'none';
        document.getElementById('menu-separator').style.display = 'none';
    }
});

function autoFullscreen() {
    if (!document.getElementById('game-wrapper').classList.contains('size-full')) {
        setGameSize('wide');
    }
}

function setGameSize(size) {
    const container = document.getElementById('game-wrapper');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        container.classList.add('size-classic');
        document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        container.classList.add('size-wide');
        document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        container.classList.add('size-full');
        document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-wrapper').classList.contains('size-full')) setGameSize('wide');
});

// SETTINGS ANIMATION
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
    if (!settingsBtnImg.src.includes('settings4.png')) settingsBtnImg.src = '../img/setting.png';
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
}

function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }

const WIDTH = 800; const HEIGHT = 600; 
let WORLD_WIDTH = 2000; let WORLD_HEIGHT = 600;
const GRAVITY = 0.18; 

let camera = { x: 0, y: 0, zoom: 1 };
let mouseScreenX = WIDTH / 2; let mouseScreenY = HEIGHT / 2;
let manualCameraControl = false; 

let screenShake = 0;
let globalWind = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const bgmPlayer = new Audio();
bgmPlayer.loop = true; bgmPlayer.volume = 0.25;

function forceAudioUnlock() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.removeEventListener('click', forceAudioUnlock);
    document.removeEventListener('keydown', forceAudioUnlock);
}
document.addEventListener('click', forceAudioUnlock);
document.addEventListener('keydown', forceAudioUnlock);

function playBGM(mapId) {
    bgmPlayer.pause();
    if (mapId === 1) bgmPlayer.src = Math.random() < 0.5 ? 'img/paradise1.mp3' : 'img/paradise2.mp3';
    else if (mapId === 2) bgmPlayer.src = Math.random() < 0.5 ? 'img/hell1.mp3' : 'img/hell2.mp3';
    else bgmPlayer.src = Math.random() < 0.5 ? 'img/paradise1.mp3' : 'img/hell1.mp3';
    
    let playPromise = bgmPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => { document.addEventListener('click', () => { bgmPlayer.play().catch(e=>{}); }, {once: true}); });
    }
}

function playSound(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'bazooka_fire') {
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.025, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'grenade_throw') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'punch') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.15);
        gain.gain.setValueAtTime(0.025, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'explosion') {
        osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'squish') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'hit') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.015, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }
}

const canvasTerrain = document.getElementById('canvas-terrain');
const ctxTerrain = canvasTerrain.getContext('2d'); 
const offscreenTerrain = document.createElement('canvas');
const ctxOffTerrain = offscreenTerrain.getContext('2d', { willReadFrequently: true });
const canvasEnt = document.getElementById('canvas-entities');
const ctxEnt = canvasEnt.getContext('2d');

let gameState = 'menu'; 
let gameMode = 'local_1v1';
let currentPlayer = 1; 
let retreatFrames = 0; 
let turnFrames = 480; 
let mapImage = new Image();
let selectedMapId = 1;

function selectWeapon(wType, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    if (gameState !== 'playing') return;
    let activeWorm = worms[currentPlayer - 1];
    let hasControl = (gameMode !== 'online' || (myPlayerId === 1 && activeWorm.team === 'A') || (myPlayerId === 2 && activeWorm.team === 'B'));
    
    if (!hasControl) return;
    if (activeWorm && !activeWorm.isBot) {
        activeWorm.weapon = wType;
        document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-wpn-${wType}`).classList.add('active');
        if (conn && conn.open) conn.send({ type: 'weapon_sync', wType: wType, pid: activeWorm.id });
    }
}

function selectSlimeMap(id, el) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    selectedMapId = id;
    if (id === 3) { WORLD_WIDTH = 4000; WORLD_HEIGHT = 1200; } 
    else { WORLD_WIDTH = 2000; WORLD_HEIGHT = 600; }

    document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
    
    let videoElement = document.getElementById('bg-video');
    videoElement.style.opacity = 0;
    setTimeout(() => {
        if(id === 1) videoElement.src = 'img/background.mp4';
        else if(id === 2) videoElement.src = 'img/background2.mp4';
        else if(id === 3) videoElement.src = 'img/background4.mp4';
        else if(id === 4) videoElement.src = 'img/background3.mp4';
        videoElement.load(); videoElement.play().catch(e => console.log(e));
        videoElement.style.opacity = 0.6;
    }, 500);
    if (sprites['map' + id]) mapImage = sprites['map' + id];
}

let peer = null; let conn = null; let myPlayerId = 1;

function showOnlineMenu() { document.getElementById('online-menu').classList.remove('hidden'); }
function hideOnlineMenu() { 
    document.getElementById('online-menu').classList.add('hidden');
    if (peer) { peer.destroy(); peer = null; }
    document.getElementById('conn-status').innerText = ""; 
    document.getElementById('lobby-code-display').innerText = "...";
    if (forceMode === 'multi') window.location.href = '../index.html';
    else document.getElementById('main-menu').classList.remove('hidden');
}

function hostGame() {
    if (peer) peer.destroy();
    let status = document.getElementById('conn-status'); 
    status.style.color = "var(--sys)"; status.innerText = "Creating local server...";
    
    let code = 'SLM' + Math.floor(1000 + Math.random() * 9000);
    peer = new Peer(code);
    
    peer.on('open', (id) => { 
        document.getElementById('lobby-code-display').innerText = id; 
        status.innerText = "Waiting for an opponent..."; myPlayerId = 1; 
    });
    
    peer.on('connection', (connection) => { 
        conn = connection; 
        conn.on('open', () => { 
            conn.send({ type: 'map_sync', mapId: selectedMapId });
            setupConnection(); 
            status.innerText = "Opponent connected! Launching..."; 
            setTimeout(() => startGame('online'), 1000); 
        }); 
    });
    peer.on('error', (err) => { status.style.color = "var(--p2)"; status.innerText = "Error: " + err.type; });
}

function joinGame() {
    let code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if(!code) return alert("Invalid code.");
    if (peer) peer.destroy();
    
    let status = document.getElementById('conn-status'); 
    status.style.color = "var(--p1)"; status.innerText = "Connecting...";
    
    peer = new Peer();
    peer.on('open', () => {
        conn = peer.connect(code, { reliable: true });
        conn.on('open', () => { 
            setupConnection(); myPlayerId = 2; 
            status.style.color = "var(--sys)"; status.innerText = "Connected!"; 
            setTimeout(() => startGame('online'), 1000); 
        });
        conn.on('error', () => { status.style.color = "var(--p2)"; status.innerText = "Connection failed."; });
    });
    peer.on('error', (err) => { status.style.color = "var(--p2)"; status.innerText = err.type === 'peer-unavailable' ? "Game not found." : "Error: " + err.type; });
}

function setupConnection() {
    conn.on('data', (data) => {
        if (data.type === 'map_sync') selectSlimeMap(data.mapId, null);
        if (data.type === 'weapon_sync') { let w = worms.find(worm => worm.id === data.pid); if (w) w.weapon = data.wType; }
        if (data.type === 'sync' && gameState === 'playing') {
            let myTeam = myPlayerId === 1 ? 'A' : 'B';
            let enemy = worms.find(w => w.id === currentPlayer && w.team !== myTeam);
            if (enemy) {
                enemy.x = data.x; enemy.y = data.y; enemy.facing = data.facing; 
                enemy.state = data.state; enemy.animFrame = data.animFrame;
                enemy.isAiming = data.isAiming || false; enemy.aimDy = data.aimDy || 0;
            }
        }
        if (data.type === 'start_aim') turnFrames = data.frames;
        if (data.type === 'timeout') { isDragging = false; nextTurn(); }
        if (data.type === 'fire') { 
            let w = worms.find(worm => worm.id === data.pid); if (w) w.triggerAttackAnimation(data.wType);
            projectile = new Projectile(data.px, data.py, data.vx, data.vy, data.wType); 
            if (data.wType === 'bazooka') playSound('bazooka_fire');
            if (data.wType === 'grenade') playSound('grenade_throw');
            gameState = 'flying'; retreatFrames = 60; 
        }
        if (data.type === 'punch') {
            let w = worms.find(worm => worm.id === data.pid); if (w) w.triggerAttackAnimation('boxe');
            executePunch(w, data.px, data.py, data.angle, data.color, false);
        }
    });
}

function syncPlayerState() {
    if (conn && conn.open && gameMode === 'online') {
        let myTeam = myPlayerId === 1 ? 'A' : 'B'; let me = worms[currentPlayer - 1];
        if (me && me.team === myTeam) {
            let dy = isDragging ? (dragStartY - dragCurrentY) : 0;
            conn.send({ type: 'sync', x: me.x, y: me.y, facing: me.facing, state: me.state, animFrame: me.animFrame, isAiming: isDragging, aimDy: dy });
        }
    }
}

const sprites = {};
const imagesToLoad = {
    map1: 'img/map1.png', map2: 'img/map2.png', map3: 'img/map3.png', map4: 'img/map4.png',
    s1_idle_r: 'img/slime1_right.png', s1_idle_l: 'img/slime1_left.png',
    s1_walk_r1: 'img/slime1_moveright1.png', s1_walk_r2: 'img/slime1_moveright2.png', s1_walk_r3: 'img/slime1_moveright3.png',
    s1_walk_l1: 'img/slime1_moveleft1.png', s1_walk_l2: 'img/slime1_moveleft2.png', s1_walk_l3: 'img/slime1_moveleft3.png',
    s1_jump_r1: 'img/slime1_jumpright1.png', s1_jump_r2: 'img/slime1_jumpright2.png', s1_jump_r3: 'img/slime1_jumpright3.png',
    s1_jump_l1: 'img/slime1_jumpleft1.png', s1_jump_l2: 'img/slime1_jumpleft2.png', s1_jump_l3: 'img/slime1_jumpleft3.png',
    s1_atqtop_r: 'img/slime1_rightatqtop.png', s1_atqbot_r: 'img/slime1_rightatqbot.png',
    s1_atqtop_l: 'img/slime1_leftatqtop.png', s1_atqbot_l: 'img/slime1_leftatqbot.png',
    s2_idle_r: 'img/slime2_right.png', s2_idle_l: 'img/slime2_left.png',
    s2_walk_r1: 'img/slime2_moveright1.png', s2_walk_r2: 'img/slime2_moveright2.png', s2_walk_r3: 'img/slime2_moveright3.png',
    s2_walk_l1: 'img/slime2_moveleft1.png', s2_walk_l2: 'img/slime2_moveleft2.png', s2_walk_l3: 'img/slime2_moveleft3.png',
    s2_jump_r1: 'img/slime2_jumpright1.png', s2_jump_r2: 'img/slime2_jumpright2.png', s2_jump_r3: 'img/slime2_jumpright3.png',
    s2_jump_l1: 'img/slime2_jumpleft1.png', s2_jump_l2: 'img/slime2_jumpleft2.png', s2_jump_l3: 'img/slime2_jumpleft3.png',
    s2_atqtop_r: 'img/slime2_rightatqtop.png', s2_atqbot_r: 'img/slime2_rightatqbot.png',
    s2_atqtop_l: 'img/slime2_leftatqtop.png', s2_atqbot_l: 'img/slime2_leftatqbot.png'
};

for(let s = 1; s <= 2; s++) {
    for(let i = 1; i <= 3; i++) {
        imagesToLoad[`s${s}_greleft${i}`] = `img/slime${s}_greleft${i}.png`;
        imagesToLoad[`s${s}_greright${i}`] = `img/slime${s}_greright${i}.png`;
        imagesToLoad[`s${s}_boxleft${i}`] = `img/slime${s}_boxleft${i}.png`;
        imagesToLoad[`s${s}_boxright${i}`] = `img/slime${s}_boxright${i}.png`;
    }
}

let loadedCount = 0; let totalImages = Object.keys(imagesToLoad).length;

for (let key in imagesToLoad) {
    let img = new Image(); img.onload = onLoadComplete; 
    img.onerror = () => { img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; onLoadComplete(); };
    img.src = imagesToLoad[key]; sprites[key] = img;
}

function onLoadComplete() {
    loadedCount++;
    if (loadedCount >= totalImages) { 
        document.getElementById('loading-text').classList.add('hidden'); 
        document.getElementById('menu-buttons').classList.remove('hidden'); 
        mapImage = sprites['map' + selectedMapId] || sprites['map1']; 
        
        if (forceMode === 'multi') {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('online-menu').classList.remove('hidden');
        }
    }
}

const keys = { left: false, right: false, space: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.code === 'Space') { keys.space = true; if (e.target === document.body || e.target.closest('#game-wrapper')) e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.code === 'Space') keys.space = false;
});
window.addEventListener('mousemove', (e) => { 
    let rect = document.getElementById('game-wrapper').getBoundingClientRect(); 
    mouseScreenX = (e.clientX - rect.left) * (WIDTH / rect.width); 
    mouseScreenY = (e.clientY - rect.top) * (HEIGHT / rect.height);
});
window.addEventListener('wheel', (e) => {
    if (e.target.closest('#game-wrapper')) {
        e.preventDefault();
        let zoomAmount = e.deltaY > 0 ? -0.1 : 0.1; let oldZoom = camera.zoom;
        camera.zoom = Math.max(0.4, Math.min(camera.zoom + zoomAmount, 2.0)); 
        let viewW_old = WIDTH / oldZoom; let viewH_old = HEIGHT / oldZoom;
        let viewW_new = WIDTH / camera.zoom; let viewH_new = HEIGHT / camera.zoom;
        camera.x += (viewW_old - viewW_new) / 2; camera.y += (viewH_old - viewH_new) / 2;
    }
}, { passive: false });

function generateTerrain() {
    offscreenTerrain.width = WORLD_WIDTH; offscreenTerrain.height = WORLD_HEIGHT;
    ctxOffTerrain.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    if (mapImage && mapImage.complete && mapImage.naturalWidth > 0) ctxOffTerrain.drawImage(mapImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    else { ctxOffTerrain.fillStyle = "#45a29e"; ctxOffTerrain.fillRect(0, WORLD_HEIGHT/2, WORLD_WIDTH, WORLD_HEIGHT/2); }
}

function isSolid(x, y) {
    let px = Math.floor(x); let py = Math.floor(y);
    if (px < 0 || px >= WORLD_WIDTH || py >= WORLD_HEIGHT) return false;
    if (py < 0) return false;
    return ctxOffTerrain.getImageData(px, py, 1, 1).data[3] > 50; 
}

function explodeTerrain(ex, ey, radius) {
    ctxOffTerrain.globalCompositeOperation = 'destination-out';
    ctxOffTerrain.beginPath(); ctxOffTerrain.arc(ex, ey, radius, 0, Math.PI * 2); ctxOffTerrain.fill();
    ctxOffTerrain.globalCompositeOperation = 'source-over';
}

function getValidSpawn(x, position = 'top') {
    if (position === 'top') {
        for (let y = 10; y < WORLD_HEIGHT - 30; y++) {
            if (!isSolid(x, y) && !isSolid(x, y + 10) && isSolid(x, y + 20)) return y + 5; 
        }
    } else {
        for (let y = WORLD_HEIGHT - 40; y > 50; y--) {
            if (!isSolid(x, y) && !isSolid(x, y - 10) && isSolid(x, y + 20)) return y + 5;
        }
    }
    return 100;
}

class Slime {
    constructor(x, y, id, type, color, team, name, isBot = false) {
        this.x = x; this.y = y; this.id = id; this.type = type; this.color = color;
        this.team = team; this.name = name; this.isBot = isBot;
        this.scale = 1; this.radius = 12; this.vx = 0; this.vy = 0; this.hp = 100; this.isDead = false;
        this.facing = id % 2 !== 0 ? 'r' : 'l'; 
        this.state = 'idle'; this.animFrame = 1; this.animTimer = 0; this.landTimer = 0; this.isOnGround = false;
        this.weapon = 'bazooka'; this.aiInput = { left: false, right: false, space: false };
        this.isAiming = false; this.aimDy = 0;
        this.isAttacking = false; this.attackFrame = 1; this.attackTimer = 0;
        this.lastWeaponUsed = 'bazooka'; this.lastAimTop = false;
    }
    triggerAttackAnimation(weaponUsed) { this.isAttacking = true; this.attackFrame = 2; this.attackTimer = 0; this.lastWeaponUsed = weaponUsed; }
    
    update() {
        if (this.isDead) return;

        if (this.isAttacking) {
            this.attackTimer++;
            if (this.attackTimer > 6) { 
                this.attackFrame++; this.attackTimer = 0;
                if (this.attackFrame > 3) { this.isAttacking = false; this.attackFrame = 1; }
            }
        }

        let isMyTurn = false;
        if (gameMode === 'online') { let myTeam = myPlayerId === 1 ? 'A' : 'B'; isMyTurn = (this.id === currentPlayer && this.team === myTeam); } 
        else { isMyTurn = (currentPlayer === this.id); }

        let canMove = isMyTurn && (gameState === 'playing' || (gameState === 'flying' && retreatFrames > 0));
        let wasOnGround = this.isOnGround; this.isOnGround = false;

        if (canMove && !isDragging) {
            let activeKeys = this.isBot ? this.aiInput : keys;
            if (activeKeys.left) { this.vx = -1.5; this.facing = 'l'; if(this.state !== 'air' && this.state !== 'landed') this.state = 'walk'; }
            else if (activeKeys.right) { this.vx = 1.5; this.facing = 'r'; if(this.state !== 'air' && this.state !== 'landed') this.state = 'walk'; }
            else { this.vx = 0; if(this.state === 'walk') this.state = 'idle'; }

            if (activeKeys.space && wasOnGround) { playSound('squish'); this.vy = -6.5; this.state = 'air'; this.animFrame = 2; activeKeys.space = false; }
        } else if (!canMove && wasOnGround) {
            this.vx *= 0.5; if(Math.abs(this.vx) < 0.1) this.vx = 0;
            if (this.state === 'walk') this.state = 'idle';
        }

        if (this.state === 'walk' && Math.random() < 0.35) {
            particles.push(new Particle(this.x, this.y + 10, (Math.random()-0.5), -Math.random(), "rgba(200,200,200,0.4)", Math.random()*3+2, 20));
        }

        if (this.vx !== 0) {
            let nextX = this.x + this.vx; let step = 0; let maxStep = 8; 
            while (step <= maxStep && isSolid(nextX, this.y + this.radius - step - 1)) step++;
            if (step > maxStep || isSolid(nextX, this.y - this.radius + 2)) { this.vx = 0; } 
            else { 
                this.x = nextX; this.y -= step; 
                if (wasOnGround && this.vy >= 0) {
                    let drop = 0; let maxDrop = 8;
                    while (drop <= maxDrop && !isSolid(this.x, this.y + this.radius + drop)) drop++;
                    if (drop <= maxDrop) this.y += drop; 
                }
            }
        }

        this.vy += GRAVITY; this.y += this.vy;
        
        if (this.vy >= 0 && isSolid(this.x, this.y + this.radius)) {
            if (this.state === 'air' && this.vy > 2) { this.state = 'landed'; this.landTimer = 15; } 
            else if (this.state === 'air') this.state = 'idle';
            this.vy = 0; this.isOnGround = true;
            let push = 0; while(isSolid(this.x, this.y + this.radius - 1) && push < 20) { this.y -= 1; push++; }
        } else if (this.vy < 0 && isSolid(this.x, this.y - this.radius)) {
            this.vy = 0; let push = 0; while(isSolid(this.x, this.y - this.radius + 1) && push < 20) { this.y += 1; push++; }
        } else if (Math.abs(this.vy) > 1.5) { this.state = 'air'; }

        let targetScale = isSolid(this.x, this.y - 12) ? 0.35 : 1; 
        if (!this.scale) this.scale = 1; this.scale += (targetScale - this.scale) * 0.15;
        this.radius = 12 * this.scale; 

        if (this.state === 'walk') {
            this.animTimer++; if (this.animTimer > 6) { this.animFrame++; if (this.animFrame > 3) this.animFrame = 1; this.animTimer = 0; }
        } else if (this.state === 'air') { this.animFrame = 2; } 
        else if (this.state === 'landed') { this.animFrame = 3; this.landTimer--; if (this.landTimer <= 0) this.state = 'idle'; } 
        else { this.animFrame = 1; }

        if (this.y > WORLD_HEIGHT + 50) { this.hp = 0; this.isDead = true; checkWin(); }
        if (this.x < 10) this.x = 10; if (this.x > WORLD_WIDTH - 10) this.x = WORLD_WIDTH - 10;
    }

    draw() {
        if (this.isDead) return;
        
        let isMe = false;
        if (gameMode === 'online') { let myTeam = myPlayerId === 1 ? 'A' : 'B'; isMe = (this.id === currentPlayer && this.team === myTeam); } 
        else { isMe = (currentPlayer === this.id); }

        let aiming = (isMe && isDragging) || (!isMe && this.isAiming) || (this.isAiming && this.isBot);
        let currentAimDy = isMe && !this.isBot ? (dragStartY - dragCurrentY) : this.aimDy;
        let visualType = this.type; let isDrawingInvertedWeapon = false;

        if (this.isAttacking && (this.lastWeaponUsed === 'boxe' || this.lastWeaponUsed === 'grenade')) isDrawingInvertedWeapon = true;
        else if (aiming && this.state !== 'air' && this.state !== 'walk' && (this.weapon === 'boxe' || this.weapon === 'grenade')) isDrawingInvertedWeapon = true;

        if (isDrawingInvertedWeapon) visualType = this.type === 1 ? 2 : 1; 
        let spriteName = `s${visualType}_`;

        if (this.isAttacking) {
            if (this.lastWeaponUsed === 'bazooka') spriteName += `atq${this.lastAimTop ? 'top' : 'bot'}_${this.facing}`;
            else if (this.lastWeaponUsed === 'grenade') spriteName += `gre${this.facing === 'r' ? 'right' : 'left'}${this.attackFrame}`;
            else if (this.lastWeaponUsed === 'boxe') spriteName += `box${this.facing === 'r' ? 'right' : 'left'}${this.attackFrame}`;
        } 
        else if (aiming && this.state !== 'air' && this.state !== 'walk') {
            if (this.weapon === 'bazooka') { this.lastAimTop = currentAimDy < -20; spriteName += `atq${this.lastAimTop ? 'top' : 'bot'}_${this.facing}`; } 
            else if (this.weapon === 'grenade') spriteName += `gre${this.facing === 'r' ? 'right' : 'left'}1`;
            else if (this.weapon === 'boxe') spriteName += `box${this.facing === 'r' ? 'right' : 'left'}1`;
        }
        else if (this.state === 'air' || this.state === 'landed') spriteName += `jump_${this.facing}${this.animFrame}`;
        else if (this.state === 'walk') spriteName += `walk_${this.facing}${this.animFrame}`;
        else spriteName += `idle_${this.facing}`;

        let renderX = this.x; let renderY = this.y;
        
        ctxEnt.save();
        ctxEnt.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctxEnt.beginPath(); ctxEnt.ellipse(renderX, renderY + (6 * this.scale), 18 * this.scale, 6 * this.scale, 0, 0, Math.PI * 2); ctxEnt.fill();
        
        let breathX = 1; let breathY = 1;
        if (this.state === 'idle') { breathX = 1 + Math.sin(Date.now() / 250) * 0.03; breathY = 1 - Math.sin(Date.now() / 250) * 0.03; }
        else if (this.state === 'air') { breathX = 0.95; breathY = 1.05; }
        
        ctxEnt.translate(renderX, renderY); 
        ctxEnt.scale(this.scale * breathX, this.scale * breathY);
        
        let img = sprites[spriteName];
        if (img && img.complete && img.naturalWidth > 0) ctxEnt.drawImage(img, -20, -25, 40, 40);
        else { ctxEnt.fillStyle = this.color; ctxEnt.fillRect(-10, -10, 20, 20); }
        ctxEnt.restore();

        ctxEnt.fillStyle = this.color; ctxEnt.font = "bold 12px 'Rajdhani'"; ctxEnt.textAlign = "center";
        ctxEnt.shadowBlur = 4; ctxEnt.shadowColor = "#000"; ctxEnt.fillText(this.name, renderX, renderY - 45 * this.scale); ctxEnt.shadowBlur = 0;

        let barW = 30; let barH = 5; let barY = renderY - 38 * this.scale;
        let hpRatio = Math.max(0, this.hp / 100);
        ctxEnt.fillStyle = "rgba(0,0,0,0.8)"; ctxEnt.fillRect(renderX - barW/2, barY, barW, barH);
        ctxEnt.fillStyle = this.color; ctxEnt.shadowBlur = 6; ctxEnt.shadowColor = this.color;
        ctxEnt.fillRect(renderX - barW/2, barY, barW * hpRatio, barH);
        ctxEnt.shadowBlur = 0;
        ctxEnt.strokeStyle = "rgba(255,255,255,0.4)"; ctxEnt.lineWidth = 1; ctxEnt.strokeRect(renderX - barW/2, barY, barW, barH);

        if (currentPlayer === this.id && gameState !== 'end') {
            ctxEnt.fillStyle = (retreatFrames > 0 && gameState === 'flying') ? "#ffaa00" : "#fff";
            ctxEnt.shadowBlur = 10; ctxEnt.shadowColor = ctxEnt.fillStyle;
            ctxEnt.beginPath(); 
            ctxEnt.moveTo(renderX - 6, renderY - 65 * this.scale); 
            ctxEnt.lineTo(renderX + 6, renderY - 65 * this.scale); 
            ctxEnt.lineTo(renderX, renderY - 55 * this.scale); 
            ctxEnt.fill(); ctxEnt.shadowBlur = 0;
        }
    }
}

class Projectile {
    constructor(x, y, vx, vy, type = 'bazooka') { 
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; 
        this.type = type; this.active = true; this.radius = this.type === 'grenade' ? 5 : 4; 
        this.timer = 180; 
    }
    update() {
        if (!this.active) return;
        this.vy += GRAVITY; 
        if (this.type === 'bazooka' || this.type === 'grenade') this.vx += globalWind;
        
        let steps = this.type === 'grenade' ? 3 : 1;
        for(let i=0; i<steps; i++) {
            let dx = this.vx / steps; let dy = this.vy / steps;
            if (this.type === 'grenade') {
                if (isSolid(this.x + dx, this.y)) { this.vx *= -0.5; dx = this.vx/steps; }
                if (isSolid(this.x, this.y + dy)) { this.vy *= -0.5; this.vx *= 0.8; dy = this.vy/steps; }
            } else {
                if (isSolid(this.x + dx, this.y + dy)) { this.explode(); return; }
            }
            this.x += dx; this.y += dy;
        }
        
        if (this.type === 'bazooka') {
            particles.push(new Particle(this.x, this.y, 0, 0, "#fff", 2, 10));
            if (Math.random() < 0.5) { particles.push(new Particle(this.x, this.y, (Math.random()-0.5), (Math.random()-0.5), "rgba(150,150,150,0.5)", Math.random()*4+2, 25)); }
            if (this.y > WORLD_HEIGHT || this.x < 0 || this.x > WORLD_WIDTH) this.explode();
        } else if (this.type === 'grenade') {
            this.timer--;
            if (this.timer <= 0 || this.y > WORLD_HEIGHT) this.explode();
        }
    }
    explode() {
        this.active = false; playSound('explosion');
        let expRadius = this.type === 'grenade' ? 55 : 45; 
        explodeTerrain(this.x, this.y, expRadius);
        
        let pColor = this.type === 'grenade' ? "#ffaa00" : "#ff5500";
        for(let i=0; i<45; i++) {
            let angle = Math.random() * Math.PI * 2; let speed = Math.random() * 6 + 2;
            particles.push(new Particle(this.x, this.y, Math.cos(angle)*speed, Math.sin(angle)*speed, pColor, Math.random()*4+2, 40));
        }
        
        let hitSomeone = false;
        worms.forEach(w => {
            let dist = Math.hypot(w.x - this.x, w.y - this.y);
            if (dist < expRadius + 15 && !w.isDead) {
                let damage = Math.floor((1 - dist / (expRadius + 15)) * (this.type === 'grenade' ? 55 : 45));
                w.hp -= damage; hitSomeone = true;
                damageTexts.push(new DamageText(w.x, w.y - 30, damage, "#ff0055")); 
                let kbAngle = Math.atan2(w.y - this.y, w.x - this.x);
                w.vx += Math.cos(kbAngle) * (damage * 0.25); w.vy += Math.sin(kbAngle) * (damage * 0.25) - 4; 
                if (w.hp <= 0) { w.hp = 0; w.isDead = true; }
                updateUI();
            }
        });
        
        screenShake = this.type === 'grenade' ? 15 : 10; 
        if (hitSomeone) playSound('hit');
        setTimeout(() => { retreatFrames = 0; nextTurn(); }, 1500);
    }
    draw() {
        if (!this.active) return;
        ctxEnt.beginPath(); ctxEnt.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        if (this.type === 'grenade') {
            ctxEnt.fillStyle = (Math.floor(this.timer / 10) % 2 === 0) ? '#ff0000' : '#228b22'; 
            ctxEnt.fill(); ctxEnt.lineWidth = 1; ctxEnt.strokeStyle = '#fff'; ctxEnt.stroke();
        } else { ctxEnt.fillStyle = "#fff"; ctxEnt.fill(); }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, life) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.size = size; this.life = life; this.maxLife = life; }
    update() { this.x += this.vx; this.y += this.vy; this.life--; }
    draw() { ctxEnt.fillStyle = this.color; ctxEnt.globalAlpha = this.life / this.maxLife; ctxEnt.fillRect(this.x, this.y, this.size, this.size); ctxEnt.globalAlpha = 1; }
}

class DamageText {
    constructor(x, y, amount, color) { this.x = x; this.y = y; this.amount = amount; this.color = color; this.life = 45; this.maxLife = 45; this.vy = -1.5; this.vx = (Math.random() - 0.5) * 1.5; }
    update() { this.x += this.vx; this.y += this.vy; this.life--; }
    draw() {
        ctxEnt.save(); ctxEnt.globalAlpha = Math.max(0, this.life / this.maxLife); ctxEnt.fillStyle = this.color; ctxEnt.font = "bold 22px 'Rajdhani'"; ctxEnt.textAlign = "center";
        ctxEnt.shadowBlur = 4; ctxEnt.shadowColor = "#000"; ctxEnt.fillText("-" + this.amount, this.x, this.y); ctxEnt.restore();
    }
}

let worms = []; let projectile = null; let particles = []; let punchEffects = []; let damageTexts = [];
let isDragging = false; let dragStartX = 0, dragStartY = 0, dragCurrentX = 0, dragCurrentY = 0;

function buildUI() {
    const ui = document.getElementById('ui-layer');
    ui.innerHTML = `
        <div id="ui-left" class="team-container"></div>
        <div id="ui-center" style="display:flex; flex-direction:column; align-items:center;">
            <div id="turn-indicator">P1 Turn</div>
            <div id="turn-timer">08.00s</div>
            <div id="wind-indicator" class="wind-ui">WIND: <span id="wind-arrow">---</span></div>
        </div>
        <div id="ui-right" class="team-container"></div>
    `;
    let left = document.getElementById('ui-left'); let right = document.getElementById('ui-right');
    
    worms.forEach(w => {
        let container = (w.team === 'A' || w.team === 'C') ? left : right;
        let card = document.createElement('div'); card.className = 'player-info';
        card.innerHTML = `<b style="color: ${w.color}">${w.name}</b>
            <div class="hp-bar-bg">
                <div id="hp-p${w.id}" class="hp-bar" style="background-color: ${w.color}; width: 100%; box-shadow: 0 0 10px ${w.color};"></div>
                <span id="hp-txt-p${w.id}" class="hp-txt">100</span>
            </div>`;
        container.appendChild(card);
    });
}

function updateWindUI() {
    let windEl = document.getElementById('wind-arrow');
    if(!windEl) return;
    if(Math.abs(globalWind) < 0.01) { windEl.innerText = "NONE"; windEl.style.color = "#fff"; }
    else {
        let intensity = Math.ceil(Math.abs(globalWind) / 0.02);
        let arrow = globalWind > 0 ? ">".repeat(intensity) : "<".repeat(intensity);
        windEl.innerText = arrow; 
        windEl.style.color = globalWind > 0 ? "#00f0ff" : "#ff007f";
        windEl.style.textShadow = `0 0 10px ${windEl.style.color}`;
    }
}

function startGame(mode) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playBGM(selectedMapId); gameMode = mode;
    document.getElementById('online-menu').classList.add('hidden');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('ui-layer').classList.remove('hidden');
    generateTerrain();
    
    if (selectedMapId === 3 && mode !== 'local_ffa') {
        let s1_x = 300, s2_x = WORLD_WIDTH - 300, s3_x = 500, s4_x = WORLD_WIDTH - 500;
        worms = [
            new Slime(s1_x, getValidSpawn(s1_x, 'top'), 1, 1, 'var(--p1)', 'A', 'Blue (Top)', false),
            new Slime(s2_x, getValidSpawn(s2_x, 'top'), 2, 2, 'var(--p2)', 'B', 'Pink (Top)', mode === 'ai'),
            new Slime(s3_x, getValidSpawn(s3_x, 'bottom'), 3, 1, 'var(--p1)', 'A', 'Blue (Bottom)', false),
            new Slime(s4_x, getValidSpawn(s4_x, 'bottom'), 4, 2, 'var(--p2)', 'B', 'Pink (Bottom)', mode === 'ai')
        ];
    } else {
        if (mode === 'ai' || mode === 'local_1v1' || mode === 'online') {
            worms = [
                new Slime(200, getValidSpawn(200), 1, 1, 'var(--p1)', 'A', 'PLAYER 1', false),
                new Slime(WORLD_WIDTH - 200, getValidSpawn(WORLD_WIDTH - 200), 2, 2, 'var(--p2)', 'B', mode === 'ai' ? 'ARTILLERY BOT' : 'PLAYER 2', mode === 'ai')
            ];
        } else if (mode === 'local_2v2') {
            worms = [
                new Slime(200, getValidSpawn(200), 1, 1, 'var(--p1)', 'A', 'P1 (Cyan)', false), 
                new Slime(800, getValidSpawn(800), 2, 2, 'var(--p2)', 'B', 'P2 (Pink)', false),
                new Slime(1400, getValidSpawn(1400), 3, 1, 'var(--p1)', 'A', 'P3 (Cyan)', false), 
                new Slime(WORLD_WIDTH - 200, getValidSpawn(WORLD_WIDTH - 200), 4, 2, 'var(--p2)', 'B', 'P4 (Pink)', false)
            ];
        } else if (mode === 'local_ffa') {
            worms = [
                new Slime(200, getValidSpawn(200), 1, 1, 'var(--p1)', 'A', 'P1 (Cyan)', false), 
                new Slime(800, getValidSpawn(800), 2, 2, 'var(--p2)', 'B', 'P2 (Pink)', false),
                new Slime(1400, getValidSpawn(1400), 3, 1, 'var(--p3)', 'C', 'P3 (Gold)', false), 
                new Slime(WORLD_WIDTH - 200, getValidSpawn(WORLD_WIDTH - 200), 4, 2, 'var(--p4)', 'D', 'P4 (Green)', false)
            ];
        }
    }
    
    buildUI(); currentPlayer = 1; gameState = 'playing'; retreatFrames = 0; turnFrames = 480; 
    globalWind = (Math.random() - 0.5) * 0.1; updateWindUI();
    camera.zoom = 1; camera.x = worms[0].x - (WIDTH / 2); camera.y = Math.max(0, Math.min(worms[0].y - (HEIGHT / 2), WORLD_HEIGHT - HEIGHT));
    updateUI(); requestAnimationFrame(gameLoop);
}

function updateUI() {
    worms.forEach(w => {
        let hpBar = document.getElementById(`hp-p${w.id}`);
        let hpTxt = document.getElementById(`hp-txt-p${w.id}`);
        if (hpBar) hpBar.style.width = w.hp + '%';
        if (hpTxt) hpTxt.innerText = w.hp;
    });
    
    let activeWorm = worms[currentPlayer - 1];
    if (activeWorm && gameState !== 'end') {
        let turnInd = document.getElementById('turn-indicator');
        turnInd.innerText = `TURN ${activeWorm.name}`; turnInd.style.color = activeWorm.color; turnInd.style.borderColor = activeWorm.color;
        let hasControl = !activeWorm.isBot && (gameMode !== 'online' || (myPlayerId === 1 && activeWorm.team === 'A') || (myPlayerId === 2 && activeWorm.team === 'B'));
        if (hasControl) {
            document.getElementById('weapon-panel').classList.remove('hidden');
            document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`btn-wpn-${activeWorm.weapon}`).classList.add('active');
        } else { document.getElementById('weapon-panel').classList.add('hidden'); }
    }
}

function nextTurn() {
    checkWin(); if (gameState === 'end') return;
    let safeCounter = 0;
    do { currentPlayer = (currentPlayer % worms.length) + 1; safeCounter++; } while (worms[currentPlayer-1].isDead && safeCounter < 10);
    
    globalWind = (Math.random() - 0.5) * 0.1; updateWindUI();
    gameState = 'playing'; projectile = null; turnFrames = 480; 
    updateUI();
    if (worms[currentPlayer - 1].isBot) setTimeout(playAITurn, 500); 
}

function playAITurn() {
    let ai = worms[currentPlayer - 1]; if (!ai || !ai.isBot || ai.isDead) return nextTurn();

    let target = null; let minDist = Infinity;
    worms.forEach(w => {
        if (!w.isDead && w.team !== ai.team) {
            let dist = Math.hypot(w.x - ai.x, w.y - ai.y);
            if (dist < minDist) { minDist = dist; target = w; }
        }
    });

    if (!target) return nextTurn();
    if (minDist < 45) ai.weapon = 'boxe'; else if (Math.random() < 0.3) ai.weapon = 'grenade'; else ai.weapon = 'bazooka';

    let moveTime = Math.floor(Math.random() * 1500) + 500; 
    let moveDir = (target.x < ai.x) ? 'left' : 'right';
    if (Math.random() > 0.3 && minDist > 150) ai.aiInput[moveDir] = true;
    let jumpInterval = setInterval(() => { if (ai.aiInput[moveDir] && Math.abs(ai.vx) < 0.5 && ai.isOnGround) ai.aiInput.space = true; }, 250);

    setTimeout(() => {
        ai.aiInput.left = false; ai.aiInput.right = false; ai.aiInput.space = false; clearInterval(jumpInterval);
        if (ai.isDead || target.isDead || gameState !== 'playing') return;

        ai.facing = (target.x < ai.x) ? 'l' : 'r'; ai.isAiming = true;
        if(turnFrames > 180) turnFrames = 180;

        let dx = target.x - ai.x; let dy = (target.y - ai.y) - 15; 
        let errorOffsetX = (Math.random() - 0.5) * (minDist * 0.15); let errorOffsetY = (Math.random() - 0.5) * (minDist * 0.15);
        dx += errorOffsetX; dy += errorOffsetY;

        let ballisticDy = ai.weapon === 'bazooka' ? dy - (Math.abs(dx) * 0.4) : dy - (Math.abs(dx) * 0.6); 
        let angle = Math.atan2(ballisticDy, dx);
        let power = Math.min(Math.hypot(dx, ballisticDy) * 0.025 + 5, 18);

        let aimFrames = 0;
        let aimInterval = setInterval(() => {
            aimFrames++; ai.aimDy = - (aimFrames * 3); 
            if (aimFrames > 30) {
                clearInterval(aimInterval); ai.isAiming = false;
                if (ai.isDead || target.isDead || gameState !== 'playing') return;

                ai.triggerAttackAnimation(ai.weapon);
                if (ai.weapon === 'boxe') { executePunch(ai, ai.x, ai.y - 15 * ai.scale, angle, ai.color, true); } 
                else {
                    if (ai.weapon === 'bazooka') playSound('bazooka_fire');
                    if (ai.weapon === 'grenade') playSound('grenade_throw');
                    projectile = new Projectile(ai.x, ai.y - 15 * ai.scale, Math.cos(angle) * power, Math.sin(angle) * power, ai.weapon);
                    gameState = 'flying'; retreatFrames = 60; 
                }
            }
        }, 30); 
    }, moveTime);
}

function executePunch(worm, px, py, angle, color, isLocalAction) {
    playSound('punch');
    punchEffects.push({ x: px + Math.cos(angle)*30, y: py + Math.sin(angle)*30, life: 15, maxLife: 15, color: '#ff0000', angle: angle });
    
    if (isLocalAction || gameMode !== 'online' || myPlayerId === 1) {
        let hitSomeone = false;
        worms.forEach(w => {
            if (!w.isDead && w.id !== worm.id) {
                let dist = Math.hypot(w.x - px, w.y - py);
                if (dist < 65) {
                    w.hp -= 30; hitSomeone = true;
                    damageTexts.push(new DamageText(w.x, w.y - 30, 30, "#ffea00")); 
                    w.vx = Math.cos(angle) * 15; w.vy = Math.sin(angle) * 15 - 5; 
                    if (w.hp <= 0) { w.hp = 0; w.isDead = true; }
                }
            }
        });
        if (hitSomeone) { playSound('hit'); screenShake = 8; }
        updateUI();
    }
    gameState = 'flying'; retreatFrames = 40; 
    if (isLocalAction && conn && conn.open) conn.send({ type: 'punch', px: px, py: py, angle: angle, color: color, pid: worm.id });
    setTimeout(() => { retreatFrames = 0; nextTurn(); }, 1500);
}

function checkWin() {
    let aliveTeams = new Set(); let aliveCount = 0; let lastAlivePlayer = null;
    worms.forEach(w => { if (!w.isDead) { aliveTeams.add(w.team); aliveCount++; lastAlivePlayer = w; } });

    if (aliveTeams.size <= 1) {
        gameState = 'end'; document.getElementById('weapon-panel').classList.add('hidden');
        let winnerText = document.getElementById('winner-text');
        if (aliveCount === 0) { winnerText.innerText = "DRAW"; winnerText.style.color = "#fff"; } 
        else {
            let winningTeam = Array.from(aliveTeams)[0];
            if (winningTeam === 'A') { winnerText.innerText = "CYAN TEAM WINS"; winnerText.style.color = "var(--p1)"; }
            else if (winningTeam === 'B') { winnerText.innerText = "PINK TEAM WINS"; winnerText.style.color = "var(--p2)"; }
            else { winnerText.innerText = lastAlivePlayer.name + " WINS"; winnerText.style.color = lastAlivePlayer.color; }
        }
        setTimeout(() => { document.getElementById('game-over').classList.remove('hidden'); }, 1500);
    }
}

const gameWrapper = document.getElementById('game-wrapper');
function startAim(e) {
    if (e.target.closest('#weapon-panel') || e.target.closest('.btn') || e.target.closest('.hub-link-wrapper') || e.target.closest('.settings-btn-wrapper')) return; 
    let activeWorm = worms[currentPlayer - 1];
    if (gameState !== 'playing' || activeWorm.isBot) return; 
    let hasControl = (gameMode !== 'online' || (myPlayerId === 1 && activeWorm.team === 'A') || (myPlayerId === 2 && activeWorm.team === 'B'));
    if (!hasControl) return; 
    
    e.stopPropagation(); let rect = canvasEnt.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX; let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartX = ((clientX - rect.left) * (canvasEnt.width / rect.width)) / camera.zoom + camera.x;
    dragStartY = ((clientY - rect.top) * (canvasEnt.height / rect.height)) / camera.zoom + camera.y; 
    isDragging = true; activeWorm.state = 'idle'; 
    if (turnFrames > 180) turnFrames = 180;
    if (conn && conn.open) conn.send({type: 'start_aim', frames: turnFrames});
}

function moveAim(e) {
    if (!isDragging) return;
    e.stopPropagation(); e.preventDefault();
    let rect = canvasEnt.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX; let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragCurrentX = ((clientX - rect.left) * (canvasEnt.width / rect.width)) / camera.zoom + camera.x;
    dragCurrentY = ((clientY - rect.top) * (canvasEnt.height / rect.height)) / camera.zoom + camera.y;
    worms[currentPlayer - 1].facing = (dragStartX - dragCurrentX > 0) ? 'r' : 'l';
}

function endAim(e) {
    if (!isDragging) return;
    isDragging = false; e.stopPropagation();
    let activeWorm = worms[currentPlayer - 1];
    let dx = dragStartX - dragCurrentX; let dy = dragStartY - dragCurrentY;
    let power = Math.min(Math.hypot(dx, dy) * 0.1, 18); let angle = Math.atan2(dy, dx);
    
    if (power > 2) {
        document.getElementById('weapon-panel').classList.add('hidden'); 
        activeWorm.triggerAttackAnimation(activeWorm.weapon);
        let startY = activeWorm.y - 15 * activeWorm.scale;

        if (activeWorm.weapon === 'boxe') { executePunch(activeWorm, activeWorm.x, startY, angle, activeWorm.color, true); } 
        else {
            if (activeWorm.weapon === 'bazooka') playSound('bazooka_fire');
            if (activeWorm.weapon === 'grenade') playSound('grenade_throw');
            let vx = Math.cos(angle) * power; let vy = Math.sin(angle) * power;
            projectile = new Projectile(activeWorm.x, startY, vx, vy, activeWorm.weapon);
            gameState = 'flying'; retreatFrames = 60; 
            if (conn && conn.open) conn.send({ type: 'fire', px: activeWorm.x, py: startY, vx: vx, vy: vy, wType: activeWorm.weapon, pid: activeWorm.id });
        }
    }
}

gameWrapper.addEventListener('mousedown', startAim); window.addEventListener('mousemove', moveAim); window.addEventListener('mouseup', endAim);
gameWrapper.addEventListener('touchstart', startAim, {passive: false}); window.addEventListener('touchmove', moveAim, {passive: false}); window.addEventListener('touchend', endAim);

function updateCamera() {
    let viewW = WIDTH / camera.zoom; let viewH = HEIGHT / camera.zoom;
    let targetX = camera.x; let targetY = camera.y; manualCameraControl = false;
    
    if (mouseScreenX < 50) { targetX = camera.x - 15; manualCameraControl = true; }
    if (mouseScreenX > WIDTH - 50) { targetX = camera.x + 15; manualCameraControl = true; }
    if (mouseScreenY < 50) { targetY = camera.y - 15; manualCameraControl = true; }
    if (mouseScreenY > HEIGHT - 50) { targetY = camera.y + 15; manualCameraControl = true; }

    if (!manualCameraControl) {
        if (projectile && projectile.active) { targetX = projectile.x - viewW / 2; targetY = projectile.y - viewH / 2; } 
        else if (!isDragging && worms[currentPlayer - 1]) { targetX = worms[currentPlayer - 1].x - viewW / 2; targetY = worms[currentPlayer - 1].y - viewH / 2; }
    } else {
        if (projectile && projectile.active) { targetY = projectile.y - viewH / 2; } 
        else if (!isDragging && worms[currentPlayer - 1]) { targetY = worms[currentPlayer - 1].y - viewH / 2; }
    }

    camera.x += (targetX - camera.x) * 0.1; camera.y += (targetY - camera.y) * 0.1;
    if (WORLD_WIDTH > viewW) camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - viewW)); else camera.x = (WORLD_WIDTH - viewW) / 2; 
    if (WORLD_HEIGHT > viewH) camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - viewH)); else camera.y = (WORLD_HEIGHT - viewH) / 2;
}

function drawRadar() {
    let me = worms[currentPlayer - 1]; if (!me || me.isDead) return;
    worms.forEach(enemy => {
        if (enemy.id === me.id || enemy.isDead || enemy.team === me.team) return; 
        let screenX = (enemy.x - camera.x) * camera.zoom; let screenY = (enemy.y - camera.y) * camera.zoom;
        if (screenX < 0 || screenX > WIDTH || screenY < 0 || screenY > HEIGHT) {
            let radarX = Math.max(20, Math.min(WIDTH - 20, screenX)); let radarY = Math.max(20, Math.min(HEIGHT - 20, screenY));
            ctxEnt.save(); ctxEnt.translate(radarX, radarY);
            let angle = Math.atan2(screenY - HEIGHT/2, screenX - WIDTH/2); ctxEnt.rotate(angle);
            ctxEnt.fillStyle = enemy.color; ctxEnt.shadowBlur = 10; ctxEnt.shadowColor = enemy.color;
            ctxEnt.beginPath(); ctxEnt.moveTo(10, 0); ctxEnt.lineTo(-6, 6); ctxEnt.lineTo(-6, -6); ctxEnt.fill();
            ctxEnt.restore();
        }
    });
}

function gameLoop() {
    if (gameState === 'menu') return;
    if (retreatFrames > 0) retreatFrames--;

    if (gameState === 'playing') {
        turnFrames--;
        let timerUI = document.getElementById('turn-timer');
        if (timerUI) {
            let seconds = (Math.max(0, turnFrames) / 60).toFixed(2);
            timerUI.innerText = seconds + "s";
            if (turnFrames <= 120) timerUI.className = 'timer-danger';
            else if (isDragging || worms[currentPlayer - 1].isAiming) timerUI.className = 'timer-aim';
            else timerUI.className = '';
        }
        if (turnFrames <= 0) {
            turnFrames = 0; let activeWorm = worms[currentPlayer - 1]; let isHostHandlingBot = (activeWorm.isBot && myPlayerId === 1);
            let hasControl = (gameMode !== 'online' || (myPlayerId === 1 && activeWorm.team === 'A') || (myPlayerId === 2 && activeWorm.team === 'B'));
            if (hasControl || isHostHandlingBot) { isDragging = false; if (conn && conn.open) conn.send({type: 'timeout'}); nextTurn(); }
        }
    }

    syncPlayerState(); updateCamera();

    let viewW = WIDTH / camera.zoom; let viewH = HEIGHT / camera.zoom;
    let shakeOffsetX = 0; let shakeOffsetY = 0;
    if (screenShake > 0.5) { shakeOffsetX = (Math.random() - 0.5) * screenShake; shakeOffsetY = (Math.random() - 0.5) * screenShake; screenShake *= 0.85; } 
    else { screenShake = 0; }

    ctxTerrain.clearRect(0, 0, WIDTH, HEIGHT);
    ctxTerrain.drawImage(offscreenTerrain, camera.x + shakeOffsetX, camera.y + shakeOffsetY, viewW, viewH, 0, 0, WIDTH, HEIGHT);
    
    ctxEnt.clearRect(0, 0, WIDTH, HEIGHT);
    ctxEnt.save();
    ctxEnt.scale(camera.zoom, camera.zoom);
    ctxEnt.translate(-(camera.x + shakeOffsetX), -(camera.y + shakeOffsetY));

    worms.forEach(w => { w.update(); w.draw(); });

    if (gameState === 'playing' && isDragging) {
        let activeWorm = worms[currentPlayer - 1];
        let dx = dragStartX - dragCurrentX; let dy = dragStartY - dragCurrentY;
        let power = Math.min(Math.hypot(dx, dy), activeWorm.weapon === 'boxe' ? 50 : 180); 
        let angle = Math.atan2(dy, dx);
        let startX = activeWorm.x; let startY = activeWorm.y - 15 * activeWorm.scale;
        
        ctxEnt.beginPath(); ctxEnt.moveTo(startX, startY); ctxEnt.lineTo(startX + Math.cos(angle)*power, startY + Math.sin(angle)*power);
        ctxEnt.strokeStyle = activeWorm.weapon === 'boxe' ? '#ff0000' : activeWorm.color;
        ctxEnt.lineWidth = activeWorm.weapon === 'boxe' ? 5 : 3; ctxEnt.setLineDash([8, 8]); ctxEnt.stroke(); ctxEnt.setLineDash([]);
    }

    if (projectile) { projectile.update(); projectile.draw(); }
    
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].draw(); if (particles[i].life <= 0) particles.splice(i, 1); }
    for (let i = damageTexts.length - 1; i >= 0; i--) { damageTexts[i].update(); damageTexts[i].draw(); if (damageTexts[i].life <= 0) damageTexts.splice(i, 1); }
    for (let i = punchEffects.length - 1; i >= 0; i--) {
        let p = punchEffects[i];
        ctxEnt.save(); ctxEnt.translate(p.x, p.y); ctxEnt.rotate(p.angle); ctxEnt.fillStyle = `rgba(255, 0, 0, ${p.life/p.maxLife})`;
        ctxEnt.shadowBlur = 15; ctxEnt.shadowColor = '#ff0000'; ctxEnt.beginPath(); ctxEnt.roundRect(-20, -15, 40, 30, 10); ctxEnt.fill(); ctxEnt.restore();
        p.life--; if (p.life <= 0) punchEffects.splice(i, 1);
    }
    ctxEnt.restore(); drawRadar(); requestAnimationFrame(gameLoop);
}

const gamesHubList = [
    "../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html",
    "../cyber_smash/index.html", "../guessthemanga/index.html", "../drawer/index.html",
    "../texas_poker/index.html", "../blindtest/index.html", "../2048slime/index.html",
    "../worms/index.html"
];

let globalTouchStartX = 0, globalTouchStartY = 0; let globalTouchEndX = 0, globalTouchEndY = 0;
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
    if (tag === 'input' || tag === 'button' || tag === 'canvas' || tag === 'select') return true;
    if (target.closest('#game-wrapper') || target.closest('#weapon-panel') || target.closest('#settings-modal') || target.closest('.settings-btn-wrapper') || target.closest('.hub-link-wrapper')) return true;
    return false;
}

document.addEventListener('touchstart', e => { if (isExcludedElement(e.target)) return; globalTouchStartX = e.changedTouches[0].screenX; globalTouchStartY = e.changedTouches[0].screenY; }, { passive: true });
document.addEventListener('touchend', e => { if (isExcludedElement(e.target)) return; globalTouchEndX = e.changedTouches[0].screenX; globalTouchEndY = e.changedTouches[0].screenY; handleSwipeGesture(); }, { passive: true });
let isMouseDown = false;
document.addEventListener('mousedown', e => { if (isExcludedElement(e.target)) return; isMouseDown = true; globalTouchStartX = e.screenX; globalTouchStartY = e.screenY; });
document.addEventListener('mouseup', e => { if (isExcludedElement(e.target) || !isMouseDown) { isMouseDown = false; return; } isMouseDown = false; globalTouchEndX = e.screenX; globalTouchEndY = e.screenY; handleSwipeGesture(); });
