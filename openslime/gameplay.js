// =========================================================
// LOGIQUE DE JEU - OPEN FRONT
// =========================================================

let troopPercentage = 50;
let buildTargetPosition = null; 
let buildTargetTerrain = null; 
let gameState = 'MENU'; 
let spawnCountdown = 10;
let aiMode = 'dumb_bots'; 
let myCapitalPlaced = false;

let entities = []; 
let selectedEntity = null; 
let actionState = 'NORMAL'; 

// --- 1. GESTION DES PARAMETRES ET DU CYCLE D'IMAGES (TON CODE) ---
const settingImages = ['../img/setting.png', '../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let currentSettingIndex = 0;

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');

    currentSettingIndex = (currentSettingIndex + 1) % settingImages.length;
    document.getElementById('settings-btn-img').src = settingImages[currentSettingIndex];
}
window.toggleSettings = toggleSettings; // Expose la fonction globalement

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}
window.toggleTheme = toggleTheme;

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}
window.toggleFullscreen = toggleFullscreen;

document.addEventListener('fullscreenchange', () => {
    const fsToggle = document.getElementById('fs-toggle');
    if (fsToggle) fsToggle.checked = !!document.fullscreenElement;
});

// Redimensionnement propre
function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    let btnClassic = document.getElementById('btn-sz-classic');
    let btnWide = document.getElementById('btn-sz-wide');
    
    if (size === 'classic') { container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } 
    else if (size === 'wide') { container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } 
    
    if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); }
}
window.setGameSize = setGameSize;

// --- 2. DÉTECTION DU TERRAIN (MAP NOIRE) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();

// Le Radar invisible utilise ton image à fond noir
terrainImg.src = 'assets/map_globe_terreste.png'; 

terrainImg.onload = () => {
    terrainCanvas.width = terrainImg.width;
    terrainCanvas.height = terrainImg.height;
    terrainCtx.drawImage(terrainImg, 0, 0);
};

// Si le pixel est presque noir, c'est l'eau !
function isWater(r, g, b) {
    if (r < 20 && g < 20 && b < 20) return true; 
    return false; 
}

// --- 3. MENUS ET RÉSEAU ---
function openMenu(menuId) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('network-menu').style.display = 'none';

    if(menuId !== 'main') document.getElementById(menuId + '-menu').style.display = 'flex';
    else document.getElementById('main-menu').style.display = 'flex';
}
window.openMenu = openMenu;

function joinNetworkGame() {
    let input = document.getElementById('ops-input').value.toUpperCase();
    let errorMsg = document.getElementById('network-error');
    let regex = /^OPS\d{4}$/;
    if(regex.test(input)) {
        errorMsg.innerText = "Connexion au serveur " + input + "...";
        errorMsg.style.color = "#39ff14";
        setTimeout(() => { alert("Le multijoueur est en développement !"); errorMsg.innerText = ""; }, 1000);
    } else {
        errorMsg.style.color = "#ff007f";
        errorMsg.innerText = "Code invalide. Format requis : OPS + 4 chiffres.";
    }
}
window.joinNetworkGame = joinNetworkGame;

// --- 4. LANCEMENT DU JEU ET CHRONO ---
function startGame(mode) {
    aiMode = mode;
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('ui-container').style.display = 'flex';
    document.getElementById('spawn-timer-container').style.display = 'block';
    
    gameState = 'SPAWNING';
    myCapitalPlaced = false;
    spawnCountdown = 10;
    document.getElementById('spawn-timer').innerText = spawnCountdown;
    document.getElementById('game-phase-text').innerText = "CHOIX DU SPAWN";

    let timerInterval = setInterval(() => {
        spawnCountdown--;
        document.getElementById('spawn-timer').innerText = spawnCountdown;

        if (spawnCountdown <= 0) {
            clearInterval(timerInterval);
            finishSpawningPhase();
        }
    }, 1000);
}
window.startGame = startGame;

function finishSpawningPhase() {
    gameState = 'PLAYING';
    document.getElementById('spawn-timer-container').style.display = 'none';
    document.getElementById('game-phase-text').innerText = "EXPANSION (Guerre)";
    if (!myCapitalPlaced) alert("Temps écoulé ! La partie commence.");
}

