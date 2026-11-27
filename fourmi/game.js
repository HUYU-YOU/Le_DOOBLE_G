"use strict";

/* ============================================================================
   MYRMIDON — MOTEUR COMPLET DU VILLAGE-FOURMILIÈRE
   ============================================================================ */

const STORAGE_ACCOUNTS_KEY = "myrmidon_accounts_v2";
const STORAGE_SESSION_KEY = "myrmidon_session_v2";

// Castes / Éléments (Acide > Carapace > Venin > Acide | Solaire <-> Abysse)
const CASTES = {
  carapace: { name: "Carapace", icon: "🔵", color: "#3b82f6", accent: "#93c5fd", beats: "venin" },
  venin:    { name: "Venin",    icon: "🟢", color: "#22c55e", accent: "#86efac", beats: "acide" },
  acide:    { name: "Acide",    icon: "🔴", color: "#ef4444", accent: "#fca5a5", beats: "carapace" },
  solaire:  { name: "Solaire",  icon: "🟡", color: "#eab308", accent: "#fef08a", beats: "abysse" },
  abysse:   { name: "Abysse",   icon: "🟣", color: "#a855f7", accent: "#e9d5ff", beats: "solaire" },
};

// Catalogue des Soldates d'Élite invocables
const ANT_CATALOG = [
  // 3★ Natifs
  { id: "c3_garde",   name: "Garde Carapace",    awakenedName: "Bastion d'Obsidienne", caste: "carapace", baseStars: 3, hp: 520,  atk: 95,  def: 145, skill: "Bouclier Chitine" },
  { id: "v3_roder",   name: "Rôdeuse Venin",     awakenedName: "Ombre de Mante",       caste: "venin",    baseStars: 3, hp: 410,  atk: 135, def: 90,  skill: "Piqûre Foudroyante" },
  { id: "a3_crach",   name: "Cracheuse Acide",   awakenedName: "Artilleuse Corrosive", caste: "acide",    baseStars: 3, hp: 430,  atk: 140, def: 85,  skill: "Jet Formique" },
  { id: "s3_eclat",   name: "Éclaireuse Solaire",awakenedName: "Aube Dorée",           caste: "solaire",  baseStars: 3, hp: 480,  atk: 125, def: 115, skill: "Rayon d'Ambre" },
  { id: "b3_spectre", name: "Spectre Abysse",    awakenedName: "Chuchoteur du Vide",   caste: "abysse",   baseStars: 3, hp: 440,  atk: 148, def: 92,  skill: "Morsure Nocturne" },

  // 4★ Natifs
  { id: "c4_rhino",   name: "Chevalier Rhino",   awakenedName: "Goliath Cuirassé",     caste: "carapace", baseStars: 4, hp: 880,  atk: 155, def: 240, skill: "Charge de Corne" },
  { id: "v4_guepe",   name: "Fourmi-Guêpe",      awakenedName: "Impératrice Veuve",    caste: "venin",    baseStars: 4, hp: 690,  atk: 230, def: 145, skill: "Faux Empoisonnées" },
  { id: "a4_mortier", name: "Mortier Bio-Acide", awakenedName: "Pyro-Alchimiste",      caste: "acide",    baseStars: 4, hp: 720,  atk: 245, def: 140, skill: "Pluie Dissolvante" },
  { id: "s4_seraph",  name: "Séraphine d'Ambre", awakenedName: "Valkyrie Solaire",     caste: "solaire",  baseStars: 4, hp: 820,  atk: 215, def: 195, skill: "Lame Solaire" },
  { id: "b4_fauche",  name: "Faucheuse Abysse",  awakenedName: "Reine des Ombres",     caste: "abysse",   baseStars: 4, hp: 740,  atk: 255, def: 150, skill: "Éclipse Fatale" },

  // 5★ Natifs
  { id: "c5_titan",   name: "Général Titan",     awakenedName: "Empereur Goliath",     caste: "carapace", baseStars: 5, hp: 1450, atk: 245, def: 380, skill: "Forteresse Vivante" },
  { id: "v5_tisse",   name: "Tisseuse Impériale",awakenedName: "Souveraine Venimeuse", caste: "venin",    baseStars: 5, hp: 1120, atk: 375, def: 225, skill: "Tempête de Dards" },
  { id: "a5_behem",   name: "Béhémoth Acide",    awakenedName: "Cataclysme Formique",  caste: "acide",    baseStars: 5, hp: 1180, atk: 390, def: 220, skill: "Supernova Acide" },
  { id: "s5_archon",  name: "Archonte Solaire",  awakenedName: "Astre Royal Myrmidon", caste: "solaire",  baseStars: 5, hp: 1360, atk: 350, def: 310, skill: "Jugement de Lumière" },
  { id: "b5_seign",   name: "Seigneur Abysse",   awakenedName: "Némésis des Abysses",  caste: "abysse",   baseStars: 5, hp: 1240, atk: 420, def: 255, skill: "Vortex du Néant" },
];

// Chemin PvE : 12 étapes dans les galeries & surface (Élites UNIQUEMENT)
const PVE_STAGES = [
  { id: 1,  zone: "Galeries Moussues",   enemy: "Larve Vorace",          emoji: "🐛", power: 420,  hp: 750,  atk: 95,  boss: false, shards: 15, honey: 250,  cocoonChance: 0.08 },
  { id: 2,  zone: "Galeries Moussues",   enemy: "Cloporte Cuirassé",     emoji: "🪲", power: 580,  hp: 980,  atk: 115, boss: false, shards: 18, honey: 320,  cocoonChance: 0.10 },
  { id: 3,  zone: "Galeries Moussues",   enemy: "BOSS : Mante Religieuse", emoji: "🦗", power: 820, hp: 1550, atk: 165, boss: true,  shards: 32, honey: 650,  cocoonChance: 0.25 },
  { id: 4,  zone: "Ruche Suspendue",     emoji: "🐝", enemy: "Éclaireuse Abeille",   power: 1050, hp: 1750, atk: 190, boss: false, shards: 22, honey: 480,  cocoonChance: 0.12 },
  { id: 5,  zone: "Ruche Suspendue",     emoji: "🐝", enemy: "Frelon Garde-Royal",   power: 1350, hp: 2200, atk: 225, boss: false, shards: 26, honey: 600,  cocoonChance: 0.14 },
  { id: 6,  zone: "Ruche Suspendue",     emoji: "👑", enemy: "BOSS : Reine Abeille", power: 1850, hp: 3100, atk: 290, boss: true,  shards: 45, honey: 1100, cocoonChance: 0.35 },
  { id: 7,  zone: "Égouts Profonds",     emoji: "🕷️", enemy: "Araignée Loup",        power: 2250, hp: 3600, atk: 330, boss: false, shards: 30, honey: 850,  cocoonChance: 0.16 },
  { id: 8,  zone: "Égouts Profonds",     emoji: "🦂", enemy: "Scorpion des Caves",   power: 2750, hp: 4300, atk: 380, boss: false, shards: 36, honey: 1050, cocoonChance: 0.18 },
  { id: 9,  zone: "Égouts Profonds",     emoji: "🐀", enemy: "BOSS : Rat Géant",     power: 3500, hp: 5900, atk: 470, boss: true,  shards: 60, honey: 1800, cocoonChance: 0.45 },
  { id: 10, zone: "Jardin de l'Humain",  emoji: "🐸", enemy: "Crapaud Chasseur",     power: 4300, hp: 6900, atk: 540, boss: false, shards: 45, honey: 1400, cocoonChance: 0.22 },
  { id: 11, zone: "Jardin de l'Humain",  emoji: "🐦", enemy: "Merle Prédateur",      power: 5200, hp: 8200, atk: 620, boss: false, shards: 55, honey: 1750, cocoonChance: 0.25 },
  { id: 12, zone: "Jardin de l'Humain",  emoji: "🦎", enemy: "BOSS : Lézard Titan",  power: 6800, hp: 11500,atk: 780, boss: true,  shards: 90, honey: 3200, cocoonChance: 0.65 },
];

// Chemin PvP : 8 bastions de la Route des Conquérants
const PVP_BASTIONS = [
  { id: 1, rank: "Bronze III",    name: "Colonie des Mousseux",  power: 1200, terrain: 45,  medals: 20, shards: 15 },
  { id: 2, rank: "Bronze I",      name: "Avant-Poste Ocre",      power: 2400, terrain: 85,  medals: 30, shards: 20 },
  { id: 3, rank: "Argent II",     name: "Chaîne des Mandibules", power: 4200, terrain: 140, medals: 45, shards: 28 },
  { id: 4, rank: "Or III",        name: "Bastion d'Ambre",       power: 6800, terrain: 220, medals: 65, shards: 35 },
  { id: 5, rank: "Or I",          name: "Légion Formique",       power: 9800, terrain: 340, medals: 90, shards: 45 },
  { id: 6, rank: "Platine",       name: "Citadelle Carapace",    power: 14500,terrain: 500, medals: 125,shards: 60 },
  { id: 7, rank: "Diamant",       name: "Empire Solaire",        power: 21000,terrain: 780, medals: 175,shards: 80 },
  { id: 8, rank: "Empereur",      name: "Trône Myrmidon",        power: 32000,terrain: 1200,medals: 250,shards: 100 },
];

// Graphe de navigation des fourmis dans les galeries (coordonnées en % de la scène)
const TUNNEL_NODES = [
  { id: 0, x: 13, y: 81, next: [1, 8] },        // Loge de la Reine
  { id: 1, x: 15, y: 49, next: [0, 2] },        // Élevage Pucerons
  { id: 2, x: 31, y: 56, next: [1, 3, 4, 8] },  // Couveuse Mystique
  { id: 3, x: 35, y: 33, next: [2, 5] },        // Architecte Royal
  { id: 4, x: 50, y: 55, next: [2, 5, 6, 8] },  // Bassin de Soin
  { id: 5, x: 58, y: 33, next: [3, 4, 7] },     // Scarabée d'Or
  { id: 6, x: 71, y: 57, next: [4, 7, 8, 9] },  // Labo & Éveil
  { id: 7, x: 81, y: 37, next: [5, 6, 9] },     // Échoppe Gloire
  { id: 8, x: 50, y: 82, next: [0, 2, 4, 6] },  // Sanctuaire Fusion
  { id: 9, x: 85, y: 22, next: [6, 7] },        // Vers la sortie Dehors
];

const WEATHERS = [
  { id: "sun",   label: "☀️ Soleil Doré",         bonus: "Ponte +10%" },
  { id: "rain",  label: "🌧️ Pluie Fertile",       bonus: "Miellat +30%" },
  { id: "night", label: "🌙 Nuit Bioluminescente",bonus: "Bassin Soin +25%" },
];

