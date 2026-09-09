// ==========================================
// GESTION TAILLE ÉCRAN & ANIMATION SETTINGS
// ==========================================

// Lancement auto en Large
window.addEventListener('DOMContentLoaded', () => {
    setGameSize('wide');
});

function setGameSize(size) {
    const wrapper = document.getElementById('main-wrapper');
    const btns = document.querySelectorAll('.btn-size');
    btns.forEach(b => b.classList.remove('active'));

    wrapper.classList.remove('size-classic', 'size-wide', 'size-full');
    
    if (size === 'classic') {
        wrapper.classList.add('size-classic');
        document.getElementById('btn-sz-classic').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } 
    else if (size === 'wide') {
        wrapper.classList.add('size-wide');
        document.getElementById('btn-sz-wide').classList.add('active');
        if (document.fullscreenElement) document.exitFullscreen();
    } 
    else if (size === 'full') {
        wrapper.classList.add('size-full');
        document.getElementById('btn-sz-full').classList.add('active');
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.log(e));
        }
    }
    
    // Forcer le reflow des tuiles pour qu'elles s'adaptent instantanément
    setTimeout(updateTileElements, 50);
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.getElementById('main-wrapper').classList.contains('size-full')) {
        setGameSize('wide');
    }
});

// Animation du Bouton Settings
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

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('show');
}


// ==========================================
// MOTEUR DE JEU JAVASCRIPT
// ==========================================

// --- AUDIO : BRUITAGES PIKMIN / PLAYTEST ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'merge') {
        osc.type = 'sine'; 
        let baseFreq = 700 + (Math.random() * 400); 
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1); 
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); 
        
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'gameover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// --- CONFIGURATION DES IMAGES DE SLIME ---
const slimeImages = {
    2: 'img/slime1.png',
    4: 'img/slime2.png',
    8: 'img/slime3.png',
    16: 'img/slime4.png',
    32: 'img/slime5.png',
    64: 'img/slime6.png',
    128: 'img/slime7.png',
    256: 'img/slime8.png',
    512: 'img/slime9.png',
    1024: 'img/slime10.png',
    2048: 'img/slime11.png',
    4096: 'img/slime12.png',
    8192: 'img/slime13.png',
};

const gridBg = document.getElementById('grid-bg');
const tilesContainer = document.getElementById('tiles-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameOverScreen = document.getElementById('game-over');

let board = [];
let score = 0;
let tileIdCounter = 0;
let tiles = {};

// --- GESTION DU MEILLEUR SCORE ---
let bestScore = localStorage.getItem('fuslime1_best_score') || 0;
bestScoreElement.innerText = bestScore;

// Générer les 16 cases de fond
for (let i = 0; i < 16; i++) {
    let cell = document.createElement('div');
    cell.className = 'grid-cell';
    gridBg.appendChild(cell);
}

function initBoard() {
    board = [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]];
    tiles = {};
    tilesContainer.innerHTML = '';
    score = 0;
    updateScore();
    gameOverScreen.style.display = 'none';
    addRandomTile();
    addRandomTile();
}

function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!board[r][c]) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length === 0) return;

    let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    let value = Math.random() < 0.9 ? 2 : 4;
    
    let id = tileIdCounter++;
    let tileObj = { id: id, value: value, r: randomCell.r, c: randomCell.c };
    
    board[randomCell.r][randomCell.c] = tileObj;
    tiles[id] = tileObj;
    
    createTileElement(tileObj, true);
}

function getPosition(index) {
    return `calc(${index * 25}% + ${index * 10 / 3}px)`; 
}

function createTileElement(tile, isNew = false) {
    let div = document.createElement('div');
    div.className = `tile tile-${tile.value}`;
    div.id = `tile-${tile.id}`;
    div.innerText = tile.value; 
    
    if(slimeImages[tile.value]) {
        div.style.backgroundImage = `url('${slimeImages[tile.value]}')`;
        div.style.color = 'transparent'; 
        div.style.backgroundColor = 'transparent'; 
        div.style.boxShadow = 'none'; 
    }

    div.style.top = getPosition(tile.r);
    div.style.left = getPosition(tile.c);
    
    if (isNew) div.classList.add('tile-new');
    
    tilesContainer.appendChild(div);
}

function updateTileElements() {
    for (let id in tiles) {
        let tile = tiles[id];
        let div = document.getElementById(`tile-${tile.id}`);
        if (div) {
            div.style.top = getPosition(tile.r);
            div.style.left = getPosition(tile.c);
        }
    }
}

function removeTileElement(id, targetR, targetC) {
    let div = document.getElementById(`tile-${id}`);
    if (div) {
        div.style.zIndex = "1"; 
        if (targetR !== undefined && targetC !== undefined) {
            div.style.top = getPosition(targetR); 
            div.style.left = getPosition(targetC);
        }
        setTimeout(() => { div.remove(); }, 150); 
    }
    delete tiles[id]; 
}

function updateScore() { 
    scoreElement.innerText = score; 
    
    // Mise à jour du Best Score en temps réel
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('fuslime1_best_score', bestScore);
        bestScoreElement.innerText = bestScore;
    }
}

