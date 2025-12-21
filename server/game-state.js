// Game State - Authoritative server-side state
class GameState {
    constructor() {
        this.player1 = {
            x: 200,
            y: 310,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            facing: 1,
            isAttacking: false,
            isBlocking: false,
            isJumping: false,
            attackType: null
        };

        this.player2 = {
            x: 900,
            y: 310,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            facing: -1,
            isAttacking: false,
            isBlocking: false,
            isJumping: false,
            attackType: null
        };

        this.roundTimer = 99;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.gameState = 'fighting';
    }

    applyInput(playerNum, input) {
        const player = playerNum === 1 ? this.player1 : this.player2;

        // Apply movement
        if (input.left) player.velocityX = -5;
        else if (input.right) player.velocityX = 5;
        else player.velocityX = 0;

        // Apply jump
        if (input.up && !player.isJumping) {
            player.velocityY = -18;
            player.isJumping = true;
        }

        // Apply attacks
        if (input.punch && !player.isAttacking) {
            player.isAttacking = true;
            player.attackType = 'punch';
        }
        if (input.kick && !player.isAttacking) {
            player.isAttacking = true;
            player.attackType = 'kick';
        }
        if (input.special && !player.isAttacking) {
            player.isAttacking = true;
            player.attackType = 'special';
        }

        // Apply block
        player.isBlocking = input.block;
    }

    update(deltaTime) {
        // Update physics for both players
        this.updatePlayer(this.player1, deltaTime);
        this.updatePlayer(this.player2, deltaTime);

        // Check collisions
        this.checkHits();

        // Update timer
        this.roundTimer -= deltaTime / 1000;
        if (this.roundTimer <= 0) {
            this.endRound();
        }
    }

    updatePlayer(player, deltaTime) {
        const GROUND_Y = 480; // Must match client CONFIG.GROUND_Y
        const CHARACTER_HEIGHT = 170;

        // Gravity
        if (player.y + CHARACTER_HEIGHT < GROUND_Y) {
            player.velocityY += 0.8; // GRAVITY
        } else {
            player.y = GROUND_Y - CHARACTER_HEIGHT; // 310
            player.velocityY = 0;
            player.isJumping = false;
        }

        // Update position
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Bounds
        player.x = Math.max(0, Math.min(1280 - 120, player.x));

        // Apply friction
        if (player.velocityX !== 0) {
            player.velocityX *= 0.85;
            if (Math.abs(player.velocityX) < 0.1) player.velocityX = 0;
        }

        // Reset attack after delay
        if (player.isAttacking) {
            player.attackFrames = (player.attackFrames || 0) + 1;
            if (player.attackFrames > 20) {
                player.isAttacking = false;
                player.attackType = null;
                player.attackFrames = 0;
            }
        }
    }

    checkHits() {
        // Simple hitbox check
        const p1Box = { x: this.player1.x, y: this.player1.y, width: 120, height: 170 };
        const p2Box = { x: this.player2.x, y: this.player2.y, width: 120, height: 170 };

        if (this.player1.isAttacking && this.overlaps(p1Box, p2Box)) {
            if (!this.player2.isBlocking) {
                const damage = this.player1.attackType === 'special' ? 15 :
                    this.player1.attackType === 'kick' ? 10 : 8;
                this.player2.health = Math.max(0, this.player2.health - damage);
            }
        }

        if (this.player2.isAttacking && this.overlaps(p2Box, p1Box)) {
            if (!this.player1.isBlocking) {
                const damage = this.player2.attackType === 'special' ? 15 :
                    this.player2.attackType === 'kick' ? 10 : 8;
                this.player1.health = Math.max(0, this.player1.health - damage);
            }
        }
    }

    overlaps(box1, box2) {
        return box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y;
    }

    endRound() {
        if (this.player1.health > this.player2.health) {
            this.p1Wins++;
        } else if (this.player2.health > this.player1.health) {
            this.p2Wins++;
        }

        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            this.gameState = 'gameOver';
        } else {
            this.resetRound();
        }
    }

    resetRound() {
        this.currentRound++;
        this.player1.x = 200;
        this.player1.y = 310;
        this.player1.health = 100;
        this.player1.velocityX = 0;
        this.player1.velocityY = 0;

        this.player2.x = 900;
        this.player2.y = 310;
        this.player2.health = 100;
        this.player2.velocityX = 0;
        this.player2.velocityY = 0;

        this.roundTimer = 99;
    }

    serialize() {
        return {
            player1: { ...this.player1 },
            player2: { ...this.player2 },
            roundTimer: this.roundTimer,
            p1Wins: this.p1Wins,
            p2Wins: this.p2Wins,
            currentRound: this.currentRound,
            gameState: this.gameState
        };
    }
}

module.exports = GameState;
