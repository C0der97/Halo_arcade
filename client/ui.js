// UI Manager
class UIManager {
    constructor() {
        this.characterData = {
            chief: {
                name: 'MASTER CHIEF',
                speed: 7,
                power: 8,
                defense: 9
            },
            elite: {
                name: 'ELITE',
                speed: 9,
                power: 7,
                defense: 6
            },
            brute: {
                name: 'BRUTE',
                speed: 5,
                power: 10,
                defense: 8
            },
            hunter: {
                name: 'HUNTER',
                speed: 2,
                power: 10,
                defense: 10
            }
        };

        // Initialize audio manager
        this.audioManager = new AudioManager();

        // Preload hover sound
        this.hoverSound = new Audio('assets/sounds/cursor_vertical.wav');
        this.hoverSound.volume = 0.5;

        // Game mode settings
        this.gameMode = 'vsCPU'; // Default to vsCPU for better single player experience
        this.aiDifficulty = 'easy'; // 'easy', 'medium', or 'hard'

        this.setupMenuListeners();
        this.setupHoverSounds();
    }

    // Play hover sound effect
    playHoverSound() {
        const sound = this.hoverSound.cloneNode();
        sound.volume = 0.4;
        sound.play().catch(() => { });
    }

    // Play click sound effect
    playClickSound() {
        const sound = this.hoverSound.cloneNode();
        sound.volume = 0.6;
        sound.playbackRate = 1.2; // Slightly higher pitch for click
        sound.play().catch(() => { });
    }

