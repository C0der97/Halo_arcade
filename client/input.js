// Input Manager with Gamepad Support
class InputManager {
    constructor() {
        // Keyboard state
        this.keys = {};

        // Track keys that were just pressed (for one-shot actions like attacks)
        this.justPressed = {};

        // Gamepad state
        this.gamepads = {};
        this.gamepadButtonsPressed = {}; // Track previous frame button state
        this.deadzone = 0.25; // Analog stick deadzone

        // Game mode tracking (to prevent AI from reading gamepad)
        this.gameMode = 'vsPlayer'; // 'vsPlayer', 'vsCPU', or 'online'

        // Keyboard controls
        this.player1Controls = {
            left: 'a',
            right: 'd',
            up: 'w',
            down: 's',
            punch: 'g',
            kick: 'h',
            special: 'j',
            block: ' ' // spacebar
        };

        this.player2Controls = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            down: 'ArrowDown',
            punch: 'Numpad1',
            kick: 'Numpad2',
            special: 'Numpad3',
            block: 'Numpad0'
        };

        // Gamepad button mapping (Standard Gamepad Layout)
        this.gamepadMapping = {
            buttons: {
                0: 'punch',      // A (Xbox) / X (PS) - Bottom button
                1: 'kick',       // B (Xbox) / Circle (PS) - Right button
                2: 'special',    // X (Xbox) / Square (PS) - Left button
                3: 'jump',       // Y (Xbox) / Triangle (PS) - Top button
                4: 'block',      // LB (Xbox) / L1 (PS)
                5: 'block',      // RB (Xbox) / R1 (PS)
                9: 'pause',      // Start button
                12: 'up',        // D-pad up
                13: 'down',      // D-pad down
                14: 'left',      // D-pad left
                15: 'right'      // D-pad right
            },
            axes: {
                0: 'horizontal', // Left stick X-axis
                1: 'vertical'    // Left stick Y-axis
            }
        };

