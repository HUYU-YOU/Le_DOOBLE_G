/* =========================================
   1. MENU, PARAMÈTRES & AUDIO
========================================= */
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings5.png'];
let hoverInterval = null;
let currentFrame = 0;

// Préchargement des images d'animation
animFrames.forEach(src => { const img = new Image(); img.src = src; });

function startSettingsAnim() {
    if (hoverInterval || !settingsBtnImg) return;
    currentFrame = 0;
    settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        settingsBtnImg.src = animFrames[currentFrame];
    }, 100);
}

function stopSettingsAnim() {
    clearInterval(hoverInterval);
    hoverInterval = null;
    if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) {
        settingsBtnImg.src = '../img/setting.png';
    }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval);
    hoverInterval = null;
    if (settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => {
        if (settingsBtnImg) settingsBtnImg.src = '../img/setting.png';
    }, 300);
}

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('show');
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));

    if (size === 'classic') {
        document.getElementById('btn-sz-classic').classList.add('active');
        container.style.transform = 'scale(0.9)';
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'wide') {
        document.getElementById('btn-sz-wide').classList.add('active');
        container.style.transform = 'scale(1)';
        if (document.fullscreenElement) document.exitFullscreen();
    } else if (size === 'full') {
        document.getElementById('btn-sz-full').classList.add('active');
        container.style.transform = 'scale(1.08)';
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) setGameSize('wide');
});

// Audio Web API (débloqué au premier clic)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

document.body.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('btn-mute');
    btn.innerText = isMuted
        ? (state.lang === 'fr' ? '🔇 Son : OFF' : '🔇 Sound: OFF')
        : (state.lang === 'fr' ? '🔊 Son : ON' : '🔊 Sound: ON');
}

function playSound(type) {
    if (isMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now); osc.stop(now + 0.06);
    } else if (type === 'reveal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(680, now + 0.14);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'elim') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
    }
}

/* =========================================
   2. TRADUCTIONS & CATÉGORIES
========================================= */
const CATEGORY_LABELS = {
    all: { fr: '🌐 Toutes les catégories', en: '🌐 All Categories' },
    mangas: { fr: '🍜 Mangas & Animés', en: '🍜 Manga & Anime' },
    pop_culture: { fr: '🎬 Pop Culture & Films', en: '🎬 Pop Culture & Movies' },
    histoire_metiers: { fr: '🏛️ Histoire & Métiers', en: '🏛️ History & Jobs' },
    tech_gaming: { fr: '🎮 Jeux Vidéo, Tech & Web', en: '🎮 Gaming, Tech & Web' },
    food: { fr: '🍕 Nourriture & Boissons', en: '🍕 Food & Drinks' },
    nature: { fr: '🦁 Animaux & Nature', en: '🦁 Animals & Nature' },
    objets: { fr: '🎸 Objets du quotidien', en: '🎸 Everyday Objects' },
    pieges: { fr: '🃏 Pièges absurdes & décalés', en: '🃏 Absurd & Tricky Pairs' }
};

