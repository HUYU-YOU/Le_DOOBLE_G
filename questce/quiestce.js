// ==========================================
// ANIMATIONS, PARAMÈTRES & AUDIO
// ==========================================
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100);
}
function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if (!settingsBtnImg.src.includes('settings4.png')) settingsBtnImg.src = '../img/setting.png';
}
function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { settingsBtnImg.src = '../img/setting.png'; }, 300);
}
function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }

function setGameSize(size) {
    const container = document.getElementById('game-container');
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    if (size === 'classic') {
        container.classList.add('size-classic'); document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        container.classList.add('size-wide'); document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        container.classList.add('size-full'); document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    }
}
function autoFullscreen() { if (!document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide'); }
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide');
});

let musicPlayer;
function onYouTubeIframeAPIReady() {
    musicPlayer = new YT.Player('yt-player', {
        height: '0', width: '0', videoId: 'z8zgBvQ5JI4',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'z8zgBvQ5JI4' },
        events: { 'onReady': (e) => e.target.setVolume(10) }
    });
}
function playBackgroundMusic() {
    if (musicPlayer && typeof musicPlayer.playVideo === 'function') musicPlayer.playVideo();
}

const sfx = {
    flip: new Audio('assets/sounds/draw.mp3'),
    yes: new Audio('assets/sounds/steal.mp3'),
    no: new Audio('assets/sounds/error.mp3'),
    win: new Audio('assets/sounds/success.mp3')
};
Object.values(sfx).forEach(a => a.volume = 0.5);
function playSFX(name) {
    if (sfx[name]) { sfx[name].currentTime = 0; sfx[name].play().catch(() => {}); }
}

// ==========================================
// LES 25 PERSONNAGES (IMAGES : assets/1.png à assets/25.png)
// Tu peux modifier les noms ci-dessous si tu veux qu'ils collent à tes dessins
// ==========================================
const CHARACTERS = [
    { id: 1,  name: "Perso 1" },
    { id: 2,  name: "Perso 2" },
    { id: 3,  name: "Perso 3" },
    { id: 4,  name: "Perso 4" },
    { id: 5,  name: "Perso 5" },
    { id: 6,  name: "Perso 6" },
    { id: 7,  name: "Perso 7" },
    { id: 8,  name: "Perso 8" },
    { id: 9,  name: "Perso 9" },
    { id: 10, name: "Perso 10" },
    { id: 11, name: "Perso 11" },
    { id: 12, name: "Perso 12" },
    { id: 13, name: "Perso 13" },
    { id: 14, name: "Perso 14" },
    { id: 15, name: "Perso 15" },
    { id: 16, name: "Perso 16" },
    { id: 17, name: "Perso 17" },
    { id: 18, name: "Perso 18" },
    { id: 19, name: "Perso 19" },
    { id: 20, name: "Perso 20" },
    { id: 21, name: "Perso 21" },
    { id: 22, name: "Perso 22" },
    { id: 23, name: "Perso 23" },
    { id: 24, name: "Perso 24" },
    { id: 25, name: "Perso 25" }
];

function getAvatarHTML(c) {
    return `<img src="assets/${c.id}.png" alt="${c.name}" draggable="false">`;
}

// ==========================================
// MULTIJOUEUR PEERJS (1v1)
// ==========================================
let peerNet = null;
let guestConn = null;
let hostConn = null;
let isHost = false;
let myPlayerId = '';
let myPseudo = '';
let roomCode = 'QUI' + Math.floor(1000 + Math.random() * 9000);

// Copier le code du salon au clic
const myIdEl = document.getElementById('my-id');
if (myIdEl) {
    myIdEl.innerText = roomCode;
    myIdEl.style.cursor = 'pointer';
    myIdEl.title = 'Cliquez pour copier le code !';
    myIdEl.addEventListener('click', () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            myIdEl.style.color = '#39ff14';
            setTimeout(() => { myIdEl.style.color = '#0ff'; }, 600);
        });
    });
}

// État local du plateau (propre à chaque joueur)
let eliminatedIds = new Set();
let guessMode = false;

// État synchronisé (géré par l'Hôte)
let gameState = {
    started: false,
    players: {},       // { id: { pseudo, remaining } }
    secrets: {},       // { id: charId } (filtré avant envoi au client)
    mySecretId: null,  // rempli côté client
    order: [],         // [hostId, guestId]
    turnIndex: 0,
    phase: 'ASK',      // 'ASK' | 'ANSWER' | 'OVER'
    pendingQuestion: null,
    log: "En attente...",
    winnerId: null,
    overReason: "",
    revealedSecrets: null
};