const TUTORIAL_STEPS = [
  {
    title: "Bienvenue dans ta Fourmilière !",
    text: "En haut à gauche tu suis tes Fourmis (Terrain cm², Ouvrières, Soldates Classiques et Coma). En haut à droite, tes Matériaux (Miellat, Résine, Éclats et Cocons Mystiques).",
  },
  {
    title: "👑 La Loge de la Reine (Ponte H24)",
    text: "En bas à gauche, la Reine pond en continu des Ouvrières et des Soldates Classiques. En cas de défaite, tes fourmis ne meurent jamais : elles entrent dans le Coma et guérissent seconde par seconde dans le 💚 Bassin de Soin (2x plus vite que la ponte).",
  },
  {
    title: "🏪 Les Boutiques & la 🔮 Couveuse Mystique",
    text: "Dans ta fourmilière se trouvent tes 3 Boutiques (Architecte Royal pour construire l'Élevage de Pucerons et la Fusion 5★, Scarabée d'Or pour les Cocons, et Échoppe de Gloire). Ouvre tes 5 Cocons Mystiques offerts dans la Couveuse : seules tes fourmis invoquées se baladent dans tes galeries !",
  },
  {
    title: "🧪 Labo d'Évolution & Éveil (Zéro Rune)",
    text: "Clique sur une fourmi dans tes galeries (ou sur le Laboratoire) pour monter son Niveau, faire évoluer ses Étoiles (3★ → 6★) et l'Éveiller en Étoiles Violettes 🟣 !",
  },
  {
    title: "🌿 S'aventurer Dehors !",
    text: "À l'opposé de la Loge de la Reine, en haut à droite, le puits de lumière t'invite à sortir : parcours le Chemin PvE (Mante Religieuse, Reine Abeille, Rat Géant) pour farmer des Cocons, conquiers le Chemin PvP et affronte chaque jour le Boss Final communautaire : L'HUMAIN !",
  },
];

/* ================= ÉTAT GLOBAL DU JEU ================= */
let currentUser = null;
let state = null;
let walkerMap = new Map(); // uid -> { el, node, targetNode, t, speed, x, y, facing }
let activeModal = null;
let currentBattle = null;
let tutoIndex = 0;

function createDefaultState(username) {
  return {
    username,
    createdAt: Date.now(),
    terrain: 120,
    workers: 450,
    soldiers: 300,
    soldierLevel: 1,
    soldierXp: 0,
    coma: 0,
    comaProgress: 0,
    honey: 2500,
    resin: 1200,
    shards: 35,
    cocoons: 5,         // Pack Fondateur
    ldCocoons: 1,       // Pack Fondateur Light & Dark
    elemCocoons: { carapace: 0, venin: 0, acide: 0 },
    medals: 60,
    pity: 0,
    queenLevel: 1,
    poolLevel: 1,       // Niv 1 à 20 MAX
    buildings: { aphids: false, fusion: false },
    roster: [],         // STRICTEMENT les fourmis invoquées / fusionnées
    pveCleared: 0,
    pvpCleared: 0,
    weatherIdx: 0,
    warDebuffUntil: 0,
    dailyBossDate: "",
    worldBossCommunityHp: 74,
    passPoints: 20,
    passClaimed: [],
    tutoDone: false,
  };
}

/* ================= UTILITAIRES SÉCURITÉ & FORMAT ================= */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}

function fmt(n) {
  return Math.floor(n).toLocaleString("fr-FR");
}

// Hachage SHA-256 avec fallback hors-ligne (si lancé en file:// sans HTTPS)
async function hashPassword(password, salt) {
  const input = `${salt}::${password}::MYRMIDON_SEC_2026`;
  if (window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback déterministe si ouvert en file://
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return ("00000000" + (h1 >>> 0).toString(16)).slice(-8) + ("00000000" + (h2 >>> 0).toString(16)).slice(-8);
}

function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_ACCOUNTS_KEY) || "{}"); }
  catch { return {}; }
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function saveState() {
  if (!currentUser || !state) return;
  const accounts = loadAccounts();
  if (accounts[currentUser]) {
    accounts[currentUser].state = state;
    saveAccounts(accounts);
  }
}

function toast(msg) {
  const box = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; }, 3100);
  setTimeout(() => el.remove(), 3450);
}

/* ================= CALCULS STATS FOURMIS ================= */
function getAntTemplate(templateId) {
  return ANT_CATALOG.find(a => a.id === templateId) || ANT_CATALOG[0];
}

function getAntStats(ant) {
  const tpl = getAntTemplate(ant.templateId);
  const starMult = 1 + (ant.stars - tpl.baseStars) * 0.28;
  const lvlMult = 1 + (ant.level - 1) * 0.085;
  const awakeMult = ant.awakened ? 1.25 : 1;
  const total = starMult * lvlMult * awakeMult;
  const hp = Math.round(tpl.hp * total);
  const atk = Math.round(tpl.atk * total);
  const def = Math.round(tpl.def * total);
  return {
    hp, atk, def,
    power: Math.round(hp * 0.35 + atk * 2.1 + def * 1.6),
    displayName: ant.awakened ? tpl.awakenedName : tpl.name,
    tpl,
    caste: CASTES[tpl.caste],
  };
}

function renderStars(count, awakened) {
  return (awakened ? "🟣" : "⭐").repeat(count);
}

function getSoldierPower() {
  const mult = 1 + (state.soldierLevel - 1) * 0.18;
  return Math.round(state.soldiers * 3.2 * mult);
}

function getTopElites(limit = 4) {
  return [...state.roster]
    .sort((a, b) => getAntStats(b).power - getAntStats(a).power)
    .slice(0, limit);
}

function getLayingRatePerSec() {
  const weatherBonus = WEATHERS[state.weatherIdx].id === "sun" ? 1.1 : 1;
  const warDebuff = Date.now() < state.warDebuffUntil ? 0.85 : 1;
  return (1.2 + (state.queenLevel - 1) * 0.65) * weatherBonus * warDebuff;
}

function getHealingRatePerSec() {
  // Base = 2x plus rapide que la ponte, monte fortement jusqu'au Niveau 20 MAX
  const base = getLayingRatePerSec() * 2;
  const poolMult = 1 + (state.poolLevel - 1) * 0.22;
  const nightBonus = WEATHERS[state.weatherIdx].id === "night" ? 1.25 : 1;
  return base * poolMult * nightBonus;
}

/* ================= GÉNÉRATEUR SVG DES FOURMIS INVOQUÉES ================= */
function buildAntSVG(ant, facingLeft = false) {
  const { tpl, caste } = getAntStats(ant);
  const sizeClass = ant.stars >= 6 ? "size-6" : ant.stars >= 5 ? "size-5" : "";
  const flipClass = facingLeft ? "facing-left" : "";
  const aura = ant.awakened
    ? `<ellipse class="ant-aura-ring" cx="50" cy="42" rx="44" ry="26" fill="${caste.color}" opacity="0.24" />`
    : ant.stars >= 5
      ? `<ellipse class="ant-aura-ring" cx="50" cy="42" rx="38" ry="22" fill="#facc15" opacity="0.16" />`
      : "";

  // Détails uniques par Caste
  let casteExtras = "";
  if (tpl.caste === "carapace") {
    // Grande corne de rhinocéros dorée + bouclier dorsal
    casteExtras = `
      <path d="M74,34 Q90,14 96,22 Q86,28 80,38 Z" fill="#facc15" stroke="#422006" stroke-width="1.5"/>
      <ellipse cx="48" cy="34" rx="16" ry="11" fill="#1d4ed8" stroke="#93c5fd" stroke-width="2"/>
    `;
  } else if (tpl.caste === "venin") {
    // Ailes translucides battantes + faux de mante + dard néon
    casteExtras = `
      <ellipse class="ant-wing" cx="46" cy="20" rx="22" ry="8" fill="#86efac" opacity="0.55" stroke="#22c55e" stroke-width="1"/>
      <path d="M10,38 L2,32 L12,44 Z" fill="#4ade80"/>
      <path d="M78,44 Q92,50 86,58" stroke="#4ade80" stroke-width="3" fill="none" stroke-linecap="round"/>
    `;
  } else if (tpl.caste === "acide") {
    // Abdomen translucide bouillonnant + canons dorsaux
    casteExtras = `
      <circle cx="24" cy="36" r="5" fill="#fef08a" opacity="0.8"/>
      <circle cx="31" cy="43" r="3.5" fill="#fde047" opacity="0.9"/>
      <rect x="44" y="21" width="12" height="6" rx="3" fill="#991b1b" stroke="#fca5a5" stroke-width="1.2"/>
    `;
  } else if (tpl.caste === "solaire") {
    // 4 ailes dorées + halo solaire
    casteExtras = `
      <ellipse class="ant-wing" cx="46" cy="18" rx="26" ry="9" fill="#fef08a" opacity="0.7" stroke="#eab308" stroke-width="1.2"/>
      <ellipse class="ant-wing" cx="38" cy="24" rx="18" ry="6" fill="#fde047" opacity="0.6"/>
      <circle cx="75" cy="20" r="7" fill="none" stroke="#fef08a" stroke-width="2"/>
    `;
  } else if (tpl.caste === "abysse") {
    // Ailes spectrales + cristaux du vide
    casteExtras = `
      <polygon class="ant-wing" points="48,30 22,8 56,18" fill="#c084fc" opacity="0.65"/>
      <polygon points="24,26 29,14 35,26" fill="#e9d5ff" stroke="#6b21a8" stroke-width="1"/>
      <polygon points="44,24 49,12 54,24" fill="#d8b4fe" stroke="#6b21a8" stroke-width="1"/>
    `;
  }

  return `
    <svg class="ant-sprite ${sizeClass} ${flipClass}" viewBox="0 0 100 72">
      ${aura}
      <!-- Pattes animées -->
      <g class="ant-legs-a" stroke="#180d07" stroke-width="3.2" stroke-linecap="round" fill="none">
        <path d="M40,46 L30,62 L24,66" />
        <path d="M56,46 L58,64 L64,67" />
        <path d="M68,45 L78,60 L84,63" />
      </g>
      <g class="ant-legs-b" stroke="#2c180e" stroke-width="2.8" stroke-linecap="round" fill="none">
        <path d="M35,45 L22,58 L16,60" />
        <path d="M50,47 L46,63 L41,66" />
        <path d="M63,46 L72,62 L76,66" />
      </g>
      <!-- Abdomen -->
      <ellipse cx="26" cy="40" rx="17" ry="12" fill="${caste.color}" stroke="#1c0f08" stroke-width="2.2" />
      <ellipse cx="24" cy="36" rx="9" ry="4" fill="${caste.accent}" opacity="0.4" />
      <!-- Thorax -->
      <ellipse cx="52" cy="40" rx="14" ry="10" fill="#2c1910" stroke="${caste.accent}" stroke-width="1.8" />
      <!-- Tête & Mandibules -->
      <circle cx="72" cy="38" r="10" fill="${caste.color}" stroke="#1c0f08" stroke-width="2" />
      <circle cx="76" cy="35" r="2.6" fill="#fff" />
      <circle cx="77" cy="35" r="1.2" fill="#111" />
      <path d="M80,41 L89,45 L82,47" fill="#fef3c7" stroke="#1c0f08" stroke-width="1.2" />
      <path d="M74,29 Q80,18 88,21" stroke="#1c0f08" stroke-width="2" fill="none" />
      <path d="M70,29 Q74,17 82,16" stroke="#1c0f08" stroke-width="2" fill="none" />
      ${casteExtras}
    </svg>
  `;
}

