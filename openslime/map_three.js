// =========================================================
// MOTEUR 3D - GESTION DU GLOBE
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

// --- LA TERRE EN SPHÈRE PARFAITE ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.6, 
    metalness: 0.1 
});
window.gameEarth = new THREE.Mesh(geometry, material);

// On tourne le globe pour que les beaux continents te regardent au démarrage
window.gameEarth.rotation.y = -Math.PI / 2; 
window.gameScene.add(window.gameEarth);

// --- CHARGEMENT DE TA NOUVELLE IMAGE ---
const textureLoader = new THREE.TextureLoader();
// On charge bien ton image JPG !
textureLoader.load('assets/map_globe.jpg', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
});

// --- LUMIÈRES ---
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
const resizeObserver = new ResizeObserver(() => window.resize3DEnvironment());
if(container3D) resizeObserver.observe(container3D);

animate();
