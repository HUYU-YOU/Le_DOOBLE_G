// --- LOCALIZATION SYSTEM (i18n) ---
const i18n = {
    fr: {
        bestScore: "🏆 MEILLEUR SCORE : ",
        modeText: "Mode <span style='color: var(--cyan);'>VISUEL</span>.<br>L'image est floue ! Devinez vite pour faire exploser le <b style='color: #f1c40f;'>COMBO</b>.",
        initBtn: "Initier la séquence",
        scoreLabel: "SCORE: ",
        sysFail: "SYSTEM FAILURE",
        finalScore: "Score Final : ",
        placeholderName: "ENTREZ VOTRE NOM",
        saveScoreBtn: "Enregistrer Score",
        hallOfFame: "🏆 HALL OF FAME 🏆",
        replayBtn: "Rejouer",
        noRecord: "Aucun record.",
        settingsTitle: "PARAMÈTRES",
        screenFormat: "Format de l'Écran 🖥️",
        btnClassic: "Classique",
        btnWide: "Pleine Page",
        btnFull: "Plein Écran",
        btnClose: "Fermer",
        hubImgPath: "Le_DOOBLE_G/img/retourhub.png" // Image française
    },
    en: {
        bestScore: "🏆 BEST SCORE : ",
        modeText: "<span style='color: var(--cyan);'>VISUAL</span> Mode.<br>The image is blurred! Guess quickly to explode the <b style='color: #f1c40f;'>COMBO</b>.",
        initBtn: "Initiate Sequence",
        scoreLabel: "SCORE: ",
        sysFail: "SYSTEM FAILURE",
        finalScore: "Final Score : ",
        placeholderName: "ENTER YOUR NAME",
        saveScoreBtn: "Save Score",
        hallOfFame: "🏆 HALL OF FAME 🏆",
        replayBtn: "Play Again",
        noRecord: "No records.",
        settingsTitle: "SETTINGS",
        screenFormat: "Screen Format 🖥️",
        btnClassic: "Classic",
        btnWide: "Wide Page",
        btnFull: "Full Screen",
        btnClose: "Close",
        hubImgPath: "Le_DOOBLE_G/img/returbhub.png" // Image anglaise
    }
};

let currentLang = 'fr';

function setLanguage(lang) {
    currentLang = lang;
    
    // Boutons de langues
    document.getElementById('btn-fr').classList.toggle('active', lang === 'fr');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');

    // Traduction des textes avec data-i18n
    document.querySelector('[data-i18n="bestScore"]').innerText = i18n[lang].bestScore;
    document.querySelector('[data-i18n="modeText"]').innerHTML = i18n[lang].modeText;
    document.querySelector('[data-i18n="initBtn"]').innerText = i18n[lang].initBtn;
    document.getElementById('score-label-text').innerText = i18n[lang].scoreLabel;
    document.querySelector('[data-i18n="sysFail"]').innerText = i18n[lang].sysFail;
    document.querySelector('[data-i18n="finalScore"]').innerText = i18n[lang].finalScore;
    document.getElementById('player-name-input').placeholder = i18n[lang].placeholderName;
    document.querySelector('[data-i18n="saveScoreBtn"]').innerText = i18n[lang].saveScoreBtn;
    document.querySelector('[data-i18n="hallOfFame"]').innerText = i18n[lang].hallOfFame;
    document.querySelector('[data-i18n="replayBtn"]').innerText = i18n[lang].replayBtn;
    document.querySelector('[data-i18n="settingsTitle"]').innerText = i18n[lang].settingsTitle;
    document.querySelector('[data-i18n="screenFormat"]').innerText = i18n[lang].screenFormat;
    document.querySelector('[data-i18n="btnClassic"]').innerText = i18n[lang].btnClassic;
    document.querySelector('[data-i18n="btnWide"]').innerText = i18n[lang].btnWide;
    document.querySelector('[data-i18n="btnFull"]').innerText = i18n[lang].btnFull;
    document.querySelector('[data-i18n="btnClose"]').innerText = i18n[lang].btnClose;

    // Mise à jour de l'image de retour au hub
    document.getElementById('hub-img').src = i18n[lang].hubImgPath;

    // Actualiser le texte dynamique
    displayLeaderboard();
}

