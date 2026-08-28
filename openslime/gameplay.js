// =========================================================================
// OPEN FRONT - MOTEUR DE JEU & GUERRE TERRITORIALE (CIBLAGE & COMMERCE)
// =========================================================================

const SIM_W = 512;
const SIM_H = 256;

let troopPercentage = 50;
let buildTargetPosition = null; 
let buildTargetTerrain = null; 
let gameState = 'MENU'; 
let spawnCountdown = 10;
let aiMode = 'dumb_bots'; 
let myCapitalPlaced = false;

let playerCapitalUV = null; 
let entities = []; 
let selectedEntity = null; 
let actionState = 'NORMAL'; 
let playerCapitalMesh = null;

let playerStats = { pop: 500, maxPop: 1000, gold: 500, territory: 0, alive: true, cityCount: 0 };
let tradeShips = []; 

// --- PALETTE DE COULEURS ---
const FACTIONS = [
    { id: 0, name: "Joueur", rgb: [0, 240, 255], hex: 0x00f0ff, css: '#00f0ff' }, 
    { id: 1, name: "Empire Crimson", rgb: [255, 0, 68], hex: 0xff0044 }, 
    { id: 2, name: "Tribu Toxique", rgb: [57, 255, 20], hex: 0x39ff14 }, 
    { id: 3, name: "Dynastie Royale", rgb: [176, 0, 255], hex: 0xb000ff }, 
    { id: 4, name: "Légion Solaire", rgb: [255, 140, 0], hex: 0xff8c00 }, 
    { id: 5, name: "Ordre Rubis", rgb: [255, 0, 150], hex: 0xff0096 }, 
    { id: 6, name: "Sultanat Doré", rgb: [255, 230, 0], hex: 0xffe600 }, 
    { id: 7, name: "Conféd. Océane", rgb: [0, 168, 150], hex: 0x00a896 }, 
    { id: 8, name: "Clan Cobalt", rgb: [67, 97, 238], hex: 0x4361ee }, 
    { id: 9, name: "Horde Sanglante", rgb: [230, 57, 70], hex: 0xe63946 }, 
    { id: 10, name: "Fédération Menthe", rgb: [46, 196, 182], hex: 0x2ec4b6 } 
];

let ais = [];
const grid = new Int8Array(SIM_W * SIM_H);
const frontierMap = new Map(); 

const overlayCanvas = document.createElement('canvas');
overlayCanvas.width = SIM_W; overlayCanvas.height = SIM_H;
const overlayCtx = overlayCanvas.getContext('2d');
let overlayImgData = overlayCtx.createImageData(SIM_W, SIM_H);
let overlayTexture;

// --- 1. RADAR TERRAIN (POUR LES FRONTIÈRES TERRE/MER) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();

// Chargement de l'image de masque (le radar noir et blanc/transparent)
terrainImg.src = 'assets/map_globe_terrestre.png'; 
terrainImg.onerror = () => { 
    if(terrainImg.src.includes('terrestre')) terrainImg.src = 'assets/map_globe_terreste.png'; // Fallback orthographe
};

terrainImg.onload = () => {
    terrainCanvas.width = SIM_W; terrainCanvas.height = SIM_H;
    terrainCtx.drawImage(terrainImg, 0, 0, SIM_W, SIM_H);
    initGridLandWater();
};

function initGridLandWater() {
    try {
        const pData = terrainCtx.getImageData(0, 0, SIM_W, SIM_H).data;
        for (let y = 0; y < SIM_H; y++) {
            for (let x = 0; x < SIM_W; x++) {
                const idx = (y * SIM_W + x) * 4;
                const r = pData[idx], g = pData[idx + 1], b = pData[idx + 2], a = pData[idx + 3];
                // L'eau est noire (r<20, g<20, b<20) ou transparente (a<50)
                const isOcean = (a < 50) || (r < 20 && g < 20 && b < 20);
                grid[y * SIM_W + x] = isOcean ? -2 : -1;
            }
        }
        console.log("Radar terrestre chargé avec succès !");
    } catch(e) { 
        console.warn("BLOCAGE SÉCURITÉ NAVIGATEUR : Utilise Live Server pour que la détection de la mer fonctionne !");
        grid.fill(-1); 
    }
}

