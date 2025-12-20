// Input Manager
class InputManager {
    constructor() {
        this.keys = {};
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

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key); // DEBUG: Ver qué teclas se presionan
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
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    handleCharacterInput(character, playerNum) {
        const controls = playerNum === 1 ? this.player1Controls : this.player2Controls;

        // Reset moving state
        character.stopMoving();

        // Movement
        if (this.isPressed(controls.left)) {
            character.moveLeft();
        }
        if (this.isPressed(controls.right)) {
            character.moveRight();
        }
        if (this.isPressed(controls.up)) {
            console.log('UP KEY PRESSED! Player', playerNum); // DEBUG
            // Only clear key if we actually try to jump
            if (!character.isAttacking && !character.isHurt) {
                character.jump();
                this.keys[controls.up] = false;
            }
        }

        // Attacks
        if (this.isPressed(controls.punch)) {
            character.punch();
            this.keys[controls.punch] = false;
        }
        if (this.isPressed(controls.kick)) {
            character.kick();
            this.keys[controls.kick] = false;
        }
        if (this.isPressed(controls.special)) {
            character.special();
            this.keys[controls.special] = false;
        }

        // Block
        character.block(this.isPressed(controls.block));
    }
}
