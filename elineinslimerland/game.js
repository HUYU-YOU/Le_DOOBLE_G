// --- LE SCÉNARIO DU JEU ---
const story = {
    partie1: {
        videoSrc: "ELINE0.mp4",
        topText: "Aventure d'Éline... partie 1...",
        bottomText: "Appuyer sur l'écran si tu es prêt à quitter ce lieu",
        showUIAtEnd: false, 
        choices: [
            { text: "Ready!", targetScene: "partie2" }
        ]
    },
    partie2: {
        videoSrc: "ELINE1.MP4",
        topText: "",
        bottomText: "S'enfoncer dans la forêt...?",
        showUIAtEnd: true, 
        choices: [
            { text: "Ready!", targetScene: "partie3" }
        ]
    },
    partie3: {
        videoSrc: "ELINE2.MP4",
        topText: "",
        bottomText: "Que faire ?",
        showUIAtEnd: true, 
        choices: [
            { text: "Ramasser le talisman et prendre le portail", targetScene: "partie4" },
            { text: "FUIRRRR!!!!!!!!!!", targetScene: "fuite" }
        ]
    },
    partie4: {
        videoSrc: "ELINE3.MP4",
        topText: "À suivre...",
        bottomText: "Bienvenue dans Slimerland !",
        showUIAtEnd: false,
        choices: []
    },
    fuite: {
        videoSrc: "ELINE3.MP4", 
        topText: "Game Over",
        bottomText: "Tu as fui en courant...",
        showUIAtEnd: false,
        choices: [
            { text: "Recommencer", targetScene: "partie1" }
        ]
    }
};

// --- GESTION DU MOTEUR ---
const videoElement = document.getElementById('story-video');
const topTextElement = document.getElementById('top-text');
const bottomTextElement = document.getElementById('bottom-text');
const choicesContainer = document.getElementById('choices-container');

let currentSceneData = null;

function loadScene(sceneId) {
    currentSceneData = story[sceneId];
    
    topTextElement.classList.remove('visible');
    bottomTextElement.classList.remove('visible');
    choicesContainer.classList.remove('visible');
    choicesContainer.innerHTML = '';
    
    videoElement.src = currentSceneData.videoSrc;
    videoElement.play().catch(e => console.log("Clic requis pour lancer la vidéo avec le son."));

    topTextElement.innerText = currentSceneData.topText || "";
    bottomTextElement.innerText = currentSceneData.bottomText || "";

    currentSceneData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice.text;
        btn.onclick = () => loadScene(choice.targetScene);
        choicesContainer.appendChild(btn);
    });

    if (!currentSceneData.showUIAtEnd) {
        showInterface();
    }
}

function showInterface() {
    if (topTextElement.innerText !== "") topTextElement.classList.add('visible');
    if (bottomTextElement.innerText !== "") bottomTextElement.classList.add('visible');
    if (currentSceneData.choices.length > 0) choicesContainer.classList.add('visible');
}

videoElement.onended = () => {
    if (currentSceneData.showUIAtEnd) {
        showInterface();
    }
};

// --- ANIMATIONS DU BOUTON PARAMÈTRES ---
function startSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    img.style.transform = 'rotate(90deg) scale(1.15)';
}

function stopSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    img.style.transform = 'rotate(0deg) scale(1)';
}

function clickSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    img.style.transform = 'rotate(180deg) scale(1.25)';
    setTimeout(() => {
        img.style.transform = 'rotate(0deg) scale(1)';
    }, 300);
    toggleSettings();
}

// --- GESTION MODAL ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Démarrage du jeu
window.onload = () => {
    loadScene('partie1');
};
