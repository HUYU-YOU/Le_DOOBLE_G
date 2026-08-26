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

// --- LA TERRE ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.6, 
    metalness: 0.1
    // ATTENTION: On a retiré "transparent: true" ici pour rendre la planète solide !
});
window.gameEarth = new THREE.Mesh(geometry, material);

// On tourne la Terre pour que le beau milieu de ta carte soit face à toi au début !
window.gameEarth.rotation.y = -Math.PI / 2; 

window.gameScene.add(window.gameEarth);

// --- CORRECTION MAGIQUE DU TROU (CANVAS TEXTURE) ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    
    // On crée une toile de peinture en mémoire, de la taille de ton image
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    const ctx = canvas.getContext('2d');
    
    // 1. On peint tout le fond de la toile avec un bleu océan profond
    ctx.fillStyle = '#005588'; // Tu peux changer ce code couleur HTML si tu veux un bleu différent !
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. On colle ton image par-dessus (les zones transparentes laisseront voir le bleu)
    ctx.drawImage(texture.image, 0, 0);
    
    // 3. On applique cette nouvelle image parfaite et sans trous sur le globe 3D
    const fixedTexture = new THREE.CanvasTexture(canvas);
    material.map = fixedTexture;
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
animate();
