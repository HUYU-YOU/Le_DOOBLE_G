// =========================================================================
// OPEN FRONT - MOTEUR DE JEU & GUERRE TERRITORIALE SUR GLOBE (10 IA)
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

let playerStats = { 
    pop: 500, 
    maxPop: 1000, 
    gold: 500, 
    territory: 0, 
    alive: true 
};

// --- PALETTE DE COULEURS POUR LES 10 IA + JOUEUR ---
const FACTIONS = [
    { id: 0, name: "Joueur", rgb: [0, 240, 255], hex: 0x00f0ff, css: '#00f0ff' }, // Cyan
    { id: 1, name: "Empire Crimson", rgb: [255, 0, 68], hex: 0xff0044, css: '#ff0044' }, // Rouge
    { id: 2, name: "Tribu Toxique", rgb: [57, 255, 20], hex: 0x39ff14, css: '#39ff14' }, // Vert fluo
    { id: 3, name: "Dynastie Royale", rgb: [176, 0, 255], hex: 0xb000ff, css: '#b000ff' }, // Violet
    { id: 4, name: "Légion Solaire", rgb: [255, 140, 0], hex: 0xff8c00, css: '#ff8c00' }, // Orange
    { id: 5, name: "Ordre Rubis", rgb: [255, 0, 150], hex: 0xff0096, css: '#ff0096' }, // Rose
    { id: 6, name: "Sultanat Doré", rgb: [255, 230, 0], hex: 0xffe600, css: '#ffe600' }, // Jaune
    { id: 7, name: "Confédération Océane", rgb: [0, 168, 150], hex: 0x00a896, css: '#00a896' }, // Teal
    { id: 8, name: "Clan Cobalt", rgb: [67, 97, 238], hex: 0x4361ee, css: '#4361ee' }, // Bleu Roi
    { id: 9, name: "Horde Sanglante", rgb: [230, 57, 70], hex: 0xe63946, css: '#e63946' }, // Écarlate
    { id: 10, name: "Fédération Menthe", rgb: [46, 196, 182], hex: 0x2ec4b6, css: '#2ec4b6' } // Menthe
];

let ais = [];

// Grille de territoire : -2 = Eau, -1 = Terre neutre, 0 = Joueur, 1..10 = IA
const grid = new Int8Array(SIM_W * SIM_H);
const frontierMap = new Map(); // FactionID -> Set de clés "x,y" frontalières

// Canvas de superposition pour Three.js
const overlayCanvas = document.createElement('canvas');
overlayCanvas.width = SIM_W;
overlayCanvas.height = SIM_H;
const overlayCtx = overlayCanvas.getContext('2d');
let overlayImgData = overlayCtx.createImageData(SIM_W, SIM_H);
let overlayTexture;

// --- 1. RADAR ET CHARGEMENT TERRAIN (TERRE VS MER) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();
terrainImg.src = 'assets/map_globe_terreste.png';

terrainImg.onerror = () => {
    // Si la carte radar n'existe pas, on prend la carte graphique standard
    terrainImg.src = 'assets/map_globe.png';
};

terrainImg.onload = () => {
    terrainCanvas.width = SIM_W;
    terrainCanvas.height = SIM_H;
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
                const isOcean = (a < 50) || (r < 30 && g < 30 && b < 30) || (b > 130 && r < 70 && g < 110);
                grid[y * SIM_W + x] = isOcean ? -2 : -1;
            }
        }
    } catch(e) {
        grid.fill(-1); // Fallback terre partout si sécurité navigateur locale
    }
}

function isWaterPixel(x, y) {
    if (x < 0 || x >= SIM_W || y < 0 || y >= SIM_H) return true;
    return grid[y * SIM_W + x] === -2;
}

