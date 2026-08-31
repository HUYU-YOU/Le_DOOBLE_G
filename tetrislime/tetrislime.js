// ==========================================
// GESTION DU THÈME ET PARAMÈTRES
// ==========================================
let isNight = localStorage.getItem('tetrisNight') === 'true';

function applyTheme() {
    document.body.style.backgroundImage = isNight ? "url('assets/backgrounnight.png')" : "url('assets/backgrounday.png')";
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
    const gameUi = document.getElementById('game-ui');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));
    
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        container.classList.add('size-classic'); document.getElementById('btn-sz-classic').classList.add('active');
        gameUi.style.transform = 'scale(0.8)';
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        container.classList.add('size-wide'); document.getElementById('btn-sz-wide').classList.add('active');
        gameUi.style.transform = 'scale(1.2)'; 
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        container.classList.add('size-full'); document.getElementById('btn-sz-full').classList.add('active');
        gameUi.style.transform = 'scale(1.4)';
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide');
});

// ==========================================
// MOTEUR TETRISLIME ET MATRICES EXPLICITES
// ==========================================
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCtx = document.getElementById('next-canvas').getContext('2d');
const holdCtx = document.getElementById('hold-canvas').getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; 

// VARIABLE DE DEBUG (Touche D)
let isDebug = false;

const skinNames = [
    'BARRE', 'BARRE90', 
    'L0', 'L90', 'L180', 'L270', 
    'Z', 'Z90', 'Z180', 'Z270',
    'CROIX', 'CROIX90', 'CROIX180', 'CROIX270',
    'CUBE'
];

const skins = {};
skinNames.forEach(name => {
    skins[name] = new Image();
    skins[name].onload = () => {
        if (typeof draw === 'function') draw();
        if (typeof nextPiece !== 'undefined' && nextPiece) drawPreview(nextCtx, nextPiece, 25);
        if (typeof holdPiece !== 'undefined' && holdPiece) drawPreview(holdCtx, holdPiece, 25);
    };
    // ANTI-CACHE (Empêche le navigateur de garder une vieille image)
    skins[name].src = `assets/${name}.png?v=${new Date().getTime()}`;
});

const SHAPES = {
    1: [ // BARRE
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], 
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    2: [ // L ORANGE
        [[2,0,0], [2,2,2], [0,0,0]], 
        [[2,2,0], [2,0,0], [2,0,0]], 
        [[0,0,2], [2,2,2], [0,0,0]], 
        [[2,0,0], [2,0,0], [2,2,0]]  
    ],
    3: [ // CUBE
        [[3,3], [3,3]],
        [[3,3], [3,3]],
        [[3,3], [3,3]],
        [[3,3], [3,3]]
    ],
    4: [ // Z
        [[0,4,4], [4,4,0], [0,0,0]], 
        [[4,0,0], [4,4,0], [0,4,0]], 
        [[0,4,4], [4,4,0], [0,0,0]], 
        [[4,0,0], [4,4,0], [0,4,0]]  
    ],
    5: [ // CROIX (La pièce T)
        [[0,5,0], [5,5,5], [0,0,0]], 
        [[0,5,0], [5,5,0], [0,5,0]], 
        [[0,0,0], [5,5,5], [0,5,0]], 
        [[0,5,0], [0,5,5], [0,5,0]]  
    ]
};

const COLORS = [ null, '#00f0ff', '#ffaa00', '#ffd700', '#39ff14', '#b82aff', '#666666'];

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

function createMatrix(w, h) { return Array.from({length: h}, () => Array(w).fill(0)); }

function randomPiece() {
    const typeId = Math.floor(Math.random() * 5) + 1;
    return {
        matrix: SHAPES[typeId][0],
        pos: { x: Math.floor(COLS/2) - Math.floor(SHAPES[typeId][0][0].length/2), y: 0 },
        type: typeId,
        rotIndex: 0 
    };
}

function getImgName(type, rotIndex) {
    if (type === 3) return 'CUBE';
    
    // Inversion des skins de la Barre
    if (type === 1) return (rotIndex === 0 || rotIndex === 180) ? 'BARRE' : 'BARRE90';
    
    // L ORANGE
    if (type === 2) {
        if (rotIndex === 0) return 'L0';
        if (rotIndex === 90) return 'L270';  
        if (rotIndex === 180) return 'L180';
        if (rotIndex === 270) return 'L90';
    }
    
    if (type === 4) return rotIndex === 0 ? 'Z' : 'Z' + rotIndex;
    
    // Inversion de la Croix (T) pour les côtés gauche/droite
    if (type === 5) {
        if (rotIndex === 0) return 'CROIX';
        if (rotIndex === 90) return 'CROIX270';
        if (rotIndex === 180) return 'CROIX180';
        if (rotIndex === 270) return 'CROIX90';
    }
    
    return null;
}

