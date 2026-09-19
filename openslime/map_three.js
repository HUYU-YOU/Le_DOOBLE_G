// =========================================================
// MOTEUR 3D - GESTION DU GLOBE & EFFETS
// =========================================================

const container3D = document.getElementById('webgl-container');

window.gameScene = new THREE.Scene();
window.gameCamera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
window.gameCamera.position.set(0, 0, 15); 
// Variables pour le Screen Shake
window.shakeIntensity = 0;
let baseCameraPos = window.gameCamera.position.clone();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3D.clientWidth, container3D.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(window.gameCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6; 
controls.maxDistance = 30; 
controls.enablePan = false;

// --- CRÉATION DES ÉTOILES ---
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const starPosArray = new Float32Array(starCount * 3);
for(let i = 0; i < starCount * 3; i++) {
    starPosArray[i] = (Math.random() - 0.5) * 100;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPosArray, 3));
const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8});
const stars = new THREE.Points(starGeo, starMat);
window.gameScene.add(stars);

// --- SPHÈRE DU GLOBE (Avec Bump Map) ---
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.6, 
    metalness: 0.1 
});
window.gameEarth = new THREE.Mesh(geometry, material);
window.gameEarth.rotation.y = -Math.PI / 2;
window.gameScene.add(window.gameEarth);

// --- ATMOSPHÈRE (Shader) ---
const atmosphereVertex = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const atmosphereFragment = `
    varying vec3 vNormal;
    void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
        gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity;
    }
`;
const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 64, 64), // Légèrement plus grand que la Terre
    new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    })
);
window.gameScene.add(atmosphere);

// --- CHARGEMENT DE LA CARTE ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map_globe.png', (texture) => {
    material.map = texture;
    material.bumpMap = texture; // Crée un faux relief avec les contrastes de l'image
    material.bumpScale = 0.05;
    material.needsUpdate = true;
});

// --- LUMIÈRES ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
window.gameScene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(10, 10, 5);
window.gameScene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Effet de Screen Shake
    if (window.shakeIntensity > 0) {
        window.gameCamera.position.x += (Math.random() - 0.5) * window.shakeIntensity;
        window.gameCamera.position.y += (Math.random() - 0.5) * window.shakeIntensity;
        window.shakeIntensity *= 0.85; // Diminue progressivement
        if (window.shakeIntensity < 0.05) window.shakeIntensity = 0;
    }

    stars.rotation.y -= 0.0002; // Les étoiles tournent doucement

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