function isWaterPixel(x, y) {
    if (x < 0 || x >= SIM_W || y < 0 || y >= SIM_H) return true;
    return grid[y * SIM_W + x] === -2;
}

// --- 2. MENUS ---
window.openMenu = function(menuId) { document.getElementById('main-menu').style.display = 'none'; document.getElementById('local-menu').style.display = 'none'; document.getElementById('network-menu').style.display = 'none'; if(menuId !== 'main') document.getElementById(menuId + '-menu').style.display = 'flex'; else document.getElementById('main-menu').style.display = 'flex'; }
window.joinNetworkGame = function() { alert("Multijoueur en dev !"); }
window.toggleSettings = function() { document.getElementById('settings-modal').classList.toggle('show'); }
window.toggleTheme = function() { document.body.classList.toggle('dark-mode'); }
window.toggleFullscreen = function() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e=>{}); else if (document.exitFullscreen) document.exitFullscreen(); }
window.setGameSize = function(size) { const c = document.getElementById('game-container'); if (!c) return; document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active')); c.classList.remove('size-classic', 'size-wide', 'size-full'); if (size === 'classic') c.classList.add('size-classic'); else if (size === 'wide') c.classList.add('size-wide'); if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); } }

// --- 3. DÉMARRAGE ---
window.startGame = function(mode) {
    aiMode = mode;
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('ui-container').style.display = 'flex';
    document.getElementById('spawn-timer-container').style.display = 'block';
    
    gameState = 'SPAWNING'; myCapitalPlaced = false; spawnCountdown = 10;
    document.getElementById('spawn-timer').innerText = spawnCountdown;

    if(!overlayTexture && window.gameScene) {
        overlayTexture = new THREE.CanvasTexture(overlayCanvas);
        overlayTexture.magFilter = THREE.NearestFilter; 
        const overlayGeo = new THREE.SphereGeometry(5.03, 64, 64);
        const overlayMat = new THREE.MeshBasicMaterial({ map: overlayTexture, transparent: true, opacity: 0.8 });
        const overlaySphere = new THREE.Mesh(overlayGeo, overlayMat);
        overlaySphere.rotation.y = -Math.PI / 2;
        window.gameScene.add(overlaySphere);
    }

    let timerInterval = setInterval(() => {
        spawnCountdown--; document.getElementById('spawn-timer').innerText = spawnCountdown;
        if (spawnCountdown <= 0) { clearInterval(timerInterval); finishSpawningPhase(); }
    }, 1000);
}

function finishSpawningPhase() {
    gameState = 'PLAYING';
    document.getElementById('spawn-timer-container').style.display = 'none';
    document.getElementById('game-phase-text').innerText = "GUERRE GLOBALE";

    if (!myCapitalPlaced) {
        let uv = getRandomLandUV();
        setPlayerCapital(uv, get3DPosFromUV(uv.x, uv.y));
    }
    spawnAllAIs();

    setInterval(() => {
        if(gameState === 'PLAYING') {
            if (playerStats.alive) {
                playerStats.pop = Math.min(playerStats.maxPop, playerStats.pop + Math.max(1, Math.floor(playerStats.pop * 0.04)));
                playerStats.gold += Math.floor(playerStats.territory * 0.15) + 2;
                updateHUD();
            }
            updateAllAIs();
            manageTradeRoutes(); 
        }
    }, 1000);
}

function updateHUD() {
    document.getElementById('ui-pop').innerText = Math.floor(playerStats.pop);
    document.getElementById('ui-max-pop').innerText = "/ " + playerStats.maxPop;
    document.getElementById('ui-ter').innerText = playerStats.territory;
    document.getElementById('ui-gold').innerText = playerStats.gold;
}

// --- 4. GESTION DES POSITIONS & DE LA CAPITALE ---
function get3DPosFromUV(u, v) {
    let phi = (1 - v) * Math.PI; let theta = u * Math.PI * 2; 
    let x = -5 * Math.sin(phi) * Math.cos(theta); let y = 5 * Math.cos(phi); let z = 5 * Math.sin(phi) * Math.sin(theta);
    let pos = new THREE.Vector3(x, y, z); pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    return pos;
}

function getRandomLandUV() {
    for(let i = 0; i < 200; i++) {
        let u = Math.random(); let v = Math.random() * 0.7 + 0.15; 
        let gx = Math.floor(u * SIM_W); let gy = Math.floor((1 - v) * SIM_H);
        if (!isWaterPixel(gx, gy) && grid[gy * SIM_W + gx] === -1) return new THREE.Vector2(u, v);
    }
    return new THREE.Vector2(0.5, 0.5);
}

function setPlayerCapital(uv, pos3D) {
    if (playerCapitalMesh) { window.gameScene.remove(playerCapitalMesh); entities = entities.filter(e => e.mesh !== playerCapitalMesh); }
    if (playerCapitalUV) { let oldGx = Math.floor(playerCapitalUV.x * SIM_W); let oldGy = Math.floor((1 - playerCapitalUV.y) * SIM_H); claimPixel(oldGx, oldGy, -1); }

    playerCapitalUV = uv.clone(); buildTargetPosition = pos3D;

    const geometry = new THREE.OctahedronGeometry(0.18, 0); geometry.scale(1, 1.8, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffbf00, roughness: 0.1, metalness: 0.8 });
    playerCapitalMesh = new THREE.Mesh(geometry, material);
    playerCapitalMesh.position.copy(pos3D);
    playerCapitalMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos3D.clone().normalize());
    window.gameScene.add(playerCapitalMesh);
    
    entities.push({ type: 'capital', owner: 'player', mesh: playerCapitalMesh, factionId: 0 });

    let gx = Math.floor(uv.x * SIM_W); let gy = Math.floor((1 - uv.y) * SIM_H);
    claimPixel(gx, gy, 0);

    myCapitalPlaced = true;
    playerStats.pop = 500; playerStats.maxPop = 1000; playerStats.gold = 500; playerStats.territory = 1;
    updateHUD(); renderGridToCanvas();

    const tCont = document.getElementById('spawn-timer-container');
    if (tCont) { tCont.querySelector('h2').innerText = "CAPITALE PLACÉE !"; tCont.querySelector('p').innerText = "Tu peux recliquer sur la terre pour la déplacer."; }
}

