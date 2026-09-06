// ==========================================
// TRADUCTIONS (FR/EN)
// ==========================================
let currentLang = 'fr';
const dict = {
    'fr': {
        'txt-settings': 'Paramètres', 'txt-lang': 'Langue / Language 🌍', 'txt-theme': 'Mode Sombre / Nuit 🌙',
        'txt-fs': 'Plein Écran 🖥️', 'txt-close': 'Fermer', 'txt-btn-enter': 'ENTRER DANS LA TEMPÊTE',
        'txt-multi-title': 'Rejoindre le Valhalla', 
        'txt-btn-host': 'MULTI', // TEXTE COURT POUR L'IMAGE
        'txt-btn-create': 'VS IA', // TEXTE COURT POUR L'IMAGE
        'txt-or': 'OU', 
        'txt-btn-join': 'Rejoindre', 'txt-class-title': 'Choisis ton Commandant Slime !', 
        'txt-desc-berserk': 'Frappe 2 fois où il veut.', 'txt-desc-nav': 'Tire sur 2 cases en ligne.', 
        'txt-desc-sham': 'Tire 3 fois aléatoirement.', 'txt-my-fleet': 'Ma Flotte', 'txt-enemy-fleet': 'Flotte Ennemie', 
        'status-wait': 'Génération du champ de bataille...', 'status-connect': 'Connexion...', 
        'status-error': 'Mode non disponible.', 
        'status-host': "En attente d'un vrai joueur... (Mode en ligne à venir !)", 
        'status-turn-me': "C'est à ton tour d'attaquer !", 
        'status-turn-enemy': "L'ennemi prépare son attaque...", 'status-chaos': "Le Chaman invoque le chaos !", 
        'txt-placement-title': "Place ta flotte !", 'rot-horiz': "🔄 Tourner : Horizontal", 'rot-vert': "🔄 Tourner : Vertical",
        'end-win': "VICTOIRE !", 'end-win-desc': "La flotte ennemie repose au fond de l'océan.",
        'end-lose': "DÉFAITE !", 'end-lose-desc': "Le Valhalla vous attend...",
        'status-power-lost': "⚠️ Drakkar Spécial détruit ! POUVOIR PERDU ! ⚠️",
        'txt-volume': "Volume Musique 🔊"
    },
    'en': {
        'txt-settings': 'Settings', 'txt-lang': 'Langue / Language 🌍', 'txt-theme': 'Dark / Night Mode 🌙',
        'txt-fs': 'Fullscreen 🖥️', 'txt-close': 'Close', 'txt-btn-enter': 'ENTER THE STORM',
        'txt-multi-title': 'Join Valhalla', 
        'txt-btn-host': 'MULTI', // TEXTE COURT
        'txt-btn-create': 'VS AI', // TEXTE COURT
        'txt-or': 'OR', 
        'txt-btn-join': 'Join', 'txt-class-title': 'Choose your Slime Commander!', 
        'txt-desc-berserk': 'Strikes 2 times anywhere.', 'txt-desc-nav': 'Strikes 2 tiles in a row.', 
        'txt-desc-sham': 'Strikes 3 times randomly.', 'txt-my-fleet': 'My Fleet', 'txt-enemy-fleet': 'Enemy Fleet', 
        'status-wait': 'Generating battlefield...', 'status-connect': 'Connecting...', 
        'status-error': 'Mode unavailable.', 
        'status-host': "Waiting for a real player... (Online mode coming soon!)", 
        'status-turn-me': "It's your turn to attack!", 
        'status-turn-enemy': "Enemy is preparing to attack...", 'status-chaos': "The Shaman summons chaos!", 
        'txt-placement-title': "Place your fleet!", 'rot-horiz': "🔄 Rotate: Horizontal", 'rot-vert': "🔄 Rotate: Vertical",
        'end-win': "VICTORY!", 'end-win-desc': "The enemy fleet rests at the bottom of the ocean.",
        'end-lose': "DEFEAT!", 'end-lose-desc': "Valhalla awaits you...",
        'status-power-lost': "⚠️ Special Drakkar destroyed! POWER LOST! ⚠️",
        'txt-volume': "Music Volume 🔊"
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
// SYSTÈME DE MUSIQUE (PLAYLIST)
// ==========================================
const playlist = [
    'assets/music1.mp3', 'assets/music2.mp3', 'assets/music3.mp3',
    'assets/music4.mp3', 'assets/music5.mp3', 'assets/music6.mp3'
];
let currentTrack = 0;

document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const volumeSlider = document.getElementById('music-volume');
    
    volumeSlider.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value;
    });

    bgMusic.addEventListener('ended', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        bgMusic.src = playlist[currentTrack];
        bgMusic.play();
    });
});

