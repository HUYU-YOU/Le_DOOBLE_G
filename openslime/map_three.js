// =========================================================
// MOTEUR 3D - GESTION DE LA CARTE ET DE L'ENVIRONNEMENT
// =========================================================

const container3D = document.getElementById('webgl-container');

window.gameScene = new THREE.Scene();
window.gameCamera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
window.gameCamera.position.set(0, 0, 16); // On recule la caméra pour voir toute la carte

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3D.clientWidth, container3D.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(window.gameCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5; 
controls.maxDistance = 25; 
controls.enablePan = false; // Désactive le glissement
controls.maxPolarAngle = Math.PI / 2 + 0.2; // T'empêche de regarder "sous" la table

// --- LA CARTE 2D PLATE (TABLE DE COMMANDEMENT) ---
const geometry = new THREE.PlaneGeometry(22, 12); // Ratio adapté à ton image !
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.8, 
    metalness: 0.1,
    transparent: true, // Laisse passer le ciel étoilé autour de ton ovale !
    side: THREE.DoubleSide // Visible même si tu tournes la caméra derrière
});
window.gameEarth = new THREE.Mesh(geometry, material); // On garde ce nom pour que l'IA fonctionne
window.gameScene.add(window.gameEarth);

// --- CHARGEMENT DE LA TEXTURE ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
});

// --- LUMIÈRES ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
window.gameScene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(0, 5, 10); // Lumière de face pour bien éclairer la carte
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
const resizeObserver = new ResizeObserver(() => window.resize3DEnvironment());
if(container3D) resizeObserver.observe(container3D);

animate();
