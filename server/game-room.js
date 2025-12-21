// Game Room - Manages a match between two players
const GameState = require('./game-state');

class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = []; // [socketId1, socketId2]
        this.gameState = new GameState();
        this.interval = null;
        this.lastUpdate = Date.now();
    }

    addPlayer(socketId) {
        if (this.players.length < 2) {
            this.players.push(socketId);
            return this.players.length; // Return player number (1 or 2)
        }
        return null;
    }

    removePlayer(socketId) {
        const index = this.players.indexOf(socketId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    isFull() {
        return this.players.length === 2;
    }

    isEmpty() {
        return this.players.length === 0;
    }

    getPlayerNumber(socketId) {
        const index = this.players.indexOf(socketId);
        return index !== -1 ? index + 1 : null;
    }

    start(io) {
        const TICK_RATE = 1000 / 60; // 60 Hz
        this.lastUpdate = Date.now(); // Reset time to avoid huge delta

        this.interval = setInterval(() => {
            const now = Date.now();
            let deltaTime = now - this.lastUpdate;
            this.lastUpdate = now;

            // Cap delta time to prevent physics explosions (max 50ms)
            deltaTime = Math.min(deltaTime, 50);

            // Update game state
            this.gameState.update(deltaTime);

            // Debug: Log positions every ~60 frames
            if (Math.random() < 0.016) {
                console.log(`P1: (${Math.round(this.gameState.player1.x)}, ${Math.round(this.gameState.player1.y)}) ` +
                    `P2: (${Math.round(this.gameState.player2.x)}, ${Math.round(this.gameState.player2.y)})`);
            }

            // Send state to both players
            const state = this.gameState.serialize();
            io.to(this.id).emit('gameState', state);

            // Check for round end (emit only once)
            if (this.gameState.gameState === 'roundEnd' && !this.roundEndEmitted) {
                this.roundEndEmitted = true;
                const winner = this.gameState.roundWinner;
                console.log(`Round ${this.gameState.currentRound} Over! Winner: P${winner}`);
                io.to(this.id).emit('roundOver', {
                    winner,
                    p1Health: this.gameState.player1.health,
                    p2Health: this.gameState.player2.health
                });
            }

            // Reset flag when game resumes
            if (this.gameState.gameState === 'fighting') {
                this.roundEndEmitted = false;
            }

            // Check if game is over
            if (this.gameState.gameState === 'gameOver') {
                this.stop();
                io.to(this.id).emit('gameOver', {
                    winner: this.gameState.p1Wins > this.gameState.p2Wins ? 1 : 2
                });
            }
        }, TICK_RATE);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    handleInput(playerNum, input) {
        this.gameState.applyInput(playerNum, input);
    }
}

module.exports = GameRoom;
