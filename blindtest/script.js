// ==========================================
// GESTION DES PARAMÈTRES ET DE LA LANGUE
// ==========================================
let currentLang = 'FR';

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('show')) {
        modal.classList.remove('show');
    } else {
        modal.classList.add('show');
    }
}

function changeLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-lang-fr').classList.remove('active');
    document.getElementById('btn-lang-en').classList.remove('active');
    
    const hubImg = document.getElementById('hub-img');
    const playlistTitle = document.getElementById('playlist-title');
    
    if (lang === 'FR') {
        document.getElementById('btn-lang-fr').classList.add('active');
        hubImg.src = '../img/retourhub.png'; // IMAGE GLOBALE HUB FR
        if (playlistTitle) playlistTitle.innerText = "SÉLECTION DE LA PLAYLIST";
        document.getElementById('btn-replay').innerText = "Rejouer une partie";
        
        if (currentCategory === 'ANIME') document.getElementById('guess-input').placeholder = "Nom de l'anime (ex: SNK...)";
        else if (currentCategory === 'FILMS') document.getElementById('guess-input').placeholder = "Nom du film (ex: Interstellar...)";
        else if (currentCategory === 'DISNEY') document.getElementById('guess-input').placeholder = "Nom du Disney (ex: Le Roi Lion...)";
        else document.getElementById('guess-input').placeholder = "Tapez l'artiste ou le titre ici...";
        
    } else {
        document.getElementById('btn-lang-en').classList.add('active');
        hubImg.src = '../img/returbhub.png'; // IMAGE GLOBALE HUB EN
        if (playlistTitle) playlistTitle.innerText = "PLAYLIST SELECTION";
        document.getElementById('btn-replay').innerText = "Play Again";

        if (currentCategory === 'ANIME') document.getElementById('guess-input').placeholder = "Anime name (e.g., AOT...)";
        else if (currentCategory === 'FILMS') document.getElementById('guess-input').placeholder = "Movie name (e.g., Inception...)";
        else if (currentCategory === 'DISNEY') document.getElementById('guess-input').placeholder = "Disney movie (e.g., Lion King...)";
        else document.getElementById('guess-input').placeholder = "Type artist or title here...";
    }
}

// ==========================================
// LOGIQUE PRINCIPALE DU JEU BLIND TEST
// ==========================================

let gameMode = 'solo'; 
let currentCategory = 'RAP'; 
let myPid = 1; 
let myName = "Solo";

let peer = null; 
let conns = []; 
let scores = { 1: 0 }; 
let playerNames = { 1: "Solo" };
let playerColors = ['#00f0ff', '#ff007f', '#f1c40f', '#39ff14', '#ff8800', '#b800ff', '#00ffaa', '#ff0000'];

let playlist = [];
let currentTrackIndex = -1;
let currentTrack = null;
let audioPlayer = new Audio();

let state = { artistFoundBy: [], titleFoundBy: [], animeFoundBy: [], filmFoundBy: [], disneyFoundBy: [], timeLeft: 20 };
let roundInterval = null;
let isRoundActive = false;
let fadeInterval = null;
let isFading = false;

const chatMsgs = document.getElementById('chat-messages');
const guessInput = document.getElementById('guess-input');
const timerBox = document.getElementById('timer-box');
const boxArtist = document.getElementById('box-artist');
const boxTitle = document.getElementById('box-title');
const boxAnime = document.getElementById('box-anime');

window.addEventListener('DOMContentLoaded', () => {
    updateScoreUI();
});

guessInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") { event.preventDefault(); submitGuess(); }
});

function getPlayerColor(pid) { return playerColors[(pid - 1) % playerColors.length]; }

function openMenu(mode) {
    gameMode = mode;
    if (mode === 'solo') {
        myName = "Solo";
        playerNames = { 1: "Solo" };
        document.getElementById('network-menu').style.display = 'none';
        document.getElementById('category-menu').style.display = 'flex';
        document.getElementById('btn-multi-toggle').style.display = 'block';
        updateScoreUI(); 
    } else {
        document.getElementById('category-menu').style.display = 'none';
        document.getElementById('network-menu').style.display = 'flex';
        document.getElementById('my-id').innerText = "...";
        document.getElementById('btn-host').style.display = 'inline-block';
        document.getElementById('btn-start-host').style.display = 'none';
        document.getElementById('conn-status').innerText = "";
    }
}

