// ==========================================
// MOTEUR MULTIJOUEUR (P2P + Boucle + Rendu)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');

let width, height;
const MAP_WIDTH = 10000;
const MAP_HEIGHT = 10000;
let camera = { x: 0, y: 0 };
let zoom = 2.0;

// --- GESTION DES ASSETS ---
const ASSETS_PATHS = {
    map: 'assets/map/mapRTS.png',
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
    wheat: 'assets/map/wheat.png'
};

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

// ==========================================
// PEER JS MULTIJOUEUR (Logique type Drawer)
// ==========================================
let peer = new Peer(); // Initialisation "à chaud"
let myId = null;
let myPseudo = "Anonyme";
let isHost = false;
let connToHost = null;
let connToGuest = null;

function setupPeerEvents(p) {
    p.on('open', id => {
        myId = id;
        let loginScreen = document.getElementById('screen-login');
        let lobbyScreen = document.getElementById('screen-lobby');
        
        // Si on vient de créer la partie (isHost = true) et qu'on est sur l'écran login
        if (loginScreen && loginScreen.classList.contains('active-screen') && isHost) {
            loginScreen.classList.remove('active-screen');
            lobbyScreen.classList.add('active-screen');
            document.getElementById('my-id').innerText = id;
            document.getElementById('login-error').innerText = "";
        }
    });

    p.on('connection', conn => {
        if(!isHost) return;
        connToGuest = conn;
        conn.on('data', data => handleNetworkData(data));
        document.getElementById('min-players-msg').style.display = 'none';
        document.getElementById('btn-start').style.display = 'block';
    });

    p.on('error', err => {
        console.error(err);
        let errEl = document.getElementById('login-error');
        if(errEl) {
            errEl.innerText = "Erreur réseau: " + err.type;
            errEl.style.color = "var(--neon-pink)";
        }
    });
}

setupPeerEvents(peer); // Attachement des events au peer par défaut

document.getElementById('btn-host').addEventListener('click', () => {
    let pName = document.getElementById('player-name').value.trim();
    if (!pName) {
        document.getElementById('login-error').innerText = "Pseudo requis pour créer.";
        return;
    }
    myPseudo = pName;
    isHost = true;
    
    let code = 'RTS' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('login-error').innerText = "Création du serveur...";
    document.getElementById('login-error').style.color = "var(--neon-cyan)";

    // Destruction du peer de base et création avec le code RTS
    peer.destroy();
    peer = new Peer(code);
    setupPeerEvents(peer);
});

document.getElementById('btn-join').addEventListener('click', () => {
    let pName = document.getElementById('player-name').value.trim();
    if (!pName) {
        document.getElementById('login-error').innerText = "Pseudo requis pour rejoindre.";
        return;
    }
    const targetId = document.getElementById('join-id').value.toUpperCase().trim();
    if(!targetId) {
        document.getElementById('login-error').innerText = "Code requis.";
        return;
    }
    myPseudo = pName;
    isHost = false;
    
    document.getElementById('login-error').innerText = "Connexion...";
    document.getElementById('login-error').style.color = "var(--neon-cyan)";

    connToHost = peer.connect(targetId);
    
    connToHost.on('open', () => {
        document.getElementById('screen-login').classList.remove('active-screen');
        document.getElementById('screen-lobby').classList.add('active-screen');
        document.getElementById('my-id').innerText = targetId;
        document.getElementById('waiting-host-msg').style.display = 'block';
        document.getElementById('min-players-msg').style.display = 'none';
        document.getElementById('login-error').innerText = "";
    });
    
    connToHost.on('data', data => handleNetworkData(data));
});

document.getElementById('btn-start').addEventListener('click', () => {
    if(isHost) {
        initGame();
        connToGuest.send({ type: 'start_game' });
    }
});

// ==========================================
// ETAT DU JEU & VARIABLES
// ==========================================

let gameState = 'LOBBY';
let resHost = { gold: 0, wood: 0, food: 0, pop: 0, maxPop: 0 };
let resGuest = { gold: 0, wood: 0, food: 0, pop: 0, maxPop: 0 };

