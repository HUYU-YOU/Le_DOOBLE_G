// --- LE SCÉNARIO DU JEU ---
// Ici on définit chaque scène. Tu pourras en ajouter autant que tu veux !
const story = {
    partie1: {
        videoSrc: "ELINE0.mp4",
        topText: "Aventure d'Eline... partie 1...",
        bottomText: "Appuyer sur l'écran si tu es pret à quitter ce lieu",
        showUIAtEnd: false, // false = on affiche le bouton tout de suite
        choices: [
            { text: "Ready!", targetScene: "partie2" }
        ]
    },
    partie2: {
        videoSrc: "ELINE1.mp4",
        topText: "",
        bottomText: "S'enfoncer dans la forêt...?",
        showUIAtEnd: true, // true = on attend la FIN de la vidéo pour afficher le choix
        choices: [
            { text: "Ready!", targetScene: "partie3" }
        ]
    },
    partie3: {
        videoSrc: "ELINE2.mp4",
        topText: "",
        bottomText: "Que faire ?",
        showUIAtEnd: true, // On attend la fin de l'animation pour lui laisser le choix
        choices: [
            { text: "Ramasser le talisman et prendre le portail", targetScene: "partie4" },
            { text: "FUIRRRR!!!!!!!!!!", targetScene: "fuite" }
        ]
    },
    partie4: {
        videoSrc: "ELINE3.mp4",
        topText: "À suivre demain...",
        bottomText: "Bravo, tu es entré dans Slime Wonderland !",
        showUIAtEnd: false,
        choices: []
    },
    fuite: {
        videoSrc: "ELINE3_FUITE.mp4", // Mets la vidéo que tu veux pour la fuite
        topText: "Game Over",
        bottomText: "Tu as fui en courant. Fin de l'histoire.",
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
    
    // 1. Cacher l'interface le temps de charger
    topTextElement.classList.remove('visible');
    bottomTextElement.classList.remove('visible');
    choicesContainer.classList.remove('visible');
    choicesContainer.innerHTML = ''; // Vider les anciens boutons
    
    // 2. Charger la vidéo
    videoElement.src = currentSceneData.videoSrc;
    videoElement.play().catch(e => console.log("L'utilisateur doit cliquer pour autoriser la vidéo avec le son."));

    // 3. Préparer les textes
    topTextElement.innerText = currentSceneData.topText || "";
    bottomTextElement.innerText = currentSceneData.bottomText || "";

    // 4. Créer les boutons de choix
    currentSceneData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice.text;
        btn.onclick = () => loadScene(choice.targetScene);
        choicesContainer.appendChild(btn);
    });

    // 5. Afficher l'UI (immédiatement ou à la fin)
    if (!currentSceneData.showUIAtEnd) {
        showInterface();
    }
}

function showInterface() {
    if (topTextElement.innerText !== "") topTextElement.classList.add('visible');
    if (bottomTextElement.innerText !== "") bottomTextElement.classList.add('visible');
    if (currentSceneData.choices.length > 0) choicesContainer.classList.add('visible');
}

// Quand la vidéo se termine, on affiche l'interface si on devait attendre
videoElement.onended = () => {
    if (currentSceneData.showUIAtEnd) {
        showInterface();
    }
};

// --- GESTION DES PARAMÈTRES (Ton code CSS) ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Démarrer le jeu au chargement de la page
window.onload = () => {
    loadScene('partie1');
};
