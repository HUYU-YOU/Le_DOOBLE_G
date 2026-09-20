// ====== ANIMATION DU BOUTON SETTINGS ======
let currentSettingFrame = 1;
const settingsBtn = document.getElementById('btn-settings');
setInterval(() => {
    currentSettingFrame++;
    if (currentSettingFrame > 5) currentSettingFrame = 1;
    // On utilise img/ comme chemin !
    settingsBtn.src = `img/settings${currentSettingFrame}.png`;
}, 150);
// ==========================================

function updateBackground() {
    const ptTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Lisbon"});
    const hour = new Date(ptTime).getHours();
    const body = document.body;
    if (hour >= 8 && hour < 19) body.style.backgroundImage = "url('img/backday.png')";
    else body.style.backgroundImage = "url('img/backnight.png')";
    body.style.backgroundSize = "cover"; body.style.backgroundPosition = "center"; body.style.backgroundAttachment = "fixed";
}
updateBackground(); setInterval(updateBackground, 60000);

let game = {
    slimes: 0, totalSlimes: 0, clickPower: 1, cristaux: 0,
    upgradesBought: [], achievUnlocked: [], lastSaveTime: Date.now()
};

let goldenMultiplier = 1; let goldenTimerRemaining = 0; let goldenTimeout;
let buyAmount = 1; 

const buildings = [
    { id: 'b1', name: "Clic Musclé", desc: "Améliore votre clic", baseCost: 15, sps: 0, clickBonus: 1, count: 0, icon: "👆" },
    { id: 'b2', name: "Bébé Slime", desc: "Produit un peu de gelée", baseCost: 100, sps: 1, clickBonus: 0, count: 0, icon: "💧" },
    { id: 'b3', name: "Slime Ouvrier", desc: "Un bosseur acharné", baseCost: 1100, sps: 8, clickBonus: 0, count: 0, icon: "👷" },
    { id: 'b4', name: "Ferme à Slimes", desc: "L'agriculture visqueuse", baseCost: 12000, sps: 47, clickBonus: 0, count: 0, icon: "🚜" },
    { id: 'b5', name: "Usine de Gelée", desc: "Production industrielle", baseCost: 130000, sps: 260, clickBonus: 0, count: 0, icon: "🏭" },
    { id: 'b6', name: "Labo Slime", desc: "Expériences douteuses", baseCost: 1400000, sps: 1400, clickBonus: 0, count: 0, icon: "🧪" },
    { id: 'b7', name: "Mine de Slime", desc: "Extraction profonde", baseCost: 20000000, sps: 7800, clickBonus: 0, count: 0, icon: "⛏️" },
    { id: 'b8', name: "Roi Slime", desc: "Règne sur la gelée", baseCost: 330000000, sps: 44000, clickBonus: 0, count: 0, icon: "👑" },
    { id: 'b9', name: "Mégacorporation", desc: "Monopole mondial", baseCost: 5100000000, sps: 260000, clickBonus: 0, count: 0, icon: "🏢" },
    { id: 'b10', name: "Slime Mutant Alpha", desc: "Une bête redoutable", baseCost: 75000000000, sps: 1600000, clickBonus: 0, count: 0, icon: "🦖" },
    { id: 'b11', name: "Dragon Slime", desc: "Crache de la gelée pure", baseCost: 1000000000000, sps: 10000000, clickBonus: 0, count: 0, icon: "🐉" },
    { id: 'b12', name: "Dieu Slime", desc: "L'entité suprême", baseCost: 14000000000000, sps: 65000000, clickBonus: 0, count: 0, icon: "👁️" },
    { id: 'b13', name: "Faille Quantique", desc: "Déchire l'espace", baseCost: 170000000000000, sps: 430000000, clickBonus: 0, count: 0, icon: "🌌" },
    { id: 'b14', name: "Planète Slime", desc: "Un monde englouti", baseCost: 2100000000000000, sps: 2900000000, clickBonus: 0, count: 0, icon: "🪐" },
    { id: 'b15', name: "L'Omnivers", desc: "Tout est slime", baseCost: 26000000000000000, sps: 21000000000, clickBonus: 0, count: 0, icon: "🎇" }
];