function getMatrixBounds(matrix) {
    let minX = matrix[0].length, maxX = 0, minY = matrix.length, maxY = 0;
    let hasBlocks = false;
    matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val !== 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasBlocks = true;
            }
        });
    });
    if (!hasBlocks) return { minX: 0, minY: 0, w: matrix[0].length, h: matrix.length };
    return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function drawBlock(ctxTarget, x, y, size, colorIndex) {
    if (colorIndex === 0) return;
    ctxTarget.fillStyle = COLORS[colorIndex] || '#666666';
    ctxTarget.beginPath(); ctxTarget.roundRect(x * size + 1, y * size + 1, size - 2, size - 2, 6); ctxTarget.fill();
    ctxTarget.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctxTarget.beginPath(); ctxTarget.roundRect(x * size + 3, y * size + 3, size - 6, size / 3, 4); ctxTarget.fill();
}

function drawMatrix(matrix, offset, ctxTarget, size = BLOCK_SIZE) {
    matrix.forEach((row, y) => { 
        row.forEach((cell, x) => { 
            if (cell !== 0) {
                if (typeof cell === 'object') {
                    let imgName = getImgName(cell.type, cell.rot);
                    let img = skins[imgName];
                    
                    if (img && img.complete && img.naturalWidth > 0 && !isDebug) {
                        let drawW = cell.boxW * size;
                        let drawH = cell.boxH * size;
                        let destX = (x + offset.x) * size;
                        let destY = (y + offset.y) * size;

                        ctxTarget.save();
                        ctxTarget.beginPath();
                        ctxTarget.rect(destX, destY, size, size);
                        ctxTarget.clip();

                        let imgDrawX = destX - (cell.imgX * size);
                        let imgDrawY = destY - (cell.imgY * size);

                        ctxTarget.drawImage(img, imgDrawX, imgDrawY, drawW, drawH);
                        ctxTarget.restore();
                    } else {
                        drawBlock(ctxTarget, x + offset.x, y + offset.y, size, cell.val);
                    }
                } else {
                    drawBlock(ctxTarget, x + offset.x, y + offset.y, size, cell);
                }
            } 
        }); 
    });
}

function drawPiece(ctxTarget, p, size, offsetX = 0, offsetY = 0) {
    let imgName = getImgName(p.type, p.rotIndex);
    let img = skins[imgName];
    let bounds = getMatrixBounds(p.matrix);
    
    if (img && img.complete && img.naturalWidth > 0 && !isDebug) {
        ctxTarget.drawImage(
            img, 
            (p.pos.x + offsetX + bounds.minX) * size, 
            (p.pos.y + offsetY + bounds.minY) * size, 
            bounds.w * size, 
            bounds.h * size
        );
    } else {
        drawMatrix(p.matrix, {x: p.pos.x + offsetX, y: p.pos.y + offsetY}, ctxTarget, size);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, {x:0, y:0}, ctx);
    
    if (piece) {
        let ghostY = piece.pos.y;
        while (!collide(board, {matrix: piece.matrix, pos: {x: piece.pos.x, y: ghostY + 1}})) ghostY++;
        ctx.globalAlpha = 0.2;
        drawPiece(ctx, { ...piece, pos: {x: piece.pos.x, y: ghostY} }, BLOCK_SIZE);
        ctx.globalAlpha = 1.0;
        
        drawPiece(ctx, piece, BLOCK_SIZE);
    }
}

function drawPreview(ctxTarget, p, size) {
    ctxTarget.clearRect(0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height);
    if (!p) return;
    
    let imgName = getImgName(p.type, p.rotIndex);
    let img = skins[imgName];
    let bounds = getMatrixBounds(p.matrix);
    
    let drawX = (ctxTarget.canvas.width - bounds.w * size) / 2;
    let drawY = (ctxTarget.canvas.height - bounds.h * size) / 2;

    if (img && img.complete && img.naturalWidth > 0 && !isDebug) {
        ctxTarget.drawImage(img, drawX, drawY, bounds.w * size, bounds.h * size);
    } else {
        drawMatrix(p.matrix, {
            x: (ctxTarget.canvas.width/size - p.matrix[0].length)/2, 
            y: (ctxTarget.canvas.height/size - p.matrix.length)/2
        }, ctxTarget, size);
    }
}

function collide(arena, player) {
    const m = player.matrix; const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    let bounds = getMatrixBounds(player.matrix);
    player.matrix.forEach((row, py) => {
        row.forEach((value, px) => {
            if (value !== 0) {
                arena[py + player.pos.y][px + player.pos.x] = {
                    val: value,
                    type: player.type,
                    rot: player.rotIndex,
                    imgX: px - bounds.minX, 
                    imgY: py - bounds.minY, 
                    boxW: bounds.w,
                    boxH: bounds.h
                };
            }
        });
    });
}