const I18N = {
    fr: {
        settingsTitle: 'Paramètres',
        screenSize: "Taille de l'écran",
        language: 'Langue / Language',
        agentsTitle: '1. Agents en mission',
        missionConfig: '2. Paramètres de mission',
        undercoverCount: 'Undercovers',
        categoryLabel: 'Catégorie du dictionnaire',
        startMission: 'LANCER LA MISSION',
        placeholderName: "Nom de l'agent...",
        addBtn: '+ Ajouter',
        minPlayersErr: 'Il faut au moins 3 agents pour lancer une mission.',
        maxPlayersErr: 'Maximum 12 agents par partie.',
        tooManyImpostors: 'Il faut au moins 1 Undercover ou Mr. White, et plus de Civils que d\'infiltrés.',
        duplicateName: 'Cet agent est déjà dans la liste.',
        passDevice: "Passez l'appareil à cet agent sans regarder l'écran.",
        revealBtn: '👁️ Révéler mon mot',
        hideNextBtn: '🔒 Cacher & Suivant',
        startDebateBtn: '🔒 Cacher & Lancer le débat',
        yourWordHint: 'Votre mot de code secret',
        mrWhiteHint: 'Identité secrète',
        mrWhiteCard: 'MR. WHITE (Aucun mot)',
        roundLabel: 'Tour',
        activeAgents: 'agents actifs',
        startsSpeaking: 'commence à donner un indice !',
        playInstruction: 'Chacun donne un mot-indice à l\'oral, puis sélectionnez l\'agent suspect à éliminer.',
        elimBtn: "Éliminer l'agent sélectionné",
        elimTitle: 'AGENT ÉLIMINÉ',
        roleCivil: 'CIVIL',
        roleUndercover: 'UNDERCOVER',
        roleMrWhite: 'MR. WHITE',
        wasCivil: "C'était un agent loyal… L'infiltré court toujours.",
        wasUndercover: 'Bien joué ! Un agent Undercover a été neutralisé.',
        wasMrWhite: 'Mr. White a été démasqué ! Il a une dernière chance de deviner le mot des Civils.',
        mrWhitePrompt: 'Mr. White, quel est le mot secret des Civils ?',
        mrWhiteSubmit: 'Valider la tentative',
        mrWhiteWrong: 'Raté ! Mr. White est définitivement éliminé.',
        continueBtn: 'Continuer la mission',
        civilsWinTitle: 'VICTOIRE DES CIVILS !',
        civilsWinSub: 'Tous les infiltrés ont été neutralisés.',
        impostorsWinTitle: 'VICTOIRE DES INFILTRÉS !',
        impostorsWinSub: 'Les agents infiltrés ont pris le contrôle de la mission.',
        mrWhiteWinTitle: 'VICTOIRE DE MR. WHITE !',
        mrWhiteWinSub: 'Mr. White a deviné le mot secret des Civils !',
        civilWordLabel: 'Mot Civil',
        ucWordLabel: 'Mot Undercover',
        replayBtn: 'Rejouer (mêmes agents)',
        lobbyBtn: 'Modifier les joueurs',
        pairsUnit: 'paires'
    },
    en: {
        settingsTitle: 'Settings',
        screenSize: 'Screen Size',
        language: 'Langue / Language',
        agentsTitle: '1. Agents on Mission',
        missionConfig: '2. Mission Config',
        undercoverCount: 'Undercovers',
        categoryLabel: 'Word Category',
        startMission: 'START MISSION',
        placeholderName: 'Agent name...',
        addBtn: '+ Add',
        minPlayersErr: 'At least 3 agents are required to start.',
        maxPlayersErr: 'Maximum 12 agents per game.',
        tooManyImpostors: 'Need at least 1 impostor, and more Civilians than impostors.',
        duplicateName: 'This agent is already in the list.',
        passDevice: 'Pass the device to this agent privately.',
        revealBtn: '👁️ Reveal my word',
        hideNextBtn: '🔒 Hide & Next',
        startDebateBtn: '🔒 Hide & Start Debate',
        yourWordHint: 'Your secret code word',
        mrWhiteHint: 'Secret Identity',
        mrWhiteCard: 'MR. WHITE (No word)',
        roundLabel: 'Round',
        activeAgents: 'active agents',
        startsSpeaking: 'gives the first clue!',
        playInstruction: 'Everyone gives a one-word clue out loud, then select the agent to eliminate.',
        elimBtn: 'Eliminate selected agent',
        elimTitle: 'AGENT ELIMINATED',
        roleCivil: 'CIVILIAN',
        roleUndercover: 'UNDERCOVER',
        roleMrWhite: 'MR. WHITE',
        wasCivil: 'They were a loyal Civilian... The spy is still out there.',
        wasUndercover: 'Nice catch! An Undercover agent was neutralized.',
        wasMrWhite: 'Mr. White was caught! One last chance to guess the Civilians\' word.',
        mrWhitePrompt: 'Mr. White, what is the Civilians\' secret word?',
        mrWhiteSubmit: 'Submit guess',
        mrWhiteWrong: 'Wrong guess! Mr. White is out for good.',
        continueBtn: 'Continue mission',
        civilsWinTitle: 'CIVILIANS WIN!',
        civilsWinSub: 'All infiltrators have been eliminated.',
        impostorsWinTitle: 'INFILTRATORS WIN!',
        impostorsWinSub: 'The spies have taken over the mission.',
        mrWhiteWinTitle: 'MR. WHITE WINS!',
        mrWhiteWinSub: 'Mr. White guessed the Civilians\' secret word!',
        civilWordLabel: 'Civilian Word',
        ucWordLabel: 'Undercover Word',
        replayBtn: 'Play Again (same agents)',
        lobbyBtn: 'Edit Players',
        pairsUnit: 'pairs'
    }
};

