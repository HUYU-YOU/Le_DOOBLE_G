// --- PARAMÈTRES & VARIABLES GLOBALES ---
const defaultDict = [
    {fr:"chat",en:"cat"}, {fr:"voiture",en:"car"}, {fr:"pomme",en:"apple"}, 
    {fr:"soleil",en:"sun"}, {fr:"maison",en:"house"}, {fr:"ordinateur",en:"computer"}
];
let dict = (typeof dictionary !== 'undefined' && dictionary.length > 0) ? dictionary : defaultDict;
let availableWords = [];

let peer = new Peer();
let myId = null, myName = "", isHost = false, myConn = null;
let connections = []; 

let state = {
    mode: "", lang: "fr", players: [],
    turnIndex: -1, currentWord: "", timeLeft: 0, round: 1, maxRounds: 3, // Classic
    chains: [] // Gartic
};

let classicTimer = null;
let correctGuessers = [];
let lastRenderedRound = -1;

// --- GESTION DES PARAMETRES (NOUVEAU) ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
}

// --- GESTION RESEAU ---
function setupPeerEvents(p) {
    p.on('open', id => { 
        myId = id; 
        if(document.getElementById('my-id')) document.getElementById('my-id').innerText = id; 
    });

    p.on('connection', conn => {
        if(!isHost) return;
        connections.push(conn);
        conn.on('data', data => {
            if(data.type === 'join') {
                state.players.push({ id: conn.peer, name: data.name, score: 0, isDone: false });
                updateLobbyUI();
                broadcastState();
            }
            if(data.type === 'chat') handleChat(conn.peer, data.msg);
            if(data.type === 'draw' || data.type === 'shape') { remoteDraw(data); relayData(data, conn.peer); }
            if(data.type === 'clear') { clearCanvasLocal(); relayData(data, conn.peer); }
            if(data.type === 'img_sync') { syncImage(data.src); relayData(data, conn.peer); }
            if(data.type === 'submit_gartic') handleGarticSubmission(conn.peer, data.content);
        });
        conn.on('close', () => {
            state.players = state.players.filter(player => player.id !== conn.peer);
            connections = connections.filter(c => c.peer !== conn.peer);
            broadcastState();
        });
    });
}

setupPeerEvents(peer);

function broadcastState() { if(isHost) connections.forEach(c => c.send({ type: 'state', state })); }
function broadcastData(data) { if(isHost) connections.forEach(c => c.send(data)); }
function relayData(data, senderId) { if(isHost) connections.forEach(c => { if(c.peer !== senderId) c.send(data); }); }

// --- MENU & LOBBY ---
function setLang(l) {
    state.lang = l;
    document.getElementById('flag-fr').classList.remove('active');
    document.getElementById('flag-en').classList.remove('active');
    document.getElementById('flag-' + l).classList.add('active');
}

function hostGame() {
    let code = 'DRW' + Math.floor(1000 + Math.random() * 9000);
    peer.destroy();
    peer = new Peer(code);
    setupPeerEvents(peer);
    
    myName = document.getElementById('player-name').value || "Hôte";
    isHost = true;
    state.players = [{ id: 'host', name: myName, score: 0, isDone: false }];
    
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('host-lobby').style.display = 'block';
    updateLobbyUI();
}

function joinGame() {
    myName = document.getElementById('player-name').value || "Joueur";
    let hostId = document.getElementById('join-id').value.toUpperCase().trim();
    if(!hostId) return;
    document.getElementById('status-text').innerText = "Connexion...";
    
    myConn = peer.connect(hostId);
    myConn.on('open', () => {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('wait-overlay').style.display = 'flex';
        document.getElementById('game-layout').style.display = 'flex';
        myConn.send({ type: 'join', name: myName });
    });
    
    myConn.on('data', data => {
        if(data.type === 'state') { state = data.state; renderUI(); }
        if(data.type === 'tick') updateTimerUI(data.time);
        if(data.type === 'chat') renderChat(data.sender, data.msg, data.sys, data.success);
        if(data.type === 'draw' || data.type === 'shape') remoteDraw(data);
        if(data.type === 'img_sync') syncImage(data.src);
        if(data.type === 'clear') clearCanvasLocal();
        if(data.type === 'gartic_results') showResults(data.chains);
        if(data.type === 'end_classic') showWinner(data.winner);
    });
}

