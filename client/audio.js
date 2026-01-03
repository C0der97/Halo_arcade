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
        // Load menu music
        // this.menuMusic = new Audio('assets/sounds/menu.mp3');
        // this.menuMusic.loop = true;
        // this.menuMusic.volume = this.musicVolume;

        // Initialize AudioContext early to avoid issues
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('AudioContext init failed:', e);
        }
    }

    playMenuMusic() {
        if (!this.menuMusic) return; // Skip if music not loaded

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
    // Play winner announcement
    // Tries to play a custom audio file first, falls back to Web Speech API
    playAnnouncement(text) {
        // Map text to filenames
        let filename = '';
        if (text.includes('Player One')) filename = 'p1_wins.mp3';
        else if (text.includes('Player Two')) filename = 'p2_wins.mp3';
        else if (text === 'Draw!') filename = 'draw.mp3';
        else if (text.includes('Fight')) filename = 'fight.mp3';
        else if (text.includes('Victoria') || text.toLowerCase().includes('victory')) filename = 'victoria.mp3';
        else if (text.includes('1') || text.toLowerCase().includes('primera')) filename = 'first_round.mp3';
        else if (text.includes('2') || text.toLowerCase().includes('segunda')) filename = 'second_round.mp3';
        else if (text.includes('3') || text.toLowerCase().includes('tercera')) filename = 'third_round.mp3';

        // Try playing file if mapped
        if (filename) {
            console.log(`🎤 Loading announcer file: /assets/sounds/announcer/${filename}`);
            const audio = new Audio(`/assets/sounds/announcer/${filename}`);
            audio.volume = 1.0;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`🔊 Playing announcer file: ${filename}`);
                }).catch(error => {
                    // File not found or playback failed -> Fallback to TTS
                    console.warn(`⚠️ Announcer file not found (${filename}), using TTS fallback.`);
                    this.speakText(text);
                });
            } else {
                this.speakText(text);
            }
            return;
        }

        // No file mapping -> Use TTS
        this.speakText(text);
    }

    // Web Speech API implementation (Fallback)
    speakText(text) {
        if (!window.speechSynthesis) {
            console.error('Speech Synthesis not supported');
            return;
        }

        console.log('🗣️ Attempting to announce (TTS):', text);

        // Cancel previous utterances
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;

        // Wait for voices to load if they haven't yet
        let voices = window.speechSynthesis.getVoices();

        const speak = () => {
            voices = window.speechSynthesis.getVoices();
            console.log(`🗣️ Voices available: ${voices.length}`);

            // Try to find a good English voice
            const englishVoice = voices.find(voice =>
                (voice.lang.includes('en') || voice.lang.includes('US') || voice.lang.includes('GB')) &&
                !voice.name.includes('Microsoft') // Las voces de Microsoft a veces fallan en web
            ) || voices[0]; // Fallback to first available

            if (englishVoice) {
                console.log(`🗣️ Using voice: ${englishVoice.name} (${englishVoice.lang})`);
                utterance.voice = englishVoice;
            }

            window.speechSynthesis.speak(utterance);
        };

        if (voices.length === 0) {
            console.warn('🗣️ No voices loaded yet, waiting for voice listing...');
            // Chrome needs this event
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null; // Remove listener
                speak();
            };
            // Fallback just in case event doesn't fire
            setTimeout(speak, 500);
        } else {
            speak();
        }
    }

    // Create noise buffer for impact sounds
    createNoiseBuffer() {
        if (!this.audioContext) return null;
        const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // Play character-specific hit sound or fallback to synthesis
    playCharacterHit(characterType, attackType) {
        // Try MP3 first
        const filename = `${characterType}_hit.mp3`;
        const audio = new Audio(`/assets/sounds/announcer/${filename}`);
        audio.volume = 1.0;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`🔊 Playing character hit: ${filename}`);
            }).catch(error => {
                // Try M4A as fallback
                const filenameM4A = `${characterType}_hit.m4a`;
                const audioM4A = new Audio(`/assets/sounds/announcer/${filenameM4A}`);
                audioM4A.volume = 1.0;
                const playPromiseM4A = audioM4A.play();

                if (playPromiseM4A !== undefined) {
                    playPromiseM4A.then(() => {
                        console.log(`🔊 Playing character hit (M4A): ${filenameM4A}`);
                    }).catch(errorM4A => {
                        // Both failed -> use synthesis
                        console.log(`Character hit not found, using synthesis for ${attackType}`);
                        this.playSFX(attackType);
                    });
                } else {
                    this.playSFX(attackType);
                }
            });
        } else {
            this.playSFX(attackType);
        }
    }

    // Play advanced sound effects - DISABLED (using real sound files instead)
    playSFX(soundName) {
        // Sonidos sintéticos desactivados - Se usan archivos de audio reales
        return;
    }
}
