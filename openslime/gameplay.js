// =========================================================
// LOGIQUE DE JEU - OPEN FRONT
// =========================================================

let troopPercentage = 50;
let buildTargetPosition = null; 
let buildTargetTerrain = null; 
let gameState = 'MENU'; // 'MENU', 'SPAWNING', 'PLAYING'
let spawnCountdown = 10;
let aiMode = 'dumb_bots'; 
let myCapitalPlaced = false;

// --- SYSTÈME D'ENTITÉS (Gère les bâtiments posés) ---
let entities = []; 
let selectedEntity = null; // Bâtiment sélectionné par le joueur
let actionState = 'NORMAL'; // 'NORMAL', 'TARGETING_ICBM', 'TARGETING_ROUTE'

// --- 1. DÉTECTION DU TERRAIN (RADAR AVEC MAP SUR FOND NOIR) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();
// IMPORTANT : On utilise ton image à fond noir pour lire les collisions
terrainImg.src = 'assets/map_radar.jpg'; 

terrainImg.onload = () => {
    terrainCanvas.width = terrainImg.width;
    terrainCanvas.height = terrainImg.height;
    terrainCtx.drawImage(terrainImg, 0, 0);
    console.log("Radar de collision (fond noir) activé !");
};

// Lecture précise : Noir = Eau. Le reste = Terre.
function isWater(r, g, b) {
    if (r < 15 && g < 15 && b < 15) return true;
    return false;
}


// --- 2. GESTION DES MENUS ET DU RÉSEAU ---
function openMenu(menuId) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('network-menu').style.display = 'none';

    if(menuId !== 'main') document.getElementById(menuId + '-menu').style.display = 'flex';
    else document.getElementById('main-menu').style.display = 'flex';
}

function joinNetworkGame() {
    let input = document.getElementById('ops-input').value.toUpperCase();
    let errorMsg = document.getElementById('network-error');
    
    let regex = /^OPS\d{4}$/;
    if(regex.test(input)) {
        errorMsg.innerText = "Connexion au serveur " + input + "...";
        errorMsg.style.color = "#39ff14";
        setTimeout(() => { alert("Le multijoueur est en cours de développement !"); errorMsg.innerText = ""; }, 1000);
    } else {
        errorMsg.style.color = "#ff007f";
        errorMsg.innerText = "Code invalide. Format requis : OPS suivi de 4 chiffres.";
    }
}

// --- 3. LANCEMENT DU JEU ET CHRONO (10 SECONDES) ---
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

function finishSpawningPhase() {
    gameState = 'PLAYING';
    document.getElementById('spawn-timer-container').style.display = 'none';
    document.getElementById('game-phase-text').innerText = "EXPANSION (Guerre)";
    
    if (!myCapitalPlaced) {
        alert("Temps écoulé ! Placement aléatoire en cours...");
    }
    console.log(`Le jeu commence ! IA paramétrée sur : ${aiMode}`);
}


// --- 4. RAYCASTING (CLIC SUR LE GLOBE OU BÂTIMENT EN 3D) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const container3D = document.getElementById('webgl-container');

function onMouseClick(event) {
    if (gameState === 'MENU') return;
    if (event.target.closest('#ui-container') || event.target.closest('#action-menu')) return;

    const rect = container3D.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    
    // Étape A: Vérifier si on clique sur un BÂTIMENT existant
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

    // Étape B: Gérer les modes de CIBLAGE (Tir missile ou Route)
    if (actionState === 'TARGETING_ICBM' && selectedEntity) {
        const earthIntersects = raycaster.intersectObject(window.earth);
        if(earthIntersects.length > 0) {
            launchMissile(selectedEntity, earthIntersects[0].point);
            actionState = 'NORMAL';
            selectedEntity = null;
            return;
        }
    }

    if (actionState === 'TARGETING_ROUTE' && selectedEntity) {
        const earthIntersects = raycaster.intersectObject(window.earth);
        if(earthIntersects.length > 0) {
            createSeaRoute(selectedEntity.mesh.position, earthIntersects[0].point);
            actionState = 'NORMAL';
            selectedEntity = null;
            return;
        }
    }

    // Étape C: Sinon, on clique sur la Terre pour CONSTRUIRE
    const intersects = raycaster.intersectObject(window.earth);

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
                } else if (terrainType === 'Eau') {
                    console.log("Tu ne peux pas poser ta capitale dans l'eau !");
                }
            } 
            else if (gameState === 'PLAYING') {
                openActionMenu(event.clientX, event.clientY, null, terrainType);
            }
        }
    } else {
        closeActionMenu(); 
    }
}

