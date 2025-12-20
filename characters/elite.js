// Elite (Sangheili) - Fast and agile warrior
class Elite extends Character {
    constructor(x, y, facing, playerNum) {
        super(x, y, facing, playerNum);

        // Character identity
        this.name = 'ELITE';

        // Stats - Fast and agile, but less tanky
        this.speed = 7;
        this.jumpForce = -19;
        this.maxHealth = 85;
        this.health = 85;

        // Visual
        this.primaryColor = '#8b00ff';
        this.secondaryColor = '#6600cc';
        this.width = 95;   // Elite: 2.4m - Taller but slender
        this.height = 170; // +13% taller than Chief (2.4m/2.1m ≈ 1.14)

        // Load individual sprites
        this.loadIndividualSprites('elite');
    }

    setupAnimations() {
        this.animationSystem.addAnimation('idle', [0], 180);
        this.animationSystem.addAnimation('walk', [0, 1, 2, 1], 90); // Faster walk
        this.animationSystem.addAnimation('jump', [0], 80);
        this.animationSystem.addAnimation('attack', [0, 1, 2], 70); // Faster attacks
        this.animationSystem.addAnimation('hurt', [0], 100);
        this.animationSystem.addAnimation('block', [0], 100);
        this.animationSystem.play('idle');
    }

    // Override special - Energy Sword Lunge
    special() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.performAttack('special', 450, 22);
            // Lunge forward
            this.velocityX = this.facing * 12;
        }
    }
}