function setupUIForCategory(cat) {
    currentCategory = cat;
    if (cat === 'ANIME' || cat === 'FILMS' || cat === 'DISNEY') {
        boxArtist.style.display = 'none';
        boxTitle.style.display = 'none';
        boxAnime.style.display = 'block';
        if (cat === 'ANIME') {
            guessInput.placeholder = currentLang === 'FR' ? "Nom de l'anime (ex: SNK...)" : "Anime name (e.g., AOT...)";
            boxAnime.innerText = "📺 ANIME : ? ? ?";
        } else if (cat === 'FILMS') {
            guessInput.placeholder = currentLang === 'FR' ? "Nom du film (ex: Interstellar...)" : "Movie name (e.g., Inception...)";
            boxAnime.innerText = "🎬 FILM : ? ? ?";
        } else if (cat === 'DISNEY') {
            guessInput.placeholder = currentLang === 'FR' ? "Nom du Disney (ex: Le Roi Lion...)" : "Disney movie (e.g., Lion King...)";
            boxAnime.innerText = "🏰 DISNEY : ? ? ?";
        }
    } else {
        boxAnime.style.display = 'none';
        boxArtist.style.display = 'block';
        boxTitle.style.display = 'block';
        guessInput.placeholder = currentLang === 'FR' ? "Tapez l'artiste ou le titre ici..." : "Type artist or title here...";
    }
}

// --- GESTION RÉSEAU ---
function hostGame() { 
    let status = document.getElementById('conn-status');
    let pseudoInput = document.getElementById('player-name-input').value.trim();
    myName = pseudoInput ? pseudoInput : "Host";
    playerNames[1] = myName;

    status.style.color = "var(--p1)";
    status.innerText = currentLang === 'FR' ? "Création du serveur..." : "Creating server..."; 

    let code = 'BLD' + Math.floor(1000 + Math.random() * 9000);

    if (peer) peer.destroy();
    peer = new Peer(code);

    peer.on('open', id => {
        document.getElementById('my-id').innerText = id;
        try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(id).catch(e=>{}); } catch(e) {}

        status.style.color = "var(--sys)";
        status.innerText = currentLang === 'FR' ? "Serveur prêt !" : "Server Ready !"; 

        document.getElementById('btn-host').style.display = 'none';
        document.getElementById('btn-start-host').style.display = 'inline-block';

        gameMode = 'host'; myPid = 1;
        scores = { 1: 0 };
    });

    peer.on('connection', c => { 
        c.on('open', () => { });

        c.on('data', data => { 
            if (data.type === 'join') {
                let newPid = Object.keys(scores).length + 1; 
                c.pid = newPid; 
                scores[newPid] = 0; 
                playerNames[newPid] = data.name.substring(0, 15); 
                conns.push(c); 

                status.style.color = "var(--sys)";
                status.innerText = currentLang === 'FR' ? `${conns.length + 1} joueur(s) connectés !` : `${conns.length + 1} player(s) connected!`;
                document.getElementById('lobby-count').innerText = currentLang === 'FR' ? Object.keys(scores).length + " joueur(s) dans le salon" : Object.keys(scores).length + " player(s) in lobby";

                c.send({ type: 'init', pid: newPid, playerNames: playerNames, scores: scores, category: currentCategory });

                let msg = currentLang === 'FR' ? `${playerNames[newPid]} a rejoint la partie !` : `${playerNames[newPid]} joined the game!`;
                broadcast({ type: 'sys', msg: msg, playerNames: playerNames, scores: scores });
                displaySys(msg); updateScoreUI();
            }
            if (data.type === 'guess') processGuess(data.text, c.pid); 
        });
    }); 
    peer.on('error', err => { status.style.color = "var(--p2)"; status.innerText = "Erreur : " + err.type; });
}

function goToLobby() {
    document.getElementById('network-menu').style.display = 'none';
    document.getElementById('category-menu').style.display = 'flex';
    document.getElementById('btn-multi-toggle').style.display = 'none';
    document.getElementById('lobby-count').style.display = 'block';
    
    document.getElementById('game-container').classList.remove('playing');
    updateScoreUI();
}