// --- 2. GESTION DES MENUS & PARAMÈTRES ---
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;
window.startSettingsAnim = function() { if (hoverInterval) return; currentFrame = 0; const btn = document.getElementById('settings-btn-img'); if(btn) btn.src = animFrames[currentFrame]; hoverInterval = setInterval(() => { currentFrame = (currentFrame + 1) % animFrames.length; if(btn) btn.src = animFrames[currentFrame]; }, 100); }
window.stopSettingsAnim = function() { clearInterval(hoverInterval); hoverInterval = null; const btn = document.getElementById('settings-btn-img'); if (btn && !btn.src.includes('settings4.png')) { btn.src = '../img/setting.png'; } }
window.clickSettingsAnim = function() { clearInterval(hoverInterval); hoverInterval = null; const btn = document.getElementById('settings-btn-img'); if(btn) btn.src = '../img/settings4.png'; window.toggleSettings(); setTimeout(() => { if(btn) btn.src = '../img/setting.png'; }, 300); }
window.toggleSettings = function() { document.getElementById('settings-modal').classList.toggle('show'); }
window.toggleTheme = function() { document.body.classList.toggle('dark-mode'); }
window.toggleFullscreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.log(err)); } else { if (document.exitFullscreen) document.exitFullscreen(); } }
window.setGameSize = function(size) { const container = document.getElementById('game-container'); if (!container) return; document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active')); container.classList.remove('size-classic', 'size-wide', 'size-full'); let btnClassic = document.getElementById('btn-sz-classic'); let btnWide = document.getElementById('btn-sz-wide'); if (size === 'classic') { container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } else if (size === 'wide') { container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); } }

window.openMenu = function(menuId) { 
    document.getElementById('main-menu').style.display = 'none'; 
    document.getElementById('local-menu').style.display = 'none'; 
    document.getElementById('network-menu').style.display = 'none'; 
    if(menuId !== 'main') document.getElementById(menuId + '-menu').style.display = 'flex'; 
    else document.getElementById('main-menu').style.display = 'flex'; 
}

window.joinNetworkGame = function() { 
    let input = document.getElementById('ops-input').value.toUpperCase(); 
    if(/^OPS\d{4}$/.test(input)) { 
        document.getElementById('network-error').innerText = "Connexion..."; 
        setTimeout(() => { alert("Multijoueur en dev !"); }, 1000); 
    } else { 
        document.getElementById('network-error').innerText = "Format requis : OPS + 4 chiffres."; 
    } 
}

// --- 3. DÉMARRAGE DU JEU ---
window.startGame = function(mode) {
    aiMode = mode;
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('ui-container').style.display = 'flex';
    document.getElementById('spawn-timer-container').style.display = 'block';
    
    gameState = 'SPAWNING'; 
    myCapitalPlaced = false; 
    spawnCountdown = 10;
    document.getElementById('spawn-timer').innerText = spawnCountdown;

    // Sphère de superposition pour l'affichage de l'expansion
    if(!overlayTexture && window.gameScene) {
        overlayTexture = new THREE.CanvasTexture(overlayCanvas);
        const overlayGeo = new THREE.SphereGeometry(5.03, 64, 64);
        const overlayMat = new THREE.MeshBasicMaterial({ 
            map: overlayTexture, 
            transparent: true, 
            opacity: 0.75 
        });
        const overlaySphere = new THREE.Mesh(overlayGeo, overlayMat);
        overlaySphere.rotation.y = -Math.PI / 2;
        window.gameScene.add(overlaySphere);
    }

    let timerInterval = setInterval(() => {
        spawnCountdown--; 
        document.getElementById('spawn-timer').innerText = spawnCountdown;
        if (spawnCountdown <= 0) { 
            clearInterval(timerInterval); 
            finishSpawningPhase(); 
        }
    }, 1000);
}

function finishSpawningPhase() {
    gameState = 'PLAYING';
    document.getElementById('spawn-timer-container').style.display = 'none';
    document.getElementById('game-phase-text').innerText = "GUERRE GLOBALE";

    // Si le joueur n'a pas cliqué, on le place automatiquement sur la terre ferme
    if (!myCapitalPlaced) {
        let uv = getRandomLandUV();
        setPlayerCapital(uv, get3DPosFromUV(uv.x, uv.y));
    }

    // Déploiement des 10 IA
    spawnAllAIs();

    // Boucle de simulation temps réel (Economie & IA)
    setInterval(() => {
        if(gameState === 'PLAYING') {
            // Economie Joueur
            if (playerStats.alive) {
                let popGrowth = Math.max(1, Math.floor(playerStats.pop * 0.04));
                playerStats.pop = Math.min(playerStats.maxPop, playerStats.pop + popGrowth);
                playerStats.gold += Math.floor(playerStats.territory * 0.15) + 2;
                updateHUD();
            }

            // Economie & Actions des 10 IA
            updateAllAIs();
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
    let phi = (1 - v) * Math.PI; 
    let theta = u * Math.PI * 2; 
    let x = -5 * Math.sin(phi) * Math.cos(theta);
    let y = 5 * Math.cos(phi);
    let z = 5 * Math.sin(phi) * Math.sin(theta);
    let pos = new THREE.Vector3(x, y, z);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    return pos;
}

function getRandomLandUV() {
    for(let i = 0; i < 200; i++) {
        let u = Math.random();
        let v = Math.random() * 0.7 + 0.15; // Évite les pôles
        let gx = Math.floor(u * SIM_W);
        let gy = Math.floor((1 - v) * SIM_H);
        if (!isWaterPixel(gx, gy) && grid[gy * SIM_W + gx] === -1) {
            return new THREE.Vector2(u, v);
        }
    }
    return new THREE.Vector2(0.5, 0.5);
}

// Positionne ou déplace la capitale du joueur
function setPlayerCapital(uv, pos3D) {
    // 1. Si la capitale existait déjà, on la retire de la scène 3D
    if (playerCapitalMesh) {
        window.gameScene.remove(playerCapitalMesh);
        entities = entities.filter(e => e.mesh !== playerCapitalMesh);
    }

    // 2. Nettoie l'ancien point sur la grille si déplacé
    if (playerCapitalUV) {
        let oldGx = Math.floor(playerCapitalUV.x * SIM_W);
        let oldGy = Math.floor((1 - playerCapitalUV.y) * SIM_H);
        claimPixel(oldGx, oldGy, -1);
    }

    playerCapitalUV = uv.clone();
    buildTargetPosition = pos3D;

    // 3. Pose la nouvelle ville dorée 3D
    const geometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const material = new THREE.MeshStandardMaterial({ color: 0xffbf00, roughness: 0.3 });
    playerCapitalMesh = new THREE.Mesh(geometry, material);
    playerCapitalMesh.position.copy(pos3D);
    playerCapitalMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos3D.clone().normalize());
    window.gameScene.add(playerCapitalMesh);
    
    entities.push({ type: 'city', owner: 'player', mesh: playerCapitalMesh, factionId: 0 });

    // 4. Initialise la zone de départ
    let gx = Math.floor(uv.x * SIM_W);
    let gy = Math.floor((1 - uv.y) * SIM_H);
    claimPixel(gx, gy, 0);

    myCapitalPlaced = true;
    playerStats.pop = 500;
    playerStats.maxPop = 1000;
    playerStats.gold = 500;
    playerStats.territory = 1;
    updateHUD();
    renderGridToCanvas();

    const tCont = document.getElementById('spawn-timer-container');
    if (tCont) {
        tCont.querySelector('h2').innerText = "CAPITALE PLACÉE !";
        tCont.querySelector('p').innerText = "Tu peux recliquer sur la terre pour la déplacer.";
    }
}

// --- 5. INITIALISATION DES 10 IA ---
function spawnAllAIs() {
    ais = [];
    const isEmpire = (aiMode === 'smart_bots');

    for (let id = 1; id <= 10; id++) {
        let uv = getRandomLandUV();
        let pos3D = get3DPosFromUV(uv.x, uv.y);
        let faction = FACTIONS[id];

        let ai = {
            id: id,
            name: faction.name,
            rgb: faction.rgb,
            hex: faction.hex,
            css: faction.css,
            uv: uv,
            pos3D: pos3D,
            pop: isEmpire ? 2000 : 500,
            maxPop: isEmpire ? 8000 : 1500,
            gold: isEmpire ? 1500 : 500,
            territory: 0,
            alive: true
        };

        // Pose la capitale IA
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = new THREE.MeshStandardMaterial({ color: faction.hex });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos3D);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos3D.clone().normalize());
        window.gameScene.add(mesh);
        ai.mesh = mesh;
        entities.push({ type: 'city', owner: 'ai_' + id, mesh: mesh, factionId: id });

        // Point de départ de la faction
        let gx = Math.floor(uv.x * SIM_W);
        let gy = Math.floor((1 - uv.y) * SIM_H);
        claimPixel(gx, gy, id);

        // Si mode empire, expansion immédiate
        if (isEmpire) {
            expandFactionTerritory(id, 60);
        }

        ais.push(ai);
    }
    renderGridToCanvas();
}

// --- 6. MOTEUR D'EXPANSION ET DE CONQUÊTE (OPEN FRONT) ---
function claimPixel(x, y, factionId) {
    if (x < 0 || x >= SIM_W || y < 0 || y >= SIM_H) return;
    if (isWaterPixel(x, y)) return;

    const oldOwner = grid[y * SIM_W + x];
    if (oldOwner === factionId) return;

    // Si on vole le territoire d'un joueur/IA vivant
    if (oldOwner >= 0) {
        if (oldOwner === 0) {
            playerStats.territory = Math.max(0, playerStats.territory - 1);
            checkPlayerElimination();
        } else {
            let enemyAI = ais.find(a => a.id === oldOwner);
            if (enemyAI) {
                enemyAI.territory = Math.max(0, enemyAI.territory - 1);
                if (enemyAI.territory <= 0) eliminateFaction(enemyAI, factionId);
            }
        }
    }

    grid[y * SIM_W + x] = factionId;

    if (factionId === 0) {
        playerStats.territory++;
        playerStats.maxPop = Math.max(1000, 1000 + playerStats.territory * 15);
    } else if (factionId > 0) {
        let ai = ais.find(a => a.id === factionId);
        if (ai) {
            ai.territory++;
            ai.maxPop = Math.max(1000, 1000 + ai.territory * 15);
        }
    }

    // Met à jour la frontière
    updateFrontier(x, y, factionId);
}

function updateFrontier(x, y, factionId) {
    if (!frontierMap.has(factionId)) frontierMap.set(factionId, new Set());
    const set = frontierMap.get(factionId);
    
    // Vérifie ses 4 voisins
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    let isBorder = false;
    for(let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < SIM_W && ny >= 0 && ny < SIM_H) {
            let neighborOwner = grid[ny * SIM_W + nx];
            if (neighborOwner !== factionId && neighborOwner !== -2) {
                isBorder = true;
                break;
            }
        }
    }
    if (isBorder) set.add(`${x},${y}`);
    else set.delete(`${x},${y}`);
}

