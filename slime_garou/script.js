// Empêcher le swipe par défaut sur certains éléments (tactile)
document.addEventListener('touchstart', (e) => {
    if(e.target.closest('.no-swipe')) { e.stopPropagation(); }
}, {passive: false});

// ==========================================
// GESTION AUDIO & VIDEO
// ==========================================
let ytPlayer;
let currentBgm = 'night';
let audioStarted = false;

const YOUTUBE_NIGHT = '3ecxZy8luDg'; 
const YOUTUBE_DAY = 'vyg5jJrZ42s';   

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '0', width: '0', videoId: YOUTUBE_NIGHT,
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1 },
        events: {
            'onReady': (event) => { event.target.setVolume(5); },
            'onStateChange': (event) => { if (event.data === YT.PlayerState.ENDED) ytPlayer.playVideo(); }
        }
    });
};

function initAudio() {
    if (audioStarted) return;
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo(); audioStarted = true;
    }
}

function setMediaEnvironment(type) {
    if (currentBgm === type) return; 
    currentBgm = type;
    const video = document.getElementById('bg-video');
    
    video.style.opacity = 0;
    setTimeout(() => {
        if (type === 'day') {
            video.src = 'img/backgroundday.mp4';
            if(ytPlayer) ytPlayer.loadVideoById({videoId: YOUTUBE_DAY});
        } else {
            video.src = 'img/backgroundnight.mp4';
            if(ytPlayer) ytPlayer.loadVideoById({videoId: YOUTUBE_NIGHT});
        }
        video.load(); 
        let playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => { console.warn("Autoplay prevented:", error); });
        }
        video.style.opacity = 0.6; 
    }, 500); 
}

// ==========================================
// DICTIONNAIRE MULTILINGUE 
// ==========================================
const i18n = {
    fr: {
        roles: {
            werewolf: { name: "Slime-Garou", desc: "Dévore un joueur chaque nuit.", img: "img/garou.png", color: "var(--neon-pink)" },
            seer: { name: "Voyante", desc: "Scanne l'identité d'un joueur la nuit.", img: "img/voyante.png", color: "var(--neon-cyan)" },
            witch: { name: "Sorcière", desc: "Possède une potion de soin et une de poison.", img: "img/sorciere.png", color: "var(--neon-purple)" },
            hunter: { name: "Chasseur", desc: "Si tu meurs, tu tires sur un joueur.", img: "img/chasseur.png", color: "var(--neon-yellow)" },
            cupid: { name: "Cupidon", desc: "Désigne deux amoureux la première nuit.", img: "img/cupidon.png", color: "#ff69b4" },
            villager: { name: "Slime Civil", desc: "Trouve et élimine les infectés le jour.", img: "img/slime.png", color: "var(--neon-green)" }
        },
        ui: {
            menuTitle: "Connexion", btnCreate: "Créer une partie", btnJoin: "Rejoindre",
            configTitle: "Configuration", shareText: "Partagez ce code :",
            playersConnected: "Joueurs connectés :", dictLang: "Langue du jeu",
            cfgWolves: "Nb Garous :", roleSeer: "Voyante", roleWitch: "Sorcière", roleCupid: "Cupidon", roleHunter: "Chasseur",
            waitingMinPlayers: "(En attente d'au moins 3 joueurs)",
            btnStart: "Lancer la partie", waitingHost: "En attente du lancement...",
            actionInterface: "Actions", waiting: "Vote enregistré. En attente...", dead: "VOUS ÊTES MORT. Connexion rompue.",
            sleep: "Ferme les yeux, le village s'endort...",
            selectTarget: "Choisissez une cible :", healMsg: "Ressusciter", poisonMsg: "Empoisonner", skipMsg: "Passer",
            loversLinked: "Tu es lié(e) à :", wwChatTitle: "Canal Sécurisé : Loups",
            globalChatTitle: "Chat Général", btnSend: "Envoyer", btnReplay: "Rejouer"
        },
        phases: {
            night_cupid: "[Nuit] Cupidon se réveille...", night_seer: "[Nuit] Voyante...", night_wolves: "[Nuit] Garous...", night_witch: "[Nuit] Sorcière...",
            day_vote: "[Jour] Débattez et votez (5 min).", day_hunter: "⚠️ Le Chasseur ({0}) épaule son arme..."
        },
        sys: {
            hunterShoot: "PAN ! Le Chasseur emporte {0}.", loversDie: "L'amour brise le coeur de {0}.", noDeath: "Aucun mort ce matin.",
            deathList: "Code mort ce matin: {0}", timeOut: "Le temps est écoulé sans vote.", lynched: "Le village a lynché : {0}",
            vision: "[VISION] {0} est {1}", gameInit: "Partie Initialisée."
        }
    },
    en: {
        roles: {
            werewolf: { name: "Werewolf", desc: "Devour a player every night.", img: "img/werewolf.png", color: "var(--neon-pink)" },
            seer: { name: "Seer", desc: "Scan a player's identity at night.", img: "img/seer.png", color: "var(--neon-cyan)" },
            witch: { name: "Witch", desc: "Has one heal and one poison potion.", img: "img/witch.png", color: "var(--neon-purple)" },
            hunter: { name: "Hunter", desc: "If you die, you shoot a player.", img: "img/hunter.png", color: "var(--neon-yellow)" },
            cupid: { name: "Cupid", desc: "Link two lovers on the first night.", img: "img/cupid.png", color: "#ff69b4" },
            villager: { name: "Villager", desc: "Find and eliminate the infected by day.", img: "img/villager.png", color: "var(--neon-green)" }
        },
        ui: {
            menuTitle: "Connection", btnCreate: "Create Game", btnJoin: "Join",
            configTitle: "Configuration", shareText: "Share this code:",
            playersConnected: "Player connected:", dictLang: "Language",
            cfgWolves: "Werewolves:", roleSeer: "Seer", roleWitch: "Witch", roleCupid: "Cupid", roleHunter: "Hunter",
            waitingMinPlayers: "(Waiting for at least 3 players)",
            btnStart: "Start Game", waitingHost: "Waiting for host...",
            actionInterface: "Action", waiting: "Vote saved. Waiting...", dead: "YOU ARE DEAD. Connection lost.",
            sleep: "Close your eyes, village sleeps...",
            selectTarget: "Select a target:", healMsg: "Heal", poisonMsg: "Poison", skipMsg: "Skip",
            loversLinked: "You are bound to:", wwChatTitle: "Secure Channel: Wolves",
            globalChatTitle: "Global Chat", btnSend: "Send", btnReplay: "Play Again"
        },
        phases: {
            night_cupid: "[Night] Cupid wakes up...", night_seer: "[Night] Seer...", night_wolves: "[Night] Werewolves...", night_witch: "[Night] Witch...",
            day_vote: "[Day] Debate and vote (5 min).", day_hunter: "⚠️ The Hunter ({0}) aims their weapon..."
        },
        sys: {
            hunterShoot: "BANG! The Hunter takes {0}.", loversDie: "Love breaks the heart of {0}.", noDeath: "No deaths this morning.",
            deathList: "Casualties this morning: {0}", timeOut: "Time is up without a vote.", lynched: "The village lynched: {0}",
            vision: "[VISION] {0} is {1}", gameInit: "Game Initialized."
        }
    }
};

