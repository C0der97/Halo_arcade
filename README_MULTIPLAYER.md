# 🎮 Halo Fight - Multiplayer Online

## 🚀 Inicio Rápido

### 1. Instalar Dependencias del Servidor
```bash
cd server
npm install
```

### 2. Iniciar Servidor
```bash
cd server
npm start
```

El servidor estará disponible en `http://localhost:3000`

### 3. Jugar
Abre **dos navegadores** o **dos ventanas** en `http://localhost:3000` y presiona "🌐 ONLINE" en ambas.

---

## 📁 Estructura del Proyecto

```
halo_fight_game/
├── client/              # Archivos del juego (HTML, CSS, JS)
│   ├── index.html       # Página principal
│   ├── game.js          # Lógica del juego
│   ├── network-manager.js  # Conexión Socket.IO
│   └── ...
├── server/              # Servidor Node.js
│   ├── server.js        # Servidor principal
│   ├── game-room.js     # Gestión de salas
│   ├── game-state.js    # Estado del juego (autoritativo)
│   └── package.json
└── shared/              # Código compartido
    ├── config.js
    └── physics.js
```

---

## 🎯 Modos de Juego

### Local (como antes)
- **VS CPU**: Pelea contra IA
- **VS JUGADOR**: 2 jugadores en el mismo teclado

### Online (**NUEVO**)
- **🌐 ONLINE**: Matchmaking automático con otro jugador online

---

## 🔧 Cómo Funciona

### Servidor
1. **Matchmaking**: Jugadores entran en cola
2. **Emparejamiento**: Cuando 2 jugadores están en cola, se crea una sala
3. **Game Loop**: El servidor actualiza el juego a 60 FPS
4. **Sincronización**: Envía estado a ambos clientes cada frame

### Cliente
1. **Input Local**: Envía controles al servidor
2. **Recibe Estado**: Actualiza posiciones desde el servidor
3. **Renderiza**: Dibuja el juego con el estado recibido

---

## ⚙️ Variables de Entorno

Puedes cambiar el puerto del servidor:
```bash
PORT=8080 npm start
```

---

## 🚀 Deploy (Futuro)

### Opciones gratuitas:
- **Railway.app**: Deploy automático desde GitHub
- **Render.com**: 750 horas/mes gratis
- **Fly.io**: Muy buen free tier

Instrucciones de deploy serán agregadas próximamente.

---

## 🐛 Problemas Comunes

### Error: "Cannot find module 'express'"
```bash
cd server && npm install
```

### Error: "Address already in use"
Otro servidor está usando el puerto 3000:
```bash
PORT=3001 npm start
```

### Lag / Desincronización
El servidor está diseñado para LAN o conexiones locales. Para internet, considera:
- Deploy en servidor cercano geográficamente
- Implementar client-side prediction (futuro)

---

## 📝 Notas Técnicas

- **Tick Rate**: 60 Hz (60 actualizaciones por segundo)
- **Protocolo**: WebSockets (Socket.IO)
- **Arquitectura**: Servidor autoritativo
- **Matchmaking**: Queue-based simple

---

¡Disfruta el multijugador! 🎮🔥
