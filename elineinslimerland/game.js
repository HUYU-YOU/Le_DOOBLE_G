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
            { text: "Recommencer", targetScene: "partie1" }
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
    currentSceneData = story[sceneId];
    
    // 1. Cacher l'interface le temps que la vidéo démarre
    topTextElement.classList.remove('visible');
    bottomTextElement.classList.remove('visible');
    choicesContainer.classList.remove('visible');
    choicesContainer.innerHTML = '';
    
    // 2. Charger la nouvelle vidéo
    videoElement.src = currentSceneData.videoSrc;
    videoElement.load(); // Ligne ultra importante pour réinitialiser la vidéo !
    
    // 3. Lancer la vidéo avec protection (play() renvoie une promise)
    let playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Lecture auto bloquée ou fichier introuvable : ", error);
            // Sécurité : au cas où le navigateur bloque la vidéo, on affiche quand même les boutons.
            showInterface(); 
        });
    }

    // 4. Préparer les textes de l'UI
    topTextElement.innerText = currentSceneData.topText || "";
    bottomTextElement.innerText = currentSceneData.bottomText || "";

    // 5. Créer les boutons de choix interactifs
    currentSceneData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice.text;
        // On attache la fonction de changement de scène au clic
        btn.onclick = () => loadScene(choice.targetScene);
        choicesContainer.appendChild(btn);
    });

    // 6. Afficher l'interface tout de suite si on ne doit pas attendre la fin de la vidéo
    if (!currentSceneData.showUIAtEnd) {
        showInterface();
    }
}

function showInterface() {
    if (topTextElement.innerText !== "") topTextElement.classList.add('visible');
    if (bottomTextElement.innerText !== "") bottomTextElement.classList.add('visible');
    if (currentSceneData.choices.length > 0) choicesContainer.classList.add('visible');
}

// Événement : Quand la vidéo est totalement terminée...
videoElement.onended = () => {
    // ...on affiche les choix seulement si showUIAtEnd est à true
    if (currentSceneData.showUIAtEnd) {
        showInterface();
    }
};


// --- ANIMATIONS DU BOUTON PARAMÈTRES ---
function startSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    if(img) img.style.transform = 'rotate(90deg) scale(1.15)';
}

function stopSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    if(img) img.style.transform = 'rotate(0deg) scale(1)';
}

function clickSettingsAnim() {
    const img = document.getElementById('settings-btn-img');
    if(img) {
        img.style.transform = 'rotate(180deg) scale(1.25)';
        setTimeout(() => {
            img.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    }
    toggleSettings();
}

// --- GESTION MODAL & THÈME ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Lancement automatique de la première scène au chargement
window.onload = () => {
    loadScene('partie1');
};
