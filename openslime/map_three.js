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

// --- 1. LA TERRE ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.6, 
    metalness: 0.1, 
    transparent: true // Indispensable pour voir l'eau à travers les trous !
});
window.gameEarth = new THREE.Mesh(geometry, material);
window.gameEarth.rotation.y = -Math.PI / 2; // Centre la belle face vers toi
window.planetGroup.add(window.gameEarth);

// --- 2. LE NOYAU OCÉANIQUE (Pour remplacer le noir par de l'eau) ---
const oceanGeo = new THREE.SphereGeometry(4.98, 64, 64); 
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x124a8c, // Un bleu profond qui matche bien avec ta carte
    roughness: 0.2, 
    metalness: 0.3 
});
const oceanCore = new THREE.Mesh(oceanGeo, oceanMat);
window.planetGroup.add(oceanCore);

// --- 3. CORRECTION MAGIQUE DE TON IMAGE ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    
    // Création d'une toile virtuelle
    const canvas = document.createElement('canvas');
    
    // On force un ratio parfait de 2:1 (ex: 4088 x 2044)
    canvas.width = texture.image.width;
    canvas.height = Math.floor(texture.image.width / 2);
    const ctx = canvas.getContext('2d');
    
    // On dessine l'image (légèrement compressée pour fit le 2:1)
    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
    
    // On scanne les pixels pour effacer le fond noir
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Si le pixel est "noir" ou très sombre
        if (data[i] < 20 && data[i+1] < 20 && data[i+2] < 20) {
            data[i+3] = 0; // On met l'Opacité (Alpha) à 0 -> Transparent !
        }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // On applique cette nouvelle image corrigée sur la Terre
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
const resizeObserver = new ResizeObserver(() => window.resize3DEnvironment());
resizeObserver.observe(container3D);

animate();