let currentLang = 'fr';
function t(category, key, ...args) {
    let text = "";
    if (i18n[currentLang] && i18n[currentLang][category] && i18n[currentLang][category][key]) {
        text = i18n[currentLang][category][key];
    } else { return key; }
    args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
    return text;
}

function updateLang(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    document.querySelectorAll('.ui-text').forEach(el => {
        const key = el.getAttribute('data-key');
        if (i18n[lang].ui[key]) el.innerText = i18n[lang].ui[key];
    });
    if (myRole) setupRoleUI(myRole);
    if (gameState.phase !== 'lobby' && gameState.phase) {
        let arg = gameState.phase === 'day_hunter' && gameState.pendingHunter ? getName(gameState.pendingHunter) : "";
        document.getElementById('phase-title').innerText = t('phases', gameState.phase, arg);
    }
}

document.getElementById('lang-fr').addEventListener('click', () => updateLang('fr'));
document.getElementById('lang-en').addEventListener('click', () => updateLang('en'));

// ==========================================
// VARIABLES GLOBALES & RÉSEAU
// ==========================================
let peer = null; let myId = null; let connections = []; let clientPlayers = []; 
let wolfPartners = []; let isHost = false; let myName = "Hôte"; let myRole = "";
let witchPotions = { heal: 1, poison: 1 }; let firstNight = true; let phaseTimer = null; 

const menuDiv = document.getElementById('menu'); const lobbyDiv = document.getElementById('lobby'); const gameArea = document.getElementById('game-area');
let cupidTargets = []; 