// --- 5. MOTEUR D'EXPANSION (CIBLÉ & TERRESTRE) ---
function claimPixel(x, y, factionId) {
    if (x < 0 || x >= SIM_W || y < 0 || y >= SIM_H) return;
    const oldOwner = grid[y * SIM_W + x];
    if (oldOwner === factionId || oldOwner === -3 || oldOwner === -2) return; 

    if (oldOwner >= 0) {
        if (oldOwner === 0) { playerStats.territory = Math.max(0, playerStats.territory - 1); checkPlayerElimination(); } 
        else { let enemyAI = ais.find(a => a.id === oldOwner); if (enemyAI) { enemyAI.territory = Math.max(0, enemyAI.territory - 1); if (enemyAI.territory <= 0) eliminateFaction(enemyAI, factionId); } }
    }

    grid[y * SIM_W + x] = factionId;
    updateMaxPop(factionId);
    updateFrontier(x, y, factionId);
}

function updateMaxPop(factionId) {
    if (factionId === 0) {
        playerStats.territory++; 
        playerStats.maxPop = Math.max(1000, 1000 + (playerStats.territory * 15) + (playerStats.cityCount * 3000));
    } else if (factionId > 0) {
        let ai = ais.find(a => a.id === factionId);
        if (ai) { ai.territory++; ai.maxPop = Math.max(1000, 1000 + (ai.territory * 15) + (ai.cityCount * 3000)); }
    }
}

function updateFrontier(x, y, factionId) {
    if (!frontierMap.has(factionId)) frontierMap.set(factionId, new Set());
    const set = frontierMap.get(factionId);
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    let isBorder = false;
    for(let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < SIM_W && ny >= 0 && ny < SIM_H) {
            let neighborOwner = grid[ny * SIM_W + nx];
            if (neighborOwner !== factionId && neighborOwner !== -2 && neighborOwner !== -3) { isBorder = true; break; }
        }
    }
    if (isBorder) set.add(`${x},${y}`); else set.delete(`${x},${y}`);
}

