# Halo Fight Game

Un juego de pelea 2D estilo Street Fighter con personajes del universo Halo.

## Personajes

### Master Chief
- **Estilo**: Balanceado
- **Velocidad**: ⭐⭐⭐⭐
- **Fuerza**: ⭐⭐⭐⭐
- **Defensa**: ⭐⭐⭐⭐⭐
- **Especial**: Energy Shield Bash - Embestida con escudo que causa daño y empuje

### Elite (Sangheili)
- **Estilo**: Rápido y Ágil
- **Velocidad**: ⭐⭐⭐⭐⭐
- **Fuerza**: ⭐⭐⭐⭐
- **Defensa**: ⭐⭐⭐
- **Especial**: Energy Sword Lunge - Estocada rápida con espada de energía

### Brute (Jiralhanae)
- **Estilo**: Poderoso y Tanque
- **Velocidad**: ⭐⭐⭐
- **Fuerza**: ⭐⭐⭐⭐⭐
- **Defensa**: ⭐⭐⭐⭐
- **Especial**: Gravity Hammer Smash - Golpe devastador con martillo de gravedad

## Controles

### Jugador 1
- **A / D** - Mover (izquierda/derecha)
- **W** - Saltar (doble salto disponible)
- **G** - Puño (daño ligero)
- **H** - Patada (daño medio)
- **J** - Ataque Especial (daño alto)
- **ESPACIO** - Bloquear (reduce daño 100%)

### Jugador 2
- **Flechas ← / →** - Mover
- **Flecha ↑** - Saltar (doble salto disponible)
- **NUMPAD 1** - Puño
- **NUMPAD 2** - Patada
- **NUMPAD 3** - Ataque Especial
- **NUMPAD 0** - Bloquear

## Cómo Jugar

1. Abre `index.html` en tu navegador (recomendado: Chrome/Firefox)
2. Selecciona tu personaje (Jugador 1 elige primero)
3. Jugador 2 selecciona su personaje
4. ¡Presiona "¡PELEAR!" y comienza la batalla!

## Reglas

- **Rounds**: Mejor de 3 rounds
- **Tiempo**: 99 segundos por round
- **Victoria**: Reduce la vida del oponente a 0 o ten más vida cuando se acabe el tiempo
- **Combos**: Encadena ataques rápidamente para aumentar el daño
- **Bloqueo**: Mantén presionado el botón de bloqueo para reducir el daño recibido

## Características

✨ 3 personajes únicos con diferentes estilos de pelea
🎨 Diseño premium con temática Halo
💥 Efectos visuales de impacto y partículas
🎯 Sistema de combate con hitboxes y combos
🛡️ Mecánica de bloqueo y defensa
⏱️ Sistema de rounds y contador de tiempo
🏆 Pantalla de victoria

## Ejecución Local

```bash
# Navega a la carpeta del juego
cd halo_fight_game

# Inicia un servidor HTTP simple
python3 -m http.server 8080

# Abre en tu navegador
# http://localhost:8080
```

## Tecnologías

- HTML5 Canvas para renderizado
- JavaScript Vanilla (sin frameworks)
- CSS3 con animaciones y glassmorphism
- Sistema de física 2D personalizado

## Futuras Mejoras

- Más personajes (Arbiter, Grunt, Hunter)
- Efectos de sonido y música
- Modo vs CPU con IA
- Movimientos especiales adicionales
- Escenarios múltiples
- Sistema de rankings

---

¡Disfruta del combate! 👊🎮
