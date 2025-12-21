// Network Manager - Handles client-server communication
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomId = null;
        this.playerNumber = null; // 1 or 2
        this.matchmaking = false;
    }

    connect(serverUrl = 'http://localhost:3000') {
        // Include Socket.IO library
        if (typeof io === 'undefined') {
            console.error('Socket.IO client not loaded!');
            return;
        }

        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.connected = true;
            if (this.game.onlineStatusCallback) {
                this.game.onlineStatusCallback('connected');
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.connected = false;
            this.matchmaking = false;
            if (this.game.onlineStatusCallback) {
                this.game.onlineStatusCallback('disconnected');
            }
        });

        this.socket.on('waitingForOpponent', () => {
            console.log('⏳ Waiting for opponent...');
            this.matchmaking = true;
            if (this.game.onlineStatusCallback) {
                this.game.onlineStatusCallback('waiting');
            }
        });

        this.socket.on('matchFound', (data) => {
            console.log(`🎮 Match found! You are Player ${data.playerNumber}`);
            this.roomId = data.roomId;
            this.playerNumber = data.playerNumber;
            this.matchmaking = false;

            // Start online match in game
            this.game.startOnlineMatch(data.playerNumber);
        });

        this.socket.on('gameState', (state) => {
            // Update game from server state
            if (this.game.isOnlineMode) {
                this.game.updateFromServer(state);
            }
        });

        this.socket.on('gameOver', (data) => {
            console.log(`Game Over! Winner: Player ${data.winner}`);
            if (this.game.onGameOver) {
                this.game.onGameOver(data.winner);
            }
        });

        this.socket.on('opponentDisconnected', () => {
            console.log('⚠️ Opponent disconnected');
            alert('Tu oponente se desconectó. Volviendo al menú...');
            this.game.returnToMenu();
        });

        this.socket.on('error', (msg) => {
            console.error('Server error:', msg);
            alert(msg);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    findMatch() {
        if (!this.connected) {
            console.error('Not connected to server');
            alert('No conectado al servidor. Recarga la página.');
            return;
        }

        if (this.matchmaking || this.roomId) {
            console.log('Already in matchmaking or game');
            return;
        }

        console.log('🔍 Looking for match...');
        this.socket.emit('findMatch', {
            // Can send player data here if needed
        });
    }

    cancelMatchmaking() {
        if (this.matchmaking) {
            this.socket.emit('cancelMatchmaking');
            this.matchmaking = false;
            console.log('Matchmaking cancelled');
        }
    }

    sendInput(inputData) {
        if (!this.connected || !this.roomId) return;

        // Send input to server
        this.socket.emit('input', inputData);
    }

    leaveRoom() {
        this.roomId = null;
        this.playerNumber = null;
    }
}
