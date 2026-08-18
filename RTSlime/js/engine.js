// ==========================================
// MOTEUR MULTIJOUEUR (P2P + Boucle + Rendu)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');

let width, height;

// Dimensions Titanesques (4 images 8K pour sauver la RAM)
const MAP_WIDTH = 15360;
const MAP_HEIGHT = 8640;

let camera = { x: 0, y: 0 };
let zoom = 2.0;

let isPanning = false;
let isPanDragging = false;
let panStartX = 0;
let panStartY = 0;
let cameraStartX = 0;
let cameraStartY = 0;
let isDarkMode = false; 

// CHOIX DU BIOME EN COURS (classic ou hell)
let currentMapTheme = 'classic';

// --- GESTION DES ASSETS ---
const ASSETS_PATHS = {
    mapHG: 'assets/map/MAPHG.png',
    mapHD: 'assets/map/MAPHD.png',
    mapBG: 'assets/map/MAPBG.png',
    mapBD: 'assets/map/MAPBD.png',
    hellHG: 'assets/map/HELLHG.png',
    hellHD: 'assets/map/HELLHD.png',
    hellBG: 'assets/map/HELLBG.png',
    hellBD: 'assets/map/HELLBD.png',
    hdv: 'assets/bat/hdv.png',
    house: 'assets/bat/home.png',
    sawmill: 'assets/bat/scierie.png',
    mine: 'assets/bat/mine.png',
    barracks: 'assets/bat/warriorlearn.png',
    archery: 'assets/bat/shootlearn.png',
    mageTower: 'assets/bat/magicallearn.png',
    tower: 'assets/bat/tower.png',
    farmer: 'assets/skins/farmer.png',
    warrior: 'assets/skins/warrior.png',
    archer: 'assets/skins/archer.png',
    mage: 'assets/skins/mage.png',
    mean1: 'assets/skins/MEAN1.png',
    mean2: 'assets/skins/MEAN2.png',
    mean3: 'assets/skins/MEAN3.png',
    river1: 'assets/decoration/river1.png',
    river2: 'assets/decoration/river2.png',
    river3: 'assets/decoration/river3.png',
    farm: 'assets/bat/farm.png'
};

for(let i=1; i<=4; i++) ASSETS_PATHS['sapin'+i] = `assets/decoration/sapin${i}.png`;
for(let i=1; i<=6; i++) ASSETS_PATHS['three'+i] = `assets/decoration/three${i}.png`;
for(let i=1; i<=6; i++) ASSETS_PATHS['bouleau'+i] = `assets/decoration/bouleau${i}.png`;
for(let i=1; i<=8; i++) ASSETS_PATHS['wood'+i] = `assets/decoration/wood${i}.png`;
for(let i=1; i<=10; i++) ASSETS_PATHS['buisson'+i] = `assets/decoration/buisson${i}.png`;
for(let i=1; i<=4; i++) ASSETS_PATHS['herb'+i] = `assets/decoration/herb${i}.png`;
for(let i=1; i<=6; i++) ASSETS_PATHS['fleur'+i] = `assets/decoration/fleur${i}.png`;
for(let i=1; i<=2; i++) ASSETS_PATHS['shroom'+i] = `assets/decoration/shroom${i}.png`;

const images = {};
for (let key in ASSETS_PATHS) {
    images[key] = new Image();
    images[key].src = ASSETS_PATHS[key];
}

const uiGold = document.getElementById('val-gold');
const uiWood = document.getElementById('val-wood');
const uiFood = document.getElementById('val-food');
const uiPop = document.getElementById('val-pop');
const uiMaxPop = document.getElementById('val-maxpop');
const gameOverScreen = document.getElementById('game-over-screen');
const instructions = document.getElementById('build-instructions');
const uiBottom = document.getElementById('ui-bottom');
const chatBox = document.getElementById('global-chat-messages');

const btnSettings = document.getElementById('btn-settings');
if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
    });
}

let peer = new Peer(); 
let myId = null;
let myPseudo = "Anonyme";
let isHost = false;
let connToHost = null;
let connToGuest = null;

function setupPeerEvents(p) {
    p.on('open', id => {
        myId = id;
        let idDisplay = document.getElementById('my-id');
        if(idDisplay) idDisplay.innerText = id;
        document.getElementById('login-error').innerText = "";
    });

    p.on('connection', conn => {
        if(!isHost) return;
        connToGuest = conn;
        conn.on('data', data => handleNetworkData(data));
        document.getElementById('min-players-msg').style.display = 'none';
        document.getElementById('btn-start').style.display = 'block';
    });

    p.on('error', err => {
        document.getElementById('login-error').innerText = "Erreur: " + err.type;
    });
}

setupPeerEvents(peer);

document.getElementById('btn-host').addEventListener('click', (e) => {
    e.preventDefault();
    let pName = document.getElementById('player-name').value.trim();
    if (!pName) return;
    myPseudo = pName;
    isHost = true;
    
    let code = 'RTS' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-lobby').style.display = 'flex';
    document.getElementById('my-id').innerText = "Chargement...";
    
    let hostOptions = document.getElementById('host-options');
    if(hostOptions) hostOptions.style.display = 'block';
    
    peer.destroy();
    peer = new Peer(code);
    setupPeerEvents(peer);
});

