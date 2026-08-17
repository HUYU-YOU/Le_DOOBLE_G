// ==========================================
// ANIMATIONS ET UI
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
    if (!settingsBtnImg.src.includes('settings4.png')) { settingsBtnImg.src = '../img/setting.png'; }
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
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        container.classList.add('size-classic'); document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        container.classList.add('size-wide'); document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        container.classList.add('size-full'); document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
}

function autoFullscreen() { if (!document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide'); }
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide'); });

// ==========================================
// MUSIQUE YOUTUBE
// ==========================================

let musicPlayer;
function onYouTubeIframeAPIReady() {
    musicPlayer = new YT.Player('yt-player', {
        height: '0', width: '0', videoId: 'z8zgBvQ5JI4',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'z8zgBvQ5JI4' },
        events: { 'onReady': (event) => { event.target.setVolume(10); } }
    });
}
function playBackgroundMusic() {
    if (musicPlayer && typeof musicPlayer.playVideo === 'function') {
        musicPlayer.playVideo();
    }
}

// ==========================================
// LOGIQUE MULTIJOUEUR ET JEU (PEERJS)
// ==========================================

const countriesList = [
    'nederland', 'france', 'belgium', 'benin', 'sverige', 'deutschland', 
    'chile', 'brasil', 'norge', 'mexico', 'portugal', 'china', 'espana'
];

let peerNet = null;
let hostConn = null; // Connexion du guest vers l'hôte
let isHost = false;
let myPlayerId = '';
let myPseudo = '';
let roomCode = 'TRA' + Math.floor(1000 + Math.random() * 9000);

// --- COPIER LE CODE DU SALON ---
const myIdEl = document.getElementById('my-id');
if (myIdEl) {
    myIdEl.innerText = roomCode;
    myIdEl.style.cursor = 'pointer';
    myIdEl.title = 'Cliquez pour copier le code !';
    myIdEl.addEventListener('click', () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            let oldColor = myIdEl.style.color;
            myIdEl.style.color = '#39ff14';
            setTimeout(() => { myIdEl.style.color = oldColor; }, 500);
        });
    });
}

let gameState = {
    players: {}, 
    order: [],
    deck: [],
    turnIndex: 0,
    started: false,
    log: "La partie va bientôt commencer..."
};

// --- CONNEXION (HÔTE) ---
function hostGame() {
    myPseudo = document.getElementById('pseudo').value.trim() || "Hôte";
    myPlayerId = roomCode;
    isHost = true;
    playBackgroundMusic(); 
    
    if(peerNet) peerNet.destroy();
    peerNet = new Peer(roomCode);
    
    peerNet.on('open', id => {
        document.getElementById('status-text').innerText = "Salon ouvert ! Code cliquable au-dessus.";
        
        let assignedSkin = 1;
        gameState.players[myPlayerId] = { pseudo: myPseudo, hand: [], score: 0, skin: assignedSkin };
        gameState.order.push(myPlayerId);
        
        document.getElementById('host-btn').style.display = 'none';
        document.getElementById('start-net-btn').style.display = 'inline-block';
    });

    peerNet.on('connection', conn => {
        // ENREGISTREMENT BLINDÉ : L'ID est directement injecté par l'invité à la connexion
        if (conn.metadata && conn.metadata.id) {
            let guestId = conn.metadata.id;
            if (!gameState.players[guestId]) {
                let assignedSkin = (gameState.order.length % 8) + 1;
                gameState.players[guestId] = { pseudo: conn.metadata.pseudo, hand: [], score: 0, skin: assignedSkin };
                gameState.order.push(guestId);
            }
        }

        conn.on('open', () => {
            broadcastState(); 
        });

        conn.on('data', data => {
            // Lecture sécurisée du JSON texte
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
            
            if (data && data.type === 'ACTION') {
                handleGameAction(data);
            }
        });

        conn.on('close', () => {
            let pId = conn.metadata ? conn.metadata.id : null;
            if (pId && gameState.started && gameState.players[pId]) {
                let p = gameState.players[pId];
                gameState.log = `🔌 ${p.pseudo} s'est déconnecté.`;
                
                if (p.hand.length > 0) {
                    gameState.deck.push(...p.hand);
                    gameState.deck.sort(() => Math.random() - 0.5); 
                }
                
                let pIdx = gameState.order.indexOf(pId);
                if(pIdx !== -1) {
                    gameState.order.splice(pIdx, 1);
                    if(gameState.turnIndex >= pIdx && gameState.turnIndex > 0) gameState.turnIndex--;
                    if(gameState.turnIndex >= gameState.order.length) gameState.turnIndex = 0;
                }
                delete gameState.players[pId];
                
                if(gameState.order.length < 2) {
                    document.getElementById('table-area').style.display = 'none';
                    document.getElementById('winner-text').innerText = "PARTIE ANNULÉE";
                    document.getElementById('game-over-overlay').style.display = 'flex';
                } else {
                    broadcastState();
                }
            }
        });
    });
}

