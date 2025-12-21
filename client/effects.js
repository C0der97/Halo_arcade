// Visual Effects System - Capcom Style
class EffectsManager {
    constructor() {
        this.particles = [];
        this.effects = [];

        // Hit freeze system
        this.hitFreezeTimer = 0;
        this.hitFreezeDuration = 0;
        this.timeScale = 1.0;

        // Screen flash
        this.screenFlash = { active: false, alpha: 0, color: '#ffffff' };
    }

    update(deltaTime) {
        // Apply time scale for slow motion
        const scaledDelta = deltaTime * this.timeScale;

        // Update hit freeze
        if (this.hitFreezeTimer > 0) {
            this.hitFreezeTimer -= deltaTime;
            return; // Don't update anything during freeze
        }

        // Update screen flash
        if (this.screenFlash.active) {
            this.screenFlash.alpha -= deltaTime * 0.01;
            if (this.screenFlash.alpha <= 0) {
                this.screenFlash.active = false;
            }
        }

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.life -= scaledDelta;
            particle.x += particle.vx * (scaledDelta / 16);
            particle.y += particle.vy * (scaledDelta / 16);
            particle.vy += 0.3 * (scaledDelta / 16); // gravity
            particle.alpha = particle.life / particle.maxLife;

            // Update rotation if exists
            if (particle.rotation !== undefined) {
                particle.rotation += particle.rotationSpeed * (scaledDelta / 16);
            }

            return particle.life > 0;
        });

        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.timer -= scaledDelta;
            if (effect.update) {
                effect.update(scaledDelta);
            }
            return effect.timer > 0;
        });
    }

    render(ctx) {
        // Render particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;

            if (particle.rotation !== undefined) {
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.fillStyle = particle.color;
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            } else {
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            }

            ctx.restore();
        });

        // Render effects
        this.effects.forEach(effect => {
            effect.render(ctx);
        });

        // Render screen flash (on top of everything)
        if (this.screenFlash.active && this.screenFlash.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.screenFlash.alpha;
            ctx.fillStyle = this.screenFlash.color;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
    }

    // HIT FREEZE - Pause game on impact (Capcom style)
    triggerHitFreeze(duration = 80, intensity = 'normal') {
        // Different freeze durations based on hit strength
        const freezeDurations = {
            light: 40,
            normal: 80,
            heavy: 120,
            super: 200
        };

        this.hitFreezeDuration = freezeDurations[intensity] || duration;
        this.hitFreezeTimer = this.hitFreezeDuration;
    }

    isHitFrozen() {
        return this.hitFreezeTimer > 0;
    }

    // SCREEN FLASH - White flash on critical hits
    triggerScreenFlash(color = '#ffffff', intensity = 0.8) {
        this.screenFlash.active = true;
        this.screenFlash.alpha = intensity;
        this.screenFlash.color = color;
    }

    // SLOW MOTION - For special moves
    setTimeScale(scale, duration = 1000) {
        this.timeScale = scale;
        setTimeout(() => {
            this.timeScale = 1.0;
        }, duration);
    }

    // ENHANCED HIT SPARK - More particles and variety
    createHitSpark(x, y, color = '#ffff00', intensity = 'normal') {
        const particleCounts = {
            light: 10,
            normal: 20,
            heavy: 30,
            super: 50
        };

        const count = particleCounts[intensity] || 20;
        const colors = [color, '#ffffff', '#ffaa00'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Utils.random(-0.1, 0.1);
            const speed = Utils.random(5, 12);
            const particleColor = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(4, 10),
                color: particleColor,
                life: Utils.random(400, 700),
                maxLife: 700,
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Utils.random(-0.2, 0.2)
            });
        }
    }

    // IMPACT RING - Expanding ring on heavy hits
    createImpactRing(x, y, color = '#ffffff', maxRadius = 80) {
        this.effects.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: maxRadius,
            timer: 400,
            maxTimer: 400,
            color: color,
            update(deltaTime) {
                this.radius = this.maxRadius * (1 - this.timer / this.maxTimer);
            },
            render(ctx) {
                const alpha = this.timer / this.maxTimer;
                const thickness = 4 + (1 - alpha) * 6;

                ctx.save();
                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    // Create impact flash (enhanced)
    createImpactFlash(x, y, radius = 60, color = '#ffffff') {
        this.effects.push({
            x: x,
            y: y,
            radius: radius,
            timer: 200,
            maxTimer: 200,
            color: color,
            render(ctx) {
                const alpha = this.timer / this.maxTimer;
                const scale = 1 + (1 - alpha) * 0.5;

                // Outer glow
                ctx.save();
                ctx.globalAlpha = alpha * 0.3;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * scale);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
                ctx.fill();

                // Inner flash
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, (this.radius * scale) * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
    }

    // SPEED LINES - Motion lines on fast attacks
    createSpeedLines(x, y, direction, count = 8) {
        for (let i = 0; i < count; i++) {
            const length = Utils.random(40, 100);
            const offset = Utils.random(-50, 50);

            this.effects.push({
                startX: x + Math.cos(direction) * 20,
                startY: y + Math.sin(direction) * 20 + offset,
                endX: x + Math.cos(direction) * length,
                endY: y + Math.sin(direction) * length + offset,
                timer: 200,
                maxTimer: 200,
                thickness: Utils.random(2, 5),
                render(ctx) {
                    const alpha = this.timer / this.maxTimer;
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = this.thickness;
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(this.endX, this.endY);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }
    }

    // Create blood/energy particles (enhanced)
    createBloodEffect(x, y, color = '#ff0000', intensity = 'normal') {
        const counts = { light: 8, normal: 15, heavy: 25 };
        const count = counts[intensity] || 15;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-6, 6),
                vy: Utils.random(-10, -3),
                size: Utils.random(2, 6),
                color: color,
                life: Utils.random(600, 1000),
                maxLife: 1000,
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Utils.random(-0.1, 0.1)
            });
        }
    }

    // Create dust clouds when landing/moving
    createDustCloud(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + Utils.random(-30, 30),
                y: y,
                vx: Utils.random(-3, 3),
                vy: Utils.random(-2, 0),
                size: Utils.random(6, 12),
                color: 'rgba(150, 150, 150, 0.5)',
                life: 800,
                maxLife: 800,
                alpha: 0.5
            });
        }
    }

    // GROUND SHOCKWAVE - For ground pounds and heavy landings
    createGroundShockwave(x, y, direction = 1) {
        const groundY = y + 10;

        for (let i = 0; i < 3; i++) {
            this.effects.push({
                x: x,
                y: groundY,
                width: 0,
                maxWidth: 150 + i * 50,
                height: 15 - i * 3,
                direction: direction,
                timer: 500 - i * 100,
                maxTimer: 500,
                delay: i * 50,
                update(deltaTime) {
                    if (this.delay > 0) {
                        this.delay -= deltaTime;
                        return;
                    }
                    this.width = this.maxWidth * (1 - this.timer / this.maxTimer);
                },
                render(ctx) {
                    if (this.delay > 0) return;

                    const alpha = this.timer / this.maxTimer;
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillStyle = '#00d4ff';
                    ctx.fillRect(
                        this.x,
                        this.y - this.height / 2,
                        this.width * this.direction,
                        this.height
                    );
                    ctx.restore();
                }
            });
        }
    }

    clear() {
        this.particles = [];
        this.effects = [];
        this.hitFreezeTimer = 0;
        this.timeScale = 1.0;
        this.screenFlash.active = false;
    }
}