document.getElementById('btn-join').addEventListener('click', (e) => {
    e.preventDefault();
    let pName = document.getElementById('player-name').value.trim();
    const targetId = document.getElementById('join-id').value.toUpperCase().trim();
    if (!pName || !targetId) return;
    myPseudo = pName;
    isHost = false;
    
    document.getElementById('login-error').innerText = "Connexion...";
    connToHost = peer.connect(targetId);
    
    connToHost.on('open', () => {
        document.getElementById('screen-login').style.display = 'none';
        document.getElementById('screen-lobby').style.display = 'flex';
        document.getElementById('my-id').innerText = targetId;
        document.getElementById('waiting-host-msg').style.display = 'block';
        document.getElementById('min-players-msg').style.display = 'none';
        document.getElementById('login-error').innerText = "";
    });
    
    connToHost.on('data', data => handleNetworkData(data));
});

document.getElementById('btn-start').addEventListener('click', () => {
    if(isHost) {
        let gameSeed = Math.floor(Math.random() * 1000000); 
        let mapChoiceEl = document.getElementById('map-choice');
        let mapChoice = mapChoiceEl ? mapChoiceEl.value : 'classic'; 
        initGame(gameSeed, mapChoice);
        connToGuest.send({ type: 'start_game', seed: gameSeed, mapTheme: mapChoice });
    }
});

// ==========================================
// ETAT DU JEU & VARIABLES
// ==========================================

let gameState = 'LOBBY';
let resHost = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 };
let resGuest = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 };

let buildMode = null;
let moveMode = null; 

let baseHost = null;
let baseGuest = null;
let buildings = [];
let units = [];
let enemies = []; 
let trees = [];
let rivers = [];
let decorations = []; 
let particles = [];
let lasers = [];
let selectedUnits = []; 
let selectedBuilding = null; 

let isSelecting = false;
let selectionStartScreen = { x: 0, y: 0 };
let selectionCurrentScreen = { x: 0, y: 0 };
let selectionStartWorld = { x: 0, y: 0 };
let selectionCurrentWorld = { x: 0, y: 0 };

let mouseHoverScreen = { x: 0, y: 0 };
let mouseHoverWorld = { x: 0, y: 0 };
let inputMode = 'mouse';
let survivalTimer = 0; 

