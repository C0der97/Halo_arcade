// Brute (Jiralhanae) - Powerful and heavy hitter
class Brute extends Character {
    constructor(x, y, facing, playerNum) {
        super(x, y, facing, playerNum);

        // Character identity
        this.name = 'BRUTE';

        // Stats - Slow but devastating
        this.speed = 4;
        this.jumpForce = -15;
        this.maxHealth = 120;
        this.health = 120;

        // Visual
        this.primaryColor = '#ff3333';
        this.secondaryColor = '#aa0000';
        this.width = 140;  // Brute: 2.7m - Much wider for massive gorilla-like build (+40% vs Chief)
        this.height = 210; // +40% taller than Chief - truly imposing

        // Load individual sprites
        this.loadIndividualSprites('brute');
    }

    setupAnimations() {
        this.animationSystem.addAnimation('idle', [0], 250); // Slower idle
        this.animationSystem.addAnimation('walk', [0, 1, 2, 1], 150); // Heavy walk
        this.animationSystem.addAnimation('jump', [0], 120);
        this.animationSystem.addAnimation('attack', [0, 1, 2], 110); // Slower but heavier attacks
        this.animationSystem.addAnimation('hurt', [0], 100);
        this.animationSystem.addAnimation('block', [0], 100);
        this.animationSystem.play('idle');
    }

    // Override punch - more damage
    punch() {
        this.performAttack('punch', 350, 12); // Higher damage than base
    }

    // Override kick - even more damage
    kick() {
        this.performAttack('kick', 450, 16);
    }

    // Override special - Gravity Hammer Smash
    special() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.performAttack('special', 700, 28); // Devastating damage
            // Slight forward movement
            this.velocityX = this.facing * 3;
        }
    }
}