function expandFactionTerritory(factionId, pixelsToClaim) {
    if (!frontierMap.has(factionId)) return;
    const frontierSet = frontierMap.get(factionId);
    if (frontierSet.size === 0) return;

    const frontierArray = Array.from(frontierSet);
    let claimed = 0;
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

    for (let key of frontierArray) {
        if (claimed >= pixelsToClaim) break;
        let [fx, fy] = key.split(',').map(Number);

        for (let [dx, dy] of dirs) {
            let nx = fx + dx, ny = fy + dy;
            if (nx >= 0 && nx < SIM_W && ny >= 0 && ny < SIM_H) {
                let target = grid[ny * SIM_W + nx];
                if (target !== factionId && target !== -2) { // Uniquement sur la terre ferme
                    claimPixel(nx, ny, factionId);
                    claimed++;
                    if (claimed >= pixelsToClaim) break;
                }
            }
        }
    }
    renderGridToCanvas();
}

// Rendu des pixels sur la texture Three.js
function renderGridToCanvas() {
    const data = overlayImgData.data;
    for (let i = 0; i < grid.length; i++) {
        const owner = grid[i];
        const idx = i * 4;
        if (owner >= 0 && owner < FACTIONS.length) {
            const rgb = FACTIONS[owner].rgb;
            data[idx] = rgb[0];
            data[idx + 1] = rgb[1];
            data[idx + 2] = rgb[2];
            data[idx + 3] = 200; // Opacité
        } else {
            data[idx + 3] = 0; // Transparent sur mer ou terre neutre
        }
    }
    overlayCtx.putImageData(overlayImgData, 0, 0);
    if (overlayTexture) overlayTexture.needsUpdate = true;
}

