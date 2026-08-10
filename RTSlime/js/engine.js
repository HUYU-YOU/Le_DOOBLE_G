// ==========================================
// MOTEUR PRINCIPAL (Boucle, Inputs, Rendu)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');

let width, height;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;
let camera = { x: 0, y: 0 };

// --- GESTION DES ASSETS GRAPHIQUES ---
const ASSETS_PATHS = {
    map: 'assets/map/mapRTS.png',
    hdv: 'assets/bat/hdv.png',
    house: 'assets/bat/home.png',
    farm: 'assets/bat/farm.png',
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
    // Traceur si une image ne charge pas
    images[key].onerror = () => {
        console.warn(`[MATRICE] Fichier introuvable : ${ASSETS_PATHS[key]}`);
    };
}

// Éléments DOM
const uiGold = document.getElementById('val-gold');
const uiWood = document.getElementById('val-wood');
const uiFood = document.getElementById('val-food');
const uiPop = document.getElementById('val-pop');
const uiMaxPop = document.getElementById('val-maxpop');
const gameOverScreen = document.getElementById('game-over-screen');
const instructions = document.getElementById('build-instructions');
const uiBottom = document.getElementById('ui-bottom');

// Etat du jeu
let gameState = 'PLAYING';
let res = { gold: 50, wood: 100, food: 100, pop: 0, maxPop: 0 };
let buildMode = null;
let moveMode = null; 
let waveTimer = 0;
let survivalTimer = 0;

// Variables Globales pour Entités
let base = null;
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
let inputMode = 'mouse'; 
let mouseHoverScreen = { x: 0, y: 0 };
let mouseHoverWorld = { x: 0, y: 0 };

// --- GESTION FENETRE & CAMERA ---
function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
}
window.addEventListener('resize', resize); 

function updateCamera() {
    const margin = 30; const speed = 15;
    if (mouseHoverScreen.x < margin) camera.x -= speed;
    if (mouseHoverScreen.x > width - margin) camera.x += speed;
    if (mouseHoverScreen.y < margin) camera.y -= speed;
    if (mouseHoverScreen.y > height - margin) camera.y += speed;

    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - height));
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

    trees.forEach(t => drawDot(t, 'var(--neon-orange)', 2));
    wheats.forEach(w => drawDot(w, 'var(--neon-green)', 2));
    buildings.forEach(b => drawDot(b, 'var(--neon-cyan)', 4));
    if (base && base.hp > 0) drawDot(base, 'var(--neon-cyan)', 6);
    units.forEach(u => drawDot(u, '#c5c6c7', 2));
    enemies.forEach(e => drawDot(e, 'var(--neon-red)', 3));

    mmCtx.strokeStyle = 'var(--neon-cyan)'; mmCtx.lineWidth = 1;
    mmCtx.strokeRect((camera.x/MAP_WIDTH)*150, (camera.y/MAP_HEIGHT)*150, (width/MAP_WIDTH)*150, (height/MAP_HEIGHT)*150);
}