        this.setupListeners();
        this.detectGamepads();
    }

    setupListeners() {
        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            // Track if key was JUST pressed (not held)
            if (!this.keys[e.key.toLowerCase()] && !this.keys[e.key]) {
                this.justPressed[e.key.toLowerCase()] = true;
                this.justPressed[e.key] = true;
            }

            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true; // For arrow keys and numpad

            // Prevent default for spacebar and arrow keys
            if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false;
        });

        // Gamepad connection listeners
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id, 'at index', e.gamepad.index);
            this.gamepads[e.gamepad.index] = e.gamepad;
            this.showGamepadNotification(`Gamepad ${e.gamepad.index + 1} conectado`, true);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Gamepad disconnected:', e.gamepad.id);
            delete this.gamepads[e.gamepad.index];
            this.showGamepadNotification(`Gamepad ${e.gamepad.index + 1} desconectado`, false);
        });
    }

    detectGamepads() {
        // Poll for gamepads (needed for some browsers)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                if (!this.gamepads[i]) {
                    console.log('🎮 Gamepad detected:', gamepads[i].id);
                    this.gamepads[i] = gamepads[i];
                }
            }
        }
    }

    updateGamepads() {
        // Update gamepad state (must be called each frame)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepads[i] = gamepads[i];
            }
        }

        // Ghost Controller Detection (Linux DualSense duplicate fix)
        // If Gamepad 0 and Gamepad 1 have identical state, ignore Gamepad 1
        if (this.gamepads[0] && this.gamepads[1]) {
            if (this.areGamepadsIdentical(this.gamepads[0], this.gamepads[1])) {
                this.ghostGamepadIndex = 1;
                // console.log('Ghost gamepad detected at index 1');
            } else {
                this.ghostGamepadIndex = -1;
            }
        }
    }

    areGamepadsIdentical(gp1, gp2) {
        // Check if buttons are identical
        if (gp1.buttons.length !== gp2.buttons.length) return false;

        // Check a few key buttons for identical values
        // We check specific buttons because some floating point axes might differ slightly
        for (let i = 0; i < 4; i++) { // Check face buttons
            if (gp1.buttons[i].pressed !== gp2.buttons[i].pressed) return false;
            if (gp1.buttons[i].value !== gp2.buttons[i].value) return false;
        }

        // If buttons are pressed, acts as strong signal
        // If NO buttons are pressed, assume identical if axes match
        const gp1Pressed = gp1.buttons.some(b => b.pressed);
        const gp2Pressed = gp2.buttons.some(b => b.pressed);

        if (gp1Pressed !== gp2Pressed) return false;

        // If buttons pressed match, check axes
        if (Math.abs(gp1.axes[0] - gp2.axes[0]) > 0.1) return false;
        if (Math.abs(gp1.axes[1] - gp2.axes[1]) > 0.1) return false;

        return true;
    }

    showGamepadNotification(message, connected) {
        // Show notification if UIManager is available
        if (window.uiManager) {
            window.uiManager.showMessage(message, 2000);
        }
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    // Check if key was just pressed (one-shot) and consume the flag
    consumeJustPressed(key) {
        const keyLower = key.toLowerCase ? key.toLowerCase() : key;

        // Check both original case and lowercase
        if (this.justPressed[key] || this.justPressed[keyLower]) {
            // Clear both
            this.justPressed[key] = false;
            this.justPressed[keyLower] = false;
            return true;
        }
        return false;
    }

    // Set game mode (used to prevent AI from reading gamepad)
    setGameMode(mode) {
        this.gameMode = mode;
    }

    getGamepadInput(playerNum) {
        // In CPU mode, player 2 should NOT read gamepad input (AI controls it)
        if (this.gameMode === 'vsCPU' && playerNum === 2) {
            return null;
        }

        // Player 1 uses gamepad 0, Player 2 uses gamepad 1
        const gamepadIndex = playerNum - 1;

        // Ignore ghost gamepad
        if (gamepadIndex === this.ghostGamepadIndex) {
            return null;
        }

        const gamepad = this.gamepads[gamepadIndex];

        if (!gamepad) return null;

        const input = {
            left: false,
            right: false,
            up: false,
            down: false,
            punch: false,
            kick: false,
            special: false,
            block: false,
            jump: false
        };

        // D-pad buttons
        if (gamepad.buttons[14] && gamepad.buttons[14].pressed) input.left = true;
        if (gamepad.buttons[15] && gamepad.buttons[15].pressed) input.right = true;
        if (gamepad.buttons[12] && gamepad.buttons[12].pressed) input.up = true;
        if (gamepad.buttons[13] && gamepad.buttons[13].pressed) input.down = true;

        // Analog stick (with deadzone)
        const axisX = gamepad.axes[0] || 0;
        const axisY = gamepad.axes[1] || 0;

        if (axisX < -this.deadzone) input.left = true;
        if (axisX > this.deadzone) input.right = true;
        if (axisY < -this.deadzone) input.up = true;
        if (axisY > this.deadzone) input.down = true;

        // Action buttons - use wasPressed to prevent repeated actions
        input.punch = this.wasGamepadButtonPressed(gamepadIndex, 0);
        input.kick = this.wasGamepadButtonPressed(gamepadIndex, 1);
        input.special = this.wasGamepadButtonPressed(gamepadIndex, 2);
        input.jump = this.wasGamepadButtonPressed(gamepadIndex, 3);

        // Block (hold button)
        input.block = (gamepad.buttons[4] && gamepad.buttons[4].pressed) ||
            (gamepad.buttons[5] && gamepad.buttons[5].pressed);

        return input;
    }

    wasGamepadButtonPressed(gamepadIndex, buttonIndex) {
        const gamepad = this.gamepads[gamepadIndex];
        if (!gamepad || !gamepad.buttons[buttonIndex]) return false;

        const key = `${gamepadIndex}_${buttonIndex}`;
        const isPressed = gamepad.buttons[buttonIndex].pressed;
        const wasPressed = this.gamepadButtonsPressed[key] || false;

        // Button was just pressed (not held)
        if (isPressed && !wasPressed) {
            this.gamepadButtonsPressed[key] = true;
            return true;
        }

        // Update state
        this.gamepadButtonsPressed[key] = isPressed;
        return false;
    }

    handleCharacterInput(character, playerNum) {
        if (playerNum === 2) {
            // Debug log to see if this is ever called for P2
            // console.log('[Input] Handling input for Player 2'); 
        }

        // Update gamepad state
        this.updateGamepads();

        const controls = playerNum === 1 ? this.player1Controls : this.player2Controls;
        const gamepadInput = this.getGamepadInput(playerNum);

        if (playerNum === 2 && (gamepadInput)) {
            console.log('[Input] Player 2 has direct gamepad input!', gamepadInput);
        }

        // Reset moving state
        character.stopMoving();

        // Movement - keyboard OR gamepad
        const leftPressed = this.isPressed(controls.left) || (gamepadInput && gamepadInput.left);
        const rightPressed = this.isPressed(controls.right) || (gamepadInput && gamepadInput.right);
        const upPressed = this.isPressed(controls.up) || (gamepadInput && gamepadInput.up) || (gamepadInput && gamepadInput.jump);

        if (leftPressed) {
            character.moveLeft();
        }
        if (rightPressed) {
            character.moveRight();
        }
        if (upPressed) {
            if (!character.isAttacking && !character.isHurt) {
                character.jump();
                // Clear keyboard state
                this.keys[controls.up] = false;
            }
        }

        // Attacks - keyboard OR gamepad
        const punchPressed = this.isPressed(controls.punch) || (gamepadInput && gamepadInput.punch);
        const kickPressed = this.isPressed(controls.kick) || (gamepadInput && gamepadInput.kick);
        const specialPressed = this.isPressed(controls.special) || (gamepadInput && gamepadInput.special);

        if (punchPressed) {
            character.punch();
            this.keys[controls.punch] = false;
        }
        if (kickPressed) {
            character.kick();
            this.keys[controls.kick] = false;
        }
        if (specialPressed) {
            character.special();
            this.keys[controls.special] = false;
        }

        // Block - keyboard OR gamepad
        const blockPressed = this.isPressed(controls.block) || (gamepadInput && gamepadInput.block);
        character.block(blockPressed);
    }
}
