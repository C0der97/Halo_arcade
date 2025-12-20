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
            }
        };

        // Initialize audio manager
        this.audioManager = new AudioManager();

        this.setupMenuListeners();
    }

    setupMenuListeners() {
        // Main menu buttons
        document.getElementById('start-game')?.addEventListener('click', () => {
            this.showScreen('character-select');
        });

        document.getElementById('controls-btn')?.addEventListener('click', () => {
            this.showScreen('controls-screen');
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
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');

        // Play menu music when returning to menu screens
        if (screenId === 'main-menu' || screenId === 'character-select' || screenId === 'controls-screen') {
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

        // Update preview
        const preview = document.getElementById(`p${playerNum}-preview`);
        const iconClass = `${characterType}-bg`;
        preview.innerHTML = `<div class="icon-bg ${iconClass}"></div>`;

        // Update name
        document.getElementById(`p${playerNum}-char-name`).textContent = char.name;

        // Update stats
        this.updateStatDots(`p${playerNum}-speed`, char.speed);
        this.updateStatDots(`p${playerNum}-power`, char.power);
        this.updateStatDots(`p${playerNum}-defense`, char.defense);
    }

    updateStatDots(elementId, value) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const maxDots = 10;
        container.innerHTML = '';

        for (let i = 0; i < maxDots; i++) {
            const dot = document.createElement('div');
            dot.className = 'stat-dot';
            if (i < value) {
                dot.classList.add('filled');
            }
            container.appendChild(dot);
        }
    }

    clearPlayerInfo(playerNum) {
        document.getElementById(`p${playerNum}-preview`).innerHTML =
            '<div class="preview-placeholder">?</div>';
        document.getElementById(`p${playerNum}-char-name`).textContent = '---';
        ['speed', 'power', 'defense'].forEach(stat => {
            this.updateStatDots(`p${playerNum}-${stat}`, 0);
        });
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
        this.showScreen('game-screen');
        // Game will be initialized by game.js
        if (window.game) {
            window.game.initFight(this.selectedP1, this.selectedP2);
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
        setTimeout(() => {
            this.showScreen('victory-screen');
            document.getElementById('winner-name').textContent = winnerName;
        }, 2000);
    }
}