// --- 7. ÉLIMINATION D'UNE NATION ET BUTIN DE GUERRE ---
function eliminateFaction(defeatedAI, conquerorId) {
    if (!defeatedAI.alive) return;
    defeatedAI.alive = false;

    // Retrait de la capitale de l'IA détruite
    if (defeatedAI.mesh) window.gameScene.remove(defeatedAI.mesh);

    // Transfert des bâtiments à l'attaquant
    entities.forEach(ent => {
        if (ent.factionId === defeatedAI.id) {
            ent.factionId = conquerorId;
            ent.owner = conquerorId === 0 ? 'player' : 'ai_' + conquerorId;
            if (ent.mesh && ent.mesh.material) {
                ent.mesh.material.color.setHex(FACTIONS[conquerorId].hex);
            }
        }
    });

    // Transfert de l'or
    let stolenGold = defeatedAI.gold;
    if (conquerorId === 0) {
        playerStats.gold += stolenGold;
        alert(`🏆 VICTOIRE : Tu as éliminé ${defeatedAI.name} ! Butin récupéré : +${stolenGold} Or.`);
        updateHUD();
    } else {
        let winnerAI = ais.find(a => a.id === conquerorId);
        if (winnerAI) winnerAI.gold += stolenGold;
    }
}

function checkPlayerElimination() {
    if (playerStats.territory <= 0 && playerStats.alive && gameState === 'PLAYING') {
        playerStats.alive = false;
        alert("💀 DÉFAITE : Votre nation a été entièrement conquise !");
    }
}

