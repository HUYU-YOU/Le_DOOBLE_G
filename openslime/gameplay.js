// =========================================================
// LOGIQUE DE JEU - OPEN FRONT
// =========================================================

let troopPercentage = 50;
let buildTargetPosition = null; 
let buildTargetUV = null; // On a besoin des UV pour peindre la carte
let buildTargetTerrain = null; 
let gameState = 'MENU'; 
let spawnCountdown = 10;
let aiMode = 'dumb_bots'; 
let myCapitalPlaced = false;

let entities = []; 
let selectedEntity = null; 
let actionState = 'NORMAL'; 

// --- NOUVEAU : SYSTÈME D'ÉCONOMIE ET DE TERRITOIRE ---
let playerStats = {
    pop: 10,        // Troupes de départ
    maxPop: 100,    // Capacité max de base
    gold: 0,
    territory: 1    // Multiplicateur de puissance
};

// Création du Calque de Peinture (Overlay) pour le globe !
const overlayCanvas = document.createElement('canvas');
overlayCanvas.width = 2048;
overlayCanvas.height = 1024;
const overlayCtx = overlayCanvas.getContext('2d');
let overlayTexture;

// --- 1. GESTION DES PARAMETRES ---
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;
function startSettingsAnim() { if (hoverInterval) return; currentFrame = 0; const btn = document.getElementById('settings-btn-img'); if(btn) btn.src = animFrames[currentFrame]; hoverInterval = setInterval(() => { currentFrame = (currentFrame + 1) % animFrames.length; if(btn) btn.src = animFrames[currentFrame]; }, 100); }
function stopSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; const btn = document.getElementById('settings-btn-img'); if (btn && !btn.src.includes('settings4.png')) { btn.src = '../img/setting.png'; } }
function clickSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; const btn = document.getElementById('settings-btn-img'); if(btn) btn.src = '../img/settings4.png'; toggleSettings(); setTimeout(() => { if(btn) btn.src = '../img/setting.png'; }, 300); }
window.toggleSettings = function() { document.getElementById('settings-modal').classList.toggle('show'); }
window.toggleTheme = function() { document.body.classList.toggle('dark-mode'); }
window.toggleFullscreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.log(err)); } else { if (document.exitFullscreen) document.exitFullscreen(); } }
window.setGameSize = function(size) { const container = document.getElementById('game-container'); if (!container) return; document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active')); container.classList.remove('size-classic', 'size-wide', 'size-full'); let btnClassic = document.getElementById('btn-sz-classic'); let btnWide = document.getElementById('btn-sz-wide'); if (size === 'classic') { container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } else if (size === 'wide') { container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); } }

// --- 2. DÉTECTION DU TERRAIN (MAP NOIRE) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();
terrainImg.src = 'assets/map_globe_terreste.png'; 
terrainImg.onload = () => {
    terrainCanvas.width = terrainImg.width;
    terrainCanvas.height = terrainImg.height;
    terrainCtx.drawImage(terrainImg, 0, 0);
};
function isWater(r, g, b) { return (r < 20 && g < 20 && b < 20); }

// --- 3. MENUS ET RÉSEAU ---
window.openMenu = function(menuId) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('network-menu').style.display = 'none';
    if(menuId !== 'main') document.getElementById(menuId + '-menu').style.display = 'flex';
    else document.getElementById('main-menu').style.display = 'flex';
}
window.joinNetworkGame = function() {
    let input = document.getElementById('ops-input').value.toUpperCase();
    if(/^OPS\d{4}$/.test(input)) { document.getElementById('network-error').innerText = "Connexion..."; setTimeout(() => { alert("Multijoueur en dev !"); }, 1000); } 
    else { document.getElementById('network-error').innerText = "Format requis : OPS + 4 chiffres."; }
}

// --- 4. LANCEMENT DU JEU ET CHRONO ---
window.startGame = function(mode) {
    aiMode = mode;
    document.getElementById('local-menu').style.display = 'none';
    document.getElementById('ui-container').style.display = 'flex';
    document.getElementById('spawn-timer-container').style.display = 'block';
    
    gameState = 'SPAWNING';
    myCapitalPlaced = false;
    spawnCountdown = 10;
    document.getElementById('spawn-timer').innerText = spawnCountdown;

    // Initialisation de la surcouche (Overlay) de couleur sur le globe
    if(!overlayTexture && window.scene) {
        overlayTexture = new THREE.CanvasTexture(overlayCanvas);
        const overlayGeo = new THREE.SphereGeometry(5.02, 64, 64); // Juste au dessus de la Terre
        const overlayMat = new THREE.MeshBasicMaterial({ map: overlayTexture, transparent: true, opacity: 0.65 });
        const overlaySphere = new THREE.Mesh(overlayGeo, overlayMat);
        window.scene.add(overlaySphere);
    }

    let timerInterval = setInterval(() => {
        spawnCountdown--;
        document.getElementById('spawn-timer').innerText = spawnCountdown;
        if (spawnCountdown <= 0) { clearInterval(timerInterval); finishSpawningPhase(); }
    }, 1000);
}