function démarrerMusique() {
    const bgMusic = document.getElementById('bg-music');
    const volumeSlider = document.getElementById('music-volume');
    
    if (!bgMusic.getAttribute('src')) {
        bgMusic.volume = volumeSlider.value; 
        bgMusic.src = playlist[currentTrack];
        bgMusic.play().catch(error => console.log("Autoplay bloqué par le navigateur", error));
    }
}

// ==========================================
// VARIABLES GLOBALES & ÉTATS
// ==========================================
let slimeClass = "";
let isMyTurn = false;
let placementPhase = false;
let isHorizontal = true;

const TOTAL_SHIP_CELLS = 7; 
let playerGridState = new Array(100).fill(0); 
let enemyGridState = new Array(100).fill(0);

let playerShipHits = [0, 0, 0]; 
let enemyShipHits = [0, 0, 0];
let playerHitsTaken = 0;
let enemyHitsTaken = 0;

let specialDrakkarAlive = true;
let berserkerCoupsRestants = 2;

let aiTargetQueue = [];
let fleetToPlace = [];
let currentShipIndex = 0;

// ==========================================
// FLUX DU JEU
// ==========================================
function lancerJeu() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    démarrerMusique(); 
}

function hebergerPartie() {
    const statusBox = document.getElementById('multi-status');
    const roomCode = `VIK${Math.floor(1000 + Math.random() * 9000)}`;
    statusBox.style.color = "#f39c12"; 
    statusBox.innerHTML = `Code de la salle : <strong style="color: #f1c40f;">${roomCode}</strong><br><br>${dict[currentLang]['status-host']}`;
}

function creerPartie() {
    const statusBox = document.getElementById('multi-status');
    statusBox.style.color = "#2ecc71";
    statusBox.innerText = dict[currentLang]['status-wait'];
    genererFlotteIA();
    setTimeout(() => { showClassSelection(); }, 1500);
}

function rejoindrePartie() {
    document.getElementById('multi-status').style.color = "#e74c3c";
    document.getElementById('multi-status').innerText = dict[currentLang]['status-error'];
}

function showClassSelection() {
    document.getElementById('multi-menu').classList.add('hidden');
    document.getElementById('class-selection').classList.remove('hidden');
}

function selectClass(className) {
    slimeClass = className;
    const skins = { 'berserker': 'assets/berserk.jpg', 'navigateur': 'assets/navigator.jpeg', 'chaman': 'assets/shaman.jpg' };
    document.getElementById('player-skin-display').src = skins[className];

    document.getElementById('class-selection').classList.add('hidden');
    document.getElementById('battle-container').classList.remove('hidden');
    
    preparerFlotte(className);
}

