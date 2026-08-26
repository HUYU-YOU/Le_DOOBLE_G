// =========================================================
// MOTEUR 3D - GESTION DU GLOBE ET DE L'ENVIRONNEMENT
// =========================================================

const container3D = document.getElementById('webgl-container');

window.gameScene = new THREE.Scene();
window.gameCamera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
window.gameCamera.position.set(0, 0, 15); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3D.clientWidth, container3D.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(window.gameCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6; 
controls.maxDistance = 30; 
controls.enablePan = false; // Désactive le glissement au clic droit

// On crée un "Groupe" pour attacher la Terre et l'Océan ensemble
window.planetGroup = new THREE.Group();
window.gameScene.add(window.planetGroup);

// --- 1. LA TERRE (Transparente pour les bords de la carte) ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, roughness: 0.6, metalness: 0.1, 
    transparent: true // Laisse passer le noyau océanique en dessous !
});
window.gameEarth = new THREE.Mesh(geometry, material);
window.planetGroup.add(window.gameEarth);

// --- 2. LE NOYAU OCÉANIQUE (Pour corriger le problème de Skin) ---
const oceanGeo = new THREE.SphereGeometry(4.98, 64, 64); // Légèrement plus petite
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x02b3e8, // Bleu Cyan pour se fondre avec ton océan
    roughness: 0.3, metalness: 0.2 
});
const oceanCore = new THREE.Mesh(oceanGeo, oceanMat);
window.planetGroup.add(oceanCore);

// --- CHARGEMENT DE LA CARTE ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
window.gameScene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(10, 10, 5);
window.gameScene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(window.gameScene, window.gameCamera);
}

window.resize3DEnvironment = function() {
    if(!container3D) return;
    window.gameCamera.aspect = container3D.clientWidth / container3D.clientHeight;
    window.gameCamera.updateProjectionMatrix();
    renderer.setSize(container3D.clientWidth, container3D.clientHeight);
}
window.addEventListener('resize', window.resize3DEnvironment);

// Sécurité pour aligner parfaitement le 3D avec les redimensionnements
const resizeObserver = new ResizeObserver(() => window.resize3DEnvironment());
resizeObserver.observe(container3D);

animate();