function joinGame() { 
    let id = document.getElementById('join-id').value.trim().toUpperCase(); 
    let pseudoInput = document.getElementById('player-name-input').value.trim();
    myName = pseudoInput ? pseudoInput : "Guest";

    if (!id) return; 

    let status = document.getElementById('conn-status');
    status.style.color = "var(--p1)"; status.innerText = "Connexion..."; 

    if (peer) peer.destroy(); peer = new Peer(); 

    peer.on('open', () => {
        let conn = peer.connect(id, { reliable: true }); 
        gameMode = 'client'; 

        conn.on('open', () => {
            conns = [conn]; 
            conn.send({ type: 'join', name: myName });

            document.getElementById('network-menu').style.display = 'none';
            document.getElementById('waiting-menu').style.display = 'flex';
        });

        conn.on('data', data => {
            if (data.type === 'init') { 
                myPid = data.pid; 
                playerNames = data.playerNames;
                scores = data.scores;
                updateScoreUI();
            }
            if (data.type === 'chat') { displayChat(data.msg, data.pid); }
            if (data.type === 'sys') { 
                if (data.playerNames) playerNames = data.playerNames;
                if (data.scores) scores = data.scores;
                displaySys(data.msg); 
                updateScoreUI();
            }
            if (data.type === 'start_game') { setupUIForCategory(data.category); } 
            if (data.type === 'start_round') { clientStartRound(data.track, data.round); }
            if (data.type === 'update_state') { 
                if (data.stateData.playerNames) playerNames = data.stateData.playerNames;
                clientUpdateState(data.stateData); 
            }
            if (data.type === 'end_round') { clientEndRound(data.track); }
            if (data.type === 'end_game') { showEndScreen(data.scores); }
        });
        conn.on('error', () => { status.style.color = "var(--p2)"; status.innerText = "Échec."; });
    });
    peer.on('error', err => { status.style.color = "var(--p2)"; status.innerText = "Erreur réseau."; });
}

function broadcast(data) { conns.forEach(c => { if (c.open) c.send(data); }); }