function addSysLog(sysKey, ...args) {
    const msg = t('sys', sysKey, ...args);
    const chatBox = document.getElementById('global-chat-messages');
    chatBox.innerHTML += `<p><span class="sys-log-msg">> ${msg}</span></p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function broadcastSysLog(sysKey, ...args) {
    addSysLog(sysKey, ...args);
    broadcast({ type: 'sys_log', key: sysKey, args: args });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function initPeer(callback, customId = null) {
    peer = customId ? new Peer(customId) : new Peer();
    peer.on('open', (id) => { if(callback) callback(id); });
    peer.on('error', (err) => { 
        if (err.type === 'unavailable-id') alert("Ce code serveur existe déjà.");
        else alert("Erreur Réseau : " + err); 
    });
}

function broadcast(data) {
    if (data.type === 'phase_change') {
        data.players = connections.map(c => ({ id: c.id, name: c.name, isAlive: c.isAlive }));
    }
    connections.forEach(c => { if(!c.isHost && c.conn && c.conn.open) c.conn.send(data); });
}

function getName(id) {
    const list = isHost ? connections : clientPlayers;
    const p = list.find(c => c.id === id);
    return p ? p.name : id;
}

document.getElementById('btn-create').addEventListener('click', () => {
    initAudio(); isHost = true;
    myName = document.getElementById('player-name').value.trim() || "Agent_" + Math.floor(Math.random()*100);
    menuDiv.style.display = 'none'; lobbyDiv.style.display = 'block';
    document.getElementById('host-config').style.display = 'block';
    
    const roomId = 'GAR' + Math.floor(1000 + Math.random() * 9000);

    initPeer((id) => { 
        myId = 'host'; 
        connections.push({ isHost: true, name: myName, role: null, isAlive: true, id: myId });
        updatePlayerListUI(); document.getElementById('my-id').innerText = id; 
    }, roomId);

    peer.on('connection', (conn) => {
        conn.on('data', (data) => {
            if (data.type === 'join') {
                connections.push({ conn: conn, name: data.name, role: null, isAlive: true, id: conn.peer });
                updatePlayerListUI();
                broadcast({ type: 'lobby_update', count: connections.length, list: connections.map(c => ({id: c.id, name: c.name})) });
                if (connections.length >= 3) {
                    document.getElementById('btn-start').style.display = 'block';
                    document.getElementById('min-players-msg').style.display = 'none';
                }
            } 
            else if (data.type === 'action' || data.type === 'ww_chat' || data.type === 'global_chat') {
                handleNetworkAction(conn.peer, data);
            }
        });
    });
});

document.getElementById('btn-join').addEventListener('click', () => {
    initAudio(); 
    const hostId = document.getElementById('join-id').value.trim().toUpperCase();
    myName = document.getElementById('player-name').value.trim() || "Agent_" + Math.floor(Math.random()*100);
    if(!hostId) { alert("Veuillez entrer un code."); return; }
    menuDiv.style.display = 'none'; lobbyDiv.style.display = 'block';
    document.getElementById('waiting-host-msg').style.display = 'block'; 
    document.getElementById('my-id').innerText = hostId;

    initPeer((id) => {
        myId = id; 
        const conn = peer.connect(hostId);
        conn.on('open', () => {
            connections.push({conn: conn}); 
            conn.send({ type: 'join', name: myName });
        });
        conn.on('data', (data) => {
            if (data.type === 'lobby_update') { generatePlayerBadges(data.list.map(obj => obj.name)); clientPlayers = data.list.map(obj => ({ id: obj.id, name: obj.name, isAlive: true })); }
            else if (data.type === 'game_start') { lobbyDiv.style.display = 'none'; gameArea.style.display = 'block'; if (data.extra && data.extra.wolves) wolfPartners = data.extra.wolves; setupRoleUI(data.role); addSysLog('gameInit'); }
            else if (data.type === 'phase_change') { if (data.players) clientPlayers = data.players; updateClientUI(data.phase, data.extra); }
            else if (data.type === 'sys_log') { addSysLog(data.key, ...data.args); }
            else if (data.type === 'seer_result') { 
                const translatedRole = i18n[currentLang].roles[data.roleFound].name; const msg = t('sys', 'vision', getName(data.target), translatedRole); addSysLog('vision', getName(data.target), translatedRole);
                document.getElementById('action-panel').innerHTML = `<p style="color:var(--neon-cyan); font-size: 1.2rem; font-weight:bold;">${msg}</p>`;
            }
            else if (data.type === 'lovers_linked') { const loveInfo = document.getElementById('lovers-info'); loveInfo.style.display = 'block'; loveInfo.innerText = `${i18n[currentLang].ui.loversLinked} ${data.partner}`; }
            else if (data.type === 'game_over') { showGameOver(data.winner, data.desc); }
            else if (data.type === 'timer_tick') { updateTimerUI(data.time); }
            else if (data.type === 'ww_chat_recv') { displayWWChat(data.sender, data.text); }
            else if (data.type === 'global_chat_recv') { displayGlobalChat(data.sender, data.text); }
            else if (data.type === 'reset_game') { resetClientToLobby(); }
        });
    });
});

function updatePlayerListUI() { generatePlayerBadges(connections.map(c => c.name)); }
function generatePlayerBadges(namesList) {
    const container = document.getElementById('players-list-container');
    container.innerHTML = namesList.map(n => `<span class="player-badge">${n}</span>`).join('');
}
function updateTimerUI(timeLeft) {
    const timerEl = document.getElementById('timer-display');
    timerEl.innerText = formatTime(timeLeft);
    timerEl.style.display = timeLeft > 0 ? 'block' : 'none';
}

// ==========================================
// DISTRIBUTION DES RÔLES & JEU
// ==========================================
document.getElementById('btn-start').addEventListener('click', () => {
    const numPlayers = connections.length;
    const nbWolves = parseInt(document.getElementById('cfg-wolves').value);
    let roles = [];
    for(let i=0; i<nbWolves; i++) { if (roles.length < numPlayers) roles.push('werewolf'); }
    let specialRoles = [];
    if (document.getElementById('cfg-seer').checked) specialRoles.push('seer');
    if (document.getElementById('cfg-witch').checked) specialRoles.push('witch');
    if (document.getElementById('cfg-cupid').checked) specialRoles.push('cupid');
    if (document.getElementById('cfg-hunter').checked) specialRoles.push('hunter');
    
    specialRoles.sort(() => Math.random() - 0.5);
    for (let role of specialRoles) { if (roles.length < numPlayers) roles.push(role); }
    while(roles.length < numPlayers) { roles.push('villager'); }
    roles.sort(() => Math.random() - 0.5);

    document.getElementById('global-chat-messages').innerHTML = ""; 
    document.getElementById('ww-chat-messages').innerHTML = ""; 
    
    connections.forEach((c, index) => { c.role = roles[index]; });
    connections.forEach((c) => {
        if(c.isHost) { lobbyDiv.style.display = 'none'; gameArea.style.display = 'block'; setupRoleUI(c.role); } 
        else {
            let extraData = {}; if (c.role === 'werewolf') extraData.wolves = connections.filter(w => w.role === 'werewolf').map(w => w.id);
            c.conn.send({ type: 'game_start', role: c.role, extra: extraData });
        }
    });
    setTimeout(() => startNightPhase(), 2000); 
});

let gameState = { phase: 'lobby', votes: {}, deadTonight: [], lovers: [], pendingHunter: null, nextPhaseAfterHunter: null };

function killPlayer(targetId) {
    if(!gameState.deadTonight.includes(targetId)) {
        gameState.deadTonight.push(targetId);
        const p = connections.find(c => c.id === targetId);
        if(p && p.role === 'hunter') gameState.pendingHunter = targetId;
        if(gameState.lovers.includes(targetId)) {
            const partnerId = gameState.lovers.find(l => l !== targetId);
            if(partnerId && !gameState.deadTonight.includes(partnerId)) {
                broadcastSysLog('loversDie', getName(partnerId)); killPlayer(partnerId); 
            }
        }
    }
}

function checkWinCondition() {
    const alive = connections.filter(c => c.isAlive);
    const wolves = alive.filter(c => c.role === 'werewolf');
    const others = alive.filter(c => c.role !== 'werewolf');
    
    let winner = null, desc = "";
    if (alive.length === 2 && gameState.lovers.includes(alive[0].id) && gameState.lovers.includes(alive[1].id)) { winner = "AMOUR TRIOMPHANT"; desc = "Seuls les amoureux ont survécu."; } 
    else if (wolves.length === 0) { winner = "VICTOIRE DU VILLAGE"; desc = "Tous les infectés ont été purgés."; } 
    else if (wolves.length >= others.length) { winner = "DOMINATION GAROU"; desc = "Le village est tombé."; }

    if (winner) {
        clearInterval(phaseTimer); broadcast({ type: 'timer_tick', time: 0 }); updateTimerUI(0);
        broadcast({ type: 'game_over', winner: winner, desc: desc }); showGameOver(winner, desc);
        return true; 
    }
    return false;
}

function processDeathsAndContinue(nextPhaseFunc) {
    gameState.deadTonight.forEach(d => { let p = connections.find(c => c.id === d); if(p) p.isAlive = false; });
    if(checkWinCondition()) return;

    if(gameState.pendingHunter) {
        const hunterId = gameState.pendingHunter;
        gameState.pendingHunter = null; gameState.nextPhaseAfterHunter = nextPhaseFunc; 
        gameState.phase = 'day_hunter';
        broadcast({ type: 'phase_change', phase: 'day_hunter', extra: { hunter: hunterId } });
        updateClientUI('day_hunter', { hunter: hunterId });
    } else { gameState.deadTonight = []; nextPhaseFunc(); }
}

function startNightPhase() {
    gameState.votes = {};
    if(firstNight && connections.find(c => c.role === 'cupid' && c.isAlive)) startCupidPhase();
    else startSeerPhase();
}

function startCupidPhase() { gameState.phase = 'night_cupid'; broadcast({ type: 'phase_change', phase: 'night_cupid' }); updateClientUI('night_cupid'); }
function startSeerPhase() { gameState.phase = 'night_seer'; broadcast({ type: 'phase_change', phase: 'night_seer' }); updateClientUI('night_seer'); if (!connections.find(c => c.role === 'seer' && c.isAlive)) setTimeout(() => startWolvesPhase(), 3000); }
function startWolvesPhase() { gameState.phase = 'night_wolves'; gameState.votes = {}; broadcast({ type: 'phase_change', phase: 'night_wolves' }); updateClientUI('night_wolves'); }
function startWitchPhase() { gameState.phase = 'night_witch'; const extraData = { dead: gameState.deadTonight[0] }; broadcast({ type: 'phase_change', phase: 'night_witch', extra: extraData }); updateClientUI('night_witch', extraData); if (!connections.find(c => c.role === 'witch' && c.isAlive)) setTimeout(() => endNightPhase(), 3000); }

function endNightPhase() {
    firstNight = false;
    if (gameState.deadTonight.length > 0) { const names = gameState.deadTonight.map(id => getName(id)).join(', '); broadcastSysLog('deathList', names); } 
    else { broadcastSysLog('noDeath'); }
    processDeathsAndContinue(() => { startDayVote(); });
}

function startDayVote() {
    gameState.phase = 'day_vote'; gameState.votes = {}; broadcast({ type: 'phase_change', phase: 'day_vote' }); updateClientUI('day_vote');
    let timeLeft = 300; clearInterval(phaseTimer); updateTimerUI(timeLeft); broadcast({ type: 'timer_tick', time: timeLeft });
    phaseTimer = setInterval(() => { timeLeft--; updateTimerUI(timeLeft); broadcast({ type: 'timer_tick', time: timeLeft }); if(timeLeft <= 0) resolveDayVote(); }, 1000);
}

function calculateVoteResult(voteDict) {
    const counts = {}; Object.values(voteDict).forEach(v => counts[v] = (counts[v] || 0) + 1);
    let max = 0; let tied = [];
    for(let t in counts) {
        if(counts[t] > max) { max = counts[t]; tied = [t]; }
        else if (counts[t] === max) { tied.push(t); }
    }
    if (tied.length === 0) return null; return tied[Math.floor(Math.random() * tied.length)];
}

function resolveDayVote() {
    clearInterval(phaseTimer); updateTimerUI(0); broadcast({ type: 'timer_tick', time: 0 });
    if(Object.keys(gameState.votes).length === 0) { broadcastSysLog('timeOut'); setTimeout(() => { processDeathsAndContinue(() => { startNightPhase(); }); }, 3000); return; }
    const targetId = calculateVoteResult(gameState.votes); killPlayer(targetId); broadcastSysLog('lynched', getName(targetId));
    setTimeout(() => { processDeathsAndContinue(() => { startNightPhase(); }); }, 3000);
}

document.getElementById('btn-replay').addEventListener('click', () => { if(!isHost) return; broadcast({ type: 'reset_game' }); resetClientToLobby(); });

function resetClientToLobby() {
    gameState = { phase: 'lobby', votes: {}, deadTonight: [], lovers: [], pendingHunter: null, nextPhaseAfterHunter: null };
    firstNight = true; witchPotions = { heal: 1, poison: 1 }; cupidTargets = []; wolfPartners = []; myRole = ""; clearInterval(phaseTimer); updateTimerUI(0);
    if(isHost) { connections.forEach(c => { c.role = null; c.isAlive = true; }); document.getElementById('btn-start').style.display = 'block'; } 
    else { clientPlayers.forEach(c => { c.isAlive = true; }); }
    document.getElementById('game-area').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('btn-replay').style.display = 'none'; document.getElementById('lovers-info').style.display = 'none'; document.getElementById('lobby').style.display = 'block'; setMediaEnvironment('night');
}

function handleNetworkAction(clientId, data) {
    const sender = connections.find(c => c.id === clientId || (c.isHost && clientId === 'host'));
    if (!sender) return; 

    if (data.type === 'ww_chat') {
        const chatMsg = { type: 'ww_chat_recv', sender: sender.name, text: data.text };
        connections.forEach(c => { if (c.role === 'werewolf') { if (c.isHost) displayWWChat(sender.name, data.text); else if (c.conn && c.conn.open) c.conn.send(chatMsg); } });
        return;
    }
    if (data.type === 'global_chat') {
        const chatMsg = { type: 'global_chat_recv', sender: sender.name, text: data.text };
        connections.forEach(c => { if (c.isHost) displayGlobalChat(sender.name, data.text); else if (c.conn && c.conn.open) c.conn.send(chatMsg); });
        return;
    }

    if (!sender.isAlive && !(gameState.phase === 'day_hunter' && data.role === 'hunter' && sender.id === data.extra?.hunter)) { if(gameState.phase !== 'day_hunter') return; }

    if (gameState.phase === 'night_cupid' && data.role === 'cupid') {
        gameState.lovers = [data.target1, data.target2];
        connections.forEach(c => {
            if(c.id === data.target1) { if(c.isHost) { document.getElementById('lovers-info').style.display='block'; document.getElementById('lovers-info').innerText = `${i18n[currentLang].ui.loversLinked} ${getName(data.target2)}`; } else { c.conn.send({ type: 'lovers_linked', partner: getName(data.target2) }); } }
            if(c.id === data.target2) { if(c.isHost) { document.getElementById('lovers-info').style.display='block'; document.getElementById('lovers-info').innerText = `${i18n[currentLang].ui.loversLinked} ${getName(data.target1)}`; } else { c.conn.send({ type: 'lovers_linked', partner: getName(data.target1) }); } }
        });
        setTimeout(() => startSeerPhase(), 2000); 
    }
    else if (gameState.phase === 'night_seer' && data.role === 'seer') {
        const targetInfo = connections.find(c => c.id === data.target);
        if(targetInfo) {
            if(sender.isHost) { 
                const tRole = i18n[currentLang].roles[targetInfo.role].name; const msg = t('sys', 'vision', getName(targetInfo.id), tRole); addSysLog('vision', getName(targetInfo.id), tRole);
                document.getElementById('action-panel').innerHTML = `<p style="color:var(--neon-cyan); font-size: 1.2rem; font-weight:bold;">${msg}</p>`;
            }
            else sender.conn.send({ type: 'seer_result', target: targetInfo.id, roleFound: targetInfo.role });
        }
        setTimeout(() => startWolvesPhase(), 2500); 
    }
    else if (gameState.phase === 'night_wolves' && data.role === 'werewolf') {
        gameState.votes[sender.id] = data.target; const aliveWolves = connections.filter(c => c.role === 'werewolf' && c.isAlive);
        if (Object.keys(gameState.votes).length === aliveWolves.length) { const finalTargetId = calculateVoteResult(gameState.votes); if (finalTargetId) killPlayer(finalTargetId); setTimeout(() => startWitchPhase(), 1500); }
    }
    else if (gameState.phase === 'night_witch' && data.role === 'witch') {
        if (data.action === 'heal' && gameState.deadTonight.includes(data.target)) { gameState.deadTonight = gameState.deadTonight.filter(n => n !== data.target); } else if (data.action === 'poison') { killPlayer(data.target); }
        setTimeout(() => endNightPhase(), 1500);
    }
    else if (gameState.phase === 'day_vote') {
        gameState.votes[sender.id] = data.target; const alivePlayers = connections.filter(c => c.isAlive);
        if (Object.keys(gameState.votes).length === alivePlayers.length) { resolveDayVote(); }
    }
    else if (gameState.phase === 'day_hunter' && data.role === 'hunter') {
        const targetId = data.target; broadcastSysLog('hunterShoot', getName(targetId));
        gameState.deadTonight = []; killPlayer(targetId); setTimeout(() => { processDeathsAndContinue(gameState.nextPhaseAfterHunter); }, 2000);
    }
}

function sendActionToServer(data, btnElement = null) {
    if (btnElement && (data.role === 'day' || data.role === 'werewolf')) {
        document.querySelectorAll('#action-panel button').forEach(b => b.classList.remove('selected'));
        btnElement.classList.add('selected'); document.getElementById('action-panel').innerHTML = `<p style="color:var(--neon-cyan); font-size: 1.1rem; font-weight:bold;">${i18n[currentLang].ui.waiting}</p>`;
    } else { document.getElementById('action-panel').innerHTML = `<p style="color:var(--neon-cyan); font-size: 1.1rem; font-weight:bold;">${i18n[currentLang].ui.waiting}</p>`; }

    if (isHost) handleNetworkAction('host', data); else connections[0].conn.send(data);
}

function updateClientUI(phase, extra = null) {
    gameState.phase = phase; 
    let argTitle = phase === 'day_hunter' && extra ? getName(extra.hunter) : "";
    document.getElementById('phase-title').innerText = t('phases', phase, argTitle);
    const panel = document.getElementById('action-panel'); panel.innerHTML = ''; 
    const langUI = i18n[currentLang].ui;

    const wwChat = document.getElementById('ww-chat-container');
    if (myRole === 'werewolf' && phase.startsWith('night')) wwChat.style.display = 'flex'; else wwChat.style.display = 'none';
    if (phase.includes('day')) { setMediaEnvironment('day'); } else if (phase.includes('night')) { setMediaEnvironment('night'); document.getElementById('timer-display').style.display='none'; }

    const playerList = isHost ? connections : clientPlayers; const alivePlayers = playerList.filter(c => c.isAlive && c.id !== myId); const allAlivePlayers = playerList.filter(c => c.isAlive);  const myStatus = playerList.find(c => c.id === myId);

    if (phase === 'day_hunter') {
        if (myId === extra.hunter) {
            panel.innerHTML = `<p style="color:var(--neon-yellow); font-size: 1.3rem; font-weight:bold;">DERNIER SOUFFLE ! Choisis qui emporter :</p>`;
            allAlivePlayers.forEach(c => { let btn = createBtn(c.name, 'var(--neon-yellow)', function() { sendActionToServer({type:'action', role:'hunter', target: c.id, extra: {hunter: myId}}, this); }); panel.appendChild(btn); });
        } else { panel.innerHTML = `<p style="color:#ff4d4d; font-size: 1.3rem; font-weight:bold;">À couvert ! Le Chasseur s'effondre et tire...</p>`; }
        return; 
    }
    if(myStatus && !myStatus.isAlive) { panel.innerHTML = `<p style="color:#ff4d4d; font-weight:bold; font-size: 1.5rem;">${langUI.dead}</p>`; return; }

    if (phase === 'night_cupid' && myRole === 'cupid') {
        panel.innerHTML = `<p style="color:var(--neon-pink); font-size: 1.2rem; font-weight:bold;">${langUI.selectTarget}</p>`;
        allAlivePlayers.forEach(c => {
            let btn = createBtn(c.name, 'var(--neon-pink)', function() {
                this.style.background = 'var(--neon-pink)'; this.style.color = '#fff';
                cupidTargets.push(c.id); if(cupidTargets.length === 2) { sendActionToServer({ type: 'action', role: 'cupid', target1: cupidTargets[0], target2: cupidTargets[1] }); cupidTargets = []; }
            });
            panel.appendChild(btn);
        });
    }
    else if (phase === 'night_seer' && myRole === 'seer') {
        panel.innerHTML = `<p style="color:var(--neon-cyan); font-size: 1.2rem; font-weight:bold;">${langUI.selectTarget}</p>`;
        alivePlayers.forEach(c => { panel.appendChild(createBtn(c.name, 'var(--neon-cyan)', function() { sendActionToServer({type:'action', role:'seer', target: c.id}, this); })); });
    }
    else if (phase === 'night_wolves' && myRole === 'werewolf') {
        panel.innerHTML = `<p style="color:var(--neon-pink); font-size: 1.2rem; font-weight:bold;">${langUI.selectTarget}</p>`;
        alivePlayers.forEach(c => { if(!wolfPartners.includes(c.id)) { panel.appendChild(createBtn(c.name, 'var(--neon-pink)', function() { sendActionToServer({type:'action', role:'werewolf', target: c.id}, this); })); } });
    } 
    else if (phase === 'night_witch' && myRole === 'witch') {
        let html = `<p style="color:var(--neon-purple); font-size: 1.2rem; font-weight:bold;">Victime(s): ${gameState.deadTonight && gameState.deadTonight.length>0 ? gameState.deadTonight.map(id => getName(id)).join(', ') : extra.dead ? getName(extra.dead) : 'Personne'}</p>`;
        if (extra.dead && witchPotions.heal > 0) { html += `<button class="btn-outline" onclick="witchPotions.heal--; sendActionToServer({type:'action', role:'witch', action:'heal', target:'${extra.dead}'}, this);" style="border-color:#2ecc71; color:#2ecc71;">${langUI.healMsg}</button>`; }
        if (witchPotions.poison > 0) { alivePlayers.forEach(c => { html += `<button class="btn-outline" onclick="witchPotions.poison--; sendActionToServer({type:'action', role:'witch', action:'poison', target:'${c.id}'}, this);" style="border-color:#e74c3c; color:#e74c3c; margin-left:10px;">${langUI.poisonMsg} ${c.name}</button>`; }); }
        html += `<button class="btn-outline" onclick="sendActionToServer({type:'action', role:'witch', action:'skip'}, this)" style="border-color:gray; color:gray; margin-left:10px;">${langUI.skipMsg}</button>`;
        panel.innerHTML = html;
    }
    else if (phase.startsWith('night') && myRole !== 'werewolf' && myRole !== 'cupid') { panel.innerHTML = `<p style="color:#aaa; font-size: 1.3rem; font-style:italic;">${langUI.sleep}</p>`; }
    else if (phase === 'day_vote') {
        panel.innerHTML = `<p style="color:var(--neon-yellow); font-size: 1.2rem; font-weight:bold;">${langUI.selectTarget}</p>`;
        alivePlayers.forEach(c => { panel.appendChild(createBtn(c.name, 'var(--neon-yellow)', function() { sendActionToServer({type:'action', role:'day', target: c.id}, this); })); });
    }
}

