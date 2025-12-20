// Master Chief - Balanced UNSC Spartan
class MasterChief extends Character {
    constructor(x, y, facing, playerNum) {
        super(x, y, facing, playerNum);

        // Character identity
        this.name = 'MASTER CHIEF';

        // Stats - Balanced fighter
        this.speed = 5.5;
        this.jumpForce = -17;
        this.maxHealth = 100;
        this.health = 100;

        // Visual
        this.primaryColor = '#00ff88';
        this.secondaryColor = '#00aa55';
        this.width = 100;  // Master Chief: 2.1m - Balanced size
        this.height = 150; // Base size for proportional scaling

        // Load individual sprites
        this.loadIndividualSprites('chief');
    }

    setupAnimations() {
        // Simple animations (frame-based)
        this.animationSystem.addAnimation('idle', [0], 200);
        this.animationSystem.addAnimation('walk', [0, 1, 2, 1], 120);
        this.animationSystem.addAnimation('jump', [0], 100);
        this.animationSystem.addAnimation('attack', [0, 1, 2], 90);
        this.animationSystem.addAnimation('hurt', [0], 100);
        this.animationSystem.addAnimation('block', [0], 100);
        this.animationSystem.play('idle');
    }

    // Override special move - Energy Shield Bash
    special() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.performAttack('special', 500, 20);
            // Could add forward dash movement here
            this.velocityX = this.facing * 8;
        }
    }
}
