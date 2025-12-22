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
        this.width = 300;  // Brute: El más grande (sprite 800x800)
        this.height = 300; // Cuadrado como su sprite

        // Load individual sprites with multi-frame configuration
        // walk: 3 frames (brute_walk1.png, brute_walk2.png, brute_walk3.png)
        // hurt: 2 frames (brute_hurt1.png, brute_hurt2.png)
        // jump: 2 frames (brute_jump1.png, brute_jump2.png)
        // punch: 3 frames (brute_punch1.png, brute_punch2.png, brute_punch3.png)
        this.loadIndividualSprites('brute', {
            walk: 3,
            hurt: 2,
            jump: 2,
            special: 3  // Uses 3 frame special animation
        });
    }

    setupAnimations() {
        this.animationSystem.addAnimation('idle', [0], 250); // Slower idle
        this.animationSystem.addAnimation('walk', [0, 1, 2, 1], 150); // Heavy walk cycle using 3 frames
        this.animationSystem.addAnimation('jump', [0, 1], 120); // Jump animation with 2 frames
        this.animationSystem.addAnimation('attack', [0, 1, 2], 110); // Slower but heavier attacks
        this.animationSystem.addAnimation('hurt', [0, 1, 0], 100); // Hurt animation alternating 2 frames
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