function createBtn(text, color, onClickCallback) {
    let btn = document.createElement('button'); btn.className = "btn-outline";
    btn.innerText = text; btn.style.borderColor = color; btn.style.color = color; btn.onclick = onClickCallback; return btn;
}

function setupRoleUI(role) {
    myRole = role; const rData = i18n[currentLang].roles[role] || i18n[currentLang].roles['villager'];
    document.getElementById('role-name').innerText = rData.name; document.getElementById('role-desc').innerText = rData.desc; document.getElementById('role-image').src = rData.img; 
    const card = document.getElementById('my-role-card'); card.style.borderColor = rData.color;
    card.style.boxShadow = `0 10px 30px rgba(${rData.color === 'var(--neon-pink)' ? '255,0,127' : rData.color === 'var(--neon-cyan)' ? '0,229,255' : rData.color === 'var(--neon-yellow)' ? '252,232,3' : rData.color === 'var(--neon-green)' ? '57,255,20' : '155,89,182'}, 0.3), inset 0 0 20px rgba(0,0,0,0.5)`;
    document.getElementById('role-name').style.color = rData.color;
}

function showGameOver(winner, desc) {
    document.getElementById('action-panel').innerHTML = ""; document.getElementById('ww-chat-container').style.display = 'none';
    const goScreen = document.getElementById('game-over-screen'); goScreen.style.display = 'block';
    document.getElementById('winner-text').innerText = winner; document.getElementById('winner-desc').innerText = desc;
    if (isHost) { document.getElementById('btn-replay').style.display = 'block'; }
}