// --- 5. RAYCASTING 3D ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const container3D = document.getElementById('webgl-container');

function onMouseClick(event) {
    if (gameState === 'MENU') return;
    if (event.target.closest('#ui-container') || event.target.closest('#action-menu') || event.target.closest('.settings-btn-wrapper')) return;

    const rect = container3D.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, window.gameCamera);
    
    const entityMeshes = entities.map(e => e.mesh);
    const entityIntersects = raycaster.intersectObjects(entityMeshes);

    if (entityIntersects.length > 0 && actionState === 'NORMAL' && gameState === 'PLAYING') {
        const hitEntityMesh = entityIntersects[0].object;
        const clickedEntity = entities.find(e => e.mesh === hitEntityMesh);
        if(clickedEntity && clickedEntity.owner === 'player') {
            openActionMenu(event.clientX, event.clientY, clickedEntity, null);
            return; 
        }
    }

    if (actionState === 'TARGETING_ICBM' && selectedEntity) {
        const earthIntersects = raycaster.intersectObject(window.gameEarth);
        if(earthIntersects.length > 0) {
            launchMissile(selectedEntity, earthIntersects[0].point);
            actionState = 'NORMAL';
            selectedEntity = null;
            return;
        }
    }

    if (actionState === 'TARGETING_ROUTE' && selectedEntity) {
        const earthIntersects = raycaster.intersectObject(window.gameEarth);
        if(earthIntersects.length > 0) {
            createSeaRoute(selectedEntity.mesh.position, earthIntersects[0].point);
            actionState = 'NORMAL';
            selectedEntity = null;
            return;
        }
    }

    const intersects = raycaster.intersectObject(window.gameEarth);

    if (intersects.length > 0) {
        const hit = intersects[0];
        buildTargetPosition = hit.point; 
        
        if (hit.uv && terrainImg.complete) {
            let px = Math.floor(hit.uv.x * terrainCanvas.width);
            let py = Math.floor((1 - hit.uv.y) * terrainCanvas.height); 
            let pixel = terrainCtx.getImageData(px, py, 1, 1).data;
            let terrainType = isWater(pixel[0], pixel[1], pixel[2]) ? 'Eau' : 'Terre';
            buildTargetTerrain = terrainType;

            if (gameState === 'SPAWNING') {
                if (terrainType === 'Terre' && !myCapitalPlaced) {
                    executeAction('build_city', true); 
                    myCapitalPlaced = true;
                    document.getElementById('spawn-timer-container').querySelector('h2').innerText = "CAPITALE PLACÉE !";
                    document.getElementById('spawn-timer-container').querySelector('p').innerText = "En attente des autres joueurs...";
                }
            } else if (gameState === 'PLAYING') {
                openActionMenu(event.clientX, event.clientY, null, terrainType);
            }
        }
    } else {
        closeActionMenu(); 
    }
}
container3D.addEventListener('click', onMouseClick);


// --- 6. ACTION ET CONSTRUCTION ---
function openActionMenu(mouseX, mouseY, entity = null, terrainType = null) {
    const menu = document.getElementById('action-menu');
    const header = document.getElementById('action-title');
    const subheader = document.getElementById('action-subtitle');
    const buildOptions = document.getElementById('build-options');
    const commandOptions = document.getElementById('command-options');
    
    menu.style.left = mouseX + 'px';
    menu.style.top = mouseY + 'px';
    menu.style.display = 'flex';

    if (entity) {
        buildOptions.style.display = 'none';
        commandOptions.style.display = 'flex';
        commandOptions.style.flexDirection = 'column';
        selectedEntity = entity;

        if (entity.type === 'missile') {
            header.innerText = "🚀 SILO NUCLÉAIRE"; header.style.color = "#ff007f"; subheader.innerText = "En attente d'ordres";
            document.getElementById('btn-launch-icbm').style.display = 'block'; document.getElementById('btn-establish-route').style.display = 'none';
        } else if (entity.type === 'port') {
            header.innerText = "⚓ PORT MILITAIRE"; header.style.color = "#00f0ff"; subheader.innerText = "Gestion flotte navale";
            document.getElementById('btn-launch-icbm').style.display = 'none'; document.getElementById('btn-establish-route').style.display = 'block';
        } else {
            closeActionMenu(); 
        }
    } else {
        buildOptions.style.display = 'flex';
        buildOptions.style.flexDirection = 'column';
        commandOptions.style.display = 'none';

        if (terrainType === 'Eau') {
            header.innerText = "🌊 ZONE MARITIME"; header.style.color = "#00f0ff"; subheader.innerText = "Construction navale";
            document.getElementById('btn-city').disabled = true; document.getElementById('btn-missile').disabled = true; document.getElementById('btn-anti-missile').disabled = true; document.getElementById('btn-port').disabled = false; 
        } else {
            header.innerText = "⛰️ ZONE TERRESTRE"; header.style.color = "#39ff14"; subheader.innerText = "Déploiement terrestre";
            document.getElementById('btn-city').disabled = false; document.getElementById('btn-missile').disabled = false; document.getElementById('btn-anti-missile').disabled = false; document.getElementById('btn-port').disabled = true; 
        }
    }
}
window.openActionMenu = openActionMenu;

