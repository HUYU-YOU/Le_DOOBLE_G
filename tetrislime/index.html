// ==========================================
// GESTION DU THÈME ET PARAMÈTRES
// ==========================================
let isNight = localStorage.getItem('tetrisNight') === 'true';

function applyTheme() {
    // Applique le bon background depuis le dossier assets
    document.body.style.backgroundImage = isNight ? "url('assets/backgroundnight.png')" : "url('assets/backgroundday.png')";
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
        themeBtn.innerText = isNight ? "Mode Nuit 🌙" : "Mode Jour ☀️";
    }
}

function toggleTheme() {
    isNight = !isNight;
    localStorage.setItem('tetrisNight', isNight);
    applyTheme();
}

// Initialise le thème au chargement
document.addEventListener('DOMContentLoaded', applyTheme);

// Animations du bouton paramètres
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0; settingsBtnImg.src = animFrames[currentFrame];
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
    settingsBtnImg.src = '../img/settings4.png'; toggleSettings();
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

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide');
});

// ==========================================
// ROUTAGE AUTO (HUB)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'solo') {
        document.getElementById('main-menu').style.display = 'none';
        startSolo();
    } else if (mode === 'multi') {
        document.getElementById('main-menu').style.display = 'none';
        openMultiMenu();
    }
});

// ==========================================
// MOTEUR TETRISLIME
// ==========================================
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCtx = document.getElementById('next-canvas').getContext('2d');
const holdCtx = document.getElementById('hold-canvas').getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; 

const SHAPES = [
    [], 
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // 1: BARRE 
    [[2,0,0], [2,2,2], [0,0,0]], // 2: J 
    [[0,0,3], [3,3,3], [0,0,0]], // 3: L
    [[4,4], [4,4]], // 4: CUBE 
    [[0,5,5], [5,5,0], [0,0,0]], // 5: S 
    [[0,6,0], [6,6,6], [0,0,0]], // 6: CROIX 
    [[7,7,0], [0,7,7], [0,0,0]]  // 7: Z 
];

const COLORS = [
    null,
    '#00f0ff', // Cyan
    '#0055ff', // Blue
    '#ffaa00', // Orange
    '#ffd700', // Yellow
    '#39ff14', // Green
    '#b82aff', // Purple
    '#ff007f', // Red
    '#666666'  // Garbage block (Multi)
];

let board = [];
let piece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let lines = 0;
let gameMode = 'solo'; 
let isGameOver = false;
let animationId;

let bestScore = parseInt(localStorage.getItem('tetriSlimeBest')) || 0;
document.getElementById('best-score').innerText = bestScore;

function createMatrix(w, h) {
    return Array.from({length: h}, () => Array(w).fill(0));
}

function randomPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    return {
        matrix: SHAPES[typeId],
        pos: { x: Math.floor(COLS/2) - Math.floor(SHAPES[typeId][0].length/2), y: 0 },
        type: typeId
    };
}

// Fonction de dessin : Look "Slime" généré par le code
function drawBlock(ctxTarget, x, y, size, colorIndex) {
    if (colorIndex === 0) return;
    const color = COLORS[colorIndex];
    
    ctxTarget.fillStyle = color;
    ctxTarget.beginPath();
    ctxTarget.roundRect(x * size + 1, y * size + 1, size - 2, size - 2, 6);
    ctxTarget.fill();
    
    ctxTarget.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctxTarget.beginPath();
    ctxTarget.roundRect(x * size + 3, y * size + 3, size - 6, size / 3, 4);
    ctxTarget.fill();
}

function drawMatrix(matrix, offset, ctxTarget, size = BLOCK_SIZE) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(ctxTarget, x + offset.x, y + offset.y, size, value);
            }
        });
    });
}

