// =========================================================
// LOGIQUE DE JEU - INTERFACE, PARAMÈTRES ET RÈGLES
// =========================================================

// --- 1. ANIMATION DES PARAMÈTRES ---
const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; 
let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
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
    if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { 
        if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; 
    }, 300);
}

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('show');
}

// --- 2. GESTION DES TAILLES D'ÉCRAN ---
function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    let btnClassic = document.getElementById('btn-sz-classic');
    let btnWide = document.getElementById('btn-sz-wide');
    let btnFull = document.getElementById('btn-sz-full');

    if (size === 'classic') { 
        container.classList.add('size-classic'); 
        if(btnClassic) btnClassic.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'wide') { 
        container.classList.add('size-wide'); 
        if(btnWide) btnWide.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'full') { 
        container.classList.add('size-full'); 
        if(btnFull) btnFull.classList.add('active'); 
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); 
    }

    // Informe le fichier map_three.js que le conteneur a changé de taille !
    if (typeof window.resize3DEnvironment === "function") {
        setTimeout(window.resize3DEnvironment, 50);
        setTimeout(window.resize3DEnvironment, 400); // 2eme appel à la fin de l'animation CSS
    }
}

document.addEventListener('fullscreenchange', () => { 
    const container = document.getElementById('game-container');
    if (!document.fullscreenElement && container && container.classList.contains('size-full')) {
        setGameSize('wide'); 
    }
});
