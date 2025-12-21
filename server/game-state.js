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
            console.log(`P${playerNum} JUMP!`);
            player.velocityY = -18;
            player.isJumping = true;
        }

        // Apply attacks (with cooldown check)
        const now = Date.now();
        if (!player.attackCooldown) player.attackCooldown = 0;

        if (now > player.attackCooldown && !player.isAttacking) {
            if (input.punch) {
                console.log(`P${playerNum} PUNCH`);
                player.isAttacking = true;
                player.attackType = 'punch';
                player.hasHit = false; // Reset hit flag
                player.attackCooldown = now + 400; // 400ms cooldown
            } else if (input.kick) {
                console.log(`P${playerNum} KICK`);
                player.isAttacking = true;
                player.attackType = 'kick';
                player.hasHit = false;
                player.attackCooldown = now + 500;
            } else if (input.special) {
                console.log(`P${playerNum} SPECIAL`);
                player.isAttacking = true;
                player.attackType = 'special';
                player.hasHit = false;
                player.attackCooldown = now + 700;
            }
        }

        // Apply block
        player.isBlocking = input.block;
    }

    update(deltaTime) {
        if (this.gameState !== 'fighting') return;

        // Update physics for both players
        this.updatePlayer(this.player1, deltaTime);
        this.updatePlayer(this.player2, deltaTime);

        // Check collisions
        this.checkHits();

        // Check if someone died
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            console.log('ROUND OVER - KO!');
            this.endRound();
            return;
        }

        // Update timer
        this.roundTimer -= deltaTime / 1000;
        if (this.roundTimer <= 0) {
            console.log('ROUND OVER - TIME!');
            this.endRound();
        }
    }

    updatePlayer(player, deltaTime) {
        const GROUND_Y = 480; // Must match client CONFIG.GROUND_Y
        const CHARACTER_HEIGHT = 120; // Must match client Character.js height
        const CANVAS_WIDTH = 1024;
        const CHAR_WIDTH = 80;

        // Apply velocity to position FIRST
        player.x += player.velocityX;
        player.y += player.velocityY;

        // THEN check ground collision
        if (player.y + CHARACTER_HEIGHT >= GROUND_Y) {
            // On ground
            player.y = GROUND_Y - CHARACTER_HEIGHT;
            player.velocityY = 0;
            player.isJumping = false;
        } else {
            // In air - apply gravity
            player.velocityY += 0.8;
        }

        // X Bounds
        player.x = Math.max(0, Math.min(CANVAS_WIDTH - CHAR_WIDTH, player.x));

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
        const CHAR_WIDTH = 80;
        const CHAR_HEIGHT = 120;

        // Hurtboxes (Body)
        const p1Hurtbox = { x: this.player1.x, y: this.player1.y, width: CHAR_WIDTH, height: CHAR_HEIGHT };
        const p2Hurtbox = { x: this.player2.x, y: this.player2.y, width: CHAR_WIDTH, height: CHAR_HEIGHT };

        // Check Player 1 Attack
        if (this.player1.isAttacking && !this.player1.hasHit) {
            const range = 25; // Reduced for close melee combat
            const p1AttackBox = {
                x: this.player1.facing === 1 ? this.player1.x + CHAR_WIDTH : this.player1.x - range,
                y: this.player1.y + 20,
                width: range,
                height: 50
            };

            if (this.overlaps(p1AttackBox, p2Hurtbox) && !this.player2.isBlocking) {
                console.log('HIT! P1 -> P2');
                const damage = this.player1.attackType === 'special' ? 15 :
                    this.player1.attackType === 'kick' ? 12 : 8;
                this.player2.health = Math.max(0, this.player2.health - damage);

                // Knockback
                this.player2.velocityX = this.player1.facing * 2;

                // Mark as hit so it only damages once per attack
                this.player1.hasHit = true;
            }
        }

        // Check Player 2 Attack
        if (this.player2.isAttacking && !this.player2.hasHit) {
            const range = 25; // Reduced for close melee combat
            const p2AttackBox = {
                x: this.player2.facing === 1 ? this.player2.x + CHAR_WIDTH : this.player2.x - range,
                y: this.player2.y + 20,
                width: range,
                height: 50
            };

            if (this.overlaps(p2AttackBox, p1Hurtbox) && !this.player1.isBlocking) {
                console.log('HIT! P2 -> P1');
                const damage = this.player2.attackType === 'special' ? 15 :
                    this.player2.attackType === 'kick' ? 12 : 8;
                this.player1.health = Math.max(0, this.player1.health - damage);

                // Knockback
                this.player1.velocityX = this.player2.facing * 2;

                // Mark as hit so it only damages once per attack
                this.player2.hasHit = true;
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
        // Determine winner
        if (this.player1.health > this.player2.health) {
            this.p1Wins++;
            this.roundWinner = 1;
        } else if (this.player2.health > this.player1.health) {
            this.p2Wins++;
            this.roundWinner = 2;
        } else {
            this.roundWinner = 0; // Draw
        }

        console.log(`P1 Wins: ${this.p1Wins}, P2 Wins: ${this.p2Wins}`);

        // Check if match is over
        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            this.gameState = 'gameOver';
            console.log('MATCH OVER!');
        } else {
            this.gameState = 'roundEnd';
            // Auto-reset after 3 seconds
            setTimeout(() => {
                this.resetRound();
            }, 3000);
        }
    }

    resetRound() {
        this.currentRound++;
        this.player1.x = 200;
        this.player1.y = 360;
        this.player1.health = 100;
        this.player1.velocityX = 0;
        this.player1.velocityY = 0;
        this.player1.isAttacking = false;

        this.player2.x = 900;
        this.player2.y = 360;
        this.player2.health = 100;
        this.player2.velocityX = 0;
        this.player2.velocityY = 0;
        this.player2.isAttacking = false;

        this.roundTimer = 99;
        this.gameState = 'fighting';
        console.log(`Starting Round ${this.currentRound}!`);
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