// --- 8. BOUCLE D'ACTION DES 10 IA ---
function updateAllAIs() {
    const isEmpire = (aiMode === 'smart_bots');
    
    ais.forEach(ai => {
        if (!ai.alive) return;

        // Croissance
        let growthRate = isEmpire ? 0.06 : 0.035;
        ai.pop = Math.min(ai.maxPop, ai.pop + Math.max(2, Math.floor(ai.pop * growthRate)));
        ai.gold += Math.floor(ai.territory * 0.15) + 2;

        // Décision d'expansion
        let expandProb = isEmpire ? 0.6 : 0.35;
        if (Math.random() < expandProb && ai.pop > 80) {
            let troopsToSend = Math.floor(ai.pop * (Math.random() * 0.3 + 0.2));
            ai.pop -= troopsToSend;
            let pixels = Math.max(1, Math.floor(Math.sqrt(troopsToSend) * 1.5));
            expandFactionTerritory(ai.id, pixels);
        }

        // Décision de construction
        if (ai.gold >= 500 && Math.random() < 0.15) {
            ai.gold -= 500;
            // Pose une petite tour de défense
            let offsetU = (Math.random() - 0.5) * 0.03;
            let offsetV = (Math.random() - 0.5) * 0.03;
            let pos = get3DPosFromUV(ai.uv.x + offsetU, ai.uv.y + offsetV);
            
            const g = new THREE.ConeGeometry(0.08, 0.3, 8);
            const m = new THREE.MeshStandardMaterial({ color: ai.hex });
            const mesh = new THREE.Mesh(g, m);
            mesh.position.copy(pos);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            window.gameScene.add(mesh);
            entities.push({ type: 'defense', owner: 'ai_' + ai.id, mesh: mesh, factionId: ai.id });
        }
    });
}

// --- 9. CONTRÔLES SOURIS DU JOUEUR ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Clic pour placer / déplacer la capitale
window.addEventListener('pointerup', function(event) {
    if (event.target.closest && (event.target.closest('.settings-btn-wrapper') || event.target.closest('#settings-modal'))) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.gameCamera);
    const intersects = raycaster.intersectObject(window.gameEarth);

    if (intersects.length > 0) {
        const hit = intersects[0];
        if (!hit.uv) return;

        let gx = Math.floor(hit.uv.x * SIM_W);
        let gy = Math.floor((1 - hit.uv.y) * SIM_H);

        // Phase 1 : Choix et Déplacement de Capitale
        if (gameState === 'SPAWNING') {
            if (!isWaterPixel(gx, gy)) {
                setPlayerCapital(hit.uv, hit.point);
            } else {
                alert("Impossible de placer la capitale sur l'eau !");
            }
        }
    }
});

// Double Clic : Expansion territoriale du joueur
window.addEventListener('dblclick', function(event) {
    event.preventDefault(); 
    if (gameState !== 'PLAYING' || !playerStats.alive) return;
    if (event.target.closest && (event.target.closest('#ui-container') || event.target.closest('#action-menu'))) return;

    let troopsSent = Math.floor(playerStats.pop * (troopPercentage / 100));
    if (troopsSent <= 0) return;

    playerStats.pop -= troopsSent;
    let pixelsToClaim = Math.max(1, Math.floor(Math.sqrt(troopsSent) * 1.8));
    expandFactionTerritory(0, pixelsToClaim);
    updateHUD();
});