// --- CONNEXION (INVITÉ) ---
function joinGame() {
    myPseudo = document.getElementById('pseudo').value.trim() || "Joueur";
    const targetCode = document.getElementById('join-id').value.trim().toUpperCase();
    if (!targetCode) return alert("Il faut un code !");
    
    myPlayerId = 'P' + Math.floor(Math.random() * 10000);
    document.getElementById('status-text').innerText = "Connexion à " + targetCode + "...";
    playBackgroundMusic(); 
    
    if (peerNet) peerNet.destroy();
    peerNet = new Peer(myPlayerId);

    peerNet.on('open', () => {
        // Envoi de la "carte d'identité" (metadata) dès la connexion pour éviter les bugs
        hostConn = peerNet.connect(targetCode, { 
            metadata: { id: myPlayerId, pseudo: myPseudo } 
        });
        
        hostConn.on('open', () => {
            document.getElementById('status-text').innerText = "Connecté ! En attente de l'Hôte.";
        });

        hostConn.on('data', data => {
            // Lecture sécurisée du JSON texte
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
            
            if (data && data.type === 'STATE_UPDATE') {
                if(data.state.started && !gameState.started) {
                    document.getElementById('network-menu').style.display = 'none';
                    document.getElementById('table-area').style.display = 'flex';
                    document.getElementById('my-name-display').innerText = myPseudo;
                }
                gameState = data.state;
                renderGameClient(); 
            }
        });
    });
}

// --- MOTEUR DE JEU (HÔTE) ---
function startGame() {
    if (!isHost) return;
    document.getElementById('network-menu').style.display = 'none';
    document.getElementById('table-area').style.display = 'flex';
    document.getElementById('my-name-display').innerText = myPseudo;

    gameState.started = true;
    countriesList.forEach(c => { for(let i=1; i<=4; i++) gameState.deck.push({ country: c, value: i, id: `${c}${i}` }); });
    gameState.deck.sort(() => Math.random() - 0.5);

    gameState.order.forEach(pId => {
        for(let i=0; i<5; i++) if(gameState.deck.length > 0) gameState.players[pId].hand.push(gameState.deck.pop());
    });

    gameState.log = "La partie commence ! C'est à " + gameState.players[gameState.order[0]].pseudo + " de jouer.";
    broadcastState();
}

function broadcastState() {
    if (!isHost) return;
    try { checkFamiliesCompleted(); } catch(e) {}
    renderGameClient();

    // MOTEUR D'ENVOI BLINDÉ : On utilise des textes (String) au lieu d'objets complexes pour éviter les plantages de PeerJS
    if (peerNet && peerNet.connections) {
        Object.values(peerNet.connections).forEach(conns => {
            conns.forEach(conn => {
                if (conn.open) {
                    try {
                        let safeState = JSON.parse(JSON.stringify(gameState));
                        Object.keys(safeState.players).forEach(targetId => {
                            safeState.players[targetId].cardCount = safeState.players[targetId].hand.length;
                            // Masquage des mains adverses
                            if (conn.metadata && targetId !== conn.metadata.id) {
                                safeState.players[targetId].hand = []; 
                            }
                        });
                        // COMPRESSION EN TEXTE POUR L'ENVOI
                        conn.send(JSON.stringify({ type: 'STATE_UPDATE', state: safeState }));
                    } catch(e) { console.error(e); }
                }
            });
        });
    }
}