function updateLobbyUI() {
    document.getElementById('lobby-players').innerHTML = state.players.map(p => 
        `<div>${p.name}</div>`
    ).join('');
}

function startGame(mode) {
    if(state.players.length < 2) { alert("2 joueurs minimum !"); return; }
    state.mode = mode;
    document.getElementById('host-lobby').style.display = 'none';
    document.getElementById('game-layout').style.display = 'flex';
    
    if(mode === 'classic') { 
        state.round = 1; 
        state.turnIndex = -1; 
        state.players.forEach(p => p.score = 0);
        availableWords = []; 
        nextClassicTurn(); 
    } 
    else { startGarticPhone(); }
}

// --- LOGIQUE CLASSIQUE ---
function getRandomWord() {
    if(availableWords.length === 0) {
        availableWords = [...dict];
        availableWords.sort(() => Math.random() - 0.5);
    }
    return availableWords.pop()[state.lang];
}

function nextClassicTurn() {
    clearInterval(classicTimer);
    undoStack = []; 
    
    state.turnIndex++;
    if(state.turnIndex >= state.players.length) {
        state.turnIndex = 0;
        state.round++;
    }

    if(state.round > state.maxRounds) {
        endClassicGame();
        return;
    }

    correctGuessers = [];
    state.currentWord = getRandomWord();
    state.timeLeft = 60; 
    
    clearCanvasLocal();
    relayData({ type: 'clear' }, 'host');
    broadcastState();

    classicTimer = setInterval(() => {
        state.timeLeft--;
        updateTimerUI(state.timeLeft);
        broadcastData({ type: 'tick', time: state.timeLeft });
        
        if(state.timeLeft <= 0) {
            clearInterval(classicTimer);
            broadcastData({ type: 'chat', sender: 'Système', msg: `Temps écoulé ! Le mot était : ${state.currentWord}`, sys: true });
            if(isHost) renderChat('Système', `Temps écoulé ! Le mot était : ${state.currentWord}`, true);
            setTimeout(nextClassicTurn, 4000);
        }
    }, 1000);
    
    renderUI();
}

function handleChat(peerId, msg) {
    if(state.mode !== 'classic') return;
    let p = state.players.find(x => x.id === peerId) || state.players[0];
    let isDrawer = (state.players[state.turnIndex].id === p.id);
    if(isDrawer) return; 
    
    let guess = msg.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    let target = state.currentWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    
    if(guess === target && !correctGuessers.includes(p.id)) {
        correctGuessers.push(p.id);
        let pts = state.players.length - correctGuessers.length;
        p.score += pts;
        state.players[state.turnIndex].score += 1;
        
        broadcastData({ type: 'chat', sender: 'Système', msg: `${p.name} a trouvé ! (+${pts} pts)`, sys: true, success: true });
        if(isHost) renderChat('Système', `${p.name} a trouvé ! (+${pts} pts)`, true, true);
        
        if(correctGuessers.length >= state.players.length - 1) {
            clearInterval(classicTimer);
            broadcastData({ type: 'chat', sender: 'Système', msg: `Tout le monde a trouvé ! Le mot était ${state.currentWord}`, sys: true });
            if(isHost) renderChat('Système', `Tout le monde a trouvé ! Le mot était ${state.currentWord}`, true);
            setTimeout(nextClassicTurn, 4000);
        }
        broadcastState();
    } else {
        broadcastData({ type: 'chat', sender: p.name, msg: msg });
        if(isHost) renderChat(p.name, msg);
    }
}