function playerRotate() {
    const pos = piece.pos.x;
    let offset = 1;
    let nextRot = (piece.rotIndex + 90) % 360;
    let nextMatrix = SHAPES[piece.type][nextRot / 90];
    
    let prevMatrix = piece.matrix;
    let prevRot = piece.rotIndex;
    
    piece.matrix = nextMatrix;
    piece.rotIndex = nextRot;
    
    while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            piece.matrix = prevMatrix;
            piece.rotIndex = prevRot;
            piece.pos.x = pos;
            return;
        }
    }
}

function playerMove(dir) { piece.pos.x += dir; if (collide(board, piece)) piece.pos.x -= dir; }

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
        let temp = { matrix: holdPiece.matrix, type: holdPiece.type, rotIndex: holdPiece.rotIndex, pos: {x: Math.floor(COLS/2) - Math.floor(holdPiece.matrix[0].length/2), y: 0} };
        holdPiece = { matrix: SHAPES[piece.type][0], type: piece.type, rotIndex: 0 };
        piece = temp;
    } else {
        holdPiece = { matrix: SHAPES[piece.type][0], type: piece.type, rotIndex: 0 };
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
        for (let x = 0; x < COLS; ++x) if (board[y][x] === 0) continue outer;
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y; linesCleared++;
    }

    if (linesCleared > 0) {
        let points = [0, 40, 100, 300, 1200];
        score += points[linesCleared];
        lines += linesCleared;
        dropInterval = Math.max(100, 1000 - (lines * 10)); 
        
        document.getElementById('score').innerText = score;
        document.getElementById('lines').innerText = lines;
        
        if (score > bestScore) {
            bestScore = score; localStorage.setItem('tetriSlimeBest', bestScore);
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
        let newRow = Array(COLS).fill(6); 
        newRow[hole] = 0; board.push(newRow);
    }
}

function triggerGameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    document.getElementById('final-score').innerText = score;
    
    if (gameMode === 'multi') {
        document.getElementById('end-title').innerText = "TU AS PERDU...";
        document.getElementById('end-title').style.color = "var(--p2)";
        if (hostConn && hostConn.open) hostConn.send(JSON.stringify({ type: 'GAMEOVER' }));
    } else {
        document.getElementById('end-title').innerText = "GAME OVER";
    }
    document.getElementById('game-over').style.display = 'flex';
}

function update(time = 0) {
    if (isGameOver) return;
    const deltaTime = time - lastTime; lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();
    draw();
    animationId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (isGameOver || document.getElementById('game-ui').style.display === 'none') return;
    
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.keyCode === 68) { 
        event.preventDefault();
        isDebug = !isDebug;
        draw();
        if (nextPiece) drawPreview(nextCtx, nextPiece, 25);
        if (holdPiece) drawPreview(holdCtx, holdPiece, 25);
        return; 
    }

    if (event.keyCode === 37) { event.preventDefault(); playerMove(-1); } // Gauche
    else if (event.keyCode === 39) { event.preventDefault(); playerMove(1); } // Droite
    else if (event.keyCode === 40) { event.preventDefault(); playerDrop(); } // Bas
    else if (event.keyCode === 38) { event.preventDefault(); playerRotate(); } // Haut
    else if (event.keyCode === 32) { 
        event.preventDefault(); 
        while (!collide(board, piece)) { piece.pos.y++; }
        piece.pos.y--; merge(board, piece); resetPiece(); clearLines(); canHold = true; dropCounter = 0;
    } // Espace
    else if (event.keyCode === 16 || event.keyCode === 67) { event.preventDefault(); hold(); } // Shift
});

function moveLeft(e) { e.preventDefault(); playerMove(-1); }
function moveRight(e) { e.preventDefault(); playerMove(1); }
function rotate(e) { e.preventDefault(); playerRotate(); }
function drop(e) { e.preventDefault(); playerDrop(); }

// ==========================================
// ROUTAGE AUTO ET LANCEMENT DIRECT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    setGameSize('wide'); 

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'solo') {
        setTimeout(() => {
            document.getElementById('main-menu').style.display = 'none';
            startSolo();
        }, 50);
    } else if (mode === 'multi') {
        setTimeout(() => {
            document.getElementById('main-menu').style.display = 'none';
            openMultiMenu();
        }, 50);
    }
});

// ==========================================
// MENUS MULTIJOUEUR
// ==========================================
function startSolo() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'flex'; 
    gameMode = 'solo';
    board = createMatrix(COLS, ROWS);
    resetPiece();
    update();
}

function openMultiMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('network-menu').style.display = 'flex';
}

let peerNet = null; let hostConn = null; let isHost = false;
let roomCode = 'TET' + Math.floor(1000 + Math.random() * 9000);

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
                    if (value !== 0 && tempBoard[y + piece.pos.y]) tempBoard[y + piece.pos.y][x + piece.pos.x] = value;
                });
            });
        }
        hostConn.send(JSON.stringify({ type: 'BOARD_UPDATE', board: tempBoard }));
    }
}
