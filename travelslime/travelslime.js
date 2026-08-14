const countries = [
    'nederland', 'france', 'belgium', 'benin', 'sverige', 'deutschland', 
    'chile', 'brasil', 'norge', 'mexico', 'portugal', 'china', 'espana'
];

let peer = null;
let connections = [];
let isHost = false;
let myId = '';
let myPseudo = '';

// État global (Géré uniquement par l'Hôte)
let gameState = {
    players: {}, // id: { pseudo, hand, cardCount }
    order: [],
    deck: [],
    turnIndex: 0,
    started: false,
    message: "En attente de joueurs..."
};

// ---------------------------------------------------------
// FONCTIONS DE CONNEXION (LOBBY)
// ---------------------------------------------------------

function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function createGame() {
    myPseudo = document.getElementById('pseudo').value;
    if (!myPseudo) return alert("Mets un pseudo !");
    
    const roomCode = generateCode();
    myId = roomCode; // L'hôte utilise le code comme ID
    isHost = true;

    initPeer(roomCode);
    
    // Initialise l'état de l'hôte
    gameState.players[myId] = { pseudo: myPseudo, hand: [] };
    gameState.order.push(myId);

    showGameScreen(roomCode);
    document.getElementById('start-btn').style.display = 'inline-block';
}

function joinGame() {
    myPseudo = document.getElementById('pseudo').value;
    const roomCode = document.getElementById('room-code').value.toUpperCase();
    if (!myPseudo || !roomCode) return alert("Pseudo et Code requis !");
    
    myId = generateCode() + generateCode(); // ID aléatoire pour le client
    initPeer(myId, roomCode);
    showGameScreen(roomCode);
}

function initPeer(id, hostToConnectTo = null) {
    document.getElementById('status-msg').innerText = "Connexion en cours...";
    peer = new Peer('travelslime-' + id);

    peer.on('open', (id) => {
        if (hostToConnectTo) {
            // Si on est client, on se connecte à l'hôte
            const conn = peer.connect('travelslime-' + hostToConnectTo);
            conn.on('open', () => {
                connections.push(conn);
                conn.send({ type: 'JOIN', pseudo: myPseudo, id: myId });
                setupConnection(conn);
            });
        } else {
            document.getElementById('status-msg').innerText = "Salon créé !";
        }
    });

    // Si on est hôte, on écoute les nouvelles connexions
    peer.on('connection', (conn) => {
        if (isHost && !gameState.started) {
            connections.push(conn);
            setupConnection(conn);
        }
    });
}

function setupConnection(conn) {
    conn.on('data', (data) => {
        if (isHost) handleClientAction(data, conn);
        else handleHostUpdate(data);
    });
}

function showGameScreen(code) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('room-title').innerText = `Code du salon : ${code}`;
}

// ---------------------------------------------------------
// LOGIQUE DE L'HÔTE (Le "Serveur" local)
// ---------------------------------------------------------

function broadcastState() {
    if (!isHost) return;
    
    // On cache les mains des autres avant d'envoyer
    connections.forEach(conn => {
        let stateToSend = JSON.parse(JSON.stringify(gameState)); // Deep copy
        
        // On remplace les mains des adversaires par juste le nombre de cartes
        Object.keys(stateToSend.players).forEach(pId => {
            stateToSend.players[pId].cardCount = stateToSend.players[pId].hand.length;
            if (pId !== conn.peer.replace('travelslime-', '')) {
                stateToSend.players[pId].hand = []; 
            }
        });
        
        conn.send({ type: 'STATE_UPDATE', state: stateToSend });
    });

    // L'hôte met à jour son propre affichage
    renderGame(gameState);
}

function handleClientAction(data, conn) {
    if (data.type === 'JOIN') {
        gameState.players[data.id] = { pseudo: data.pseudo, hand: [] };
        gameState.order.push(data.id);
        gameState.message = `${data.pseudo} a rejoint la table.`;
        broadcastState();
    }
    
    if (data.type === 'ASK_CARD' && gameState.started) {
        processAction(data.askerId, data.targetId, data.country);
    }
    
    if (data.type === 'DRAW' && gameState.started) {
        processDraw(data.playerId);
    }
}