function passTurn() {
    checkEmptyHands();
    
    let attempts = 0;
    do {
        gameState.turnIndex = (gameState.turnIndex + 1) % gameState.order.length;
        let nextId = gameState.order[gameState.turnIndex];
        if (gameState.players[nextId] && gameState.players[nextId].hand.length > 0) break;
        attempts++;
    } while (attempts < gameState.order.length);

    let nextPlayer = gameState.players[gameState.order[gameState.turnIndex]];
    gameState.log += `\n➡️ C'est au tour de ${nextPlayer.pseudo}.`;

    broadcastState();
}

function handleGameAction(data) {
    if (data.action === 'PASS') {
        gameState.log = `⏭️ ${gameState.players[data.askerId].pseudo} passe son tour.`;
        passTurn();
        return;
    }

    if (data.action === 'ASK') {
        const asker = gameState.players[data.askerId];
        const target = gameState.players[data.targetId];
        const country = data.country;

        if (!asker || !target) return;

        const cardsToSteal = target.hand.filter(c => c.country === country);
        
        if (cardsToSteal.length > 0) {
            target.hand = target.hand.filter(c => c.country !== country);
            asker.hand.push(...cardsToSteal);
            gameState.log = `⚡ ${asker.pseudo} a volé les cartes ${country.toUpperCase()} de ${target.pseudo} ! Il rejoue.`;
            broadcastState(); 
        } else {
            if (gameState.deck.length > 0) {
                let drawn = gameState.deck.pop();
                asker.hand.push(drawn);
                gameState.log = `❌ Raté ! ${target.pseudo} n'a pas de ${country.toUpperCase()}.\n🪣 ${asker.pseudo} pioche.`;
            } else {
                gameState.log = `❌ Raté ! ${target.pseudo} n'a pas la carte et le seau est vide.`;
            }
            passTurn();
        }
    }
}

function checkEmptyHands() {
    Object.values(gameState.players).forEach(p => {
        if (p.hand.length === 0 && gameState.deck.length > 0) {
            let drawCount = Math.min(3, gameState.deck.length);
            for(let i=0; i<drawCount; i++) p.hand.push(gameState.deck.pop());
            gameState.log += `\n🃏 Main vide : ${p.pseudo} pioche ${drawCount} cartes !`;
        }
    });
}

function checkFamiliesCompleted() {
    Object.values(gameState.players).forEach(player => {
        let countryCounts = {};
        player.hand.forEach(c => { countryCounts[c.country] = (countryCounts[c.country] || 0) + 1; });

        Object.keys(countryCounts).forEach(country => {
            if (countryCounts[country] === 4) {
                player.hand = player.hand.filter(c => c.country !== country);
                player.score += 1;
                gameState.log = `🌟 INCROYABLE ! ${player.pseudo} a réuni la famille ${country.toUpperCase()} !`;
                checkEmptyHands();
            }
        });
    });
    
    let totalCardsInPlay = gameState.deck.length + Object.values(gameState.players).reduce((acc, p) => acc + p.hand.length, 0);
    if (totalCardsInPlay === 0 && gameState.started) {
        document.getElementById('table-area').style.display = 'none';
        
        let winner = ""; let maxScore = -1;
        Object.values(gameState.players).forEach(p => {
            if(p.score > maxScore) { maxScore = p.score; winner = p.pseudo; }
        });
        
        document.getElementById('winner-text').innerHTML = `VICTOIRE DE<br><span style="color:var(--p1)">${winner}</span><br>AVEC ${maxScore} FAMILLES !`;
        document.getElementById('game-over-overlay').style.display = 'flex';
    }
}

