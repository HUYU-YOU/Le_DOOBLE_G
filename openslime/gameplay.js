// =========================================================
// LOGIQUE DE JEU - INTERFACE, PARAMÈTRES ET RÈGLES
// =========================================================

// --- VARIABLES GLOBALES ---
let troopPercentage = 50;
let buildTargetPosition = null; // Position 3D où l'on veut construire
let buildTargetTerrain = null; // 'Terre' ou 'Eau'

// --- 1. DÉTECTION DU TERRAIN (LE RADAR INVISIBLE) ---
// On crée un canvas caché qui va lire les couleurs de map.jpg
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();
terrainImg.src = 'assets/map.jpg'; // Ton image de la Terre

terrainImg.onload = () => {
    terrainCanvas.width = terrainImg.width;
    terrainCanvas.height = terrainImg.height;
    terrainCtx.drawImage(terrainImg, 0, 0);
    console.log("Radar de terrain initialisé avec succès !");
};

// Fonction mathématique pour analyser la couleur et dire si c'est de l'eau
function isWater(r, g, b) {
    // Sur ta map, l'eau est très bleue ou cyan. 
    // Si le bleu domine largement le rouge, c'est de l'eau.
    if (b > r + 30) return true;
    // Pour les zones très cyan/turquoises
    if (b > 100 && g > 120 && r < 100) return true;
    
    return false; // Sinon (vert, rose, marron, blanc) c'est de la terre
}


// --- 2. RAYCASTING (CLIC SUR LE GLOBE) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const container3D = document.getElementById('webgl-container');

function onMouseClick(event) {
    // Si on clique sur un bouton de l'UI, on annule
    if (event.target.closest('#ui-container') || event.target.closest('#build-menu')) return;

    // Coordonnées souris pour Three.js
    const rect = container3D.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    const intersects = raycaster.intersectObject(window.earth);

    if (intersects.length > 0) {
        const hit = intersects[0];
        buildTargetPosition = hit.point; // Sauvegarde du point 3D exact
        
        // --- LECTURE DU TERRAIN VIA UV MAPPING ---
        if (hit.uv && terrainImg.complete) {
            // Convertir la position 3D (UV) en pixel 2D sur l'image
            let px = Math.floor(hit.uv.x * terrainCanvas.width);
            let py = Math.floor((1 - hit.uv.y) * terrainCanvas.height); // Y est inversé
            
            // Récupérer la couleur du pixel
            let pixel = terrainCtx.getImageData(px, py, 1, 1).data;
            let terrainType = isWater(pixel[0], pixel[1], pixel[2]) ? 'Eau' : 'Terre';
            buildTargetTerrain = terrainType;

            // Ouvrir le menu de construction adapté
            openBuildMenu(event.clientX, event.clientY, terrainType);
        }
    } else {
        closeBuildMenu(); // On a cliqué dans l'espace vide
    }
}

// On écoute le simple clic (ou le double clic si tu préfères)
container3D.addEventListener('click', onMouseClick);


// --- 3. MENU DE CONSTRUCTION ---
function openBuildMenu(mouseX, mouseY, terrainType) {
    const menu = document.getElementById('build-menu');
    const header = document.getElementById('build-terrain-type');
    
    // Positionnement du menu
    menu.style.left = mouseX + 'px';
    menu.style.top = mouseY + 'px';
    menu.style.display = 'flex';

    // Rendu du texte selon le terrain
    if (terrainType === 'Eau') {
        header.innerText = "🌊 ZONE MARITIME";
        header.style.color = "#00f0ff";
        document.getElementById('btn-city').disabled = true; // Pas de ville dans l'eau
        document.getElementById('btn-missile').disabled = true; // Pas de missile dans l'eau (sauf sous-marin plus tard)
        document.getElementById('btn-anti-missile').disabled = true;
        document.getElementById('btn-port').disabled = false; // Port autorisé
    } else {
        header.innerText = "⛰️ ZONE TERRESTRE";
        header.style.color = "#39ff14";
        document.getElementById('btn-city').disabled = false;
        document.getElementById('btn-missile').disabled = false;
        document.getElementById('btn-anti-missile').disabled = false;
        document.getElementById('btn-port').disabled = true; // Pas de port au milieu de la terre
    }
}

function closeBuildMenu() {
    document.getElementById('build-menu').style.display = 'none';
}

function buildStructure(type) {
    closeBuildMenu();
    if (!buildTargetPosition) return;

    let color, geometry;

    // Création du modèle 3D selon la structure
    if (type === 'city') {
        geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2); // Cube
        color = 0xffbf00; // Or
    } else if (type === 'port') {
        geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16); // Plateforme
        color = 0x00f0ff; // Cyan
    } else if (type === 'missile') {
        geometry = new THREE.ConeGeometry(0.05, 0.3, 8); // Cône pointu
        color = 0xff007f; // Rouge/Rose
    } else if (type === 'anti-missile') {
        geometry = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI*2, 0, Math.PI/2); // Dôme
        color = 0x39ff14; // Vert
    }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);

    // Positionner sur la sphère
    structure.position.copy(buildTargetPosition);
    
    // Aligner la structure pour qu'elle soit "debout" par rapport au centre de la Terre !
    structure.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), 
        buildTargetPosition.clone().normalize()
    );

    // Décaler un tout petit peu vers l'extérieur pour le cône du missile
    if(type === 'missile') structure.translateY(0.15);
    
    window.scene.add(structure);
    console.log(type + " construit avec succès sur " + buildTargetTerrain);
}


// --- 4. GESTION DE L'INTERFACE GLOBALE (SLIDER & REGLAGES) ---
function updateTroopVal(val) {
    troopPercentage = val;
    document.getElementById('troop-val').innerText = val + "%";
}

// (Le reste de tes fonctions de paramètres habituelles)
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;
function startSettingsAnim() { if (hoverInterval) return; currentFrame = 0; if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame]; hoverInterval = setInterval(() => { currentFrame = (currentFrame + 1) % animFrames.length; if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame]; }, 100); }
function stopSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) { settingsBtnImg.src = '../img/setting.png'; } }
function clickSettingsAnim() { clearInterval(hoverInterval); hoverInterval = null; if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png'; toggleSettings(); setTimeout(() => { if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; }, 300); }
function toggleSettings() { let modal = document.getElementById('settings-modal'); if (modal) modal.classList.toggle('show'); }

function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    let btnClassic = document.getElementById('btn-sz-classic'); let btnWide = document.getElementById('btn-sz-wide'); let btnFull = document.getElementById('btn-sz-full');
    if (size === 'classic') { container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } 
    else if (size === 'wide') { container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } 
    else if (size === 'full') { container.classList.add('size-full'); if(btnFull) btnFull.classList.add('active'); if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); }
    if (typeof window.resize3DEnvironment === "function") { setTimeout(window.resize3DEnvironment, 50); setTimeout(window.resize3DEnvironment, 400); }
}
document.addEventListener('fullscreenchange', () => { const container = document.getElementById('game-container'); if (!document.fullscreenElement && container && container.classList.contains('size-full')) { setGameSize('wide'); } });
