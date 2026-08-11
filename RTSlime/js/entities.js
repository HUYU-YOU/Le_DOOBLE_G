// ==========================================
// CLASSES DU RTS (Synchronisation PvP)
// ==========================================

let entityIdCounter = 1;

// --- DÉCORATIONS PUREMENT VISUELLES ---
class Decoration {
    constructor(x, y, skin, size) {
        this.x = x; this.y = y; 
        this.skin = skin; 
        this.size = size;
    }
    draw(ctx, images) {
        let img = images[this.skin];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
    }
}

// --- RIVIERE CURATIVE ---
class River {
    constructor(x, y, variant) {
        this.id = entityIdCounter++;
        this.x = x; this.y = y;
        this.type = 'river';
        this.variant = variant; 
        this.radius = 45; 
    }
    draw(ctx, images) {
        let img = images['river' + this.variant];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
        } else {
            ctx.shadowBlur = 15; ctx.shadowColor = 'var(--neon-water)';
            ctx.fillStyle = 'rgba(51, 136, 255, 0.3)';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}

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

        if (typeof survivalTimer !== 'undefined' && survivalTimer < 60) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size/2 + 20, 0, Math.PI*2); ctx.stroke();
        }

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
        if(type === 'sawmill') { this.color = 'var(--neon-orange)'; this.hp = 500; }
        if(type === 'mine') { this.color = 'var(--neon-yellow)'; this.hp = 600; }
        if(type === 'farm') { this.color = 'var(--neon-green)'; this.hp = 400; }
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
                let targets = units.concat(enemies).filter(e => e.owner !== this.owner);
                let closestEnemy = getClosest(this, targets);
                if (closestEnemy && dist(this, closestEnemy) <= 400) {
                    if (typeof survivalTimer !== 'undefined' && survivalTimer < 60 && closestEnemy.owner !== 'virus') {
                    } else {
                        closestEnemy.hp -= 40;
                        spawnLaser(this, closestEnemy, this.color);
                        this.attackCooldown = 1.2; 
                    }
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
        if(this.type === 'sawmill') img = images.sawmill;
        if(this.type === 'farm') img = images.farm;
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
        
        ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);

        if (this.level > 1) {
            ctx.fillStyle = 'var(--neon-yellow)'; ctx.font = '16px Arial'; ctx.fillText('★', this.x + this.size/2 - 10, this.y - this.size/2 + 15);
        }
        if (this.type === 'sawmill' || this.type === 'mine' || this.type === 'farm') {
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
    constructor(x, y, type, skin = null) {
        this.id = entityIdCounter++; this.x = x; this.y = y; this.type = type;
        this.radius = 20; 
        this.amount = type === 'tree' ? 300 : 1000; 
        this.skin = skin; // Skin dynamique (sapin1, bouleau3...)
    }
    draw(ctx, images) {
        let img = this.skin ? images[this.skin] : (this.type === 'wheat' ? images.wheat : null);

        if (img && img.complete && img.naturalWidth > 0) {
            // Dessine l'arbre/blé plus grand
            ctx.drawImage(img, this.x - 40, this.y - 40, 80, 80);
        } else {
            let color = this.type === 'tree' ? 'var(--neon-orange)' : 'var(--neon-green)';
            ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.beginPath();
            if(this.type === 'tree') {
                for (let i = 0; i < 6; i++) ctx.lineTo(this.x + this.radius * Math.cos(i * Math.PI / 3), this.y + this.radius * Math.sin(i * Math.PI / 3));
            } else { ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); }
            ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); ctx.shadowBlur = 0;
        }
    }
}

class Unit {
    constructor(x, y, type, element = 'normal', owner) {
        this.id = entityIdCounter++; this.owner = owner;
        this.x = x; this.y = y; this.type = type; this.element = element;
        this.targetPos = null; this.targetEntityId = null;
        this.state = 'idle'; 
        this.radius = 6; 
        this.drawSize = 20; 
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
        
        if (!entity) {
            this.state = 'moving';
            return;
        }

        if (this.type === 'farmer') {
            if (['tree', 'wheat'].includes(entity.type)) {
                this.state = 'moving_to_res';
            } else if (['farm', 'sawmill', 'mine'].includes(entity.type) && entity.owner === this.owner) {
                this.state = 'moving_to_building';
            } else {
                this.state = 'moving';
            }
        } else {
            if (entity.owner !== this.owner && entity.hp > 0 && !['wheat', 'tree', 'river'].includes(entity.type)) {
                this.state = 'attacking';
            } else {
                this.state = 'moving';
            }
        }
    }