// --- FETCH DYNAMIQUE DE LA PLAYLIST ---
async function launchGame(cat) {
    setupUIForCategory(cat);
    if (gameMode === 'host') broadcast({ type: 'start_game', category: cat });

    document.getElementById('cat-buttons').style.display = 'none';
    document.getElementById('btn-multi-toggle').style.display = 'none';
    document.getElementById('loading-api').style.display = 'flex';
    document.getElementById('playlist-title').style.display = 'none'; 

    let selectedTracks = [];
    let shuffled = catalogs[cat].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i++) {
        if (selectedTracks.length >= 10) break;
        try {
            let searchItem = shuffled[i];
            let searchTerm = searchItem.search || searchItem;

            let res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=fr&media=music&entity=song&limit=20`);
            let data = await res.json();

            let validTracks = data.results.filter(t => {
                if (!t.previewUrl) return false;
                let n = t.trackName.toLowerCase();
                let a = t.artistName.toLowerCase();
                if (/cover|tribute|karaoke|instrumental|8-bit|lullaby|version|remix/i.test(n)) return false;
                if (/cover|tribute|karaoke/i.test(a)) return false;
                return true;
            });

            if (validTracks.length === 0 && data.results.length > 0) {
                validTracks = data.results.filter(t => t.previewUrl);
            }

            if (validTracks.length > 0) {
                let rTrack = validTracks[0];

                if (cat === 'ANIME') {
                    selectedTracks.push({ animeName: searchItem.anime, aliases: searchItem.aliases, previewUrl: rTrack.previewUrl });
                } else if (cat === 'FILMS') {
                    selectedTracks.push({ filmName: searchItem.film, aliases: searchItem.aliases, previewUrl: rTrack.previewUrl });
                } else if (cat === 'DISNEY') {
                    selectedTracks.push({ disneyName: searchItem.disney, aliases: searchItem.aliases, previewUrl: rTrack.previewUrl });
                } else {
                    selectedTracks.push({
                        artistName: searchItem.artist || rTrack.artistName, 
                        trackName: rTrack.trackName, 
                        previewUrl: rTrack.previewUrl,
                        aliases: searchItem.aliases || []
                    });
                }
            }
        } catch (e) { console.warn("Échec pour : ", shuffled[i]); }
    }

    if (selectedTracks.length === 0) {
        alert(currentLang === 'FR' ? "Erreur : Impossible de contacter la base de données musicale iTunes." : "Error: Cannot reach iTunes database.");
        location.reload(); return;
    }

    playlist = selectedTracks;
    
    // ON AFFICHE LE FOND SOMBRE ET L'INTERFACE DE JEU
    document.getElementById('game-container').classList.add('playing');
    document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none'); 
    document.getElementById('in-game-ui').style.display = 'flex';

    if (gameMode === 'host') broadcast({ type: 'sys', msg: currentLang === 'FR' ? `L'hôte a lancé la catégorie ${cat} !` : `Host launched category ${cat}!` });
    displaySys(currentLang === 'FR' ? `🎵 DÉBUT DE LA PARTIE (${playlist.length} Manches) 🎵` : `🎵 GAME START (${playlist.length} Rounds) 🎵`);

    setTimeout(startNextRound, 2000);
}

function startFadeOut() {
    if (isFading) return;
    isFading = true; let step = audioPlayer.volume / 30;
    fadeInterval = setInterval(() => {
        if (audioPlayer.volume - step > 0) audioPlayer.volume -= step;
        else { audioPlayer.volume = 0; clearInterval(fadeInterval); }
    }, 100);
}

// --- GESTION DES ROUNDS ---
function startNextRound() {
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) { endGame(); return; }

    currentTrack = playlist[currentTrackIndex];
    state = { artistFoundBy: [], titleFoundBy: [], animeFoundBy: [], filmFoundBy: [], disneyFoundBy: [], timeLeft: 20 };

    clearInterval(fadeInterval); isFading = false; audioPlayer.volume = 1;

    resetRoundUI();
    audioPlayer.src = currentTrack.previewUrl;
    audioPlayer.play().catch(e => console.log("Autoplay bloqué"));

    isRoundActive = true;
    if (gameMode === 'host') broadcast({ type: 'start_round', track: { previewUrl: currentTrack.previewUrl }, round: currentTrackIndex + 1 });

    displaySys(currentLang === 'FR' ? `▶️ MANCHE ${currentTrackIndex + 1} / 10` : `▶️ ROUND ${currentTrackIndex + 1} / 10`);

    clearInterval(roundInterval);
    roundInterval = setInterval(() => {
        state.timeLeft--; timerBox.innerText = state.timeLeft;
        if (state.timeLeft <= 3) timerBox.style.color = '#ff0000'; else timerBox.style.color = 'var(--gold)';
        if (state.timeLeft === 3) startFadeOut();
        if (gameMode === 'host') broadcast({ type: 'update_state', stateData: { ...state, scores: scores, playerNames: playerNames } });
        
        if (state.timeLeft <= 0) endRound();
    }, 1000);
}

function endRound() {
    isRoundActive = false;
    clearInterval(roundInterval); clearInterval(fadeInterval); audioPlayer.pause();

    revealAnswers(currentTrack);
    displaySys(currentLang === 'FR' ? `Fin de la manche...` : `Round over...`);

    if (gameMode === 'host') broadcast({ type: 'end_round', track: currentTrack });
    setTimeout(startNextRound, 5000); 
}

function endGame() {
    showEndScreen();
    if (gameMode === 'host') broadcast({ type: 'end_game', scores: scores });
}

// --- LOGIQUE CLIENT ---
function clientStartRound(track, round) {
    currentTrack = track;
    
    document.getElementById('game-container').classList.add('playing');
    document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none');
    document.getElementById('in-game-ui').style.display = 'flex';

    clearInterval(fadeInterval); isFading = false; audioPlayer.volume = 1;
    resetRoundUI(); audioPlayer.src = track.previewUrl; audioPlayer.play().catch(e => console.log(e));
    isRoundActive = true; displaySys(currentLang === 'FR' ? `▶️ MANCHE ${round} / 10` : `▶️ ROUND ${round} / 10`);
}