// --- GESTION PARAMÈTRES & UI ---
function autoFullscreen() {
    if (!document.getElementById('game-container').classList.contains('size-full')) setGameSize('wide');
}

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

const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval; let currentFrameSett = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrameSett = 0; settingsBtnImg.src = animFrames[currentFrameSett];
    hoverInterval = setInterval(() => {
        currentFrameSett = (currentFrameSett + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrameSett];
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

// --- PRÉCHARGEMENT DES IMAGES DU SLIME ---
const SLIME_FOLDER = "img/"; 
const preloadedSlimes = [];
for(let i = 1; i <= 8; i++) {
    let img = new Image();
    img.src = `${SLIME_FOLDER}slime${i}.png`;
    preloadedSlimes.push(img);
}

// --- GESTION AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playFeedbackSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1); 
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(250, now); 
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }
}

const baseMangaList = [
    { title: "Naruto", img: "img/img1.png" }, { title: "One Piece", img: "img/img2.png" }, { title: "Bleach", img: "img/img3.png" },
    { title: "Dragon Ball", img: "img/img4.png" }, { title: "Death Note", img: "img/img5.png" }, { title: "Attack on Titan", img: "img/img6.png" },
    { title: "My Hero Academia", img: "img/img7.png" }, { title: "Demon Slayer", img: "img/img8.png" }, { title: "Jujutsu Kaisen", img: "img/img9.png" },
    { title: "Hunter x Hunter", img: "img/img10.png" }, { title: "Fullmetal Alchemist", img: "img/img11.png" }, { title: "Tokyo Ghoul", img: "img/img12.png" },
    { title: "One Punch Man", img: "img/img13.png" }, { title: "Sword Art Online", img: "img/img14.png" }, { title: "Fairy Tail", img: "img/img15.png" },
    { title: "JoJo's Bizarre Adventure", img: "img/img16.png" }, { title: "Black Clover", img: "img/img17.png" }, { title: "Chainsaw Man", img: "img/img18.png" },
    { title: "Haikyuu", img: "img/img19.png" }, { title: "Gintama", img: "img/img20.png" }, { title: "Mob Psycho 100", img: "img/img21.png" },
    { title: "Evangelion", img: "img/img22.png" }, { title: "Cowboy Bebop", img: "img/img23.png" }, { title: "Code Geass", img: "img/img24.png" },
    { title: "Steins;Gate", img: "img/img25.png" }, { title: "Berserk", img: "img/img26.png" }, { title: "Vinland Saga", img: "img/img27.png" },
    { title: "Spy x Family", img: "img/img28.png" }, { title: "Kaguya-sama", img: "img/img29.png" }, { title: "Dr. Stone", img: "img/img30.png" },
    { title: "Promised Neverland", img: "img/img31.png" }, { title: "Fire Force", img: "img/img32.png" }, { title: "Blue Lock", img: "img/img33.png" },
    { title: "Tokyo Revengers", img: "img/img34.png" }, { title: "Kuroko no Basket", img: "img/img35.png" }, { title: "Assassination Classroom", img: "img/img36.png" },
    { title: "Nanatsu no Taizai", img: "img/img37.png" }, { title: "Akame ga Kill", img: "img/img38.png" }, { title: "Parasyte", img: "img/img39.png" },
    { title: "Psycho-Pass", img: "img/img40.png" }, { title: "Erased", img: "img/img41.png" }, { title: "Your Lie in April", img: "img/img42.png" },
    { title: "Fate/Zero", img: "img/img43.png" }, { title: "No Game No Life", img: "img/img44.png" }, { title: "Re:Zero", img: "img/img45.png" },
    { title: "Mushoku Tensei", img: "img/img46.png" }, { title: "Oshi no Ko", img: "img/img47.png" }, { title: "Solo Leveling", img: "img/img48.png" },
    { title: "Boruto", img: "img/img49.png" }, { title: "Vagabond", img: "img/img50.png" }
];

let questionsData = [];
let currentQuestionIndex = 0; let score = 0; let lives = 3; let combo = 1; let timeLeft = 100; let timerInterval; let isAnswering = false;

