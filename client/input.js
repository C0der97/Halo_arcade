// Input Manager with Gamepad Support
class InputManager {
    constructor() {
        // Keyboard state
        this.keys = {};

        // Gamepad state
        this.gamepads = {};
        this.gamepadButtonsPressed = {}; // Track previous frame button state
        this.deadzone = 0.25; // Analog stick deadzone

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

    getGamepadInput(playerNum) {
        // Player 1 uses gamepad 0, Player 2 uses gamepad 1
        const gamepadIndex = playerNum - 1;
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
        // Update gamepad state
        this.updateGamepads();

        const controls = playerNum === 1 ? this.player1Controls : this.player2Controls;
        const gamepadInput = this.getGamepadInput(playerNum);

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