function endClassicGame() {
    let maxScore = -1;
    let winners = [];
    state.players.forEach(p => {
        if(p.score > maxScore) { maxScore = p.score; winners = [p.name]; }
        else if(p.score === maxScore) { winners.push(p.name); }
    });
    
    let winnerText = winners.join(' et ') + " avec " + maxScore + " points !";
    broadcastData({ type: 'end_classic', winner: winnerText });
    showWinner(winnerText);
    setTimeout(() => { location.reload(); }, 10000); 
}

// --- LOGIQUE GARTIC PHONE ---
function startGarticPhone() {
    state.round = 0;
    state.chains = state.players.map(p => ({ originalAuthor: p.name, steps: [] }));
    state.players.forEach(p => p.isDone = false);
    undoStack = [];
    broadcastState();
    renderUI();
}

function handleGarticSubmission(peerId, content) {
    let pIndex = state.players.findIndex(x => x.id === peerId);
    if(pIndex === -1) return;
    
    let chainIndex = (pIndex + state.round) % state.players.length;
    let stepType = (state.round % 2 === 0) ? 'text' : 'img';
    
    state.chains[chainIndex].steps.push({ author: state.players[pIndex].name, type: stepType, content: content });
    state.players[pIndex].isDone = true;
    
    broadcastState();
    renderUI();

    if(state.players.every(p => p.isDone)) {
        state.round++;
        state.players.forEach(p => p.isDone = false);
        undoStack = [];
        
        let targetRounds = (state.players.length % 2 === 0) ? (state.players.length + 1) : state.players.length;

        if(state.round >= targetRounds) {
            broadcastData({ type: 'gartic_results', chains: state.chains });
            showResults(state.chains);
        } else {
            broadcastState();
            renderUI();
        }
    }
}

function submitGarticAction() {
    let content = (state.round % 2 === 0) 
        ? (document.getElementById('action-input').value.trim() || "Un mystère...") 
        : drawCanvas.toDataURL('image/png');
    
    document.getElementById('action-overlay').style.display = 'none';
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('wait-overlay').style.display = 'flex';
    document.getElementById('wait-desc').innerText = "Attente des autres joueurs...";
    
    if(isHost) handleGarticSubmission('host', content);
    else myConn.send({ type: 'submit_gartic', content: content });
}

