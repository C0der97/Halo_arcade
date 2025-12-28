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
        this.width = 130;  // Master Chief: Más grande (+30%)
        this.height = 195; // +30% más grande

        // Load individual sprites with multi-frame configuration
        this.loadIndividualSprites('chief', {
            walk: 7,    // chief_walk1.png to chief_walk7.png
            jump: 2,    // chief_jump1.png, chief_jump2.png
            special: 3  // chief_special1.png to chief_special3.png
        });

        // Scale walk sprites to match idle/other actions size
        this.spriteScaleConfig.walk = 1.13;
    }

    setupAnimations() {
        // Animations with new multi-frame sprites
        this.animationSystem.addAnimation('idle', [0], 200);
        this.animationSystem.addAnimation('walk', [0, 1, 2, 3, 4, 5, 6], 100); // 7 frame walk cycle
        this.animationSystem.addAnimation('jump', [0, 1], 100); // 2 frame jump
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
