// ==========================================
// TRADUCTIONS (FR/EN)
// ==========================================
let currentLang = 'fr';
const dict = {
    'fr': {
        'txt-settings': 'Paramètres', 'txt-lang': 'Langue / Language 🌍', 'txt-theme': 'Mode Sombre / Nuit 🌙',
        'txt-fs': 'Plein Écran 🖥️', 'txt-close': 'Fermer', 'txt-btn-enter': 'ENTRER DANS LA TEMPÊTE',
        'txt-multi-title': 'Rejoindre le Valhalla', 'txt-btn-create': 'Créer une partie', 'txt-or': 'OU', 
        'txt-btn-join': 'Rejoindre', 'txt-class-title': 'Choisis ton Commandant Slime !', 
        'txt-desc-berserk': 'Frappe 2 fois où il veut.', 'txt-desc-nav': 'Tire sur 2 cases en ligne.', 
        'txt-desc-sham': 'Tire 3 fois aléatoirement.', 'txt-my-fleet': 'Ma Flotte', 'txt-enemy-fleet': 'Flotte Ennemie', 
        'status-wait': 'En attente d\'un adversaire...', 'status-connect': 'Connexion au drakkar ennemi...', 
        'status-error': 'Erreur : Code invalide.', 'status-turn-me': "C'est à ton tour d'attaquer !", 
        'status-turn-enemy': "L'ennemi prépare son attaque...", 'status-chaos': "Le Chaman invoque le chaos !", 
        'txt-placement-title': "Place ta flotte !", 'rot-horiz': "🔄 Tourner : Horizontal", 'rot-vert': "🔄 Tourner : Vertical"
    },
    'en': {
        'txt-settings': 'Settings', 'txt-lang': 'Langue / Language 🌍', 'txt-theme': 'Dark / Night Mode 🌙',
        'txt-fs': 'Fullscreen 🖥️', 'txt-close': 'Close', 'txt-btn-enter': 'ENTER THE STORM',
        'txt-multi-title': 'Join Valhalla', 'txt-btn-create': 'Create a room', 'txt-or': 'OR', 
        'txt-btn-join': 'Join', 'txt-class-title': 'Choose your Slime Commander!', 
        'txt-desc-berserk': 'Strikes 2 times anywhere.', 'txt-desc-nav': 'Strikes 2 tiles in a row.', 
        'txt-desc-sham': 'Strikes 3 times randomly.', 'txt-my-fleet': 'My Fleet', 'txt-enemy-fleet': 'Enemy Fleet', 
        'status-wait': 'Waiting for an opponent...', 'status-connect': 'Connecting to enemy drakkar...', 
        'status-error': 'Error: Invalid code.', 'status-turn-me': "It's your turn to attack!", 
        'status-turn-enemy': "Enemy is preparing to attack...", 'status-chaos': "The Shaman summons chaos!", 
        'txt-placement-title': "Place your fleet!", 'rot-horiz': "🔄 Rotate: Horizontal", 'rot-vert': "🔄 Rotate: Vertical"
    }
};

function toggleLanguage() {
    const isEnglish = document.getElementById('lang-toggle').checked;
    currentLang = isEnglish ? 'en' : 'fr';
    for (const [id, text] of Object.entries(dict[currentLang])) {
        const element = document.getElementById(id);
        if (element) element.innerText = text;
    }
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let slimeClass = "";
let roomCode = "";
let isMyTurn = false;
let specialDrakkarAlive = true;
let berserkerCoupsRestants = 2;

// Variables de Placement
let isHorizontal = true;
let placementPhase = false;
let fleetToPlace = [];
let currentShipIndex = 0;
let playerGridState = new Array(100).fill(0); 

// ==========================================
// FLUX DU JEU
// ==========================================
function lancerJeu() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
}

function creerPartie() {
    roomCode = `VIK${Math.floor(1000 + Math.random() * 9000)}`;
    const statusBox = document.getElementById('multi-status');
    statusBox.style.color = "#2ecc71";
    statusBox.innerHTML = `Code : <strong>${roomCode}</strong><br>${dict[currentLang]['status-wait']}`;
    setTimeout(() => { showClassSelection(); }, 2000);
}

function rejoindrePartie() {
    const inputCode = document.getElementById('join-code').value.toUpperCase();
    if (/^VIK[0-9]{4}$/.test(inputCode)) {
        document.getElementById('multi-status').innerText = dict[currentLang]['status-connect'];
        setTimeout(() => { showClassSelection(); }, 1500);
    } else {
        document.getElementById('multi-status').style.color = "#e74c3c";
        document.getElementById('multi-status').innerText = dict[currentLang]['status-error'];
    }
}

function showClassSelection() {
    document.getElementById('multi-menu').classList.add('hidden');
    document.getElementById('class-selection').classList.remove('hidden');
}

function selectClass(className) {
    slimeClass = className;
    const skins = {
        'berserker': 'assets/berserk.jpg',
        'navigateur': 'assets/navigator.jpeg',
        'chaman': 'assets/shaman.jpg'
    };
    document.getElementById('player-skin-display').src = skins[className];

    document.getElementById('class-selection').classList.add('hidden');
    document.getElementById('battle-container').classList.remove('hidden');
    
    preparerFlotte(className);
}

// ==========================================
// PHASE DE PLACEMENT DES BATEAUX
// ==========================================
function preparerFlotte(className) {
    fleetToPlace = [
        { name: "Drakkar Spécial", size: 3, cssClass: `drakkar-special-${className}` },
        { name: "Drakkar Classique", size: 2, cssClass: `drakkar-1` },
        { name: "Petit Drakkar", size: 2, cssClass: `drakkar-2` }
    ];
    currentShipIndex = 0;
    placementPhase = true;
    playerGridState.fill(0);
    
    document.getElementById('placement-controls').classList.remove('hidden');
    document.getElementById('current-ship-name').innerText = fleetToPlace[currentShipIndex].name;
    
    initialiserGrilles();
}