// --- INTERFACE GLOBALE ---
function renderUI() {
    let myPlayerId = isHost ? 'host' : myId;
    let myIndex = state.players.findIndex(p => p.id === myPlayerId);
    
    document.getElementById('players-list').innerHTML = state.players.map((p, i) => {
        let isActive = (state.mode === 'classic' && i === state.turnIndex);
        let isDone = (state.mode === 'gartic' && p.isDone);
        return `<div class="player-card ${isActive?'active':''} ${isDone?'done':''}">
                    <b>${p.name}</b>
                    ${state.mode === 'classic' ? `<span>${p.score} pts${isActive?'🖍️':''}</span>` : (isDone?'✅':'⏳')}
                </div>`;
    }).join('');

    document.getElementById('wait-overlay').style.display = 'none';
    document.getElementById('action-overlay').style.display = 'none';
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('gartic-image').style.display = 'none';
    drawCanvas.style.pointerEvents = 'none';

    if(state.mode === 'classic') {
        document.getElementById('chat-box').style.display = 'flex';
        document.getElementById('btn-submit-draw').style.display = 'none';
        updateTimerUI(state.timeLeft);
        
        if(state.turnIndex === myIndex) {
            document.getElementById('turn-info').innerText = "À toi de dessiner !";
            document.getElementById('word-display').innerText = state.currentWord;
            document.getElementById('toolbar').style.display = 'flex';
            drawCanvas.style.pointerEvents = 'auto';
        } else {
            let pName = state.players[state.turnIndex] ? state.players[state.turnIndex].name : "?";
            document.getElementById('turn-info').innerText = `${pName} dessine...`;
            document.getElementById('word-display').innerText = state.currentWord.replace(/[a-zA-Z]/g, '_');
        }
    } 
    else if (state.mode === 'gartic') {
        document.getElementById('chat-box').style.display = 'none';
        
        let totalRounds = (state.players.length % 2 === 0) ? (state.players.length + 1) : state.players.length;
        updateTimerUI(`Round ${state.round + 1}/${totalRounds}`);
        
        if(state.round !== lastRenderedRound) {
            clearCanvasLocal(); 
            document.getElementById('action-input').value = "";
            lastRenderedRound = state.round;
        }
        
        if(state.players[myIndex] && state.players[myIndex].isDone) {
            document.getElementById('wait-overlay').style.display = 'flex';
            document.getElementById('turn-info').innerText = "En attente...";
            return;
        }
        
        let chainIndex = (myIndex + state.round) % state.players.length;
        let myChain = state.chains[chainIndex];
        
        if(state.round % 2 === 0) {
            document.getElementById('action-overlay').style.display = 'flex';
            if(state.round === 0) {
                document.getElementById('action-title').innerText = "Invente une phrase de ZINZIN !";
                document.getElementById('turn-info').innerText = "Écriture du mot secret";
            } else {
                document.getElementById('action-title').innerText = "Que représente ce dessin ?";
                document.getElementById('gartic-image').src = myChain.steps[myChain.steps.length - 1].content;
                document.getElementById('gartic-image').style.display = 'block';
                document.getElementById('turn-info').innerText = "Devine ce dessin";
            }
        } else {
            document.getElementById('word-display').innerText = myChain.steps[myChain.steps.length - 1].content;
            document.getElementById('turn-info').innerText = "Dessine moi ca :";
            document.getElementById('toolbar').style.display = 'flex';
            document.getElementById('btn-submit-draw').style.display = 'block';
            drawCanvas.style.pointerEvents = 'auto'; 
        }
    }
}

function updateTimerUI(txt) {
    let t = document.getElementById('timer');
    if(t && state.mode === 'gartic') t.innerText = txt;
    else if(t && state.mode === 'classic' && typeof txt === 'number') {
         t.innerHTML = `Tours : ${state.round}/${state.maxRounds} <br> <span style="color:#ff007f">${txt}s</span>`;
    }
}

function sendChat() {
    let input = document.getElementById('chat-input');
    let msg = input.value.trim();
    if(!msg) return;
    if(isHost) handleChat('host', msg);
    else myConn.send({ type: 'chat', msg: msg });
    input.value = "";
}

function renderChat(sender, msg, sys = false, success = false) {
    let box = document.getElementById('chat-messages');
    let cls = sys ? 'chat-msg chat-sys' : 'chat-msg';
    if(success) cls += ' chat-success';
    box.innerHTML += `<div class="${cls}"><b>${sender}:</b> ${msg}</div>`;
    box.scrollTop = box.scrollHeight;
}

function showWinner(winnerText) {
    document.getElementById('winner-name').innerText = winnerText;
    document.getElementById('winner-overlay').style.display = 'flex';
}

function showResults(chains) {
    document.getElementById('game-layout').style.display = 'none';
    document.getElementById('chains-container').innerHTML = chains.map(chain => `
        <div class="chain-box">
            <h2 style="color:var(--cyan); text-align:center; margin-top:0;">L'histoire de ${chain.originalAuthor}</h2>
            ${chain.steps.map(step => `
                <div class="step-box">
                    <b style="color:var(--teal);">${step.author}${step.type === 'text' ? 'a écrit :' : 'a dessiné :'}</b><br>
                    ${step.type === 'text' ? `<h3 style="margin:10px 0;">"${step.content}"</h3>` : `<img src="${step.content}">`}
                </div>
            `).join('')}
        </div>
    `).join('');
    document.getElementById('results-screen').style.display = 'flex';
}

