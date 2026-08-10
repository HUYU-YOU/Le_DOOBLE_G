// ==========================================
// CLASSES DU RTS (Synchronisation PvP)
// ==========================================

let entityIdCounter = 1;

class Base {
    constructor(x, y, owner) {
        this.id = entityIdCounter++; this.owner = owner;
        this.x = x; this.y = y; this.type = 'hdv';
        this.size = 120; 
        this.hp = 2500; this.maxHp = 2500;
        this.color = owner === 'host' ? 'var(--neon-cyan)' : 'var(--neon-pink)';
    }
    draw(ctx, images) {
        if (selectedBuilding && selectedBuilding.id === this.id) {
            ctx.shadowBlur = 15; ctx.shadowColor = 'white';
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size/2 - 5, this.y - this.size/2 - 5, this.size + 10, this.size + 10);
            ctx.shadowBlur = 0;
        }

        if (images.hdv.complete && images.hdv.naturalWidth > 0) {
            ctx.drawImage(images.hdv, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = '#111'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        ctx.fillStyle = this.color; ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.owner === 'host' ? 'P1' : 'P2', this.x, this.y - this.size/2 - 15);

        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size, 5);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size * (this.hp / this.maxHp), 5);
        }
    }
}

class Building {
    constructor(x, y, type, owner) {
        this.id = entityIdCounter++; this.owner = owner;
        this.x = x; this.y = y; this.type = type;
        this.size = 64; this.farmersInside = 0; this.level = 1; this.attackCooldown = 0; 
        this.color = owner === 'host' ? 'var(--neon-cyan)' : 'var(--neon-pink)';

        if(type === 'house') { this.hp = 300; }
        if(type === 'farm') { this.hp = 400; }
        if(type === 'sawmill') { this.hp = 500; }
        if(type === 'mine') { this.hp = 600; }
        if(type === 'barracks') { this.size = 80; this.hp = 800; }
        if(type === 'archery') { this.size = 80; this.hp = 800; }
        if(type === 'mage') { this.size = 80; this.hp = 800; }
        if(type === 'tower') { this.size = 50; this.hp = 1000; }
        this.maxHp = this.hp;
    }
    
    update(dt) {
        if (this.type === 'tower') {
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                // Tour attaque les unités ennemies
                let targets = units.filter(u => u.owner !== this.owner);
                let closestEnemy = getClosest(this, targets);
                if (closestEnemy && dist(this, closestEnemy) <= 300) {
                    closestEnemy.hp -= 40;
                    spawnLaser(this, closestEnemy, this.color);
                    this.attackCooldown = 1.2; 
                }
            }
        }
    }

    draw(ctx, images) {
        if (moveMode && moveMode.id === this.id) return; 

        if (selectedBuilding && selectedBuilding.id === this.id) {
            ctx.shadowBlur = 15; ctx.shadowColor = 'white';
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
            ctx.fillStyle = '#111'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        // Halo coloré pour reconnaitre le propriétaire (P1 ou P2)
        ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);

        if (this.level > 1) {
            ctx.fillStyle = 'var(--neon-yellow)'; ctx.font = '16px Arial'; ctx.fillText('★', this.x + this.size/2 - 10, this.y - this.size/2 + 15);
        }
        if (this.type === 'farm' || this.type === 'sawmill' || this.type === 'mine') {
            ctx.fillStyle = this.color; ctx.font = '14px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${this.farmersInside}/5 🧑‍🌾`, this.x, this.y - this.size/2 - 5);
        }

        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size, 4);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 10, this.size * (this.hp / this.maxHp), 4);
        }
    }
}

class ResourceNode {
    constructor(x, y, type) {
        this.id = entityIdCounter++; this.x = x; this.y = y; this.type = type;
        this.radius = 15; this.amount = 1000; 
        this.color = type === 'tree' ? 'var(--neon-orange)' : 'var(--neon-green)';
    }
    draw(ctx, images) {
        if (this.type === 'wheat' && images.wheat.complete && images.wheat.naturalWidth > 0) {
            ctx.drawImage(images.wheat, this.x - 20, this.y - 20, 40, 40);
        } else {
            ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.beginPath();
            if(this.type === 'tree') {
                for (let i = 0; i < 6; i++) ctx.lineTo(this.x + this.radius * Math.cos(i * Math.PI / 3), this.y + this.radius * Math.sin(i * Math.PI / 3));
            } else { ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); }
            ctx.closePath(); ctx.fillStyle = '#111'; ctx.fill(); ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
        }
    }
}