function t(key) {
    return I18N[state.lang][key] || key;
}

/* =========================================
   3. ÉTAT DU JEU UNDERCOVER
========================================= */
const state = {
    lang: 'fr',
    playerNames: ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4'],
    undercoverCount: 1,
    mrWhiteCount: 0,
    category: 'all',
    usedPairIndexes: new Set(),

    // Partie en cours
    players: [],
    civilWord: '',
    undercoverWord: '',
    distIndex: 0,
    round: 1,
    selectedVoteIndex: null,
    lastEliminated: null
};

/* =========================================
   4. INITIALISATION & SETUP
========================================= */
function populateCategories() {
    const select = document.getElementById('category-select');
    const current = state.category;
    const allCats = ['all', ...new Set(wordPairs.map(w => w.category).filter(Boolean))];

    select.innerHTML = '';
    allCats.forEach(cat => {
        const count = cat === 'all'
            ? wordPairs.length
            : wordPairs.filter(w => w.category === cat).length;
        const opt = document.createElement('option');
        opt.value = cat;
        const label = CATEGORY_LABELS[cat] ? CATEGORY_LABELS[cat][state.lang] : cat;
        opt.textContent = `${label} (${count})`;
        select.appendChild(opt);
    });
    select.value = allCats.includes(current) ? current : 'all';
    select.onchange = (e) => { state.category = e.target.value; playSound('click'); };

    document.getElementById('dict-count').innerText = `${wordPairs.length} ${t('pairsUnit')}`;
}