// --- MOTEUR DESSIN CANVAS ---
const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
let isDrawing = false, startX = 0, startY = 0, lastX = 0, lastY = 0, currentTool = 'pen'; 
let snapshot; 
let undoStack = []; 

ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

function getMousePos(e) {
    let rect = drawCanvas.getBoundingClientRect();
    let cX = e.touches ? e.touches[0].clientX : e.clientX;
    let cY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cX - rect.left) * (drawCanvas.width / rect.width), y: (cY - rect.top) * (drawCanvas.height / rect.height) };
}

function setTool(tool, btn) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    if(btn) {
        btn.classList.add('active');
        if(btn.tagName !== 'SELECT') document.getElementById('shapePicker').value = 'pen';
    }
}

function clearCanvas() {
    saveState(); 
    clearCanvasLocal();
    if (state.mode === 'classic') {
        if(isHost) relayData({ type: 'clear' }, 'host');
        else myConn.send({ type: 'clear' });
    }
}
function clearCanvasLocal() { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height); }

function saveState() {
    if (undoStack.length > 15) undoStack.shift(); 
    undoStack.push(drawCanvas.toDataURL('image/png'));
}

function undoDraw() {
    if (undoStack.length > 0) {
        let imgData = undoStack.pop();
        syncImage(imgData); 
        if (state.mode === 'classic') {
            let syncObj = { type: 'img_sync', src: imgData };
            if(isHost) relayData(syncObj, 'host'); else myConn.send(syncObj);
        }
    }
}

function syncImage(dataUrl) {
    let img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        clearCanvasLocal();
        ctx.drawImage(img, 0, 0);
    };
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoDraw(); }
});

drawCanvas.addEventListener('mousedown', startDraw); drawCanvas.addEventListener('mousemove', drawing);
drawCanvas.addEventListener('mouseup', stopDraw); drawCanvas.addEventListener('mouseout', stopDraw);
drawCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); });
drawCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawing(e); });
drawCanvas.addEventListener('touchend', stopDraw);

function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 255 };
}

function floodFill(startX, startY, fillColorHex) {
    let imgData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    let data = imgData.data;
    let startPos = (Math.floor(startY) * drawCanvas.width + Math.floor(startX)) * 4;
    
    let startR = data[startPos], startG = data[startPos + 1], startB = data[startPos + 2], startA = data[startPos + 3];
    let fillRgb = hexToRgb(fillColorHex);

    if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b && startA === fillRgb.a) return;

    let stack = [[Math.floor(startX), Math.floor(startY)]];
    
    function matchStartColor(pos) { return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA; }
    function colorPixel(pos) { data[pos] = fillRgb.r; data[pos + 1] = fillRgb.g; data[pos + 2] = fillRgb.b; data[pos + 3] = fillRgb.a; }

    while (stack.length > 0) {
        let [x, y] = stack.pop();
        let left = x, right = x;
        while (left > 0 && matchStartColor((y * drawCanvas.width + (left - 1)) * 4)) left--;
        while (right < drawCanvas.width - 1 && matchStartColor((y * drawCanvas.width + (right + 1)) * 4)) right++;

        for (let i = left; i <= right; i++) {
            colorPixel((y * drawCanvas.width + i) * 4);
            if (y > 0 && matchStartColor(((y - 1) * drawCanvas.width + i) * 4)) stack.push([i, y - 1]);
            if (y < drawCanvas.height - 1 && matchStartColor(((y + 1) * drawCanvas.width + i) * 4)) stack.push([i, y + 1]);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function startDraw(e) { 
    saveState(); 
    isDrawing = true; 
    let pos = getMousePos(e); 
    startX = pos.x; startY = pos.y; 
    lastX = pos.x; lastY = pos.y;
    snapshot = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);

    if (currentTool === 'fill') {
        let color = document.getElementById('colorPicker').value;
        floodFill(startX, startY, color);
        isDrawing = false; 
        
        if (state.mode === 'classic') {
            let fillData = { type: 'img_sync', src: drawCanvas.toDataURL() };
            if(isHost) relayData(fillData, 'host'); else myConn.send(fillData);
        }
    }
}

function drawing(e) {
    if (!isDrawing) return; 
    let pos = getMousePos(e);
    let color = currentTool === 'eraser' ? '#ffffff' : document.getElementById('colorPicker').value;
    let size = document.getElementById('sizePicker').value;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        drawLineLocal(lastX, lastY, pos.x, pos.y, color, size);
        if (state.mode === 'classic') {
            let drawData = { type: 'draw', x0: lastX, y0: lastY, x1: pos.x, y1: pos.y, color: color, size: size };
            if(isHost) relayData(drawData, 'host'); else myConn.send(drawData);
        }
        lastX = pos.x; lastY = pos.y;
    } else if (currentTool !== 'fill') {
        ctx.putImageData(snapshot, 0, 0); 
        drawShapeLocal(currentTool, startX, startY, pos.x, pos.y, color, size);
    }
}

