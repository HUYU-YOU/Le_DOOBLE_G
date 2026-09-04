// ==========================================
// VARIABLES GLOBALES ET ÉTAT DU JEU
// ==========================================
let slimeClass = "";
let roomCode = "";
let isMyTurn = false;
let specialDrakkarAlive = true;

// Variables pour les pouvoirs
let berserkerCoupsRestants = 2;

// ==========================================
// 0. MENU PRINCIPAL
// ==========================================
function lancerJeu() {
    // Cache l'écran titre (Kraken + Logo)
    const mainMenu = document.getElementById('main-menu');
    if(mainMenu) mainMenu.classList.add('hidden');
    
    // Affiche l'interface du jeu (Sélection des classes)
    document.getElementById('game-ui').classList.remove('hidden');
}

// ==========================================
// 1. SÉLECTION DE LA CLASSE
// ==========================================
function selectClass(className) {
    slimeClass = className;
    
    // Mettre à jour l'UI avec le nom de la classe
    const nomsClasses = {
        'berserker': 'Berserker 🪓',
        'navigateur': 'Navigateur 🧭',
        'chaman': 'Chaman Loki 🔮'
    };
    document.getElementById('player-class-name').innerText = nomsClasses[className];

    // Cacher la sélection de classe et afficher le menu multijoueur
    document.getElementById('class-selection').classList.add('hidden');
    afficherMenuMulti();
}

// ==========================================
// 2. SYSTÈME MULTIJOUEUR (CODE VIK****)
// ==========================================
function afficherMenuMulti() {
    // Création dynamique du menu de connexion
    const menuHTML = `
        <div id="multi-menu" style="text-align: center; margin-top: 50px;">
            <h2>Rejoindre le Valhalla</h2>
            <div style="margin: 20px;">
                <button class="start-btn" onclick="creerPartie()" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">Créer une partie</button>
            </div>
            <p>OU</p>
            <div style="margin: 20px;">
                <input type="text" id="join-code" placeholder="VIK1234" maxlength="7" style="padding: 10px; font-size: 18px; text-transform: uppercase;">
                <button class="start-btn" onclick="rejoindrePartie()" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">Rejoindre</button>
            </div>
            <p id="multi-status" style="color: #2ecc71; margin-top: 15px; font-weight: bold;"></p>
        </div>
    `;
    
    document.getElementById('game-ui').insertAdjacentHTML('beforeend', menuHTML);
}

function creerPartie() {
    // Génère un code aléatoire à 4 chiffres
    const code = Math.floor(1000 + Math.random() * 9000);
    roomCode = `VIK${code}`;
    
    const statusBox = document.getElementById('multi-status');
    statusBox.innerHTML = `Code de la partie : <strong>${roomCode}</strong><br>En attente d'un adversaire...`;
    
    // Simulation : Un joueur rejoint après 3 secondes
    setTimeout(() => {
        lancerBataille();
    }, 3000);
}

function rejoindrePartie() {
    const inputCode = document.getElementById('join-code').value.toUpperCase();
    const regex = /^VIK[0-9]{4}$/; // Vérifie le format VIK + 4 chiffres
    
    if (regex.test(inputCode)) {
        roomCode = inputCode;
        document.getElementById('multi-status').innerText = "Connexion au drakkar ennemi...";
        
        // Simulation de connexion réussie
        setTimeout(() => {
            lancerBataille();
        }, 1500);
    } else {
        document.getElementById('multi-status').innerText = "Erreur : Le code doit être au format VIK suivi de 4 chiffres (ex: VIK1234).";
        document.getElementById('multi-status').style.color = "#e74c3c"; // Rouge erreur
    }
}

// ==========================================
// 3. INITIALISATION DE LA BATAILLE
// ==========================================
function lancerBataille() {
    // Nettoyer l'UI
    document.getElementById('multi-menu').remove();
    document.getElementById('battle-container').classList.remove('hidden');
    
    initialiserGrilles();
    
    // Définir qui commence (simulé)
    isMyTurn = true;
    mettreAJourStatut(isMyTurn ? "C'est à ton tour d'attaquer !" : "L'ennemi prépare son attaque...");
}