function setLanguage(lang) {
    state.lang = lang;
    document.querySelectorAll('.btn-lang').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-lang-${lang}`).classList.add('active');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = t(el.dataset.i18n);
    });
    document.getElementById('player-name-input').placeholder = t('placeholderName');
    document.getElementById('btn-add-player').innerText = t('addBtn');
    document.getElementById('btn-mute').innerText = isMuted
        ? (lang === 'fr' ? '🔇 Son : OFF' : '🔇 Sound: OFF')
        : (lang === 'fr' ? '🔊 Son : ON' : '🔊 Sound: ON');

    populateCategories();
    playSound('click');
}

function renderPlayersList() {
    const ul = document.getElementById('players-list');
    ul.innerHTML = '';
    state.playerNames.forEach((name, idx) => {
        const li = document.createElement('li');
        li.className = 'player-chip';
        li.innerHTML = `<span>${escapeHtml(name)}</span><button onclick="removePlayer(${idx})" title="Supprimer">×</button>`;
        ul.appendChild(li);
    });
    clampRoleCounts();
}

function addPlayer() {
    const input = document.getElementById('player-name-input');
    const errorEl = document.getElementById('setup-error');
    const name = input.value.trim();
    errorEl.innerText = '';

    if (!name) return;
    if (state.playerNames.length >= 12) {
        errorEl.innerText = t('maxPlayersErr');
        return;
    }
    if (state.playerNames.some(p => p.toLowerCase() === name.toLowerCase())) {
        errorEl.innerText = t('duplicateName');
        return;
    }

    state.playerNames.push(name);
    input.value = '';
    playSound('click');
    renderPlayersList();
}

function removePlayer(idx) {
    state.playerNames.splice(idx, 1);
    playSound('click');
    renderPlayersList();
}

function clampRoleCounts() {
    const maxImpostors = Math.max(1, Math.floor((state.playerNames.length - 1) / 2));
    while (state.undercoverCount + state.mrWhiteCount > maxImpostors) {
        if (state.mrWhiteCount > 0) state.mrWhiteCount--;
        else if (state.undercoverCount > 1) state.undercoverCount--;
        else break;
    }
    if (state.undercoverCount + state.mrWhiteCount === 0) state.undercoverCount = 1;
    document.getElementById('uc-count-display').innerText = state.undercoverCount;
    document.getElementById('mw-count-display').innerText = state.mrWhiteCount;
}

function changeRoleCount(role, delta) {
    const maxImpostors = Math.max(1, Math.floor((state.playerNames.length - 1) / 2));
    let nextUC = state.undercoverCount + (role === 'undercover' ? delta : 0);
    let nextMW = state.mrWhiteCount + (role === 'mrwhite' ? delta : 0);

    if (nextUC < 0 || nextMW < 0) return;
    if (nextUC + nextMW < 1 || nextUC + nextMW > maxImpostors) return;

    state.undercoverCount = nextUC;
    state.mrWhiteCount = nextMW;
    document.getElementById('uc-count-display').innerText = state.undercoverCount;
    document.getElementById('mw-count-display').innerText = state.mrWhiteCount;
    playSound('click');
}

/* =========================================
   5. LOGIQUE DE PARTIE
========================================= */
function pickWordPair() {
    const pool = wordPairs
        .map((pair, idx) => ({ pair, idx }))
        .filter(item => state.category === 'all' || item.pair.category === state.category);

    let available = pool.filter(item => !state.usedPairIndexes.has(item.idx));
    if (available.length === 0) {
        // Réinitialise l'historique de cette catégorie si tout a été joué
        pool.forEach(item => state.usedPairIndexes.delete(item.idx));
        available = pool;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    state.usedPairIndexes.add(chosen.idx);

    const words = chosen.pair[state.lang] || chosen.pair.fr;
    // Tire au hasard lequel des 2 mots est le mot Civil et lequel est le mot Undercover
    if (Math.random() < 0.5) {
        return { civil: words[0], undercover: words[1] };
    }
    return { civil: words[1], undercover: words[0] };
}

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function startGame() {
    const errorEl = document.getElementById('setup-error');
    errorEl.innerText = '';

    if (state.playerNames.length < 3) {
        errorEl.innerText = t('minPlayersErr');
        return;
    }

    const totalImpostors = state.undercoverCount + state.mrWhiteCount;
    const civilsCount = state.playerNames.length - totalImpostors;
    if (totalImpostors < 1 || civilsCount <= totalImpostors) {
        errorEl.innerText = t('tooManyImpostors');
        return;
    }

    const pair = pickWordPair();
    state.civilWord = pair.civil;
    state.undercoverWord = pair.undercover;

    const roles = [
        ...Array(state.undercoverCount).fill('undercover'),
        ...Array(state.mrWhiteCount).fill('mrwhite'),
        ...Array(civilsCount).fill('civil')
    ];
    const shuffledRoles = shuffle(roles);

    state.players = state.playerNames.map((name, i) => ({
        name,
        role: shuffledRoles[i],
        word: shuffledRoles[i] === 'civil'
            ? state.civilWord
            : (shuffledRoles[i] === 'undercover' ? state.undercoverWord : null),
        alive: true
    }));

    state.distIndex = 0;
    state.round = 1;
    state.selectedVoteIndex = null;
    state.lastEliminated = null;

    playSound('click');
    showDistributionStep();
    showScreen('screen-distribute');
}

function showDistributionStep() {
    const player = state.players[state.distIndex];
    document.getElementById('dist-progress').innerText =
        `Agent ${state.distIndex + 1} / ${state.players.length}`;
    document.getElementById('dist-player-name').innerText = player.name;
    document.getElementById('dist-instruction').innerText = t('passDevice');

    document.getElementById('secret-box').classList.add('hidden');
    document.getElementById('btn-reveal-word').classList.remove('hidden');
    document.getElementById('btn-reveal-word').innerText = t('revealBtn');
    document.getElementById('btn-next-player').classList.add('hidden');
}

function revealWord() {
    const player = state.players[state.distIndex];
    const wordEl = document.getElementById('secret-word');
    const hintEl = document.getElementById('secret-role-hint');

    if (player.role === 'mrwhite') {
        hintEl.innerText = t('mrWhiteHint');
        wordEl.innerText = t('mrWhiteCard');
        wordEl.classList.add('is-white');
    } else {
        hintEl.innerText = t('yourWordHint');
        wordEl.innerText = player.word;
        wordEl.classList.remove('is-white');
    }

    document.getElementById('secret-box').classList.remove('hidden');
    document.getElementById('btn-reveal-word').classList.add('hidden');

    const nextBtn = document.getElementById('btn-next-player');
    const isLast = state.distIndex === state.players.length - 1;
    nextBtn.innerText = isLast ? t('startDebateBtn') : t('hideNextBtn');
    nextBtn.classList.remove('hidden');

    playSound('reveal');
}

function nextDistribution() {
    playSound('click');
    state.distIndex++;
    if (state.distIndex < state.players.length) {
        showDistributionStep();
    } else {
        startRound();
    }
}

function startRound() {
    state.selectedVoteIndex = null;
    const alivePlayers = state.players.filter(p => p.alive);

    // Règle classique : éviter que Mr. White commence au Tour 1
    let starterCandidates = alivePlayers;
    if (state.round === 1) {
        const nonWhite = alivePlayers.filter(p => p.role !== 'mrwhite');
        if (nonWhite.length > 0) starterCandidates = nonWhite;
    }
    const starter = starterCandidates[Math.floor(Math.random() * starterCandidates.length)];

    document.getElementById('round-badge').innerText = `${t('roundLabel')} ${state.round}`;
    document.getElementById('alive-counter').innerText = `${alivePlayers.length} ${t('activeAgents')}`;
    document.getElementById('starter-banner').innerText = `🎙️ ${starter.name} ${t('startsSpeaking')}`;
    document.getElementById('play-instruction').innerText = t('playInstruction');

    const elimBtn = document.getElementById('btn-eliminate');
    elimBtn.innerText = t('elimBtn');
    elimBtn.disabled = true;

    renderVoteGrid();
    showScreen('screen-play');
}

function renderVoteGrid() {
    const grid = document.getElementById('vote-grid');
    grid.innerHTML = '';

    state.players.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'vote-card';
        if (!p.alive) {
            div.classList.add('eliminated');
            div.innerHTML = `${escapeHtml(p.name)}<span class="mini-role">${getRoleLabel(p.role)}</span>`;
        } else {
            if (state.selectedVoteIndex === idx) div.classList.add('selected');
            div.innerText = p.name;
            div.onclick = () => {
                state.selectedVoteIndex = idx;
                document.getElementById('btn-eliminate').disabled = false;
                playSound('click');
                renderVoteGrid();
            };
        }
        grid.appendChild(div);
    });
}

function confirmElimination() {
    if (state.selectedVoteIndex === null) return;
    const target = state.players[state.selectedVoteIndex];
    if (!target || !target.alive) return;

    target.alive = false;
    state.lastEliminated = target;
    playSound('elim');

    document.getElementById('elim-title').innerText = t('elimTitle');
    document.getElementById('elim-player-name').innerText = target.name;

    const badge = document.getElementById('elim-role-badge');
    badge.innerText = getRoleLabel(target.role);
    badge.className = `role-badge role-${target.role}`;

    const msg = document.getElementById('elim-message');
    const mwBox = document.getElementById('mrwhite-guess-box');
    const continueBtn = document.getElementById('btn-continue-round');

    if (target.role === 'mrwhite') {
        msg.innerText = t('wasMrWhite');
        document.getElementById('mrwhite-prompt').innerText = t('mrWhitePrompt');
        document.getElementById('btn-mw-submit').innerText = t('mrWhiteSubmit');
        document.getElementById('mrwhite-input').value = '';
        mwBox.classList.remove('hidden');
        continueBtn.classList.add('hidden');
    } else {
        msg.innerText = target.role === 'civil' ? t('wasCivil') : t('wasUndercover');
        mwBox.classList.add('hidden');
        continueBtn.innerText = t('continueBtn');
        continueBtn.classList.remove('hidden');
    }

    showScreen('screen-reveal-elim');
}

function normalizeText(str) {
    return str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function submitMrWhiteGuess() {
    const guess = document.getElementById('mrwhite-input').value;
    if (!guess.trim()) return;

    if (normalizeText(guess) === normalizeText(state.civilWord)) {
        endGame('mrwhite');
    } else {
        document.getElementById('mrwhite-guess-box').classList.add('hidden');
        document.getElementById('elim-message').innerText = t('mrWhiteWrong');
        const continueBtn = document.getElementById('btn-continue-round');
        continueBtn.innerText = t('continueBtn');
        continueBtn.classList.remove('hidden');
        playSound('elim');
    }
}

function continueAfterElimination() {
    playSound('click');
    const winner = checkWinner();
    if (winner) {
        endGame(winner);
    } else {
        state.round++;
        startRound();
    }
}

function checkWinner() {
    const aliveCivils = state.players.filter(p => p.alive && p.role === 'civil').length;
    const aliveImpostors = state.players.filter(p => p.alive && p.role !== 'civil').length;

    if (aliveImpostors === 0) return 'civils';
    if (aliveCivils <= 1 && aliveImpostors >= 1) return 'impostors';
    return null;
}

function endGame(winner) {
    playSound('win');

    if (winner === 'civils') {
        document.getElementById('winner-title').innerText = t('civilsWinTitle');
        document.getElementById('winner-subtitle').innerText = t('civilsWinSub');
    } else if (winner === 'mrwhite') {
        document.getElementById('winner-title').innerText = t('mrWhiteWinTitle');
        document.getElementById('winner-subtitle').innerText = t('mrWhiteWinSub');
    } else {
        document.getElementById('winner-title').innerText = t('impostorsWinTitle');
        document.getElementById('winner-subtitle').innerText = t('impostorsWinSub');
    }

    document.getElementById('label-civil-word').innerText = t('civilWordLabel');
    document.getElementById('label-uc-word').innerText = t('ucWordLabel');
    document.getElementById('recap-civil-word').innerText = state.civilWord;
    document.getElementById('recap-uc-word').innerText = state.undercoverWord;

    const ul = document.getElementById('final-roles-list');
    ul.innerHTML = '';
    state.players.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${escapeHtml(p.name)} ${p.alive ? '' : '💀'}</span>
            <span class="role-badge role-${p.role}" style="font-size:0.75rem; padding:3px 10px;">
                ${getRoleLabel(p.role)}
            </span>
        `;
        ul.appendChild(li);
    });

    document.getElementById('btn-replay').innerText = t('replayBtn');
    document.getElementById('btn-lobby').innerText = t('lobbyBtn');

    showScreen('screen-gameover');
}