class Unit {
    constructor(x, y, type, element = 'normal', owner) {
        this.id = entityIdCounter++; this.owner = owner;
        this.x = x; this.y = y; this.type = type; this.element = element;
        this.targetPos = null; this.targetEntityId = null;
        this.state = 'idle'; this.radius = 10; this.drawSize = 36; 
        this.payload = 0; this.payloadType = null;
        this.slowTimer = 0;

        this.color = owner === 'host' ? 'var(--neon-cyan)' : 'var(--neon-pink)';
        this.elColor = '#fff';
        if(element === 'fire') this.elColor = 'var(--neon-red)';
        if(element === 'water') this.elColor = 'var(--neon-water)';
        if(element === 'plant') this.elColor = 'var(--neon-green)';

        if (type === 'farmer') { this.speed = 100; this.hp = 30; }
        if (type === 'warrior') { this.speed = 90; this.hp = 150; this.damage = 15; this.range = 35; this.cooldown = 1.0; }
        if (type === 'archer') { this.speed = 80; this.hp = 80; this.damage = 12; this.range = 180; this.cooldown = 0.8; }
        if (type === 'mage') { this.speed = 70; this.hp = 100; this.damage = 25; this.range = 120; this.cooldown = 1.5; }
        
        this.maxHp = this.hp; this.currentCooldown = 0;
    }

    setCommand(x, y, entity = null) {
        if(this.state === 'farming') {
            let b = buildings.find(b => b.id === this.targetEntityId);
            if(b) b.farmersInside--;
        }

        this.targetPos = { x, y };
        this.targetEntityId = entity ? entity.id : null;
        
        if (this.type === 'farmer' && entity instanceof ResourceNode) this.state = 'moving_to_res';
        else if (this.type === 'farmer' && entity instanceof Building && ['farm','sawmill','mine'].includes(entity.type) && entity.owner === this.owner) this.state = 'moving_to_building';
        else if (this.type !== 'farmer' && entity && entity.owner !== this.owner && entity.owner !== undefined) this.state = 'attacking';
        else this.state = 'moving';
    }