function drawGhost() {
    let ghost = { matrix: piece.matrix, pos: { x: piece.pos.x, y: piece.pos.y } };
    while (!collide(board, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--; 
    
    ctx.globalAlpha = 0.2;
    drawMatrix(ghost.matrix, ghost.pos, ctx);
    ctx.globalAlpha = 1.0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, {x:0, y:0}, ctx);
    
    if (piece) {
        drawGhost();
        drawMatrix(piece.matrix, piece.pos, ctx);
    }
}

function drawPreview(ctxTarget, p, size) {
    ctxTarget.clearRect(0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height);
    if (!p) return;
    const offset = {
        x: (ctxTarget.canvas.width / size - p.matrix[0].length) / 2,
        y: (ctxTarget.canvas.height / size - p.matrix.length) / 2
    };
    drawMatrix(p.matrix, offset, ctxTarget, size);
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotateMatrix(matrix) {
    return matrix.map((row, i) => row.map((val, j) => matrix[matrix.length - 1 - j][i]));
}

function playerRotate() {
    const pos = piece.pos.x;
    let offset = 1;
    piece.matrix = rotateMatrix(piece.matrix);
    while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            piece.matrix = rotateMatrix(rotateMatrix(rotateMatrix(piece.matrix)));
            piece.pos.x = pos;
            return;
        }
    }
}

function playerMove(dir) {
    piece.pos.x += dir;
    if (collide(board, piece)) piece.pos.x -= dir;
}

function playerDrop() {
    piece.pos.y++;
    if (collide(board, piece)) {
        piece.pos.y--;
        merge(board, piece);
        resetPiece();
        clearLines();
        canHold = true; 
    }
    dropCounter = 0;
}

function hold() {
    if (!canHold) return;
    if (holdPiece) {
        let temp = { matrix: holdPiece.matrix, type: holdPiece.type, pos: {x: Math.floor(COLS/2)-1, y:0} };
        holdPiece = { matrix: SHAPES[piece.type], type: piece.type };
        piece = temp;
    } else {
        holdPiece = { matrix: SHAPES[piece.type], type: piece.type };
        resetPiece();
    }
    canHold = false;
    drawPreview(holdCtx, holdPiece, 25);
}

function resetPiece() {
    if (!nextPiece) nextPiece = randomPiece();
    piece = nextPiece;
    nextPiece = randomPiece();
    drawPreview(nextCtx, nextPiece, 25);
    
    if (collide(board, piece)) { triggerGameOver(); }
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; --y) {
        for (let x = 0; x < COLS; ++x) {
            if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y; 
        linesCleared++;
    }

    if (linesCleared > 0) {
        let points = [0, 40, 100, 300, 1200];
        score += points[linesCleared];
        lines += linesCleared;
        dropInterval = Math.max(100, 1000 - (lines * 10)); 
        
        document.getElementById('score').innerText = score;
        document.getElementById('lines').innerText = lines;
        
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('tetriSlimeBest', bestScore);
            document.getElementById('best-score').innerText = bestScore;
        }

        if (gameMode === 'multi' && hostConn && hostConn.open && linesCleared >= 2) {
            let garbageSent = linesCleared === 4 ? 4 : linesCleared - 1;
            hostConn.send(JSON.stringify({ type: 'GARBAGE', amount: garbageSent }));
        }
    }

    if (gameMode === 'multi') broadcastBoard();
}

function receiveGarbage(amount) {
    const hole = Math.floor(Math.random() * COLS);
    for (let i = 0; i < amount; i++) {
        board.shift();
        let newRow = Array(COLS).fill(8); 
        newRow[hole] = 0;
        board.push(newRow);
    }
}

function triggerGameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    document.getElementById('final-score').innerText = score;
    
    if (gameMode === 'multi') {
        document.getElementById('end-title').innerText = "TU AS PERDU...";
        document.getElementById('end-title').style.color = "var(--p2)";
        if (hostConn && hostConn.open) {
            hostConn.send(JSON.stringify({ type: 'GAMEOVER' }));
        }
    } else {
        document.getElementById('end-title').innerText = "GAME OVER";
    }
    
    document.getElementById('game-over').style.display = 'flex';
}

function update(time = 0) {
    if (isGameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

// CONTRÔLES CLAVIER
document.addEventListener('keydown', event => {
    if (isGameOver || document.getElementById('game-ui').style.display === 'none') return;
    if (event.keyCode === 37) { playerMove(-1); } // Gauche
    else if (event.keyCode === 39) { playerMove(1); } // Droite
    else if (event.keyCode === 40) { playerDrop(); } // Bas
    else if (event.keyCode === 38) { playerRotate(); } // Haut
    else if (event.keyCode === 32) { 
        while (!collide(board, piece)) { piece.pos.y++; }
        piece.pos.y--; merge(board, piece); resetPiece(); clearLines(); canHold = true; dropCounter = 0;
    } // Espace (Hard Drop)
    else if (event.keyCode === 16 || event.keyCode === 67) { hold(); } // Shift ou C
});

// CONTRÔLES MOBILES
function moveLeft(e) { e.preventDefault(); playerMove(-1); }
function moveRight(e) { e.preventDefault(); playerMove(1); }
function rotate(e) { e.preventDefault(); playerRotate(); }
function drop(e) { e.preventDefault(); playerDrop(); }

// ==========================================
// LOGIQUE MULTIJOUEUR ET MENUS
// ==========================================
function startSolo() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'flex'; // Affichage du jeu
    gameMode = 'solo';
    board = createMatrix(COLS, ROWS);
    resetPiece();
    update();
}

function openMultiMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('network-menu').style.display = 'flex';
}