// --- GESTION UI DYNAMIQUE ---
function renderBottomUI() {
    uiBottom.innerHTML = ""; 
    
    if (selectedBuilding) {
        if (selectedBuilding.type === 'hdv') {
            let title = document.createElement('div');
            title.style.color = 'var(--neon-cyan)'; title.style.marginRight = '15px'; title.innerHTML = `<b>HÔTEL DE VILLE</b>`;
            uiBottom.appendChild(title);
            
            uiBottom.appendChild(createBtn('color-build', 'MAISON', '10🪵 10🍞', () => setBuildMode('house'), null, 'btn-b-house'));
            uiBottom.appendChild(createBtn('color-build', 'FERME', '30🪵 20🍞', () => setBuildMode('farm'), null, 'btn-b-farm'));
            uiBottom.appendChild(createBtn('color-build', 'SCIERIE', '30🪵 20🍞', () => setBuildMode('sawmill'), null, 'btn-b-sawmill'));
            uiBottom.appendChild(createBtn('color-build', 'MINE', '50🪵 50🍞', () => setBuildMode('mine'), null, 'btn-b-mine'));
            uiBottom.appendChild(createDivider());
            uiBottom.appendChild(createBtn('color-build', 'CASERNE', '50💰 50🪵', () => setBuildMode('barracks'), null, 'btn-b-barracks'));
            uiBottom.appendChild(createBtn('color-build', 'STAND TIR', '50💰 50🪵', () => setBuildMode('archery'), null, 'btn-b-archery'));
            uiBottom.appendChild(createBtn('color-build', 'T. MAGE', '50💰 50🪵', () => setBuildMode('mage'), null, 'btn-b-mage'));
            uiBottom.appendChild(createBtn('color-build', 'TOUR DEF', '100💰 50🪵', () => setBuildMode('tower'), null, 'btn-b-tower'));
            uiBottom.appendChild(createDivider());
            uiBottom.appendChild(createBtn('color-recruit', 'FERMIER', '10🍞', () => buyUnit('farmer', 'normal')));
            uiBottom.appendChild(createDivider());
            uiBottom.appendChild(createBtn('color-build', 'FERMER', '', () => { selectedBuilding = null; renderBottomUI(); }));

        } else {
            let title = document.createElement('div');
            title.style.color = 'white'; title.style.marginRight = '15px'; title.innerHTML = `<b>${selectedBuilding.type.toUpperCase()}</b> Lv.${selectedBuilding.level}`;
            uiBottom.appendChild(title);

            if (['barracks', 'archery', 'mage'].includes(selectedBuilding.type)) {
                if (selectedBuilding.level === 1) {
                    let btnUp = createBtn('color-upgrade', 'AMÉLIORER', '100💰 100🪵', () => upgradeBuilding(selectedBuilding));
                    uiBottom.appendChild(btnUp);
                    uiBottom.appendChild(createDivider());
                }

                let unitType = selectedBuilding.type === 'barracks' ? 'warrior' : selectedBuilding.type === 'archery' ? 'archer' : 'mage';
                uiBottom.appendChild(createBtn('color-recruit', 'NORMAL', '20💰 20🍞', () => buyUnit(unitType, 'normal')));
                
                if (selectedBuilding.level > 1) {
                    uiBottom.appendChild(createBtn('color-recruit', '🔥 FEU', '40💰 40🍞', () => buyUnit(unitType, 'fire'), 'var(--neon-red)'));
                    uiBottom.appendChild(createBtn('color-recruit', '💧 EAU', '40💰 40🍞', () => buyUnit(unitType, 'water'), 'var(--neon-water)'));
                    uiBottom.appendChild(createBtn('color-recruit', '🌿 PLANTE', '40💰 40🍞', () => buyUnit(unitType, 'plant'), 'var(--neon-green)'));
                }
            } else if (['farm', 'sawmill', 'mine'].includes(selectedBuilding.type)) {
                let info = document.createElement('div');
                info.style.color = '#aaa'; info.innerText = `Ouvriers: ${selectedBuilding.farmersInside}/5.`;
                uiBottom.appendChild(info);
            } else if (selectedBuilding.type === 'house') {
                let info = document.createElement('div');
                info.style.color = '#aaa'; info.innerText = "Capacité: 4 unités.";
                uiBottom.appendChild(info);
            }

            uiBottom.appendChild(createDivider());
            uiBottom.appendChild(createBtn('color-build', 'DÉPLACER', '', () => startMoveBuilding(selectedBuilding), 'var(--neon-cyan)'));
            uiBottom.appendChild(createBtn('color-destroy', 'DÉTRUIRE', 'Gains 50%', () => destroyBuilding(selectedBuilding)));
            uiBottom.appendChild(createDivider());
            uiBottom.appendChild(createBtn('color-build', 'FERMER', '', () => { selectedBuilding = null; renderBottomUI(); }));
        }
    } else {
        let info = document.createElement('div');
        info.style.color = '#aaa'; info.innerText = "Sélectionnez l'Hôtel de Ville ou un bâtiment.";
        uiBottom.appendChild(info);
    }
}

function createBtn(colorClass, title, costText, onClick, overrideColor=null, id=null) {
    let b = document.createElement('button');
    b.className = `build-btn ${colorClass}`;
    if(id) b.id = id;
    if(overrideColor) { b.style.borderColor = overrideColor; b.style.color = overrideColor; }
    b.innerHTML = `${title} <span>${costText}</span>`;
    b.onclick = onClick;
    return b;
}
function createDivider() {
    let d = document.createElement('div'); d.className = 'ui-divider'; return d;
}

// --- DEPLACER / DETRUIRE ---
function startMoveBuilding(b) {
    moveMode = b;
    selectedBuilding = null;
    renderBottomUI();
    instructions.style.display = 'block';
}

function destroyBuilding(b) {
    let cost = getBuildingCost(b.type);
    res.gold += Math.floor(cost.g / 2);
    res.wood += Math.floor(cost.w / 2);
    res.food += Math.floor(cost.f / 2);
    
    if(b.type === 'house') res.maxPop -= 4;
    
    if(b.farmersInside > 0) {
        units.forEach(u => {
            if(u.state === 'farming' && u.targetEntity === b) {
                u.state = 'idle'; u.targetEntity = null;
            }
        });
    }

    buildings = buildings.filter(x => x !== b);
    spawnParticles(b.x, b.y, 'var(--neon-red)', 30);
    selectedBuilding = null;
    updateUI(); renderBottomUI();
}

