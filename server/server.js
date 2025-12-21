const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const GameRoom = require('./game-room');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Matchmaking queue and active rooms
const matchmakingQueue = [];
const activeRooms = new Map();

console.log('🎮 Halo Fight Server Starting...\n');

io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    // Find match
    socket.on('findMatch', (playerData) => {
        console.log(`🔍 ${socket.id} looking for match...`);

        // Check if player already in a room
        if (findRoomByPlayer(socket.id)) {
            socket.emit('error', 'Already in a match');
            return;
        }

        // Add to queue
        matchmakingQueue.push(socket.id);
        console.log(` Queue size: ${matchmakingQueue.length}`);

        // Try to match
        if (matchmakingQueue.length >= 2) {
            const player1Id = matchmakingQueue.shift();
            const player2Id = matchmakingQueue.shift();

            // Create room
            const roomId = `room_${Date.now()}`;
            const room = new GameRoom(roomId);

            room.addPlayer(player1Id);
            room.addPlayer(player2Id);

            // Join socket.io room
            io.sockets.sockets.get(player1Id)?.join(roomId);
            io.sockets.sockets.get(player2Id)?.join(roomId);

            activeRooms.set(roomId, room);

            // Notify both players
            io.to(player1Id).emit('matchFound', {
                roomId: roomId,
                playerNumber: 1,
                opponent: player2Id
            });

            io.to(player2Id).emit('matchFound', {
                roomId: roomId,
                playerNumber: 2,
                opponent: player1Id
            });

            console.log(`🎮 Match created: ${roomId}`);
            console.log(`   Player 1: ${player1Id}`);
            console.log(`   Player 2: ${player2Id}\n`);

            // Start game loop
            room.start(io);
        } else {
            socket.emit('waitingForOpponent');
        }
    });

    // Handle player input
    socket.on('input', (inputData) => {
        const roomId = findRoomByPlayer(socket.id);
        if (!roomId) return;

        const room = activeRooms.get(roomId);
        if (!room) return;

        const playerNum = room.getPlayerNumber(socket.id);
        if (playerNum) {
            room.handleInput(playerNum, inputData);
        }
    });

    // Cancel matchmaking
    socket.on('cancelMatchmaking', () => {
        const index = matchmakingQueue.indexOf(socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            console.log(`❌ ${socket.id} cancelled matchmaking`);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ Player disconnected: ${socket.id}`);

        // Remove from queue
        const queueIndex = matchmakingQueue.indexOf(socket.id);
        if (queueIndex !== -1) {
            matchmakingQueue.splice(queueIndex, 1);
        }

        // Handle active game
        const roomId = findRoomByPlayer(socket.id);
        if (roomId) {
            const room = activeRooms.get(roomId);
            if (room) {
                // Notify opponent
                io.to(roomId).emit('opponentDisconnected');

                // Stop game
                room.stop();

                // Clean up
                activeRooms.delete(roomId);
                console.log(`🗑️  Room deleted: ${roomId}\n`);
            }
        }
    });
});

// Helper functions
function findRoomByPlayer(socketId) {
    for (let [roomId, room] of activeRooms) {
        if (room.players.includes(socketId)) {
            return roomId;
        }
    }
    return null;
}

// Server status endpoint
app.get('/status', (req, res) => {
    res.json({
        activeRooms: activeRooms.size,
        queueSize: matchmakingQueue.length,
        connectedPlayers: io.sockets.sockets.size
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`=================================\n`);
});
