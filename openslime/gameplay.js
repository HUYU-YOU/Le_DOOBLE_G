// =========================================================
// LOGIQUE DE JEU - INTERFACE, PARAMÈTRES ET RÈGLES
// =========================================================

// --- VARIABLES GLOBALES DE JEU ---
let troopPercentage = 50;
let buildTargetPosition = null; 
let buildTargetTerrain = null; 

// --- 1. DÉTECTION DU TERRAIN (LE RADAR DE LA MAP.JPG) ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
const terrainImg = new Image();
terrainImg.src = 'assets/map_globe.png'; // Chargement de ta carte

terrainImg.onload = () => {
    terrainCanvas.width = terrainImg.width;
    terrainCanvas.height = terrainImg.height;
    terrainCtx.drawImage(terrainImg, 0, 0);
    console.log("Radar de terrain initialisé avec succès depuis map_globe.png !");
};

// Fonction d'analyse de pixel pour différencier l'Océan des Continents
function isWater(r, g, b) {
    // Si la composante bleue domine nettement par rapport au rouge, c'est de l'eau
    if (b > r + 30) return true;
    // Pour les zones maritimes claires / turquoise
    if (b > 100 && g > 110 && r < 90) return true;
    
    return false; // Tout le reste (verts, jaunes, roses des terres) est considéré comme de la terre
}


// --- 2. RAYCASTING ET CLIC SUR LE GLOBE 3D ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const container3D = document.getElementById('webgl-container');

function onMouseClick(event) {
    // Si on clique sur l'interface ou le menu, on ignore
    if (event.target.closest('#ui-container') || event.target.closest('#build-menu')) return;

    const rect = container3D.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    const intersects = raycaster.intersectObject(window.earth);

    if (intersects.length > 0) {
        const hit = intersects[0];
        buildTargetPosition = hit.point; 
        
        // --- LECTURE DU TERRAIN VIA LES COORDONNÉES UV ---
        if (hit.uv && terrainImg.complete) {
            let px = Math.floor(hit.uv.x * terrainCanvas.width);
            let py = Math.floor((1 - hit.uv.y) * terrainCanvas.height); // Inversion de l'axe Y
            
            let pixel = terrainCtx.getImageData(px, py, 1, 1).data;
            let terrainType = isWater(pixel[0], pixel[1], pixel[2]) ? 'Eau' : 'Terre';
            buildTargetTerrain = terrainType;

            openBuildMenu(event.clientX, event.clientY, terrainType);
        }
    } else {
        closeBuildMenu(); 
    }
}

container3D.addEventListener('click', onMouseClick);


// --- 3. GESTION DU MENU CONTEXTUEL DE CONSTRUCTION ---
function openBuildMenu(mouseX, mouseY, terrainType) {
    const menu = document.getElementById('build-menu');
    const header = document.getElementById('build-terrain-type');
    
    menu.style.left = mouseX + 'px';
    menu.style.top = mouseY + 'px';
    menu.style.display = 'flex';

    if (terrainType === 'Eau') {
        header.innerText = "🌊 ZONE MARITIME";
        header.style.color = "#00f0ff";
        document.getElementById('btn-city').disabled = true; 
        document.getElementById('btn-missile').disabled = true; 
        document.getElementById('btn-anti-missile').disabled = true;
        document.getElementById('btn-port').disabled = false; // Port autorisé en mer
    } else {
        header.innerText = "⛰️ ZONE TERRESTRE";
        header.style.color = "#39ff14";
        document.getElementById('btn-city').disabled = false;
        document.getElementById('btn-missile').disabled = false;
        document.getElementById('btn-anti-missile').disabled = false;
        document.getElementById('btn-port').disabled = true; // Pas de port sur la terre ferme
    }
}

function closeBuildMenu() {
    document.getElementById('build-menu').style.display = 'none';
}

function buildStructure(type) {
    closeBuildMenu();
    if (!buildTargetPosition) return;

    let color, geometry;

    // Formes 3D des bâtiments de stratégie
    if (type === 'city') {
        geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25); // Ville (Cube)
        color = 0xffbf00; 
    } else if (type === 'port') {
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16); // Port (Plateforme)
        color = 0x00f0ff; 
    } else if (type === 'missile') {
        geometry = new THREE.ConeGeometry(0.08, 0.35, 8); // Lance-missile (Cône)
        color = 0xff007f; 
    } else if (type === 'anti-missile') {
        geometry = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI*2, 0, Math.PI/2); // Dôme anti-missile
        color = 0x39ff14; 
    }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const structure = new THREE.Mesh(geometry, material);

    structure.position.copy(buildTargetPosition);
    
    // Aligner la structure perpendiculairement à la courbure du globe
    structure.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), 
        buildTargetPosition.clone().normalize()
    );

    if(type === 'missile') structure.translateY(0.15);
    
    window.scene.add(structure);
    console.log(`[CONSTRUCTION] ${type} posé sur la ${buildTargetTerrain} avec un max de ${troopPercentage}% de troupes !`);
}


// --- 4. INTERFACE GLOBALE & PARAMÈTRES ---
function updateTroopVal(val) {
    troopPercentage = val;
    let troopValElem = document.getElementById('troop-val');
    if(troopValElem) troopValElem.innerText = val + "%";
}

const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) { 
        settingsBtnImg.src = '../img/setting.png'; 
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { 
        if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; 
    }, 300);
}

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('show');
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    let btnClassic = document.getElementById('btn-sz-classic');
    let btnWide = document.getElementById('btn-sz-wide');
    let btnFull = document.getElementById('btn-sz-full');

    if (size === 'classic') { 
        container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'wide') { 
        container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'full') { 
        container.classList.add('size-full'); if(btnFull) btnFull.classList.add('active'); 
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); 
    }

    if (typeof window.resize3DEnvironment === "function") {
        setTimeout(window.resize3DEnvironment, 50);
        setTimeout(window.resize3DEnvironment, 400); 
    }
}

document.addEventListener('fullscreenchange', () => { 
    const container = document.getElementById('game-container');
    if (!document.fullscreenElement && container && container.classList.contains('size-full')) {
        setGameSize('wide'); 
    }
});