// --- INITIALISATION ---
function initGame() {
    gameState = 'PLAYING';
    res = { gold: 50, wood: 50, food: 50, pop: 0, maxPop: 0 }; 
    survivalTimer = 0; waveTimer = 20; 
    units = []; enemies = []; trees = []; wheats = []; buildings = []; particles = []; lasers = []; selectedUnits = [];
    buildMode = null; moveMode = null; selectedBuilding = null;
    gameOverScreen.style.display = 'none';

    resize();
    camera.x = MAP_WIDTH/2 - width/2;
    camera.y = MAP_HEIGHT/2 - height/2;

    base = new Base(MAP_WIDTH/2, MAP_HEIGHT/2);

    for(let i=0; i<30; i++) {
        let tx = Math.random() * MAP_WIDTH; let ty = Math.random() * MAP_HEIGHT;
        if (dist({x:tx, y:ty}, base) > 150) trees.push(new ResourceNode(tx, ty, 'tree'));
    }
    for(let i=0; i<20; i++) {
        let wx = Math.random() * MAP_WIDTH; let wy = Math.random() * MAP_HEIGHT;
        if (dist({x:wx, y:wy}, base) > 150) wheats.push(new ResourceNode(wx, wy, 'wheat'));
    }

    let startHouse = new Building(base.x - 120, base.y, 'house');
    buildings.push(startHouse);
    units.push(new Unit(startHouse.x - 20, startHouse.y + 40, 'farmer'));
    units.push(new Unit(startHouse.x + 20, startHouse.y + 40, 'farmer'));
    
    updateUI();
    renderBottomUI();
}

// --- INPUTS ---
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let cx = e.touches ? e.touches[0].clientX : e.clientX;
    let cy = e.touches ? e.touches[0].clientY : e.clientY;
    let screenX = cx - rect.left;
    let screenY = cy - rect.top;
    return { screenX, screenY, worldX: screenX + camera.x, worldY: screenY + camera.y };
}

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
        if(e.button === 0) placeBuilding(wPos);
        if(e.button === 2) setBuildMode(null);
        return;
    }

    if(e.button === 0) {
        isSelecting = true; inputMode = 'mouse';
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

    let minX = Math.min(selectionStartWorld.x, selectionCurrentWorld.x);
    let maxX = Math.max(selectionStartWorld.x, selectionCurrentWorld.x);
    let minY = Math.min(selectionStartWorld.y, selectionCurrentWorld.y);
    let maxY = Math.max(selectionStartWorld.y, selectionCurrentWorld.y);

    let isClick = (maxX - minX < 10 && maxY - minY < 10);

    if (isClick && inputMode === 'mouse') {
        let clickedUnit = units.find(u => dist(selectionStartWorld, u) < u.radius + 15 && u.state !== 'farming');
        if (clickedUnit) {
            selectedUnits = [clickedUnit];
            selectedBuilding = null;
        } else {
            selectedUnits = [];
            let clickedBuild = buildings.find(b => dist(selectionStartWorld, b) < b.size/2 + 10);
            if(clickedBuild) {
                selectedBuilding = clickedBuild;
            } else if (dist(selectionStartWorld, base) < base.size/2 + 10) {
                selectedBuilding = base;
            } else {
                selectedBuilding = null;
            }
        }
        renderBottomUI();
    } else if (!isClick) {
        selectedUnits = units.filter(u => u.x > minX && u.x < maxX && u.y > minY && u.y < maxY && u.state !== 'farming');
        selectedBuilding = null; renderBottomUI();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if(gameState !== 'PLAYING' || selectedUnits.length === 0 || buildMode || moveMode) return;
    const pos = getPointerPos(e);
    const wPos = { x: pos.worldX, y: pos.worldY };

    let clickedEnemy = enemies.find(en => dist(wPos, en) < en.radius + 15);
    let clickedTree = trees.find(t => dist(wPos, t) < t.radius + 15);
    let clickedWheat = wheats.find(w => dist(wPos, w) < w.radius + 15);
    let clickedBuild = buildings.find(b => ['farm','sawmill','mine'].includes(b.type) && dist(wPos, b) < b.size);

    issueCommand(wPos.x, wPos.y, clickedEnemy || clickedTree || clickedWheat || clickedBuild);
    spawnParticles(wPos.x, wPos.y, 'var(--neon-cyan)', 5);
});

