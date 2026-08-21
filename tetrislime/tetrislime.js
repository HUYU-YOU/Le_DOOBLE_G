const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 30px par bloc

// Couleurs Néon / Slime pour chaque pièce
const COLORS = [
    null,
    '#00f0ff', // I - Cyan
    '#39ff14', // J - Vert Slime
    '#ffbf00', // L - Jaune/Orange
    '#ff007f', // O - Magenta
    '#9d00ff', // S - Violet
    '#ff3333', // T - Rouge
    '#0055ff'  // Z - Bleu sombre
];

// Matrice des formes de Tetris
const PIECES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]], // J
    [[0,0,3], [3,3,3], [0,0,0]], // L
    [[4,4], [4,4]], // O
    [[0,5,5], [5,5,0], [0,0,0]], // S
    [[0,6,0], [6,6,6], [0,0,0]], // T
    [[7,7,0], [0,7,7], [0,0,0]]  // Z
];

let board = [];
let piece = null;
let nextPieceMatrix = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let lines = 0;
let level = 1;
let gameActive = false;
let requestID = null;

// Initialiser le plateau vide
function createBoard() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

// Tirer une pièce au hasard
function randomPiece() {
    const typeId = Math.floor(Math.random() * (PIECES.length - 1)) + 1;
    return PIECES[typeId];
}

// Dessiner un BLOC SLIME (Avec effet gélatineux)
function drawSlimeBlock(context, x, y, colorId, size) {
    if (colorId === 0) return;
    const color = COLORS[colorId];
    
    context.fillStyle = color;
    context.shadowBlur = 10;
    context.shadowColor = color;
    
    // Arrondis pour l'effet gelée
    context.beginPath();
    context.roundRect(x * size + 1, y * size + 1, size - 2, size - 2, 6);
    context.fill();
    context.shadowBlur = 0;

    // Reflet blanc (brillance du slime)
    context.fillStyle = "rgba(255, 255, 255, 0.4)";
    context.beginPath();
    context.arc(x * size + 8, y * size + 8, size / 6, 0, Math.PI * 2);
    context.fill();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grille de fond subtile
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            if (board[r][c] !== 0) drawSlimeBlock(ctx, c, r, board[r][c], BLOCK_SIZE);
        }
    }
}

function drawPiece() {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawSlimeBlock(ctx, piece.x + x, piece.y + y, value, BLOCK_SIZE);
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const offset = nextPieceMatrix.length === 4 ? 0 : 1; // Centrer visuellement
    
    nextPieceMatrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawSlimeBlock(nextCtx, x + offset, y + 1, value, 25); // Taille réduite (25px)
            }
        });
    });
}

// Vérifier les collisions
function collide(board, p) {
    for (let y = 0; y < p.matrix.length; y++) {
        for (let x = 0; x < p.matrix[y].length; x++) {
            if (p.matrix[y][x] !== 0 &&
               (board[y + p.y] && board[y + p.y][x + p.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Fusionner la pièce au plateau
function merge(board, p) {
    p.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + p.y][x + p.x] = value;
            }
        });
    });
}

// Nettoyer les lignes pleines
function sweepLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        let lineScores = [0, 100, 300, 500, 800];
        score += lineScores[linesCleared] * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        document.getElementById('score').innerText = score;
        document.getElementById('lines').innerText = lines;
        document.getElementById('level').innerText = level;
    }
}

// Faire apparaître une nouvelle pièce
function spawnPiece() {
    if (!nextPieceMatrix) nextPieceMatrix = randomPiece();
    piece = { matrix: nextPieceMatrix, x: 0, y: 0 };
    piece.x = Math.floor(COLS / 2) - Math.floor(piece.matrix[0].length / 2);
    nextPieceMatrix = randomPiece();
    drawNextPiece();
    
    if (collide(board, piece)) {
        gameOver();
    }
}

function drop() {
    piece.y++;
    if (collide(board, piece)) {
        piece.y--;
        merge(board, piece);
        sweepLines();
        spawnPiece();
    }
    dropCounter = 0;
}

function hardDrop() {
    while(!collide(board, piece)) {
        piece.y++;
    }
    piece.y--;
    merge(board, piece);
    sweepLines();
    spawnPiece();
    dropCounter = 0;
}

function move(dir) {
    piece.x += dir;
    if (collide(board, piece)) {
        piece.x -= dir;
    }
}

function rotate() {
    const p = piece.matrix;
    // Transposition
    for (let y = 0; y < p.length; y++) {
        for (let x = 0; x < y; x++) {
            [p[x][y], p[y][x]] = [p[y][x], p[x][y]];
        }
    }
    // Reverse (Rotation 90°)
    p.forEach(row => row.reverse());
    
    // Si collision après rotation (Wall Kick basique)
    let offset = 1;
    const pos = piece.x;
    while(collide(board, piece)) {
        piece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > p[0].length) {
            // Rotation impossible
            piece.matrix.forEach(row => row.reverse());
            for (let y = 0; y < p.length; y++) {
                for (let x = 0; x < y; x++) {
                    [p[x][y], p[y][x]] = [p[y][x], p[x][y]];
                }
            }
            piece.x = pos;
            return;
        }
    }
}

function update(time = 0) {
    if (!gameActive) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) drop();
    
    drawBoard();
    drawPiece();
    requestID = requestAnimationFrame(update);
}

// --- CONTRÔLES ---
document.addEventListener('keydown', e => {
    if (!gameActive) return;
    
    // Eviter de scroller la page avec les flèches ou espace
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') drop();
    if (e.key === 'ArrowUp') rotate();
    if (e.key === ' ') hardDrop();
});

function startGame() {
    document.getElementById('btn-start').blur(); // Retirer le focus du bouton pour la barre espace
    createBoard();
    score = 0; lines = 0; level = 1; dropInterval = 1000;
    document.getElementById('score').innerText = score;
    document.getElementById('lines').innerText = lines;
    document.getElementById('level').innerText = level;
    
    nextPieceMatrix = null;
    spawnPiece();
    gameActive = true;
    lastTime = performance.now();
    cancelAnimationFrame(requestID);
    update();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(requestID);
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over-overlay').style.display = 'flex';
}

// Premier rendu à vide
createBoard();
drawBoard();