let peerNet = null;
let hostConn = null;
let isHost = false;
let roomCode = 'TET' + Math.floor(1000 + Math.random() * 9000);

const myIdEl = document.getElementById('my-id');
if (myIdEl) {
    myIdEl.innerText = roomCode;
    myIdEl.addEventListener('click', () => {
        navigator.clipboard.writeText(roomCode);
        myIdEl.style.color = '#fff'; setTimeout(() => myIdEl.style.color = 'var(--perfect)', 300);
    });
}

function hostGame() {
    isHost = true;
    if(peerNet) peerNet.destroy();
    peerNet = new Peer(roomCode);
    
    peerNet.on('open', () => {
        document.getElementById('status-text').innerText = "Salon ouvert ! En attente d'un adversaire...";
        document.getElementById('host-btn').style.display = 'none';
    });

    peerNet.on('connection', conn => {
        hostConn = conn;
        document.getElementById('status-text').innerText = "Adversaire connecté !";
        document.getElementById('start-net-btn').style.display = 'inline-block';
        setupConnectionListeners(hostConn);
    });
}

function joinGame() {
    const targetCode = document.getElementById('join-id').value.trim().toUpperCase();
    if (!targetCode) return alert("Il faut un code !");
    
    document.getElementById('status-text').innerText = "Connexion à " + targetCode + "...";
    if (peerNet) peerNet.destroy();
    peerNet = new Peer('P' + Math.floor(Math.random() * 10000));

    peerNet.on('open', () => {
        hostConn = peerNet.connect(targetCode);
        setupConnectionListeners(hostConn);
    });
}

function setupConnectionListeners(conn) {
    conn.on('open', () => {
        document.getElementById('status-text').innerText = isHost ? "Prêt à lancer !" : "Connecté, en attente de l'Hôte...";
    });

    conn.on('data', data => {
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
        
        if (data.type === 'START') {
            startMultiGameDisplay();
        } else if (data.type === 'BOARD_UPDATE') {
            const oppCanvas = document.getElementById('opponent-canvas');
            const oppCtx = oppCanvas.getContext('2d');
            oppCtx.clearRect(0, 0, oppCanvas.width, oppCanvas.height);
            drawMatrix(data.board, {x:0, y:0}, oppCtx, 15);
        } else if (data.type === 'GARBAGE') {
            receiveGarbage(data.amount);
        } else if (data.type === 'GAMEOVER') {
            isGameOver = true;
            cancelAnimationFrame(animationId);
            document.getElementById('end-title').innerText = "VICTOIRE !";
            document.getElementById('end-title').style.color = "var(--perfect)";
            document.getElementById('final-score').innerText = score;
            document.getElementById('game-over').style.display = 'flex';
        }
    });
}

function startMultiGame() {
    if (isHost && hostConn && hostConn.open) {
        hostConn.send(JSON.stringify({ type: 'START' }));
        startMultiGameDisplay();
    }
}

function startMultiGameDisplay() {
    document.getElementById('network-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'flex';
    document.getElementById('opponent-box').style.display = 'block';
    
    gameMode = 'multi';
    board = createMatrix(COLS, ROWS);
    resetPiece();
    update();
}

function broadcastBoard() {
    if (hostConn && hostConn.open) {
        let tempBoard = JSON.parse(JSON.stringify(board));
        if (piece) {
            piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0 && tempBoard[y + piece.pos.y]) {
                        tempBoard[y + piece.pos.y][x + piece.pos.x] = value;
                    }
                });
            });
        }
        hostConn.send(JSON.stringify({ type: 'BOARD_UPDATE', board: tempBoard }));
    }
}