function sendWWChat() {
    const input = document.getElementById('ww-chat-input'); const text = input.value.trim(); if (text === "") return;
    if (isHost) handleNetworkAction('host', { type: 'ww_chat', text: text }); else connections[0].conn.send({ type: 'ww_chat', text: text });
    input.value = "";
}
document.getElementById('ww-chat-input').addEventListener('keypress', function (e) { if (e.key === 'Enter') sendWWChat(); });
function displayWWChat(senderName, text) {
    const chatBox = document.getElementById('ww-chat-messages'); chatBox.innerHTML += `<p><span class="ww-chat-sender">${senderName} :</span> ${text}</p>`; chatBox.scrollTop = chatBox.scrollHeight;
}

function sendGlobalChat() {
    const input = document.getElementById('global-chat-input'); const text = input.value.trim(); if (text === "") return;
    if (isHost) handleNetworkAction('host', { type: 'global_chat', text: text }); else connections[0].conn.send({ type: 'global_chat', text: text });
    input.value = "";
}
document.getElementById('global-chat-input').addEventListener('keypress', function (e) { if (e.key === 'Enter') sendGlobalChat(); });
function displayGlobalChat(senderName, text) {
    const chatBox = document.getElementById('global-chat-messages'); chatBox.innerHTML += `<p><span class="global-chat-sender">${senderName} :</span> ${text}</p>`; chatBox.scrollTop = chatBox.scrollHeight;
}

// Initialisation de la langue par défaut
updateLang('fr');
