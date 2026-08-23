// =========================================================
// 1. ANIMATION DES PARAMÈTRES ET TAILLES D'ÉCRAN
// =========================================================

const settingsBtnImg = document.getElementById('settings-btn-img');
const animFrames = ['../img/settings1.png', '../img/settings2.png', '../img/settings3.png', '../img/settings4.png', '../img/settings5.png'];
let hoverInterval; let currentFrame = 0;

function startSettingsAnim() {
    if (hoverInterval) return;
    currentFrame = 0;
    if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    hoverInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % animFrames.length;
        if(settingsBtnImg) settingsBtnImg.src = animFrames[currentFrame];
    }, 100); 
}

function stopSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if (settingsBtnImg && !settingsBtnImg.src.includes('settings4.png')) { settingsBtnImg.src = '../img/setting.png'; }
}

function clickSettingsAnim() {
    clearInterval(hoverInterval); hoverInterval = null;
    if(settingsBtnImg) settingsBtnImg.src = '../img/settings4.png';
    toggleSettings();
    setTimeout(() => { if(settingsBtnImg) settingsBtnImg.src = '../img/setting.png'; }, 300);
}

function toggleSettings() {
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('show');
}

function setGameSize(size) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
    container.classList.remove('size-classic', 'size-wide', 'size-full');
    
    let btnClassic = document.getElementById('btn-sz-classic');
    let btnWide = document.getElementById('btn-sz-wide');
    let btnFull = document.getElementById('btn-sz-full');

    if (size === 'classic') { 
        container.classList.add('size-classic'); if(btnClassic) btnClassic.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'wide') { 
        container.classList.add('size-wide'); if(btnWide) btnWide.classList.add('active'); 
        if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); 
    } 
    else if (size === 'full') { 
        container.classList.add('size-full'); if(btnFull) btnFull.classList.add('active'); 
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); 
    }

    // Informe le moteur 3D que le conteneur a changé de taille !
    setTimeout(resize3DEnvironment, 50);
    setTimeout(resize3DEnvironment, 400); // 2eme appel à la fin de la transition CSS
}

document.addEventListener('fullscreenchange', () => { 
    const container = document.getElementById('game-container');
    if (!document.fullscreenElement && container && container.classList.contains('size-full')) setGameSize('wide'); 
});


// =========================================================
// 2. INITIALISATION DE LA SCÈNE 3D
// =========================================================

const container3D = document.getElementById('webgl-container');

// La Scène
const scene = new THREE.Scene();

// La Caméra
const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 15); 

// Le Moteur de Rendu
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3D.clientWidth, container3D.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
container3D.appendChild(renderer.domElement);

// Les Contrôles
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6; 
controls.maxDistance = 30; 


// =========================================================
// 3. CRÉATION DE LA PLANÈTE
// =========================================================

const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.1
});

const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Chargement de la texture map.png
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/map.png', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
});


// =========================================================
// 4. ÉCLAIRAGE ET ANIMATION
// =========================================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(10, 10, 5);
scene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005; // Rotation douce
    controls.update();
    renderer.render(scene, camera);
}

// Fonction pour redimensionner proprement le rendu 3D
function resize3DEnvironment() {
    if(!container3D) return;
    const width = container3D.clientWidth;
    const height = container3D.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', resize3DEnvironment);

// Lancement
animate();