container3D.addEventListener('click', onMouseClick);


// --- 5. GESTION DU MENU D'ACTION (CONSTRUCTION & ORDRES) ---
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
        // Mode : Action sur bâtiment existant
        buildOptions.style.display = 'none';
        commandOptions.style.display = 'flex';
        commandOptions.style.flexDirection = 'column';
        selectedEntity = entity;

        if (entity.type === 'missile') {
            header.innerText = "🚀 SILO NUCLÉAIRE";
            header.style.color = "#ff007f";
            subheader.innerText = "En attente d'ordres de tir";
            document.getElementById('btn-launch-icbm').style.display = 'block';
            document.getElementById('btn-establish-route').style.display = 'none';
        } else if (entity.type === 'port') {
            header.innerText = "⚓ PORT MILITAIRE";
            header.style.color = "#00f0ff";
            subheader.innerText = "Gestion de la flotte navale";
            document.getElementById('btn-launch-icbm').style.display = 'none';
            document.getElementById('btn-establish-route').style.display = 'block';
        } else {
            closeActionMenu(); 
        }
    } else {
        // Mode : Construction sur terrain vide
        buildOptions.style.display = 'flex';
        buildOptions.style.flexDirection = 'column';
        commandOptions.style.display = 'none';

        if (terrainType === 'Eau') {
            header.innerText = "🌊 ZONE MARITIME";
            header.style.color = "#00f0ff";
            subheader.innerText = "Construction navale disponible";
            document.getElementById('btn-city').disabled = true; 
            document.getElementById('btn-missile').disabled = true; 
            document.getElementById('btn-anti-missile').disabled = true;
            document.getElementById('btn-port').disabled = false; 
        } else {
            header.innerText = "⛰️ ZONE TERRESTRE";
            header.style.color = "#39ff14";
            subheader.innerText = "Déploiement terrestre disponible";
            document.getElementById('btn-city').disabled = false;
            document.getElementById('btn-missile').disabled = false;
            document.getElementById('btn-anti-missile').disabled = false;
            document.getElementById('btn-port').disabled = true; 
        }
    }
}

function closeActionMenu() {
    document.getElementById('action-menu').style.display = 'none';
    if(actionState === 'NORMAL') selectedEntity = null; 
}

function executeAction(action, isCapital = false) {
    closeActionMenu();

    // 1. Ordres sur Bâtiments
    if (action === 'launch_icbm') {
        actionState = 'TARGETING_ICBM';
        console.log("MODE CIBLAGE ACTIVÉ : Cliquez sur la cible sur le globe !");
        return;
    }
    if (action === 'establish_route') {
        actionState = 'TARGETING_ROUTE';
        console.log("MODE ROUTE ACTIVÉ : Cliquez sur la destination maritime !");
        return;
    }

    // 2. Constructions
    if (!buildTargetPosition) return;
    let type = action.replace('build_', '');
    let color, geometry;

    if (type === 'city') {
        geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25); 
        color = isCapital ? 0xffbf00 : 0x00f0ff; 
        if(isCapital) geometry.scale(1.5, 1.5, 1.5); 
    } else if (type === 'port') {
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16); 
        color = 0x00f0ff; 
    } else if (type === 'missile') {
        geometry = new THREE.ConeGeometry(0.08, 0.35, 8); 
        color = 0xff007f; 
    } else if (type === 'anti_missile') { 
        geometry = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI*2, 0, Math.PI/2); 
        color = 0x39ff14; 
    }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);

    structure.position.copy(buildTargetPosition);
    structure.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), buildTargetPosition.clone().normalize());

    if(type === 'missile') structure.translateY(0.15);
    
    window.scene.add(structure);

    // Enregistrement de l'entité
    entities.push({
        type: type,
        owner: 'player', 
        mesh: structure
    });
}