// --- HÉBERGER ---
function hostGame() {
    myPseudo = document.getElementById('pseudo').value.trim() || "Hôte";
    myPlayerId = roomCode;
    isHost = true;
    playBackgroundMusic();

    if (peerNet) peerNet.destroy();
    peerNet = new Peer(roomCode);

    peerNet.on('open', () => {
        document.getElementById('status-text').innerText = "Salon ouvert ! En attente d'un adversaire...";
        gameState.players[myPlayerId] = { pseudo: myPseudo, remaining: CHARACTERS.length };
        gameState.order = [myPlayerId];
        document.getElementById('host-btn').style.display = 'none';
    });

    peerNet.on('connection', conn => {
        if (guestConn && guestConn.open) {
            conn.close(); // 1v1 uniquement
            return;
        }
        guestConn = conn;

        conn.on('data', data => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
            if (!data) return;

            if (data.type === 'JOIN') {
                conn.playerId = data.id;
                gameState.players[data.id] = { pseudo: data.pseudo, remaining: CHARACTERS.length };
                if (!gameState.order.includes(data.id)) gameState.order.push(data.id);
                document.getElementById('status-text').innerText = `${data.pseudo} a rejoint le salon !`;
                document.getElementById('start-net-btn').style.display = 'inline-block';
                broadcastState();
            } else if (data.type === 'ACTION') {
                handleAction(data);
            }
        });

        conn.on('close', () => {
            guestConn = null;
            if (gameState.started) {
                alert("Ton adversaire s'est déconnecté.");
                location.reload();
            } else {
                document.getElementById('status-text').innerText = "L'adversaire a quitté. En attente...";
                document.getElementById('start-net-btn').style.display = 'none';
            }
        });
    });
}

// --- REJOINDRE ---
function joinGame() {
    myPseudo = document.getElementById('pseudo').value.trim() || "Joueur";
    const targetCode = document.getElementById('join-id').value.trim().toUpperCase();
    if (!targetCode) return alert("Entre un code de salon !");

    myPlayerId = 'P' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('status-text').innerText = "Connexion à " + targetCode + "...";
    playBackgroundMusic();

    if (peerNet) peerNet.destroy();
    peerNet = new Peer(myPlayerId);

    peerNet.on('open', () => {
        hostConn = peerNet.connect(targetCode);
        hostConn.on('open', () => {
            document.getElementById('status-text').innerText = "Connecté ! En attente du lancement par l'Hôte.";
            hostConn.send(JSON.stringify({ type: 'JOIN', id: myPlayerId, pseudo: myPseudo }));
        });
        hostConn.on('data', data => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
            if (data && data.type === 'STATE_UPDATE') {
                if (data.resetBoard) resetLocalBoard();
                gameState = data.state;
                renderClient();
            }
        });
        hostConn.on('close', () => {
            alert("Connexion perdue avec l'Hôte.");
            location.reload();
        });
    });
}

// ==========================================
// MOTEUR DE JEU (HÔTE)
// ==========================================
function startGame() {
    if (!isHost || gameState.order.length < 2) return;

    resetLocalBoard();
    gameState.started = true;
    gameState.phase = 'ASK';
    gameState.pendingQuestion = null;
    gameState.winnerId = null;
    gameState.overReason = "";
    gameState.revealedSecrets = null;
    gameState.turnIndex = Math.floor(Math.random() * 2);

    // Tirer un personnage secret différent pour chaque joueur
    const shuffled = [...CHARACTERS].sort(() => Math.random() - 0.5);
    gameState.order.forEach((pId, idx) => {
        gameState.players[pId].remaining = CHARACTERS.length;
        gameState.secrets[pId] = shuffled[idx].id;
    });

    const firstPseudo = gameState.players[gameState.order[gameState.turnIndex]].pseudo;
    gameState.log = `🎲 Le duel commence ! C'est à ${firstPseudo} de poser une question.`;

    broadcastState(true);
}

function broadcastState(resetBoard = false) {
    if (!isHost) return;

    // Mise à jour côté Hôte
    gameState.mySecretId = gameState.secrets[myPlayerId];
    renderClient();

    // Envoi filtré à l'invité (il ne reçoit QUE son propre personnage secret)
    if (guestConn && guestConn.open && guestConn.playerId) {
        const safeState = JSON.parse(JSON.stringify(gameState));
        safeState.mySecretId = gameState.secrets[guestConn.playerId];
        delete safeState.secrets;
        guestConn.send(JSON.stringify({ type: 'STATE_UPDATE', state: safeState, resetBoard }));
    }
}