/* ================= SYNCHRONISATION DES FOURMIS EN BALADE ================= */
function syncGalleryAnts() {
  const layer = document.getElementById("ants-layer");
  const hint = document.getElementById("empty-gallery-hint");
  const dock = document.getElementById("dock-list");
  document.getElementById("dock-count").textContent = state.roster.length;

  hint.classList.toggle("hidden", state.roster.length > 0);

  // Supprimer les fourmis qui ne sont plus dans le roster (ex: après fusion)
  const validIds = new Set(state.roster.map(a => a.uid));
  for (const [uid, w] of walkerMap.entries()) {
    if (!validIds.has(uid)) {
      w.el.remove();
      walkerMap.delete(uid);
    }
  }

  // Créer ou mettre à jour uniquement les fourmis invoquées
  state.roster.forEach(ant => {
    const info = getAntStats(ant);
    let w = walkerMap.get(ant.uid);
    if (!w) {
      const startNode = TUNNEL_NODES[2]; // Spawns à la Couveuse Mystique !
      const nextId = startNode.next[Math.floor(Math.random() * startNode.next.length)];
      const el = document.createElement("div");
      el.className = "walking-ant";
      el.dataset.uid = ant.uid;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openLabModal(ant.uid);
      });
      layer.appendChild(el);
      w = {
        uid: ant.uid,
        el,
        node: startNode.id,
        targetNode: nextId,
        t: Math.random() * 0.4,
        speed: 0.14 + Math.random() * 0.11,
        x: startNode.x,
        y: startNode.y,
        facingLeft: false,
      };
      walkerMap.set(ant.uid, w);
    }
    w.el.innerHTML = `
      <div class="ant-label">${info.caste.icon} ${escapeHtml(info.displayName)} ${renderStars(ant.stars, ant.awakened)}</div>
      ${buildAntSVG(ant, w.facingLeft)}
    `;
  });

  // Mettre à jour le dock bas-gauche
  dock.innerHTML = state.roster.length === 0
    ? `<span style="font-size:0.78rem;color:var(--text-muted)">Invoque une fourmi dans la Couveuse Mystique !</span>`
    : state.roster.map(ant => {
        const info = getAntStats(ant);
        return `
          <button class="dock-chip" data-spot="${ant.uid}">
            <span>${info.caste.icon}</span>
            <span>${escapeHtml(info.displayName)}</span>
            <small>${renderStars(ant.stars, ant.awakened)}</small>
          </button>
        `;
      }).join("");

  dock.querySelectorAll(".dock-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.spot;
      const w = walkerMap.get(uid);
      if (w) {
        w.el.classList.add("spotlight");
        setTimeout(() => w.el.classList.remove("spotlight"), 2200);
      }
      openLabModal(uid);
    });
  });
}

// Animation fluide 60 FPS des fourmis invoquées le long des galeries
let lastFrameTime = performance.now();
function animateWalkers(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  for (const w of walkerMap.values()) {
    const from = TUNNEL_NODES[w.node];
    const to = TUNNEL_NODES[w.targetNode];
    w.t += dt * w.speed;
    if (w.t >= 1) {
      w.t = 0;
      const prev = w.node;
      w.node = w.targetNode;
      const options = TUNNEL_NODES[w.node].next.filter(n => n !== prev);
      const choices = options.length ? options : TUNNEL_NODES[w.node].next;
      w.targetNode = choices[Math.floor(Math.random() * choices.length)];
    }
    const f2 = TUNNEL_NODES[w.node];
    const t2 = TUNNEL_NODES[w.targetNode];
    const nx = f2.x + (t2.x - f2.x) * w.t;
    const ny = f2.y + (t2.y - f2.y) * w.t;
    const newLeft = nx < w.x;
    if (newLeft !== w.facingLeft && Math.abs(nx - w.x) > 0.01) {
      w.facingLeft = newLeft;
      const svg = w.el.querySelector(".ant-sprite");
      if (svg) svg.classList.toggle("facing-left", w.facingLeft);
    }
    w.x = nx;
    w.y = ny;
    w.el.style.left = `${w.x}%`;
    w.el.style.top = `${w.y}%`;
  }
  requestAnimationFrame(animateWalkers);
}

/* ================= BULLES DE RÉCOLTE DIRECTE ================= */
function spawnHarvestBubble() {
  if (!state) return;
  const layer = document.getElementById("bubbles-layer");
  if (layer.children.length >= 3) return;
  const spots = [
    { x: 14, y: 74, type: "workers", label: "+40 🐜 Ponte" },
    { x: 32, y: 49, type: "shards",  label: "+15 🧩 Éclats" },
    { x: 51, y: 48, type: "honey",   label: "+350 🍯 Miellat" },
    { x: 70, y: 50, type: "resin",   label: "+180 💎 Résine" },
  ];
  const pick = spots[Math.floor(Math.random() * spots.length)];
  const b = document.createElement("button");
  b.className = "harvest-bubble";
  b.style.left = `${pick.x}%`;
  b.style.top = `${pick.y}%`;
  b.textContent = pick.label;
  b.addEventListener("click", () => {
    if (pick.type === "workers") state.workers += 40;
    if (pick.type === "shards") addShards(15);
    if (pick.type === "honey") state.honey += 350;
    if (pick.type === "resin") state.resin += 180;
    b.remove();
    updateHUD();
    toast(`✨ Récolté : ${pick.label}`);
  });
  layer.appendChild(b);
  setTimeout(() => b.remove(), 14000);
}

function addShards(amount) {
  state.shards += amount;
  while (state.shards >= 100) {
    state.shards -= 100;
    state.cocoons += 1;
    toast("🎉 100 Éclats fusionnés → <strong>+1 🔮 Cocon Mystique</strong> !");
  }
}

/* ================= MISE À JOUR HUD & VILLAGE ================= */
function updateHUD() {
  if (!state) return;
  document.getElementById("hud-terrain").textContent = fmt(state.terrain);
  document.getElementById("hud-workers").textContent = fmt(state.workers);
  document.getElementById("hud-soldiers").textContent = fmt(state.soldiers);
  document.getElementById("hud-soldier-lvl").textContent = `Niv.${state.soldierLevel}`;
  document.getElementById("hud-coma").textContent = fmt(state.coma);
  document.getElementById("hud-honey").textContent = fmt(state.honey);
  document.getElementById("hud-resin").textContent = fmt(state.resin);
  document.getElementById("hud-shards").textContent = `${state.shards}/100`;
  document.getElementById("hud-cocoons").textContent = fmt(state.cocoons);
  document.getElementById("hud-ld").textContent = fmt(state.ldCocoons);
  document.getElementById("hud-medals").textContent = fmt(state.medals);
  document.getElementById("hud-username").textContent = state.username;

  // Labels dynamiques des bâtiments
  document.getElementById("lbl-queen").textContent = `Niv.${state.queenLevel} (+${getLayingRatePerSec().toFixed(1)}/s)`;
  document.getElementById("lbl-pool").textContent = `Niv. ${state.poolLevel} / 20`;
  document.getElementById("lbl-aphids").textContent = state.buildings.aphids ? `Soldates Niv.${state.soldierLevel}` : "🔒 Architecte";
  document.getElementById("lbl-fusion").textContent = state.buildings.fusion ? "Fusion 5★ active" : "🔒 Architecte";

  document.getElementById("room-aphids").classList.toggle("locked-room", !state.buildings.aphids);
  document.getElementById("room-fusion").classList.toggle("locked-room", !state.buildings.fusion);

  const weather = WEATHERS[state.weatherIdx];
  document.getElementById("btn-weather").textContent = `${weather.label} (${weather.bonus})`;
  document.getElementById("war-debuff-badge").classList.toggle("hidden", Date.now() >= state.warDebuffUntil);
}

/* ================= BOUCLE TEMPS RÉEL (1 SECONDE) ================= */
setInterval(() => {
  if (!state) return;
  const lay = getLayingRatePerSec();
  state.workers += lay * 0.65;
  state.soldiers += lay * 0.35;

  const rainMult = WEATHERS[state.weatherIdx].id === "rain" ? 1.3 : 1;
  const warDebuff = Date.now() < state.warDebuffUntil ? 0.85 : 1;
  state.honey += (2.5 + state.terrain * 0.04) * rainMult * warDebuff;
  state.resin += (1.2 + state.terrain * 0.02) * warDebuff;

  // Régénération seconde par seconde du Bassin de Soin (Zéro mort définitive)
  if (state.coma > 0) {
    const heal = getHealingRatePerSec();
    state.comaProgress += heal;
    const healed = Math.min(state.coma, Math.floor(state.comaProgress));
    if (healed > 0) {
      state.coma -= healed;
      state.comaProgress -= healed;
      state.soldiers += healed;
    }
    if (activeModal === "pool") renderPoolModal();
  }

  updateHUD();
  saveState();
}, 1000);

setInterval(spawnHarvestBubble, 12000);

/* ================= SYSTÈME DE MODALES ================= */
function openModal(title, html, modalId = "generic") {
  activeModal = modalId;
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  activeModal = null;
  currentBattle = null;
  document.getElementById("modal-backdrop").classList.add("hidden");
}