function toggleRotation() {
    isHorizontal = !isHorizontal;
    document.getElementById('btn-rotate').innerText = isHorizontal ? dict[currentLang]['rot-horiz'] : dict[currentLang]['rot-vert'];
}

function initialiserGrilles() {
    const playerGrid = document.getElementById('player-grid');
    const adversaryGrid = document.getElementById('adversary-grid');
    playerGrid.innerHTML = '';
    adversaryGrid.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        let cellP = document.createElement('div');
        cellP.classList.add('cell');
        cellP.dataset.index = i;
        cellP.addEventListener('mouseover', () => previewShip(i));
        cellP.addEventListener('mouseout', clearPreview);
        cellP.addEventListener('click', () => placeShip(i));
        playerGrid.appendChild(cellP);
        
        let cellA = document.createElement('div');
        cellA.classList.add('cell');
        cellA.addEventListener('click', () => preparerAttaque(i, cellA));
        adversaryGrid.appendChild(cellA);
    }
    
    window.drakkarAdverseIndex = [12, 13, 14]; 
}

function getShipCells(startIndex, size, horizontal) {
    let cells = [];
    let row = Math.floor(startIndex / 10);
    let col = startIndex % 10;
    
    for (let i = 0; i < size; i++) {
        if (horizontal) {
            if (col + i > 9) return null; 
            cells.push(startIndex + i);
        } else {
            if (row + i > 9) return null; 
            cells.push(startIndex + (i * 10));
        }
    }
    return cells;
}

function previewShip(index) {
    if (!placementPhase) return;
    clearPreview();
    const ship = fleetToPlace[currentShipIndex];
    const cells = getShipCells(index, ship.size, isHorizontal);
    const gridElements = document.querySelectorAll('#player-grid .cell');
    
    if (!cells) return; 
    let collision = cells.some(c => playerGridState[c] === 1);
    cells.forEach(c => { gridElements[c].classList.add(collision ? 'preview-invalid' : 'preview-valid'); });
}

function clearPreview() {
    document.querySelectorAll('#player-grid .cell').forEach(cell => {
        cell.classList.remove('preview-valid', 'preview-invalid');
    });
}

function placeShip(index) {
    if (!placementPhase) return;
    const ship = fleetToPlace[currentShipIndex];
    const cells = getShipCells(index, ship.size, isHorizontal);
    
    if (!cells || cells.some(c => playerGridState[c] === 1)) return; 
    
    const gridElements = document.querySelectorAll('#player-grid .cell');
    cells.forEach((c, i) => {
        playerGridState[c] = 1;
        gridElements[c].classList.add('ship-placed');
        if (i === 0) gridElements[c].classList.add(ship.cssClass); 
    });
    
    currentShipIndex++;
    
    if (currentShipIndex < fleetToPlace.length) {
        document.getElementById('current-ship-name').innerText = fleetToPlace[currentShipIndex].name;
    } else {
        placementPhase = false;
        document.getElementById('placement-controls').classList.add('hidden');
        isMyTurn = true;
        mettreAJourStatut(dict[currentLang]['status-turn-me']);
    }
}

// ==========================================
// PHASE DE COMBAT
// ==========================================
function preparerAttaque(index, cellElement) {
    if (!isMyTurn || placementPhase || cellElement.classList.contains('hit') || cellElement.classList.contains('miss')) return;

    if (!specialDrakkarAlive) {
        executerAttaque(index);
        finDeTour();
        return;
    }

    switch (slimeClass) {
        case 'berserker':
            executerAttaque(index);
            berserkerCoupsRestants--;
            mettreAJourStatut(`Berserker : ${berserkerCoupsRestants} 🪓`);
            if (berserkerCoupsRestants <= 0) finDeTour();
            break;
        case 'navigateur':
            executerAttaque(index);
            if (index % 10 !== 9) setTimeout(() => executerAttaque(index + 1), 300);
            finDeTour();
            break;
        case 'chaman':
            mettreAJourStatut(dict[currentLang]['status-chaos']);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => executerAttaque(Math.floor(Math.random() * 100)), i * 400);
            }
            setTimeout(finDeTour, 1200);
            break;
    }
}

function executerAttaque(index) {
    const cell = document.querySelectorAll('#adversary-grid .cell')[index];
    if (window.drakkarAdverseIndex && window.drakkarAdverseIndex.includes(index)) {
        cell.classList.add('hit');
    } else {
        cell.classList.add('miss');
    }
}

function finDeTour() {
    isMyTurn = false;
    berserkerCoupsRestants = 2; 
    mettreAJourStatut(dict[currentLang]['status-turn-enemy']);
    setTimeout(simulerAttaqueAdverse, 2000);
}

function simulerAttaqueAdverse() {
    const playerCells = document.querySelectorAll('#player-grid .cell');
    let randomTarget;
    do { randomTarget = Math.floor(Math.random() * 100); } 
    while (playerCells[randomTarget].classList.contains('miss') || playerCells[randomTarget].classList.contains('hit'));
    
    if (playerGridState[randomTarget] === 1) {
        playerCells[randomTarget].classList.add('hit');
    } else {
        playerCells[randomTarget].classList.add('miss');
    }
    
    isMyTurn = true;
    mettreAJourStatut(dict[currentLang]['status-turn-me']);
}

function mettreAJourStatut(message) { document.getElementById('game-status').innerText = message; }

// ==========================================
// UI PARAMÈTRES
// ==========================================
function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }
function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function toggleFullscreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } 
    else if (document.exitFullscreen) { document.exitFullscreen(); }
}