let bestMangaScore = localStorage.getItem('guessitBestScore') || 0;

const screens = { start: document.getElementById('start-screen'), game: document.getElementById('game-screen'), end: document.getElementById('end-screen') };
const ui = { img: document.getElementById('manga-image'), opt: document.getElementById('options-area'), timer: document.getElementById('timer-bar'), container: document.getElementById('game-container') };

window.addEventListener('DOMContentLoaded', () => {
    // Initialise langue par défaut et UI
    setLanguage('fr');
    
    let display = document.getElementById('best-score-display');
    if (display) display.innerText = bestMangaScore;
    displayLeaderboard();
    setGameSize('wide'); // Format par défaut
});

function startGame() { 
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    
    screens.start.style.display = 'none'; 
    screens.game.style.display = 'block'; 
    
    let shuffledList = [...baseMangaList].sort(() => Math.random() - 0.5);

    questionsData = shuffledList.map(manga => {
        let wrongOptions = [];
        while(wrongOptions.length < 3) {
            let rManga = baseMangaList[Math.floor(Math.random() * baseMangaList.length)];
            if (rManga.title !== manga.title && !wrongOptions.includes(rManga.title)) {
                wrongOptions.push(rManga.title);
            }
        }
        let options = [...wrongOptions, manga.title].sort(() => Math.random() - 0.5);
        let correctIndex = options.indexOf(manga.title);
        return { img: manga.img, options: options, correct: correctIndex };
    });

    currentQuestionIndex = 0;
    score = 0; lives = 3; combo = 1;
    loadQuestion(); 
}

function updateHUD() {
    document.getElementById('current-score').innerText = score;
    document.getElementById('combo-display').innerText = `x${combo}`;
    document.getElementById('lives-display').innerText = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function loadQuestion() {
    const q = questionsData[currentQuestionIndex];
    ui.img.src = q.img; 
    ui.img.style.filter = "blur(25px)";
    ui.opt.innerHTML = "";
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = opt;
        btn.onclick = () => checkAnswer(idx, btn); ui.opt.appendChild(btn);
    });
    
    isAnswering = false; 
    timeLeft = 100; 
    updateHUD();
    ui.timer.style.width = "100%"; 
    ui.timer.style.backgroundColor = "var(--cyan)";
    
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval); 
    timerInterval = setInterval(() => {
        timeLeft -= 0.6; 
        ui.timer.style.width = Math.max(0, timeLeft) + "%";
        ui.img.style.filter = `blur(${Math.max(0, (timeLeft / 100) * 25)}px)`;
        
        if(timeLeft <= 50) ui.timer.style.backgroundColor = "#f1c40f";
        if(timeLeft <= 25) ui.timer.style.backgroundColor = "var(--red)";
        if (timeLeft <= 0) { clearInterval(timerInterval); checkAnswer(-1, null); }
    }, 50);
}

function playSlimeTransition(callback) {
    const overlay = document.getElementById('slime-overlay');
    const slimeImg = document.getElementById('slime-anim-img');

    overlay.style.display = 'block';
    
    let frame = 1;
    slimeImg.src = preloadedSlimes[frame - 1].src;
    
    let interval = setInterval(() => {
        frame++;
        if (frame <= 8) {
            slimeImg.src = preloadedSlimes[frame - 1].src;
        }
        
        if (frame === 5) {
            callback(); 
        }
        
        if (frame >= 8) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.style.display = 'none';
                slimeImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                if (callback === nextQuestion) startTimer(); 
            }, 100);
        }
    }, 80); 
}