function issueCommand(x, y, entity) {
    selectedUnits.forEach((u, i) => {
        let dx = x + (i%3)*25 - 25; 
        let dy = y + Math.floor(i/3)*25;
        u.setCommand(entity ? entity.x : dx, entity ? entity.y : dy, entity);
    });
}

// --- CONSTRUCTION & RECRUTEMENT ---
function setBuildMode(type) {
    buildMode = buildMode === type ? null : type;
    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active-mode'));
    if(buildMode) {
        let el = document.getElementById('btn-b-' + buildMode);
        if(el) el.classList.add('active-mode');
        instructions.style.display = 'block';
    } else {
        instructions.style.display = 'none';
    }
}

function getBuildingCost(type) {
    if(type === 'house') return { g: 0, w: 10, f: 10 };
    if(type === 'sawmill') return { g: 0, w: 30, f: 20 };
    if(type === 'farm') return { g: 0, w: 30, f: 20 };
    if(type === 'mine') return { g: 0, w: 50, f: 50 };
    if(type === 'barracks' || type === 'archery' || type === 'mage') return { g: 50, w: 50, f: 0 };
    if(type === 'tower') return { g: 100, w: 50, f: 0 };
    return {g:0,w:0,f:0};
}

function placeBuilding(pos) {
    if(buildMode === 'house') {
        let hc = buildings.filter(b => b.type === 'house').length;
        if(hc >= 10) { alert("Limite de 10 maisons atteinte."); setBuildMode(null); return; }
    }

    let cost = getBuildingCost(buildMode);
    if(res.gold >= cost.g && res.wood >= cost.w && res.food >= cost.f) {
        res.gold -= cost.g; res.wood -= cost.w; res.food -= cost.f;
        
        let b = new Building(pos.x, pos.y, buildMode);
        buildings.push(b);
        spawnParticles(pos.x, pos.y, 'var(--neon-cyan)', 20);
        
        if(buildMode === 'house') {
            units.push(new Unit(pos.x - 20, pos.y + 30, 'farmer'));
            units.push(new Unit(pos.x + 20, pos.y + 30, 'farmer'));
        }
        
        setBuildMode(null); updateUI();
    } else { alert("Ressources insuffisantes !"); setBuildMode(null); }
}

function upgradeBuilding(b) {
    if (res.gold >= 100 && res.wood >= 100) {
        res.gold -= 100; res.wood -= 100;
        b.level = 2;
        spawnParticles(b.x, b.y, 'var(--neon-yellow)', 30);
        updateUI(); renderBottomUI();
    } else { alert("Besoin de 100 Or et 100 Bois."); }
}

function buyUnit(type, element) {
    if(res.pop >= res.maxPop) { alert("Population Max ! Construisez des maisons."); return; }
    
    let costGold = 0, costFood = 0;
    if(type === 'farmer') { costGold = 0; costFood = 10; }
    else {
        costGold = element === 'normal' ? 20 : 40;
        costFood = element === 'normal' ? 20 : 40;
    }

    if (res.gold >= costGold && res.food >= costFood) {
        res.gold -= costGold; res.food -= costFood;
        let sx = selectedBuilding ? selectedBuilding.x : base.x;
        let sy = selectedBuilding ? selectedBuilding.y + 60 : base.y + 70;
        units.push(new Unit(sx, sy, type, element));
        updateUI();
    } else { alert("Ressources insuffisantes !"); }
}

function updateUI() {
    uiGold.innerText = Math.floor(res.gold);
    uiWood.innerText = Math.floor(res.wood);
    uiFood.innerText = Math.floor(res.food);
    uiPop.innerText = res.pop;
    uiMaxPop.innerText = res.maxPop;
}

// --- BOUCLE PRINCIPALE ---
let lastTime = performance.now();
let ecoTimer = 0;

