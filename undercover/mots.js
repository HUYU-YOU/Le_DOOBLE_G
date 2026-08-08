/* --- DICTIONNAIRE CYBER-SPY (Undercover) --- */
/*
   Règle d'or : Pour un jeu fun, les mots doivent être très proches !
   L'imposteur (Undercover) ne connaît pas le mot de base, il doit
   deviner grâce aux descriptions des Civils quel est le mot Civil
   pour se fondre dans la masse.
*/

// Chaque ligne est une paire : [ "Mot Civil", "Mot Undercover" ]
// Veille bien à respecter la syntaxe : guillemets, virgule, crochets.
const wordPairs = [
    // --- MODE EXPERT : Ta demande (Pop Culture & Rivaux) ---
    ["Tom Jedusor (Hacker)", "Voldemort (Hacker)"], // Très proche, très piégeux
    ["Naruto (Héros)", "Feunard (Monstre)"],       // Ta demande !
    ["Griffondor (Maison)", "Serpentard (Maison)"],
    ["Darth Vader (Sith)", "Anakin (Sith)"],
    
    // --- MANGA & ANIME (Rivaux) ---
    ["Naruto (Héros)", "Sasuke (Héros)"], 
    ["Goku (Saiyan)", "Vegeta (Saiyan)"], 
    ["Kira (Meurtrier)", "L (Enquêteur)"], // Death Note
    ["Luffy (Pirate)", "Zoro (Pirate)"],
    ["Pokémon", "Digimon"],
    
    // --- POP CULTURE (Films & Séries) ---
    ["Harry Potter", "Voldemort"],
    ["Poudlard (École)", "Beauxbâtons (École)"],
    ["Batman (Héros)", "Joker (Vilain)"],
    ["Marvel", "DC Comics"],
    ["Gandalf (Mage)", "Saroumane (Mage)"],
    
    // --- MUSIQUE & TECH ---
    ["Spotify (Stream)", "Deezer (Stream)"],
    ["Guitare (Instrument)", "Basse (Instrument)"],
    ["Rap (Musique)", "Hip Hop (Musique)"],
    ["PlayStation", "Xbox"]
];

// Message console pour confirmer le chargement
console.log("Dictionnaire 'mots.js' chargé (" + wordPairs.length + " paires).");