function stopDraw(e) { 
    if (!isDrawing) return;
    isDrawing = false; 
    
    if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'fill') {
        let pos = getMousePos(e);
        let color = document.getElementById('colorPicker').value;
        let size = document.getElementById('sizePicker').value;
        
        if (state.mode === 'classic') {
            let shapeData = { type: 'shape', shape: currentTool, x0: startX, y0: startY, x1: pos.x, y1: pos.y, color: color, size: size };
            if(isHost) relayData(shapeData, 'host'); else myConn.send(shapeData);
        }
    }
}

function drawLineLocal(x0, y0, x1, y1, color, size) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = size; ctx.strokeStyle = color; ctx.stroke();
}

function drawShapeLocal(shapeType, x0, y0, x1, y1, color, size) {
    ctx.beginPath();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = size; ctx.strokeStyle = color;
    
    if (shapeType === 'line') {
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    } else if (shapeType === 'rect') {
        ctx.rect(x0, y0, x1 - x0, y1 - y0);
    } else if (shapeType === 'circle') {
        let radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    } else if (shapeType === 'triangle') {
        ctx.moveTo(x0 + (x1 - x0) / 2, y0); 
        ctx.lineTo(x1, y1);                 
        ctx.lineTo(x0, y1);                 
        ctx.closePath();                    
    }
    ctx.stroke();
}

function remoteDraw(data) { 
    if(data.type === 'draw') drawLineLocal(data.x0, data.y0, data.x1, data.y1, data.color, data.size); 
    else if(data.type === 'shape') drawShapeLocal(data.shape, data.x0, data.y0, data.x1, data.y1, data.color, data.size); 
}

// --- GESTION DU SWIPE TACTILE ---
const gamesHubList = [
    "../cybertank/index.html", "../tower_defense/index.html", "../edgeofwar/index.html",
    "../cyber_smash/index.html", "../guessthemanga/index.html", "../drawer/index.html", "../texas_poker/index.html"
];

let touchstartX = 0; let touchendX = 0;

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    if (touchendX < touchstartX - swipeThreshold) navigateGames(1);
    if (touchendX > touchstartX + swipeThreshold) navigateGames(-1);
}

function navigateGames(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = gamesHubList.findIndex(game => {
        let folderName = game.split('/')[1]; 
        return currentPath.includes(folderName);
    });
    if (currentIndex === -1) return;
    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

document.addEventListener('touchstart', e => {
    if (e.target.tagName.toLowerCase() === 'canvas' || e.target.tagName.toLowerCase() === 'input') return;
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (e.target.tagName.toLowerCase() === 'canvas' || e.target.tagName.toLowerCase() === 'input') return;
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, { passive: true });