function checkAnswer(selectedIndex, buttonClicked) {
    if (isAnswering) return; 
    isAnswering = true; 
    clearInterval(timerInterval);
    
    ui.img.style.filter = "blur(0px)"; 
    const q = questionsData[currentQuestionIndex]; 
    const buttons = ui.opt.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true); 

    if (selectedIndex === -1) {
        playFeedbackSound('wrong');
        buttons[q.correct].classList.add('correct');
        lives--; combo = 1;
        ui.container.classList.add('shake'); 
        setTimeout(() => ui.container.classList.remove('shake'), 400);
        updateHUD();
        if (lives <= 0) setTimeout(() => playSlimeTransition(endGame), 1500); 
        else setTimeout(() => playSlimeTransition(nextQuestion), 1500);
        return;
    }

    buttons[q.correct].classList.add('correct');

    if (selectedIndex === q.correct) {
        playFeedbackSound('correct'); 
        score += Math.floor(100 + (timeLeft * 2)) * combo; 
        combo++;
        const cEl = document.getElementById('combo-display'); cEl.classList.add('combo-active');
        setTimeout(() => cEl.classList.remove('combo-active'), 300);
        
        setTimeout(() => playSlimeTransition(nextQuestion), 1000);
    } else {
        playFeedbackSound('wrong'); 
        if (buttonClicked) buttonClicked.classList.add('wrong');
        lives--; combo = 1;
        ui.container.classList.add('shake'); setTimeout(() => ui.container.classList.remove('shake'), 400);
        updateHUD();
        
        if (lives <= 0) setTimeout(() => playSlimeTransition(endGame), 1500); 
        else setTimeout(() => playSlimeTransition(nextQuestion), 1500);
    }
}

function nextQuestion() { 
    currentQuestionIndex++; 
    if (currentQuestionIndex < questionsData.length) {
        const q = questionsData[currentQuestionIndex];
        ui.img.src = q.img; 
        ui.img.style.filter = "blur(25px)";
        ui.opt.innerHTML = "";
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = opt;
            btn.onclick = () => checkAnswer(idx, btn); ui.opt.appendChild(btn);
        });
        isAnswering = false; 
        timeLeft = 100; 
        updateHUD();
        ui.timer.style.width = "100%"; 
        ui.timer.style.backgroundColor = "var(--cyan)";
    } else {
        endGame(); 
    }
}

function endGame() { 
    screens.game.style.display = 'none'; screens.end.style.display = 'block'; 
    document.getElementById('final-score').innerText = score;
    
    if (score > bestMangaScore) {
        bestMangaScore = score;
        localStorage.setItem('guessitBestScore', bestMangaScore);
        let display = document.getElementById('best-score-display');
        if (display) display.innerText = bestMangaScore;
    }
    displayLeaderboard();
}

function saveScore() {
    const name = document.getElementById('player-name-input').value.trim().toUpperCase() || "ANONYME";
    let lb = JSON.parse(localStorage.getItem('mangaLeaderboard')) || [];
    lb.push({ name: name, score: score });
    lb.sort((a, b) => b.score - a.score);
    lb = lb.slice(0, 5); 
    localStorage.setItem('mangaLeaderboard', JSON.stringify(lb));
    
    document.getElementById('save-score-section').style.display = 'none';
    displayLeaderboard();
}

function displayLeaderboard() {
    let lb = JSON.parse(localStorage.getItem('mangaLeaderboard')) || [];
    const list = document.getElementById('lb-list');
    list.innerHTML = "";
    if (lb.length === 0) {
        list.innerHTML = `<div class='lb-entry'>${i18n[currentLang].noRecord}</div>`;
    }
    lb.forEach((entry, i) => {
        let color = i === 0 ? "var(--gold)" : (i === 1 ? "#c0c0c0" : (i === 2 ? "#cd7f32" : "#fff"));
        list.innerHTML += `<div class='lb-entry' style='color:${color}'><span>#${i+1} ${entry.name}</span> <span>${entry.score} pts</span></div>`;
    });
}

// --- SCRIPT DE NAVIGATION PAR SWIPE (TACTILE) ---
const gamesHubList = [
    "../cybertank/index.html",
    "../tower_defense/index.html",
    "../edgeofwar/index.html",
    "../cyber_smash/index.html",
    "../guessthemanga/index.html",
    "../drawer/index.html",
    "../texas_poker/index.html"
];

let touchstartX = 0;
let touchendX = 0;

function handleSwipeGesture() {
    const swipeThreshold = 75; 
    
    if (touchendX < touchstartX - swipeThreshold) {
        navigateGames(1);
    }
    if (touchendX > touchstartX + swipeThreshold) {
        navigateGames(-1);
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

document.addEventListener('touchstart', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (e.target.tagName.toLowerCase() === 'canvas') return;
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, { passive: true });
