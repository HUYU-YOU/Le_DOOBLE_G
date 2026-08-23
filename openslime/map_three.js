// =========================================================
// MOTEUR 3D - GESTION DU GLOBE ET DE L'ENVIRONNEMENT
// =========================================================

const container3D = document.getElementById('webgl-container');

window.scene = new THREE.Scene();
window.camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
window.camera.position.set(0, 0, 15); 

window.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
window.renderer.setSize(container3D.clientWidth, container3D.clientHeight);
window.renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(window.renderer.domElement);

window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.dampingFactor = 0.05;
window.controls.minDistance = 6; 
window.controls.maxDistance = 30; 

const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.1 });
window.earth = new THREE.Mesh(geometry, material);
window.scene.add(window.earth);

// CHARGEMENT DE L'IMAGE CORRECTE
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
window.scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(10, 10, 5);
window.scene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    window.earth.rotation.y += 0.0005; 
    window.controls.update();
    window.renderer.render(window.scene, window.camera);
}

window.resize3DEnvironment = function() {
    if(!container3D) return;
    window.camera.aspect = container3D.clientWidth / container3D.clientHeight;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(container3D.clientWidth, container3D.clientHeight);
}

window.addEventListener('resize', window.resize3DEnvironment);
animate();
