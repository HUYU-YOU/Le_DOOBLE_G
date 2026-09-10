// --- TRADUCTIONS DU MENU ---
const menuTranslations = {
    fr: { start: "Nouvelle partie", option: "Options", leave: "Quitter", optionsTitle: "Options", langue: "Langue 🌍", close: "Fermer", next: "▶ Suivant" },
    en: { start: "New Game", option: "Options", leave: "Quit", optionsTitle: "Settings", langue: "Language 🌍", close: "Close", next: "▶ Next" }
};

let currentLang = 'fr'; // Langue par défaut
let currentDialogIndex = 0; 

// --- LE SCÉNARIO DU JEU ---
const story = {
    partie1: {
        videoSrc: "assets/ELINE0.mp4", loop: false, showUIAtEnd: false, 
        fr: { topText: "Aventure d'Éline... partie 1...", bottomText: "Appuyer sur l'écran si tu es prêt à quitter ce lieu", choices: [{ text: "Prêt !", targetScene: "partie2" }] },
        en: { topText: "Eline's Adventure... part 1...", bottomText: "Tap the screen if you are ready to leave this place", choices: [{ text: "Ready!", targetScene: "partie2" }] }
    },
    partie2: {
        videoSrc: "assets/ELINE1.mp4", loop: false, showUIAtEnd: true, 
        fr: { topText: "", bottomText: "S'enfoncer dans la forêt...?", choices: [{ text: "Prêt !", targetScene: "partie3" }] },
        en: { topText: "", bottomText: "Go deeper into the forest...?", choices: [{ text: "Ready!", targetScene: "partie3" }] }
    },
    partie3: {
        videoSrc: "assets/ELINE2.mp4", loop: false, showUIAtEnd: true, 
        fr: { topText: "", bottomText: "Que faire ?", choices: [
            { text: "Ramasser le talisman et prendre le portail", targetScene: "partie4" },
            { text: "FUIRRRR!!!!!!!!!!", targetScene: "fuite" }
        ] },
        en: { topText: "", bottomText: "What to do?", choices: [
            { text: "Take the talisman and enter the portal", targetScene: "partie4" },
            { text: "FLEE!!!!!!!!!!", targetScene: "fuite" }
        ] }
    },
    partie4: {
        videoSrc: "assets/CHOIX1.mp4", loop: false, showUIAtEnd: false,
        fr: { topText: "À suivre...", bottomText: "Éline prend son courage à deux mains et saute dans le portail !", choices: [{ text: "Où ça mène ?", targetScene: "eline3" }] },
        en: { topText: "To be continued...", bottomText: "Eline gathers her courage and jumps into the portal!", choices: [{ text: "Where does it go?", targetScene: "eline3" }] }
    },
    fuite: {
        videoSrc: "assets/CHOIX2.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "La fuite...", bottomText: "Éline court pour fuir, mais trébuche et tombe dans l'étrange portail !", choices: [{ text: "Où ça mène ?", targetScene: "eline3" }] },
        en: { topText: "Fleeing...", bottomText: "Eline runs to escape, but trips and falls into the strange portal!", choices: [{ text: "Where does it go?", targetScene: "eline3" }] }
    },
    eline3: {
        videoSrc: "assets/ELINE3.mp4", loop: true, showUIAtEnd: false, 
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
    ville_miao: {
        videoSrc: "assets/MIAO.mp4", loop: true, showUIAtEnd: false, 
        fr: {
            topText: "La Ville des Slimes",
            dialogues: [
                "Éline : C'est... bruyant. Et absolument tout est en gélatine.",
                "Une forme violette glisse nonchalamment vers elle en soupirant bruyamment.",
                "Miao : Mrrr... Encore une touriste humaine. Qu'est-ce que ça me saoule..."
            ],
            bottomText: "Miao le chat-slime fait son apparition !",
            choices: [{ text: "Retour au menu", targetScene: "menu" }] 
        },
        en: {
            topText: "Slime City",
            dialogues: [
                "Eline: It's... loud. And absolutely everything is made of jelly.",
                "A purple shape slides nonchalantly towards her, sighing loudly.",
                "Miao: Mrrr... Another human tourist. This is so annoying..."
            ],
            bottomText: "Miao the slime-cat appears!",
            choices: [{ text: "Back to menu", targetScene: "menu" }]
        }
    },
    eline4: {
        videoSrc: "assets/ELINE4.mp4", loop: true, showUIAtEnd: false,
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
    eline5: {
        videoSrc: "assets/ELINE5.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "Toujours plus loin...", bottomText: "Éline avance prudemment, mais une silhouette bouge dans la brume.", choices: [{ text: "S'approcher", targetScene: "eline6" }] },
        en: { topText: "Deeper and deeper...", bottomText: "Eline moves carefully, but a silhouette moves in the mist.", choices: [{ text: "Approach", targetScene: "eline6" }] }
    },
    eline6: {
        videoSrc: "assets/ELINE6.mp4", loop: true, showUIAtEnd: false,
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
    fin1: {
        videoSrc: "assets/FIN1.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "Fin de l'Aventure", bottomText: "Éline a paniqué et s'est perdue à jamais dans les méandres de Slimerland.", choices: [{ text: "Recommencer", targetScene: "menu" }] },
        en: { topText: "End of the Adventure", bottomText: "Eline panicked and got lost forever in the maze of Slimerland.", choices: [{ text: "Restart", targetScene: "menu" }] }
    },
    eline7: {
        videoSrc: "assets/ELINE7.mp4", loop: false, showUIAtEnd: true,
        fr: { topText: "La poursuite", bottomText: "Éline prend son courage à deux mains et s'élance à la suite de l'inconnu !", choices: [] }, 
        en: { topText: "The pursuit", bottomText: "Eline gathers her courage and rushes after the stranger!", choices: [] }
    }
};

// --- GESTION DU MOTEUR DE JEU ---
const videoElement = document.getElementById('story-video');
const topTextElement = document.getElementById('top-text');
const bottomTextElement = document.getElementById('bottom-text');
const choicesContainer = document.getElementById('choices-container');
const gameContainer = document.getElementById('game-container');
const mainMenu = document.getElementById('main-menu');
let currentSceneData = null;

function loadScene(sceneId) {
    if (sceneId === "menu") {
        gameContainer.style.display = 'none';
        mainMenu.style.display = 'flex';
        videoElement.pause();
        currentSceneData = null;
        return;
    }

    currentSceneData = story[sceneId];
    const langData = currentSceneData[currentLang];
    
    topTextElement.classList.remove('visible');
    bottomTextElement.classList.remove('visible');
    choicesContainer.classList.remove('visible');
    choicesContainer.innerHTML = '';
    
    videoElement.src = currentSceneData.videoSrc;
    videoElement.loop = currentSceneData.loop || false;
    videoElement.load(); 
    
    let playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => { 
            console.log("Lecture bloquée : ", error); 
            showInterface();
        });
    }

    topTextElement.innerText = langData.topText || "";
    
    if (langData.dialogues && langData.dialogues.length > 0) {
        currentDialogIndex = 0;
        showNextDialogLine();
    } else {
        bottomTextElement.innerText = langData.bottomText || "";
        langData.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice.text;
            btn.onclick = () => loadScene(choice.targetScene);
            choicesContainer.appendChild(btn);
        });
        if (!currentSceneData.showUIAtEnd) showInterface();
    }
}

