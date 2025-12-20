// Audio Manager
class AudioManager {
    constructor() {
        this.menuMusic = null;
        this.fightMusic = null;
        this.currentMusic = null;
        this.musicVolume = 0.3; // 30% volume
        this.sfxVolume = 0.5;   // 50% volume
        this.audioContext = null; // Will be created on first use
        this.init();
    }

    init() {
        // Load menu music
        this.menuMusic = new Audio('assets/sounds/menu.mp3');
        this.menuMusic.loop = true;
        this.menuMusic.volume = this.musicVolume;

        // Initialize AudioContext early to avoid issues
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('AudioContext init failed:', e);
        }
    }

    playMenuMusic() {
        if (this.currentMusic === this.menuMusic && !this.menuMusic.paused) {
            return; // Already playing
        }

        this.stopAll();
        this.currentMusic = this.menuMusic;

        // Start at second 30
        this.menuMusic.currentTime = 30;

        // Play with error handling
        this.menuMusic.play().catch(error => {
            console.log('Error playing menu music:', error);
            // Auto-play might be blocked, will play on user interaction
        });
    }

    stopAll() {
        if (this.menuMusic) {
            this.menuMusic.pause();
            this.menuMusic.currentTime = 0;
        }
        if (this.fightMusic) {
            this.fightMusic.pause();
            this.fightMusic.currentTime = 0;
        }
        this.currentMusic = null;
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.menuMusic) this.menuMusic.volume = this.musicVolume;
        if (this.fightMusic) this.fightMusic.volume = this.musicVolume;
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    // Play sound effects
    playSFX(soundName) {
        try {
            // Make sure audio context exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = this.audioContext;

            // Resume if suspended (browser autoplay policy)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const now = audioContext.currentTime;
            let duration = 0.15;

            // Sonidos más audibles con frecuencias más altas
            if (soundName === 'punch') {
                oscillator.frequency.value = 200;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            } else if (soundName === 'kick') {
                oscillator.frequency.value = 250;
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                duration = 0.12;
            } else if (soundName === 'special') {
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                duration = 0.2;
            } else if (soundName === 'block') {
                oscillator.frequency.setValueAtTime(1200, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                duration = 0.1;
            }

            // IMPORTANTE: start ANTES de stop
            oscillator.start(now);
            oscillator.stop(now + duration);

        } catch (error) {
            console.error('❌ Error playing SFX:', error);
        }
    }
}