function expandFactionTerritory(factionId, pixelsToClaim, targetPoint = null) {
    if (!frontierMap.has(factionId)) return;
    const frontierSet = frontierMap.get(factionId);
    if (frontierSet.size === 0) return;

    let frontierArray = Array.from(frontierSet);
    
    if (targetPoint) {
        frontierArray.sort((a, b) => {
            let [ax, ay] = a.split(',').map(Number); let [bx, by] = b.split(',').map(Number);
            let distA = (ax - targetPoint.x)**2 + (ay - targetPoint.y)**2;
            let distB = (bx - targetPoint.x)**2 + (by - targetPoint.y)**2;
            return distA - distB; 
        });
    } else {
        let faction = factionId === 0 ? playerCapitalUV : ais.find(a => a.id === factionId).uv;
        if(faction) {
            let cx = Math.floor(faction.x * SIM_W); let cy = Math.floor((1 - faction.y) * SIM_H);
            frontierArray.sort((a, b) => {
                let [ax, ay] = a.split(',').map(Number); let [bx, by] = b.split(',').map(Number);
                return ((ax - cx)**2 + (ay - cy)**2) - ((bx - cx)**2 + (by - cy)**2);
            });
        }
    }

    let claimed = 0; const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

    for (let key of frontierArray) {
        if (claimed >= pixelsToClaim) break;
        let [fx, fy] = key.split(',').map(Number);
        for (let [dx, dy] of dirs) {
            let nx = fx + dx, ny = fy + dy;
            if (nx >= 0 && nx < SIM_W && ny >= 0 && ny < SIM_H) {
                let target = grid[ny * SIM_W + nx];
                if (target !== factionId && target !== -2 && target !== -3) { 
                    claimPixel(nx, ny, factionId);
                    claimed++;
                    if (claimed >= pixelsToClaim) break;
                }
            }
        }
    }
    renderGridToCanvas();
}

function renderGridToCanvas() {
    const data = overlayImgData.data;
    for (let i = 0; i < grid.length; i++) {
        const owner = grid[i]; const idx = i * 4;
        if (owner >= 0 && owner < FACTIONS.length) {
            const rgb = FACTIONS[owner].rgb;
            data[idx] = rgb[0]; data[idx + 1] = rgb[1]; data[idx + 2] = rgb[2]; data[idx + 3] = 200; 
        } else if (owner === -3) {
            data[idx] = 120; data[idx + 1] = 255; data[idx + 2] = 20; data[idx + 3] = 220; 
        } else { data[idx + 3] = 0; }
    }
    overlayCtx.putImageData(overlayImgData, 0, 0);
    if (overlayTexture) overlayTexture.needsUpdate = true;
}

