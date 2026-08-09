// ==========================================
// CLASSES DU RTS (Architecture Cyber-Command)
// ==========================================

class Base {
    constructor(x, y) {
        this.x = x; this.y = y; this.type = 'hdv';
        this.size = 100; 
        this.hp = 2000; this.maxHp = 2000;
        this.color = 'var(--neon-cyan)';
    }
    draw(ctx, images) {
        if (selectedBuilding === this) {
            ctx.shadowBlur = 15; ctx.shadowColor = 'var(--neon-cyan)';
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size/2 - 5, this.y - this.size/2 - 5, this.size + 10, this.size + 10);
            ctx.shadowBlur = 0;
        }

        if (images.hdv.complete && images.hdv.naturalWidth > 0) {
            ctx.drawImage(images.hdv, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = '#0b0c10'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        // Barre de vie HDV
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 15, this.size, 5);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 15, this.size * (this.hp / this.maxHp), 5);
        }
    }
}

class Building {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.size = 64;
        this.farmersInside = 0; 
        this.level = 1; 
        this.attackCooldown = 0; 

        if(type === 'house') { this.color = 'var(--neon-yellow)'; res.maxPop += 4; this.hp = 300; }
        if(type === 'farm') { this.color = 'var(--neon-green)'; this.hp = 400; }
        if(type === 'sawmill') { this.color = 'var(--neon-orange)'; this.hp = 500; }
        if(type === 'mine') { this.color = 'var(--neon-yellow)'; this.hp = 600; }
        if(type === 'barracks') { this.color = 'var(--neon-red)'; this.size = 80; this.hp = 800; }
        if(type === 'archery') { this.color = 'var(--neon-pink)'; this.size = 80; this.hp = 800; }
        if(type === 'mage') { this.color = 'var(--neon-purple)'; this.size = 80; this.hp = 800; }
        if(type === 'tower') { this.color = 'var(--neon-cyan)'; this.size = 50; this.hp = 1000; }
        
        this.maxHp = this.hp;
    }
    
    update(dt) {
        if (this.type === 'tower') {
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                let closestEnemy = getClosest(this, enemies);
                if (closestEnemy && dist(this, closestEnemy) <= 300) {
                    closestEnemy.hp -= 40;
                    spawnLaser(this, closestEnemy, 'var(--neon-cyan)');
                    this.attackCooldown = 1.2; 
                }
            }
        }
    }

    draw(ctx, images) {
        if (moveMode === this) return; // Caché pendant le déplacement

        if (selectedBuilding === this) {
            ctx.shadowBlur = 15; ctx.shadowColor = 'var(--text-color)';
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size/2 - 5, this.y - this.size/2 - 5, this.size + 10, this.size + 10);
            ctx.shadowBlur = 0;
        }

        let img = null;
        if(this.type === 'house') img = images.house;
        if(this.type === 'farm') img = images.farm;
        if(this.type === 'sawmill') img = images.sawmill;
        if(this.type === 'mine') img = images.mine;
        if(this.type === 'barracks') img = images.barracks;
        if(this.type === 'archery') img = images.archery;
        if(this.type === 'mage') img = images.mageTower;
        if(this.type === 'tower') img = images.tower;

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        if (this.level > 1) {
            ctx.fillStyle = 'var(--neon-yellow)'; ctx.font = '16px Arial'; ctx.fillText('★', this.x + this.size/2 - 10, this.y - this.size/2 + 15);
        }
        if (this.type === 'farm' || this.type === 'sawmill' || this.type === 'mine') {
            ctx.fillStyle = this.color; ctx.font = '14px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${this.farmersInside}/5 🧑‍🌾`, this.x, this.y - this.size/2 - 5);
        }

        // Barre de vie
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size, 4);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size * (this.hp / this.maxHp), 4);
        }
    }
}

