// Combat System
class CombatManager {
    constructor(effectsManager) {
        this.effectsManager = effectsManager;
    }

    checkHits(attacker, defender) {
        if (!attacker.isAttacking) return;

        const hitbox = attacker.getHitbox();
        const hurtbox = defender.getHurtbox();

        if (hitbox && Utils.checkCollision(hitbox, hurtbox)) {
            // Only hit once per attack
            if (!attacker.hasHit) {
                const damage = defender.takeDamage(hitbox.damage, attacker, this.effectsManager);

                // Play sound effect based on whether blocked or hit
                if (window.uiManager && window.uiManager.audioManager) {
                    if (defender.isBlocking) {
                        window.uiManager.audioManager.playSFX('block');
                    } else {
                        window.uiManager.audioManager.playSFX(attacker.attackType);
                    }
                }

                attacker.hasHit = true;

                return {
                    hit: true,
                    damage: damage,
                    combo: attacker.comboCount
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
        // Check both directions
        const p1Hit = this.checkHits(player1, player2);
        const p2Hit = this.checkHits(player2, player1);

        return {
            player1Hit: p1Hit,
            player2Hit: p2Hit
        };
    }
}
