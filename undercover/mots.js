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
    ["Picasso (Peintre)", "Matisse (Peintre)"],
    ["Nikola Tesla (Inventeur)", "Elon Musk (Milliardaire)"],
    ["Freezer (Manga)", "Frigo (Électroménager)"], // Le piège parfait !
    ["Naruto (Héros)", "Feunard (Pokémon)"], // Renard à 9 queues !

    // --- MANGAS & ANIMÉS ---
    ["Goku (Saiyan)", "Superman (Héros)"], // Extraterrestres surpuissants
    ["Kira (Death Note)", "L (Enquêteur)"],
    ["Luffy (Pirate)", "Jack Sparrow (Pirate)"],
    ["Titans (SNK)", "Géants (Créatures)"],
    ["Saitama (One Punch Man)", "Krilin (Chauve)"],
    ["Tortue Géniale (DBZ)", "Jiraiya (Naruto)"], // Les vieux maîtres pervers
    ["Eren Jäger (SNK)", "Godzilla (Monstre)"],
    ["Pikachu (Pokémon)", "Évoli (Pokémon)"],

    // --- POP CULTURE & FILMS ---
    ["Dumbledore (Sorcier)", "Gandalf (Mage)"],
    ["Batman (DC)", "Iron Man (Marvel)"], // Milliardaires sans pouvoirs
    ["Néo (Matrix)", "John Wick (Film)"], // Keanu Reeves !
    ["Dark Vador (Sith)", "Kylo Ren (Sith)"],
    ["Mario (Nintendo)", "Luigi (Nintendo)"],
    ["Gollum (Seigneur des anneaux)", "Dobby (Harry Potter)"],
    ["Dracula (Vampire)", "Edward Cullen (Twilight)"],
    ["Terminator (Robot)", "Cyborg (Robot)"],

    // --- HISTOIRE & PERSONNALITÉS ---
    ["Albert Einstein (Génie)", "Isaac Newton (Génie)"],
    ["Léonard de Vinci (Peintre)", "Donatello (Tortue Ninja)"], // Piège sur le nom
    ["Mozart (Compositeur)", "Beethoven (Compositeur)"],
    ["Steve Jobs (Apple)", "Pomme (Fruit)"], // Petit piège vicieux
    ["Zuckerberg (Facebook)", "Lézard (Animal)"], // La fameuse blague d'internet

    // --- JEUX VIDÉO & TECH ---
    ["PlayStation (Console)", "Xbox (Console)"],
    ["Minecraft (Jeu)", "Lego (Jouet)"],
    ["Zelda (Princesse)", "Peach (Princesse)"],
    ["Spotify (Musique)", "Deezer (Musique)"],
    ["Twitch (Stream)", "YouTube (Vidéo)"],

    // --- PIÈGES ABSURDES & DÉCALÉS ---
    ["Baguette (Pain)", "Sabre Laser (Arme)"], // "C'est long et ça se tient à la main"
    ["Chien (Animal)", "Loup-Garou (Monstre)"],
    ["Zombie (Mort-vivant)", "Momie (Créature)"],
    ["Cthulhu (Monstre)", "Kraken (Monstre)"]
];

// Message console pour confirmer le chargement
console.log("Dictionnaire 'mots.js' chargé (" + wordPairs.length + " paires).");