/* ================= 1. LOGE DE LA REINE ================= */
function openQueenModal() {
  const costH = state.queenLevel * 900;
  const costR = state.queenLevel * 450;
  openModal("👑 Loge de la Reine Myrmidia (Ponte H24)", `
    <div class="grid-2">
      <div class="card">
        <h3>Ponte Continue 24h/24</h3>
        <p>Ta Reine pond sans interruption des <strong>Ouvrières</strong> (65%) et des <strong>Soldates Classiques</strong> (35%) pour agrandir ta masse d'armée.</p>
        <div class="stat-row">
          <span class="stat-pill">Niveau Reine : <strong>${state.queenLevel}</strong></span>
          <span class="stat-pill">Cadence : <strong>+${getLayingRatePerSec().toFixed(2)} fourmis/sec</strong></span>
        </div>
        <button id="btn-up-queen" class="btn btn-gold">Améliorer la Reine (${fmt(costH)} 🍯 + ${fmt(costR)} 💎)</button>
      </div>
      <div class="card">
        <h3>Règle d'Or de la Colonie</h3>
        <p>• <strong>Soldates Classiques</strong> : Combattent en PvP et face au Boss Final Humain.<br>
           • <strong>Soldates d'Élite (Cocons)</strong> : Combattent partout (Mode Histoire PvE + PvP + Boss Humain).<br>
           • <strong>Zéro perte définitive</strong> : Toutes les pertes partent au Bassin de Soin.</p>
      </div>
    </div>
  `, "queen");

  document.getElementById("btn-up-queen").onclick = () => {
    if (state.honey < costH || state.resin < costR) return toast("❌ Ressources insuffisantes !");
    state.honey -= costH;
    state.resin -= costR;
    state.queenLevel++;
    toast(`👑 Reine passée au Niveau ${state.queenLevel} !`);
    openQueenModal();
    updateHUD();
  };
}

