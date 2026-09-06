// --- LE SCÉNARIO DU JEU ---
const story = {
    partie1: {
        videoSrc: "assets/ELINE0.mp4",
        topText: "Aventure d'Éline... partie 1...",
        bottomText: "Appuyer sur l'écran si tu es prêt à quitter ce lieu",
        showUIAtEnd: false, 
        choices: [
            { text: "Ready!", targetScene: "partie2" }
        ]
    },
    partie2: {
        videoSrc: "assets/ELINE1.mp4",
        topText: "",
        bottomText: "S'enfoncer dans la forêt...?",
        showUIAtEnd: true, 
        choices: [
            { text: "Ready!", targetScene: "partie3" }
        ]
    },
    partie3: {
        videoSrc: "assets/ELINE2.mp4",
        topText: "",
        bottomText: "Que faire ?",
        showUIAtEnd: true, 
        choices: [
            { text: "Ramasser le talisman et prendre le portail", targetScene: "partie4" },
            { text: "FUIRRRR!!!!!!!!!!", targetScene: "fuite" }
        ]
    },
    partie4: {
        videoSrc: "assets/CHOIX1.mp4", 
        topText: "À suivre...",
        bottomText: "Bienvenue dans Slimerland !",
        showUIAtEnd: false,
        choices: []
    },
    fuite: {
        videoSrc: "assets/CHOIX2.mp4", 
        topText: "Game Over",
        bottomText: "Tu as fui en courant...",
        showUIAtEnd: false,
        choices: [
            { text: "Menu Principal", targetScene: "partie1" } 
        ]
    }
};

// --- GESTION DU MOTEUR DE JEU ---
const videoElement = document.getElementById('story-video');
const topTextElement = document.getElementById('top-text');
const bottomTextElement = document.getElementById('bottom-text');
const choicesContainer = document.getElementById('choices-container');
let currentSceneData = null;

function loadScene(sceneId) {
    // Si on retourne au menu principal depuis un Game Over
    if (sceneId === "partie1" && currentSceneData && currentSceneData.topText === "Game Over") {
        document.getElementById('main-menu').style.display = 'flex'; // On réaffiche le menu
        videoElement.pause(); // On coupe la vidéo
        return;
    }

    currentSceneData = story[sceneId];
    
    topTextElement.classList.remove('visible');
    bottomTextElement.classList.remove('visible');
    choicesContainer.classList.remove('visible');
    choicesContainer.innerHTML = '';
    
    videoElement.src = currentSceneData.videoSrc;
    videoElement.load(); 
    
    let playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Lecture auto bloquée ou fichier introuvable : ", error);
            showInterface(); 
        });
    }

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

// --- GESTION MODAL & THÈME ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// --- BOUTONS DU MENU PRINCIPAL ---
function startNewGame() {
    // On cache le menu et on lance la partie 1
    document.getElementById('main-menu').style.display = 'none';
    loadScene('partie1');
}

function quitGame() {
    // Redirige vers la page d'accueil (ou l'index racine de ton projet)
    window.location.href = "../index.html"; 
}