// Moteur de déplacement
function move(direction) {
    let moved = false;
    let moveMerged = false; 
    let merged = [[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]];

    const moveTile = (r, c, dr, dc) => {
        let tile = board[r][c];
        if (!tile) return false;

        let currR = r; let currC = c;
        let nextR = r + dr; let nextC = c + dc;

        while (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4) {
            let nextTile = board[nextR][nextC];
            
            if (!nextTile) {
                board[nextR][nextC] = tile;
                board[currR][currC] = null;
                tile.r = nextR; tile.c = nextC;
                currR = nextR; currC = nextC;
                nextR += dr; nextC += dc;
                moved = true;
            } else if (nextTile.value === tile.value && !merged[nextR][nextC]) {
                // FUSION
                let newValue = tile.value * 2;
                score += newValue;
                
                removeTileElement(tile.id, nextR, nextC);
                removeTileElement(nextTile.id, nextR, nextC);
                
                let newId = tileIdCounter++;
                let newTile = { id: newId, value: newValue, r: nextR, c: nextC };
                board[nextR][nextC] = newTile;
                board[currR][currC] = null;
                tiles[newId] = newTile;
                
                merged[nextR][nextC] = true;
                
                createTileElement(newTile);
                document.getElementById(`tile-${newId}`).classList.add('tile-merged');
                
                playSound('merge');
                moveMerged = true;
                moved = true;
                break;
            } else {
                break;
            }
        }
        return moved;
    };

    if (direction === 'up') { for(let c=0; c<4; c++) for(let r=1; r<4; r++) moveTile(r,c,-1,0); }
    if (direction === 'down') { for(let c=0; c<4; c++) for(let r=2; r>=0; r--) moveTile(r,c,1,0); }
    if (direction === 'left') { for(let r=0; r<4; r++) for(let c=1; c<4; c++) moveTile(r,c,0,-1); }
    if (direction === 'right') { for(let r=0; r<4; r++) for(let c=2; c>=0; c--) moveTile(r,c,0,1); }

    if (moved) {
        if (!moveMerged) playSound('move');
        
        updateTileElements();
        updateScore();
        setTimeout(() => {
            addRandomTile();
            checkGameOver();
        }, 150); 
    }
}

function checkGameOver() {
    for(let r=0; r<4; r++) for(let c=0; c<4; c++) if(!board[r][c]) return;
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            let val = board[r][c].value;
            if(c < 3 && val === board[r][c+1].value) return;
            if(r < 3 && val === board[r+1][c].value) return;
        }
    }
    playSound('gameover');
    gameOverScreen.style.display = 'flex';
}

function resetGame() { initBoard(); }

// --- CONTRÔLES CLAVIER ---
document.addEventListener('keydown', (e) => {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowUp') move('up');
    if (e.key === 'ArrowDown') move('down');
    if (e.key === 'ArrowLeft') move('left');
    if (e.key === 'ArrowRight') move('right');
});

// --- CONTRÔLES TACTILES ---
const gameContainer = document.getElementById('game-container');
let gameTouchX = 0, gameTouchY = 0;

gameContainer.addEventListener('touchstart', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    gameTouchX = e.touches[0].clientX;
    gameTouchY = e.touches[0].clientY;
    e.stopPropagation();
}, {passive: false});

gameContainer.addEventListener('touchend', e => {
    if (!gameTouchX || !gameTouchY) return;
    let diffX = e.changedTouches[0].clientX - gameTouchX;
    let diffY = e.changedTouches[0].clientY - gameTouchY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 50) move('right');
        else if (diffX < -50) move('left');
    } else {
        if (diffY > 50) move('down');
        else if (diffY < -50) move('up');
    }
    gameTouchX = 0; gameTouchY = 0;
    e.stopPropagation(); 
}, {passive: false});

gameContainer.addEventListener('touchmove', e => { e.preventDefault(); }, {passive: false});

initBoard();


// ==========================================
// NAVIGATION PAR SWIPE (TACTILE & SOURIS)
// ==========================================

const gamesHubList = [
    "../cybertank/index.html",
    "../tower_defense/index.html",
    "../edgeofwar/index.html",
    "../cyber_smash/index.html",
    "../guessthemanga/index.html",
    "../drawer/index.html",
    "../texas_poker/index.html",
    "../blindtest/index.html",
    "../2048slime/index.html",
    "../worms/index.html"
];

let globalTouchStartX = 0;
let globalTouchStartY = 0;
let globalTouchEndX = 0;
let globalTouchEndY = 0;
let isDragging = false; 

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    
    let diffX = globalTouchEndX - globalTouchStartX;
    let diffY = globalTouchEndY - globalTouchStartY;

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
    let currentIndex = gamesHubList.findIndex(game => {
        let folderName = game.split('/')[1]; 
        return currentPath.includes(folderName);
    });
    
    if (currentIndex === -1) return;
    
    let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

function isExcludedElement(target) {
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'button' || tag === 'canvas' || tag === 'select') return true;
    if (target.closest('#game-container') || target.closest('#game-wrapper')) return true;
    return false;
}

document.addEventListener('touchstart', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchStartX = e.changedTouches[0].screenX;
    globalTouchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (isExcludedElement(e.target)) return;
    globalTouchEndX = e.changedTouches[0].screenX;
    globalTouchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });

document.addEventListener('mousedown', e => {
    if (e.button !== 0 || isExcludedElement(e.target)) return; 
    isDragging = true;
    globalTouchStartX = e.clientX;
    globalTouchStartY = e.clientY;
});

document.addEventListener('mouseup', e => {
    if (!isDragging) return; 
    isDragging = false;
    
    if (isExcludedElement(e.target)) return;
    
    globalTouchEndX = e.clientX;
    globalTouchEndY = e.clientY;
    handleSwipeGesture();
});