// ==========================================
// PHASE DE PLACEMENT ET ROTATION ADAPTATIVE
// ==========================================
function preparerFlotte(className) {
    let specialBase = 'horizontal'; 
    if (className === 'chaman') specialBase = 'vertical';

    fleetToPlace = [
        { name: "Drakkar Spécial", size: 3, imageFile: `assets/drakkar${className === 'berserker' ? 'berserk' : className === 'navigateur' ? 'navigator' : 'shaman'}.png`, isSpecial: true, baseOrientation: specialBase },
        { name: "Drakkar Classique", size: 2, imageFile: `assets/drakar1.png`, isSpecial: false, baseOrientation: 'vertical' },
        { name: "Petit Drakkar", size: 2, imageFile: `assets/drakar2.png`, isSpecial: false, baseOrientation: 'horizontal' }
    ];
    
    currentShipIndex = 0;
    placementPhase = true;
    playerGridState.fill(0);
    playerShipHits = [0, 0, 0];
    enemyShipHits = [0, 0, 0];
    playerHitsTaken = 0;
    enemyHitsTaken = 0;
    specialDrakkarAlive = true;
    
    document.getElementById('p-ship-special').innerHTML = "🟢 Drakkar Spécial"; document.getElementById('p-ship-special').style.color = "";
    document.getElementById('p-ship-class').innerHTML = "🟢 Drakkar Classique"; document.getElementById('p-ship-class').style.color = "";
    document.getElementById('p-ship-small').innerHTML = "🟢 Petit Drakkar"; document.getElementById('p-ship-small').style.color = "";
    document.getElementById('e-ship-1').innerHTML = "🟢 Navire 1"; document.getElementById('e-ship-1').style.color = "";
    document.getElementById('e-ship-2').innerHTML = "🟢 Navire 2"; document.getElementById('e-ship-2').style.color = "";
    document.getElementById('e-ship-3').innerHTML = "🟢 Navire 3"; document.getElementById('e-ship-3').style.color = "";
    
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
    let collision = cells.some(c => playerGridState[c] !== 0);
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
    
    if (!cells || cells.some(c => playerGridState[c] !== 0)) return; 
    
    const row = Math.floor(index / 10);
    const col = index % 10;
    
    cells.forEach((c) => {
        playerGridState[c] = currentShipIndex + 1; 
        document.querySelectorAll('#player-grid .cell')[c].classList.add('ship-placed');
    });

    renderPlayerShipGraphic(row, col, ship.size, isHorizontal, ship.imageFile, ship.baseOrientation);
    
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

function renderPlayerShipGraphic(row, col, size, horizontal, imageSrc, baseOrientation) {
    const playerGrid = document.getElementById('player-grid');
    const shipDiv = document.createElement('div');
    shipDiv.classList.add('placed-ship-graphic');
    
    const cellSize = 48; 
    const gap = 2; 
    const padding = 5;
    
    const leftPx = padding + col * (cellSize + gap);
    const topPx = padding + row * (cellSize + gap);
    const totalSpanPx = (size * cellSize) + ((size - 1) * gap);
    
    shipDiv.style.left = `${leftPx}px`;
    shipDiv.style.top = `${topPx}px`;
    shipDiv.style.backgroundImage = `url('${imageSrc}')`;
    
    if (baseOrientation === 'vertical') {
        shipDiv.style.width = `${cellSize}px`;
        shipDiv.style.height = `${totalSpanPx}px`;
        
        if (horizontal) {
            shipDiv.style.transformOrigin = `${cellSize / 2}px ${cellSize / 2}px`;
            shipDiv.style.transform = 'rotate(-90deg)';
        } else {
            shipDiv.style.transform = 'none';
        }
    } 
    else {
        shipDiv.style.width = `${totalSpanPx}px`;
        shipDiv.style.height = `${cellSize}px`;
        
        if (horizontal) {
            shipDiv.style.transform = 'none';
        } else {
            shipDiv.style.transformOrigin = `${cellSize / 2}px ${cellSize / 2}px`;
            shipDiv.style.transform = 'rotate(90deg)';
        }
    }
    
    playerGrid.appendChild(shipDiv);
}

// ==========================================
// GÉNÉRATION IA
// ==========================================
function genererFlotteIA() {
    enemyGridState.fill(0);
    const ships = [3, 2, 2];
    ships.forEach((size, index) => {
        let placed = false;
        while (!placed) {
            let randIndex = Math.floor(Math.random() * 100);
            let horizontal = Math.random() > 0.5;
            let cells = getShipCells(randIndex, size, horizontal);
            if (cells && !cells.some(c => enemyGridState[c] !== 0)) {
                cells.forEach(c => enemyGridState[c] = index + 1);
                placed = true;
            }
        }
    });
}

// ==========================================
// PHASE DE COMBAT & PERTE DE POUVOIR
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
                setTimeout(() => {
                    let rand;
                    do { rand = Math.floor(Math.random() * 100); } 
                    while (document.querySelectorAll('#adversary-grid .cell')[rand].classList.contains('hit') || document.querySelectorAll('#adversary-grid .cell')[rand].classList.contains('miss'));
                    executerAttaque(rand);
                }, i * 400);
            }
            setTimeout(finDeTour, 1200);
            break;
    }
}

function executerAttaque(index) {
    const cell = document.querySelectorAll('#adversary-grid .cell')[index];
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

    let hitShipId = enemyGridState[index];

    if (hitShipId !== 0) {
        cell.classList.add('hit');
        cell.innerText = "💥";
        enemyHitsTaken++;
        
        enemyShipHits[hitShipId - 1]++;
        if (hitShipId === 1 && enemyShipHits[0] === 3) {
            document.getElementById('e-ship-1').innerHTML = "❌ Navire 1";
            document.getElementById('e-ship-1').style.color = "#e74c3c";
        }
        if (hitShipId === 2 && enemyShipHits[1] === 2) {
            document.getElementById('e-ship-2').innerHTML = "❌ Navire 2";
            document.getElementById('e-ship-2').style.color = "#e74c3c";
        }
        if (hitShipId === 3 && enemyShipHits[2] === 2) {
            document.getElementById('e-ship-3').innerHTML = "❌ Navire 3";
            document.getElementById('e-ship-3').style.color = "#e74c3c";
        }
        
        checkWinCondition();
    } else {
        cell.classList.add('miss');
        cell.innerText = "💦";
    }
}