const upgradesDef = [
    { id: 'u1', name: "Doigt Élastique", desc: "Clic x2", cost: 500, target: 'b1', mult: 2, icon: "🦾" },
    { id: 'u2', name: "Biberon de Gelée", desc: "Bébés Slimes x2", cost: 1000, target: 'b2', mult: 2, icon: "🍼" },
    { id: 'u3', name: "Casque de Chantier", desc: "Ouvriers x2", cost: 11000, target: 'b3', mult: 2, icon: "👷‍♂️" },
    { id: 'u4', name: "Souris Ergonomique", desc: "Clic x2", cost: 50000, target: 'b1', mult: 2, icon: "🖱️" },
    { id: 'u5', name: "Engrais Vert", desc: "Fermes x2", cost: 120000, target: 'b4', mult: 2, icon: "🌱" },
    { id: 'u6', name: "Chaîne de Montage", desc: "Usines x2", cost: 1300000, target: 'b5', mult: 2, icon: "⚙️" },
    { id: 'u7', name: "Clic Quantique", desc: "Clic x2", cost: 5000000, target: 'b1', mult: 2, icon: "🌌" },
    { id: 'u8', name: "Bécher Renforcé", desc: "Labos x2", cost: 14000000, target: 'b6', mult: 2, icon: "🧫" },
    { id: 'u9', name: "Foreuse Géante", desc: "Mines x2", cost: 200000000, target: 'b7', mult: 2, icon: "🪛" },
    { id: 'u10', name: "Couronne d'Or", desc: "Rois x2", cost: 3300000000, target: 'b8', mult: 2, icon: "👑" },
    { id: 'u11', name: "Paradis Fiscal", desc: "Mégacorporations x2", cost: 51000000000, target: 'b9', mult: 2, icon: "📈" },
    { id: 'u12', name: "ADN Instable", desc: "Mutants x2", cost: 750000000000, target: 'b10', mult: 2, icon: "🧬" },
    { id: 'u13', name: "Souffle de Gelée", desc: "Dragons x2", cost: 10000000000000, target: 'b11', mult: 2, icon: "🔥" }
];

const achievementsDef = [
    { id: 'a1', name: "Premier Sang", desc: "Générer 100 Slimes", icon: "🩸", req: () => game.totalSlimes >= 100 },
    { id: 'a2', name: "Capitaliste", desc: "Générer 1 Million de Slimes", icon: "💰", req: () => game.totalSlimes >= 1000000 },
    { id: 'a3', name: "Milliardaire", desc: "Générer 1 Milliard de Slimes", icon: "💎", req: () => game.totalSlimes >= 1000000000 },
    { id: 'a4', name: "Pouponnière", desc: "Acheter 50 Bébés Slimes", icon: "💧", req: () => buildings.find(b=>b.id==='b2').count >= 50 },
    { id: 'a5', name: "Syndicat", desc: "Acheter 100 bâtiments", icon: "🏗️", req: () => buildings.reduce((sum, b) => sum + b.count, 0) >= 100 },
    { id: 'a6', name: "Scientifique Fou", desc: "Acheter 5 améliorations", icon: "🧪", req: () => game.upgradesBought.length >= 5 },
    { id: 'a7', name: "Coup de Chance", desc: "Cliquer sur un Slime Doré", icon: "🌟", req: () => false },
    { id: 'a8', name: "L'Éveil", desc: "Faire une Ascension", icon: "🌌", req: () => game.cristaux > 0 },
    { id: 'a9', name: "Maître de l'Univers", desc: "Atteindre 1 Octillion de Slimes", icon: "🪐", req: () => game.totalSlimes >= 1e27 }
];

const newsLines = [
    "Flash Info : L'odeur de gelée envahit les rues...",
    "Rumeur : Les slimes mutent plus vite que prévu.",
    "Économie : Le cours du Slime explose à la bourse de Wall Street !",
    "Science : Les Slimes produiraient une énergie infinie.",
    "Scandale : Le Roi Slime aurait dévoré une ville entière.",
    "Alerte : Ne touchez pas aux slimes radioactifs !"
];

