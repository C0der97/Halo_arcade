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
        this.audioManager = new AudioManager();

        // Players
        this.player1 = null;
        this.player2 = null;

        // Game mode
        this.gameMode = 'vsPlayer'; // 'vsPlayer', 'vsCPU', or 'online'
        this.aiOpponent = null; // AI instance for CPU mode

        // Online mode
        this.isOnlineMode = false;
        this.myPlayerNumber = null; // 1 or 2
        this.networkManager = null;

        // Game state
        this.gameState = 'menu'; // menu, fighting, paused, roundEnd, gameOver
        this.currentRound = 1;
        this.roundTimer = CONFIG.ROUND_TIME;
        this.p1Wins = 0;
        this.p2Wins = 0;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Background wallpaper - always use image during gameplay
        // Video will play on victory for Elite/Brute
        this.backgroundReady = false;
        this.useVideoBackground = false;

        // Load image background (random between wallpaper.png and wallpaper2.png)
        const wallpapers = ['wallpaper.png', 'wallpaper2.png'];
        const randomWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];
        this.backgroundImage = new Image();
        this.backgroundImage.src = `assets/images/${randomWallpaper}`;
        this.backgroundImage.onload = () => {
            this.backgroundReady = true;
            console.log(`Background image loaded: ${randomWallpaper}`);
        };



        // Background
        this.initBackground();

        // Start game loop
        this.loop();
    }

    initBackground() {
        // Fallback gradient (used when video is loading or fails)
        this.bgGradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        this.bgGradient.addColorStop(0, '#0a0e1a');      // Deep space blue
        this.bgGradient.addColorStop(0.3, '#1a2540');    // Darker blue
        this.bgGradient.addColorStop(0.6, '#2d3a5c');    // Mid blue
        this.bgGradient.addColorStop(1, '#0f1419');      // Almost black

        // Create hexagonal tech pattern stars
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT * 0.7, // Only in upper portion
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.002 + 0.001
            });
        }

        // Create energy rings (Halo rings in background)
        this.energyRings = [];
        for (let i = 0; i < 3; i++) {
            this.energyRings.push({
                x: CONFIG.CANVAS_WIDTH * (0.3 + i * 0.2),
                y: CONFIG.CANVAS_HEIGHT * 0.25,
                radius: 80 + i * 40,
                opacity: 0.1 - i * 0.03,
                speed: 0.0005 + i * 0.0002,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    initFight(char1Type, char2Type, gameMode = 'vsPlayer', aiDifficulty = 'easy') {
        console.log(`[Game] initFight STARTED. Mode: ${gameMode}, Difficulty: ${aiDifficulty}`);

        // Set game mode
        this.gameMode = gameMode;

        // Configure input manager with game mode (prevents AI from reading gamepad)
        this.inputManager.setGameMode(gameMode);

        // Create characters based on selection
        this.player1 = this.createCharacter(char1Type, 200, CONFIG.GROUND_Y, 1, 1);
        this.player2 = this.createCharacter(char2Type, CONFIG.CANVAS_WIDTH - 300, CONFIG.GROUND_Y, -1, 2);

        // Initialize AI if in CPU mode
        if (this.gameMode === 'vsCPU') {
            this.aiOpponent = new AI(aiDifficulty);
            console.log(`AI initialized with difficulty: ${aiDifficulty}`);
        } else {
            this.aiOpponent = null;
        }

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

        // Stop victory video if it was playing
        this.useVideoBackground = false;
        if (this.victoryVideo) {
            this.victoryVideo.pause();
            this.victoryVideo.currentTime = 0;
        }

        // Show first round message and announce
        this.uiManager.showMessage('RONDA 1', 1500);

        // Announce first round
        /*if (this.audioManager) {
            this.audioManager.playAnnouncement('Ronda 1');
        }*/

        setTimeout(() => {
            this.uiManager.showMessage('¡PELEA!', 1000);
        }, 1500);

        // Announce Fight
        setTimeout(() => {
            if (this.audioManager) {
                // this.audioManager.playAnnouncement('Fight!');
            }
        }, 1600);
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
            case 'hunter':
                character = new Hunter(x, y, facing, playerNum);
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

        // CRITICAL: Don't update physics/combat during hit freeze
        if (this.effectsManager.isHitFrozen()) {
            // Only update effects during hit freeze
            this.effectsManager.update(deltaTime);
            return;
        }

        // ONLINE MODE: Only send inputs to server, don't process locally
        if (this.isOnlineMode) {
            // Collect input based on which player we are
            const controls = this.myPlayerNumber === 1 ?
                this.inputManager.player1Controls :
                this.inputManager.player2Controls;

            const input = {
                left: this.inputManager.isPressed(controls.left),
                right: this.inputManager.isPressed(controls.right),
                up: this.inputManager.consumeJustPressed(controls.up),
                down: this.inputManager.isPressed(controls.down),
                punch: this.inputManager.consumeJustPressed(controls.punch),
                kick: this.inputManager.consumeJustPressed(controls.kick),
                special: this.inputManager.consumeJustPressed(controls.special),
                block: this.inputManager.isPressed(controls.block)
            };

            this.networkManager.sendInput(input);

            // In online mode, server handles all physics
            // We just update effects and UI
            this.effectsManager.update(deltaTime);
            this.uiManager.updateHealth(1, this.player1.health, this.player1.maxHealth);
            this.uiManager.updateHealth(2, this.player2.health, this.player2.maxHealth);
            this.uiManager.updateTimer(this.roundTimer);
            return;
        }

        // DEBUG LOGGING
        if (!this.debugFrameCount) this.debugFrameCount = 0;
        this.debugFrameCount++;

        if (this.debugFrameCount % 60 === 0) {
            console.log(`[GameLoop] Mode: ${this.gameMode}, P2 AI: ${!!this.aiOpponent}, Online: ${this.isOnlineMode}`);
        }

        // LOCAL MODE (VS Player or VS CPU)
        // Handle player 1 input
        this.inputManager.handleCharacterInput(this.player1, 1);

        // Handle player 2 input OR AI
        if (this.gameMode === 'vsCPU') {
            if (this.debugFrameCount % 60 === 0) console.log('[GameLoop] Executing processing for AI Opponent');

            // Strictly AI controlled
            if (this.aiOpponent) {
                this.aiOpponent.update(this.player2, this.player1, deltaTime);
            } else {
                console.warn('AI Opponent missing in CPU mode, recreating...');
                this.aiOpponent = new AI('medium');
            }
        } else {
            if (this.debugFrameCount % 60 === 0) console.log('[GameLoop] Executing Human Input for Player 2');

            // Human controls player 2 ONLY if NOT in CPU mode
            this.inputManager.handleCharacterInput(this.player2, 2);
        }

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
            this.roundWinner = 1;
        } else if (winner === this.player2) {
            this.p2Wins++;
            this.roundWinner = 2;
        } else {
            this.roundWinner = 0; // Draw
        }

        // Show message and play announcement
        let announcement = 'Draw!';
        let message = '¡EMPATE!';

        if (winner === this.player1) {
            announcement = 'Player One Wins!';
            message = `${winner.name} GANA! (${reason})`;
        } else if (winner === this.player2) {
            announcement = 'Player Two Wins!';
            message = `${winner.name} GANA! (${reason})`;
        }

        this.uiManager.showMessage(message, 2500);

        // Play voice announcement
        /*if (this.audioManager) {
            this.audioManager.playAnnouncement(announcement);
        }*/

        // Check if someone won the match
        setTimeout(() => {
            if (this.p1Wins >= 2) {
                this.endGame(this.player1);
            } else if (this.p2Wins >= 2) {
                this.endGame(this.player2);
            } else {
                this.resetRound();
            }
        }, 2500);
    }

    resetRound() {
        // Start next round
        this.currentRound++;
        this.player1.reset(200, CONFIG.GROUND_Y);
        this.player2.reset(CONFIG.CANVAS_WIDTH - 300, CONFIG.GROUND_Y);
        this.roundTimer = CONFIG.ROUND_TIME;
        this.gameState = 'fighting';
        this.effectsManager.clear();

        // Reset AI if in CPU mode
        if (this.aiOpponent) {
            this.aiOpponent.reset();
        }

        this.uiManager.updateRound(this.currentRound);
        this.uiManager.showMessage(`RONDA ${this.currentRound}`, 1500);

        // Announce Round
        /*if (this.audioManager) {
            this.audioManager.playAnnouncement(`Ronda ${this.currentRound}`);
        }*/

        setTimeout(() => {
            this.gameState = 'fighting';
            this.uiManager.showMessage('¡PELEA!', 1000);
        }, 1500);

        // Announce Fight separately to ensure it plays
        setTimeout(() => {
            if (this.audioManager) {
                // this.audioManager.playAnnouncement('Fight!');
            }
        }, 1600);
    }

    endGame(winner) {
        // Use 'victory' state to keep rendering but stop updates
        this.gameState = 'victory';
        this.victoryWinner = winner;

        // Clear visual effects (hit flashes, etc.)
        this.effectsManager.clear();

        // Reset character visual states so they look normal during victory
        if (this.player1) {
            this.player1.isHurt = false;
            this.player1.isAttacking = false;
            this.player1.hurtTimer = 0;
        }
        if (this.player2) {
            this.player2.isHurt = false;
            this.player2.isAttacking = false;
            this.player2.hurtTimer = 0;
        }

        // Play victory announcement
        /*if (this.audioManager) {
            this.audioManager.playAnnouncement('Victoria');
        }*/



        // Show victory screen after delay
        this.uiManager.showVictory(winner.name);
    }

    // ===== ONLINE MODE METHODS =====

    initOnlineMode() {
        if (!this.networkManager) {
            this.networkManager = new NetworkManager(this);

            this.onlineStatusCallback = (status) => {
                console.log('Status:', status);
                if (status === 'connected') {
                    // Wait a bit for connection to stabilize, then find match
                    setTimeout(() => {
                        console.log('Finding match...');
                        this.networkManager.findMatch();
                    }, 100);
                } else if (status === 'waiting') {
                    this.uiManager.showMessage('Buscando oponente...', 10000);
                }
            };

            // Connect to server
            this.networkManager.connect();
        } else {
            // Already connected, just find match
            this.networkManager.findMatch();
        }
    }

    startOnlineMatch(playerNumber) {
        this.isOnlineMode = true;
        this.myPlayerNumber = playerNumber;
        this.gameMode = 'online';

        console.log(`Starting online match as Player ${playerNumber}`);

        // Create default characters for now
        this.player1 = this.createCharacter('chief', 200, CONFIG.GROUND_Y, 1, 1);
        this.player2 = this.createCharacter('chief', CONFIG.CANVAS_WIDTH - 300, CONFIG.GROUND_Y, -1, 2);

        // Update UI
        this.uiManager.updatePlayerNames('JUGADOR 1', 'JUGADOR 2');
        this.uiManager.updateRound(1);

        // Switch to game screen
        this.uiManager.showScreen('game-screen');
        this.gameState = 'fighting';

        // Show and announce round start
        this.uiManager.showMessage('RONDA 1', 1500);
        if (this.audioManager) {
            this.audioManager.playAnnouncement('Ronda 1');
        }

        setTimeout(() => {
            this.uiManager.showMessage('¡PELEA!', 1000);
            if (this.audioManager) {
                this.audioManager.playAnnouncement('Fight!');
            }
        }, 1600);
    }

    updateFromServer(state) {
        if (!this.isOnlineMode) return;

        // Update player positions and states from server
        if (this.player1) {
            this.player1.x = state.player1.x;
            this.player1.y = state.player1.y;
            this.player1.health = state.player1.health;
            this.player1.facing = state.player1.facing;
            this.player1.isAttacking = state.player1.isAttacking;
            this.player1.isBlocking = state.player1.isBlocking;
            this.player1.attackType = state.player1.attackType; // For correct sprite
        }

        if (this.player2) {
            this.player2.x = state.player2.x;
            this.player2.y = state.player2.y;
            this.player2.health = state.player2.health;
            this.player2.facing = state.player2.facing;
            this.player2.isAttacking = state.player2.isAttacking;
            this.player2.isBlocking = state.player2.isBlocking;
            this.player2.attackType = state.player2.attackType; // For correct sprite
        }

        this.roundTimer = state.roundTimer;
        this.p1Wins = state.p1Wins;
        this.p2Wins = state.p2Wins;
        this.currentRound = state.currentRound;

        // Update UI
        this.uiManager.updateHealth(1, this.player1.health, 100);
        this.uiManager.updateHealth(2, this.player2.health, 100);
        this.uiManager.updateTimer(this.roundTimer);
    }

    onGameOver(winner) {
        const winnerName = winner === 1 ? 'JUGADOR 1' : 'JUGADOR 2';
        this.endGame({ name: winnerName });
    }

    returnToMenu() {
        this.isOnlineMode = false;
        this.myPlayerNumber = null;
        if (this.networkManager) {
            this.networkManager.leaveRoom();
        }
        this.uiManager.showScreen('menu');
        this.gameState = 'menu';
    }

    render() {
        // Clear canvas first to prevent visual artifacts
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // DEBUG: Uncomment to see Game State
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`MODE: ${this.gameMode}`, 10, 20);
        this.ctx.fillText(`AI: ${this.aiOpponent ? 'ACTIVE' : 'NULL'}`, 10, 40);
        this.ctx.restore();

        // Draw background wallpaper (video or image) or fallback gradient
        if (this.backgroundReady && this.backgroundImage) {
            // Draw image at full canvas size
            this.ctx.drawImage(this.backgroundImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        } else {
            // Fallback to gradient while loading
            this.ctx.fillStyle = this.bgGradient;
            this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }

        // Draw energy rings (animated Halo rings)
        this.energyRings.forEach(ring => {
            ring.angle += ring.speed;

            this.ctx.save();
            this.ctx.globalAlpha = ring.opacity;
            this.ctx.strokeStyle = '#00d4ff';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.ellipse(
                ring.x,
                ring.y,
                ring.radius,
                ring.radius * 0.3,
                ring.angle,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw twinkling stars
        this.stars.forEach(star => {
            // Twinkle effect
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 0.8 || star.opacity < 0.3) {
                star.twinkleSpeed *= -1;
            }

            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);

            // Add glow to some stars
            if (star.size > 1.5) {
                this.ctx.fillStyle = `rgba(0, 212, 255, ${star.opacity * 0.3})`;
                this.ctx.fillRect(star.x - 1, star.y - 1, star.size + 2, star.size + 2);
            }
        });

        // Draw hexagonal tech pattern in upper area
        this.ctx.save();
        this.ctx.globalAlpha = 0.05;
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 1;
        const hexSize = 40;
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += hexSize * 1.5) {
            for (let y = 0; y < CONFIG.CANVAS_HEIGHT * 0.4; y += hexSize * 1.3) {
                this.drawHexagon(x, y, hexSize);
            }
        }
        this.ctx.restore();

        // Platform removed - using wallpaper background instead
        /*
        // Draw futuristic platform/ground
        const platformY = CONFIG.GROUND_Y + 60;
    
        // Platform shadow/depth
        const depthGrad = this.ctx.createLinearGradient(0, platformY - 20, 0, CONFIG.CANVAS_HEIGHT);
        depthGrad.addColorStop(0, 'rgba(10, 20, 40, 0.8)');
        depthGrad.addColorStop(1, 'rgba(5, 10, 20, 0.95)');
        this.ctx.fillStyle = depthGrad;
        this.ctx.fillRect(0, platformY - 20, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
        // Platform main surface
        const platformGrad = this.ctx.createLinearGradient(0, platformY, 0, platformY + 40);
        platformGrad.addColorStop(0, '#1a3a4a');
        platformGrad.addColorStop(0.5, '#0f2530');
        platformGrad.addColorStop(1, '#0a1419');
        this.ctx.fillStyle = platformGrad;
        this.ctx.fillRect(0, platformY, CONFIG.CANVAS_WIDTH, 40);
    
        // Glowing platform edge
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003) * 0.2; // Pulse effect
        this.ctx.beginPath();
        this.ctx.moveTo(0, platformY);
        this.ctx.lineTo(CONFIG.CANVAS_WIDTH, platformY);
        this.ctx.stroke();
    
        // Tech details on platform
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 1;
        for (let x = 50; x < CONFIG.CANVAS_WIDTH; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, platformY + 10);
            this.ctx.lineTo(x + 30, platformY + 10);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
        */


        // Apply screen shake
        const shake = Utils.screenShake.update(this.deltaTime);
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Characters and effects
        this.player1?.render(this.ctx);
        this.player2?.render(this.ctx);
        this.effectsManager.render(this.ctx);

        this.ctx.restore();

        // Render combo counters (outside screen shake so they stay stable)
        this.combatManager.renderProjectiles(this.ctx, CONFIG.CANVAS_WIDTH);
    }

    drawHexagon(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + size * Math.cos(angle);
            const hy = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
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