function handleAction(data) {
    if (!isHost) return;

    if (data.action === 'SYNC_COUNT') {
        if (gameState.players[data.playerId]) {
            gameState.players[data.playerId].remaining = data.remaining;
            broadcastState();
        }
        return;
    }

    if (data.action === 'ASK_QUESTION' && gameState.phase === 'ASK') {
        const asker = gameState.players[data.playerId];
        gameState.pendingQuestion = data.text;
        gameState.phase = 'ANSWER';
        gameState.log = `❓ ${asker.pseudo} demande : "${data.text}"`;
        broadcastState();
    }

    if (data.action === 'ANSWER_QUESTION' && gameState.phase === 'ANSWER') {
        const responder = gameState.players[data.playerId];
        const repText = data.answer ? "✅ OUI !" : "❌ NON !";
        playSFX(data.answer ? 'yes' : 'no');
        gameState.log = `💬 ${responder.pseudo} répond : ${repText} — "${gameState.pendingQuestion}"`;
        gameState.pendingQuestion = null;
        gameState.phase = 'ASK';
        gameState.turnIndex = (gameState.turnIndex + 1) % 2;
        broadcastState();
    }

    if (data.action === 'GUESS' && gameState.phase === 'ASK') {
        const guesserId = data.playerId;
        const oppId = gameState.order.find(id => id !== guesserId);
        const oppSecretId = gameState.secrets[oppId];
        const guessedChar = CHARACTERS.find(c => c.id === data.charId);
        const trueChar = CHARACTERS.find(c => c.id === oppSecretId);

        gameState.phase = 'OVER';
        gameState.revealedSecrets = { ...gameState.secrets };

        if (data.charId === oppSecretId) {
            gameState.winnerId = guesserId;
            gameState.overReason = `${gameState.players[guesserId].pseudo} a trouvé ${trueChar.name} !`;
        } else {
            gameState.winnerId = oppId;
            gameState.overReason = `${gameState.players[guesserId].pseudo} a tenté ${guessedChar.name}, mais c'était ${trueChar.name} !`;
        }
        playSFX('win');
        broadcastState();
    }
}

function sendAction(payload) {
    payload.type = 'ACTION';
    payload.playerId = myPlayerId;
    if (isHost) handleAction(payload);
    else if (hostConn && hostConn.open) hostConn.send(JSON.stringify(payload));
}

// ==========================================
// ACTIONS CLIENT & RENDU
// ==========================================
function resetLocalBoard() {
    eliminatedIds.clear();
    guessMode = false;
    document.getElementById('game-over-overlay').style.display = 'none';
}

function buildGrid() {
    const grid = document.getElementById('characters-grid');
    if (grid.children.length === CHARACTERS.length) return;
    grid.innerHTML = '';

    CHARACTERS.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.id = `char-${c.id}`;
        card.innerHTML = `${getAvatarHTML(c)}<div class="char-name">${c.name}</div>`;
        card.onclick = () => onCardClick(c.id);
        grid.appendChild(card);
    });
}

function onCardClick(charId) {
    if (gameState.phase === 'OVER') return;

    // Mode DEVINER : clic = tentative finale
    if (guessMode) {
        const char = CHARACTERS.find(c => c.id === charId);
        if (confirm(`Tenter de deviner ${char.name} ? (Si tu te trompes, tu perds la manche !)`)) {
            guessMode = false;
            sendAction({ action: 'GUESS', charId });
        }
        return;
    }

    // Mode normal : baisser ou relever la carte
    if (eliminatedIds.has(charId)) eliminatedIds.delete(charId);
    else eliminatedIds.add(charId);

    playSFX('flip');
    updateCardsVisual();
    sendAction({ action: 'SYNC_COUNT', remaining: CHARACTERS.length - eliminatedIds.size });
}

function updateCardsVisual() {
    const grid = document.getElementById('characters-grid');
    grid.classList.toggle('guessing', guessMode);

    CHARACTERS.forEach(c => {
        const el = document.getElementById(`char-${c.id}`);
        if (el) el.classList.toggle('eliminated', eliminatedIds.has(c.id));
    });
}

function fillQuestion(txt) {
    const input = document.getElementById('question-input');
    input.value = txt;
    input.focus();
}

function sendQuestion() {
    const input = document.getElementById('question-input');
    const text = input.value.trim();
    if (!text) return;
    guessMode = false;
    input.value = '';
    sendAction({ action: 'ASK_QUESTION', text });
}

function sendAnswer(boolVal) {
    sendAction({ action: 'ANSWER_QUESTION', answer: boolVal });
}

