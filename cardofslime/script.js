// --- ANIMATION BOUTON PARAMÈTRES ---
let settingsAnimInterval;
let rotation = 0;
const settingsImg = document.getElementById('settings-btn-img');

function startSettingsAnim() {
    settingsAnimInterval = setInterval(() => {
        rotation += 5;
        settingsImg.style.transform = `rotate(${rotation}deg)`;
    }, 20);
}
function stopSettingsAnim() {
    clearInterval(settingsAnimInterval);
    settingsImg.style.transform = `rotate(${rotation}deg) scale(1.1)`;
    setTimeout(() => { settingsImg.style.transform = `rotate(${rotation}deg) scale(1)`; }, 200);
}

// --- GESTION MODAL PARAMÈTRES ET TAILLE ÉCRAN ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function setGameSize(sizeType) {
    const container = document.getElementById('game-container');
    const title = document.querySelector('.game-title');
    
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-sz-${sizeType}`).classList.add('active');
    
    // Appliquer la classe
    container.className = `size-${sizeType}`;

    // Cacher le titre si on est en vrai plein écran pour ne pas gêner
    if (sizeType === 'full') {
        title.style.display = 'none';
        if(document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((e) => console.log(e));
        }
    } else {
        title.style.display = 'block';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((e) => console.log(e));
        }
    }
}


// ==========================================
// LOGIQUE DU JEU : CARD OF SLIME (Troupes & Slime)
// ==========================================

const cardDatabase = {
    slime: { id: "slime", name: "Le Slime", cost: 3, color: "#4CAF50" },
    slimeuse: { id: "slimeuse", name: "La Slimeuse", cost: 3, color: "#8BC34A" },
    mage: { id: "mage", name: "Mage Slime", cost: 4, color: "#03A9F4" },
    boule: { id: "boule", name: "La Boule", cost: 4, color: "#FF9800" },
    mega: { id: "mega", name: "MEGA Slime", cost: 8, color: "#9C27B0" },
    tornade: { id: "tornade", name: "Tornade", cost: 3, color: "#9E9E9E" }
};

const myDeck = ["slime", "slimeuse", "mage", "boule", "mega", "tornade"];
let currentSlime = 0;
const MAX_SLIME = 10;
const SLIME_GENERATION_RATE = 1500; // Plus nerveux : 1.5s par slime

let hand = [];
let drawPile = [];
let nextCard = null;

const slimeBarFill = document.getElementById('slime-bar-fill');
const slimeCount = document.getElementById('slime-count');
const handContainer = document.getElementById('hand');
const nextCardContainer = document.getElementById('next-card');
const arena = document.getElementById('arena');

function initGame() {
    drawPile = [...myDeck].sort(() => Math.random() - 0.5);
    for(let i = 0; i < 4; i++) hand.push(drawPile.shift());
    nextCard = drawPile.shift();

    updateUI();
    setInterval(generateSlime, SLIME_GENERATION_RATE);
    setInterval(updateCardsAffordability, 100);
}

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

function updateUI() {
    renderHand();
    renderNextCard();
}

function renderHand() {
    handContainer.innerHTML = '';
    hand.forEach((cardId, index) => {
        const cardData = cardDatabase[cardId];
        const cardEl = createCardElement(cardData);
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
    div.dataset.cost = cardData.cost;
    
    div.innerHTML = `
        <div class="cost">${cardData.cost}</div>
        <div class="name" style="color: ${cardData.color}">${cardData.name}</div>
    `;
    return div;
}

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

function playCard(handIndex) {
    const cardId = hand[handIndex];
    const cardData = cardDatabase[cardId];

    if (currentSlime >= cardData.cost) {
        currentSlime -= cardData.cost;
        updateSlimeUI();

        spawnEntity(cardData);

        drawPile.push(cardId);
        hand[handIndex] = nextCard;
        nextCard = drawPile.shift();
        
        updateUI();
    }
}

function spawnEntity(cardData) {
    const entity = document.createElement('div');
    entity.className = 'entity';
    entity.innerText = cardData.name;
    entity.style.background = cardData.color;

    // Spawn dans la zone du joueur (en bas)
    const randomX = 20 + Math.random() * 60;
    const spawnY = 85; 
    
    entity.style.left = `${randomX}%`;
    entity.style.top = `${spawnY}%`;

    arena.appendChild(entity);

    // Mouvement vers la base adverse
    setTimeout(() => {
        // Le Mega Slime met 8 secondes pour arriver en haut, un slime normal 3 secondes
        const speed = cardData.cost === 8 ? '8s' : '3s'; 
        entity.style.transition = `top ${speed} linear`;
        entity.style.top = '10%';
    }, 50);

    // Nettoyage une fois arrivé
    const killTime = cardData.cost === 8 ? 8000 : 3000;
    setTimeout(() => {
        entity.remove();
        // Optionnel : Ajouter un petit flash rouge sur "Tour Ennemie" pour faire genre on a fait des dégâts
        document.getElementById('enemy-base').style.backgroundColor = 'red';
        setTimeout(()=> document.getElementById('enemy-base').style.backgroundColor = 'rgba(0,0,0,0.6)', 200);
    }, killTime);
}

initGame();
updateSlimeUI();
