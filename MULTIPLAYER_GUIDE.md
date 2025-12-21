# 🌐 Guía de Implementación Multijugador

## 📋 Índice
1. [Opciones de Tecnología](#opciones-de-tecnología)
2. [Arquitectura Recomendada](#arquitectura-recomendada)
3. [Implementación Paso a Paso](#implementación-paso-a-paso)
4. [Consideraciones Importantes](#consideraciones-importantes)

---

## 🔧 Opciones de Tecnología

### Opción 1: WebSockets (Recomendada para principiantes)
**✅ Ventajas:**
- Más fácil de implementar
- Buena para juegos con muchos jugadores
- El servidor puede validar las acciones (anti-trampas)

**❌ Desventajas:**
- Requiere servidor always-on (costo)
- Mayor latencia que P2P

**Stack sugerido:**
- Backend: Node.js + Socket.IO
- Hosting: Railway, Render, o Heroku (gratis/barato)

---

### Opción 2: WebRTC (P2P - Peer to Peer)
**✅ Ventajas:**
- Sin servidor permanente (solo para "matchmaking")
- Latencia ultra-baja
- Gratis de operar

**❌ Desventajas:**
- Más complejo de implementar
- Problemas con NAT/Firewalls
- Vulnerable a trampas (el cliente controla todo)

**Stack sugerido:**
- Signaling: PeerJS o Simple-Peer
- STUN/TURN: Google STUN servers (gratis)

---

## 🏗️ Arquitectura Recomendada: WebSockets con Socket.IO

### Componentes Necesarios

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Cliente 1     │◄───────►│   Servidor   │◄───────►│   Cliente 2     │
│  (Navegador)    │         │  (Node.js)   │         │  (Navegador)    │
└─────────────────┘         └──────────────┘         └─────────────────┘
       │                             │                         │
       │  - Envía inputs             │                         │
       │  - Recibe estado            │  - Sincroniza estado    │
       │                             │  - Valida acciones      │
       └─────────────────────────────┴─────────────────────────┘
```

---

## 📝 Implementación Paso a Paso

### FASE 1: Preparar el Juego Actual

#### 1.1 Separar Lógica de Renderizado
Actualmente tu juego mezcla lógica y renderizado. Necesitas separarlos:

**Crear `GameState.js`:**
```javascript
class GameState {
    constructor() {
        this.player1 = { x: 200, y: 310, health: 100, velocityX: 0, velocityY: 0 };
        this.player2 = { x: 900, y: 310, health: 100, velocityX: 0, velocityY: 0 };
        this.roundTimer = 99;
        this.p1Wins = 0;
        this.p2Wins = 0;
    }

    // Métodos para actualizar estado basados en inputs
    applyInput(playerNum, input) {
        // Procesar input y actualizar estado
    }

    update(deltaTime) {
        // Física, colisiones, etc.
    }

    serialize() {
        // Convertir a JSON para enviar al servidor
        return JSON.stringify(this);
    }
}
```

#### 1.2 Crear Sistema de Inputs
```javascript
class InputBuffer {
    constructor() {
        this.inputs = [];
        this.sequenceNumber = 0;
    }

    addInput(keys) {
        this.inputs.push({
            seq: this.sequenceNumber++,
            keys: { ...keys },
            timestamp: Date.now()
        });
    }

    getInputsToSend() {
        const toSend = [...this.inputs];
        this.inputs = [];
        return toSend;
    }
}
```

---

### FASE 2: Crear Servidor Node.js

#### 2.1 Estructura del Proyecto
```
halo_fight_game/
├── client/              ← Tu juego actual (renombrado)
│   ├── index.html
│   ├── game.js
│   └── ...
├── server/              ← NUEVO
│   ├── server.js
│   ├── GameRoom.js
│   ├── GameState.js    (copia del cliente)
│   └── package.json
└── shared/              ← Código compartido
    ├── constants.js
    └── physics.js
```

#### 2.2 Instalar Dependencias
```bash
cd server
npm init -y
npm install express socket.io
```

#### 2.3 Código del Servidor (`server.js`)
```javascript
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Servir archivos estáticos del cliente
app.use(express.static('../client'));

// Salas de juego activas
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);

    // Buscar partida
    socket.on('findMatch', (playerData) => {
        let roomId = findAvailableRoom();
        
        if (!roomId) {
            // Crear nueva sala
            roomId = generateRoomId();
            rooms.set(roomId, {
                players: [socket.id],
                gameState: new GameState(),
                ready: [false, false]
            });
            socket.join(roomId);
            socket.emit('waitingForOpponent');
        } else {
            // Unirse a sala existente
            const room = rooms.get(roomId);
            room.players.push(socket.id);
            socket.join(roomId);
            
            // Notificar a ambos jugadores
            io.to(roomId).emit('matchFound', {
                roomId: roomId,
                players: room.players
            });
            
            startGameLoop(roomId);
        }
    });

    // Recibir inputs del jugador
    socket.on('input', (data) => {
        const roomId = findRoomByPlayer(socket.id);
        if (!roomId) return;

        const room = rooms.get(roomId);
        const playerIndex = room.players.indexOf(socket.id);
        
        // Aplicar input al estado del juego
        room.gameState.applyInput(playerIndex + 1, data);
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        handleDisconnect(socket.id);
    });
});

// Loop del juego (60 FPS)
function startGameLoop(roomId) {
    const room = rooms.get(roomId);
    const TICK_RATE = 1000 / 60; // 60 Hz
    
    room.interval = setInterval(() => {
        // Actualizar estado del juego
        room.gameState.update(TICK_RATE);
        
        // Enviar estado a todos los jugadores
        io.to(roomId).emit('gameState', room.gameState.serialize());
    }, TICK_RATE);
}

function findAvailableRoom() {
    for (let [id, room] of rooms) {
        if (room.players.length === 1) return id;
    }
    return null;
}

function generateRoomId() {
    return 'room_' + Math.random().toString(36).substr(2, 9);
}

function findRoomByPlayer(socketId) {
    for (let [id, room] of rooms) {
        if (room.players.includes(socketId)) return id;
    }
    return null;
}

function handleDisconnect(socketId) {
    const roomId = findRoomByPlayer(socketId);
    if (roomId) {
        const room = rooms.get(roomId);
        clearInterval(room.interval);
        io.to(roomId).emit('opponentDisconnected');
        rooms.delete(roomId);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Servidor escuchando en puerto ${PORT}`);
});
```

---

### FASE 3: Actualizar Cliente

#### 3.1 Crear `NetworkManager.js`
```javascript
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomId = null;
        this.playerNumber = null; // 1 o 2
    }

    connect(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('✅ Conectado al servidor');
            this.connected = true;
        });

        this.socket.on('matchFound', (data) => {
            this.roomId = data.roomId;
            this.playerNumber = data.players.indexOf(this.socket.id) + 1;
            console.log(`🎮 Partida encontrada! Eres jugador ${this.playerNumber}`);
            this.game.startOnlineMatch(this.playerNumber);
        });

        this.socket.on('gameState', (stateJson) => {
            const state = JSON.parse(stateJson);
            this.game.updateFromServer(state);
        });

        this.socket.on('opponentDisconnected', () => {
            alert('El oponente se desconectó');
            this.game.returnToMenu();
        });
    }

    findMatch() {
        if (!this.connected) {
            console.error('No conectado al servidor');
            return;
        }
        this.socket.emit('findMatch', {
            // Datos del jugador si quieres
        });
    }

    sendInput(inputData) {
        if (!this.connected) return;
        this.socket.emit('input', inputData);
    }
}
```

#### 3.2 Modificar `game.js`
```javascript
class Game {
    constructor() {
        // ... código existente ...
        
        this.networkManager = new NetworkManager(this);
        this.isOnline = false;
        this.myPlayerNumber = null;
    }

    // Nuevo método para iniciar partida online
    startOnlineMatch(playerNumber) {
        this.isOnline = true;
        this.myPlayerNumber = playerNumber;
        
        // Solo controlas tu personaje
        if (playerNumber === 1) {
            this.player1 = this.createCharacter('chief', 200, CONFIG.GROUND_Y, 1, 1);
            // player2 se actualiza del servidor
        } else {
            this.player2 = this.createCharacter('chief', 900, CONFIG.GROUND_Y, -1, 2);
            // player1 se actualiza del servidor
        }
        
        this.gameState = 'fighting';
    }

    update(deltaTime) {
        if (this.isOnline) {
            // Solo procesar input del jugador local
            const myPlayer = this.myPlayerNumber === 1 ? this.player1 : this.player2;
            const input = this.inputManager.getInput(this.myPlayerNumber);
            
            // Enviar input al servidor
            this.networkManager.sendInput(input);
            
            // NO actualizar física aquí, esperar al servidor
        } else {
            // Modo local (código original)
            // ... tu código actual ...
        }
    }

    updateFromServer(state) {
        // Actualizar posiciones desde el servidor
        this.player1.x = state.player1.x;
        this.player1.y = state.player1.y;
        this.player1.health = state.player1.health;
        // ... etc para player2 ...
        
        this.roundTimer = state.roundTimer;
    }
}
```

---

### FASE 4: Testing & Despliegue

#### 4.1 Probar Localmente
```bash
# Terminal 1: Iniciar servidor
cd server
node server.js

# Terminal 2: Abrir dos navegadores
# Navegador 1: http://localhost:3000
# Navegador 2: http://localhost:3000
```

#### 4.2 Desplegar Servidor (Gratis)

**Opción A: Railway.app**
1. Crear cuenta en railway.app
2. Conectar repositorio de GitHub
3. Railway detecta Node.js automáticamente
4. Obtener URL pública (ej: `https://tu-juego.railway.app`)

**Opción B: Render.com**
1. Crear cuenta en render.com
2. "New Web Service" → Conectar repo
3. Build Command: `cd server && npm install`
4. Start Command: `cd server && node server.js`

---

## ⚠️ Consideraciones Importantes

### 1. Sincronización y Latencia
- **Interpolación**: Suaviza movimientos entre estados
- **Client-Side Prediction**: Muestra inputs locales inmediatamente
- **Server Reconciliation**: Corrige posición si difiere del servidor

### 2. Seguridad
- ❌ NUNCA confíes en el cliente para decisiones críticas
- ✅ El servidor debe validar TODOS los inputs
- ✅ Usa rate limiting para prevenir spam
- ✅ Verifica que las acciones sean físicamente posibles

### 3. Optimizaciones
- **Delta Compression**: Solo envía cambios, no todo el estado
- **Input Buffering**: Agrupa varios inputs en un paquete
- **Tick Rate**: 30-60 Hz es suficiente (no 144 Hz)

### 4. Manejo de Desconexiones
```javascript
// En el servidor
socket.on('disconnect', () => {
    // Dar 30 segundos de gracia para reconectar
    setTimeout(() => {
        if (!socket.connected) {
            // Declarar victoria al oponente
            endGameDueToDisconnect(roomId);
        }
    }, 30000);
});
```

---

## 📚 Recursos Adicionales

### Tutoriales
- [Real-Time Multiplayer in HTML5](https://buildnewgames.com/real-time-multiplayer/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Fast-Paced Multiplayer (Gabriel Gambetta)](https://www.gabrielgambetta.com/client-server-game-architecture.html)

### Librerías Útiles
- **Socket.IO**: WebSockets simplificados
- **Colyseus**: Framework completo para juegos multijugador
- **PeerJS**: WebRTC P2P simplificado
- **Netcode**: Librería avanzada de sincronización

---

## 🎯 Plan de Acción Sugerido

**Semana 1:** Refactorizar código actual (separar lógica/renderizado)
**Semana 2:** Implementar servidor básico con Socket.IO
**Semana 3:** Cliente se conecta y sincroniza estado
**Semana 4:** Agregar matchmaking y lobbies
**Semana 5:** Testing intensivo, corregir bugs de sincronización
**Semana 6:** Deploy y optimizaciones

---

## 💡 Alternativa Simple: Modo "Hotseat" Primero

Si el multijugador online es muy complejo por ahora, considera:
1. **Local Multiplayer (Hotseat)**: Dos jugadores en el mismo teclado (YA LO TIENES)
2. **Parsec/Steam Remote Play**: Juega local pero comparte pantalla remotamente
3. Luego evoluciona a online cuando estés listo

---

¿Necesitas ayuda implementando alguna parte específica? ¡Dime y te guío paso a paso! 🚀