function closeActionMenu() {
    document.getElementById('action-menu').style.display = 'none';
    if(actionState === 'NORMAL') selectedEntity = null; 
}
window.closeActionMenu = closeActionMenu;

function executeAction(action, isCapital = false) {
    closeActionMenu();
    if (action === 'launch_icbm') { actionState = 'TARGETING_ICBM'; return; }
    if (action === 'establish_route') { actionState = 'TARGETING_ROUTE'; return; }
    if (!buildTargetPosition) return;
    
    let type = action.replace('build_', '');
    let color, geometry;

    if (type === 'city') { geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25); color = isCapital ? 0xffbf00 : 0x00f0ff; if(isCapital) geometry.scale(1.5, 1.5, 1.5); } 
    else if (type === 'port') { geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16); color = 0x00f0ff; } 
    else if (type === 'missile') { geometry = new THREE.ConeGeometry(0.08, 0.35, 8); color = 0xff007f; } 
    else if (type === 'anti_missile') { geometry = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI*2, 0, Math.PI/2); color = 0x39ff14; }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);
    structure.position.copy(buildTargetPosition);
    structure.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), buildTargetPosition.clone().normalize());
    if(type === 'missile') structure.translateY(0.15);
    window.gameScene.add(structure);
    entities.push({ type: type, owner: 'player', mesh: structure });
}
window.executeAction = executeAction;


// --- 7. ANIMATIONS (MISSILES & ROUTES) ---
function launchMissile(siloEntity, targetPos) {
    const missileGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const missileMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const missile = new THREE.Mesh(missileGeo, missileMat);
    missile.position.copy(siloEntity.mesh.position);
    window.gameScene.add(missile);

    const start = siloEntity.mesh.position.clone();
    const end = targetPos.clone();
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(5 + start.distanceTo(end) * 0.5);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(60); 
    
    let index = 0;
    function animateMissile() {
        if (index < points.length) {
            missile.position.copy(points[index]);
            if(index < points.length - 1) missile.lookAt(points[index+1]);
            missile.rotateX(Math.PI / 2);
            index++;
            requestAnimationFrame(animateMissile);
        } else {
            window.gameScene.remove(missile);
            createExplosion(end);
        }
    }
    animateMissile();
}

function createExplosion(pos) {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const explosion = new THREE.Mesh(geo, mat);
    explosion.position.copy(pos);
    window.gameScene.add(explosion);

    let scale = 1;
    function animateBoom() {
        scale += 0.1;
        explosion.scale.set(scale, scale, scale);
        mat.opacity -= 0.05;
        if (mat.opacity > 0) requestAnimationFrame(animateBoom);
        else window.gameScene.remove(explosion);
    }
    animateBoom();
}

function createSeaRoute(startPos, endPos) {
    const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(5.05); 
    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ color: 0x00f0ff, linewidth: 2, scale: 1, dashSize: 0.2, gapSize: 0.1 });
    const route = new THREE.Line(geometry, material);
    route.computeLineDistances(); 
    window.gameScene.add(route);
}

window.updateTroopVal = function(val) {
    troopPercentage = val;
    let elem = document.getElementById('troop-val');
    if(elem) elem.innerText = val + "%";
}