// --- 6. GESTION DE L'IA ---
function spawnAllAIs() {
    ais = []; const isEmpire = (aiMode === 'smart_bots');
    for (let id = 1; id <= 10; id++) {
        let uv = getRandomLandUV(); let pos3D = get3DPosFromUV(uv.x, uv.y); let faction = FACTIONS[id];
        let ai = { id: id, name: faction.name, hex: faction.hex, uv: uv, pos3D: pos3D, pop: isEmpire ? 3000 : 500, maxPop: isEmpire ? 10000 : 1500, gold: isEmpire ? 1500 : 500, territory: 0, alive: true, cityCount: 0 };

        const geo = new THREE.OctahedronGeometry(0.18, 0); geo.scale(1, 1.8, 1);
        const mat = new THREE.MeshStandardMaterial({ color: faction.hex, roughness: 0.1, metalness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(pos3D); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos3D.clone().normalize());
        window.gameScene.add(mesh); ai.mesh = mesh;
        entities.push({ type: 'capital', owner: 'ai_' + id, mesh: mesh, factionId: id });

        let gx = Math.floor(uv.x * SIM_W); let gy = Math.floor((1 - uv.y) * SIM_H);
        claimPixel(gx, gy, id);
        if (isEmpire) expandFactionTerritory(id, 80);
        ais.push(ai);
    }
    renderGridToCanvas();
}

function updateAllAIs() {
    const isEmpire = (aiMode === 'smart_bots');
    ais.forEach(ai => {
        if (!ai.alive) return;
        let growthRate = isEmpire ? 0.08 : 0.04;
        ai.pop = Math.min(ai.maxPop, ai.pop + Math.max(2, Math.floor(ai.pop * growthRate)));
        ai.gold += Math.floor(ai.territory * 0.15) + 2;

        let expandProb = isEmpire ? 0.6 : 0.35;
        if (Math.random() < expandProb && ai.pop > 100) {
            let troopsToSend = Math.floor(ai.pop * (Math.random() * 0.3 + 0.2));
            ai.pop -= troopsToSend;
            let pixels = Math.max(1, Math.floor(troopsToSend * 0.25));
            expandFactionTerritory(ai.id, pixels);
        }

        if (ai.gold >= 1500 && Math.random() < 0.05) {
            ai.gold -= 1500;
            let frontiers = Array.from(frontierMap.get(ai.id) || []);
            if (frontiers.length > 0) {
                let randKey = frontiers[Math.floor(Math.random() * frontiers.length)];
                let [fx, fy] = randKey.split(',').map(Number);
                let pos = get3DPosFromUV(fx / SIM_W, 1 - (fy / SIM_H));
                
                const g = new THREE.CylinderGeometry(0.06, 0.1, 0.25, 6); const m = new THREE.MeshStandardMaterial({ color: ai.hex });
                const mesh = new THREE.Mesh(g, m); mesh.position.copy(pos); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
                window.gameScene.add(mesh); entities.push({ type: 'city', owner: 'ai_' + ai.id, mesh: mesh, factionId: ai.id });
                ai.cityCount++;
                updateMaxPop(ai.id);
            }
        }
    });
}

function eliminateFaction(defeatedAI, conquerorId) {
    if (!defeatedAI.alive) return;
    defeatedAI.alive = false;
    if (defeatedAI.mesh) window.gameScene.remove(defeatedAI.mesh);

    entities.forEach(ent => {
        if (ent.factionId === defeatedAI.id) {
            ent.factionId = conquerorId; ent.owner = conquerorId === 0 ? 'player' : 'ai_' + conquerorId;
            if (ent.mesh && ent.mesh.material) ent.mesh.material.color.setHex(FACTIONS[conquerorId].hex);
            if (ent.type === 'city') {
                if (conquerorId === 0) { playerStats.cityCount++; updateMaxPop(0); }
                else { let w = ais.find(a=>a.id===conquerorId); if(w) { w.cityCount++; updateMaxPop(conquerorId); } }
            }
        }
    });

    let stolenGold = defeatedAI.gold;
    if (conquerorId === 0) { playerStats.gold += stolenGold; alert(`🏆 VICTOIRE : ${defeatedAI.name} éliminé ! +${stolenGold} Or.`); updateHUD(); } 
    else { let winnerAI = ais.find(a => a.id === conquerorId); if (winnerAI) winnerAI.gold += stolenGold; }
}

function checkPlayerElimination() {
    if (playerStats.territory <= 0 && playerStats.alive && gameState === 'PLAYING') {
        playerStats.alive = false; alert("💀 DÉFAITE : Votre nation a été entièrement conquise !");
    }
}

// --- 7. CONTRÔLES SOURIS (CIBLAGE) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerup', function(event) {
    if (event.target.closest && (event.target.closest('.settings-btn-wrapper') || event.target.closest('#settings-modal'))) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.gameCamera);
    const intersects = raycaster.intersectObject(window.gameEarth);

    if (intersects.length > 0 && gameState === 'SPAWNING') {
        const hit = intersects[0]; if (!hit.uv) return;
        let gx = Math.floor(hit.uv.x * SIM_W); let gy = Math.floor((1 - hit.uv.y) * SIM_H);
        if (!isWaterPixel(gx, gy)) setPlayerCapital(hit.uv, hit.point);
    }
});