let buildMode = null;
let moveMode = null; 

let baseHost = null;
let baseGuest = null;
let buildings = [];
let units = [];
let enemies = []; 
let trees = [];
let wheats = [];
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

// --- UTILITAIRES ---
function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function getClosest(entity, array) {
    let closest = null; let minDist = Infinity;
    for(let o of array) { 
        let d = dist(entity, o); 
        if(d < minDist) { minDist = d; closest = o; } 
    }
    return closest;
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({ 
            x: x, y: y, 
            vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, 
            size: Math.random()*3+1, color: color, life: 0.5 + Math.random()*0.5 
        });
    }
}

function spawnLaser(a, b, color) { 
    lasers.push({ x1:a.x, y1:a.y, x2:b.x, y2:b.y, color:color, life:0.15 }); 
}

function addSysLog(title, msg) {
    chatBox.innerHTML += `<p><span class="sys-log-msg">> ${title}:</span> ${msg}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
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
    const margin = 30; const speed = 25 / zoom;
    if (mouseHoverScreen.x < margin) camera.x -= speed;
    if (mouseHoverScreen.x > width - margin) camera.x += speed;
    if (mouseHoverScreen.y < margin) camera.y -= speed;
    if (mouseHoverScreen.y > height - margin) camera.y += speed;

    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width/zoom));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height/zoom));
}

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let cx = e.touches ? e.touches[0].clientX : e.clientX;
    let cy = e.touches ? e.touches[0].clientY : e.clientY;
    let screenX = cx - rect.left;
    let screenY = cy - rect.top;
    return { screenX, screenY, worldX: (screenX / zoom) + camera.x, worldY: (screenY / zoom) + camera.y };
}

// --- MINIMAP ---
function drawMinimap() {
    mmCtx.clearRect(0, 0, 150, 150);
    mmCtx.fillStyle = 'rgba(0, 20, 30, 0.8)';
    mmCtx.fillRect(0, 0, 150, 150);

    const drawDot = (obj, color, size) => {
        mmCtx.fillStyle = color;
        mmCtx.fillRect((obj.x/MAP_WIDTH)*150 - size/2, (obj.y/MAP_HEIGHT)*150 - size/2, size, size);
    };

    trees.forEach(t => drawDot(t, 'var(--neon-orange)', 1));
    wheats.forEach(w => drawDot(w, 'var(--neon-green)', 1));
    buildings.forEach(b => drawDot(b, b.owner === 'host' ? 'var(--neon-cyan)' : 'var(--neon-pink)', 4));
    
    if (baseHost && baseHost.hp > 0) drawDot(baseHost, 'var(--neon-cyan)', 6);
    if (baseGuest && baseGuest.hp > 0) drawDot(baseGuest, 'var(--neon-pink)', 6);
    
    units.forEach(u => drawDot(u, u.owner === 'host' ? 'var(--neon-cyan)' : 'var(--neon-pink)', 2));
    enemies.forEach(e => drawDot(e, 'var(--neon-red)', 3));

    mmCtx.strokeStyle = 'white'; mmCtx.lineWidth = 1;
    mmCtx.strokeRect((camera.x/MAP_WIDTH)*150, (camera.y/MAP_HEIGHT)*150, (width/(zoom*MAP_WIDTH))*150, (height/(zoom*MAP_HEIGHT))*150);
}

// --- TRAITEMENT DES DONNEES ---
function handleNetworkData(data) {
    if (data.type === 'start_game' && !isHost) {
        initGameClient();
    }
    if (data.type === 'sync' && !isHost) {
        syncClientState(data);
    }
    if (data.type === 'cmd' && isHost) {
        executeCommand(data);
    }
}

function executeCommand(data) {
    let playerRes = data.owner === 'host' ? resHost : resGuest;
    let playerBase = data.owner === 'host' ? baseHost : baseGuest;

    if(playerRes.food <= 0 && data.action !== 'move') {
        if(data.owner === (isHost ? 'host' : 'guest')) addSysLog("Famine", "Nourriture à 0 ! Les slimes refusent l'ordre.");
        return;
    }

    if (data.action === 'move') {
        let uList = units.filter(u => data.unitIds.includes(u.id));
        let ent = units.find(u=>u.id===data.targetId) || buildings.find(b=>b.id===data.targetId) || trees.find(t=>t.id===data.targetId) || wheats.find(w=>w.id===data.targetId) || enemies.find(e=>e.id===data.targetId) || (baseHost.id===data.targetId?baseHost:null) || (baseGuest.id===data.targetId?baseGuest:null);
        
        if (playerRes.food <= 0) {
            let isFoodCmd = ent && ent.type === 'wheat';
            if(!isFoodCmd) return; 
        }

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
            if(b.type === 'house') playerRes.maxPop -= 4;
            units.forEach(u => { if(u.state === 'farming' && u.targetEntityId === b.id) u.setCommand(u.x, u.y); });
            buildings = buildings.filter(x => x !== b);
        }
    }
}

// --- INITIALISATION ---
function initGame() {
    gameState = 'PLAYING';
    resHost = { gold: 0, wood: 0, food: 0, pop: 0, maxPop: 0 }; 
    resGuest = { gold: 0, wood: 0, food: 0, pop: 0, maxPop: 0 }; 
    units = []; trees = []; wheats = []; buildings = []; particles = []; lasers = []; selectedUnits = [];
    buildMode = null; moveMode = null; selectedBuilding = null;
    
    document.getElementById('screen-lobby').classList.remove('active-screen');
    document.getElementById('game-container').classList.add('active-screen');
    resize();

    baseHost = new Base(1000, MAP_HEIGHT/2, 'host');
    baseGuest = new Base(MAP_WIDTH - 1000, MAP_HEIGHT/2, 'guest');
    camera.x = baseHost.x - width/2; camera.y = baseHost.y - height/2;

    // FORETS
    for(let i=0; i<40; i++) { 
        let cx = Math.random() * MAP_WIDTH; let cy = Math.random() * MAP_HEIGHT;
        if(dist({x:cx,y:cy}, baseHost) < 1000 || dist({x:cx,y:cy}, baseGuest) < 1000) continue;
        for(let j=0; j<25; j++) { 
            let tx = cx + (Math.random()-0.5)*300; let ty = cy + (Math.random()-0.5)*300;
            trees.push(new ResourceNode(tx, ty, 'tree'));
        }
    }

    // CHAMPS
    for(let i=0; i<40; i++) {
        let cx = Math.random() * MAP_WIDTH; let cy = Math.random() * MAP_HEIGHT;
        if(dist({x:cx,y:cy}, baseHost) < 1000 || dist({x:cx,y:cy}, baseGuest) < 1000) continue;
        for(let j=0; j<25; j++) { 
            let wx = cx + (Math.random()-0.5)*300; let wy = cy + (Math.random()-0.5)*300;
            wheats.push(new ResourceNode(wx, wy, 'wheat'));
        }
    }

    // VIRUS
    for(let i=0; i<150; i++) {
        let ex = Math.random() * MAP_WIDTH; let ey = Math.random() * MAP_HEIGHT;
        if(dist({x:ex,y:ey}, baseHost) > 1500 && dist({x:ex,y:ey}, baseGuest) > 1500) {
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

function initGameClient() {
    gameState = 'PLAYING';
    document.getElementById('screen-lobby').classList.remove('active-screen');
    document.getElementById('game-container').classList.add('active-screen');
    resize();
    updateUI(); renderBottomUI();
}

function syncClientState(data) {
    if (!baseGuest && data.bG) {
        camera.x = data.bG.x - width/2; camera.y = data.bG.y - height/2;
    }

    resHost = data.resH; resGuest = data.resG;
    baseHost = new Base(data.bH.x, data.bH.y, 'host'); baseHost.id = data.bH.id; baseHost.hp = data.bH.hp;
    baseGuest = new Base(data.bG.x, data.bG.y, 'guest'); baseGuest.id = data.bG.id; baseGuest.hp = data.bG.hp;
    
    trees = data.t.map(t => { let r = new ResourceNode(t.x, t.y, 'tree'); r.id = t.id; r.amount = t.a; return r; });
    wheats = data.w.map(w => { let r = new ResourceNode(w.x, w.y, 'wheat'); r.id = w.id; r.amount = w.a; return r; });
    enemies = data.en.map(e => { let en = new Enemy(e.x, e.y); en.id=e.id; en.hp=e.hp; en.element=e.el; en.color=e.c; en.slowTimer=e.st; return en; });
    
    buildings = data.b.map(b => {
        let build = new Building(b.x, b.y, b.t, b.o); build.id = b.id; build.hp = b.hp; build.maxHp = b.mHp; build.level = b.l; build.farmersInside = b.fi; return build;
    });

    units = data.u.map(u => {
        let un = new Unit(u.x, u.y, u.t, u.e, u.o); un.id = u.id; un.hp = u.hp; un.maxHp = u.mHp; un.state = u.s; un.payload = u.p; un.slowTimer = u.st; return un;
    });

    updateUI();
}

// --- INPUTS & SÉLECTION ---
canvas.addEventListener('mousedown', (e) => {
    if(gameState !== 'PLAYING') return;
    const pos = getPointerPos(e);
    const wPos = { x: pos.worldX, y: pos.worldY };

    if(moveMode) {
        if(e.button === 0) {
            moveMode.x = wPos.x; moveMode.y = wPos.y;
            spawnParticles(wPos.x, wPos.y, 'var(--neon-cyan)', 20);
            moveMode = null; instructions.style.display = 'none'; renderBottomUI();
        }
        if(e.button === 2) { moveMode = null; instructions.style.display = 'none'; }
        return;
    }

    if(buildMode) {
        if(e.button === 0) {
            let actualId = isHost ? 'host' : 'guest';
            if (isHost) executeCommand({ action: 'build', bType: buildMode, x: wPos.x, y: wPos.y, owner: actualId });
            else connToHost.send({ type: 'cmd', action: 'build', bType: buildMode, x: wPos.x, y: wPos.y, owner: actualId });
            setBuildMode(null);
        }
        if(e.button === 2) setBuildMode(null);
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

    if (!isSelecting) return;
    selectionCurrentScreen = { x: pos.screenX, y: pos.screenY };
    selectionCurrentWorld = { x: pos.worldX, y: pos.worldY };
});

canvas.addEventListener('mouseup', (e) => {
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
    if(gameState !== 'PLAYING' || selectedUnits.length === 0 || buildMode || moveMode) return;
    
    let actualId = isHost ? 'host' : 'guest';
    let myRes = isHost ? resHost : resGuest;
    
    const pos = getPointerPos(e);
    const wPos = { x: pos.worldX, y: pos.worldY };

    let clickedEnt = units.find(u=>dist(wPos, u)<20) || buildings.find(b=>dist(wPos, b)<b.size) || trees.find(t=>dist(wPos, t)<20) || wheats.find(w=>dist(wPos, w)<20) || enemies.find(en=>dist(wPos, en)<20) || (dist(wPos, baseHost)<baseHost.size/2 ? baseHost : null) || (dist(wPos, baseGuest)<baseGuest.size/2 ? baseGuest : null);
    
    if (myRes.food <= 0 && (!clickedEnt || (clickedEnt.type !== 'wheat' && clickedEnt.type !== 'farm'))) {
        addSysLog("Famine", "Nourriture à 0 ! Les Slimes refusent d'obéir.");
        return;
    }

    if (isHost) executeCommand({ action: 'move', unitIds: selectedUnits, x: wPos.x, y: wPos.y, targetId: clickedEnt?clickedEnt.id:null, owner: actualId });
    else connToHost.send({ type: 'cmd', action: 'move', unitIds: selectedUnits, x: wPos.x, y: wPos.y, targetId: clickedEnt?clickedEnt.id:null, owner: actualId });
    
    spawnParticles(wPos.x, wPos.y, 'var(--neon-cyan)', 5);
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
    else if (['sawmill', 'mine'].includes(selectedBuilding.type)) {
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
    uiPop.innerText = myPop; uiMaxPop.innerText = myRes.maxPop;
    
    myRes.pop = myPop;
    if(myRes.food <= 0) uiFood.style.color = 'red'; else uiFood.style.color = 'var(--neon-green)';
}

// --- BOUCLE UPDATE (HÔTE UNIQUEMENT) ---
let ecoTimer = 0;
function hostUpdate(dt) {
    ecoTimer += dt;

    if (ecoTimer >= 1) {
        ecoTimer = 0;
        let p1Mine=0, p1Saw=0, p2Mine=0, p2Saw=0;
        buildings.forEach(b => { 
            if(b.owner === 'host') { if(b.type === 'mine') p1Mine+=b.farmersInside*1.5; if(b.type === 'sawmill') p1Saw+=b.farmersInside*2; }
            if(b.owner === 'guest') { if(b.type === 'mine') p2Mine+=b.farmersInside*1.5; if(b.type === 'sawmill') p2Saw+=b.farmersInside*2; }
        });
        resHost.gold += p1Mine; resHost.wood += p1Saw; resHost.food -= resHost.pop * 0.2; if(resHost.food < 0) resHost.food = 0;
        resGuest.gold += p2Mine; resGuest.wood += p2Saw; resGuest.food -= resGuest.pop * 0.2; if(resGuest.food < 0) resGuest.food = 0;
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
    trees = trees.filter(t => t.amount > 0); wheats = wheats.filter(w => w.amount > 0);

    let pack = {
        type: 'sync',
        u: units.map(u => ({ id: u.id, x: u.x, y: u.y, t: u.type, e: u.element, o: u.owner, hp: u.hp, mHp: u.maxHp, s: u.state, p: u.payload, st: u.slowTimer })),
        b: buildings.map(b => ({ id: b.id, x: b.x, y: b.y, t: b.type, o: b.owner, hp: b.hp, mHp: b.maxHp, l: b.level, fi: b.farmersInside })),
        t: trees.map(t => ({ id: t.id, x: t.x, y: t.y, a: t.amount })),
        w: wheats.map(w => ({ id: w.id, x: w.x, y: w.y, a: w.amount })),
        en: enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, el: e.element, c: e.color, st: e.slowTimer })),
        bH: { id: baseHost.id, x: baseHost.x, y: baseHost.y, hp: baseHost.hp },
        bG: { id: baseGuest.id, x: baseGuest.x, y: baseGuest.y, hp: baseGuest.hp },
        resH: resHost, resG: resGuest
    };
    if (connToGuest) connToGuest.send(pack);
}

// --- BOUCLE DRAW ---
function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    if (images.map.complete && images.map.naturalWidth > 0) { ctx.drawImage(images.map, 0, 0, MAP_WIDTH, MAP_HEIGHT); } 

    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        trees.forEach(t => t.draw(ctx, images)); wheats.forEach(w => w.draw(ctx, images));
        buildings.forEach(b => b.draw(ctx, images));
        if (baseHost && baseHost.hp > 0) baseHost.draw(ctx, images);
        if (baseGuest && baseGuest.hp > 0) baseGuest.draw(ctx, images);
        units.forEach(u => u.draw(ctx, images));
        enemies.forEach(e => e.draw(ctx));

        lasers.forEach(l => {
            ctx.strokeStyle = l.color; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = l.color;
            ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.shadowBlur = 0;
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
    if (gameState === 'PLAYING') drawMinimap();
}

let lastTime = performance.now();
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); lastTime = timestamp;
    if(gameState === 'PLAYING') {
        updateCamera();
        if(isHost) hostUpdate(dt);
        particles.forEach((p, i) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if(p.life <= 0) particles.splice(i, 1); });
        lasers.forEach((l, i) => { l.life -= dt; if(l.life <= 0) lasers.splice(i, 1); });
    }
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