function clientUpdateState(stateData) {
    state.timeLeft = stateData.timeLeft; timerBox.innerText = state.timeLeft;
    if (state.timeLeft <= 3) timerBox.style.color = '#ff0000'; else timerBox.style.color = 'var(--gold)';
    if (state.timeLeft <= 3 && !isFading) startFadeOut();

    updateScoreUI(stateData.scores); 

    if (currentCategory === 'ANIME') {
        if (stateData.animeFoundBy.includes(myPid) && !boxAnime.classList.contains('found')) {
            boxAnime.classList.add('found'); boxAnime.innerText = currentLang === 'FR' ? "📺 ANIME TROUVÉ !" : "📺 ANIME FOUND !";
        }
    } else if (currentCategory === 'FILMS') {
        if (stateData.filmFoundBy.includes(myPid) && !boxAnime.classList.contains('found')) {
            boxAnime.classList.add('found'); boxAnime.innerText = currentLang === 'FR' ? "🎬 FILM TROUVÉ !" : "🎬 MOVIE FOUND !";
        }
    } else if (currentCategory === 'DISNEY') {
        if (stateData.disneyFoundBy.includes(myPid) && !boxAnime.classList.contains('found')) {
            boxAnime.classList.add('found'); boxAnime.innerText = currentLang === 'FR' ? "🏰 DISNEY TROUVÉ !" : "🏰 DISNEY FOUND !";
        }
    } else {
        if (stateData.artistFoundBy.includes(myPid) && !boxArtist.classList.contains('found')) {
            boxArtist.classList.add('found'); boxArtist.innerText = currentLang === 'FR' ? "🧑‍🎤 ARTISTE TROUVÉ !" : "🧑‍🎤 ARTIST FOUND !";
        }
        if (stateData.titleFoundBy.includes(myPid) && !boxTitle.classList.contains('found')) {
            boxTitle.classList.add('found'); boxTitle.innerText = currentLang === 'FR' ? "🎵 TITRE TROUVÉ !" : "🎵 TITLE FOUND !";
        }
    }
}

function clientEndRound(track) {
    isRoundActive = false; clearInterval(fadeInterval); audioPlayer.pause();
    revealAnswers(track); displaySys(currentLang === 'FR' ? `Fin de la manche...` : `Round over...`);
}

// --- ALGORITHME DE CORRECTION ---
function cleanText(str) {
    if (!str) return '';
    let s = str.toLowerCase();
    s = s.split(/feat\.|ft\.|featuring/i)[0];
    s = s.replace(/\[.*?\]/g, ''); 
    s = s.replace(/\(?(remastered|remaster|radio edit|live|version|instrumental).*?\)?/gi, '');
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
    s = s.replace(/[^a-z0-9]/g, '');
    return s;
}