    update(dt) {
        if (this.currentCooldown > 0) this.currentCooldown -= dt;
        if (this.slowTimer > 0) this.slowTimer -= dt;

        let currentSpeed = this.slowTimer > 0 ? this.speed * 0.5 : this.speed;

        // Anti-Stacking (Séparation)
        units.forEach(other => {
            if(other.id !== this.id && other.state !== 'farming' && this.state !== 'farming') {
                let d = dist(this, other);
                let minDist = this.radius + other.radius + 5;
                if(d < minDist && d > 0) {
                    let overlap = minDist - d;
                    this.x += ((this.x - other.x) / d) * overlap * 0.1;
                    this.y += ((this.y - other.y) / d) * overlap * 0.1;
                }
            }
        });

        let targetEnt = null;
        if (this.targetEntityId) {
            targetEnt = units.find(u => u.id === this.targetEntityId) || buildings.find(b => b.id === this.targetEntityId) || baseHost.id === this.targetEntityId ? baseHost : (baseGuest.id === this.targetEntityId ? baseGuest : null);
            if(!targetEnt) targetEnt = trees.find(t=>t.id===this.targetEntityId) || wheats.find(w=>w.id===this.targetEntityId);
        }

        // --- FERMIER ---
        if (this.type === 'farmer') {
            if (this.state === 'moving_to_res' && targetEnt) {
                if (dist(this, targetEnt) < this.radius + targetEnt.radius + 5) {
                    this.state = 'gathering'; this.targetPos = null;
                    this.payloadType = targetEnt.type === 'tree' ? 'wood' : 'food';
                }
            } 
            else if (this.state === 'gathering') {
                if(targetEnt && targetEnt.amount > 0) {
                    this.payload += 15 * dt; 
                    targetEnt.amount -= 15 * dt;
                    if (this.payload >= 20) {
                        this.payload = 20;
                        let myBase = this.owner === 'host' ? baseHost : baseGuest;
                        this.targetEntityId = myBase.id;
                        this.targetPos = { x: myBase.x, y: myBase.y }; this.state = 'returning';
                    }
                } else { this.state = 'idle'; }
            }
            else if (this.state === 'returning') {
                let myBase = this.owner === 'host' ? baseHost : baseGuest;
                if (dist(this, myBase) < this.radius + myBase.size/2 + 5) {
                    let myRes = this.owner === 'host' ? resHost : resGuest;
                    if(this.payloadType === 'wood') myRes.wood += Math.floor(this.payload);
                    if(this.payloadType === 'food') myRes.food += Math.floor(this.payload);
                    this.payload = 0;
                    
                    let pool = this.payloadType === 'wood' ? trees : wheats;
                    let closestRes = getClosest(this, pool);
                    if(closestRes) this.setCommand(closestRes.x, closestRes.y, closestRes);
                    else this.state = 'idle';
                }
            }
            else if (this.state === 'moving_to_building' && targetEnt) {
                if (dist(this, targetEnt) < targetEnt.size/2 + 5) {
                    if(targetEnt.farmersInside < 5) {
                        this.state = 'farming'; targetEnt.farmersInside++; this.targetPos = null;
                    } else { this.state = 'idle'; }
                }
            }
        } 
        // --- COMBATTANTS ---
        else {
            if (this.state === 'attacking' && targetEnt) {
                if(targetEnt.hp <= 0) {
                    this.targetEntityId = null; this.state = 'idle';
                } else if (dist(this, targetEnt) <= this.range) {
                    this.targetPos = null; 
                    if (this.currentCooldown <= 0) {
                        this.performAttack(targetEnt);
                        this.currentCooldown = this.cooldown;
                    }
                } else {
                    this.targetPos = { x: targetEnt.x, y: targetEnt.y }; 
                }
            } else if (this.state === 'idle') {
                // Auto-Attack nearest enemy
                let possibleTargets = [].concat(units).concat(buildings).concat([baseHost, baseGuest]);
                let enemy = getClosest(this, possibleTargets.filter(e => e.owner && e.owner !== this.owner && e.hp > 0));
                if (enemy && dist(this, enemy) <= this.range + 50) {
                    this.setCommand(enemy.x, enemy.y, enemy);
                }
            }
        }

        if (this.targetPos) {
            let d = dist(this, this.targetPos);
            if (d > 5) {
                this.x += ((this.targetPos.x - this.x) / d) * currentSpeed * dt;
                this.y += ((this.targetPos.y - this.y) / d) * currentSpeed * dt;
            } else if (this.state === 'moving' || this.state === 'moving_to_building') {
                this.state = 'idle'; this.targetPos = null;
            }
        }
    }

    performAttack(primaryTarget) {
        let colorFX = this.element === 'normal' ? this.color : this.elColor;
        spawnLaser(this, primaryTarget, colorFX);

        if (this.type === 'warrior') {
            let possibleTargets = [].concat(units).concat(buildings).concat([baseHost, baseGuest]);
            possibleTargets.forEach(e => {
                if(e.owner && e.owner !== this.owner && dist(this, e) <= this.range + 10) this.applyDamage(e);
            });
        } else {
            this.applyDamage(primaryTarget);
            if (this.type === 'mage' && primaryTarget.slowTimer !== undefined) primaryTarget.slowTimer = 2.0; 
        }
    }

    applyDamage(target) {
        let mult = 1.0;
        if (target.element) {
            if (this.element === 'fire' && target.element === 'plant') mult *= 1.5;
            if (this.element === 'plant' && target.element === 'water') mult *= 1.5;
            if (this.element === 'water' && target.element === 'fire') mult *= 1.5;

            if (this.element === 'fire' && target.element === 'water') mult *= 0.5;
            if (this.element === 'plant' && target.element === 'fire') mult *= 0.5;
            if (this.element === 'water' && target.element === 'plant') mult *= 0.5;
        }
        target.hp -= (this.damage * mult);
    }

    draw(ctx, images) {
        if(this.state === 'farming') return;

        let img = null;
        if(this.type === 'farmer') img = images.farmer;
        if(this.type === 'warrior') img = images.warrior;
        if(this.type === 'archer') img = images.archer;
        if(this.type === 'mage') img = images.mage;

        if (selectedUnits.includes(this.id)) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
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

        // Halo proprio
        ctx.strokeStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI*2); ctx.stroke();

        if(this.slowTimer > 0) { 
            ctx.strokeStyle = 'var(--neon-purple)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius+16, 0, Math.PI*2); ctx.stroke();
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
