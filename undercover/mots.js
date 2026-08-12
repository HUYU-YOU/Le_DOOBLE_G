/* --- DICTIONNAIRE CYBER-SPY (Undercover) --- */
/*
   Règle d'or : Pour un jeu fun, les mots doivent être très proches !
   L'imposteur (Undercover) ne connaît pas le mot de base, il doit
   deviner grâce aux descriptions des Civils quel est le mot Civil
   pour se fondre dans la masse.
*/

// Chaque ligne est une paire : [ "Mot Civil", "Mot Undercover" ]
const wordPairs = [
    // --- LES DEMANDES DU BOSS ---
    ["Picasso", "Matisse"],
    ["Nikola Tesla", "Elon Musk"],
    ["Freezer", "Frigo"], // Le piège parfait !
    ["Naruto", "Feunard"], // Renard à 9 queues !

    // --- MANGAS & ANIMÉS ---
    ["Goku", "Superman"],
    ["Kira", "L"],
    ["Luffy", "Jack Sparrow"],
    ["Titans", "Géants"],
    ["Saitama", "Krilin"],
    ["Tortue Géniale", "Jiraiya"],
    ["Eren Jäger", "Godzilla"],
    ["Pikachu", "Évoli"],
    ["Guts", "Jon Snow"],

    // --- POP CULTURE & FILMS ---
    ["Dumbledore", "Gandalf"],
    ["Batman", "Iron Man"],
    ["Néo", "John Wick"],
    ["Dark Vador", "Kylo Ren"],
    ["Mario", "Luigi"],
    ["Gollum", "Dobby"],
    ["Dracula", "Edward Cullen"],
    ["Terminator", "Cyborg"],
    ["Sauron", "Voldemort"],
    ["Joker", "Bouffon Vert"],
    ["Sonic", "Flash"],
    ["Poudlard", "Narnia"],

    // --- HISTOIRE & PERSONNALITÉS ---
    ["Albert Einstein", "Isaac Newton"],
    ["Léonard de Vinci", "Donatello"],
    ["Mozart", "Beethoven"],
    ["Steve Jobs", "Pomme"],
    ["Zuckerberg", "Lézard"],
    ["Napoléon", "Jules César"],
    ["Cléopâtre", "Nefertiti"],

    // --- JEUX VIDÉO, TECH & WEB ---
    ["PlayStation", "Xbox"],
    ["Minecraft", "Lego"],
    ["Zelda", "Peach"],
    ["Spotify", "Deezer"],
    ["Twitch", "YouTube"],
    ["Google", "Wikipedia"],
    ["Discord", "Skype"],
    ["TikTok", "Instagram"],
    ["Clavier", "Manette"],
    ["Netflix", "Prime Video"],

    // --- NOURRITURE & BOISSONS ---
    ["Pizza", "Quiche"],
    ["Coca-Cola", "Pepsi"],
    ["Café", "Thé"],
    ["Croissant", "Chocolatine"],
    ["Kebab", "Tacos"],
    ["Sushi", "Maki"],
    ["Ketchup", "Mayonnaise"],
    ["Bière", "Cidre"],
    ["Hamburger", "Cheeseburger"],
    ["Beurre", "Margarine"],

    // --- ANIMAUX & NATURE ---
    ["Tigre", "Lion"],
    ["Loup", "Chien"],
    ["Aigle", "Faucon"],
    ["Pigeon", "Mouette"],
    ["Araignée", "Scorpion"],
    ["Crocodile", "Alligator"],
    ["Océan", "Mer"],
    ["Montagne", "Colline"],
    ["Neige", "Glace"],
    ["Glace", "Sorbet"],

    // --- OBJETS DU QUOTIDIEN ---
    ["Guitare", "Basse"],
    ["Piano", "Synthétiseur"],
    ["Avion", "Hélicoptère"],
    ["Moto", "Scooter"],
    ["Montre", "Horloge"],
    ["Stylo", "Crayon"],
    ["Chaussette", "Gant"],
    ["Lit", "Canapé"],
    ["Savon", "Gel Douche"],
    ["Brosse à dents", "Cure-dents"],

    // --- PIÈGES ABSURDES & DÉCALÉS ---
    ["Baguette", "Sabre Laser"], // C'est long et ça se tient à la main
    ["Chien", "Loup-Garou"],
    ["Zombie", "Momie"],
    ["Cthulhu", "Kraken"],
    ["Vampire", "Moustique"], // Ça suce le sang !
    ["Sorcier", "Magicien"],
    ["Avocat", "Juge"],
    ["Dentiste", "Médecin"],
    ["Père Noël", "Voleur"] // Les deux rentrent par effraction la nuit
];

// Message console pour confirmer le chargement
console.log("Dictionnaire 'mots.js' chargé (" + wordPairs.length + " paires).");
