// Visual Effects System
class EffectsManager {
    constructor() {
        this.particles = [];
        this.effects = [];
    }

    update(deltaTime) {
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // gravity
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });

        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.timer -= deltaTime;
            return effect.timer > 0;
        });
    }

    render(ctx) {
        // Render particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.restore();
        });

        // Render effects
        this.effects.forEach(effect => {
            effect.render(ctx);
        });
    }

    // Create hit spark effect
    createHitSpark(x, y, color = '#ffff00') {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = Utils.random(3, 8);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(3, 6),
                color: color,
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    }

    // Create impact flash
    createImpactFlash(x, y, radius = 50) {
        this.effects.push({
            x: x,
            y: y,
            radius: radius,
            timer: 150,
            maxTimer: 150,
            render(ctx) {
                const alpha = this.timer / this.maxTimer;
                const scale = 1 + (1 - alpha);
                ctx.save();
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
    }

    // Create blood/energy particles
    createBloodEffect(x, y, color = '#ff0000') {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-5, 5),
                vy: Utils.random(-8, -3),
                size: Utils.random(2, 5),
                color: color,
                life: 800,
                maxLife: 800,
                alpha: 1
            });
        }
    }

    // Create dust clouds when landing/moving
    createDustCloud(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + Utils.random(-20, 20),
                y: y,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-1, 0),
                size: Utils.random(4, 8),
                color: 'rgba(150, 150, 150, 0.5)',
                life: 600,
                maxLife: 600,
                alpha: 0.5
            });
        }
    }

    clear() {
        this.particles = [];
        this.effects = [];
    }
}