// DOUBLE CLIC : EXPANSION CIBLÉE VERS LA SOURIS
window.addEventListener('dblclick', function(event) {
    event.preventDefault(); 
    if (gameState !== 'PLAYING' || !playerStats.alive) return;
    if (event.target.closest && (event.target.closest('#ui-container') || event.target.closest('#action-menu'))) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.gameCamera);
    const intersects = raycaster.intersectObject(window.gameEarth);

    if (intersects.length > 0) {
        let troopsSent = Math.floor(playerStats.pop * (troopPercentage / 100));
        if (troopsSent <= 0) return;

        playerStats.pop -= troopsSent;
        let pixelsToClaim = Math.max(1, Math.floor(troopsSent * 0.25));
        
        let targetPoint = { x: Math.floor(intersects[0].uv.x * SIM_W), y: Math.floor((1 - intersects[0].uv.y) * SIM_H) };
        expandFactionTerritory(0, pixelsToClaim, targetPoint);
        updateHUD();
    }
});

window.addEventListener('contextmenu', function(event) {
    event.preventDefault(); 
    if (gameState !== 'PLAYING' || !playerStats.alive) return;
    if (event.target.closest && (event.target.closest('#ui-container') || event.target.closest('#action-menu') || event.target.closest('.settings-btn-wrapper'))) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.gameCamera);

    const entityMeshes = entities.map(e => e.mesh);
    const entityIntersects = raycaster.intersectObjects(entityMeshes);
    if (entityIntersects.length > 0 && actionState === 'NORMAL') {
        const hitMesh = entityIntersects[0].object; const clickedEnt = entities.find(e => e.mesh === hitMesh);
        if(clickedEnt && clickedEnt.owner === 'player') { openActionMenu(event.clientX, event.clientY, clickedEnt, null); return; }
    }

    const intersects = raycaster.intersectObject(window.gameEarth);
    if (intersects.length > 0) {
        const hit = intersects[0];
        
        if (actionState === 'TARGETING_ICBM' && selectedEntity) {
            launchMissile(selectedEntity, hit.point, hit.uv); actionState = 'NORMAL'; selectedEntity = null; return;
        }

        buildTargetPosition = hit.point;
        let gx = Math.floor(hit.uv.x * SIM_W); let gy = Math.floor((1 - hit.uv.y) * SIM_H);
        let owner = grid[gy * SIM_W + gx];

        if (owner === 0) openActionMenu(event.clientX, event.clientY, null, 'Terre');
        else if (owner === -2) openActionMenu(event.clientX, event.clientY, null, 'Eau');
        else closeActionMenu();
    } else { closeActionMenu(); }
});

// --- 8. MENUS & CONSTRUCTION ---
window.openActionMenu = function(mouseX, mouseY, entity = null, terrainType = null) {
    const menu = document.getElementById('action-menu'); const header = document.getElementById('action-title'); const subheader = document.getElementById('action-subtitle'); const buildOptions = document.getElementById('build-options'); const commandOptions = document.getElementById('command-options');
    menu.style.left = mouseX + 'px'; menu.style.top = mouseY + 'px'; menu.style.display = 'flex';

    if (entity) {
        buildOptions.style.display = 'none'; commandOptions.style.display = 'flex'; commandOptions.style.flexDirection = 'column'; selectedEntity = entity;
        if (entity.type === 'missile') { header.innerText = "🚀 SILO NUCLÉAIRE"; header.style.color = "#ff007f"; subheader.innerText = "En attente de cible..."; document.getElementById('btn-launch-icbm').style.display = 'block'; document.getElementById('btn-establish-route').style.display = 'none'; } 
        else { closeActionMenu(); }
    } else {
        buildOptions.style.display = 'flex'; buildOptions.style.flexDirection = 'column'; commandOptions.style.display = 'none';
        
        if (terrainType === 'Eau') { 
            header.innerText = "🌊 ZONE MARITIME"; header.style.color = "#00f0ff"; subheader.innerText = "Commerce Océanique"; 
            document.getElementById('btn-city').disabled = true; document.getElementById('btn-missile').disabled = true; document.getElementById('btn-anti-missile').disabled = true; document.getElementById('btn-port').disabled = false; 
        } else { 
            header.innerText = "⛰️ TON TERRITOIRE"; header.style.color = "#39ff14"; subheader.innerText = "Construire des infrastructures"; 
            document.getElementById('btn-city').innerText = "🏙️ Ville (+3000 Hab) (500 Or)";
            document.getElementById('btn-missile').innerText = "🚀 Silo Nucléaire (1500 Or)";
            document.getElementById('btn-anti-missile').innerText = "🛡️ Anti-Missile (1500 Or)";
            document.getElementById('btn-city').disabled = false; document.getElementById('btn-missile').disabled = false; document.getElementById('btn-anti-missile').disabled = false; document.getElementById('btn-port').disabled = true; 
        }
    }
}
window.closeActionMenu = function() { document.getElementById('action-menu').style.display = 'none'; if(actionState === 'NORMAL') selectedEntity = null; }