function initialiserGrilles() {
    const playerGrid = document.getElementById('player-grid');
    const adversaryGrid = document.getElementById('adversary-grid');
    
    // Créer les 100 cases (10x10) pour chaque grille
    for (let i = 0; i < 100; i++) {
        // Grille Joueur
        let cellP = document.createElement('div');
        cellP.classList.add('cell');
        cellP.dataset.index = i;
        playerGrid.appendChild(cellP);
        
        // Grille Adversaire
        let cellA = document.createElement('div');
        cellA.classList.add('cell');
        cellA.dataset.index = i;
        
        // Ajouter l'événement de clic pour attaquer
        cellA.addEventListener('click', () => preparerAttaque(i, cellA));
        
        adversaryGrid.appendChild(cellA);
    }
    
    // Simulation : placement d'un "Drakkar Spécial" adverse caché pour tester
    window.drakkarAdverseIndex = [12, 13, 14]; 
}

// ==========================================
// 4. LOGIQUE DES POUVOIRS ET ATTAQUES
// ==========================================
function preparerAttaque(index, cellElement) {
    if (!isMyTurn) return;
    
    // Empêcher de recliquer sur une case déjà visée
    if (cellElement.classList.contains('hit') || cellElement.classList.contains('miss')) return;

    if (!specialDrakkarAlive) {
        // Pouvoir perdu, attaque normale
        executerAttaque(index);
        finDeTour();
        return;
    }

    // Application du pouvoir selon la classe
    switch (slimeClass) {
        case 'berserker':
            executerAttaque(index);
            berserkerCoupsRestants--;
            mettreAJourStatut(`Berserker : Encore ${berserkerCoupsRestants} coup(s) !`);
            if (berserkerCoupsRestants <= 0) {
                finDeTour();
            }
            break;
            
        case 'navigateur':
            executerAttaque(index);
            // Attaque automatiquement la case à droite (si on ne déborde pas de la ligne)
            if (index % 10 !== 9) {
                setTimeout(() => executerAttaque(index + 1), 300);
            }
            finDeTour();
            break;
            
        case 'chaman':
            // Le clic déclenche le sort, mais les cibles sont aléatoires
            mettreAJourStatut("Le Chaman invoque le chaos !");
            for (let i = 0; i < 3; i++) {
                let randomTarget = Math.floor(Math.random() * 100);
                setTimeout(() => executerAttaque(randomTarget), i * 400);
            }
            setTimeout(finDeTour, 1200);
            break;
    }
}

function executerAttaque(index) {
    const adversaryCells = document.querySelectorAll('#adversary-grid .cell');
    const cell = adversaryCells[index];
    
    // Vérifier si on touche le bateau ennemi simulé
    if (window.drakkarAdverseIndex && window.drakkarAdverseIndex.includes(index)) {
        cell.classList.add('hit');
        // Ajouter un visuel d'explosion ou de slime
        cell.style.backgroundColor = "#e74c3c"; 
    } else {
        cell.classList.add('miss');
        cell.style.backgroundColor = "#3498db";
    }
}

function finDeTour() {
    isMyTurn = false;
    berserkerCoupsRestants = 2; // Reset pour le prochain tour
    mettreAJourStatut("Tour terminé. Au tour de l'adversaire...");
    
    // Simulation : l'adversaire joue après 2 secondes
    setTimeout(simulerAttaqueAdverse, 2000);
}

function simulerAttaqueAdverse() {
    const playerCells = document.querySelectorAll('#player-grid .cell');
    const randomTarget = Math.floor(Math.random() * 100);
    
    playerCells[randomTarget].classList.add('miss');
    playerCells[randomTarget].style.backgroundColor = "#e67e22"; // Tir ennemi
    
    isMyTurn = true;
    mettreAJourStatut("C'est à ton tour d'attaquer !");
}

function mettreAJourStatut(message) {
    document.getElementById('game-status').innerText = message;
}

// ==========================================
// 5. FONCTIONS UI HÉRITÉES DU HUB (PARAMÈTRES)
// ==========================================
function toggleSettings() {
    // CORRECTION ICI : on utilise classList.toggle('show') au lieu de style.display
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function clickSettingsAnim() {
    toggleSettings();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