function toggleGuessMode() {
    guessMode = !guessMode;
    document.getElementById('btn-guess-mode').classList.toggle('active', guessMode);
    document.getElementById('btn-guess-mode').innerText = guessMode ? "✖ Annuler" : "🎯 Deviner";
    updateCardsVisual();
    renderTurnBadge();
}

function renderTurnBadge() {
    const badge = document.getElementById('turn-badge');
    const isMyTurn = (gameState.order[gameState.turnIndex] === myPlayerId);
    badge.className = '';

    if (guessMode) {
        badge.innerText = "🎯 CLIQUE SUR LE PERSONNAGE À DEVINER";
        badge.classList.add('guess-mode');
    } else if (gameState.phase === 'ASK') {
        badge.innerText = isMyTurn ? "⚡ C'EST TON TOUR" : "⏳ TOUR DE L'ADVERSAIRE";
        if (isMyTurn) badge.classList.add('my-turn');
    } else if (gameState.phase === 'ANSWER') {
        badge.innerText = isMyTurn ? "⏳ ATTENTE DE LA RÉPONSE..." : "❗ RÉPONDS À LA QUESTION";
        if (!isMyTurn) badge.classList.add('my-turn');
    }
}

function renderClient() {
    if (!gameState.started) return;

    document.getElementById('network-menu').style.display = 'none';
    document.getElementById('board-area').style.display = 'flex';
    buildGrid();
    updateCardsVisual();

    // Infos adversaire
    const oppId = gameState.order.find(id => id !== myPlayerId);
    if (oppId && gameState.players[oppId]) {
        document.getElementById('opp-name').innerText = gameState.players[oppId].pseudo;
        document.getElementById('opp-remaining').innerText = gameState.players[oppId].remaining;
    }

    // Mon personnage secret
    const myChar = CHARACTERS.find(c => c.id === gameState.mySecretId);
    if (myChar) {
        document.getElementById('my-secret-card').innerHTML = `
            ${getAvatarHTML(myChar)}
            <span class="secret-name">${myChar.name}</span>`;
    }

    document.getElementById('game-log').innerText = gameState.log;
    renderTurnBadge();

    // Gestion des panneaux du bas
    const isMyTurn = (gameState.order[gameState.turnIndex] === myPlayerId);
    const askPanel = document.getElementById('ask-panel');
    const answerPanel = document.getElementById('answer-panel');
    const waitPanel = document.getElementById('wait-panel');

    askPanel.style.display = 'none';
    answerPanel.style.display = 'none';
    waitPanel.style.display = 'none';

    if (gameState.phase === 'ASK') {
        if (isMyTurn) {
            askPanel.style.display = 'flex';
        } else {
            waitPanel.style.display = 'block';
            document.getElementById('wait-text').innerText = "L'adversaire réfléchit à sa question... (Tu peux trier tes cartes)";
        }
    } else if (gameState.phase === 'ANSWER') {
        if (!isMyTurn) {
            answerPanel.style.display = 'flex';
            document.getElementById('incoming-question').innerText = `❓ "${gameState.pendingQuestion}"`;
        } else {
            waitPanel.style.display = 'block';
            document.getElementById('wait-text').innerText = "En attente de la réponse OUI / NON de l'adversaire...";
        }
    } else if (gameState.phase === 'OVER') {
        const winner = gameState.players[gameState.winnerId];
        document.getElementById('winner-text').innerHTML =
            gameState.winnerId === myPlayerId
                ? `🏆 VICTOIRE !`
                : `💀 DÉFAITE (${winner.pseudo} gagne)`;
        document.getElementById('gameover-reason').innerText = gameState.overReason;

        // Révéler les deux personnages secrets
        const revealBox = document.getElementById('reveal-secrets');
        revealBox.innerHTML = '';
        if (gameState.revealedSecrets) {
            gameState.order.forEach(pId => {
                const c = CHARACTERS.find(ch => ch.id === gameState.revealedSecrets[pId]);
                if (c) {
                    revealBox.innerHTML += `
                        <div class="reveal-card">
                            <div style="color:var(--p1); font-weight:bold;">${gameState.players[pId].pseudo}</div>
                            ${getAvatarHTML(c)}
                            <div style="color:var(--p4); font-weight:bold; font-size:1.2rem;">${c.name}</div>
                        </div>`;
                }
            });
        }

        document.getElementById('btn-rematch').style.display = isHost ? 'inline-block' : 'none';
        document.getElementById('game-over-overlay').style.display = 'flex';
    }
}