window.executeAction = function(action, isCapital = false) {
    closeActionMenu();
    if (action === 'launch_icbm') { actionState = 'TARGETING_ICBM'; return; }
    if (!buildTargetPosition) return;
    
    let cost = 0; let type = action.replace('build_', '');
    if (type === 'city') cost = 500; 
    if (type === 'port') cost = 800; 
    if (type === 'missile') cost = 1500; 
    if (type === 'anti_missile') cost = 1500;

    if(!isCapital && playerStats.gold < cost) { alert("Fonds insuffisants !"); return; }
    if(!isCapital) playerStats.gold -= cost; 

    let color = 0x00f0ff, geometry;
    
    if (type === 'city') { 
        geometry = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 6); 
        playerStats.cityCount++; updateMaxPop(0);
    } 
    else if (type === 'port') { geometry = new THREE.BoxGeometry(0.15, 0.05, 0.15); }
    else if (type === 'missile') { geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8); color = 0xff007f; } 
    else if (type === 'anti_missile') { geometry = new THREE.DodecahedronGeometry(0.15, 0); color = 0x39ff14; }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);
    structure.position.copy(buildTargetPosition);
    structure.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), buildTargetPosition.clone().normalize());
    
    if (type === 'city' || type === 'missile') structure.translateY(0.1);
    
    window.gameScene.add(structure);
    entities.push({ type: type, owner: 'player', mesh: structure, factionId: 0 });
    updateHUD();
}

// --- 9. NAVIRES DE COMMERCE ---
function manageTradeRoutes() {
    let ports = entities.filter(e => e.type === 'port');
    if (ports.length >= 2 && Math.random() < 0.4) {
        let p1 = ports[Math.floor(Math.random() * ports.length)];
        let p2 = ports[Math.floor(Math.random() * ports.length)];
        if (p1 !== p2) spawnShip(p1, p2);
    }
}

function spawnShip(portA, portB) {
    let shipGeo = new THREE.BoxGeometry(0.06, 0.03, 0.12);
    let shipMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    let shipMesh = new THREE.Mesh(shipGeo, shipMat);
    shipMesh.position.copy(portA.mesh.position);
    window.gameScene.add(shipMesh);
    tradeShips.push({ mesh: shipMesh, start: portA.mesh.position.clone(), end: portB.mesh.position.clone(), progress: 0, owner: portA.owner });
}