class ResourceNode {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.radius = 15;
        this.amount = 500; 
        this.color = type === 'tree' ? 'var(--neon-orange)' : 'var(--neon-green)';
    }
    draw(ctx, images) {
        if (this.type === 'wheat' && images.wheat.complete && images.wheat.naturalWidth > 0) {
            ctx.drawImage(images.wheat, this.x - 20, this.y - 20, 40, 40);
        } else {
            ctx.shadowBlur = 10; ctx.shadowColor = this.color;
            ctx.beginPath();
            if(this.type === 'tree') {
                for (let i = 0; i < 6; i++) ctx.lineTo(this.x + this.radius * Math.cos(i * Math.PI / 3), this.y + this.radius * Math.sin(i * Math.PI / 3));
            } else { 
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
            }
            ctx.closePath();
            ctx.fillStyle = '#111'; ctx.fill();
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}

class Unit {
    constructor(x, y, type, element = 'normal') {
        this.x = x; this.y = y; this.type = type; this.element = element;
        this.targetPos = null; this.targetEntity = null;
        this.state = 'idle'; 
        this.radius = 8; 
        this.drawSize = 32; 
        this.payload = 0; this.payloadType = null;
        res.pop++;

        this.elColor = '#fff';
        if(element === 'fire') this.elColor = 'var(--neon-red)';
        if(element === 'water') this.elColor = 'var(--neon-water)';
        if(element === 'plant') this.elColor = 'var(--neon-green)';

        if (type === 'farmer') { this.color = '#ccc'; this.speed = 100; this.hp = 30; }
        if (type === 'warrior') { this.color = 'var(--neon-red)'; this.speed = 90; this.hp = 150; this.damage = 15; this.range = 35; this.cooldown = 1.0; }
        if (type === 'archer') { this.color = 'var(--neon-pink)'; this.speed = 80; this.hp = 80; this.damage = 12; this.range = 180; this.cooldown = 0.8; }
        if (type === 'mage') { this.color = 'var(--neon-purple)'; this.speed = 70; this.hp = 100; this.damage = 25; this.range = 120; this.cooldown = 1.5; }
        
        this.maxHp = this.hp;
        this.currentCooldown = 0;
    }

    setCommand(x, y, entity = null) {
        if(this.state === 'farming' && this.targetEntity) this.targetEntity.farmersInside--;

        this.targetPos = { x, y };
        this.targetEntity = entity;
        
        if (this.type === 'farmer' && entity instanceof ResourceNode) this.state = 'moving_to_res';
        else if (this.type === 'farmer' && entity instanceof Building && ['farm','sawmill','mine'].includes(entity.type)) this.state = 'moving_to_building';
        else if (this.type !== 'farmer' && entity instanceof Enemy) this.state = 'attacking';
        else this.state = 'moving';
    }

    update(dt) {
        if (this.currentCooldown > 0) this.currentCooldown -= dt;

        // --- FERMIER ---
        if (this.type === 'farmer') {
            if (this.state === 'moving_to_res' && this.targetEntity) {
                if (dist(this, this.targetEntity) < this.radius + this.targetEntity.radius + 5) {
                    this.state = 'gathering'; this.targetPos = null;
                    this.payloadType = this.targetEntity.type === 'tree' ? 'wood' : 'food';
                }
            } 
            else if (this.state === 'gathering') {
                if(this.targetEntity.amount > 0) {
                    this.payload += 15 * dt; 
                    this.targetEntity.amount -= 15 * dt;
                    if (this.payload >= 20) {
                        this.payload = 20; this.targetEntity = base;
                        this.targetPos = { x: base.x, y: base.y }; this.state = 'returning';
                    }
                } else { this.state = 'idle'; }
            }
            else if (this.state === 'returning') {
                if (dist(this, base) < this.radius + base.size/2 + 5) {
                    if(this.payloadType === 'wood') res.wood += Math.floor(this.payload);
                    if(this.payloadType === 'food') res.food += Math.floor(this.payload);
                    this.payload = 0;
                    
                    let pool = this.payloadType === 'wood' ? trees : wheats;
                    let closestRes = getClosest(this, pool);
                    if(closestRes) this.setCommand(closestRes.x, closestRes.y, closestRes);
                    else this.state = 'idle';
                }
            }
            else if (this.state === 'moving_to_building' && this.targetEntity) {
                if (dist(this, this.targetEntity) < this.targetEntity.size/2 + 5) {
                    if(this.targetEntity.farmersInside < 5) {
                        this.state = 'farming';
                        this.targetEntity.farmersInside++;
                        this.targetPos = null;
                    } else { this.state = 'idle'; }
                }
            }
        } 
        // --- COMBATTANTS ---
        else {
            if (this.state === 'attacking' && this.targetEntity) {
                if(this.targetEntity.hp <= 0) {
                    this.targetEntity = null; this.state = 'idle';
                } else if (dist(this, this.targetEntity) <= this.range) {
                    this.targetPos = null; 
                    if (this.currentCooldown <= 0) {
                        this.performAttack(this.targetEntity);
                        this.currentCooldown = this.cooldown;
                    }
                } else {
                    this.targetPos = { x: this.targetEntity.x, y: this.targetEntity.y }; 
                }
            }
        }

        if (this.targetPos) {
            let d = dist(this, this.targetPos);
            if (d > 5) {
                this.x += ((this.targetPos.x - this.x) / d) * this.speed * dt;
                this.y += ((this.targetPos.y - this.y) / d) * this.speed * dt;
            } else if (this.state === 'moving' || this.state === 'moving_to_building') {
                this.state = 'idle'; this.targetPos = null;
            }
        }
    }

    performAttack(primaryTarget) {
        let colorFX = this.element === 'normal' ? this.color : this.elColor;
        spawnLaser(this, primaryTarget, colorFX);

        if (this.type === 'warrior') {
            enemies.forEach(e => {
                if(dist(this, e) <= this.range + 10) this.applyDamage(e);
            });
        } else {
            this.applyDamage(primaryTarget);
            if (this.type === 'mage') {
                primaryTarget.slowTimer = 2.0; 
            }
        }
    }

    applyDamage(target) {
        let mult = 1.0;
        if (this.element === 'fire' && target.element === 'plant') mult *= 1.5;
        if (this.element === 'plant' && target.element === 'water') mult *= 1.5;
        if (this.element === 'water' && target.element === 'fire') mult *= 1.5;

        if (this.element === 'fire' && target.element === 'water') mult *= 0.5;
        if (this.element === 'plant' && target.element === 'fire') mult *= 0.5;
        if (this.element === 'water' && target.element === 'plant') mult *= 0.5;

        target.hp -= (this.damage * mult);
    }

    draw(ctx, images) {
        if(this.state === 'farming') return;

        let img = null;
        if(this.type === 'farmer') img = images.farmer;
        if(this.type === 'warrior') img = images.warrior;
        if(this.type === 'archer') img = images.archer;
        if(this.type === 'mage') img = images.mage;

        if (selectedUnits.includes(this)) {
            ctx.strokeStyle = 'var(--neon-cyan)'; ctx.lineWidth = 1;
            ctx.strokeRect(this.x - this.drawSize/2 - 2, this.y - this.drawSize/2 - 2, this.drawSize + 4, this.drawSize + 4);
        }

        if (this.element !== 'normal') {
            ctx.shadowBlur = 10; ctx.shadowColor = this.elColor;
            ctx.fillStyle = this.elColor; ctx.beginPath(); ctx.arc(this.x, this.y+10, 15, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.drawSize/2, this.y - this.drawSize/2, this.drawSize, this.drawSize);
        } else {
            ctx.fillStyle = '#111'; ctx.beginPath();
            if (this.type === 'farmer') ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            else if (this.type === 'warrior') { ctx.moveTo(this.x, this.y-this.radius); ctx.lineTo(this.x+this.radius, this.y+this.radius); ctx.lineTo(this.x-this.radius, this.y+this.radius); }
            else if (this.type === 'archer') { ctx.moveTo(this.x, this.y-this.radius); ctx.lineTo(this.x+this.radius, this.y); ctx.lineTo(this.x, this.y+this.radius); ctx.lineTo(this.x-this.radius, this.y); }
            else if (this.type === 'mage') { for(let i=0; i<5; i++) { ctx.lineTo(this.x + this.radius * Math.cos(i*Math.PI*2/5 - Math.PI/2), this.y + this.radius * Math.sin(i*Math.PI*2/5 - Math.PI/2)); } }
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke();
        }

        if(this.type !== 'farmer' && this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 10, this.y - this.drawSize/2 - 6, 20, 3);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - 10, this.y - this.drawSize/2 - 6, 20 * (this.hp/this.maxHp), 3);
        }
        if(this.payload > 0) {
            ctx.fillStyle = this.payloadType === 'wood' ? 'var(--neon-orange)' : 'var(--neon-green)';
            ctx.fillRect(this.x - 5, this.y - this.drawSize/2 - 6, 10 * (this.payload/20), 3);
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 12;
        this.baseSpeed = 40 + Math.random() * 30;
        this.hp = 60 + Math.floor(survivalTimer); 
        this.maxHp = this.hp;
        this.attackCooldown = 0;
        this.slowTimer = 0;
        
        const els = ['normal', 'fire', 'water', 'plant'];
        this.element = els[Math.floor(Math.random() * els.length)];
        if(this.element === 'normal') this.color = 'var(--neon-red)';
        if(this.element === 'fire') this.color = '#ff5500';
        if(this.element === 'water') this.color = 'var(--neon-water)';
        if(this.element === 'plant') this.color = 'var(--neon-green)';
    }

    update(dt) {
        if(this.attackCooldown > 0) this.attackCooldown -= dt;
        if(this.slowTimer > 0) this.slowTimer -= dt;

        let currentSpeed = this.slowTimer > 0 ? this.baseSpeed * 0.5 : this.baseSpeed;

        // Le Virus cible maintenant n'importe quel bâtiment ou unité proche
        let target = base;
        let minDist = dist(this, base);

        for (let b of buildings) {
            let d = dist(this, b);
            if (d < minDist) { minDist = d; target = b; }
        }
        for (let u of units) {
            if (u.state !== 'farming') {
                let d = dist(this, u);
                if (d < minDist) { minDist = d; target = u; }
            }
        }

        let d = dist(this, target);
        let range = target === base ? base.size/2 + this.radius : (target.size ? target.size/2 : target.radius) + this.radius;

        if (d > range + 5) {
            this.x += ((target.x - this.x) / d) * currentSpeed * dt;
            this.y += ((target.y - this.y) / d) * currentSpeed * dt;
        } else if (this.attackCooldown <= 0) {
            target.hp -= 15;
            this.attackCooldown = 1;
            spawnParticles(target.x, target.y, this.color, 5);
        }
    }

    draw(ctx) {
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillStyle = '#111'; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(this.x-5, this.y-5); ctx.lineTo(this.x+5, this.y+5);
        ctx.moveTo(this.x+5, this.y-5); ctx.lineTo(this.x-5, this.y+5); ctx.stroke();
        ctx.shadowBlur = 0;

        if(this.slowTimer > 0) { 
            ctx.strokeStyle = 'var(--neon-purple)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius+4, 0, Math.PI*2); ctx.stroke();
        }

        if(this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20, 3);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20 * (this.hp/this.maxHp), 3);
        }
    }
}
