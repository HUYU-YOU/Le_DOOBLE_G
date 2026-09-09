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
    // --- L'ANCIENNE FUITE DEVIENT LA CHUTE DANS LE PORTAIL ---
    fuite: {
        videoSrc: "assets/CHOIX2.mp4", 
        loop: false, 
        showUIAtEnd: true, // On attend la fin de l'animation du portail
        fr: { 
            topText: "La fuite...", 
            bottomText: "Éline court pour fuir le renard, mais trébuche et tombe dans un étrange portail !", 
            choices: [{ text: "Où ça mène ?", targetScene: "eline3" }] 
        },
        en: { 
            topText: "Fleeing...", 
            bottomText: "Eline runs to escape the fox, but trips and falls into a strange portal!", 
            choices: [{ text: "Where does it go?", targetScene: "eline3" }] 
        }
    },

    // --- LE GRAND CARREFOUR : FORÊT OU VILLE ---
    eline3: {
        videoSrc: "assets/ELINE3.mp4",
        loop: true,
        showUIAtEnd: false, 
        fr: {
            topText: "Un nouveau chemin",
            dialogues: [
                "Éline : Ouah... ma tête. OK, ce portail m'a recrachée ici.",
                "Éline : Il y a un sentier super sombre qui s'enfonce dans la forêt...",
                "Éline : Et de l'autre côté, on dirait bien une sorte de... ville fluo ?"
            ],
            bottomText: "Où Éline doit-elle aller ?",
            choices: [
                { text: "Explorer la forêt", targetScene: "eline4" },
                { text: "Aller dans la ville", targetScene: "ville_miao" }
            ]
        },
        en: {
            topText: "A new path",
            dialogues: [
                "Eline: Whoa... my head. OK, this portal spit me out here.",
                "Eline: There is a really dark path going deep into the forest...",
                "Eline: And on the other side, it looks like some kind of... neon city?"
            ],
            bottomText: "Where should Eline go?",
            choices: [
                { text: "Explore the forest", targetScene: "eline4" },
                { text: "Go to the city", targetScene: "ville_miao" }
            ]
        }
    },

    // --- BRANCHE 1 : LA VILLE ET MIAO ---
    ville_miao: {
        videoSrc: "assets/MIAO.mp4",
        loop: true,
        showUIAtEnd: false, 
        fr: {
            topText: "La Ville des Slimes",
            dialogues: [
                "Éline : C'est... bruyant. Et absolument tout est en gélatine.",
                "Une forme violette glisse nonchalamment vers elle en soupirant bruyamment.",
                "Miao : Mrrr... Encore une touriste humaine. Qu'est-ce que ça me saoule..."
            ],
            bottomText: "Miao le chat-slime fait son apparition !",
            choices: [{ text: "À suivre...", targetScene: "menu" }] // En attendant la suite de l'histoire en ville !
        },
        en: {
            topText: "Slime City",
            dialogues: [
                "Eline: It's... loud. And absolutely everything is made of jelly.",
                "A purple shape slides nonchalantly towards her, sighing loudly.",
                "Miao: Mrrr... Another human tourist. This is so annoying..."
            ],
            bottomText: "Miao the slime-cat appears!",
            choices: [{ text: "To be continued...", targetScene: "menu" }]
        }
    },

    // --- BRANCHE 2 : LA FORÊT ET LE CHOIX D'EMPATHIE ---
    eline4: {
        videoSrc: "assets/ELINE4.mp4",
        loop: true,
        showUIAtEnd: false,
        fr: {
            topText: "La Forêt Sombre",
            dialogues: [
                "Éline s'enfonce dans les bois, gardant ses écouteurs autour du cou pour se rassurer.",
                "Soudain, un énorme slime sauvage et tremblant bondit sur le chemin !",
                "Éline : Oh là là ! Il a l'air fâché... ou alors il est juste terrifié ?"
            ],
            bottomText: "Réaction rapide ! Que faire ?",
            choices: [
                { text: "Le frapper pour se défendre", targetScene: "choix3" },
                { text: "Lui faire un gros câlin", targetScene: "choix4" }
            ]
        },
        en: {
            topText: "The Dark Forest",
            dialogues: [
                "Eline goes deeper into the woods, keeping her headphones around her neck for comfort.",
                "Suddenly, a huge, trembling wild slime jumps onto the path!",
                "Eline: Oh boy! He looks angry... or maybe just terrified?"
            ],
            bottomText: "Quick reaction! What to do?",
            choices: [
                { text: "Hit him to defend yourself", targetScene: "choix3" },
                { text: "Give him a big hug", targetScene: "choix4" }
            ]
        }
    },

    // LES CONSÉQUENCES DU SLIME
    choix3: { 
        videoSrc: "assets/CHOIX3.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "Aïe...", bottomText: "Le slime n'a pas aimé ça du tout. Il s'enfuit en pleurant.", choices: [{ text: "Reprendre la route", targetScene: "eline5" }] },
        en: { topText: "Ouch...", bottomText: "The slime didn't like that at all. It runs away crying.", choices: [{ text: "Hit the road again", targetScene: "eline5" }] }
    },
    choix4: { 
        videoSrc: "assets/CHOIX4.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "Plein d'amour", bottomText: "L'empathie d'Éline fait des miracles. Le slime fond de bonheur sous le câlin !", choices: [{ text: "Reprendre la route", targetScene: "eline5" }] },
        en: { topText: "Full of love", bottomText: "Eline's empathy works wonders. The slime melts with happiness under the hug!", choices: [{ text: "Hit the road again", targetScene: "eline5" }] }
    },

    // --- LA SUITE DE LA FORÊT : LA POURSUITE ---
    eline5: {
        videoSrc: "assets/ELINE5.mp4",
        loop: false,
        showUIAtEnd: true,
        fr: { topText: "Toujours plus loin...", bottomText: "Éline avance prudemment, mais une silhouette bouge dans la brume.", choices: [{ text: "S'approcher", targetScene: "eline6" }] },
        en: { topText: "Deeper and deeper...", bottomText: "Eline moves carefully, but a silhouette moves in the mist.", choices: [{ text: "Approach", targetScene: "eline6" }] }
    },
    eline6: {
        videoSrc: "assets/ELINE6.mp4",
        loop: true,
        showUIAtEnd: false,
        fr: {
            topText: "L'Étranger",
            dialogues: [
                "L'ombre se dissipe légèrement. Quelqu'un fait signe à Éline de le suivre très vite.",
                "Éline : Je ne sais pas si c'est une très bonne idée de suivre un inconnu ici..."
            ],
            bottomText: "Que faire face à cette ombre ?",
            choices: [
                { text: "Faire confiance et le suivre", targetScene: "eline7" },
                { text: "FUIR dans l'autre sens !", targetScene: "fin1" }
            ]
        },
        en: {
            topText: "The Stranger",
            dialogues: [
                "The shadow dissipates slightly. Someone waves at Eline to follow them quickly.",
                "Eline: I don't know if following a stranger here is a good idea..."
            ],
            bottomText: "What to do with this shadow?",
            choices: [
                { text: "Trust and follow", targetScene: "eline7" },
                { text: "FLEE the other way!", targetScene: "fin1" }
            ]
        }
    },

    // LES FINS DE LA BRANCHE
    fin1: {
        videoSrc: "assets/FIN1.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "Fin de l'Aventure", bottomText: "Éline a paniqué et s'est perdue à jamais dans les méandres de Slimerland.", choices: [{ text: "Recommencer au début", targetScene: "partie1" }] },
        en: { topText: "End of the Adventure", bottomText: "Eline panicked and got lost forever in the maze of Slimerland.", choices: [{ text: "Restart from the beginning", targetScene: "partie1" }] }
    },
    eline7: {
        videoSrc: "assets/ELINE7.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "La poursuite", bottomText: "Éline prend son courage à deux mains et s'élance à la suite de l'inconnu !", choices: [] }, // Prêt pour la prochaine mise à jour !
        en: { topText: "The pursuit", bottomText: "Eline gathers her courage and rushes after the stranger!", choices: [] }
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
