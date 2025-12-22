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
        this.width = 250;  // Elite: Cuadrado como su sprite (800x800)
        this.height = 250; // Sprite cuadrado, mismo width y height

        // Load individual sprites with multi-frame configuration
        this.loadIndividualSprites('elite', {
            idle: 3,    // elite_idle1.png, elite_idle2.png, elite_idle3.png
            walk: 2,    // elite_walk1.png, elite_walk2.png
            jump: 3,    // elite_jump1.png to elite_jump3.png
            hurt: 2,    // elite_hurt1.png, elite_hurt2.png
            special: 3  // elite_special1.png to elite_special3.png
        });
    }

    setupAnimations() {
        this.animationSystem.addAnimation('idle', [0, 1, 2, 1], 180); // 3 frame idle loop
        this.animationSystem.addAnimation('walk', [0, 1, 0, 1], 90); // 2 frame walk cycle
        this.animationSystem.addAnimation('jump', [0, 1, 2], 80); // 3 frame jump
        this.animationSystem.addAnimation('attack', [0, 1, 2], 70); // Faster attacks
        this.animationSystem.addAnimation('hurt', [0, 1, 0], 100); // 2 frame hurt
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