function update(dt) {
    if (gameState !== 'PLAYING') return;
    survivalTimer += dt;
    ecoTimer += dt;
    updateCamera();

    if (ecoTimer >= 1) {
        ecoTimer = 0;
        let farmOutput=0, mineOutput=0, sawOutput=0;
        buildings.forEach(b => { 
            if(b.type === 'farm') farmOutput += b.farmersInside * 2; 
            if(b.type === 'mine') mineOutput += b.farmersInside * 1.5; 
            if(b.type === 'sawmill') sawOutput += b.farmersInside * 2; 
        });
        res.food += farmOutput; res.gold += mineOutput; res.wood += sawOutput;
        res.food -= res.pop * 0.2; 
        if(res.food < 0) { res.food = 0; }
        updateUI();
    }

    waveTimer -= dt;
    if (waveTimer <= 0) {
        let count = 1 + Math.floor(survivalTimer / 60);
        for(let i=0; i<count; i++) {
            let spawnX = Math.random() > 0.5 ? -100 : MAP_WIDTH + 100;
            let spawnY = Math.random() * MAP_HEIGHT;
            enemies.push(new Enemy(spawnX, spawnY));
        }
        waveTimer = 15;
    }

    if (base.hp <= 0) {
        gameState = 'GAMEOVER'; gameOverScreen.style.display = 'block';
        spawnParticles(base.x, base.y, 'var(--neon-red)', 50);
    }

    for (let i = buildings.length - 1; i >= 0; i--) {
        buildings[i].update(dt);
        if (buildings[i].hp <= 0) {
            spawnParticles(buildings[i].x, buildings[i].y, 'var(--neon-red)', 30);
            if(selectedBuilding === buildings[i]) { selectedBuilding = null; renderBottomUI(); }
            buildings.splice(i, 1);
        }
    }

    for (let i = units.length - 1; i >= 0; i--) {
        units[i].update(dt);
        if (units[i].hp <= 0) {
            spawnParticles(units[i].x, units[i].y, units[i].color, 15);
            if(selectedUnits.includes(units[i])) selectedUnits.splice(selectedUnits.indexOf(units[i]), 1);
            units.splice(i, 1);
            res.pop--; updateUI();
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(dt);
        if (enemies[i].hp <= 0) {
            spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 15);
            res.gold += 5; updateUI();
            enemies.splice(i, 1);
        }
    }

    for (let i = trees.length - 1; i >= 0; i--) { if (trees[i].amount <= 0) trees.splice(i, 1); }
    for (let i = wheats.length - 1; i >= 0; i--) { if (wheats[i].amount <= 0) wheats.splice(i, 1); }

    particles.forEach((p, i) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if(p.life <= 0) particles.splice(i, 1); });
    lasers.forEach((l, i) => { l.life -= dt; if(l.life <= 0) lasers.splice(i, 1); });
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Dessin du fond de carte (avec couleur de secours)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    if (images.map.complete && images.map.naturalWidth > 0) {
        ctx.drawImage(images.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    } else {
        // Fallback visuel de grille si la map ne charge pas encore
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 2;
        for(let x=0; x<MAP_WIDTH; x+=100) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT); ctx.stroke();
        }
        for(let y=0; y<MAP_HEIGHT; y+=100) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y); ctx.stroke();
        }
    }

    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        trees.forEach(t => t.draw(ctx, images));
        wheats.forEach(w => w.draw(ctx, images));
        buildings.forEach(b => b.draw(ctx, images));
        if (base.hp > 0) base.draw(ctx, images);

        units.forEach(u => u.draw(ctx, images));
        enemies.forEach(e => e.draw(ctx));

        lasers.forEach(l => {
            ctx.strokeStyle = l.color; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = l.color;
            ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.shadowBlur = 0;
        });

        particles.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        if (isSelecting && inputMode === 'mouse') {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
            let w = selectionCurrentWorld.x - selectionStartWorld.x; 
            let h = selectionCurrentWorld.y - selectionStartWorld.y;
            ctx.fillRect(selectionStartWorld.x, selectionStartWorld.y, w, h); ctx.strokeRect(selectionStartWorld.x, selectionStartWorld.y, w, h);
        }

        let activeGhost = buildMode || (moveMode ? moveMode.type : null);
        if (activeGhost) {
            let img = null;
            if(activeGhost === 'house') img = images.house;
            if(activeGhost === 'farm') img = images.farm;
            if(activeGhost === 'sawmill') img = images.sawmill;
            if(activeGhost === 'mine') img = images.mine;
            if(activeGhost === 'barracks') img = images.barracks;
            if(activeGhost === 'archery') img = images.archery;
            if(activeGhost === 'mage') img = images.mageTower;
            if(activeGhost === 'tower') img = images.tower;

            let size = (activeGhost === 'barracks' || activeGhost === 'archery' || activeGhost === 'mage') ? 80 : 64;
            if(activeGhost === 'tower') size = 50;

            ctx.globalAlpha = 0.5;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, mouseHoverWorld.x - size/2, mouseHoverWorld.y - size/2, size, size);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(mouseHoverWorld.x - size/2, mouseHoverWorld.y - size/2, size, size);
            }
            ctx.globalAlpha = 1.0;
        }
    }

    ctx.restore();

    if (gameState === 'PLAYING') drawMinimap();
}

function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    update(dt); draw();
    requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