// --- AFFICHAGE ET ACTIONS CLIENT ---
function renderGameClient() {
    document.getElementById('deck-count').innerText = gameState.deck.length;
    document.getElementById('game-log').innerText = gameState.log;
    
    const isMyTurn = (gameState.order[gameState.turnIndex] === myPlayerId);
    document.getElementById('action-panel').style.display = isMyTurn ? 'block' : 'none';

    const topArea = document.getElementById('top-opponents');
    const leftArea = document.getElementById('left-opponents');
    const rightArea = document.getElementById('right-opponents');
    const oppSelect = document.getElementById('opponent-select');
    
    topArea.innerHTML = ''; leftArea.innerHTML = ''; rightArea.innerHTML = ''; oppSelect.innerHTML = '';

    let opponents = Object.keys(gameState.players).filter(id => id !== myPlayerId);
    let distribution = [topArea, leftArea, rightArea, topArea, leftArea, rightArea, topArea];

    opponents.forEach((id, index) => {
        let p = gameState.players[id];
        let count = p.cardCount !== undefined ? p.cardCount : p.hand.length;
        let isHisTurn = (gameState.order[gameState.turnIndex] === id);
        
        let oppHtml = `
            <div class="opponent-hud ${isHisTurn ? 'active-turn' : ''}">
                <img src="assets/skins/slime${p.skin}.png" class="slime-avatar" alt="Slime">
                <div style="font-weight:bold; color:var(--p1); text-shadow:0 2px 4px rgba(0,0,0,0.8);">${p.pseudo}</div>
                <div class="opp-hand">
                    <div class="mini-back"></div>
                    <span>x${count}</span>
                </div>
                <div style="font-size:0.8em; color:var(--p3); margin-top:2px;">⭐ ${p.score}</div>
            </div>`;
        
        let targetZone = distribution[index % distribution.length];
        targetZone.innerHTML += oppHtml;
        
        oppSelect.innerHTML += `<option value="${id}">${p.pseudo}</option>`;
    });

    if (gameState.players[myPlayerId]) {
        document.getElementById('my-score-display').innerText = gameState.players[myPlayerId].score;
        let myAvatar = document.getElementById('my-avatar');
        if(myAvatar) myAvatar.src = `assets/skins/slime${gameState.players[myPlayerId].skin}.png`;
    }

    const myHandArea = document.getElementById('my-hand');
    const countrySelect = document.getElementById('country-select');
    myHandArea.innerHTML = ''; countrySelect.innerHTML = '';

    let myHand = gameState.players[myPlayerId] ? gameState.players[myPlayerId].hand : [];

    myHand.forEach(card => {
        let imgSrc = `assets/card/${card.id}.png`; 
        myHandArea.innerHTML += `<div class="card" style="background-image: url('${imgSrc}')" title="${card.country.toUpperCase()}"></div>`;
    });

    // CAHIER DES CHARGES: On affiche absolument tous les pays existants du jeu !
    countriesList.forEach(c => { 
        countrySelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`; 
    });

    let btn = document.querySelector('#action-panel .red');
    if(btn) {
        btn.disabled = (opponents.length === 0);
        
        if (isMyTurn) {
            // Sécurité anti-blocage : Si le joueur n'a plus de carte dans un seau vide, il peut passer
            if (myHand.length === 0) {
                btn.innerText = "Passer";
                btn.disabled = false;
                btn.onclick = () => {
                    let actionData = { type: 'ACTION', action: 'PASS', askerId: myPlayerId };
                    if (isHost) handleGameAction(actionData);
                    else if (hostConn && hostConn.open) hostConn.send(JSON.stringify(actionData));
                };
            } else if (!btn.disabled) {
                btn.innerText = "Voler !";
                btn.onclick = askCard;
            }
        }
    }
}

function askCard() {
    const country = document.getElementById('country-select').value;
    const targetId = document.getElementById('opponent-select').value;
    if(!country || !targetId) return;

    let actionData = { type: 'ACTION', action: 'ASK', askerId: myPlayerId, targetId: targetId, country: country };
    
    if (isHost) {
        handleGameAction(actionData);
    } else {
        // Envoi de la donnée en texte pour ne pas faire planter PeerJS
        if (hostConn && hostConn.open) {
            hostConn.send(JSON.stringify(actionData));
        }
    }
}
