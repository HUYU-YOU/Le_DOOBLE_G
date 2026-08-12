/* --- DICTIONNAIRE CYBER-SPY (Undercover) --- */
/*
   Règle d'or : Pour un jeu fun, les mots doivent être très proches !
   L'imposteur (Undercover) ne connaît pas le mot de base, il doit
   deviner grâce aux descriptions des Civils quel est le mot Civil
   pour se fondre dans la masse.
*/

// ==========================================
// 📦 LISTE 1 : LA BASE (81 Paires)
// ==========================================
const liste1 = [
    // MANGAS & ANIMÉS
    ["Picasso", "Matisse"],
    ["Nikola Tesla", "Elon Musk"],
    ["Freezer", "Frigo"],
    ["Naruto", "Feunard"],
    ["Goku", "Superman"],
    ["Kira", "L"],
    ["Luffy", "Jack Sparrow"],
    ["Titans", "Géants"],
    ["Saitama", "Krilin"],
    ["Tortue Géniale", "Jiraiya"],
    ["Eren Jäger", "Godzilla"],
    ["Pikachu", "Évoli"],
    ["Guts", "Jon Snow"],

    // POP CULTURE & FILMS
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

    // HISTOIRE & PERSONNALITÉS
    ["Albert Einstein", "Isaac Newton"],
    ["Léonard de Vinci", "Donatello"],
    ["Mozart", "Beethoven"],
    ["Steve Jobs", "Pomme"],
    ["Zuckerberg", "Lézard"],
    ["Napoléon", "Jules César"],
    ["Cléopâtre", "Nefertiti"],

    // JEUX VIDÉO, TECH & WEB
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

    // NOURRITURE & BOISSONS
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

    // ANIMAUX & NATURE
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

    // OBJETS DU QUOTIDIEN
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

    // PIÈGES ABSURDES & DÉCALÉS
    ["Baguette", "Sabre Laser"],
    ["Chien", "Loup-Garou"],
    ["Zombie", "Momie"],
    ["Cthulhu", "Kraken"],
    ["Vampire", "Moustique"],
    ["Sorcier", "Magicien"],
    ["Avocat", "Juge"],
    ["Dentiste", "Médecin"],
    ["Père Noël", "Voleur"]
];


// ==========================================
// 📦 LISTE 2 : LA NOUVELLE SÉLECTION (81 Paires)
// ==========================================
const liste2 = [
    // MANGAS & ANIMÉS 
    ["Vegeta", "Sasuke"],
    ["Totoro", "Mickey"],
    ["Katana", "Épée"],
    ["Sharingan", "Byakugan"],
    ["Ninja", "Samouraï"],
    ["Hunter x Hunter", "One Piece"],
    ["Manga", "Comics"],
    ["Cosplay", "Déguisement"],
    ["Kamehameha", "Rasengan"],

    // POP CULTURE & FILMS
    ["Spider-Man", "Venom"],
    ["Luke Skywalker", "Harry Potter"],
    ["Homer Simpson", "Peter Griffin"],
    ["Avengers", "Justice League"],
    ["Groot", "Chewbacca"],
    ["Thanos", "Palpatine"],
    ["James Bond", "Ethan Hunt"],
    ["Indiana Jones", "Lara Croft"],
    ["Sherlock Holmes", "Hercule Poirot"],
    ["Disney", "Pixar"],
    ["Matrix", "Inception"],
    ["King Kong", "Jurassic Park"],

    // MÉTIERS & HISTOIRE
    ["Pompier", "Policier"],
    ["Astronaute", "Pilote"],
    ["Espion", "Détective"],
    ["Pirate", "Corsaire"],
    ["Pharaon", "Empereur"],
    ["Boulanger", "Cuisinier"],
    ["Gladiateur", "Mousquetaire"],

    // JEUX VIDÉO & TECH
    ["PC", "Mac"],
    ["Android", "iOS"],
    ["Mario Kart", "Crash Team Racing"],
    ["GTA", "Red Dead Redemption"],
    ["Pokemon", "Digimon"],
    ["Souris", "Trackpad"],
    ["Clé USB", "Disque Dur"],
    ["Pac-Man", "Tetris"],
    ["Nintendo", "Sega"],
    ["Wifi", "Bluetooth"],

    // NOURRITURE & BOISSONS
    ["Pâtes", "Riz"],
    ["Crêpe", "Gaufre"],
    ["Frite", "Chips"],
    ["Chocolat", "Nutella"],
    ["Moutarde", "Sauce Tomate"],
    ["Lait", "Lait d'Amande"],
    ["Pomme", "Poire"],
    ["Burger", "Hot-Dog"],
    ["Bonbon", "Sucre d'orge"],
    ["Kebab", "Shawarma"],

    // ANIMAUX & NATURE
    ["Ours", "Panda"],
    ["Cheval", "Âne"],
    ["Serpent", "Lézard"],
    ["Aigle", "Corbeau"],
    ["Requin", "Dauphin"],
    ["Singe", "Gorille"],
    ["Soleil", "Étoile"],
    ["Pluie", "Vent"],
    ["Forêt", "Jungle"],
    ["Désert", "Plage"],

    // OBJETS DU QUOTIDIEN
    ["Verre", "Tasse"],
    ["Botte", "Sandale"],
    ["Manteau", "Pull"],
    ["Porte", "Fenêtre"],
    ["Télévision", "Cinéma"],
    ["Shampoing", "Après-shampoing"],
    ["Serviette", "Peignoir"],
    ["Brosse", "Peigne"],
    ["Livre", "Magazine"],
    ["Voiture", "Camion"],

    // PIÈGES ABSURDES & DÉCALÉS
    ["Tracteur", "Tank"],
    ["Baignoire", "Piscine"],
    ["Fantôme", "Draps"], 
    ["Micro-onde", "Four"],
    ["Balai", "Aspirateur"],
    ["Oignon", "Ail"],
    ["Moustique", "Mouche"],
    ["Toilette", "Urinoir"],
    ["Clown", "Mime"],
    ["Cactus", "Hérisson"], 
    ["Saucisse", "Merguez"],
    ["T-Rex", "Vélociraptor"],
    ["Extraterrestre", "Astronaute"] 
];

// ==========================================
// 🚀 FUSION AUTOMATIQUE DES LISTES
// ==========================================
const wordPairs = [...liste1, ...liste2];

// Message console pour confirmer le chargement
console.log(`Dictionnaire 'mots.js' chargé avec succès : ${wordPairs.length} paires de mots au total (Liste 1 + Liste 2).`);
