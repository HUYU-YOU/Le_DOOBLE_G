// --- VARIABLES GLOBALES ---
const screens = {
    lobby: document.getElementById('lobby-screen'),
    select: document.getElementById('select-screen'),
    game: document.getElementById('game-screen')
};

let myChampion = null;
let gameLoopId;

// --- LES 6 CHAMPIONS ---
const champions = [
    { id: 'seth', name: 'Le Brawler', color: '#ff4757', hp: 800, speed: 3 },
    { id: 'adc', name: 'Le Shooter', color: '#2ed573', hp: 400, speed: 4 },
    { id: 'yasuo', name: 'Le Ninja', color: '#1e90ff', hp: 500, speed: 5 },
    { id: 'mage', name: 'Le Mage', color: '#9b59b6', hp: 450, speed: 3 },
    { id: 'mundo', name: 'Le Gros Tank', color: '#006266', hp: 1200, speed: 2 },
    { id: 'assassin', name: 'L\'Assassin', color: '#2f3542', hp: 450, speed: 6 }
];

// --- LOGIQUE DU SALON (LOBBY) ---
document.getElementById('btn-create').addEventListener('click', () => {
    let code = "LEG" + Math.floor(100 + Math.random() * 900);
    document.getElementById('room-code-display').innerText = "Code de la room : " + code;
    setTimeout(() => goToScreen('select'), 1500); // Passe à l'écran suivant
});

document.getElementById('btn-join').addEventListener('click', () => {
    let input = document.getElementById('input-code').value.toUpperCase();
    if (input.startsWith("LEG") && input.length === 6) {
        goToScreen('select');
    } else {
        alert("Code invalide ! Il doit ressembler à LEG123");
    }
});

// --- ECRAN DE SELECTION ---
const rosterDiv = document.getElementById('roster');
champions.forEach(champ => {
    let card = document.createElement('div');
    card.className = 'champ-card';
    card.innerHTML = `<h3 style="color:${champ.color}">■</h3><p>${champ.name}</p>`;
    card.onclick = () => {
        document.querySelectorAll('.champ-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        myChampion = champ;
        document.getElementById('btn-start').style.display = 'block';
    };
    rosterDiv.appendChild(card);
});

document.getElementById('btn-start').addEventListener('click', () => {
    if (myChampion) startGame();
});

// --- GESTION DES ECRANS ---
function goToScreen(screenName) {
    Object.values(screens).forEach(s => s.style.display = 'none');
    screens[screenName].style.display = 'flex';
}

// --- LE JEU EN LUI-MEME (CANVAS) ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Entité du Joueur
let player = { x: 50, y: 150, size: 30, color: 'white', speed: 5 };

// Inputs clavier
const keys = { z: false, q: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Inputs Mobile (très basique pour l'exemple)
document.getElementById('btn-left').ontouchstart = () => keys.q = true;
document.getElementById('btn-left').ontouchend = () => keys.q = false;
document.getElementById('btn-right').ontouchstart = () => keys.d = true;
document.getElementById('btn-right').ontouchend = () => keys.d = false;
document.getElementById('btn-up').ontouchstart = () => keys.z = true;
document.getElementById('btn-up').ontouchend = () => keys.z = false;
document.getElementById('btn-down').ontouchstart = () => keys.s = true;
document.getElementById('btn-down').ontouchend = () => keys.s = false;

document.getElementById('btn-attack').addEventListener('click', () => {
    alert(myChampion.name + " attaque ! BOOM !");
});

function startGame() {
    goToScreen('game');
    
    // Adapter le canvas à l'écran
    canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth * 0.9;
    canvas.height = window.innerWidth > 800 ? 400 : 300;

    // Appliquer les stats du champion choisi
    player.color = myChampion.color;
    player.speed = myChampion.speed;

    updateGame();
}

function updateGame() {
    // 1. Mise à jour de la position
    if (keys.z || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;
    if (keys.q || keys.ArrowLeft) player.x -= player.speed;
    if (keys.d || keys.ArrowRight) player.x += player.speed;

    // Bloquer le joueur dans l'arène (la Lane)
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // 2. Dessin
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Efface l'écran

    // Dessine la "Lane" (une ligne au milieu)
    ctx.fillStyle = "#57606f";
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

    // Dessine le joueur
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Boucle d'animation
    gameLoopId = requestAnimationFrame(updateGame);
}
