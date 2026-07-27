<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Cyber Artillery (Worms-like)</title>
    <style>
        :root { --bg: #090a0f; --panel: rgba(20, 22, 35, 0.9); --p1: #00f0ff; --p2: #ff007f; --sys: #39ff14; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background-color: var(--bg); color: #fff; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; touch-action: none; }
        
        .hub-link { position: absolute; top: 15px; left: 15px; color: rgba(255,255,255,0.7); text-decoration: none; font-weight: bold; z-index: 1000; background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); transition: 0.2s; }
        .hub-link:hover { color: #fff; background: rgba(0, 136, 255, 0.8); }

        /* HEADER UI */
        #ui-layer { position: absolute; top: 10px; width: 100%; max-width: 800px; display: flex; justify-content: space-between; padding: 0 20px; box-sizing: border-box; z-index: 100; pointer-events: none; }
        .player-info { background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 8px; border: 1px solid #333; text-align: center; }
        .hp-bar-bg { width: 150px; height: 15px; background: #222; border-radius: 10px; margin-top: 5px; overflow: hidden; border: 1px solid #555; }
        .hp-bar { height: 100%; transition: width 0.3s; }
        #hp-p1 { background: var(--p1); width: 100%; box-shadow: 0 0 10px var(--p1); }
        #hp-p2 { background: var(--p2); width: 100%; box-shadow: 0 0 10px var(--p2); }
        
        #turn-indicator { font-size: 1.5em; font-weight: bold; text-transform: uppercase; background: rgba(0,0,0,0.8); padding: 10px 30px; border-radius: 20px; border: 2px solid #fff; }

        /* GAME CONTAINER & CANVASES */
        #game-wrapper { position: relative; width: 100%; max-width: 800px; height: 600px; border-radius: 15px; box-shadow: 0 0 30px rgba(0, 240, 255, 0.1); border: 2px solid rgba(255,255,255,0.1); overflow: hidden; background: #000; }
        canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        
        #canvas-bg { z-index: 1; }
        #canvas-terrain { z-index: 2; }
        #canvas-entities { z-index: 3; }

        /* MENU DE FIN */
        #game-over { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
        #game-over h2 { font-size: 3em; margin-bottom: 10px; text-transform: uppercase; }
        .btn-restart { background: #fff; color: #000; border: none; padding: 15px 30px; font-size: 1.2em; font-weight: bold; border-radius: 8px; cursor: pointer; text-transform: uppercase; transition: 0.2s; margin-top: 20px; }
        .btn-restart:hover { transform: scale(1.05); box-shadow: 0 0 20px #fff; }

        @media (max-width: 800px) {
            #game-wrapper { height: 70vh; border-radius: 0; border: none; }
            .hp-bar-bg { width: 100px; }
            #turn-indicator { font-size: 1em; padding: 8px 15px; }
        }
    </style>
</head>
<body>
    <a href="../index.html" class="hub-link">⬅ Retour au Hub</a>

    <div id="game-wrapper">
        <div id="ui-layer">
            <div class="player-info">
                <b style="color: var(--p1)">JOUEUR 1</b>
                <div class="hp-bar-bg"><div id="hp-p1" class="hp-bar"></div></div>
            </div>
            <div id="turn-indicator" style="color: var(--p1); border-color: var(--p1);">Tour J1</div>
            <div class="player-info">
                <b style="color: var(--p2)">JOUEUR 2</b>
                <div class="hp-bar-bg"><div id="hp-p2" class="hp-bar"></div></div>
            </div>
        </div>

        <!-- LES 3 COUCHES MAGIQUES -->
        <canvas id="canvas-bg" width="800" height="600"></canvas>
        <canvas id="canvas-terrain" width="800" height="600"></canvas>
        <canvas id="canvas-entities" width="800" height="600"></canvas>

        <div id="game-over">
            <h2 id="winner-text">JOUEUR GAGNE</h2>
            <button class="btn-restart" onclick="location.reload()">Rejouer</button>
        </div>
    </div>

    <script>
        const canvasBg = document.getElementById('canvas-bg');
        const ctxBg = canvasBg.getContext('2d', { alpha: false });
        const canvasTerrain = document.getElementById('canvas-terrain');
        const ctxTerrain = canvasTerrain.getContext('2d', { willReadFrequently: true });
        const canvasEnt = document.getElementById('canvas-entities');
        const ctxEnt = canvasEnt.getContext('2d');

        const WIDTH = 800;
        const HEIGHT = 600;
        const GRAVITY = 0.15;
        
        let gameState = 'playing'; // playing, aiming, flying, end
        let currentPlayer = 1;

        // --- GÉNÉRATION DU DÉCOR ET TERRAIN ---
        function drawBackground() {
            let grad = ctxBg.createLinearGradient(0, 0, 0, HEIGHT);
            grad.addColorStop(0, "#0b0c10");
            grad.addColorStop(1, "#1f2833");
            ctxBg.fillStyle = grad;
            ctxBg.fillRect(0, 0, WIDTH, HEIGHT);
            
            // Etoiles
            ctxBg.fillStyle = "#fff";
            for(let i=0; i<50; i++) {
                ctxBg.fillRect(Math.random()*WIDTH, Math.random()*HEIGHT*0.7, Math.random()*2, Math.random()*2);
            }
        }

        function generateTerrain() {
            ctxTerrain.clearRect(0, 0, WIDTH, HEIGHT);
            ctxTerrain.fillStyle = "#45a29e"; // Couleur du sol
            
            ctxTerrain.beginPath();
            ctxTerrain.moveTo(0, HEIGHT);
            
            // Génération procédurale d'une courbe pour le sol
            let y = HEIGHT / 1.5;
            for (let x = 0; x <= WIDTH; x += 10) {
                y += (Math.random() - 0.5) * 20; // Variations
                if (y < 200) y = 200; if (y > HEIGHT - 50) y = HEIGHT - 50;
                ctxTerrain.lineTo(x, y);
            }
            ctxTerrain.lineTo(WIDTH, HEIGHT);
            ctxTerrain.fill();
            
            // Bordure brillante du sol
            ctxTerrain.strokeStyle = "#66fcf1";
            ctxTerrain.lineWidth = 3;
            ctxTerrain.stroke();
        }

        // --- PHYSIQUE ET COLLISIONS ---
        // Vérifie si un pixel spécifique est "plein" sur le canvas du terrain
        function isSolid(x, y) {
            if (x < 0 || x >= WIDTH || y >= HEIGHT) return false;
            if (y < 0) return false;
            // On récupère le pixel de la couche terrain. Index 3 = Alpha
            return ctxTerrain.getImageData(x, y, 1, 1).data[3] > 128;
        }

        // Crée un cratère dans le terrain
        function explodeTerrain(ex, ey, radius) {
            ctxTerrain.globalCompositeOperation = 'destination-out';
            ctxTerrain.beginPath();
            ctxTerrain.arc(ex, ey, radius, 0, Math.PI * 2);
            ctxTerrain.fill();
            
            // Remet le mode normal
            ctxTerrain.globalCompositeOperation = 'source-over';
        }

        // --- CLASSES DU JEU ---
        class Worm {
            constructor(x, y, id, color) {
                this.x = x; this.y = y;
                this.id = id; this.color = color;
                this.radius = 10;
                this.vx = 0; this.vy = 0;
                this.hp = 100;
                this.isDead = false;
            }

            update() {
                if (this.isDead) return;
                
                // Gravité
                this.vy += GRAVITY;
                this.y += this.vy;
                this.x += this.vx;

                // Friction
                this.vx *= 0.9;

                // Collision sol (On vérifie le pixel juste sous le ver)
                if (isSolid(this.x, this.y + this.radius)) {
                    this.vy = 0;
                    // Remonte légèrement s'il est coincé dans le sol
                    while(isSolid(this.x, this.y + this.radius - 1)) {
                        this.y -= 1;
                    }
                }

                // Limites d'écran (tomber dans le vide)
                if (this.y > HEIGHT + 50) {
                    this.hp = 0;
                    this.isDead = true;
                    checkWin();
                }
            }

            draw() {
                if (this.isDead) return;
                ctxEnt.fillStyle = this.color;
                ctxEnt.shadowBlur = 10;
                ctxEnt.shadowColor = this.color;
                
                // Corps du ver (Petit tank/bloc)
                ctxEnt.fillRect(this.x - 10, this.y - 10, 20, 20);
                
                // Yeux
                ctxEnt.fillStyle = "#fff";
                ctxEnt.shadowBlur = 0;
                let eyeDir = (this.id === 1) ? 2 : -6;
                ctxEnt.fillRect(this.x + eyeDir, this.y - 5, 4, 4);
                
                // Flèche au-dessus du joueur actif
                if (currentPlayer === this.id && gameState !== 'flying' && gameState !== 'end') {
                    ctxEnt.fillStyle = "#fff";
                    ctxEnt.beginPath();
                    ctxEnt.moveTo(this.x - 5, this.y - 30);
                    ctxEnt.lineTo(this.x + 5, this.y - 30);
                    ctxEnt.lineTo(this.x, this.y - 20);
                    ctxEnt.fill();
                }
            }
        }

        class Projectile {
            constructor(x, y, vx, vy) {
                this.x = x; this.y = y;
                this.vx = vx; this.vy = vy;
                this.active = true;
                this.radius = 4;
            }

            update() {
                if (!this.active) return;
                this.vy += GRAVITY;
                this.x += this.vx;
                this.y += this.vy;

                // Trainée de particules
                particles.push(new Particle(this.x, this.y, 0, 0, "#ffaa00", 2, 20));

                // Collision avec le terrain
                if (isSolid(this.x, this.y) || this.y > HEIGHT || this.x < 0 || this.x > WIDTH) {
                    this.explode();
                }
            }

            explode() {
                this.active = false;
                let expRadius = 45;
                
                // Creuse le terrain
                explodeTerrain(this.x, this.y, expRadius);
                
                // Particules d'explosion
                for(let i=0; i<30; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let speed = Math.random() * 5 + 2;
                    particles.push(new Particle(this.x, this.y, Math.cos(angle)*speed, Math.sin(angle)*speed, "#ff5500", Math.random()*4+2, 40));
                }

                // Dégâts aux vers
                worms.forEach(w => {
                    let dist = Math.hypot(w.x - this.x, w.y - this.y);
                    if (dist < expRadius + 15 && !w.isDead) {
                        let damage = Math.floor((1 - dist / (expRadius + 15)) * 50);
                        w.hp -= damage;
                        
                        // Knockback (Projection)
                        let kbAngle = Math.atan2(w.y - this.y, w.x - this.x);
                        w.vx += Math.cos(kbAngle) * (damage * 0.2);
                        w.vy += Math.sin(kbAngle) * (damage * 0.2) - 2; // Pousse vers le haut
                        
                        if (w.hp <= 0) { w.hp = 0; w.isDead = true; }
                        updateUI();
                    }
                });

                // Fin du tour après l'explosion
                setTimeout(nextTurn, 1500);
            }

            draw() {
                if (!this.active) return;
                ctxEnt.fillStyle = "#fff";
                ctxEnt.shadowBlur = 10;
                ctxEnt.shadowColor = "#ff0000";
                ctxEnt.beginPath();
                ctxEnt.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctxEnt.fill();
                ctxEnt.shadowBlur = 0;
            }
        }

        class Particle {
            constructor(x, y, vx, vy, color, size, life) {
                this.x = x; this.y = y; this.vx = vx; this.vy = vy;
                this.color = color; this.size = size; this.life = life; this.maxLife = life;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                this.life--;
            }
            draw() {
                ctxEnt.fillStyle = this.color;
                ctxEnt.globalAlpha = this.life / this.maxLife;
                ctxEnt.fillRect(this.x, this.y, this.size, this.size);
                ctxEnt.globalAlpha = 1;
            }
        }

        // --- VARIABLES GLOBALES ---
        let worms = [];
        let projectile = null;
        let particles = [];
        
        // Drag & Aim (Visée tactile/souris)
        let isDragging = false;
        let dragStartX = 0; let dragStartY = 0;
        let dragCurrentX = 0; let dragCurrentY = 0;

        function initGame() {
            drawBackground();
            generateTerrain();
            
            // Placement initial des vers (On les lâche de haut, la gravité fera le reste)
            worms = [
                new Worm(150, 100, 1, 'var(--p1)'),
                new Worm(WIDTH - 150, 100, 2, 'var(--p2)')
            ];
            
            currentPlayer = 1;
            gameState = 'playing';
            updateUI();
            document.getElementById('game-over').style.display = 'none';
            
            requestAnimationFrame(gameLoop);
        }

        function updateUI() {
            document.getElementById('hp-p1').style.width = worms[0].hp + '%';
            document.getElementById('hp-p2').style.width = worms[1].hp + '%';
            
            let turnInd = document.getElementById('turn-indicator');
            turnInd.innerText = `Tour J${currentPlayer}`;
            turnInd.style.color = currentPlayer === 1 ? 'var(--p1)' : 'var(--p2)';
            turnInd.style.borderColor = currentPlayer === 1 ? 'var(--p1)' : 'var(--p2)';
        }

        function nextTurn() {
            checkWin();
            if (gameState === 'end') return;
            
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            
            // Skip si mort (utile si on rajoute plus de 2 joueurs)
            if (worms[currentPlayer-1].isDead) {
                currentPlayer = currentPlayer === 1 ? 2 : 1; 
            }
            
            gameState = 'playing';
            projectile = null;
            updateUI();
        }

        function checkWin() {
            if (worms[0].isDead || worms[1].isDead) {
                gameState = 'end';
                let winnerText = document.getElementById('winner-text');
                winnerText.style.color = worms[1].isDead ? 'var(--p1)' : 'var(--p2)';
                winnerText.innerText = worms[1].isDead ? "JOUEUR 1 GAGNE" : "JOUEUR 2 GAGNE";
                if(worms[0].isDead && worms[1].isDead) { winnerText.innerText = "ÉGALITÉ"; winnerText.style.color="#fff"; }
                
                setTimeout(() => { document.getElementById('game-over').style.display = 'flex'; }, 1000);
            }
        }

        // --- CONTRÔLES (VISÉE FAÇON ANGRY BIRDS) ---
        const gameWrapper = document.getElementById('game-wrapper');

        function startAim(e) {
            if (gameState !== 'playing') return;
            e.stopPropagation(); // Bloque le Swipe Hub
            
            let rect = canvasEnt.getBoundingClientRect();
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Adapter les coordonnées (scaling)
            let scaleX = canvasEnt.width / rect.width;
            let scaleY = canvasEnt.height / rect.height;
            
            dragStartX = (clientX - rect.left) * scaleX;
            dragStartY = (clientY - rect.top) * scaleY;
            
            isDragging = true;
            gameState = 'aiming';
        }

        function moveAim(e) {
            if (!isDragging) return;
            e.stopPropagation(); e.preventDefault(); // Empêche scroll
            let rect = canvasEnt.getBoundingClientRect();
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let scaleX = canvasEnt.width / rect.width;
            let scaleY = canvasEnt.height / rect.height;
            
            dragCurrentX = (clientX - rect.left) * scaleX;
            dragCurrentY = (clientY - rect.top) * scaleY;
        }

        function endAim(e) {
            if (!isDragging) return;
            isDragging = false;
            e.stopPropagation();
            
            let activeWorm = worms[currentPlayer - 1];
            
            // Calcul du vecteur de tir (Inversé car on tire vers l'arrière comme un lance-pierre)
            let dx = dragStartX - dragCurrentX;
            let dy = dragStartY - dragCurrentY;
            
            // Limiter la puissance
            let power = Math.min(Math.hypot(dx, dy) * 0.1, 15);
            let angle = Math.atan2(dy, dx);
            
            if (power > 2) { // Si on a tiré assez fort
                projectile = new Projectile(
                    activeWorm.x, 
                    activeWorm.y - 15, // Tir au dessus de la tête
                    Math.cos(angle) * power,
                    Math.sin(angle) * power
                );
                gameState = 'flying';
            } else {
                gameState = 'playing'; // Tir annulé
            }
        }

        gameWrapper.addEventListener('mousedown', startAim);
        window.addEventListener('mousemove', moveAim);
        window.addEventListener('mouseup', endAim);
        
        gameWrapper.addEventListener('touchstart', startAim, {passive: false});
        window.addEventListener('touchmove', moveAim, {passive: false});
        window.addEventListener('touchend', endAim);

        // --- BOUCLE PRINCIPALE ---
        function gameLoop() {
            ctxEnt.clearRect(0, 0, WIDTH, HEIGHT);

            // Mise à jour et affichage des Vers
            worms.forEach(w => {
                w.update();
                w.draw();
            });

            // Affichage de la visée (Lance-pierre)
            if (gameState === 'aiming' && isDragging) {
                let activeWorm = worms[currentPlayer - 1];
                let dx = dragStartX - dragCurrentX;
                let dy = dragStartY - dragCurrentY;
                let power = Math.min(Math.hypot(dx, dy), 150);
                let angle = Math.atan2(dy, dx);
                
                // Dessine la ligne de tir
                ctxEnt.beginPath();
                ctxEnt.moveTo(activeWorm.x, activeWorm.y - 15);
                ctxEnt.lineTo(activeWorm.x + Math.cos(angle)*power, activeWorm.y - 15 + Math.sin(angle)*power);
                ctxEnt.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctxEnt.lineWidth = 2;
                ctxEnt.setLineDash([5, 5]);
                ctxEnt.stroke();
                ctxEnt.setLineDash([]);
            }

            // Gestion du projectile
            if (projectile) {
                projectile.update();
                projectile.draw();
            }

            // Particules
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) particles.splice(i, 1);
            }

            requestAnimationFrame(gameLoop);
        }

        // Lancement
        window.onload = initGame;
    </script>
    
    <!-- SCRIPT DE NAVIGATION PAR SWIPE GLOBAL -->
    <script>
        const gamesHubList = [
            "../cybertank/index.html",
            "../tower_defense/index.html",
            "../edgeofwar/index.html",
            "../cyber_smash/index.html",
            "../guessthemanga/index.html",
            "../drawer/index.html",
            "../texas_poker/index.html",
            "../blindtest/index.html",
            "../2048slime/index.html",
            "../worms/index.html" // Nouveau jeu !
        ];

        let globalTouchStartX = 0;
        let globalTouchEndX = 0;
        
        function handleSwipeGesture() {
            const swipeThreshold = 75; 
            if (globalTouchEndX < globalTouchStartX - swipeThreshold) navigateGames(1);
            if (globalTouchEndX > globalTouchStartX + swipeThreshold) navigateGames(-1);
        }

        function navigateGames(direction) {
            const currentPath = window.location.pathname;
            let currentIndex = gamesHubList.findIndex(game => {
                let folderName = game.split('/')[1]; 
                return currentPath.includes(folderName);
            });
            if (currentIndex === -1) return;
            let nextIndex = (currentIndex + direction + gamesHubList.length) % gamesHubList.length;
            window.location.href = gamesHubList[nextIndex];
        }

        // Activation uniquement en-dehors du cadre du jeu pour ne pas gêner la visée
        document.addEventListener('touchstart', e => {
            if (e.target.closest('#game-wrapper') || e.target.tagName.toLowerCase() === 'button') return;
            globalTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            if (e.target.closest('#game-wrapper') || e.target.tagName.toLowerCase() === 'button') return;
            globalTouchEndX = e.changedTouches[0].screenX;
            handleSwipeGesture();
        }, { passive: true });
    </script>
</body>
</html>