function customAnimations() {
    requestAnimationFrame(customAnimations);
    
    entities.forEach(ent => {
        if (ent.type === 'capital' && ent.mesh) ent.mesh.rotateY(0.02);
    });

    for (let i = tradeShips.length - 1; i >= 0; i--) {
        let ship = tradeShips[i];
        ship.progress += 0.003; 
        if (ship.progress >= 1) {
            window.gameScene.remove(ship.mesh);
            if (ship.owner === 'player') { playerStats.gold += 150; updateHUD(); }
            tradeShips.splice(i, 1);
        } else {
            let t = ship.progress; let u = 1 - t;
            let mid = ship.start.clone().lerp(ship.end, 0.5);
            mid.normalize().multiplyScalar(5.02);
            let pos = new THREE.Vector3(); pos.x = u*u*ship.start.x + 2*u*t*mid.x + t*t*ship.end.x; pos.y = u*u*ship.start.y + 2*u*t*mid.y + t*t*ship.end.y; pos.z = u*u*ship.start.z + 2*u*t*mid.z + t*t*ship.end.z; pos.normalize().multiplyScalar(5.01);
            
            let nextT = Math.min(1, t + 0.01); let nu = 1 - nextT;
            let nextPos = new THREE.Vector3(); nextPos.x = nu*nu*ship.start.x + 2*nu*nextT*mid.x + nextT*nextT*ship.end.x; nextPos.y = nu*nu*ship.start.y + 2*nu*nextT*mid.y + nextT*nextT*ship.end.y; nextPos.z = nu*nu*ship.start.z + 2*nu*nextT*mid.z + nextT*nextT*ship.end.z; nextPos.normalize().multiplyScalar(5.01);
            
            ship.mesh.position.copy(pos); ship.mesh.lookAt(nextPos);
        }
    }
}
customAnimations();


// --- 10. ARMES NUCLÉAIRES & IRRADIATION ---
window.updateTroopVal = function(val) { troopPercentage = val; let elem = document.getElementById('troop-val'); if(elem) elem.innerText = val + "%"; }

function launchMissile(siloEntity, targetPos, targetUV) {
    window.gameScene.remove(siloEntity.mesh);
    entities = entities.filter(e => e !== siloEntity);

    const missileGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8); const missileMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); const missile = new THREE.Mesh(missileGeo, missileMat);
    missile.position.copy(siloEntity.mesh.position); window.gameScene.add(missile);
    
    const start = siloEntity.mesh.position.clone(); const end = targetPos.clone();
    const midPoint = start.clone().add(end).multiplyScalar(0.5); 
    midPoint.normalize().multiplyScalar(5 + start.distanceTo(end) * 0.5);
    
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end); const points = curve.getPoints(60); 
    let index = 0;
    function animateMissile() {
        if (index < points.length) {
            missile.position.copy(points[index]); if(index < points.length - 1) missile.lookAt(points[index+1]);
            missile.rotateX(Math.PI / 2); index++; requestAnimationFrame(animateMissile);
        } else { 
            window.gameScene.remove(missile); createExplosion(end, targetUV); 
        }
    } animateMissile();
}

function createExplosion(pos, uv) {
    const geo = new THREE.SphereGeometry(0.5, 16, 16); const mat = new THREE.MeshBasicMaterial({ color: 0x88ff00, transparent: true, opacity: 0.9 }); const explosion = new THREE.Mesh(geo, mat);
    explosion.position.copy(pos); window.gameScene.add(explosion);
    let scale = 1;
    function animateBoom() {
        scale += 0.15; explosion.scale.set(scale, scale, scale); mat.opacity -= 0.05;
        if (mat.opacity > 0) requestAnimationFrame(animateBoom); else window.gameScene.remove(explosion);
    } animateBoom();

    let cx = Math.floor(uv.x * SIM_W); let cy = Math.floor((1 - uv.y) * SIM_H); let nRadius = 12;
    for(let y = cy - nRadius; y <= cy + nRadius; y++) {
        for(let x = cx - nRadius; x <= cx + nRadius; x++) {
            if(x >= 0 && x < SIM_W && y >= 0 && y < SIM_H) {
                if((x - cx)**2 + (y - cy)**2 <= nRadius**2) {
                    let idx = y * SIM_W + x; let oldOwner = grid[idx];
                    if (oldOwner !== -2) { 
                        if (oldOwner >= 0) {
                            if (oldOwner === 0) { playerStats.territory = Math.max(0, playerStats.territory - 1); updateMaxPop(0); }
                            else { let ai = ais.find(a => a.id === oldOwner); if(ai) { ai.territory = Math.max(0, ai.territory - 1); updateMaxPop(oldOwner); } }
                        }
                        grid[idx] = -3; 
                    }
                }
            }
        }
    }
    renderGridToCanvas();
    entities = entities.filter(ent => { if (ent.mesh.position.distanceTo(pos) < 0.8) { window.gameScene.remove(ent.mesh); return false; } return true; });
}