function formatNum(num) {
    if (num < 1000000) return Math.floor(num).toLocaleString('fr-FR');
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"];
    const tier = Math.floor(Math.log10(num) / 3);
    if (tier >= suffixes.length) return num.toExponential(2).replace('.', ',');
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    return scaled.toFixed(2).replace('.', ',') + " " + suffixes[tier];
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function loadGame() {
    const savedGame = localStorage.getItem('slimeClickerSave');
    if (savedGame) {
        const parsed = JSON.parse(savedGame);
        game.slimes = parsed.slimes || 0;
        game.totalSlimes = parsed.totalSlimes || 0;
        game.clickPower = parsed.clickPower || 1;
        game.cristaux = parsed.cristaux || 0;
        game.upgradesBought = parsed.upgradesBought || [];
        game.achievUnlocked = parsed.achievUnlocked || [];
        
        if (parsed.buildings) {
            parsed.buildings.forEach((savedB, index) => {
                if (buildings[index]) buildings[index].count = savedB.count || 0;
            });
        }
        
        if (game.cristaux > 0) document.getElementById('crystals-display').style.display = 'block';

        if (parsed.lastSaveTime) {
            const secondsOffline = (Date.now() - parsed.lastSaveTime) / 1000;
            if (secondsOffline > 60) {
                const offlineGains = getSPS() * secondsOffline;
                if(offlineGains > 0) {
                    game.slimes += offlineGains; game.totalSlimes += offlineGains;
                    document.getElementById('afk-amount').innerText = formatNum(offlineGains);
                    document.getElementById('afk-modal').style.display = 'flex';
                }
            }
        }
    }
}

function saveGame() {
    game.lastSaveTime = Date.now();
    const saveObj = {
        slimes: game.slimes, totalSlimes: game.totalSlimes, clickPower: game.clickPower,
        cristaux: game.cristaux, upgradesBought: game.upgradesBought, achievUnlocked: game.achievUnlocked,
        buildings: buildings.map(b => ({ count: b.count }))
    };
    localStorage.setItem('slimeClickerSave', JSON.stringify(saveObj));
}

function manualSave() {
    saveGame();
    showToast("💾", "Sauvegardé", "Votre partie a été enregistrée.");
}

function hardReset() {
    if (confirm("⚠️ ATTENTION ! Voulez-vous vraiment TOUT effacer ? Vous perdrez vos Slimes, vos bâtiments, et MÊME VOS CRISTAUX QUANTIQUES. C'est un retour à zéro complet.")) {
        if (confirm("Es-tu vraiment, vraiment sûr ? Il n'y aura aucun retour en arrière !")) {
            localStorage.removeItem('slimeClickerSave');
            location.reload();
        }
    }
}

function getBuildingMultiplier(b_id) {
    let m = 1; upgradesDef.forEach(u => { if (u.target === b_id && game.upgradesBought.includes(u.id)) m *= u.mult; });
    return m;
}

function getBaseSPS() {
    let total = 0; buildings.forEach(b => { if(b.id !== 'b1') total += b.sps * b.count * getBuildingMultiplier(b.id); });
    return total;
}

function getBaseClick() {
    let power = 1; buildings.forEach(b => { if(b.id === 'b1') power += b.clickBonus * b.count * getBuildingMultiplier(b.id); });
    return power;
}

function getSPS() { return getBaseSPS() * goldenMultiplier * (1 + (game.cristaux * 0.01)); }
function getClickPower() { return getBaseClick() * goldenMultiplier * (1 + (game.cristaux * 0.01)); }

function getBatchCost(building, amount) {
    let cost = 0;
    for(let i=0; i<amount; i++) cost += Math.floor(building.baseCost * Math.pow(1.15, building.count + i));
    return cost;
}

function getCrystalsToGain() {
    if (game.totalSlimes < 1000000) return 0;
    let totalLifetimeCrystals = Math.floor(Math.pow(game.totalSlimes / 1000000, 0.5));
    let toGain = totalLifetimeCrystals - game.cristaux;
    return toGain > 0 ? toGain : 0;
}

function doPrestige() {
    const toGain = getCrystalsToGain();
    if (toGain <= 0) return;
    if (confirm(`Muter ?\nVous perdrez vos Slimes et Bâtiments, mais gagnerez ${toGain} Cristaux (+${toGain}% bonus permanent).`)) {
        game.cristaux += toGain; game.slimes = 0; game.upgradesBought = []; buildings.forEach(b => b.count = 0);
        document.getElementById('crystals-display').style.display = 'block';
        saveGame(); renderShop(); renderUpgrades(); updateUI(); switchTab('dresseurs'); checkAchievements();
    }
}

function scheduleGoldenSlime() { setTimeout(spawnGoldenSlime, (Math.random() * 180000) + 180000); }
function spawnGoldenSlime() {
    if (goldenMultiplier > 1) { scheduleGoldenSlime(); return; }
    const gs = document.getElementById('golden-slime');
    gs.style.left = (10 + Math.random() * 70) + 'vw'; gs.style.top = (10 + Math.random() * 70) + 'vh'; gs.style.display = 'block';
    goldenTimeout = setTimeout(() => { gs.style.display = 'none'; scheduleGoldenSlime(); }, 8000);
}
function activateGoldenBuff(e) {
    const gs = document.getElementById('golden-slime'); gs.style.display = 'none'; clearTimeout(goldenTimeout);
    goldenMultiplier = 2; goldenTimerRemaining = 60; document.getElementById('golden-buff-ui').style.display = 'block'; updateUI();
    spawnFloatingText(e.clientX, e.clientY, "PRODUCTION X2 !!", "var(--slime-gold)");
    unlockAchievement('a7');
    scheduleGoldenSlime();
}
scheduleGoldenSlime();

const slimeImg = document.getElementById('slime-image');
function spawnFloatingText(x, y, text, color) {
    const el = document.createElement('div'); el.className = 'floating-number'; el.innerText = text; el.style.color = color;
    el.style.left = `${x - 30}px`; el.style.top = `${y - 30}px`; el.style.transform = `translateX(${(Math.random() - 0.5) * 60}px)`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 800);
}

