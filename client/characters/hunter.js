// Hunter (Mgalekgolo) - Slow but extremely tanky with devastating attacks
class Hunter extends Character {
    constructor(x, y, facing, playerNum) {
        super(x, y, facing, playerNum);

        // Character identity
        this.name = 'HUNTER';

        // Stats - Very slow but extremely tanky and powerful
        this.speed = 3;
        this.jumpForce = -20; // Más alto pero aún pesado
        this.maxHealth = 150;
        this.health = 150;

        // Visual
        this.primaryColor = '#8a1c1c';
        this.secondaryColor = '#1a1a1d';
        this.width = 160;   // Hunter: Grande pero no excesivo
        this.height = 180;

        // Hunter uses canvas rendering (no sprites needed)
        // Set spriteBaseName so CanvasCharacterRenderer knows which character to draw
        this.spriteBaseName = 'hunter';

        // Attack state for Fuel Rod beam
        this.isBeamFiring = false;
        this.beamTimer = 0;
    }

    setupAnimations() {
        // Hunter uses canvas rendering, but we still need animation states
        this.animationSystem.addAnimation('idle', [0], 300); // Slow breathing
        this.animationSystem.addAnimation('walk', [0, 1, 0, 1], 200); // Heavy steps
        this.animationSystem.addAnimation('jump', [0, 1], 150);
        this.animationSystem.addAnimation('attack', [0, 1, 2], 150); // Slower attacks
        this.animationSystem.addAnimation('hurt', [0, 1, 0], 120);
        this.animationSystem.addAnimation('block', [0], 100);
        this.animationSystem.play('idle');
    }

    // Override punch - Shield bash, high damage
    punch() {
        this.performAttack('punch', 400, 15);
    }

    // Override kick - Heavy stomp
    kick() {
        this.performAttack('kick', 500, 18);
    }

    // Override special - Fuel Rod Cannon
    special() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.performAttack('special', 800, 30); // Devastating damage, slow
            this.isBeamFiring = true;
            this.beamTimer = 25; // Beam duration

            // Play Hunter Shot sound
            const hunterShot = new Audio('assets/sounds/hunter_shot.wav');
            hunterShot.volume = 0.8;
            hunterShot.play().catch(() => { });
        }
    }

    update(deltaTime, opponent) {
        super.update(deltaTime, opponent);

        // Update beam timer
        if (this.isBeamFiring) {
            this.beamTimer--;
            if (this.beamTimer <= 0) {
                this.isBeamFiring = false;
            }
        }
    }

    // Override getHitbox - Fuel Rod Cannon tiene un hitbox MUY largo
    getHitbox() {
        if (!this.isAttacking) return null;

        let hitboxWidth, hitboxHeight, offsetX, offsetY;

        if (this.attackType === 'special') {
            // FUEL ROD CANNON - Rayo largo que atraviesa toda la pantalla
            hitboxWidth = 600;  // Muy largo para el rayo
            hitboxHeight = 50;  // Alto del rayo
            offsetX = this.facing === 1 ? this.width : -hitboxWidth;
            offsetY = this.height * 0.35;
        } else if (this.attackType === 'punch') {
            // SHIELD BASH - Hitbox ancho al frente
            hitboxWidth = 100;
            hitboxHeight = 80;
            offsetX = this.facing === 1 ? this.width * 0.8 : -hitboxWidth;
            offsetY = this.height * 0.2;
        } else if (this.attackType === 'kick') {
            // CANNON MELEE - Golpe con el cañón al frente
            hitboxWidth = 120;
            hitboxHeight = 60;
            offsetX = this.facing === 1 ? this.width * 0.7 : -hitboxWidth;
            offsetY = this.height * 0.25;
        } else {
            // Default
            hitboxWidth = 60;
            hitboxHeight = 60;
            offsetX = this.facing === 1 ? this.width : -hitboxWidth;
            offsetY = this.height * 0.3;
        }

        return {
            x: this.x + offsetX,
            y: this.y + offsetY,
            width: hitboxWidth,
            height: hitboxHeight,
            damage: this.attackDamage
        };
    }
}