// Clic Droit : Menu d'actions ou ordres
window.addEventListener('contextmenu', function(event) {
    event.preventDefault(); 
    if (gameState !== 'PLAYING') return;
    if (event.target.closest && (event.target.closest('#ui-container') || event.target.closest('#action-menu') || event.target.closest('.settings-btn-wrapper'))) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.gameCamera);

    const intersects = raycaster.intersectObject(window.gameEarth);
    if (intersects.length > 0) {
        const hit = intersects[0];
        buildTargetPosition = hit.point;
        let gx = Math.floor(hit.uv.x * SIM_W);
        let gy = Math.floor((1 - hit.uv.y) * SIM_H);
        let terrainType = isWaterPixel(gx, gy) ? 'Eau' : 'Terre';
        openActionMenu(event.clientX, event.clientY, null, terrainType);
    } else {
        closeActionMenu();
    }
});

// --- 10. MENU D'ACTION & BÂTIMENTS ---
window.openActionMenu = function(mouseX, mouseY, entity = null, terrainType = null) {
    const menu = document.getElementById('action-menu'); 
    const header = document.getElementById('action-title'); 
    const subheader = document.getElementById('action-subtitle'); 
    const buildOptions = document.getElementById('build-options'); 
    const commandOptions = document.getElementById('command-options');
    
    menu.style.left = mouseX + 'px'; 
    menu.style.top = mouseY + 'px'; 
    menu.style.display = 'flex';

    buildOptions.style.display = 'flex'; 
    buildOptions.style.flexDirection = 'column'; 
    commandOptions.style.display = 'none';

    if (terrainType === 'Eau') { 
        header.innerText = "🌊 ZONE MARITIME"; 
        header.style.color = "#00f0ff"; 
        subheader.innerText = "Construction navale"; 
        document.getElementById('btn-city').disabled = true; 
        document.getElementById('btn-missile').disabled = true; 
        document.getElementById('btn-anti-missile').disabled = true; 
        document.getElementById('btn-port').disabled = false; 
    } else { 
        header.innerText = "⛰️ ZONE TERRESTRE"; 
        header.style.color = "#39ff14"; 
        subheader.innerText = "Déploiement terrestre"; 
        document.getElementById('btn-city').disabled = false; 
        document.getElementById('btn-missile').disabled = false; 
        document.getElementById('btn-anti-missile').disabled = false; 
        document.getElementById('btn-port').disabled = true; 
    }
}

window.closeActionMenu = function() { 
    document.getElementById('action-menu').style.display = 'none'; 
}

window.executeAction = function(action) {
    closeActionMenu();
    if (!buildTargetPosition) return;
    
    let cost = 0; 
    let type = action.replace('build_', '');
    if (type === 'city') cost = 500; 
    if (type === 'port') cost = 800; 
    if (type === 'missile') cost = 2000; 
    if (type === 'anti_missile') cost = 1500;

    if (playerStats.gold < cost) { 
        alert("Fonds insuffisants ! Il te faut " + cost + " Or."); 
        return; 
    }
    
    playerStats.gold -= cost; 
    updateHUD();

    let color = 0x00f0ff;
    let geometry;
    if (type === 'city') geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    else if (type === 'port') geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    else if (type === 'missile') { geometry = new THREE.ConeGeometry(0.08, 0.35, 8); color = 0xff007f; }
    else if (type === 'anti_missile') { geometry = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI*2, 0, Math.PI/2); color = 0x39ff14; }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);
    structure.position.copy(buildTargetPosition);
    structure.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), buildTargetPosition.clone().normalize());
    
    if (type === 'missile') structure.translateY(0.15);
    
    window.gameScene.add(structure);
    entities.push({ type: type, owner: 'player', mesh: structure, factionId: 0 });
}

window.updateTroopVal = function(val) { 
    troopPercentage = val; 
    let elem = document.getElementById('troop-val'); 
    if(elem) elem.innerText = val + "%"; 
}