    // Setup hover and click sounds for all interactive menu elements
    setupHoverSounds() {
        const buttons = document.querySelectorAll('.menu-btn, .difficulty-btn, .character-icon');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => this.playHoverSound());
            btn.addEventListener('click', () => this.playClickSound());
        });
    }

    setupMenuListeners() {
        // Main menu buttons - game mode selection
        document.getElementById('vs-cpu-btn')?.addEventListener('click', () => {
            console.log('[UI] VS CPU clicked. Setting gameMode = vsCPU');
            this.gameMode = 'vsCPU';
            this.showScreen('difficulty-select');
        });

        document.getElementById('vs-player-btn')?.addEventListener('click', () => {
            console.log('[UI] VS PLAYER clicked. Setting gameMode = vsPlayer');
            this.gameMode = 'vsPlayer';
            this.showScreen('character-select');
        });

        document.getElementById('vs-online-btn')?.addEventListener('click', () => {
            // Start online mode
            if (window.game) {
                window.game.initOnlineMode();
            }
        });

        document.getElementById('controls-btn')?.addEventListener('click', () => {
            this.updateControlsVisibility();
            this.showScreen('controls-screen');
        });

        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aiDifficulty = btn.dataset.difficulty;
                this.showScreen('character-select');
            });
        });

        document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        document.getElementById('back-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        // Character selection
        this.selectedP1 = null;
        this.selectedP2 = null;

        document.querySelectorAll('.character-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                this.selectCharacter(icon.dataset.character);
            });
        });

        document.getElementById('fight-btn')?.addEventListener('click', () => {
            if (this.selectedP1 && this.selectedP2) {
                this.startFight();
            }
        });

        // Victory screen
        document.getElementById('rematch-btn')?.addEventListener('click', () => {
            this.showScreen('character-select');
            this.resetSelection();
        });

        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
            this.resetSelection();
        });

        // Start menu music on first user interaction
        document.addEventListener('click', () => {
            this.audioManager.playMenuMusic();
        }, { once: true });

        // Initialize gamepad menu navigation
        this.initGamepadMenuNavigation();
    }

    // Gamepad Menu Navigation System
    initGamepadMenuNavigation() {
        this.currentMenuScreen = 'main-menu';
        this.currentMenuIndex = 0;
        this.menuItems = [];
        this.gamepadLastButton = {};
        this.gamepadLastAxis = { x: 0, y: 0 };

        // Poll for gamepad input on menus
        this.gamepadMenuInterval = setInterval(() => {
            this.updateGamepadMenuNavigation();
        }, 100); // Poll every 100ms
    }

    updateGamepadMenuNavigation() {
        try {
            // Only process gamepad input on menu screens
            const activeScreen = document.querySelector('.screen.active');
            if (!activeScreen) {
                // console.log('[UI] No active screen found');
                return;
            }

            const screenId = activeScreen.id;
            if (screenId === 'game-screen') return; // Don't interfere with gameplay

            // Only log screen change to avoid spam
            if (this._lastDebugScreen !== screenId) {
                console.log(`[UI] Navigating Menu on Screen: ${screenId}`);
                this._lastDebugScreen = screenId;
            }

            // Get all connected gamepads
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let inputDetected = false;
            let connectedCount = 0;

            // Iterate through all connected gamepads to find input
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (!gamepad || !gamepad.connected) continue;
                connectedCount++;

                // Initialize last state for this gamepad if needed
                if (!this.gamepadLastState) this.gamepadLastState = {};
                if (!this.gamepadLastState[i]) {
                    this.gamepadLastState[i] = { axisX: 0, axisY: 0, buttons: {} };
                }
                const lastState = this.gamepadLastState[i];

                // Update current menu items based on active screen (only need to do once really, but idempotent)
                this.updateMenuItemsForScreen(screenId);
                if (this.menuItems.length === 0) {
                    if (this._lastDebugItems !== screenId) {
                        console.log(`[UI] No menu items found for ${screenId}`);
                        this._lastDebugItems = screenId;
                    }
                    continue;
                }

                // Navigation with D-pad or left stick
                const axisY = gamepad.axes[1] || 0;
                const dpadUp = gamepad.buttons[12] && gamepad.buttons[12].pressed;
                const dpadDown = gamepad.buttons[13] && gamepad.buttons[13].pressed;

                // Detect vertical movement (debounced per gamepad)
                if ((axisY < -0.5 || dpadUp) && lastState.axisY >= -0.5) {
                    this.navigateMenu(-1);
                    lastState.axisY = axisY;
                    inputDetected = true;
                } else if ((axisY > 0.5 || dpadDown) && lastState.axisY <= 0.5) {
                    this.navigateMenu(1);
                    lastState.axisY = axisY;
                    inputDetected = true;
                } else if (Math.abs(axisY) < 0.3 && !dpadUp && !dpadDown) {
                    lastState.axisY = 0;
                }

                // Horizontal navigation for character selection grid
                if (screenId === 'character-select') {
                    const axisX = gamepad.axes[0] || 0;
                    const dpadLeft = gamepad.buttons[14] && gamepad.buttons[14].pressed;
                    const dpadRight = gamepad.buttons[15] && gamepad.buttons[15].pressed;

                    if ((axisX < -0.5 || dpadLeft) && lastState.axisX >= -0.5) {
                        this.navigateCharacterGrid(-1);
                        lastState.axisX = axisX;
                        inputDetected = true;
                    } else if ((axisX > 0.5 || dpadRight) && lastState.axisX <= 0.5) {
                        this.navigateCharacterGrid(1);
                        lastState.axisX = axisX;
                        inputDetected = true;
                    } else if (Math.abs(axisX) < 0.3 && !dpadLeft && !dpadRight) {
                        lastState.axisX = 0;
                    }
                }

                // Selection with A button (button 0)
                const aButton = gamepad.buttons[0];
                if (aButton && aButton.pressed && !lastState.buttons[0]) {
                    console.log(`[UI] Gamepad ${i} A Button Pressed`);
                    this.selectCurrentMenuItem();
                    this.playClickSound();
                    inputDetected = true;
                }
                lastState.buttons[0] = aButton && aButton.pressed;

                // Back with B button (button 1)
                const bButton = gamepad.buttons[1];
                if (bButton && bButton.pressed && !lastState.buttons[1]) {
                    console.log(`[UI] Gamepad ${i} B Button Pressed`);
                    this.handleBackButton(screenId);
                    inputDetected = true;
                }
                lastState.buttons[1] = bButton && bButton.pressed;

                if (inputDetected) break; // Avoid double input processing frame
            }
        } catch (e) {
            console.error('[UI] Error in updateGamepadMenuNavigation:', e);
        }
    }

    updateMenuItemsForScreen(screenId) {
        // Get focusable menu items based on current screen
        const screen = document.getElementById(screenId);
        if (!screen) return;

        switch (screenId) {
            case 'main-menu':
                this.menuItems = Array.from(screen.querySelectorAll('.menu-btn'));
                break;
            case 'difficulty-select':
                this.menuItems = Array.from(screen.querySelectorAll('.difficulty-btn, #back-to-menu-btn'));
                console.log(`[UI] Difficulty Screen Items Found: ${this.menuItems.length}`);
                break;
            case 'character-select':
                // Combine character icons and fight button
                const characters = Array.from(screen.querySelectorAll('.character-icon'));
                const fightBtn = screen.querySelector('#fight-btn');
                this.menuItems = [...characters, fightBtn].filter(item => item !== null);
                break;
            case 'controls-screen':
                this.menuItems = Array.from(screen.querySelectorAll('#back-btn'));
                break;
            case 'victory-screen':
                this.menuItems = Array.from(screen.querySelectorAll('.menu-btn'));
                break;
            default:
                this.menuItems = [];
        }

        // Ensure current index is valid
        if (this.currentMenuIndex >= this.menuItems.length) {
            this.currentMenuIndex = 0;
        }

        // Highlight current item
        // console.log(`[UI] Highlighting index ${this.currentMenuIndex} on ${screenId}`);
        this.highlightMenuItem(this.currentMenuIndex);
    }


    navigateMenu(direction) {
        if (this.menuItems.length === 0) return;

        // Remove previous highlight
        this.removeMenuHighlight(this.currentMenuIndex);

        // Update index
        this.currentMenuIndex += direction;
        if (this.currentMenuIndex < 0) {
            this.currentMenuIndex = this.menuItems.length - 1;
        } else if (this.currentMenuIndex >= this.menuItems.length) {
            this.currentMenuIndex = 0;
        }

        // Highlight new item
        this.highlightMenuItem(this.currentMenuIndex);
        this.playHoverSound();
    }

    navigateCharacterGrid(direction) {
        // Navigate horizontally in character grid
        const characterIcons = document.querySelectorAll('.character-icon');
        const fightBtn = document.querySelector('#fight-btn');

        // If on fight button, move to characters
        if (this.menuItems[this.currentMenuIndex] === fightBtn) {
            if (direction < 0) {
                this.removeMenuHighlight(this.currentMenuIndex);
                this.currentMenuIndex = characterIcons.length - 1;
                this.highlightMenuItem(this.currentMenuIndex);
                this.playHoverSound();
            }
            return;
        }

        // If on characters, navigate left/right
        if (this.currentMenuIndex < characterIcons.length) {
            this.removeMenuHighlight(this.currentMenuIndex);
            this.currentMenuIndex += direction;

            if (this.currentMenuIndex < 0) {
                this.currentMenuIndex = characterIcons.length - 1;
            } else if (this.currentMenuIndex >= characterIcons.length) {
                this.currentMenuIndex = 0;
            }

            this.highlightMenuItem(this.currentMenuIndex);
            this.playHoverSound();
        }
    }

    highlightMenuItem(index) {
        if (index < 0 || index >= this.menuItems.length) return;

        const item = this.menuItems[index];
        if (item) {
            item.classList.add('gamepad-focused');
            // Scroll into view if needed
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    removeMenuHighlight(index) {
        if (index < 0 || index >= this.menuItems.length) return;

        const item = this.menuItems[index];
        if (item) {
            item.classList.remove('gamepad-focused');
        }
    }

    selectCurrentMenuItem() {
        if (this.currentMenuIndex < 0 || this.currentMenuIndex >= this.menuItems.length) return;

        const item = this.menuItems[this.currentMenuIndex];
        if (item && !item.disabled) {
            item.click();
        }
    }

    handleBackButton(screenId) {
        switch (screenId) {
            case 'difficulty-select':
                document.getElementById('back-to-menu-btn')?.click();
                break;
            case 'controls-screen':
                document.getElementById('back-btn')?.click();
                break;
            case 'character-select':
                // Reset selection or go back to difficulty/menu
                this.resetSelection();
                if (this.gameMode === 'vsCPU') {
                    this.showScreen('difficulty-select');
                } else {
                    this.showScreen('main-menu');
                }
                break;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');

        // Reset menu navigation for gamepad
        this.currentMenuIndex = 0;

        // Play menu music when returning to menu screens
        if (screenId === 'main-menu' || screenId === 'character-select' || screenId === 'controls-screen' || screenId === 'difficulty-select') {
            this.audioManager.playMenuMusic();
        } else if (screenId === 'game-screen') {
            // Stop menu music during fight
            this.audioManager.stopAll();
        }
    }

    selectCharacter(characterType) {
        // Si el Jugador 1 aún no ha seleccionado
        if (!this.selectedP1) {
            this.selectedP1 = characterType;
            this.updatePlayerInfo(1, characterType);
            this.updateCardHighlights();
        }
        // Si el Jugador 1 ya seleccionó pero el Jugador 2 no
        else if (!this.selectedP2) {
            this.selectedP2 = characterType;
            this.updatePlayerInfo(2, characterType);
            this.updateCardHighlights();
            document.getElementById('fight-btn').disabled = false;
        }
        // Si ambos ya seleccionaron, permite cambiar al hacer clic nuevamente
        else {
            // Determinar si el personaje clickeado pertenece a P1 o P2
            if (this.selectedP1 === characterType) {
                // Cambiar selección de P1
                this.selectedP1 = null;
                this.clearPlayerInfo(1);
                document.getElementById('fight-btn').disabled = true;
                this.updateCardHighlights();
            } else if (this.selectedP2 === characterType) {
                // Cambiar selección de P2
                this.selectedP2 = null;
                this.clearPlayerInfo(2);
                document.getElementById('fight-btn').disabled = true;
                this.updateCardHighlights();
            }
        }
    }

    updatePlayerInfo(playerNum, characterType) {
        const char = this.characterData[characterType];

        // Update name
        document.getElementById(`p${playerNum}-char-name`).textContent = char.name;

        // Update stats as text values
        const speedEl = document.getElementById(`p${playerNum}-speed`);
        const powerEl = document.getElementById(`p${playerNum}-power`);
        const defenseEl = document.getElementById(`p${playerNum}-defense`);

        if (speedEl) speedEl.textContent = char.speed;
        if (powerEl) powerEl.textContent = char.power;
        if (defenseEl) defenseEl.textContent = char.defense;
    }

    updateStatDots(elementId, value) {
        // Legacy function - keeping for compatibility
        const container = document.getElementById(elementId);
        if (!container) return;
        container.textContent = value;
    }

    clearPlayerInfo(playerNum) {
        document.getElementById(`p${playerNum}-char-name`).textContent = '---';
        const speedEl = document.getElementById(`p${playerNum}-speed`);
        const powerEl = document.getElementById(`p${playerNum}-power`);
        const defenseEl = document.getElementById(`p${playerNum}-defense`);


        if (speedEl) speedEl.textContent = '-';
        if (powerEl) powerEl.textContent = '-';
        if (defenseEl) defenseEl.textContent = '-';
    }

    updateCardHighlights() {
        // Remover todas las selecciones previas
        document.querySelectorAll('.character-icon').forEach(icon => {
            icon.classList.remove('selected-p1', 'selected-p2');
        });

        // Agregar highlight para P1
        if (this.selectedP1) {
            const p1Icon = document.querySelector(`.character-icon[data-character="${this.selectedP1}"]`);
            if (p1Icon) {
                p1Icon.classList.add('selected-p1');
            }
        }

        // Agregar highlight para P2
        if (this.selectedP2) {
            const p2Icon = document.querySelector(`.character-icon[data-character="${this.selectedP2}"]`);
            if (p2Icon) {
                p2Icon.classList.add('selected-p2');
            }
        }
    }

    resetSelection() {
        this.selectedP1 = null;
        this.selectedP2 = null;
        this.clearPlayerInfo(1);
        this.clearPlayerInfo(2);
        document.getElementById('fight-btn').disabled = true;
        document.querySelectorAll('.character-icon').forEach(icon => {
            icon.classList.remove('selected-p1', 'selected-p2');
        });
    }

    startFight() {
        console.log(`[UI] Starting Fight requested. Current Mode: ${this.gameMode}`);

        // SMART FALLBACK: If we are in vsPlayer mode, but only have 1 real controller, switch to vsCPU
        // This fixes the issue where users with "ghost" controllers accidentally select or default to vsPlayer
        if (this.gameMode === 'vsPlayer') {
            const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(g => g && g.connected) : [];
            let uniqueGamepads = gamepads.length;

            // Simple ghost detection: If 2 gamepads, and they seem identical (same ID, timestamp, buttons), count as 1
            if (gamepads.length === 2) {
                const p1 = gamepads[0];
                const p2 = gamepads[1];

                // Check if they share the same Vendor/Product (e.g. "Vendor: 054c Product: 0ce6")
                const p1Match = p1.id.match(/Vendor: ([0-9a-f]+) Product: ([0-9a-f]+)/i);
                const p2Match = p2.id.match(/Vendor: ([0-9a-f]+) Product: ([0-9a-f]+)/i);

                const startWithSameVendor = p1Match && p2Match && p1Match[1] === p2Match[1] && p1Match[2] === p2Match[2];
                const exactIdMatch = p1.id === p2.id;

                if (exactIdMatch || startWithSameVendor) {
                    // Check button states to be sure (or just assume if vendor matches on Linux this implies the issue)
                    // High probability of ghost controller on Linux/Chrome
                    console.warn('[UI] Detected potential Ghost Controller (ID/Vendor Match). Treating as single player.');
                    uniqueGamepads = 1;
                }
            }

            if (uniqueGamepads <= 1) {
                console.warn(`[UI] 'vsPlayer' selected but only ${uniqueGamepads} unique controller(s) found. Forcing 'vsCPU'.`);
                this.gameMode = 'vsCPU';
                this.aiDifficulty = 'medium'; // Default to medium if forced
            }
        }

        console.log(`[UI] Final Launch Mode: ${this.gameMode}, P1: ${this.selectedP1}, P2: ${this.selectedP2}`);
        this.showScreen('game-screen');
        // Game will be initialized by game.js
        if (window.game) {
            window.game.initFight(this.selectedP1, this.selectedP2, this.gameMode, this.aiDifficulty);

            // Critical: Update the input manager directly with the new mode
            if (window.game.inputManager) {
                window.game.inputManager.setGameMode(this.gameMode);
            }
        }
    }

    updateHealth(playerNum, health, maxHealth) {
        const percentage = (health / maxHealth) * 100;
        const healthBar = document.getElementById(`p${playerNum}-health`);
        if (healthBar) {
            healthBar.style.width = percentage + '%';

            // Change color based on health
            if (percentage > 50) {
                healthBar.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
            } else if (percentage > 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #ff3333, #cc0000)';
            }
        }
    }

    updateTimer(seconds) {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = Math.max(0, Math.ceil(seconds));

            // Warning color when low
            if (seconds <= 10) {
                timerElement.style.color = '#ff3333';
            } else {
                timerElement.style.color = '#ffd700';
            }
        }
    }

    updateRound(round) {
        const roundElement = document.getElementById('round-display');
        if (roundElement) {
            roundElement.textContent = `ROUND ${round}`;
        }
    }

    updatePlayerNames(p1Name, p2Name) {
        document.getElementById('p1-name').textContent = p1Name;
        document.getElementById('p2-name').textContent = p2Name;
    }

    showMessage(text, duration = 2000) {
        const messageElement = document.getElementById('game-message');
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.classList.add('show');

            setTimeout(() => {
                messageElement.classList.remove('show');
            }, duration);
        }
    }

    showVictory(winnerName) {
        // Delay before showing victory screen
        setTimeout(() => {
            this.showScreen('victory-screen');
            document.getElementById('winner-name').textContent = winnerName;
        }, 2000);
    }

    updateControlsVisibility() {
        // Detect if gamepad is connected
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let gamepadConnected = false;

        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
                gamepadConnected = true;
                break;
            }
        }

        const keyboardControls = document.getElementById('keyboard-controls');
        const gamepadControls = document.getElementById('gamepad-controls');

        if (keyboardControls && gamepadControls) {
            if (gamepadConnected) {
                // Show only gamepad controls
                keyboardControls.style.display = 'none';
                gamepadControls.style.display = 'block';
            } else {
                // Show only keyboard controls
                keyboardControls.style.display = 'flex';
                gamepadControls.style.display = 'none';
            }
        }
    }
}