function finishSpawningPhase() {
    gameState = 'PLAYING';
    document.getElementById('spawn-timer-container').style.display = 'none';
    document.getElementById('game-phase-text').innerText = "EXPANSION (Guerre)";
    
    if (!myCapitalPlaced) alert("Temps écoulé ! La partie commence.");

    // NOUVEAU : LA BOUCLE ÉCONOMIQUE (Chaque seconde)
    setInterval(() => {
        if(gameState === 'PLAYING' && myCapitalPlaced) {
            // Plus on a de peuple, plus on en produit (max 10% par seconde)
            let popGrowth = Math.max(1, Math.floor(playerStats.pop * 0.05));
            
            playerStats.pop += popGrowth;
            if(playerStats.pop > playerStats.maxPop) playerStats.pop = playerStats.maxPop; // Capacité max

            // Or généré en fonction du territoire
            playerStats.gold += Math.floor(playerStats.territory * 2);

            updateHUD();
        }
    }, 1000);
}

function updateHUD() {
    document.getElementById('ui-pop').innerText = Math.floor(playerStats.pop);
    document.getElementById('ui-max-pop').innerText = "/ " + playerStats.maxPop;
    document.getElementById('ui-ter').innerText = playerStats.territory;
    document.getElementById('ui-gold').innerText = playerStats.gold;
}

