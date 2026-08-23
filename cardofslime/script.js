// --- CONFIGURATION DES CARTES ---
const cardDatabase = {
    slime: { id: "slime", name: "Le Slime", cost: 3, color: "#4CAF50" },
    slimeuse: { id: "slimeuse", name: "La Slimeuse", cost: 3, color: "#8BC34A" },
    mage: { id: "mage", name: "Mage Slime", cost: 4, color: "#03A9F4" },
    boule: { id: "boule", name: "La Boule", cost: 4, color: "#FF9800" },
    mega: { id: "mega", name: "MEGA Slime", cost: 8, color: "#9C27B0" },
    tornade: { id: "tornade", name: "Tornade", cost: 3, color: "#9E9E9E" }
};

// Ton deck de 6 cartes
const myDeck = ["slime", "slimeuse", "mage", "boule", "mega", "tornade"];

// --- VARIABLES D'ÉTAT ---
let currentSlime = 0;
const MAX_SLIME = 10;
const SLIME_GENERATION_RATE = 2000; // 1 Slime toutes les 2 secondes

let hand = [];
let drawPile = [];
let nextCard = null;

// --- ELEMENTS DU DOM ---
const slimeBarFill = document.getElementById('slime-bar-fill');
const slimeCount = document.getElementById('slime-count');
const handContainer = document.getElementById('hand');
const nextCardContainer = document.getElementById('next-card');
const arena = document.getElementById('arena');

// --- INITIALISATION DU JEU ---
function initGame() {
    // Mélanger le deck pour créer la pile de pioche
    drawPile = [...myDeck].sort(() => Math.random() - 0.5);
    
    // Piocher les 4 premières cartes
    for(let i = 0; i < 4; i++) {
        hand.push(drawPile.shift());
    }
    // Définir la carte suivante
    nextCard = drawPile.shift();

    updateUI();
    
    // Lancer la génération de Slime
    setInterval(generateSlime, SLIME_GENERATION_RATE);
    // Boucle de mise à jour fluide de l'affichage
    setInterval(updateCardsAffordability, 100);
}

// --- GESTION DE L'ÉNERGIE (SLIME) ---
function generateSlime() {
    if (currentSlime < MAX_SLIME) {
        currentSlime++;
        updateSlimeUI();
    }
}

function updateSlimeUI() {
    const percentage = (currentSlime / MAX_SLIME) * 100;
    slimeBarFill.style.width = `${percentage}%`;
    slimeCount.innerText = `${currentSlime} / 10 Slimes`;
}

// --- GESTION DES CARTES ---
function updateUI() {
    renderHand();
    renderNextCard();
}

function renderHand() {
    handContainer.innerHTML = ''; // Vider la main actuelle
    hand.forEach((cardId, index) => {
        const cardData = cardDatabase[cardId];
        const cardEl = createCardElement(cardData);
        
        // Événement de clic pour jouer la carte
        cardEl.addEventListener('click', () => playCard(index));
        
        handContainer.appendChild(cardEl);
    });
}

function renderNextCard() {
    nextCardContainer.innerHTML = '';
    const cardData = cardDatabase[nextCard];
    nextCardContainer.appendChild(createCardElement(cardData, true));
}

function createCardElement(cardData, isMini = false) {
    const div = document.createElement('div');
    div.className = `card ${isMini ? 'mini' : ''}`;
    div.style.borderColor = cardData.color;
    div.dataset.cost = cardData.cost; // Pour vérifier facilement le coût
    
    div.innerHTML = `
        <div class="cost">${cardData.cost}</div>
        <div class="name" style="color: ${cardData.color}">${cardData.name}</div>
    `;
    return div;
}

// Grise les cartes trop chères en temps réel
function updateCardsAffordability() {
    const cards = handContainer.querySelectorAll('.card');
    cards.forEach(card => {
        const cost = parseInt(card.dataset.cost);
        if (currentSlime < cost) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

// --- JOUER UNE CARTE ---
function playCard(handIndex) {
    const cardId = hand[handIndex];
    const cardData = cardDatabase[cardId];

    // Vérifier si on a assez de Slime
    if (currentSlime >= cardData.cost) {
        // Déduire le coût
        currentSlime -= cardData.cost;
        updateSlimeUI();

        // 1. Invoquer l'unité dans l'arène (pour le prototype, on la met au hasard en bas)
        spawnEntity(cardData);

        // 2. Mettre la carte jouée à la fin de la pile de pioche (mécanique des 6 cartes)
        drawPile.push(cardId);

        // 3. Remplacer la carte jouée par la carte "Suivante"
        hand[handIndex] = nextCard;

        // 4. Piocher une nouvelle carte "Suivante"
        nextCard = drawPile.shift();

        // Mettre à jour l'interface
        updateUI();
    }
}

// --- INVOCATION SUR LE TERRAIN ---
function spawnEntity(cardData) {
    const entity = document.createElement('div');
    entity.className = 'entity';
    entity.innerText = cardData.name;
    entity.style.background = cardData.color;

    // Position aléatoire près de ta base (pour l'exemple)
    const randomX = 20 + Math.random() * 60; // entre 20% et 80% de la largeur
    const randomY = 70 + Math.random() * 15; // entre 70% et 85% de la hauteur
    
    entity.style.left = `${randomX}%`;
    entity.style.top = `${randomY}%`;

    arena.appendChild(entity);

    // Faire monter l'unité vers le haut (animation très basique)
    setTimeout(() => {
        entity.style.transition = 'top 3s linear';
        entity.style.top = '10%';
    }, 100);

    // Supprimer l'unité après quelques secondes (pour nettoyer le prototype)
    setTimeout(() => {
        entity.remove();
    }, 3200);
}

// Démarrer
initGame();
updateSlimeUI();