function showNextDialogLine() {
    const langData = currentSceneData[currentLang];
    
    if (currentDialogIndex < langData.dialogues.length) {
        bottomTextElement.innerText = langData.dialogues[currentDialogIndex];
        choicesContainer.innerHTML = '';
        const nextBtn = document.createElement('button');
        nextBtn.className = 'choice-btn';
        nextBtn.innerText = currentLang === 'fr' ? "▶ Suivant" : "▶ Next";
        nextBtn.onclick = () => {
            currentDialogIndex++;
            showNextDialogLine();
        };
        choicesContainer.appendChild(nextBtn);
        showInterface();
    } else {
        bottomTextElement.innerText = langData.bottomText || "";
        choicesContainer.innerHTML = '';
        langData.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice.text;
            btn.onclick = () => loadScene(choice.targetScene);
            choicesContainer.appendChild(btn);
        });
    }
}

function showInterface() {
    if (topTextElement.innerText !== "") topTextElement.classList.add('visible');
    if (bottomTextElement.innerText !== "") bottomTextElement.classList.add('visible');
    if (choicesContainer.innerHTML !== "") choicesContainer.classList.add('visible');
}

videoElement.onended = () => {
    if (currentSceneData.showUIAtEnd && !currentSceneData.loop) {
        showInterface();
    }
};

// --- GESTION DES MENUS ET OPTIONS ---
function changeLanguage() {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) currentLang = langSelect.value;
    
    const texts = menuTranslations[currentLang];
    
    if(document.getElementById('menu-text-start')) document.getElementById('menu-text-start').innerText = texts.start;
    if(document.getElementById('menu-text-option')) document.getElementById('menu-text-option').innerText = texts.option;
    if(document.getElementById('menu-text-leave')) document.getElementById('menu-text-leave').innerText = texts.leave;
    if(document.getElementById('modal-title-options')) document.getElementById('modal-title-options').innerText = texts.optionsTitle;
    if(document.getElementById('modal-text-lang')) document.getElementById('modal-text-lang').innerText = texts.langue;
    if(document.getElementById('modal-text-close')) document.getElementById('modal-text-close').innerText = texts.close;
}

window.addEventListener('DOMContentLoaded', changeLanguage);

function toggleSettings() { document.getElementById('settings-modal').classList.toggle('show'); }

function startNewGame() { 
    mainMenu.style.display = 'none'; 
    gameContainer.style.display = 'flex';
    loadScene('partie1'); 
}

function quitGame() { 
    // Ferme l'onglet ou redirige
    window.location.href = "https://google.com"; 
}