function finDeTour() {
    isMyTurn = false;
    berserkerCoupsRestants = 2; 
    
    if (document.getElementById('game-status').innerText !== dict[currentLang]['status-power-lost']) {
        mettreAJourStatut(dict[currentLang]['status-turn-enemy']);
    }
    setTimeout(simulerAttaqueAdverse, 1500);
}

function simulerAttaqueAdverse() {
    if (playerHitsTaken >= TOTAL_SHIP_CELLS || enemyHitsTaken >= TOTAL_SHIP_CELLS) return;

    const playerCells = document.querySelectorAll('#player-grid .cell');
    let target = -1;

    while (aiTargetQueue.length > 0) {
        let potential = aiTargetQueue.shift();
        if (!playerCells[potential].classList.contains('hit') && !playerCells[potential].classList.contains('miss')) {
            target = potential;
            break;
        }
    }

    if (target === -1) {
        do { target = Math.floor(Math.random() * 100); } 
        while (playerCells[target].classList.contains('miss') || playerCells[target].classList.contains('hit'));
    }
    
    let hitShipId = playerGridState[target];

    if (hitShipId !== 0) {
        playerCells[target].classList.add('hit');
        playerCells[target].innerText = "💥";
        document.getElementById('game-ui').classList.add('shake');
        setTimeout(() => document.getElementById('game-ui').classList.remove('shake'), 500);
        
        playerHitsTaken++;
        playerShipHits[hitShipId - 1]++;
        
        if (hitShipId === 1 && playerShipHits[0] === 3) {
            specialDrakkarAlive = false;
            document.getElementById('p-ship-special').innerHTML = "❌ Drakkar Spécial";
            document.getElementById('p-ship-special').style.color = "#e74c3c";
            mettreAJourStatut(dict[currentLang]['status-power-lost']);
        } else if (hitShipId === 2 && playerShipHits[1] === 2) {
            document.getElementById('p-ship-class').innerHTML = "❌ Drakkar Classique";
            document.getElementById('p-ship-class').style.color = "#e74c3c";
        } else if (hitShipId === 3 && playerShipHits[2] === 2) {
            document.getElementById('p-ship-small').innerHTML = "❌ Petit Drakkar";
            document.getElementById('p-ship-small').style.color = "#e74c3c";
        }

        if (target >= 10) aiTargetQueue.push(target - 10);
        if (target < 90) aiTargetQueue.push(target + 10);
        if (target % 10 !== 0) aiTargetQueue.push(target - 1);
        if (target % 10 !== 9) aiTargetQueue.push(target + 1);

    } else {
        playerCells[target].classList.add('miss');
        playerCells[target].innerText = "💦";
    }
    
    checkWinCondition();
    if (playerHitsTaken < TOTAL_SHIP_CELLS) {
        setTimeout(() => {
            isMyTurn = true;
            if (document.getElementById('game-status').innerText !== dict[currentLang]['status-power-lost']) {
                mettreAJourStatut(dict[currentLang]['status-turn-me']);
            }
        }, 1500);
    }
}

function checkWinCondition() {
    if (enemyHitsTaken >= TOTAL_SHIP_CELLS) {
        finDePartie(true);
    } else if (playerHitsTaken >= TOTAL_SHIP_CELLS) {
        finDePartie(false);
    }
}

function finDePartie(isVictoire) {
    isMyTurn = false;
    const screen = document.getElementById('game-over-screen');
    const title = document.getElementById('txt-end-title');
    const desc = document.getElementById('txt-end-desc');
    
    screen.classList.remove('hidden');
    
    if (isVictoire) {
        title.innerText = dict[currentLang]['end-win'];
        title.style.color = "#2ecc71";
        desc.innerText = dict[currentLang]['end-win-desc'];
    } else {
        title.innerText = dict[currentLang]['end-lose'];
        title.style.color = "#e74c3c";
        desc.innerText = dict[currentLang]['end-lose-desc'];
    }
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