// --- 6. LOGIQUE D'ANIMATION (MISSILES & ROUTES) ---

function launchMissile(siloEntity, targetPos) {
    console.log("LANCEMENT ICBM DÉTECTÉ !");
    
    const missileGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const missileMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const missile = new THREE.Mesh(missileGeo, missileMat);
    missile.position.copy(siloEntity.mesh.position);
    window.scene.add(missile);

    const start = siloEntity.mesh.position.clone();
    const end = targetPos.clone();
    
    // Courbe balistique
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(5 + start.distanceTo(end) * 0.5);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(60); // Nombre de frames du vol
    
    let index = 0;
    function animateMissile() {
        if (index < points.length) {
            missile.position.copy(points[index]);
            if(index < points.length - 1) missile.lookAt(points[index+1]);
            
            // Corriger l'orientation du cylindre (le haut vers l'avant)
            missile.rotateX(Math.PI / 2);
            
            index++;
            requestAnimationFrame(animateMissile);
        } else {
            // Explosion à l'impact
            window.scene.remove(missile);
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
    window.scene.add(explosion);

    let scale = 1;
    function animateBoom() {
        scale += 0.1;
        explosion.scale.set(scale, scale, scale);
        mat.opacity -= 0.05;
        if (mat.opacity > 0) requestAnimationFrame(animateBoom);
        else window.scene.remove(explosion);
    }
    animateBoom();
}

function createSeaRoute(startPos, endPos) {
    // Courbe maritime qui suit la surface (+ 0.05 pour ne pas clipser dans la Terre)
    const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(5.05); 
    
    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
    const points = curve.getPoints(50);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ 
        color: 0x00f0ff, 
        linewidth: 2, 
        scale: 1, 
        dashSize: 0.2, 
        gapSize: 0.1 
    });
    
    const route = new THREE.Line(geometry, material);
    route.computeLineDistances(); 
    window.scene.add(route);
}


// --- 7. UI GLOBALE ET PARAMÈTRES ---
function updateTroopVal(val) {
    troopPercentage = val;
    let troopValElem = document.getElementById('troop-val');
    if(troopValElem) troopValElem.innerText = val + "%";
}

const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;
function startSettingsAnim() { if (hoverInterval) return; currentFrame = 0; if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame]; hoverInterval = setInterval(() => { currentFrame = (currentFrame + 1) % animFrames.length; if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame]; }, 100); }
function stopSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) { settingsBtnImg.src = '../img/setting.png'; } }
function clickSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png'; toggleSettings(); setTimeout(() => { if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; }, 300); }
function toggleSettings() { let modal = document.getElementById('settings-modal'); if (modal) modal.classList.toggle('show'); }
function setGameSize(size) { const container = document.getElementById('game-container'); if (!container) return; document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active')); container.classList.remove('size-classic', 'size-wide', 'size-full'); let btnClassic = document.getElementById('btn-sz-classic'); let btnWide = document.getElementById('btn-sz-wide'); let btnFull = document.getElementById('btn-sz-full'); if (size === 'classic') { container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } else if (size === 'wide') { container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } else if (size === 'full') { container.classList.add('size-full'); if(btnFull) btnFull.classList.add('active'); if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); } if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); } }
document.addEventListener('fullscreenchange', () => { const container = document.getElementById('game-container'); if (!document.fullscreenElement && container && container.classList.contains('size-full')) { setGameSize('wide'); } });
