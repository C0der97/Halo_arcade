// Combo System - Capcom Fighting Game Style
class ComboSystem {
    constructor() {
        this.currentCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2000; // Reset combo after 2 seconds
        this.maxCombo = 0; // Track highest combo

        // Visual properties
        this.displayScale = 1.0;
        this.displayAlpha = 0;
        this.shakeIntensity = 0;

        // Combo milestones for special effects
        this.milestones = [5, 10, 20, 30, 50];
    }

    addHit(damage = 1) {
        this.currentCombo++;
        this.comboTimer = this.comboTimeout;

        // Update max combo
        if (this.currentCombo > this.maxCombo) {
            this.maxCombo = this.currentCombo;
        }

        // Visual feedback - scale punch
        this.displayScale = 1.5;
        this.displayAlpha = 1.0;

        // Check for milestones
        if (this.milestones.includes(this.currentCombo)) {
            this.shakeIntensity = 0.5;
        }

        return this.currentCombo;
    }

    reset() {
        this.currentCombo = 0;
        this.comboTimer = 0;
        this.displayAlpha = 0;
    }

    update(deltaTime) {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;

            if (this.comboTimer <= 0) {
                this.reset();
            }
        }

        // Animate scale back to normal
        if (this.displayScale > 1.0) {
            this.displayScale -= deltaTime * 0.003;
            if (this.displayScale < 1.0) {
                this.displayScale = 1.0;
            }
        }

        // Fade in/out alpha
        if (this.currentCombo > 0) {
            if (this.displayAlpha < 1.0) {
                this.displayAlpha += deltaTime * 0.005;
            }
        } else {
            if (this.displayAlpha > 0) {
                this.displayAlpha -= deltaTime * 0.003;
            }
        }

        // Reduce shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= deltaTime * 0.003;
        }
    }

    render(ctx, x = 100, y = 150) {
        if (this.currentCombo === 0 && this.displayAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.displayAlpha;

        // Apply shake for milestones
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 10;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 10;

        ctx.translate(x + shakeX, y + shakeY);
        ctx.scale(this.displayScale, this.displayScale);

        // Get combo color based on count
        let comboColor = '#ffffff';
        let glowColor = '#00d4ff';

        if (this.currentCombo >= 50) {
            comboColor = '#ff00ff';
            glowColor = '#ff00ff';
        } else if (this.currentCombo >= 30) {
            comboColor = '#ff0000';
            glowColor = '#ff0000';
        } else if (this.currentCombo >= 20) {
            comboColor = '#ff8800';
            glowColor = '#ff8800';
        } else if (this.currentCombo >= 10) {
            comboColor = '#ffd700';
            glowColor = '#ffd700';
        }

        // Draw combo number with glow
        ctx.font = 'bold 48px Orbitron, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = comboColor;
        ctx.fillText(this.currentCombo, 0, 0);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw "HIT" or "HITS" text
        const hitText = this.currentCombo === 1 ? 'HIT' : 'HITS';
        ctx.font = 'bold 24px Orbitron, Arial';
        ctx.fillStyle = '#ffffff';

        const numberWidth = ctx.measureText(this.currentCombo).width;
        ctx.fillText(hitText, numberWidth + 10, 15);

        // Draw "COMBO!" text for combos >= 3
        if (this.currentCombo >= 3) {
            ctx.font = 'bold 28px Orbitron, Arial';
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;
            ctx.fillText('COMBO!', 0, 55);
        }

        ctx.restore();
    }

    // Render in HUD position
    renderHUD(ctx, canvasWidth) {
        // Position in top-center, slightly to the left
        this.render(ctx, canvasWidth / 2 - 100, 120);
    }

    getComboRank() {
        if (this.maxCombo >= 50) return 'LEGENDARY';
        if (this.maxCombo >= 30) return 'AMAZING';
        if (this.maxCombo >= 20) return 'AWESOME';
        if (this.maxCombo >= 10) return 'GREAT';
        if (this.maxCombo >= 5) return 'GOOD';
        return 'OK';
    }
}