// --- 5. RAYCASTING 3D ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (gameState === 'MENU') return;
    if (event.target.closest('#ui-container') || event.target.closest('#action-menu') || event.target.closest('.settings-btn-wrapper')) return;

    const container3D = document.getElementById('webgl-container');
    const rect = container3D.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    
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
        const earthIntersects = raycaster.intersectObject(window.earth);
        if(earthIntersects.length > 0) {
            launchMissile(selectedEntity, earthIntersects[0].point);
            actionState = 'NORMAL'; selectedEntity = null; return;
        }
    }

    if (actionState === 'TARGETING_ROUTE' && selectedEntity) {
        const earthIntersects = raycaster.intersectObject(window.earth);
        if(earthIntersects.length > 0) {
            createSeaRoute(selectedEntity.mesh.position, earthIntersects[0].point);
            actionState = 'NORMAL'; selectedEntity = null; return;
        }
    }

    const intersects = raycaster.intersectObject(window.earth);

    if (intersects.length > 0) {
        const hit = intersects[0];
        buildTargetPosition = hit.point; 
        buildTargetUV = hit.uv; // Sauvegarde pour la peinture du territoire
        
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
                    // Boost initial du joueur
                    playerStats.pop = 500; 
                    playerStats.maxPop = 1000;
                    playerStats.gold = 500;
                    updateHUD();
                    
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
document.getElementById('webgl-container').addEventListener('click', onMouseClick);


// --- 6. ACTION ET CONSTRUCTION ---
window.openActionMenu = function(mouseX, mouseY, entity = null, terrainType = null) {
    const menu = document.getElementById('action-menu');
    const header = document.getElementById('action-title');
    const subheader = document.getElementById('action-subtitle');
    const buildOptions = document.getElementById('build-options');
    const commandOptions = document.getElementById('command-options');
    
    menu.style.left = mouseX + 'px'; menu.style.top = mouseY + 'px'; menu.style.display = 'flex';

    if (entity) {
        buildOptions.style.display = 'none'; commandOptions.style.display = 'flex'; commandOptions.style.flexDirection = 'column';
        selectedEntity = entity;
        if (entity.type === 'missile') {
            header.innerText = "🚀 SILO NUCLÉAIRE"; header.style.color = "#ff007f"; subheader.innerText = "En attente d'ordres";
            document.getElementById('btn-launch-icbm').style.display = 'block'; document.getElementById('btn-establish-route').style.display = 'none';
        } else if (entity.type === 'port') {
            header.innerText = "⚓ PORT MILITAIRE"; header.style.color = "#00f0ff"; subheader.innerText = "Gestion flotte navale";
            document.getElementById('btn-launch-icbm').style.display = 'none'; document.getElementById('btn-establish-route').style.display = 'block';
        } else { closeActionMenu(); }
    } else {
        buildOptions.style.display = 'flex'; buildOptions.style.flexDirection = 'column'; commandOptions.style.display = 'none';

        if (terrainType === 'Eau') {
            header.innerText = "🌊 ZONE MARITIME"; header.style.color = "#00f0ff"; subheader.innerText = "Construction navale";
            document.getElementById('btn-expand').disabled = true; // Pas d'expansion de territoire dans l'eau
            document.getElementById('btn-city').disabled = true; document.getElementById('btn-missile').disabled = true; document.getElementById('btn-anti-missile').disabled = true; document.getElementById('btn-port').disabled = false; 
        } else {
            header.innerText = "⛰️ ZONE TERRESTRE"; header.style.color = "#39ff14"; subheader.innerText = "Déploiement terrestre";
            document.getElementById('btn-expand').disabled = false;
            document.getElementById('btn-city').disabled = false; document.getElementById('btn-missile').disabled = false; document.getElementById('btn-anti-missile').disabled = false; document.getElementById('btn-port').disabled = true; 
        }
    }
}

window.closeActionMenu = function() {
    document.getElementById('action-menu').style.display = 'none';
    if(actionState === 'NORMAL') selectedEntity = null; 
}

window.executeAction = function(action, isCapital = false) {
    closeActionMenu();

    if (action === 'launch_icbm') { actionState = 'TARGETING_ICBM'; return; }
    if (action === 'establish_route') { actionState = 'TARGETING_ROUTE'; return; }
    
    // NOUVEAU : LOGIQUE D'EXPANSION TERRITORIALE !
    if (action === 'expand') {
        if (!buildTargetUV) return;
        
        let troopsSent = Math.floor(playerStats.pop * (troopPercentage / 100));
        if(troopsSent <= 0) return;
        
        playerStats.pop -= troopsSent; // On dépense les troupes
        
        // On peint sur la carte !
        let px = buildTargetUV.x * overlayCanvas.width;
        let py = (1 - buildTargetUV.y) * overlayCanvas.height;
        let radius = Math.max(5, Math.sqrt(troopsSent) * 1.5); // La taille de la tache dépend des troupes
        
        overlayCtx.beginPath();
        overlayCtx.arc(px, py, radius, 0, Math.PI * 2);
        overlayCtx.fillStyle = 'rgba(0, 240, 255, 1)'; // Cyan pour le joueur 1
        overlayCtx.shadowBlur = 15;
        overlayCtx.shadowColor = '#00f0ff';
        overlayCtx.fill();
        overlayTexture.needsUpdate = true; // Demande à la 3D de rafraichir !

        // On gagne du territoire ! (+ de max pop, + d'or généré)
        let gainedTerritory = Math.floor(radius);
        playerStats.territory += gainedTerritory;
        playerStats.maxPop += (gainedTerritory * 20); // Plus on a de place, plus on peut loger de monde
        
        updateHUD();
        return;
    }

    if (!buildTargetPosition) return;
    
    // VÉRIFICATION DES PRIX EN OR
    let cost = 0;
    let type = action.replace('build_', '');
    if (type === 'city') cost = 500;
    if (type === 'port') cost = 800;
    if (type === 'missile') cost = 2000;
    if (type === 'anti_missile') cost = 1500;

    if(!isCapital && playerStats.gold < cost) {
        alert("Fonds insuffisants ! Il te faut " + cost + " Or.");
        return;
    }
    
    if(!isCapital) playerStats.gold -= cost;
    updateHUD();

    // CONSTRUCTION 3D
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
    window.scene.add(structure);
    entities.push({ type: type, owner: 'player', mesh: structure });
}

// --- 7. ANIMATIONS ---
function launchMissile(siloEntity, targetPos) {
    const missileGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const missileMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const missile = new THREE.Mesh(missileGeo, missileMat);
    missile.position.copy(siloEntity.mesh.position);
    window.scene.add(missile);

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
    const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(5.05); 
    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ color: 0x00f0ff, linewidth: 2, scale: 1, dashSize: 0.2, gapSize: 0.1 });
    const route = new THREE.Line(geometry, material);
    route.computeLineDistances(); 
    window.scene.add(route);
}

window.updateTroopVal = function(val) {
    troopPercentage = val;
    let elem = document.getElementById('troop-val');
    if(elem) elem.innerText = val + "%";
}
