// Physics Engine
class Physics {
    static applyGravity(character) {
        // Check if character is in the air or moving up (jumping)
        // We add a small buffer (5px) or check if velocity is negative (jumping)
        if (character.y + character.height < CONFIG.GROUND_Y || character.velocityY < 0) {
            character.velocityY += CONFIG.GRAVITY;
        } else {
            // Only snap to ground if falling or standing still
            if (character.velocityY >= 0) {
                character.y = CONFIG.GROUND_Y - character.height;
                character.velocityY = 0;
                character.isJumping = false;
                character.canDoubleJump = true;
            }
        }
    }

    static applyFriction(character) {
        if (character.isOnGround() && !character.isMoving) {
            character.velocityX *= CONFIG.FRICTION;
            if (Math.abs(character.velocityX) < 0.1) {
                character.velocityX = 0;
            }
        }
    }

    static updatePosition(character) {
        character.x += character.velocityX;
        character.y += character.velocityY;

        // Keep character on screen
        character.x = Utils.clamp(character.x, 0, CONFIG.CANVAS_WIDTH - character.width);

        // Ground collision - check if feet are at or below ground
        if (character.y + character.height >= CONFIG.GROUND_Y) {
            character.y = CONFIG.GROUND_Y - character.height;
            character.velocityY = 0;
        }
    }

    static resolveCollision(char1, char2) {
        // Simple push-back when characters overlap
        const char1Box = char1.getHurtbox();
        const char2Box = char2.getHurtbox();

        if (Utils.checkCollision(char1Box, char2Box)) {
            const overlapX = (char1Box.x + char1Box.width) - char2Box.x;
            const overlapY = (char1Box.y + char1Box.height) - char2Box.y;

            // Push characters apart on X axis
            if (char1.x < char2.x) {
                char1.x -= overlapX / 2;
                char2.x += overlapX / 2;
            } else {
                char1.x += overlapX / 2;
                char2.x -= overlapX / 2;
            }
        }
    }
}
