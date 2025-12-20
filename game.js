// Main Game Loop
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Game systems
        this.inputManager = new InputManager();
        this.effectsManager = new EffectsManager();
        this.combatManager = new CombatManager(this.effectsManager);
        this.uiManager = new UIManager();

        // Game state
        this.player1 = null;
        this.player2 = null;
        this.gameState = 'menu'; // menu, fighting, paused, roundEnd, gameOver
        this.currentRound = 1;
        this.roundTimer = CONFIG.ROUND_TIME;
        this.p1Wins = 0;
        this.p2Wins = 0;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Background
        this.setupBackground();

        // Start game loop
        this.loop();
    }

    setupBackground() {
        // Create gradient background
        this.bgGradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        this.bgGradient.addColorStop(0, '#001a33');
        this.bgGradient.addColorStop(0.5, '#000a1a');
        this.bgGradient.addColorStop(1, '#000510');

        // Stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random()
            });
        }
    }

    initFight(char1Type, char2Type) {
        // Create characters based on selection
        this.player1 = this.createCharacter(char1Type, 200, CONFIG.GROUND_Y, 1, 1);
        this.player2 = this.createCharacter(char2Type, CONFIG.CANVAS_WIDTH - 300, CONFIG.GROUND_Y, -1, 2);

        // Update UI
        this.uiManager.updatePlayerNames(this.player1.name, this.player2.name);
        this.uiManager.updateRound(this.currentRound);

        // Reset game state
        this.gameState = 'fighting';
        this.roundTimer = CONFIG.ROUND_TIME;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.effectsManager.clear();

        // Show "FIGHT!" message
        this.uiManager.showMessage('¡PELEA!', 1500);
    }

    createCharacter(type, x, y, facing, playerNum) {
        let character;
        switch (type) {
            case 'chief':
                character = new MasterChief(x, y, facing, playerNum);
                break;
            case 'elite':
                character = new Elite(x, y, facing, playerNum);
                break;
            case 'brute':
                character = new Brute(x, y, facing, playerNum);
                break;
            default:
                character = new MasterChief(x, y, facing, playerNum);
        }

        // Adjust Y position so all characters align at ground level by their feet
        // GROUND_Y represents where the feet should be, so subtract character height
        character.y = CONFIG.GROUND_Y - character.height;

        return character;
    }

    update(deltaTime) {
        if (this.gameState !== 'fighting') return;

        // Handle input
        this.inputManager.handleCharacterInput(this.player1, 1);
        this.inputManager.handleCharacterInput(this.player2, 2);

        // Update characters
        this.player1.update(deltaTime, this.player2);
        this.player2.update(deltaTime, this.player1);

        // Update physics collision
        Physics.resolveCollision(this.player1, this.player2);

        // Update combat
        this.combatManager.update(this.player1, this.player2);

        // Update effects
        this.effectsManager.update(deltaTime);

        // Update UI
        this.uiManager.updateHealth(1, this.player1.health, this.player1.maxHealth);
        this.uiManager.updateHealth(2, this.player2.health, this.player2.maxHealth);
        this.uiManager.updateTimer(this.roundTimer);

        // Update timer
        this.roundTimer -= deltaTime / 1000;

        // Check win conditions
        this.checkWinConditions();
    }

    checkWinConditions() {
        let winner = null;
        let reason = '';

        // Check health
        if (!this.player1.isAlive()) {
            winner = this.player2;
            reason = 'K.O.';
        } else if (!this.player2.isAlive()) {
            winner = this.player1;
            reason = 'K.O.';
        }
        // Check timer
        else if (this.roundTimer <= 0) {
            if (this.player1.health > this.player2.health) {
                winner = this.player1;
                reason = 'TIEMPO';
            } else if (this.player2.health > this.player1.health) {
                winner = this.player2;
                reason = 'TIEMPO';
            } else {
                reason = 'EMPATE';
            }
        }

        if (winner || reason === 'EMPATE') {
            this.endRound(winner, reason);
        }
    }

    endRound(winner, reason) {
        this.gameState = 'roundEnd';

        // Update wins
        if (winner === this.player1) {
            this.p1Wins++;
        } else if (winner === this.player2) {
            this.p2Wins++;
        }

        // Show message
        const message = reason === 'EMPATE' ? '¡EMPATE!' : `${winner.name} GANA! (${reason})`;
        this.uiManager.showMessage(message, 2500);

        // Check if someone won the match
        setTimeout(() => {
            if (this.p1Wins >= 2) {
                this.endGame(this.player1);
            } else if (this.p2Wins >= 2) {
                this.endGame(this.player2);
            } else {
                this.nextRound();
            }
        }, 2500);
    }

    nextRound() {
        this.currentRound++;
        this.uiManager.updateRound(this.currentRound);

        // Reset characters
        this.player1.reset(200, CONFIG.GROUND_Y);
        this.player2.reset(CONFIG.CANVAS_WIDTH - 300, CONFIG.GROUND_Y);

        // Reset timer
        this.roundTimer = CONFIG.ROUND_TIME;

        // Clear effects
        this.effectsManager.clear();

        // Show message and resume
        this.uiManager.showMessage(`ROUND ${this.currentRound}`, 1500);
        setTimeout(() => {
            this.gameState = 'fighting';
            this.uiManager.showMessage('¡PELEA!', 1000);
        }, 1500);
    }

    endGame(winner) {
        this.gameState = 'gameOver';
        this.uiManager.showVictory(winner.name);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.bgGradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Draw ground
        const groundGradient = this.ctx.createLinearGradient(0, CONFIG.GROUND_Y + 20, 0, CONFIG.CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#1a3a4a');
        groundGradient.addColorStop(1, '#0d1f2a');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, CONFIG.GROUND_Y + 80, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Ground line
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.GROUND_Y + 80);
        this.ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y + 80);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;

        // Apply screen shake
        const shake = Utils.screenShake.update(this.deltaTime);
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Draw characters
        if (this.player1) this.player1.render(this.ctx);
        if (this.player2) this.player2.render(this.ctx);

        // Draw effects
        this.effectsManager.render(this.ctx);

        this.ctx.restore();
    }

    loop(currentTime = 0) {
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 50);

        // Update and render
        this.update(this.deltaTime);
        this.render();

        // Continue loop
        requestAnimationFrame((time) => this.loop(time));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    // Make uiManager globally accessible for audio
    window.uiManager = window.game.uiManager;
});