function playAgainSamePlayers() {
    startGame();
}

function backToLobby() {
    playSound('click');
    showScreen('screen-setup');
}

function getRoleLabel(role) {
    if (role === 'civil') return t('roleCivil');
    if (role === 'undercover') return t('roleUndercover');
    return t('roleMrWhite');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Touche Entrée pour ajouter un joueur ou valider Mr. White
document.addEventListener('DOMContentLoaded', () => {
    setGameSize('wide');
    populateCategories();
    renderPlayersList();
    setLanguage('fr');

    document.getElementById('player-name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    document.getElementById('mrwhite-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitMrWhiteGuess();
    });
});

/* =========================================
   6. GESTION DU SWIPE (TACTILE HUB)
========================================= */
const gamesHubList = [
    '../cybertank/index.html',
    '../tower_defense/index.html',
    '../edgeofwar/index.html',
    '../cyber_smash/index.html',
    '../guessthemanga/index.html',
    '../drawer/index.html',
    '../texas_poker/index.html',
    '../undercover/index.html'
];

let touchstartX = 0, touchstartY = 0;
let touchendX = 0, touchendY = 0;

function handleSwipeGesture() {
    const swipeThreshold = 80;
    const diffX = touchendX - touchstartX;
    const diffY = touchendY - touchstartY;

    if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < -swipeThreshold) navigateGames(1);
        if (diffX > swipeThreshold) navigateGames(-1);
    }
}

function navigateGames(direction) {
    const currentPath = window.location.pathname;
    const currentIndex = gamesHubList.findIndex(game => currentPath.includes(game.split('/')[1]));
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
    window.location.href = gamesHubList[nextIndex];
}

document.addEventListener('touchstart', e => {
    if (['input', 'select', 'button'].includes(e.target.tagName.toLowerCase())) return;
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (['input', 'select', 'button'].includes(e.target.tagName.toLowerCase())) return;
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });
