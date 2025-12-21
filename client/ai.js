// AI System for CPU opponents
class AI {
    constructor(difficulty = 'easy') {
        this.difficulty = difficulty;
        this.reactionTime = this.getReactionTime(difficulty);
        this.aggressiveness = this.getAggressiveness(difficulty);

        // Decision timers
        this.nextDecisionTime = 0;
        this.currentAction = null;
        this.actionDuration = 0;

        // Combat awareness
        this.lastPlayerAction = null;
        this.lastPlayerActionTime = 0;
    }

    getReactionTime(difficulty) {
        switch (difficulty) {
            case 'easy': return 800;    // 800ms reaction time
            case 'medium': return 500;  // 500ms reaction time
            case 'hard': return 200;    // 200ms reaction time
            default: return 800;
        }
    }

    getAggressiveness(difficulty) {
        switch (difficulty) {
            case 'easy': return 0.3;    // 30% chance to attack
            case 'medium': return 0.5;  // 50% chance to attack
            case 'hard': return 0.7;    // 70% chance to attack
            default: return 0.3;
        }
    }

    update(aiCharacter, opponent, deltaTime) {
        // Update timers
        this.nextDecisionTime -= deltaTime;
        this.actionDuration -= deltaTime;

        // Clear current action if duration expired
        if (this.actionDuration <= 0) {
            this.currentAction = null;
        }

        // Make new decision if timer expired
        if (this.nextDecisionTime <= 0) {
            this.makeDecision(aiCharacter, opponent);
            this.nextDecisionTime = this.reactionTime + Math.random() * 200; // Add some variation
        }

        // Execute current action
        this.executeAction(aiCharacter, opponent);
    }

    makeDecision(aiCharacter, opponent) {
        const distance = Math.abs(opponent.x - aiCharacter.x);
        const isOpponentAttacking = opponent.isAttacking;
        const isInAttackRange = distance < 150;

        // Defensive behavior - block if opponent is attacking nearby
        if (isOpponentAttacking && isInAttackRange && Math.random() < 0.6) {
            this.currentAction = 'block';
            this.actionDuration = 400;
            return;
        }

        // Movement - get closer if too far
        if (distance > 200) {
            this.currentAction = opponent.x > aiCharacter.x ? 'moveRight' : 'moveLeft';
            this.actionDuration = 300 + Math.random() * 200;
            return;
        }

        // Movement - back off if too close and low health
        if (distance < 80 && aiCharacter.health < 30) {
            this.currentAction = opponent.x > aiCharacter.x ? 'moveLeft' : 'moveRight';
            this.actionDuration = 200;
            return;
        }

        // Attack behavior
        if (isInAttackRange && Math.random() < this.aggressiveness) {
            // Choose random attack
            const attacks = ['punch', 'kick'];

            // Add special attack if health is low (desperation move)
            if (aiCharacter.health < opponent.health - 20) {
                attacks.push('special');
            }

            this.currentAction = attacks[Math.floor(Math.random() * attacks.length)];
            this.actionDuration = 100; // Short duration for attacks
            return;
        }

        // Random jump
        if (Math.random() < 0.1) {
            this.currentAction = 'jump';
            this.actionDuration = 100;
            return;
        }

        // Default: move towards opponent
        this.currentAction = opponent.x > aiCharacter.x ? 'moveRight' : 'moveLeft';
        this.actionDuration = 200 + Math.random() * 300;
    }

    executeAction(aiCharacter, opponent) {
        if (!this.currentAction) return;

        // Reset movement
        aiCharacter.stopMoving();
        aiCharacter.block(false);

        switch (this.currentAction) {
            case 'moveLeft':
                aiCharacter.moveLeft();
                break;
            case 'moveRight':
                aiCharacter.moveRight();
                break;
            case 'jump':
                aiCharacter.jump();
                this.currentAction = null; // One-time action
                break;
            case 'punch':
                aiCharacter.punch();
                this.currentAction = null; // One-time action
                break;
            case 'kick':
                aiCharacter.kick();
                this.currentAction = null; // One-time action
                break;
            case 'special':
                aiCharacter.special();
                this.currentAction = null; // One-time action
                break;
            case 'block':
                aiCharacter.block(true);
                break;
        }
    }

    reset() {
        this.nextDecisionTime = 500; // Initial delay
        this.currentAction = null;
        this.actionDuration = 0;
    }
}
