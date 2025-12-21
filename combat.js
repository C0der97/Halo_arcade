// Combat System - Enhanced with Capcom-style Effects
class CombatManager {
    constructor(effectsManager) {
        this.effectsManager = effectsManager;

        // Combo tracking per player
        this.p1Combo = null;
        this.p2Combo = null;
    }

    initCombos() {
        if (!this.p1Combo) this.p1Combo = new ComboSystem();
        if (!this.p2Combo) this.p2Combo = new ComboSystem();
    }

    checkHits(attacker, defender) {
        if (!attacker.isAttacking) return { hit: false };

        const hitbox = attacker.getHitbox();
        const hurtbox = defender.getHurtbox();

        if (hitbox && Utils.checkCollision(hitbox, hurtbox)) {
            // Only hit once per attack
            if (!attacker.hasHit) {
                const damage = defender.takeDamage(hitbox.damage, attacker, this.effectsManager);

                // Determine hit intensity based on attack type
                let intensity = 'normal';
                let screenShakeStrength = 5;

                if (attacker.attackType === 'special') {
                    intensity = 'super';
                    screenShakeStrength = 15;
                } else if (attacker.attackType === 'kick') {
                    intensity = 'heavy';
                    screenShakeStrength = 8;
                } else if (attacker.attackType === 'punch') {
                    intensity = 'normal';
                    screenShakeStrength = 5;
                }

                // Get hit position
                const hitX = (hitbox.x + hitbox.width / 2);
                const hitY = (hitbox.y + hitbox.height / 2);

                if (defender.isBlocking) {
                    // Blocked attack - lighter effects
                    this.effectsManager.createHitSpark(hitX, hitY, '#00d4ff', 'light');
                    this.effectsManager.createImpactRing(hitX, hitY, '#00d4ff', 50);
                    this.effectsManager.triggerHitFreeze(30, 'light');
                    Utils.screenShake.trigger(3, 150);

                    // Play block sound
                    if (window.uiManager && window.uiManager.audioManager) {
                        window.uiManager.audioManager.playSFX('block');
                    }
                } else {
                    // Successful hit - FULL CAPCOM EFFECTS

                    // 1. HIT FREEZE
                    this.effectsManager.triggerHitFreeze(null, intensity);

                    // 2. SCREEN SHAKE
                    Utils.screenShake.trigger(screenShakeStrength, 200);

                    // 3. PARTICLE EFFECTS
                    this.effectsManager.createHitSpark(hitX, hitY, '#ffff00', intensity);
                    this.effectsManager.createBloodEffect(hitX, hitY, '#ff0000', intensity);

                    // 4. IMPACT RING (heavy attacks and specials)
                    if (intensity === 'heavy' || intensity === 'super') {
                        this.effectsManager.createImpactRing(hitX, hitY, '#ffffff', 100);
                    }

                    // 5. SCREEN FLASH (critical hits)
                    if (intensity === 'super') {
                        this.effectsManager.triggerScreenFlash('#ffffff', 0.6);
                    } else if (intensity === 'heavy') {
                        this.effectsManager.triggerScreenFlash('#ffffff', 0.3);
                    }

                    // 6. SPEED LINES (on punches and kicks)
                    if (attacker.attackType === 'punch' || attacker.attackType === 'kick') {
                        const direction = attacker.facing === 1 ? 0 : Math.PI;
                        this.effectsManager.createSpeedLines(hitX, hitY, direction, 6);
                    }

                    // 7. GROUND SHOCKWAVE (special moves)
                    if (intensity === 'super') {
                        this.effectsManager.createGroundShockwave(
                            hitX,
                            defender.y + defender.height,
                            attacker.facing
                        );

                        // SLOW MOTION on super moves
                        this.effectsManager.setTimeScale(0.3, 300);
                    }

                    // 8. COMBO COUNTER
                    if (attacker.playerNum === 1 && this.p1Combo) {
                        this.p1Combo.addHit(damage);
                    } else if (attacker.playerNum === 2 && this.p2Combo) {
                        this.p2Combo.addHit(damage);
                    }

                    // Play hit sound (character-specific if available)
                    if (window.uiManager && window.uiManager.audioManager) {
                        // Get character type from name (e.g., "MASTER CHIEF" -> "master")
                        const charType = attacker.name.toLowerCase().split(' ')[0];
                        window.uiManager.audioManager.playCharacterHit(charType, attacker.attackType);
                    }
                }

                attacker.hasHit = true;

                return {
                    hit: true,
                    damage: damage,
                    intensity: intensity,
                    blocked: defender.isBlocking
                };
            }
        }

        // Reset hit flag when attack ends
        if (!attacker.isAttacking) {
            attacker.hasHit = false;
        }

        return { hit: false };
    }

    update(player1, player2) {
        // Initialize combos if needed
        this.initCombos();

        // Update combo systems
        this.p1Combo.update(16); // Assuming ~60fps
        this.p2Combo.update(16);

        // Check both directions
        const p1Hit = this.checkHits(player1, player2);
        const p2Hit = this.checkHits(player2, player1);

        // Reset opponent's combo if they got hit
        if (p1Hit.hit && !p1Hit.blocked && this.p2Combo) {
            this.p2Combo.reset();
        }
        if (p2Hit.hit && !p2Hit.blocked && this.p1Combo) {
            this.p1Combo.reset();
        }

        return {
            player1Hit: p1Hit,
            player2Hit: p2Hit
        };
    }

    // Render combo counters
    renderCombos(ctx, canvasWidth) {
        if (this.p1Combo && this.p1Combo.currentCombo > 0) {
            this.p1Combo.render(ctx, 100, 150);
        }
        if (this.p2Combo && this.p2Combo.currentCombo > 0) {
            this.p2Combo.render(ctx, canvasWidth - 300, 150);
        }
    }
}