function levenshtein(a, b) {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
    let matrix = [];
    for(let i = 0; i <= b.length; i++) matrix[i] = [i];
    for(let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for(let i = 1; i <= b.length; i++) {
        for(let j = 1; j <= a.length; j++) {
            if(b.charAt(i-1) == a.charAt(j-1)) matrix[i][j] = matrix[i-1][j-1];
            else matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
}

function checkMatch(guess, target) {
    let g = cleanText(guess); let t = cleanText(target);
    if (g.length < 2) return false;
    if (g === t || (t.includes(g) && g.length >= t.length * 0.75) || (g.includes(t) && t.length >= g.length * 0.75)) return true;
    let distance = levenshtein(g, t);
    if (t.length > 5 && distance <= 2) return true; 
    if (t.length <= 5 && distance <= 1) return true; 
    return false;
}

function submitGuess() {
    const text = guessInput.value.trim();
    if (!text || !isRoundActive) return;
    guessInput.value = '';

    if (gameMode === 'client') conns[0].send({ type: 'guess', text: text });
    else processGuess(text, 1);
}

function processGuess(text, pid) {
    let correct = false;
    let playerPseudo = playerNames[pid] || `Joueur ${pid}`;
    let numPlayers = Object.keys(scores).length;

    if (currentCategory === 'ANIME') {
        if (state.animeFoundBy.includes(pid)) return;

        correct = checkMatch(text, currentTrack.animeName);
        if (!correct && currentTrack.aliases) {
            for (let alias of currentTrack.aliases) { if (checkMatch(text, alias)) { correct = true; break; } }
        }

        if (correct) {
            state.animeFoundBy.push(pid);
            let pts = numPlayers - state.animeFoundBy.length + 1;
            scores[pid] += pts;
            let msg = currentLang === 'FR' ? `🔥 ${playerPseudo} a trouvé l'Anime ! (+${pts} pts)` : `🔥 ${playerPseudo} found the Anime! (+${pts} pts)`;
            displaySys(msg); if(gameMode === 'host') broadcast({type:'sys', msg:msg});

            if (pid === myPid) {
                boxAnime.classList.add('found');
                boxAnime.innerText = gameMode === 'solo' ? `📺 ${currentTrack.animeName}` : (currentLang === 'FR' ? "📺 ANIME TROUVÉ !" : "📺 ANIME FOUND!");
            }
        }
    } else if (currentCategory === 'FILMS') {
        if (state.filmFoundBy.includes(pid)) return;

        correct = checkMatch(text, currentTrack.filmName);
        if (!correct && currentTrack.aliases) {
            for (let alias of currentTrack.aliases) { if (checkMatch(text, alias)) { correct = true; break; } }
        }

        if (correct) {
            state.filmFoundBy.push(pid);
            let pts = numPlayers - state.filmFoundBy.length + 1;
            scores[pid] += pts;
            let msg = currentLang === 'FR' ? `🔥 ${playerPseudo} a trouvé le Film ! (+${pts} pts)` : `🔥 ${playerPseudo} found the Movie! (+${pts} pts)`;
            displaySys(msg); if(gameMode === 'host') broadcast({type:'sys', msg:msg});

            if (pid === myPid) {
                boxAnime.classList.add('found');
                boxAnime.innerText = gameMode === 'solo' ? `🎬 ${currentTrack.filmName}` : (currentLang === 'FR' ? "🎬 FILM TROUVÉ !" : "🎬 MOVIE FOUND!");
            }
        }
    } else if (currentCategory === 'DISNEY') {
        if (state.disneyFoundBy.includes(pid)) return;

        correct = checkMatch(text, currentTrack.disneyName);
        if (!correct && currentTrack.aliases) {
            for (let alias of currentTrack.aliases) { if (checkMatch(text, alias)) { correct = true; break; } }
        }

        if (correct) {
            state.disneyFoundBy.push(pid);
            let pts = numPlayers - state.disneyFoundBy.length + 1;
            scores[pid] += pts;
            let msg = currentLang === 'FR' ? `🔥 ${playerPseudo} a trouvé le Disney ! (+${pts} pts)` : `🔥 ${playerPseudo} found the Disney! (+${pts} pts)`;
            displaySys(msg); if(gameMode === 'host') broadcast({type:'sys', msg:msg});

            if (pid === myPid) {
                boxAnime.classList.add('found');
                boxAnime.innerText = gameMode === 'solo' ? `🏰 ${currentTrack.disneyName}` : (currentLang === 'FR' ? "🏰 DISNEY TROUVÉ !" : "🏰 DISNEY FOUND!");
            }
        }
    } else {
        let aMatch = false;
        if (!state.artistFoundBy.includes(pid)) {
            aMatch = checkMatch(text, currentTrack.artistName);
            if (!aMatch && currentTrack.aliases) {
                for (let alias of currentTrack.aliases) { if (checkMatch(text, alias)) { aMatch = true; break; } }
            }
        }

        let tMatch = false;
        if (!state.titleFoundBy.includes(pid)) {
            tMatch = checkMatch(text, currentTrack.trackName);
        }

        if (aMatch) {
            state.artistFoundBy.push(pid);
            let pts = numPlayers - state.artistFoundBy.length + 1;
            scores[pid] += pts; correct = true;
            let msg = currentLang === 'FR' ? `🔥 ${playerPseudo} a trouvé l'Artiste ! (+${pts} pts)` : `🔥 ${playerPseudo} found the Artist! (+${pts} pts)`;
            displaySys(msg); if(gameMode === 'host') broadcast({type:'sys', msg:msg});
            
            if (pid === myPid) {
                boxArtist.classList.add('found'); 
                boxArtist.innerText = gameMode === 'solo' ? `🧑‍🎤 ${currentTrack.artistName}` : (currentLang === 'FR' ? "🧑‍🎤 ARTISTE TROUVÉ !" : "🧑‍🎤 ARTIST FOUND!");
            }
        }
        if (tMatch) {
            state.titleFoundBy.push(pid);
            let pts = numPlayers - state.titleFoundBy.length + 1;
            scores[pid] += pts; correct = true;
            let msg = currentLang === 'FR' ? `🔥 ${playerPseudo} a trouvé le Titre ! (+${pts} pts)` : `🔥 ${playerPseudo} found the Title! (+${pts} pts)`;
            displaySys(msg); if(gameMode === 'host') broadcast({type:'sys', msg:msg});
            
            if (pid === myPid) {
                boxTitle.classList.add('found'); 
                boxTitle.innerText = gameMode === 'solo' ? `🎵 ${currentTrack.trackName.split('(')[0]}` : (currentLang === 'FR' ? "🎵 TITRE TROUVÉ !" : "🎵 TITLE FOUND!");
            }
        }
    }

    updateScoreUI();
    if (gameMode === 'host') broadcast({ type: 'update_state', stateData: { ...state, scores: scores, playerNames: playerNames } });

    if (!correct) {
        displayChat(text, pid);
        if (gameMode === 'host') broadcast({ type: 'chat', msg: text, pid: pid });
    }
}

// --- INTERFACE UTILE ---
function displayChat(msg, pid) {
    let div = document.createElement('div'); div.className = 'msg'; let color = getPlayerColor(pid);
    div.style.alignSelf = pid === myPid ? 'flex-end' : 'flex-start';
    let pseudo = playerNames[pid] || `Joueur ${pid}`;

    if (pid === myPid) {
        div.style.borderRight = `4px solid ${color}`;
        div.style.background = `linear-gradient(90deg, rgba(255,255,255,0.02), rgba(${hexToRgb(color)}, 0.15))`;
    } else {
        div.style.borderLeft = `4px solid ${color}`;
        div.style.background = `linear-gradient(90deg, rgba(${hexToRgb(color)}, 0.15), rgba(255,255,255,0.02))`;
    }

    div.style.color = '#fff'; 
    div.innerHTML = `<span style="font-size:0.7em; opacity:0.7; display:block; margin-bottom:2px; color:${color};">${pseudo}</span>${msg}`;
    chatMsgs.appendChild(div); chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

function displaySys(msg) {
    let div = document.createElement('div'); div.className = 'msg msg-sys'; div.innerText = msg;
    chatMsgs.appendChild(div); chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function updateScoreUI(scoresData = scores) {
    const container = document.getElementById('scores-container'); container.innerHTML = '';
    for(let pid in scoresData) {
        let div = document.createElement('div'); div.className = 'score-box'; let color = getPlayerColor(pid);
        div.style.color = color; div.style.borderColor = color; 
        div.style.boxShadow = `0 0 15px rgba(${hexToRgb(color)}, 0.3)`; 
        let pseudo = playerNames[pid] || `J${pid}`;
        div.innerText = `${pseudo} : ${scoresData[pid]}`; container.appendChild(div);
    }
}

function resetRoundUI() {
    timerBox.innerText = "20"; timerBox.style.color = 'var(--gold)';
    if (currentCategory === 'ANIME') {
        boxAnime.className = 'mystery-box'; boxAnime.innerText = "📺 ANIME : ? ? ?";
    } else if (currentCategory === 'FILMS') {
        boxAnime.className = 'mystery-box'; boxAnime.innerText = "🎬 FILM : ? ? ?";
    } else if (currentCategory === 'DISNEY') {
        boxAnime.className = 'mystery-box'; boxAnime.innerText = "🏰 DISNEY : ? ? ?";
    } else {
        boxArtist.className = 'mystery-box'; boxArtist.innerText = "🧑‍🎤 ARTISTE : ? ? ?";
        boxTitle.className = 'mystery-box'; boxTitle.innerText = "🎵 TITRE : ? ? ?";
    }
    guessInput.focus();
}

function revealAnswers(trackObj) {
    if (currentCategory === 'ANIME') {
        boxAnime.classList.add('found'); boxAnime.innerText = `📺 ${trackObj.animeName}`;
    } else if (currentCategory === 'FILMS') {
        boxAnime.classList.add('found'); boxAnime.innerText = `🎬 ${trackObj.filmName}`;
    } else if (currentCategory === 'DISNEY') {
        boxAnime.classList.add('found'); boxAnime.innerText = `🏰 ${trackObj.disneyName}`;
    } else {
        boxArtist.classList.add('found'); boxArtist.innerText = `🧑‍🎤 ${trackObj.artistName}`;
        boxTitle.classList.add('found'); boxTitle.innerText = `🎵 ${trackObj.trackName.split('(')[0]}`;
    }
}

function showEndScreen(finalScores = scores) {
    document.getElementById('game-container').classList.remove('playing');
    document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none');
    document.getElementById('in-game-ui').style.display = 'none'; 
    document.getElementById('end-screen').style.display = 'flex';
    let t = document.getElementById('final-scores-text');

    if (gameMode === 'solo') {
        let maxPts = (currentCategory === 'ANIME' || currentCategory === 'FILMS' || currentCategory === 'DISNEY') ? 10 : 20;
        t.innerHTML = currentLang === 'FR' ? `Score Final : <br><b style="color:var(--sys); font-size: 1.5em; text-shadow: 0 0 20px var(--sys);">${finalScores[1]} / ${maxPts}</b>` : `Final Score : <br><b style="color:var(--sys); font-size: 1.5em; text-shadow: 0 0 20px var(--sys);">${finalScores[1]} / ${maxPts}</b>`;
    } else {
        let sortedPids = Object.keys(finalScores).sort((a,b) => finalScores[b] - finalScores[a]);
        let winnerPid = sortedPids[0]; let winnerColor = getPlayerColor(winnerPid);
        let winnerName = playerNames[winnerPid] || `JOUEUR ${winnerPid}`;
        t.innerHTML = currentLang === 'FR' ? `<span style="color:${winnerColor}; font-weight:700; text-shadow: 0 0 15px ${winnerColor}; text-transform: uppercase;">${winnerName} REMPORTE LA PARTIE !</span><br><br>` : `<span style="color:${winnerColor}; font-weight:700; text-shadow: 0 0 15px ${winnerColor}; text-transform: uppercase;">${winnerName} WINS THE GAME !</span><br><br>`;
        sortedPids.forEach(pid => { 
            let pseudo = playerNames[pid] || `Joueur ${pid}`;
            t.innerHTML += `<div style="color:${getPlayerColor(pid)}; margin: 8px; font-weight:600; font-size: 1.2em;">${pseudo} : ${finalScores[pid]} pts</div>`; 
        });
    }
}

// ==========================================
// SCRIPT DE NAVIGATION SWIPE GLOBAL
// ==========================================
const gamesHubList = [
    "../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html",
    "../cyber_smash/index.html", "../guessthemanga/index.html", "../drawer/index.html",
    "../texas_poker/index.html", "../blindtest/index.html", "../2048slime/index.html",
    "../worms/index.html"
];
let globalTouchStartX = 0, globalTouchStartY = 0; let globalTouchEndX = 0, globalTouchEndY = 0;

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    let diffX = globalTouchEndX - globalTouchStartX; let diffY = globalTouchEndY - globalTouchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < -swipeThreshold) navigateGames(1);       
        else if (diffX > swipeThreshold) navigateGames(-1);  
    } else {
        if (diffY < -swipeThreshold) navigateGames(1);       
        else if (diffY > swipeThreshold) navigateGames(-1);  
    }
}

function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => { let folderName = game.split('/')[1]; return currentPath.includes(folderName); });
    if (currentIndex === -1) return;
    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

function isExcludedElement(target) {
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'button' || tag === 'canvas' || tag === 'select') return true;
    if (target.closest('#game-container') || target.closest('#chat-messages')) return true;
    return false;
}

document.addEventListener('touchstart', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchStartX = e.changedTouches[0].screenX; globalTouchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchEndX = e.changedTouches[0].screenX; globalTouchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });

let isMouseDown = false;
document.addEventListener('mousedown', e => {
    if (isExcludedElement(e.target)) return;
    isMouseDown = true; globalTouchStartX = e.screenX; globalTouchStartY = e.screenY;
});

document.addEventListener('mouseup', e => {
    if (isExcludedElement(e.target) || !isMouseDown) { isMouseDown = false; return; }
    isMouseDown = false; globalTouchEndX = e.screenX; globalTouchEndY = e.screenY;
    handleSwipeGesture();
});