// --- UTILITAIRES ---
function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
function getClosest(entity, array) {
    let closest = null; let minDist = Infinity;
    for(let o of array) { let d = dist(entity, o); if(d < minDist) { minDist = d; closest = o; } }
    return closest;
}
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({ x: x, y: y, vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, size: Math.random()*3+1, color: color, life: 0.5 + Math.random()*0.5 });
    }
}
function spawnLaser(a, b, color) { lasers.push({ x1:a.x, y1:a.y, x2:b.x, y2:b.y, color:color, life:0.15 }); }
function addSysLog(title, msg) {
    chatBox.innerHTML += `<p><span class="sys-log-msg">> ${title}:</span> ${msg}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

let mapSeed = 1;
function seededRandom() {
    mapSeed = (mapSeed * 9301 + 49297) % 233280;
    return mapSeed / 233280;
}

function isPositionFree(x, y, minDistance) {
    for(let r of rivers) if(dist({x,y}, r) < minDistance + r.radius) return false;
    for(let t of trees) if(dist({x,y}, t) < minDistance + 20) return false;
    for(let d of decorations) if(dist({x,y}, d) < minDistance + d.size/2) return false;
    if(baseHost && dist({x,y}, baseHost) < minDistance + baseHost.size/2 + 50) return false;
    if(baseGuest && dist({x,y}, baseGuest) < minDistance + baseGuest.size/2 + 50) return false;
    return true;
}

// --- GESTION FENETRE & CAMERA ---
function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
}
window.addEventListener('resize', resize); 

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoom += 0.2; else zoom -= 0.2;
    zoom = Math.max(0.5, Math.min(zoom, 4.0));
});

function updateCamera() {
    if (!isPanning && !isMinimapDragging) {
        const margin = 30; const speed = 25 / zoom;
        if (mouseHoverScreen.x < margin) camera.x -= speed;
        if (mouseHoverScreen.x > width - margin) camera.x += speed;
        if (mouseHoverScreen.y < margin) camera.y -= speed;
        if (mouseHoverScreen.y > height - margin) camera.y += speed;

        camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
        camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));
    }
}

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let cx = e.touches ? e.touches[0].clientX : e.clientX;
    let cy = e.touches ? e.touches[0].clientY : e.clientY;
    let screenX = cx - rect.left;
    let screenY = cy - rect.top;
    return { screenX, screenY, worldX: (screenX / zoom) + camera.x, worldY: (screenY / zoom) + camera.y };
}

// ==========================================
// SYSTEME DE DEPLACEMENT VIA MINIMAP
// ==========================================
let isMinimapDragging = false;

minimapCanvas.addEventListener('mousedown', (e) => {
    if(gameState !== 'PLAYING') return;
    e.stopPropagation(); 
    isMinimapDragging = true;
    moveCameraFromMinimap(e);
});

window.addEventListener('mousemove', (e) => {
    if (isMinimapDragging) {
        moveCameraFromMinimap(e);
    }
});

window.addEventListener('mouseup', () => {
    if (isMinimapDragging) {
        isMinimapDragging = false;
    }
});

function moveCameraFromMinimap(e) {
    const rect = minimapCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    let worldX = (x / rect.width) * MAP_WIDTH;
    let worldY = (y / rect.height) * MAP_HEIGHT;

    camera.x = worldX - (width / zoom) / 2;
    camera.y = worldY - (height / zoom) / 2;
    
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));
}

// --- MINIMAP ---
function drawMinimap() {
    mmCtx.clearRect(0, 0, 150, 150);
    mmCtx.fillStyle = currentMapTheme === 'hell' ? 'rgba(40, 10, 10, 0.8)' : 'rgba(0, 20, 30, 0.8)';
    mmCtx.fillRect(0, 0, 150, 150);

    const drawDot = (obj, color, size) => {
        mmCtx.fillStyle = color;
        mmCtx.fillRect((obj.x/MAP_WIDTH)*150 - size/2, (obj.y/MAP_HEIGHT)*150 - size/2, size, size);
    };

    rivers.forEach(r => drawDot(r, '#3388ff', 3));
    trees.forEach(t => drawDot(t, '#ff8c00', 1));
    buildings.forEach(b => drawDot(b, b.owner === 'host' ? '#00f0ff' : '#ff007f', 4));
    
    if (baseHost && baseHost.hp > 0) drawDot(baseHost, '#00f0ff', 6);
    if (baseGuest && baseGuest.hp > 0) drawDot(baseGuest, '#ff007f', 6);
    
    units.forEach(u => drawDot(u, u.owner === 'host' ? '#00f0ff' : '#ff007f', 2));
    enemies.forEach(e => drawDot(e, '#ff3333', 3));

    mmCtx.strokeStyle = 'white'; mmCtx.lineWidth = 1;
    mmCtx.strokeRect((camera.x/MAP_WIDTH)*150, (camera.y/MAP_HEIGHT)*150, (width/(zoom*MAP_WIDTH))*150, (height/(zoom*MAP_HEIGHT))*150);
}

// --- TRAITEMENT DES DONNEES ---
function handleNetworkData(data) {
    if (data.type === 'start_game' && !isHost) initGameClient(data.seed, data.mapTheme);
    if (data.type === 'sync' && !isHost) syncClientState(data);
    if (data.type === 'cmd' && isHost) executeCommand(data);
}

function executeCommand(data) {
    let playerRes = data.owner === 'host' ? resHost : resGuest;
    let playerBase = data.owner === 'host' ? baseHost : baseGuest;

    if (data.action === 'move') {
        let uList = units.filter(u => data.unitIds.includes(u.id));
        let ent = getEntityById(data.targetId);
        
        uList.forEach((u, i) => {
            let dx = data.x + (i%3)*20 - 20; let dy = data.y + Math.floor(i/3)*20;
            u.setCommand(ent ? ent.x : dx, ent ? ent.y : dy, ent);
        });
    }
    
    if (data.action === 'build') {
        if(data.bType === 'house' && buildings.filter(b=>b.type==='house' && b.owner===data.owner).length >= 10) return;
        let cost = getBuildingCost(data.bType);
        if(playerRes.gold >= cost.g && playerRes.wood >= cost.w && playerRes.food >= cost.f) {
            playerRes.gold -= cost.g; playerRes.wood -= cost.w; playerRes.food -= cost.f;
            buildings.push(new Building(data.x, data.y, data.bType, data.owner));
            if(data.bType === 'house') {
                units.push(new Unit(data.x - 20, data.y + 30, 'farmer', 'normal', data.owner));
                units.push(new Unit(data.x + 20, data.y + 30, 'farmer', 'normal', data.owner));
            }
        }
    }

    if (data.action === 'recruit') {
        if(playerRes.pop >= playerRes.maxPop) return;
        let cG = data.element === 'normal' ? (data.uType==='farmer'?0:20) : 40;
        let cF = data.element === 'normal' ? (data.uType==='farmer'?10:20) : 40;
        if (playerRes.gold >= cG && playerRes.food >= cF) {
            playerRes.gold -= cG; playerRes.food -= cF;
            let b = buildings.find(b=>b.id === data.bId);
            let sx = b ? b.x : playerBase.x; let sy = b ? b.y + 60 : playerBase.y + 70;
            units.push(new Unit(sx, sy, data.uType, data.element, data.owner));
        }
    }

    if (data.action === 'upgrade') {
        let b = buildings.find(b=>b.id === data.bId);
        if(b && playerRes.gold >= 100 && playerRes.wood >= 100) {
            playerRes.gold -= 100; playerRes.wood -= 100; b.level = 2;
        }
    }
    
    if (data.action === 'destroy') {
        let b = buildings.find(b=>b.id === data.bId);
        if(b && b.owner === data.owner) {
            let cost = getBuildingCost(b.type);
            playerRes.gold += Math.floor(cost.g/2); playerRes.wood += Math.floor(cost.w/2); playerRes.food += Math.floor(cost.f/2);
            units.forEach(u => { 
                if(u.state === 'farming' && u.targetEntityId === b.id) {
                    u.state = 'idle'; u.targetEntityId = null;
                    u.x = b.x; u.y = b.y; 
                }
            });
            buildings = buildings.filter(x => x !== b);
        }
    }
}

// --- GENERATION DE LA CARTE ---
function buildMapElements(seed) {
    mapSeed = seed;
    trees = []; rivers = []; decorations = [];

    for(let i=0; i<20; i++) {
        let placed = false;
        let attempts = 0;
        while(!placed && attempts < 10) {
            let rx = seededRandom() * MAP_WIDTH; let ry = seededRandom() * MAP_HEIGHT;
            if (isPositionFree(rx, ry, 50)) {
                let variant = Math.floor(seededRandom() * 3) + 1; 
                rivers.push(new River(rx, ry, variant));
                placed = true;
            }
            attempts++;
        }
    }

    const treeFamilies = [
        ['sapin1', 'sapin2', 'sapin3', 'sapin4'],
        ['three1', 'three2', 'three3', 'three4', 'three5', 'three6'],
        ['bouleau1', 'bouleau2', 'bouleau3', 'bouleau4', 'bouleau5', 'bouleau6']
    ];
    
    for(let i=0; i<150; i++) { 
        let cx = seededRandom() * MAP_WIDTH; let cy = seededRandom() * MAP_HEIGHT;
        if(dist({x:cx,y:cy}, baseHost) < 1500 || dist({x:cx,y:cy}, baseGuest) < 1500) continue;
        
        let family = treeFamilies[Math.floor(seededRandom() * treeFamilies.length)];
        for(let j=0; j<25; j++) { 
            let tx = cx + (seededRandom()-0.5)*400; let ty = cy + (seededRandom()-0.5)*400;
            if (isPositionFree(tx, ty, 20)) {
                let skin = family[Math.floor(seededRandom() * family.length)];
                trees.push(new ResourceNode(tx, ty, 'tree', skin));
            }
        }
    }

    const decoFamilies = [
        ['wood1', 'wood2', 'wood3', 'wood4', 'wood5', 'wood6', 'wood7', 'wood8'],
        ['buisson1', 'buisson2', 'buisson3', 'buisson4', 'buisson5', 'buisson6', 'buisson7', 'buisson8', 'buisson9', 'buisson10'],
        ['herb1', 'herb2', 'herb3', 'herb4'],
        ['fleur1', 'fleur2', 'fleur3', 'fleur4', 'fleur5', 'fleur6'],
        ['shroom1', 'shroom2']
    ];
    for(let i=0; i<300; i++) { 
        let cx = seededRandom() * MAP_WIDTH; let cy = seededRandom() * MAP_HEIGHT;
        let family = decoFamilies[Math.floor(seededRandom() * decoFamilies.length)];
        let count = Math.floor(seededRandom() * 4) + 2; 
        
        for(let j=0; j<count; j++) {
            let dx = cx + (seededRandom()-0.5)*150; let dy = cy + (seededRandom()-0.5)*150;
            let size = seededRandom() * 10 + 15; 
            if (isPositionFree(dx, dy, size)) {
                let skin = family[Math.floor(seededRandom() * family.length)];
                decorations.push(new Decoration(dx, dy, skin, size));
            }
        }
    }
}

// --- INITIALISATION ---
function initGame(seed, mapTheme = 'classic') {
    gameState = 'PLAYING';
    currentMapTheme = mapTheme;
    resHost = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 }; 
    resGuest = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 }; 
    units = []; buildings = []; enemies = []; particles = []; lasers = []; selectedUnits = [];
    buildMode = null; moveMode = null; selectedBuilding = null;
    survivalTimer = 0;
    
    document.getElementById('screen-lobby').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    resize();

    baseHost = new Base(1500, MAP_HEIGHT/2, 'host');
    baseGuest = new Base(MAP_WIDTH - 1500, MAP_HEIGHT/2, 'guest');
    
    camera.x = baseHost.x - (width / zoom) / 2;
    camera.y = baseHost.y - (height / zoom) / 2;
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));

    buildMapElements(seed);

    for(let i=0; i<180; i++) {
        let ex = Math.random() * MAP_WIDTH; let ey = Math.random() * MAP_HEIGHT;
        if(dist({x:ex,y:ey}, baseHost) > 1800 && dist({x:ex,y:ey}, baseGuest) > 1800) {
            enemies.push(new Enemy(ex, ey));
        }
    }

    let hHouse = new Building(baseHost.x - 150, baseHost.y, 'house', 'host');
    buildings.push(hHouse);
    units.push(new Unit(hHouse.x - 20, hHouse.y + 40, 'farmer', 'normal', 'host'));
    units.push(new Unit(hHouse.x + 20, hHouse.y + 40, 'farmer', 'normal', 'host'));

    let gHouse = new Building(baseGuest.x + 150, baseGuest.y, 'house', 'guest');
    buildings.push(gHouse);
    units.push(new Unit(gHouse.x - 20, gHouse.y + 40, 'farmer', 'normal', 'guest'));
    units.push(new Unit(gHouse.x + 20, gHouse.y + 40, 'farmer', 'normal', 'guest'));

    updateUI(); renderBottomUI();
}

function initGameClient(seed, mapTheme = 'classic') {
    gameState = 'PLAYING';
    currentMapTheme = mapTheme;
    survivalTimer = 0;
    resHost = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 }; 
    resGuest = { gold: 0, wood: 0, food: 10, pop: 0, maxPop: 0 };
    
    document.getElementById('screen-lobby').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    resize();
    
    baseHost = new Base(1500, MAP_HEIGHT/2, 'host');
    baseGuest = new Base(MAP_WIDTH - 1500, MAP_HEIGHT/2, 'guest');
    buildMapElements(seed);
    
    updateUI(); renderBottomUI();
}

function syncClientState(data) {
    if (!baseGuest && data.bG) {
        camera.x = data.bG.x - (width / zoom) / 2;
        camera.y = data.bG.y - (height / zoom) / 2;
        camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
        camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));
    }
    
    survivalTimer = data.st; 
    resHost = data.resH; resGuest = data.resG;
    baseHost.hp = data.bH.hp;
    baseGuest.hp = data.bG.hp;
    
    trees = data.t.map(t => { let r = new ResourceNode(t.x, t.y, 'tree', t.s); r.id = t.id; r.amount = t.a; return r; });
    enemies = data.en.map(e => { let en = new Enemy(e.x, e.y); en.id=e.id; en.hp=e.hp; en.skinNum=e.s; en.slowTimer=e.st; return en; });
    
    buildings = data.b.map(b => {
        let build = new Building(b.x, b.y, b.t, b.o); build.id = b.id; build.hp = b.hp; build.maxHp = b.mHp; build.level = b.l; build.farmersInside = b.fi; return build;
    });

    units = data.u.map(u => {
        let un = new Unit(u.x, u.y, u.t, u.e, u.o); un.id = u.id; un.hp = u.hp; un.maxHp = u.mHp; un.state = u.s; un.payload = u.p; un.slowTimer = u.st; return un;
    });

    updateUI();
}

// --- INPUTS & SÉLECTION & CAMERA PANNING ---
canvas.addEventListener('mousedown', (e) => {
    if(gameState !== 'PLAYING') return;
    const pos = getPointerPos(e);
    const wPos = { x: pos.worldX, y: pos.worldY };

    if(e.button === 2) {
        if(moveMode || buildMode) return; 
        isPanning = true; isPanDragging = false;
        panStartX = e.clientX; panStartY = e.clientY;
        cameraStartX = camera.x; cameraStartY = camera.y;
        return;
    }

    if(moveMode) {
        if(e.button === 0) {
            moveMode.x = wPos.x; moveMode.y = wPos.y;
            spawnParticles(wPos.x, wPos.y, '#00f0ff', 20);
            moveMode = null; instructions.style.display = 'none'; renderBottomUI();
        }
        return;
    }

    if(buildMode) {
        if(e.button === 0) {
            let actualId = isHost ? 'host' : 'guest';
            if (isHost) executeCommand({ action: 'build', bType: buildMode, x: wPos.x, y: wPos.y, owner: actualId });
            else connToHost.send({ type: 'cmd', action: 'build', bType: buildMode, x: wPos.x, y: wPos.y, owner: actualId });
            setBuildMode(null);
        }
        return;
    }

    if(e.button === 0) {
        isSelecting = true;
        selectionStartScreen = { x: pos.screenX, y: pos.screenY };
        selectionStartWorld = wPos;
        selectionCurrentScreen = { x: pos.screenX, y: pos.screenY };
        selectionCurrentWorld = wPos;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getPointerPos(e);
    mouseHoverScreen = { x: pos.screenX, y: pos.screenY };
    mouseHoverWorld = { x: pos.worldX, y: pos.worldY };

    if (isPanning) {
        let currentX = e.clientX; let currentY = e.clientY;
        let dx = currentX - panStartX; let dy = currentY - panStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isPanDragging = true;
        camera.x = cameraStartX - dx / zoom;
        camera.y = cameraStartY - dy / zoom;
        camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
        camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));
    }

    if (!isSelecting) return;
    selectionCurrentScreen = { x: pos.screenX, y: pos.screenY };
    selectionCurrentWorld = { x: pos.worldX, y: pos.worldY };
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
        isPanning = false; setTimeout(() => isPanDragging = false, 50); 
        return;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2) return; 
    if (!isSelecting || gameState !== 'PLAYING') return;
    isSelecting = false;
    
    let actualId = isHost ? 'host' : 'guest';
    let minX = Math.min(selectionStartWorld.x, selectionCurrentWorld.x);
    let maxX = Math.max(selectionStartWorld.x, selectionCurrentWorld.x);
    let minY = Math.min(selectionStartWorld.y, selectionCurrentWorld.y);
    let maxY = Math.max(selectionStartWorld.y, selectionCurrentWorld.y);

    let isClick = (maxX - minX < 10 && maxY - minY < 10);

    if (isClick) {
        let clickedUnit = units.find(u => dist(selectionStartWorld, u) < u.radius + 15 && u.owner === actualId);
        if (clickedUnit) {
            selectedUnits = [clickedUnit.id]; selectedBuilding = null;
        } else {
            selectedUnits = [];
            let clickedBuild = buildings.find(b => dist(selectionStartWorld, b) < b.size/2 + 10 && b.owner === actualId);
            let myBase = isHost ? baseHost : baseGuest;
            if(clickedBuild) { selectedBuilding = clickedBuild; } 
            else if (dist(selectionStartWorld, myBase) < myBase.size/2 + 10) { selectedBuilding = myBase; } 
            else { selectedBuilding = null; }
        }
        renderBottomUI();
    } else {
        selectedUnits = units.filter(u => u.owner === actualId && u.x > minX && u.x < maxX && u.y > minY && u.y < maxY).map(u=>u.id);
        selectedBuilding = null; renderBottomUI();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if(gameState !== 'PLAYING') return;
    
    if(buildMode || moveMode) { setBuildMode(null); moveMode = null; instructions.style.display = 'none'; return; }
    if (isPanDragging) return;
    if (selectedUnits.length === 0) return;

    let actualId = isHost ? 'host' : 'guest';
    
    const pos = getPointerPos(e);
    const wPos = { x: pos.worldX, y: pos.worldY };

    let clickedEnt = units.find(u=>dist(wPos, u)<25) 
        || buildings.find(b=>dist(wPos, b)<b.size) 
        || trees.find(t=>dist(wPos, t)<40) 
        || rivers.find(r=>dist(wPos, r)<r.radius) 
        || enemies.find(en=>dist(wPos, en)<25) 
        || (dist(wPos, baseHost)<baseHost.size/2 + 20 ? baseHost : null) 
        || (dist(wPos, baseGuest)<baseGuest.size/2 + 20 ? baseGuest : null);

    if (isHost) executeCommand({ action: 'move', unitIds: selectedUnits, x: wPos.x, y: wPos.y, targetId: clickedEnt?clickedEnt.id:null, owner: actualId });
    else connToHost.send({ type: 'cmd', action: 'move', unitIds: selectedUnits, x: wPos.x, y: wPos.y, targetId: clickedEnt?clickedEnt.id:null, owner: actualId });
    
    spawnParticles(wPos.x, wPos.y, '#00f0ff', 5);
});

// --- UI ET ACTIONS ---
function setBuildMode(type) {
    buildMode = buildMode === type ? null : type;
    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active-mode'));
    if(buildMode) {
        let el = document.getElementById('btn-b-' + buildMode);
        if(el) el.classList.add('active-mode');
        instructions.style.display = 'block';
    } else { instructions.style.display = 'none'; }
}

function getBuildingCost(type) {
    if(type === 'house') return { g: 0, w: 10, f: 0 };
    if(type === 'sawmill') return { g: 0, w: 0, f: 50 }; 
    if(type === 'farm') return { g: 0, w: 30, f: 0 };
    if(type === 'mine') return { g: 0, w: 50, f: 50 };
    if(['barracks', 'archery', 'mage'].includes(type)) return { g: 250, w: 250, f: 250 };
    if(type === 'tower') return { g: 100, w: 50, f: 0 };
    return {g:0,w:0,f:0};
}

function renderBottomUI() {
    uiBottom.innerHTML = ""; 
    if (!selectedBuilding) { uiBottom.innerHTML = "<div style='color:#aaa;'>Sélectionnez votre Hôtel de Ville ou un Bâtiment.</div>"; return; }

    let bTitle = selectedBuilding.type === 'hdv' ? 'HÔTEL DE VILLE' : selectedBuilding.type.toUpperCase();
    let title = document.createElement('div');
    title.style.color = 'white'; title.style.marginRight = '15px'; title.innerHTML = `<b>${bTitle}</b>` + (selectedBuilding.level ? ` Lv.${selectedBuilding.level}` : '');
    uiBottom.appendChild(title);

    if (selectedBuilding.type === 'hdv') {
        uiBottom.appendChild(createBtn('color-build', 'MAISON', '10🪵', () => setBuildMode('house'), null, 'btn-b-house', ASSETS_PATHS.house));
        uiBottom.appendChild(createBtn('color-build', 'SCIERIE', '50🍞', () => setBuildMode('sawmill'), null, 'btn-b-sawmill', ASSETS_PATHS.sawmill));
        uiBottom.appendChild(createBtn('color-build', 'FERME', '30🪵', () => setBuildMode('farm'), null, 'btn-b-farm', ASSETS_PATHS.farm));
        uiBottom.appendChild(createBtn('color-build', 'MINE', '50🪵 50🍞', () => setBuildMode('mine'), null, 'btn-b-mine', ASSETS_PATHS.mine));
        uiBottom.appendChild(createDivider());
        uiBottom.appendChild(createBtn('color-build', 'CASERNE', '250💰/🪵/🍞', () => setBuildMode('barracks'), null, 'btn-b-barracks', ASSETS_PATHS.barracks));
        uiBottom.appendChild(createBtn('color-build', 'STAND TIR', '250💰/🪵/🍞', () => setBuildMode('archery'), null, 'btn-b-archery', ASSETS_PATHS.archery));
        uiBottom.appendChild(createBtn('color-build', 'T. MAGE', '250💰/🪵/🍞', () => setBuildMode('mage'), null, 'btn-b-mage', ASSETS_PATHS.mageTower));
        uiBottom.appendChild(createBtn('color-build', 'TOUR DEF', '100💰 50🪵', () => setBuildMode('tower'), null, 'btn-b-tower', ASSETS_PATHS.tower));
        uiBottom.appendChild(createDivider());
        uiBottom.appendChild(createBtn('color-recruit', 'FERMIER', '10🍞', () => sendAction('recruit', {uType:'farmer', element:'normal', bId:selectedBuilding.id}), null, null, ASSETS_PATHS.farmer));
    } 
    else if (['barracks', 'archery', 'mage'].includes(selectedBuilding.type)) {
        if (selectedBuilding.level === 1) {
            uiBottom.appendChild(createBtn('color-upgrade', 'AMÉLIORER', '100💰 100🪵', () => sendAction('upgrade', {bId:selectedBuilding.id})));
            uiBottom.appendChild(createDivider());
        }
        let uType = selectedBuilding.type === 'barracks' ? 'warrior' : selectedBuilding.type === 'archery' ? 'archer' : 'mage';
        uiBottom.appendChild(createBtn('color-recruit', 'NORMAL', '20💰 20🍞', () => sendAction('recruit', {uType:uType, element:'normal', bId:selectedBuilding.id}), null, null, ASSETS_PATHS[uType]));
        if (selectedBuilding.level > 1) {
            uiBottom.appendChild(createBtn('color-recruit', '🔥 FEU', '40💰 40🍞', () => sendAction('recruit', {uType:uType, element:'fire', bId:selectedBuilding.id}), 'var(--neon-red)', null, ASSETS_PATHS[uType]));
            uiBottom.appendChild(createBtn('color-recruit', '💧 EAU', '40💰 40🍞', () => sendAction('recruit', {uType:uType, element:'water', bId:selectedBuilding.id}), 'var(--neon-water)', null, ASSETS_PATHS[uType]));
            uiBottom.appendChild(createBtn('color-recruit', '🌿 PLANTE', '40💰 40🍞', () => sendAction('recruit', {uType:uType, element:'plant', bId:selectedBuilding.id}), 'var(--neon-green)', null, ASSETS_PATHS[uType]));
        }
    } 
    else if (['sawmill', 'mine', 'farm'].includes(selectedBuilding.type)) {
        let info = document.createElement('div'); info.style.color = '#aaa'; info.innerText = `Ouvriers: ${selectedBuilding.farmersInside}/5.`; uiBottom.appendChild(info);
    }
    
    if(selectedBuilding.type !== 'hdv') {
        uiBottom.appendChild(createDivider());
        uiBottom.appendChild(createBtn('color-build', 'DÉPLACER', '', () => startMoveBuilding(selectedBuilding), 'var(--neon-cyan)'));
        uiBottom.appendChild(createBtn('color-destroy', 'DÉTRUIRE', 'Gains 50%', () => sendAction('destroy', {bId:selectedBuilding.id})));
    }
    uiBottom.appendChild(createDivider());
    uiBottom.appendChild(createBtn('color-build', 'FERMER', '', () => { selectedBuilding = null; renderBottomUI(); }));
}

function createBtn(colorClass, title, costText, onClick, overrideColor=null, id=null, iconSrc=null) {
    let b = document.createElement('button'); b.className = `build-btn ${colorClass}`;
    if(id) b.id = id;
    if(overrideColor) { b.style.borderColor = overrideColor; b.style.color = overrideColor; }
    let imgHtml = iconSrc ? `<img src="${iconSrc}">` : '';
    b.innerHTML = `${imgHtml}<div>${title}</div><span>${costText}</span>`;
    b.onclick = onClick; return b;
}

function sendAction(action, data) {
    data.action = action; 
    let actualId = isHost ? 'host' : 'guest';
    data.owner = actualId;
    if(isHost) executeCommand(data); else connToHost.send({ type: 'cmd', ...data });
}

function updateUI() {
    let myRes = isHost ? resHost : resGuest;
    let actualId = isHost ? 'host' : 'guest';
    
    uiGold.innerText = Math.floor(myRes.gold);
    uiWood.innerText = Math.floor(myRes.wood);
    uiFood.innerText = Math.floor(myRes.food);
    let myPop = units.filter(u=>u.owner===actualId).length;
    uiPop.innerText = myPop; 
    uiMaxPop.innerText = myRes.maxPop;
    
    myRes.pop = myPop;
}

// --- BOUCLE UPDATE (HÔTE UNIQUEMENT) ---
let ecoTimer = 0;
function hostUpdate(dt) {
    survivalTimer += dt;
    ecoTimer += dt;

    if (ecoTimer >= 1) {
        ecoTimer = 0;
        let p1Farm=0, p1Mine=0, p1Saw=0, p2Farm=0, p2Mine=0, p2Saw=0;
        
        let p1MaxPop = 0, p2MaxPop = 0;

        buildings.forEach(b => { 
            if(b.owner === 'host') { 
                if(b.type === 'mine') p1Mine+=b.farmersInside*1.5; 
                if(b.type === 'sawmill') p1Saw+=b.farmersInside*2; 
                if(b.type === 'farm') p1Farm+=b.farmersInside*2;
                if(b.type === 'house') p1MaxPop+=4;
            }
            if(b.owner === 'guest') { 
                if(b.type === 'mine') p2Mine+=b.farmersInside*1.5; 
                if(b.type === 'sawmill') p2Saw+=b.farmersInside*2; 
                if(b.type === 'farm') p2Farm+=b.farmersInside*2;
                if(b.type === 'house') p2MaxPop+=4;
            }
        });
        
        resHost.maxPop = p1MaxPop; resGuest.maxPop = p2MaxPop;
        resHost.gold += p1Mine; resHost.wood += p1Saw; resHost.food += p1Farm; 
        resGuest.gold += p2Mine; resGuest.wood += p2Saw; resGuest.food += p2Farm; 
    }

    if (baseHost.hp <= 0 || baseGuest.hp <= 0) {
        gameState = 'GAMEOVER';
        let winText = baseHost.hp <= 0 ? "P2 REMPORTE LA GUERRE" : "P1 REMPORTE LA GUERRE";
        document.getElementById('winner-text').innerText = winText;
        gameOverScreen.style.display = 'block';
    }

    buildings.forEach((b, i) => { b.update(dt); if (b.hp <= 0) { buildings.splice(i, 1); }});
    units.forEach((u, i) => { u.update(dt); if (u.hp <= 0) { units.splice(i, 1); }});
    enemies.forEach((e, i) => { e.update(dt); if (e.hp <= 0) { enemies.splice(i, 1); }});
    trees = trees.filter(t => t.amount > 0); 

    let pack = {
        type: 'sync',
        u: units.map(u => ({ id: u.id, x: u.x, y: u.y, t: u.type, e: u.element, o: u.owner, hp: u.hp, mHp: u.maxHp, s: u.state, p: u.payload, st: u.slowTimer })),
        b: buildings.map(b => ({ id: b.id, x: b.x, y: b.y, t: b.type, o: b.owner, hp: b.hp, mHp: b.maxHp, l: b.level, fi: b.farmersInside })),
        t: trees.map(t => ({ id: t.id, x: t.x, y: t.y, a: t.amount, s: t.skin })), 
        en: enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, s: e.skinNum, st: e.slowTimer })),
        rv: rivers.map(r => ({ id: r.id, x: r.x, y: r.y, v: r.variant })),
        bH: { id: baseHost.id, x: baseHost.x, y: baseHost.y, hp: baseHost.hp },
        bG: { id: baseGuest.id, x: baseGuest.x, y: baseGuest.y, hp: baseGuest.hp },
        resH: resHost, resG: resGuest, st: survivalTimer
    };
    if (connToGuest) connToGuest.send(pack);
}

// --- BOUCLE DRAW ---
function draw() {
    ctx.clearRect(0, 0, width, height);
    
    if (gameState === 'PLAYING') drawMinimap();

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // CORRECTION RAM : Utilisation des 4 morceaux pour éviter le crash du navigateur
    if (!isDarkMode) {
        let prefix = currentMapTheme === 'hell' ? 'hell' : 'map';
        const halfW = MAP_WIDTH / 2;
        const halfH = MAP_HEIGHT / 2;
        const overlap = 2; 

        if (images[prefix+'HG'] && images[prefix+'HG'].complete && images[prefix+'HG'].naturalWidth > 0) {
            ctx.drawImage(images[prefix+'HG'], 0, 0, halfW + overlap, halfH + overlap);
        }
        if (images[prefix+'HD'] && images[prefix+'HD'].complete && images[prefix+'HD'].naturalWidth > 0) {
            ctx.drawImage(images[prefix+'HD'], halfW - 1, 0, halfW + overlap, halfH + overlap);
        }
        if (images[prefix+'BG'] && images[prefix+'BG'].complete && images[prefix+'BG'].naturalWidth > 0) {
            ctx.drawImage(images[prefix+'BG'], 0, halfH - 1, halfW + overlap, halfH + overlap);
        }
        if (images[prefix+'BD'] && images[prefix+'BD'].complete && images[prefix+'BD'].naturalWidth > 0) {
            ctx.drawImage(images[prefix+'BD'], halfW - 1, halfH - 1, halfW + overlap, halfH + overlap);
        }
    }

    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        decorations.forEach(d => d.draw(ctx, images)); 
        rivers.forEach(r => r.draw(ctx, images));
        trees.forEach(t => t.draw(ctx, images)); 
        buildings.forEach(b => b.draw(ctx, images));
        
        if (baseHost && baseHost.hp > 0) baseHost.draw(ctx, images);
        if (baseGuest && baseGuest.hp > 0) baseGuest.draw(ctx, images);
        
        units.forEach(u => u.draw(ctx, images));
        enemies.forEach(e => e.draw(ctx, images));

        lasers.forEach(l => {
            ctx.strokeStyle = l.color; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = l.color;
            ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
        });

        particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); });
        ctx.globalAlpha = 1;

        if (isSelecting && inputMode === 'mouse') {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
            let w = selectionCurrentWorld.x - selectionStartWorld.x; let h = selectionCurrentWorld.y - selectionStartWorld.y;
            ctx.fillRect(selectionStartWorld.x, selectionStartWorld.y, w, h); ctx.strokeRect(selectionStartWorld.x, selectionStartWorld.y, w, h);
        }

        let activeGhost = buildMode || (moveMode ? moveMode.type : null);
        if (activeGhost) {
            let img = images[activeGhost==='mageTower'?'mage':activeGhost];
            let size = (activeGhost === 'barracks' || activeGhost === 'archery' || activeGhost === 'mage') ? 80 : 64;
            if(activeGhost === 'tower') size = 50;
            ctx.globalAlpha = 0.5;
            if (img && img.complete) ctx.drawImage(img, mouseHoverWorld.x - size/2, mouseHoverWorld.y - size/2, size, size);
            ctx.globalAlpha = 1.0;
        }
    }

    ctx.restore();
}

let lastTime = performance.now();
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); lastTime = timestamp;
    if(gameState === 'PLAYING') {
        updateCamera();
        
        if(isHost) {
            hostUpdate(dt);
        }
        updateUI(); 
        
        particles.forEach((p, i) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if(p.life <= 0) particles.splice(i, 1); });
        lasers.forEach((l, i) => { l.life -= dt; if(l.life <= 0) lasers.splice(i, 1); });
    }
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
