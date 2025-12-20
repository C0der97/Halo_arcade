# Depuración: Salto No Funciona

## Problema Reportado
- Jugador presiona **W** pero el personaje no salta
- Jugador presiona **2** (numpad) y no pasa nada

## Cambios Aplicados

### 1. Fix de Input de Salto
**Archivo**: `input.js` líneas 64-70

**Problema**: La tecla 'up' se estaba limpiando inmediatamente, incluso si el personaje no podía saltar (por estar atacando o herido).

**Solución**: Ahora solo se limpia la tecla si el personaje puede intentar saltar.

```javascript
// Antes
if (this.isPressed(controls.up)) {
    character.jump();
    this.keys[controls.up] = false; // ❌ Siempre limpia
}

// Después  
if (this.isPressed(controls.up)) {
    if (!character.isAttacking && !character.isHurt) {
        character.jump();
        this.keys[controls.up] = false; // ✅ Solo limpia si puede saltar
    }
}
```

## Verificación Paso a Paso

### Para Verificar el Salto:
1. Abre el juego en el navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Presiona **W** en el juego
5. Si no salta, verifica en la consola si hay errores

### Checklist de Diagnóstico:
- [ ] ¿Hiciste **hard refresh** (Ctrl + Shift + R)?
- [ ] ¿El personaje está en el suelo? (No puede saltar si está cayendo)
- [ ] ¿El personaje está atacando? (No puede saltar mientras ataca)
- [ ] ¿Hay algún error en la consola del navegador?

## Controles Actuales

### Jugador 1
- **W** = Saltar (debe funcionar ahora)
- **A/D** = Mover
- **G** = Puño
- **H** = Patada
- **J** = Especial
- **ESPACIO** = Bloquear

### Jugador 2  
- **Flecha Arriba** = Saltar
- **Flechas Izq/Der** = Mover
- **Numpad 1** = Puño (teclado numérico derecho, NO el "1" normal)
- **Numpad 2** = Patada
- **Numpad 3** = Especial
- **Numpad 0** = Bloquear

## Notas Importantes
- **Numpad** = El teclado numérico a la DERECHA del teclado principal
- Si tu teclado no tiene numpad (laptop), el jugador 2 no podrá atacar actualmente
- Considerando agregar controles alternativos (1,2,3 normales) si es necesario