function handleSlimePress(e) {
    if (e.cancelable) e.preventDefault();
    slimeImg.style.transform = 'scale(0.9, 0.85) translateY(20px)';
    slimeImg.style.transition = 'transform 0.05s';
    
    const power = getClickPower(); game.slimes += power; game.totalSlimes += power; updateUI();
    let x = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    let y = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
    spawnFloatingText(x, y, `+${formatNum(power)}`, "var(--slime-green)");
}

function handleSlimeRelease() { 
    slimeImg.style.transform = ''; 
    slimeImg.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
}

slimeImg.addEventListener('mousedown', handleSlimePress); slimeImg.addEventListener('mouseup', handleSlimeRelease); slimeImg.addEventListener('mouseleave', handleSlimeRelease);
slimeImg.addEventListener('touchstart', handleSlimePress, {passive: false}); slimeImg.addEventListener('touchend', handleSlimeRelease); slimeImg.addEventListener('touchcancel', handleSlimeRelease);

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`content-${tabName}`).classList.add('active');
    if (tabName === 'labo') renderUpgrades(); if (tabName === 'prestige') updatePrestigeUI(); if (tabName === 'succes') renderAchievements();
}

function setBuyAmount(amt, btnElement) {
    buyAmount = amt;
    document.querySelectorAll('.buy-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderShop(); updateUI();
}

function buyBuilding(index) {
    const b = buildings[index];
    const cost = getBatchCost(b, buyAmount);
    if (game.slimes >= cost) { game.slimes -= cost; b.count+=buyAmount; renderShop(); updateUI(); checkAchievements(); }
}

function buyUpgrade(u_id) {
    const u = upgradesDef.find(x => x.id === u_id);
    if (game.slimes >= u.cost && !game.upgradesBought.includes(u_id)) {
        game.slimes -= u.cost; game.upgradesBought.push(u_id); renderUpgrades(); updateUI(); checkAchievements();
    }
}

function unlockAchievement(id) {
    if(!game.achievUnlocked.includes(id)) {
        game.achievUnlocked.push(id);
        const a = achievementsDef.find(x=>x.id===id);
        showToast(a.icon, "Succès Déverrouillé !", a.name);
        renderAchievements();
    }
}

function checkAchievements() {
    achievementsDef.forEach(a => { if(!game.achievUnlocked.includes(a.id) && a.req()) unlockAchievement(a.id); });
}

function showToast(icon, title, text) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.innerHTML = `<div style="font-size:2.5rem;">${icon}</div><div><h4>${title}</h4><p>${text}</p></div>`;
    container.appendChild(toast); setTimeout(() => toast.remove(), 5000);
}