/* ================= 2. COUVEUSE MYSTIQUE (INVOCATIONS) ================= */
function rollAnt(poolType = "mystique") {
  state.pity++;
  let stars = 3;
  const r = Math.random();
  if (state.pity >= 40 || r < 0.08) {
    stars = 5;
    state.pity = 0;
  } else if (r < 0.32) {
    stars = 4;
  }

  let candidates = ANT_CATALOG.filter(a => a.baseStars === stars);
  if (poolType === "mystique") {
    candidates = candidates.filter(a => ["carapace", "venin", "acide"].includes(a.caste));
  } else if (poolType === "ld") {
    candidates = candidates.filter(a => ["solaire", "abysse"].includes(a.caste));
  } else if (CASTES[poolType]) {
    candidates = candidates.filter(a => a.caste === poolType);
  }
  const tpl = candidates[Math.floor(Math.random() * candidates.length)] || ANT_CATALOG[0];
  const ant = {
    uid: `ant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    templateId: tpl.id,
    stars: tpl.baseStars,
    level: 1,
    awakened: false,
  };
  state.roster.push(ant);
  state.passPoints += 10;
  return ant;
}

function playSummonCinematic(ants) {
  const overlay = document.getElementById("summon-cinematic");
  const cocoon = document.getElementById("cine-cocoon");
  const bolt = document.getElementById("cine-lightning");
  const result = document.getElementById("cine-result");
  const closeBtn = document.getElementById("cine-close");

  const hasLightning = ants.some(a => a.stars >= 4);
  overlay.classList.remove("hidden");
  cocoon.classList.remove("hidden");
  result.classList.add("hidden");
  closeBtn.classList.add("hidden");
  bolt.classList.toggle("hidden", !hasLightning);

  setTimeout(() => {
    cocoon.classList.add("hidden");
    bolt.classList.add("hidden");
    result.classList.remove("hidden");
    closeBtn.classList.remove("hidden");

    const best = ants.reduce((a, b) => (b.stars > a.stars ? b : a), ants[0]);
    const info = getAntStats(best);
    result.innerHTML = ants.length === 1
      ? `
        <div style="font-size:0.85rem;color:var(--amber);margin-bottom:6px;">${hasLightning ? "⚡ ÉCLAIR BIO-ÉLECTRIQUE !" : "✨ ÉCLOSION RÉUSSIE"}</div>
        <div style="display:flex;justify-content:center;">${buildAntSVG(best, false)}</div>
        <h2 style="color:var(--amber-soft);margin-top:8px;">${info.caste.icon} ${escapeHtml(info.displayName)}</h2>
        <div style="font-size:1.2rem;margin:4px 0;">${renderStars(best.stars, false)}</div>
        <p style="font-size:0.85rem;color:var(--text-muted)">Caste ${info.caste.name} • Compétence : <strong>${info.tpl.skill}</strong></p>
        <div class="stat-row" style="justify-content:center;margin-top:8px;">
          <span class="stat-pill">❤️ ${info.hp}</span>
          <span class="stat-pill">⚔️ ${info.atk}</span>
          <span class="stat-pill">🛡️ ${info.def}</span>
        </div>
      `
      : `
        <h2 style="color:var(--amber);margin-bottom:10px;">⚡ Résultat de l'Invocation x${ants.length}</h2>
        <div class="grid-3" style="max-height:50vh;overflow-y:auto;">
          ${ants.map(a => {
            const st = getAntStats(a);
            return `<div class="card" style="padding:8px;align-items:center;">
              <strong>${st.caste.icon} ${escapeHtml(st.displayName)}</strong>
              <span>${renderStars(a.stars, false)}</span>
            </div>`;
          }).join("")}
        </div>
      `;

    syncGalleryAnts();
    updateHUD();
    saveState();
  }, hasLightning ? 1350 : 850);
}

function triggerSummon(poolType, count = 1) {
  if (poolType === "mystique") {
    if (state.cocoons < count) return toast("❌ Pas assez de Cocons Mystiques ! Farme le Chemin PvE ou visite le Scarabée d'Or.");
    state.cocoons -= count;
  } else if (poolType === "ld") {
    if (state.ldCocoons < count) return toast("❌ Pas de Cocon Solaire/Abysse ! Gagne-en dans l'Échoppe de Gloire ou le Passe.");
    state.ldCocoons -= count;
  } else {
    if ((state.elemCocoons[poolType] || 0) < count) return toast("❌ Pas de Cocon Élémentaire de cette caste !");
    state.elemCocoons[poolType] -= count;
  }
  const results = [];
  for (let i = 0; i < count; i++) results.push(rollAnt(poolType));
  closeModal();
  playSummonCinematic(results);
}

function openHatcheryModal() {
  const pityPct = Math.min(100, Math.round((state.pity / 40) * 100));
  openModal("🔮 Couveuse Mystique — Invocations de Fourmis Élites", `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Compteur Pity 5★ Garanti</h3>
        <strong>${state.pity} / 40 invocations</strong>
      </div>
      <div class="progress-track"><div class="progress-fill purple" style="width:${pityPct}%"></div></div>
      <p>Taux éthiques : <strong>5★ Natif : 8%</strong> • <strong>4★ Natif : 24%</strong> • <strong>3★ Natif : 68%</strong>. Chaque fourmi invoquée rejoint immédiatement tes galeries !</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>🔮 Cocon Mystique (${state.cocoons})</h3>
        <p>Invoque une Soldate d'Élite 3★ à 5★ (🔵 Carapace, 🟢 Venin, 🔴 Acide).</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-purple" onclick="triggerSummon('mystique',1)">Ouvrir x1</button>
          <button class="btn btn-gold" onclick="triggerSummon('mystique',5)">Ouvrir x5</button>
        </div>
      </div>
      <div class="card">
        <h3>☯️ Cocon Solaire & Abysse (${state.ldCocoons})</h3>
        <p>Invoque une fourmi rarissime de caste 🟡 Solaire ou 🟣 Abysse (Light & Dark).</p>
        <button class="btn btn-gold" onclick="triggerSummon('ld',1)">Éveiller x1 Solaire/Abysse</button>
      </div>
    </div>
    <div class="card">
      <h3>Cocons Élémentaires ciblés</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-wood" onclick="triggerSummon('carapace',1)">🔵 Carapace (${state.elemCocoons.carapace || 0})</button>
        <button class="btn btn-wood" onclick="triggerSummon('venin',1)">🟢 Venin (${state.elemCocoons.venin || 0})</button>
        <button class="btn btn-wood" onclick="triggerSummon('acide',1)">🔴 Acide (${state.elemCocoons.acide || 0})</button>
      </div>
    </div>
  `, "hatchery");
}

/* ================= 3. BASSIN DE SOIN (NIV 1 À 20 MAX) ================= */
function renderPoolModal() {
  const rate = getHealingRatePerSec();
  const etaSec = state.coma > 0 ? Math.ceil(state.coma / rate) : 0;
  const costH = state.poolLevel * 700;
  const costR = state.poolLevel * 500;
  const isMax = state.poolLevel >= 20;

  openModal("💚 Bassin de Soin — Régénération du Coma", `
    <div class="grid-2">
      <div class="card">
        <h3>Régénération Seconde par Seconde</h3>
        <p>Tes fourmis vaincues entrent dans le <strong>Coma Phéromonal</strong> et guérissent automatiquement ici, au minimum <strong>2x plus vite que la ponte de la Reine</strong>.</p>
        <div class="stat-row">
          <span class="stat-pill">Niveau Bassin : <strong>${state.poolLevel} / 20 MAX</strong></span>
          <span class="stat-pill">Vitesse : <strong>+${rate.toFixed(1)} fourmis/sec</strong></span>
        </div>
        <div class="stat-row">
          <span class="stat-pill">En Coma : <strong>${fmt(state.coma)} 💤</strong></span>
          <span class="stat-pill">Temps restant estimé : <strong>${etaSec}s</strong></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${state.coma > 0 ? Math.min(100, (state.comaProgress % 1) * 100) : 100}%"></div>
        </div>
      </div>
      <div class="card">
        <h3>Améliorer le Bassin</h3>
        <p>Au <strong>Niveau 20 MAX</strong>, même une armée massive récupère en un temps record (équivalent 3 jours max pour des millions de troupes en late-game).</p>
        ${isMax
          ? `<button class="btn btn-emerald" disabled>✨ Niveau 20 MAX atteint</button>`
          : `<button id="btn-up-pool" class="btn btn-emerald">Améliorer Niv.${state.poolLevel + 1} (${fmt(costH)} 🍯 + ${fmt(costR)} 💎)</button>`
        }
        <button id="btn-sim-coma" class="btn btn-outline">🧪 Tester : Mettre 80 Soldates en Coma</button>
      </div>
    </div>
  `, "pool");

  const upBtn = document.getElementById("btn-up-pool");
  if (upBtn) {
    upBtn.onclick = () => {
      if (state.honey < costH || state.resin < costR) return toast("❌ Pas assez de Miellat ou Résine !");
      state.honey -= costH;
      state.resin -= costR;
      state.poolLevel++;
      toast(`💚 Bassin de Soin amélioré au Niveau ${state.poolLevel} !`);
      renderPoolModal();
      updateHUD();
    };
  }
  document.getElementById("btn-sim-coma").onclick = () => {
    const amt = Math.min(80, Math.floor(state.soldiers));
    if (amt <= 0) return toast("Aucune soldate disponible !");
    state.soldiers -= amt;
    state.coma += amt;
    toast(`💤 ${amt} Soldates placées dans le Bassin de Soin !`);
    renderPoolModal();
    updateHUD();
  };
}

/* ================= 4. LABO D'ÉVOLUTION & ÉVEIL (ZÉRO RUNE) ================= */
function openLabModal(selectedUid = null) {
  if (state.roster.length === 0) {
    return openModal("🧪 Laboratoire d'Évolution & Éveil ★", `
      <div class="card">
        <h3>Aucune Soldate d'Élite invoquée</h3>
        <p>Ouvre d'abord un Cocon dans la <strong>🔮 Couveuse Mystique</strong> pour entraîner et éveiller tes fourmis ici.</p>
        <button class="btn btn-purple" onclick="openHatcheryModal()">Aller à la Couveuse</button>
      </div>
    `, "lab");
  }
  const ant = state.roster.find(a => a.uid === selectedUid) || state.roster[0];
  const info = getAntStats(ant);
  const maxLvl = ant.stars * 10;
  const lvlCost = ant.level * 180;
  const evolveCostH = ant.stars * 1200;
  const evolveCostR = ant.stars * 600;
  const awakeCostH = ant.stars * 1500;
  const awakeCostR = ant.stars * 900;

  openModal("🧪 Laboratoire d'Évolution & Éveil ★ (Sans Runes)", `
    <div class="grid-2">
      <div class="card">
        <h3>Mes Soldates d'Élite (${state.roster.length})</h3>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;">
          ${state.roster.map(a => {
            const st = getAntStats(a);
            const active = a.uid === ant.uid ? "border-color:var(--amber);background:rgba(245,185,66,0.14);" : "";
            return `
              <button class="btn btn-wood" style="justify-content:space-between;${active}" onclick="openLabModal('${a.uid}')">
                <span>${st.caste.icon} ${escapeHtml(st.displayName)} <small>Niv.${a.level}</small></span>
                <span>${renderStars(a.stars, a.awakened)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;">
          ${buildAntSVG(ant, false)}
          <div>
            <h3>${info.caste.icon} ${escapeHtml(info.displayName)}</h3>
            <div>${renderStars(ant.stars, ant.awakened)} • Niv. ${ant.level}/${maxLvl}</div>
            <small style="color:var(--text-muted)">Compétence : <strong>${info.tpl.skill}</strong></small>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-pill">❤️ PV : <strong>${info.hp}</strong></span>
          <span class="stat-pill">⚔️ ATQ : <strong>${info.atk}</strong></span>
          <span class="stat-pill">🛡️ DÉF : <strong>${info.def}</strong></span>
          <span class="stat-pill">⚡ Puissance : <strong>${info.power}</strong></span>
        </div>

        <button id="btn-lab-lvl" class="btn btn-gold" ${ant.level >= maxLvl ? "disabled" : ""}>
          ${ant.level >= maxLvl ? "Niveau MAX atteint pour ce rang ★" : `⬆️ Niveau +1 (${fmt(lvlCost)} 🍯)`}
        </button>

        <button id="btn-lab-star" class="btn btn-emerald" ${ant.stars >= 6 ? "disabled" : ""}>
          ${ant.stars >= 6 ? "✨ Rang 6★ MAX" : `⭐ Évoluer en ${ant.stars + 1}★ (${fmt(evolveCostH)} 🍯 + ${fmt(evolveCostR)} 💎)`}
        </button>

        <button id="btn-lab-awake" class="btn btn-purple" ${ant.awakened ? "disabled" : ""}>
          ${ant.awakened ? "🟣 Déjà Éveillée (+25% Stats)" : `🟣 Éveil Phéromonal (+25% Stats & Aura — ${fmt(awakeCostH)} 🍯 + ${fmt(awakeCostR)} 💎)`}
        </button>
      </div>
    </div>
  `, "lab");

  document.getElementById("btn-lab-lvl").onclick = () => {
    if (state.honey < lvlCost) return toast("❌ Pas assez de Miellat !");
    state.honey -= lvlCost;
    ant.level++;
    toast(`⬆️ ${info.displayName} passe Niveau ${ant.level} !`);
    openLabModal(ant.uid);
    updateHUD();
  };
  document.getElementById("btn-lab-star").onclick = () => {
    if (state.honey < evolveCostH || state.resin < evolveCostR) return toast("❌ Ressources insuffisantes !");
    state.honey -= evolveCostH;
    state.resin -= evolveCostR;
    ant.stars++;
    toast(`⭐ Évolution réussie : ${info.displayName} est maintenant ${ant.stars}★ !`);
    syncGalleryAnts();
    openLabModal(ant.uid);
    updateHUD();
  };
  document.getElementById("btn-lab-awake").onclick = () => {
    if (state.honey < awakeCostH || state.resin < awakeCostR) return toast("❌ Ressources insuffisantes !");
    state.honey -= awakeCostH;
    state.resin -= awakeCostR;
    ant.awakened = true;
    toast(`🟣 ÉVEIL PHÉROMONAL ! Nouveau nom héroïque : ${info.tpl.awakenedName} !`);
    syncGalleryAnts();
    openLabModal(ant.uid);
    updateHUD();
  };
}

/* ================= 5. ÉLEVAGE DE PUCERONS (SACRIFICE OUVRIÈRES -> XP SOLDATES) ================= */
function openAphidsModal() {
  if (!state.buildings.aphids) {
    return openModal("🌿 Élevage de Pucerons (Non construit)", `
      <div class="card">
        <h3>Bâtiment à acheter dans le Village</h3>
        <p>Achète l'<strong>Élevage de Pucerons</strong> auprès de la boutique <strong>🏪 Architecte Royal</strong> pour sacrifier des Ouvrières et faire monter le niveau de tes Soldates Classiques !</p>
        <button class="btn btn-gold" onclick="openShopArchModal()">Aller chez l'Architecte Royal</button>
      </div>
    `, "aphids");
  }
  const xpNeeded = state.soldierLevel * 400;
  const pct = Math.min(100, Math.round((state.soldierXp / xpNeeded) * 100));

  openModal("🌿 Élevage de Pucerons — XP des Soldates Classiques", `
    <div class="card">
      <h3>Sacrifier des Ouvrières pour entraîner tes Soldates</h3>
      <p>Les pucerons produisent de l'XP Royale lorsque tu y affectes (sacrifies) des <strong>Ouvrières</strong>. Cela booste durablement les PV, l'ATQ et la DÉF de toutes tes <strong>Soldates Classiques</strong> (+18% par niveau).</p>
      <div class="stat-row">
        <span class="stat-pill">Soldates Classiques : <strong>Niv. ${state.soldierLevel}</strong></span>
        <span class="stat-pill">Puissance d'Armée : <strong>${fmt(getSoldierPower())} ⚡</strong></span>
        <span class="stat-pill">XP : <strong>${state.soldierXp} / ${xpNeeded}</strong></span>
      </div>
      <div class="progress-track"><div class="progress-fill gold" style="width:${pct}%"></div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
        <button class="btn btn-emerald" onclick="sacrificeWorkers(100)">Sacrifier 100 🐜 (+160 XP)</button>
        <button class="btn btn-gold" onclick="sacrificeWorkers(500)">Sacrifier 500 🐜 (+850 XP)</button>
      </div>
    </div>
  `, "aphids");
}

function sacrificeWorkers(amount) {
  if (state.workers < amount) return toast("❌ Pas assez d'Ouvrières !");
  state.workers -= amount;
  state.soldierXp += amount === 500 ? 850 : 160;
  while (state.soldierXp >= state.soldierLevel * 400) {
    state.soldierXp -= state.soldierLevel * 400;
    state.soldierLevel++;
    toast(`⚔️ Tes Soldates Classiques passent au Niveau ${state.soldierLevel} (+18% stats) !`);
  }
  openAphidsModal();
  updateHUD();
}

/* ================= 6. SANCTUAIRE DE FUSION 5★ HYBRIDE ================= */
function openFusionModal() {
  if (!state.buildings.fusion) {
    return openModal("🧬 Sanctuaire de Fusion 5★ (Non construit)", `
      <div class="card">
        <h3>Bâtiment à acheter chez l'Architecte Royal</h3>
        <p>Construis le <strong>Sanctuaire de Fusion 5★</strong> pour combiner des <strong>Fourmis Classiques (Ouvrières + Soldates)</strong> avec des <strong>Élites 3★ et 4★</strong> afin de créer gratuitement des 5★ Natifs !</p>
        <button class="btn btn-gold" onclick="openShopArchModal()">Aller chez l'Architecte Royal</button>
      </div>
    `, "fusion");
  }
  const has3 = state.roster.find(a => a.stars === 3);
  const has4 = state.roster.find(a => a.stars === 4);
  const recipes = [
    { targetId: "c5_titan",  workers: 500, soldiers: 350, honey: 2500 },
    { targetId: "v5_tisse",  workers: 500, soldiers: 350, honey: 2500 },
    { targetId: "s5_archon", workers: 800, soldiers: 600, honey: 4000 },
  ];

  openModal("🧬 Sanctuaire de Fusion 5★ (100% Free-to-Play)", `
    <p style="color:var(--text-muted);font-size:0.88rem;">Combine ta masse de Fourmis Classiques + 1 Élite 3★ + 1 Élite 4★ pour forger un <strong>5★ Natif garanti</strong>.</p>
    <div class="grid-3">
      ${recipes.map(r => {
        const tpl = getAntTemplate(r.targetId);
        const c = CASTES[tpl.caste];
        const ok = state.workers >= r.workers && state.soldiers >= r.soldiers && state.honey >= r.honey && has3 && has4;
        return `
          <div class="card">
            <h3>${c.icon} ${tpl.name} ⭐⭐⭐⭐⭐</h3>
            <p>Compétence : <strong>${tpl.skill}</strong></p>
            <small>• ${r.workers} 🐜 Ouvrières<br>• ${r.soldiers} ⚔️ Soldates Classiques<br>• 1× Élite 3★ (${has3 ? "✅" : "❌"})<br>• 1× Élite 4★ (${has4 ? "✅" : "❌"})<br>• ${fmt(r.honey)} 🍯 Miellat</small>
            <button class="btn btn-purple" ${ok ? "" : "disabled"} onclick="doFusion('${r.targetId}',${r.workers},${r.soldiers},${r.honey})">Fusionner ce 5★</button>
          </div>
        `;
      }).join("")}
    </div>
  `, "fusion");
}

function doFusion(targetId, wCost, sCost, hCost) {
  const idx3 = state.roster.findIndex(a => a.stars === 3);
  const idx4 = state.roster.findIndex(a => a.stars === 4);
  if (idx3 < 0 || idx4 < 0 || state.workers < wCost || state.soldiers < sCost || state.honey < hCost) {
    return toast("❌ Ingrédients manquants !");
  }
  state.workers -= wCost;
  state.soldiers -= sCost;
  state.honey -= hCost;
  // Retirer les deux matériaux en ordre décroissant d'index
  const removeIds = new Set([state.roster[idx3].uid, state.roster[idx4].uid]);
  state.roster = state.roster.filter(a => !removeIds.has(a.uid));

  const fused = {
    uid: `ant_${Date.now()}_fus`,
    templateId: targetId,
    stars: 5,
    level: 1,
    awakened: false,
  };
  state.roster.push(fused);
  closeModal();
  playSummonCinematic([fused]);
}

/* ================= 7. LES 3 BOUTIQUES DU VILLAGE ================= */
function openShopArchModal() {
  openModal("🏪 Architecte Royal — Boutique de Bâtiments du Village", `
    <div class="grid-2">
      <div class="card">
        <h3>🌿 Élevage de Pucerons</h3>
        <p>Permet de sacrifier des Ouvrières pour monter le Niveau de tes Soldates Classiques.</p>
        ${state.buildings.aphids
          ? `<button class="btn btn-emerald" disabled>✅ Construit dans la fourmilière</button>`
          : `<button class="btn btn-gold" onclick="buyBuilding('aphids',1200,600)">Construire (1 200 🍯 + 600 💎)</button>`}
      </div>
      <div class="card">
        <h3>🧬 Sanctuaire de Fusion 5★</h3>
        <p>Fusionne Fourmis Classiques + Élites 3★ et 4★ pour créer des 5★ Natifs gratuitement.</p>
        ${state.buildings.fusion
          ? `<button class="btn btn-emerald" disabled>✅ Construit dans la fourmilière</button>`
          : `<button class="btn btn-gold" onclick="buyBuilding('fusion',2000,1000)">Construire (2 000 🍯 + 1 000 💎)</button>`}
      </div>
    </div>
  `, "shop-arch");
}

function buyBuilding(key, h, r) {
  if (state.honey < h || state.resin < r) return toast("❌ Pas assez de Miellat ou Résine !");
  state.honey -= h;
  state.resin -= r;
  state.buildings[key] = true;
  toast("🏗️ Nouveau bâtiment construit dans ta fourmilière !");
  openShopArchModal();
  updateHUD();
}

function openShopMarketModal() {
  openModal("🛒 Marché du Scarabée d'Or — Boutique de Cocons", `
    <div class="grid-3">
      <div class="card">
        <h3>🔮 Cocon Mystique</h3>
        <p>Invoque une Soldate d'Élite 3★ à 5★.</p>
        <button class="btn btn-purple" onclick="buyMarketItem('mystique',1400,0)">Acheter (1 400 🍯)</button>
      </div>
      <div class="card">
        <h3>🔵 Cocon Carapace</h3>
        <p>Cible uniquement la caste Carapace.</p>
        <button class="btn btn-wood" onclick="buyMarketItem('carapace',1100,450)">Acheter (1 100 🍯 + 450 💎)</button>
      </div>
      <div class="card">
        <h3>🟢 Cocon Venin</h3>
        <p>Cible uniquement la caste Venin.</p>
        <button class="btn btn-wood" onclick="buyMarketItem('venin',1100,450)">Acheter (1 100 🍯 + 450 💎)</button>
      </div>
      <div class="card">
        <h3>🔴 Cocon Acide</h3>
        <p>Cible uniquement la caste Acide.</p>
        <button class="btn btn-wood" onclick="buyMarketItem('acide',1100,450)">Acheter (1 100 🍯 + 450 💎)</button>
      </div>
      <div class="card">
        <h3>☯️ Cocon Solaire/Abysse</h3>
        <p>Cocon rare Light & Dark !</p>
        <button class="btn btn-gold" onclick="buyMarketItem('ld',3800,1800)">Acheter (3 800 🍯 + 1 800 💎)</button>
      </div>
    </div>
  `, "shop-market");
}

function buyMarketItem(type, h, r) {
  if (state.honey < h || state.resin < r) return toast("❌ Pas assez de ressources !");
  state.honey -= h;
  state.resin -= r;
  if (type === "mystique") state.cocoons++;
  else if (type === "ld") state.ldCocoons++;
  else state.elemCocoons[type] = (state.elemCocoons[type] || 0) + 1;
  toast("🛒 Cocon acheté ! Va l'ouvrir dans la Couveuse Mystique !");
  updateHUD();
}

function openShopGloryModal() {
  const passTiers = [
    { lvl: 1, pts: 20,  reward: "1 🔮 Cocon Mystique", fn: () => state.cocoons++ },
    { lvl: 2, pts: 50,  reward: "1 500 🍯 + 800 💎",   fn: () => { state.honey += 1500; state.resin += 800; } },
    { lvl: 3, pts: 90,  reward: "2 🔮 Cocons Mystiques", fn: () => state.cocoons += 2 },
    { lvl: 4, pts: 140, reward: "1 ☯️ Cocon Solaire/Abysse", fn: () => state.ldCocoons++ },
  ];

  openModal("🏅 Échoppe de Gloire PvP & Passe de Saison (Pay-to-Fast)", `
    <div class="grid-2">
      <div class="card">
        <h3>🏅 Boutique de Gloire (${state.medals} Médailles)</h3>
        <p>Échange tes médailles gagnées sur le Chemin PvP :</p>
        <button class="btn btn-purple" onclick="buyGlory('mystique',50)">🔮 Cocon Mystique (50 🏅)</button>
        <button class="btn btn-gold" onclick="buyGlory('ld',140)">☯️ Cocon Solaire/Abysse (140 🏅)</button>
        <button class="btn btn-emerald" onclick="buyGlory('honey',35)">🍯 +2 000 Miellat (35 🏅)</button>
      </div>
      <div class="card">
        <h3>🎟️ Passe de Saison Éthique (${state.passPoints} pts)</h3>
        <p>Zéro stat exclusive payante ! Progresse en invoquant et en combattant.</p>
        ${passTiers.map(t => {
          const claimed = state.passClaimed.includes(t.lvl);
          const ready = state.passPoints >= t.pts && !claimed;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
              <span>Palier ${t.lvl} (${t.pts} pts) : <strong>${t.reward}</strong></span>
              <button class="btn btn-sm ${ready ? "btn-gold" : "btn-wood"}" ${ready ? "" : "disabled"} onclick="claimPass(${t.lvl})">
                ${claimed ? "✅ Pris" : ready ? "Réclamer" : "Verrouillé"}
              </button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `, "shop-glory");
}

function buyGlory(type, cost) {
  if (state.medals < cost) return toast("❌ Pas assez de Médailles de Gloire PvP !");
  state.medals -= cost;
  if (type === "mystique") state.cocoons++;
  if (type === "ld") state.ldCocoons++;
  if (type === "honey") state.honey += 2000;
  toast("🏅 Récompense de Gloire obtenue !");
  openShopGloryModal();
  updateHUD();
}

function claimPass(lvl) {
  if (state.passClaimed.includes(lvl)) return;
  state.passClaimed.push(lvl);
  if (lvl === 1) state.cocoons++;
  if (lvl === 2) { state.honey += 1500; state.resin += 800; }
  if (lvl === 3) state.cocoons += 2;
  if (lvl === 4) state.ldCocoons++;
  toast(`🎟️ Récompense du Palier ${lvl} récupérée !`);
  openShopGloryModal();
  updateHUD();
}

/* ================= 8. S'AVENTURER DEHORS (PVE 12 ÉTAPES + PVP 8 BASTIONS + BOSS HUMAIN) ================= */
function openOutsideModal(tab = "pve") {
  const tabsHtml = `
    <div class="sub-tabs">
      <button class="sub-tab ${tab === "pve" ? "active" : ""}" onclick="openOutsideModal('pve')">🗺️ Chemin PvE (12 Étapes • Élites)</button>
      <button class="sub-tab ${tab === "pvp" ? "active" : ""}" onclick="openOutsideModal('pvp')">⚔️ Chemin PvP (8 Bastions)</button>
      <button class="sub-tab ${tab === "boss" ? "active" : ""}" onclick="openOutsideModal('boss')">🥾 Boss Final : L'HUMAIN</button>
    </div>
  `;

  if (tab === "pve") {
    const team = getTopElites(3);
    const teamPower = team.reduce((s, a) => s + getAntStats(a).power, 0);
    openModal("🌿 S'aventurer Dehors — Chemin PvE des Ennemis Naturels", `
      ${tabsHtml}
      <div class="card">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span>Escouade Élite Auto (Top 3) : <strong>${team.length ? team.map(a => getAntStats(a).displayName).join(", ") : "Aucune fourmi invoquée !"}</strong></span>
          <span>⚡ Puissance Élite : <strong>${fmt(teamPower)}</strong></span>
        </div>
        <p>Seules tes <strong>Soldates d'Élite</strong> peuvent explorer le Mode Histoire. Farme les étapes validées en <strong>⚡ x5</strong> pour obtenir des Éclats et Cocons Mystiques !</p>
      </div>
      <div class="path-grid">
        ${PVE_STAGES.map(st => {
          const unlocked = st.id <= state.pveCleared + 1;
          const cleared = st.id <= state.pveCleared;
          return `
            <div class="stage-node ${cleared ? "cleared" : ""} ${st.boss ? "boss-stage" : ""} ${unlocked ? "" : "locked"}">
              <div style="display:flex;justify-content:space-between;">
                <small style="color:var(--amber)">Étape ${st.id} • ${st.zone}</small>
                <span>${cleared ? "⭐⭐⭐" : unlocked ? "🔓" : "🔒"}</span>
              </div>
              <strong>${st.emoji} ${st.enemy}</strong>
              <small style="color:var(--text-muted)">Puissance : ${fmt(st.power)} • +${st.shards} 🧩 • +${st.honey} 🍯</small>
              <div style="display:flex;gap:6px;margin-top:4px;">
                <button class="btn btn-sm btn-gold" ${unlocked && team.length ? "" : "disabled"} onclick="startPveBattle(${st.id})">⚔️ Combattre</button>
                ${cleared ? `<button class="btn btn-sm btn-purple" onclick="multiFarmPve(${st.id})">⚡ Farm x5</button>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `, "outside-pve");
  }

  else if (tab === "pvp") {
    const elitePow = getTopElites(4).reduce((s, a) => s + getAntStats(a).power, 0);
    const totalPow = getSoldierPower() + elitePow;
    openModal("🌿 S'aventurer Dehors — Chemin PvP (Conquête de Territoire)", `
      ${tabsHtml}
      <div class="card">
        <div class="stat-row">
          <span class="stat-pill">⚔️ Soldates Classiques : <strong>${fmt(getSoldierPower())}</strong></span>
          <span class="stat-pill">🔮 Top 4 Élites : <strong>${fmt(elitePow)}</strong></span>
          <span class="stat-pill">🔥 Force Totale Guerre : <strong>${fmt(totalPow)}</strong></span>
        </div>
        <p>En PvP, toute ton armée attaque ! <strong>Victoire :</strong> Terrain (+cm²), Médailles de Gloire & Éclats. <strong>Défaite :</strong> tes soldates partent dans le Coma (Bassin de Soin) + Impact de Guerre (-15% prod pendant 60s).</p>
      </div>
      <div class="path-grid">
        ${PVP_BASTIONS.map(b => {
          const unlocked = b.id <= state.pvpCleared + 1;
          const cleared = b.id <= state.pvpCleared;
          return `
            <div class="stage-node ${cleared ? "cleared" : ""} ${unlocked ? "" : "locked"}">
              <small style="color:var(--amber)">${b.rank} ${cleared ? "✅" : ""}</small>
              <strong>🏰 ${b.name}</strong>
              <small style="color:var(--text-muted)">Force : ${fmt(b.power)}<br>Butin : +${b.terrain} cm² • +${b.medals} 🏅</small>
              <button class="btn btn-sm btn-crimson" ${unlocked ? "" : "disabled"} onclick="attackPvpBastion(${b.id})">⚔️ Lancer la Guerre</button>
            </div>
          `;
        }).join("")}
      </div>
    `, "outside-pvp");
  }

  else if (tab === "boss") {
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = state.dailyBossDate === today;
    const allElitesPower = state.roster.reduce((s, a) => s + getAntStats(a).power, 0);
    const totalArmy = getSoldierPower() + allElitesPower;

    openModal("🥾 BOSS FINAL COMMUNAUTAIRE — L'HUMAIN", `
      ${tabsHtml}
      <div class="card" style="border-color:var(--crimson);background:rgba(60,12,12,0.45);">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:4.2rem;">🥾</div>
          <div style="flex:1;">
            <h3>LE COLOSSE EXTERMINATEUR (Événement Connexion Journalière)</h3>
            <p>Comme le World Boss de Summoners War, toute la communauté envoie <strong>TOUTES ses troupes</strong> (Soldates Classiques + toutes les Soldates d'Élite) pendant un assaut éclair de 4 secondes !</p>
            <div style="margin:8px 0;">
              <small>PV Mondiaux de la Communauté : <strong>${state.worldBossCommunityHp}%</strong></small>
              <div class="progress-track"><div class="progress-fill crimson" style="width:${state.worldBossCommunityHp}%"></div></div>
            </div>
            <div class="stat-row">
              <span class="stat-pill">Ton Armée Totale : <strong>${fmt(totalArmy)} ⚡</strong></span>
              <span class="stat-pill">Connexion du jour : <strong>${doneToday ? "✅ Coffre récupéré" : "🎁 Disponible !"}</strong></span>
            </div>
          </div>
        </div>
        <div id="boss-live-area" style="margin-top:10px;">
          <button id="btn-run-boss" class="btn btn-crimson btn-lg" ${doneToday ? "disabled" : ""}>
            ${doneToday ? "✅ Assaut quotidien effectué — Reviens demain !" : "🔥 LANCER L'ASSAUT MONDIAL (TOUTES MES TROUPES) !"}
          </button>
        </div>
      </div>
    `, "outside-boss");

    const btn = document.getElementById("btn-run-boss");
    if (btn && !doneToday) {
      btn.onclick = () => runHumanBossAssault(totalArmy, today);
    }
  }
}

/* ================= COMBAT TOUR PAR TOUR PVE & MULTI-FARM ================= */
function startPveBattle(stageId) {
  const stage = PVE_STAGES.find(s => s.id === stageId);
  const team = getTopElites(3);
  if (!team.length) return toast("❌ Invoque au moins 1 fourmi dans la Couveuse !");

  const stats = team.map(a => getAntStats(a));
  const maxPlayerHp = stats.reduce((s, st) => s + st.hp, 0);
  const totalAtk = stats.reduce((s, st) => s + st.atk, 0);
  const totalDef = stats.reduce((s, st) => s + st.def, 0);

  currentBattle = {
    stage,
    teamNames: stats.map(s => `${s.caste.icon}${s.displayName}`).join(" • "),
    pHp: maxPlayerHp,
    pMaxHp: maxPlayerHp,
    pAtk: totalAtk,
    pDef: totalDef,
    eHp: stage.hp,
    eMaxHp: stage.hp,
    eAtk: stage.atk,
    ultCharge: 0,
    logs: [`⚔️ Combat engagé contre ${stage.emoji} ${stage.enemy} !`],
    over: false,
  };
  renderBattleUI();
}

function renderBattleUI() {
  const b = currentBattle;
  if (!b) return;
  const pPct = Math.max(0, Math.round((b.pHp / b.pMaxHp) * 100));
  const ePct = Math.max(0, Math.round((b.eHp / b.eMaxHp) * 100));

  openModal(`⚔️ Combat PvE — Étape ${b.stage.id}`, `
    <div class="battle-arena">
      <div class="battle-sides">
        <div class="combatant">
          <strong>🐜 Ton Escouade Élite</strong>
          <div style="font-size:0.75rem;color:var(--text-muted);margin:3px 0;">${escapeHtml(b.teamNames)}</div>
          <div class="progress-track"><div class="progress-fill" style="width:${pPct}%"></div></div>
          <small>❤️ ${Math.max(0, b.pHp)} / ${b.pMaxHp} • Jauge Ultime : ${b.ultCharge}/2</small>
        </div>
        <div style="font-size:1.6rem;font-weight:900;color:var(--amber)">VS</div>
        <div class="combatant">
          <strong>${b.stage.emoji} ${b.stage.enemy}</strong>
          <div style="font-size:0.75rem;color:var(--text-muted);margin:3px 0;">${b.stage.zone}</div>
          <div class="progress-track"><div class="progress-fill crimson" style="width:${ePct}%"></div></div>
          <small>❤️ ${Math.max(0, b.eHp)} / ${b.eMaxHp}</small>
        </div>
      </div>

      <div class="battle-log">${b.logs.slice(-6).map(l => `<div>${l}</div>`).join("")}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        ${b.over
          ? `<button class="btn btn-gold" onclick="openOutsideModal('pve')">Retour au Chemin PvE</button>`
          : `
            <button class="btn btn-gold" onclick="battleTurn('s1')">⚔️ S1 : Assaut Rapide</button>
            <button class="btn btn-purple" ${b.ultCharge >= 2 ? "" : "disabled"} onclick="battleTurn('s2')">⚡ S2 : Compétence Ultime</button>
            <button class="btn btn-emerald" onclick="battleAutoFinish()">🤖 Auto-Combat</button>
          `
        }
      </div>
    </div>
  `, "battle");
}

function battleTurn(skill) {
  const b = currentBattle;
  if (!b || b.over) return;
  const dmg = skill === "s2"
    ? Math.round(b.pAtk * (1.85 + Math.random() * 0.25))
    : Math.round(b.pAtk * (0.95 + Math.random() * 0.2));

  b.eHp -= dmg;
  if (skill === "s2") {
    b.ultCharge = 0;
    b.logs.push(`⚡ Compétence Ultime ! Ton escouade inflige <strong>${dmg}</strong> dégâts !`);
  } else {
    b.ultCharge = Math.min(2, b.ultCharge + 1);
    b.logs.push(`⚔️ Assaut Rapide inflige <strong>${dmg}</strong> dégâts.`);
  }

  if (b.eHp <= 0) {
    b.over = true;
    const droppedCocoon = Math.random() < b.stage.cocoonChance;
    state.pveCleared = Math.max(state.pveCleared, b.stage.id);
    state.honey += b.stage.honey;
    addShards(b.stage.shards);
    state.passPoints += 12;
    if (droppedCocoon) state.cocoons += 1;
    b.logs.push(`🏆 VICTOIRE ! +${b.stage.honey} 🍯, +${b.stage.shards} 🧩${droppedCocoon ? ", +1 🔮 COCON MYSTIQUE !" : ""}`);
    toast(`🏆 Étape ${b.stage.id} remportée !`);
    updateHUD();
    saveState();
    return renderBattleUI();
  }

  // Riposte ennemie réduite par la DÉF
  const eDmg = Math.max(30, Math.round(b.eAtk * (0.9 + Math.random() * 0.25) - b.pDef * 0.18));
  b.pHp -= eDmg;
  b.logs.push(`${b.stage.emoji} ${b.stage.enemy} riposte et inflige ${eDmg} dégâts.`);

  if (b.pHp <= 0) {
    b.over = true;
    b.logs.push(`💤 Défaite ! Améliore tes Soldates d'Élite dans le 🧪 Laboratoire (zéro perte définitive).`);
  }
  renderBattleUI();
}

function battleAutoFinish() {
  let guard = 0;
  while (currentBattle && !currentBattle.over && guard++ < 40) {
    battleTurn(currentBattle.ultCharge >= 2 ? "s2" : "s1");
  }
}

function multiFarmPve(stageId) {
  const st = PVE_STAGES.find(s => s.id === stageId);
  let totalShards = 0, totalHoney = 0, cocoons = 0;
  for (let i = 0; i < 5; i++) {
    totalShards += st.shards;
    totalHoney += st.honey;
    if (Math.random() < st.cocoonChance) cocoons++;
  }
  state.honey += totalHoney;
  state.cocoons += cocoons;
  addShards(totalShards);
  state.passPoints += 15;
  toast(`⚡ Multi-Farm x5 (${st.enemy}) : +${fmt(totalHoney)} 🍯, +${totalShards} 🧩${cocoons ? `, +${cocoons} 🔮 Cocons !` : ""}`);
  updateHUD();
  saveState();
}

/* ================= GUERRE PVP & BOSS FINAL HUMAIN ================= */
function attackPvpBastion(id) {
  const b = PVP_BASTIONS.find(x => x.id === id);
  const elitePow = getTopElites(4).reduce((s, a) => s + getAntStats(a).power, 0);
  const myPow = getSoldierPower() + elitePow;

  if (myPow >= b.power * 0.92) {
    state.pvpCleared = Math.max(state.pvpCleared, b.id);
    state.terrain += b.terrain;
    state.medals += b.medals;
    addShards(b.shards);
    state.passPoints += 18;
    const minorComa = Math.min(Math.floor(state.soldiers * 0.08), 35);
    state.soldiers -= minorComa;
    state.coma += minorComa;
    toast(`🏆 Bastion ${b.name} conquis ! +${b.terrain} cm², +${b.medals} 🏅 (${minorComa} soldates au Bassin de Soin).`);
  } else {
    const heavyComa = Math.floor(state.soldiers * 0.35);
    state.soldiers -= heavyComa;
    state.coma += heavyComa;
    state.warDebuffUntil = Date.now() + 60000;
    toast(`💥 Défaite face à ${b.name} ! ${heavyComa} Soldates en Coma + Impact de Guerre (60s).`);
  }
  updateHUD();
  openOutsideModal("pvp");
}

function runHumanBossAssault(totalArmy, today) {
  const area = document.getElementById("boss-live-area");
  let ticks = 0;
  let totalDmg = 0;
  area.innerHTML = `
    <div class="card" style="text-align:center;">
      <strong style="color:var(--amber);">🔥 ASSAUT EN COURS — TOUTES LES FOURMIS CHARGENT L'HUMAIN !</strong>
      <div id="boss-dmg-counter" style="font-size:2rem;font-weight:900;color:#fca5a5;">0 DÉGÂTS</div>
    </div>
  `;
  const timer = setInterval(() => {
    ticks++;
    totalDmg += Math.round((totalArmy * (0.35 + Math.random() * 0.25)) + 300);
    const el = document.getElementById("boss-dmg-counter");
    if (el) el.textContent = `${fmt(totalDmg)} DÉGÂTS`;
    if (ticks >= 12) {
      clearInterval(timer);
      const rank = totalDmg > 35000 ? "SSS" : totalDmg > 18000 ? "SS" : totalDmg > 8000 ? "S" : "A";
      const bonusCocoons = rank === "SSS" ? 2 : 1;
      const bonusHoney = rank === "SSS" ? 3000 : rank === "SS" ? 2000 : 1200;
      state.dailyBossDate = today;
      state.cocoons += bonusCocoons;
      state.honey += bonusHoney;
      state.medals += 40;
      state.worldBossCommunityHp = Math.max(1, state.worldBossCommunityHp - 2);
      state.passPoints += 25;
      toast(`🥾 Rang ${rank} contre l'Humain ! Coffre Quotidien : +${bonusCocoons} 🔮, +${fmt(bonusHoney)} 🍯, +40 🏅 !`);
      updateHUD();
      saveState();
      openOutsideModal("boss");
    }
  }, 280);
}

/* ================= COMPTE & SÉCURITÉ SQL ================= */
function openAccountModal() {
  openModal(`🛡️ Compte « ${state.username} » & Sécurité SQL`, `
    <div class="grid-2">
      <div class="card">
        <h3>Gestion du Compte</h3>
        <p>Ta colonie est sauvegardée localement (mot de passe haché SHA-256). Tu peux vider les galeries pour tester l'apparition progressive de tes invocations ou changer de compte.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-wood" onclick="clearGalleryTest()">🧹 Vider les galeries (0 fourmi)</button>
          <button class="btn btn-crimson" onclick="logoutAccount()">🚪 Déconnexion</button>
        </div>
      </div>
      <div class="card">
        <h3>Architecture Anti-Triche Serveur</h3>
        <p>Pour la mise en ligne : utilise le fichier <strong>schema.sql</strong> fourni avec PostgreSQL (<code>SELECT ... FOR UPDATE</code>) + tirage <code>crypto.randomInt()</code> côté serveur Node.js.</p>
        <button class="btn btn-outline" onclick="exportSaveJson()">💾 Exporter ma sauvegarde JSON</button>
      </div>
    </div>
  `, "account");
}

function clearGalleryTest() {
  state.roster = [];
  syncGalleryAnts();
  toast("🧹 Galeries vidées : ouvre un Cocon dans la Couveuse pour voir tes nouvelles fourmis apparaître !");
  closeModal();
}

function exportSaveJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `myrmidon_${state.username}.json`;
  a.click();
}

function logoutAccount() {
  localStorage.removeItem(STORAGE_SESSION_KEY);
  closeModal();
  currentUser = null;
  state = null;
  document.getElementById("auth-overlay").classList.remove("hidden");
}

/* ================= TUTORIEL GUIDÉ ================= */
function startTutorial() {
  tutoIndex = 0;
  document.getElementById("tuto-overlay").classList.remove("hidden");
  renderTutoStep();
}

function renderTutoStep() {
  const step = TUTORIAL_STEPS[tutoIndex];
  document.getElementById("tuto-title").textContent = step.title;
  document.getElementById("tuto-text").textContent = step.text;
  document.getElementById("tuto-step").textContent = `Étape ${tutoIndex + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById("tuto-next").textContent = tutoIndex === TUTORIAL_STEPS.length - 1 ? "🌿 S'aventurer Dehors !" : "Suivant →";
}

/* ================= AUTHENTIFICATION & DÉMARRAGE ================= */
function enterGame(username, loadedState) {
  currentUser = username;
  state = loadedState;
  localStorage.setItem(STORAGE_SESSION_KEY, username);
  document.getElementById("auth-overlay").classList.add("hidden");
  syncGalleryAnts();
  updateHUD();
  if (!state.tutoDone) startTutorial();
}

function initAuth() {
  // Onglets Inscription / Connexion
  document.querySelectorAll("[data-auth-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-auth-tab]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const isReg = btn.dataset.authTab === "register";
      document.getElementById("form-register").classList.toggle("hidden", !isReg);
      document.getElementById("form-login").classList.toggle("hidden", isReg);
      document.getElementById("auth-error").classList.add("hidden");
    });
  });

  // Jauge mot de passe
  document.getElementById("reg-pass").addEventListener("input", (e) => {
    const v = e.target.value;
    let score = 0;
    if (v.length >= 6) score += 35;
    if (/[A-Z]/.test(v)) score += 20;
    if (/[0-9]/.test(v)) score += 25;
    if (/[^A-Za-z0-9]/.test(v)) score += 20;
    const bar = document.getElementById("pwd-bar");
    bar.style.width = `${score}%`;
    bar.style.background = score >= 75 ? "#34d399" : score >= 45 ? "#f59e0b" : "#ef4444";
  });

  // Soumission Inscription
  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = document.getElementById("reg-user").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-pass").value;
    const err = document.getElementById("auth-error");
    const accounts = loadAccounts();

    if (accounts[user]) {
      err.textContent = "Ce nom de colonie existe déjà !";
      return err.classList.remove("hidden");
    }
    const hash = await hashPassword(pass, user);
    const freshState = createDefaultState(user);
    accounts[user] = { email, hash, state: freshState };
    saveAccounts(accounts);
    toast(`🎁 Colonie « ${escapeHtml(user)} » fondée ! Pack Fondateur reçu !`);
    enterGame(user, freshState);
  });

  // Soumission Connexion
  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = document.getElementById("log-user").value.trim();
    const pass = document.getElementById("log-pass").value;
    const err = document.getElementById("auth-error");
    const accounts = loadAccounts();

    if (!accounts[user]) {
      err.textContent = "Colonie introuvable.";
      return err.classList.remove("hidden");
    }
    const hash = await hashPassword(pass, user);
    if (hash !== accounts[user].hash) {
      err.textContent = "Mot de passe incorrect.";
      return err.classList.remove("hidden");
    }
    toast(`🐜 Bon retour dans ta fourmilière, ${escapeHtml(user)} !`);
    enterGame(user, accounts[user].state);
  });

  // Démo rapide en 1 clic
  document.getElementById("btn-demo-login").addEventListener("click", () => {
    const accounts = loadAccounts();
    const demoUser = "CommandantDemo";
    if (!accounts[demoUser]) {
      const s = createDefaultState(demoUser);
      // 2 fourmis déjà invoquées pour admirer les galeries tout de suite
      s.roster.push(
        { uid: "demo_1", templateId: "c5_titan", stars: 5, level: 5, awakened: false },
        { uid: "demo_2", templateId: "v4_guepe", stars: 4, level: 4, awakened: true }
      );
      accounts[demoUser] = { email: "demo@myrmidon.gg", hash: "demo", state: s };
      saveAccounts(accounts);
    }
    toast("⚡ Mode Démo chargé ! Ouvre encore des Cocons pour peupler tes galeries !");
    enterGame(demoUser, accounts[demoUser].state);
  });

  // Reconnexion automatique si session existante
  const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
  const accounts = loadAccounts();
  if (savedSession && accounts[savedSession]) {
    enterGame(savedSession, accounts[savedSession].state);
  }
}

/* ================= BRANCHEMENT DES ÉVÉNEMENTS ================= */
function initEvents() {
  // Clic sur les salles & boutiques du Village
  document.querySelectorAll(".room-node").forEach(node => {
    node.addEventListener("click", () => {
      const r = node.dataset.room;
      if (r === "queen") openQueenModal();
      if (r === "hatchery") openHatcheryModal();
      if (r === "pool") renderPoolModal();
      if (r === "lab") openLabModal();
      if (r === "aphids") openAphidsModal();
      if (r === "fusion") openFusionModal();
      if (r === "shop-arch") openShopArchModal();
      if (r === "shop-market") openShopMarketModal();
      if (r === "shop-glory") openShopGloryModal();
      if (r === "outside") openOutsideModal("pve");
    });
  });

  // Boutons HUD & Docks
  document.getElementById("btn-quick-summon").onclick = openHatcheryModal;
  document.getElementById("btn-account").onclick = openAccountModal;
  document.getElementById("btn-open-boss").onclick = () => openOutsideModal("boss");
  document.getElementById("btn-open-tuto").onclick = startTutorial;
  document.getElementById("btn-direct-hatch").onclick = () => triggerSummon("mystique", 1);

  document.getElementById("btn-weather").onclick = () => {
    state.weatherIdx = (state.weatherIdx + 1) % WEATHERS.length;
    updateHUD();
  };

  document.getElementById("btn-test-pack").onclick = () => {
    state.cocoons += 5;
    state.ldCocoons += 1;
    state.honey += 4000;
    state.resin += 2000;
    state.medals += 80;
    toast("🧪 Pack Test reçu : +5 🔮, +1 ☯️, +4000 🍯, +2000 💎, +80 🏅 !");
    updateHUD();
  };

  // Modale & Cinématique
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });
  document.getElementById("cine-close").onclick = () => {
    document.getElementById("summon-cinematic").classList.add("hidden");
  };

  // Tutoriel
  document.getElementById("tuto-skip").onclick = () => {
    state.tutoDone = true;
    document.getElementById("tuto-overlay").classList.add("hidden");
    saveState();
  };
  document.getElementById("tuto-next").onclick = () => {
    if (tutoIndex < TUTORIAL_STEPS.length - 1) {
      tutoIndex++;
      renderTutoStep();
    } else {
      state.tutoDone = true;
      document.getElementById("tuto-overlay").classList.add("hidden");
      saveState();
      openOutsideModal("pve");
    }
  };
}

// Initialisation
window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initEvents();
  requestAnimationFrame(animateWalkers);
});