    update(dt) {
        if (this.currentCooldown > 0) this.currentCooldown -= dt;
        if (this.slowTimer > 0) this.slowTimer -= dt;

        let currentSpeed = this.slowTimer > 0 ? this.speed * 0.5 : this.speed;

        let nearRiver = typeof rivers !== 'undefined' ? rivers.find(r => dist(this, r) < this.radius + r.radius) : null;
        if (nearRiver && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 20 * dt); 
        }

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
            if(!targetEnt) targetEnt = enemies.find(e=>e.id===this.targetEntityId);
            if(!targetEnt) targetEnt = rivers.find(r=>r.id===this.targetEntityId);
        }

        if (this.type === 'farmer') {
            if (this.state === 'moving_to_res' && targetEnt) {
                if (dist(this, targetEnt) < this.radius + targetEnt.radius + 5) {
                    this.state = 'gathering'; this.targetPos = null;
                    this.payloadType = targetEnt.type === 'tree' ? 'wood' : 'food';
                }
            } 
            else if (this.state === 'gathering') {
                if(targetEnt && targetEnt.amount > 0) {
                    let gatherAmount = Math.min(15 * dt, targetEnt.amount);
                    this.payload += gatherAmount; 
                    targetEnt.amount -= gatherAmount;
                    
                    if (this.payload >= 20 || targetEnt.amount <= 0) {
                        if (this.payload > 0) {
                            let myBase = this.owner === 'host' ? baseHost : baseGuest;
                            this.targetEntityId = myBase.id;
                            this.targetPos = { x: myBase.x, y: myBase.y }; 
                            this.state = 'returning';
                        } else {
                            this.state = 'idle';
                        }
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
                if (dist(this, targetEnt) <= targetEnt.size/2 + 25) {
                    if(targetEnt.farmersInside < 5) {
                        this.state = 'farming'; targetEnt.farmersInside++; this.targetPos = null;
                    } else { this.state = 'idle'; }
                }
            }
        } 
        else {
            if (this.state === 'attacking' && targetEnt && targetEnt.type !== 'river') {
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
                let possibleTargets = [].concat(units).concat(buildings).concat(enemies).concat([baseHost, baseGuest]);
                let enemy = getClosest(this, possibleTargets.filter(e => e.owner !== this.owner && e.hp > 0));
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
            let possibleTargets = [].concat(units).concat(buildings).concat(enemies).concat([baseHost, baseGuest]);
            possibleTargets.forEach(e => {
                if(e.owner !== this.owner && dist(this, e) <= this.range + 10) this.applyDamage(e);
            });
        } else {
            this.applyDamage(primaryTarget);
            if (this.type === 'mage' && primaryTarget.slowTimer !== undefined) primaryTarget.slowTimer = 2.0; 
        }
    }

    applyDamage(target) {
        if (typeof survivalTimer !== 'undefined' && survivalTimer < 60 && target.owner !== 'virus') {
            return; 
        }

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
            ctx.shadowBlur = 15; ctx.shadowColor = this.elColor;
            ctx.strokeStyle = this.elColor; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.drawSize/2 + 5, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        let nearRiver = typeof rivers !== 'undefined' ? rivers.find(r => dist(this, r) < this.radius + r.radius) : null;
        if (nearRiver && this.hp < this.maxHp) {
            ctx.shadowBlur = 20; ctx.shadowColor = '#39ff14';
            ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.drawSize/2 + 8, 0, Math.PI*2); ctx.stroke();
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

        ctx.strokeStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI*2); ctx.stroke();

        if(this.slowTimer > 0) { 
            ctx.strokeStyle = 'var(--neon-purple)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius+12, 0, Math.PI*2); ctx.stroke();
        }

        if(this.type !== 'farmer' && this.hp < this.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 8, this.y - this.drawSize/2 - 6, 16, 3);
            ctx.fillStyle = 'var(--neon-green)'; ctx.fillRect(this.x - 8, this.y - this.drawSize/2 - 6, 16 * (this.hp/this.maxHp), 3);
        }
        if(this.payload > 0) {
            ctx.fillStyle = this.payloadType === 'wood' ? 'var(--neon-orange)' : 'var(--neon-green)';
            ctx.fillRect(this.x - 5, this.y - this.drawSize/2 - 6, 10 * (this.payload/20), 3);
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.id = entityIdCounter++;
        this.x = x; this.y = y; this.owner = 'virus';
        this.radius = 12;
        this.baseSpeed = 40 + Math.random() * 30;
        this.hp = 100; 
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

        let target = null;
        let minDist = 500; 

        let possibleTargets = [].concat(units).concat(buildings).concat([baseHost, baseGuest]);
        for(let e of possibleTargets) {
            if(e && e.hp > 0 && e.state !== 'farming') {
                let d = dist(this, e);
                if(d < minDist) { minDist = d; target = e; }
            }
        }

        if (target) {
            let d = dist(this, target);
            let range = (target.size ? target.size/2 : target.radius) + this.radius;

            if (d > range + 5) {
                this.x += ((target.x - this.x) / d) * currentSpeed * dt;
                this.y += ((target.y - this.y) / d) * currentSpeed * dt;
            } else if (this.attackCooldown <= 0) {
                if (typeof survivalTimer !== 'undefined' && survivalTimer < 60) {
                } else {
                    target.hp -= 15;
                    this.attackCooldown = 1;
                    spawnParticles(target.x, target.y, this.color, 5);
                }
            }
        } else {
            this.x += (Math.random() - 0.5) * 20 * dt;
            this.y += (Math.random() - 0.5) * 20 * dt;
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