function updateUI() {
    document.getElementById('score-display').innerText = `${formatNum(game.slimes)} Slimes`;
    let spsText = `${formatNum(getSPS())} / sec`; if (goldenMultiplier > 1) spsText += ` (x2 ACTIF)`;
    document.getElementById('sps-display').innerText = spsText;
    document.getElementById('crystals-display').innerText = `🌌 ${formatNum(game.cristaux)} Cristaux`;

    buildings.forEach((b, index) => {
        const el = document.getElementById(`shop-item-${index}`);
        if (el) {
            if (game.slimes >= getBatchCost(b, buyAmount)) el.classList.remove('disabled');
            else el.classList.add('disabled');
        }
    });

    upgradesDef.forEach((u) => {
        const el = document.getElementById(`upg-${u.id}`);
        if (el && !game.upgradesBought.includes(u.id)) {
            if (game.slimes >= u.cost) el.classList.remove('disabled'); else el.classList.add('disabled');
        }
    });
    updatePrestigeUI();
}

function renderShop() {
    const shopList = document.getElementById('shop-list'); shopList.innerHTML = '';
    buildings.forEach((b, index) => {
        const cost = getBatchCost(b, buyAmount);
        const isAffordable = game.slimes >= cost;
        shopList.innerHTML += `
            <div id="shop-item-${index}" class="shop-item ${isAffordable ? '' : 'disabled'}" onclick="buyBuilding(${index})">
                <div class="item-info"><div class="item-icon">${b.icon}</div>
                <div class="item-details"><h3>${b.name}</h3><p>${b.desc}</p><div class="item-cost">🩸 ${formatNum(cost)}</div></div></div>
                <div class="item-count">${b.count}</div>
            </div>`;
    });
}

function renderUpgrades() {
    const upgList = document.getElementById('upgrades-list'); upgList.innerHTML = '';
    upgradesDef.forEach((u) => {
        const isBought = game.upgradesBought.includes(u.id); const isAffordable = game.slimes >= u.cost;
        const stateClass = isBought ? 'bought' : (isAffordable ? '' : 'disabled');
        upgList.innerHTML += `
            <div id="upg-${u.id}" class="upg-item ${stateClass}" onclick="buyUpgrade('${u.id}')">
                <div class="upg-icon">${u.icon}</div><div class="upg-name">${u.name}</div><div class="upg-desc">${u.desc}</div>
                ${isBought ? `<div style="color:var(--slime-green); font-size:1rem; font-weight:bold; margin-top:5px;">✔️ Acquis</div>` : `<div class="upg-cost">🩸 ${formatNum(u.cost)}</div>`}
            </div>`;
    });
}

function renderAchievements() {
    const list = document.getElementById('achiev-list'); list.innerHTML = '';
    achievementsDef.forEach((a) => {
        const isUnlocked = game.achievUnlocked.includes(a.id);
        list.innerHTML += `
            <div class="achiev-item ${isUnlocked ? 'unlocked' : ''}">
                <div class="achiev-icon">${isUnlocked ? a.icon : '❓'}</div>
                <div class="achiev-text"><h4>${isUnlocked ? a.name : 'Secret...'}</h4><p>${a.desc}</p></div>
            </div>`;
    });
}

function updatePrestigeUI() {
    document.getElementById('current-crystals').innerText = formatNum(game.cristaux);
    document.getElementById('crystal-bonus').innerText = `+${formatNum(game.cristaux * 1)}%`;
    const toGain = getCrystalsToGain();
    document.getElementById('crystals-to-gain').innerText = formatNum(toGain);
    const btn = document.getElementById('prestige-btn');
    if (toGain > 0) btn.classList.remove('disabled'); else btn.classList.add('disabled');
}

setInterval(() => {
    document.getElementById('news-text').innerText = newsLines[Math.floor(Math.random() * newsLines.length)];
}, 15000);

loadGame(); renderShop(); renderUpgrades(); renderAchievements(); updateUI();

let lastTickTime = Date.now();
setInterval(() => {
    const now = Date.now(); const deltaSec = (now - lastTickTime) / 1000; lastTickTime = now;

    if (goldenTimerRemaining > 0) {
        goldenTimerRemaining -= deltaSec;
        if (goldenTimerRemaining <= 0) {
            goldenTimerRemaining = 0; goldenMultiplier = 1;
            document.getElementById('golden-buff-ui').style.display = 'none'; updateUI();
        } else document.getElementById('golden-time').innerText = formatTime(goldenTimerRemaining);
    }

    const sps = getSPS();
    if (sps > 0) { game.slimes += sps * deltaSec; game.totalSlimes += sps * deltaSec; updateUI(); checkAchievements(); }
}, 100);

setInterval(saveGame, 5000);