function startGame() {
    if (!isHost) return;
    gameState.started = true;
    document.getElementById('start-btn').style.display = 'none';
    
    // Créer et mélanger le paquet
    countries.forEach(country => {
        for (let i = 1; i <= 4; i++) {
            gameState.deck.push({ country, id: `${country}${i}` });
        }
    });
    gameState.deck.sort(() => Math.random() - 0.5);

    // Distribuer 5 cartes
    gameState.order.forEach(pId => {
        for(let i=0; i<5; i++) gameState.players[pId].hand.push(gameState.deck.pop());
    });

    gameState.message = "La partie commence !";
    broadcastState();
}

function processAction(askerId, targetId, country) {
    const target = gameState.players[targetId];
    const asker = gameState.players[askerId];

    const cardsToGive = target.hand.filter(c => c.country === country);
    
    if (cardsToGive.length > 0) {
        target.hand = target.hand.filter(c => c.country !== country);
        asker.hand.push(...cardsToGive);
        gameState.message = `${asker.pseudo} a volé les cartes ${country} de ${target.pseudo} ! Il rejoue.`;
    } else {
        gameState.message = `${target.pseudo} n'a pas de ${country} ! ${asker.pseudo} doit piocher.`;
        // Le joueur doit piocher, on ne passe pas le tour automatiquement ici 
        // pour lui laisser cliquer sur "Piocher dans le seau"
    }
    broadcastState();
}

function processDraw(playerId) {
    if (gameState.deck.length > 0) {
        const drawn = gameState.deck.pop();
        gameState.players[playerId].hand.push(drawn);
        gameState.message = `${gameState.players[playerId].pseudo} a pioché dans le seau.`;
    }
    gameState.turnIndex = (gameState.turnIndex + 1) % gameState.order.length;
    broadcastState();
}

// ---------------------------------------------------------
// LOGIQUE CLIENT / AFFICHAGE COMMUN
// ---------------------------------------------------------

function handleHostUpdate(data) {
    if (data.type === 'STATE_UPDATE') {
        gameState = data.state;
        renderGame(gameState);
    }
}

function renderGame(state) {
    document.getElementById('game-messages').innerText = state.message;
    document.getElementById('deck-count').innerText = state.deck.length;

    // Adversaires
    const oppArea = document.getElementById('opponents-area');
    const oppSelect = document.getElementById('opponent-select');
    oppArea.innerHTML = '';
    oppSelect.innerHTML = '';

    for (const [id, player] of Object.entries(state.players)) {
        if (id !== myId) {
            const count = player.cardCount || player.hand.length;
            oppArea.innerHTML += `<div class="opponent">${player.pseudo}<br>🃏 ${count}</div>`;
            oppSelect.innerHTML += `<option value="${id}">${player.pseudo}</option>`;
        }
    }

    // Ma main
    const myHandArea = document.getElementById('my-hand');
    const countrySelect = document.getElementById('country-select');
    myHandArea.innerHTML = '';
    countrySelect.innerHTML = '';

    const myHand = state.players[myId] ? state.players[myId].hand : [];
    const myCountries = new Set();

    myHand.forEach(card => {
        myCountries.add(card.country);
        // CHEMIN VERS TES ASSETS GITHUB
        const imgSrc = `assets/card/_${card.id}.png`; 
        myHandArea.innerHTML += `<div class="card" style="background-image: url('${imgSrc}')"></div>`;
    });

    myCountries.forEach(c => {
        countrySelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`;
    });

    // Tour de jeu
    if (state.started && state.order[state.turnIndex] === myId) {
        document.getElementById('action-area').style.display = 'block';
    } else {
        document.getElementById('action-area').style.display = 'none';
    }
}

// Actions des joueurs (Liés aux boutons HTML)
function askCard() {
    const country = document.getElementById('country-select').value;
    const targetId = document.getElementById('opponent-select').value;
    
    if (isHost) processAction(myId, targetId, country);
    else connections[0].send({ type: 'ASK_CARD', askerId: myId, targetId, country });
}

function drawFromBucket() {
    if (isHost) processDraw(myId);
    else connections[0].send({ type: 'DRAW', playerId: myId });
}
