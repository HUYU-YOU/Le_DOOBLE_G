// =========================================================
// MOTEUR 3D - GESTION DU GLOBE ET DE L'ENVIRONNEMENT
// =========================================================

const container3D = document.getElementById('webgl-container');

window.gameScene = new THREE.Scene();
window.gameCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
window.gameCamera.position.set(0, 0, 15); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(window.gameCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6; 
controls.maxDistance = 30; 
controls.enablePan = false; // Désactive le glissement au clic droit

// --- LA TERRE ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.6, 
    metalness: 0.1
    // La transparence a été retirée. Si tu vois du noir, c'est qu'il faut peindre ton PNG en bleu !
});

window.gameEarth = new THREE.Mesh(geometry, material);
// Tourne la Terre pour que le centre de ta carte te regarde au début
window.gameEarth.rotation.y = -Math.PI / 2; 
window.gameScene.add(window.gameEarth);

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
    window.gameCamera.aspect = window.innerWidth / window.innerHeight;
    window.gameCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', window.resize3DEnvironment);
animate();
