// Base Character Class
class Character {
    constructor(x, y, facing = 1, playerNum = 1) {
        // Position and physics
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 120;
        this.velocityX = 0;
        this.velocityY = 0;
        this.facing = facing; // 1 = right, -1 = left

        // Character stats
        this.health = CONFIG.BASE_HEALTH;
        this.maxHealth = CONFIG.BASE_HEALTH;
        this.speed = CONFIG.BASE_SPEED;
        this.jumpForce = CONFIG.BASE_JUMP_FORCE;

        // State management
        this.state = 'idle';
        this.isJumping = false;
        this.isBlocking = false;
        this.isMoving = false;
        this.canDoubleJump = true;
        this.isHurt = false;
        this.hurtTimer = 0;

        // Combat
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackType = null;
        this.comboCount = 0;
        this.lastAttackTime = 0;
        this.hasHit = false; // Prevents hitting multiple times per attack

        // Animation
        this.animationSystem = new AnimationSystem();
        this.setupAnimations();

        // Player identification
        this.playerNum = playerNum;
        this.name = 'Character';

        // Colors (will be overridden by specific characters)
        this.primaryColor = '#00ff88';
        this.secondaryColor = '#00cc66';

        // Individual sprite support (better than sprite sheets)
        // Now supports arrays of sprites for multi-frame animations
        this.sprites = {
            idle: [],
            walk: [],
            punch: [],
            kick: [],
            special: [],
            block: [],
            hurt: [],
            jump: []
        };
        this.spritesLoaded = {};
        this.useSprites = false;
        this.useCanvasRenderer = true; // Use vector Canvas drawing (Capcom 2D style)
        this.spriteBaseName = ''; // e.g., 'chief', 'elite', 'brute'

        // Frame configuration for each action (can be overridden per character)
        this.spriteFrameConfig = {
            idle: 1,
            walk: 1,
            punch: 1,
            kick: 1,
            special: 1,
            block: 1,
            hurt: 1,
            jump: 1
        };

        // Scale configuration for each action (1.0 = normal, >1 = bigger)
        this.spriteScaleConfig = {
            idle: 1.0,
            walk: 1.0,
            punch: 1.0,
            kick: 1.0,
            special: 1.0,
            block: 1.0,
            hurt: 1.0,
            jump: 1.0
        };
    }

    loadIndividualSprites(baseName, frameConfig = null) {
        this.spriteBaseName = baseName;

        // Use custom frame config if provided
        if (frameConfig) {
            this.spriteFrameConfig = { ...this.spriteFrameConfig, ...frameConfig };
        }

        const actions = ['idle', 'walk', 'punch', 'kick', 'special', 'block', 'hurt', 'jump'];

        actions.forEach(action => {
            const frameCount = this.spriteFrameConfig[action] || 1;
            this.sprites[action] = [];
            let loadedCount = 0;

            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                const imgIndex = i; // Capture index for closure

                img.onload = () => {
                    loadedCount++;
                    // Mark as loaded when all frames are loaded
                    if (loadedCount === frameCount) {
                        this.spritesLoaded[action] = true;
                    }
                    // Enable sprites once we have at least idle loaded
                    if (action === 'idle' && loadedCount === frameCount) {
                        this.useSprites = true;
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load sprite: ${baseName}_${action}${frameCount > 1 ? (imgIndex + 1) : ''}.png`);
                    this.spritesLoaded[action] = false;
                };

                // First frame uses just action name, additional frames use numbered suffix
                if (frameCount === 1) {
                    img.src = `assets/images/${baseName}_${action}.png`;
                } else {
                    img.src = `assets/images/${baseName}_${action}${i + 1}.png`;
                }
                this.sprites[action].push(img);
            }
        });
    }

    setupAnimations() {
        // Override in child classes
        this.animationSystem.addAnimation('idle', [0], 200);
        this.animationSystem.addAnimation('walk', [0, 1, 2, 3], 100);
        this.animationSystem.addAnimation('jump', [0], 100);
        this.animationSystem.addAnimation('attack', [0, 1, 2], 80);
        this.animationSystem.play('idle');
    }

    update(deltaTime, opponent) {
        // Update animation
        const animResult = this.animationSystem.update(deltaTime);

        // Update hurt state
        if (this.isHurt) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
            }
        }

        // Update attack state
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackType = null;
                this.hasHit = false; // Reset for next attack
            }
        }

        // Apply physics
        Physics.applyGravity(this);
        Physics.applyFriction(this);
        Physics.updatePosition(this);

        // Update facing direction
        if (opponent && !this.isAttacking && !this.isHurt) {
            this.facing = opponent.x > this.x ? 1 : -1;
        }

        // Update animation based on state
        this.updateAnimation();
    }

    updateAnimation() {
        if (this.isHurt) {
            this.animationSystem.play('hurt', false);
        } else if (this.isAttacking) {
            this.animationSystem.play('attack', false);
        } else if (!this.isOnGround()) {
            this.animationSystem.play('jump');
        } else if (this.isMoving) {
            this.animationSystem.play('walk');
        } else if (this.isBlocking) {
            this.animationSystem.play('block');
        } else {
            this.animationSystem.play('idle');
        }
    }

    render(ctx) {
        ctx.save();

        // Flash white when hurt
        if (this.isHurt && Math.floor(this.hurtTimer / 50) % 2 === 0) {
            ctx.globalAlpha = 0.7;
        }

        // Priority: Canvas Renderer > Sprites > Simple
        if (this.useCanvasRenderer && typeof CanvasCharacterRenderer !== 'undefined') {
            this.renderCanvas(ctx);
        } else if (this.useSprites) {
            // Flip sprite based on facing direction
            if (this.facing === -1) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(this.x, this.y);
            }
            this.renderSprite(ctx);
        } else {
            // Flip sprite based on facing direction
            if (this.facing === -1) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(this.x, this.y);
            }
            this.renderSimple(ctx);
        }

        ctx.restore();

        // Debug: Draw hitboxes
        if (CONFIG.DEBUG_MODE) {
            this.drawDebugBoxes(ctx);
        }
    }

    renderCanvas(ctx) {
        // Get current pose and frame for canvas rendering
        const pose = this.getSpriteAction();
        const currentFrame = this.animationSystem.getCurrentFrame();

        // Call the canvas character renderer
        CanvasCharacterRenderer.draw(
            ctx,
            this.spriteBaseName,  // 'chief', 'elite', 'brute'
            pose,                  // 'idle', 'walk', 'punch', etc.
            currentFrame,          // animation frame index
            this.x,
            this.y,
            this.width,
            this.height,
            this.facing
        );
    }

    renderSprite(ctx) {
        // Get the appropriate sprite for current state
        const spriteAction = this.getSpriteAction();
        const spriteArray = this.sprites[spriteAction];

        // Fallback to simple rendering if sprite not loaded
        if (!spriteArray || !spriteArray.length || !this.spritesLoaded[spriteAction]) {
            this.renderSimple(ctx);
            return;
        }

        // Get current animation frame
        const currentFrame = this.animationSystem.getCurrentFrame();
        // Clamp frame index to available sprites
        const frameIndex = Math.min(currentFrame, spriteArray.length - 1);
        const sprite = spriteArray[frameIndex];

        if (!sprite || !sprite.complete) {
            this.renderSimple(ctx);
            return;
        }

        // Flash white when hurt
        if (this.isHurt && Math.floor(this.hurtTimer / 50) % 2 === 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.filter = 'brightness(200%)';
        }

        // Get scale multiplier for this action
        const scaleMultiplier = this.spriteScaleConfig[spriteAction] || 1.0;

        // Calculate aspect-ratio-preserving dimensions
        const spriteAspect = sprite.naturalWidth / sprite.naturalHeight;
        const targetAspect = this.width / this.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (spriteAspect > targetAspect) {
            // Sprite is wider - fit to width
            drawWidth = this.width;
            drawHeight = this.width / spriteAspect;
        } else {
            // Sprite is taller - fit to height
            drawHeight = this.height;
            drawWidth = this.height * spriteAspect;
        }

        // Apply scale multiplier
        drawWidth *= scaleMultiplier;
        drawHeight *= scaleMultiplier;

        // Always align to center-bottom (feet on ground)
        offsetX = (this.width - drawWidth) / 2;
        offsetY = this.height - drawHeight;

        // Draw the sprite with preserved aspect ratio
        ctx.drawImage(sprite, offsetX, offsetY, drawWidth, drawHeight);

        // Reset filters
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
    }

    getSpriteAction() {
        // Map states to sprite names
        if (this.isHurt) return 'hurt';
        if (this.isAttacking) {
            if (this.attackType === 'punch') return 'punch';
            if (this.attackType === 'kick') return 'kick';
            if (this.attackType === 'special') return 'special';
            return 'punch';
        }
        if (!this.isOnGround()) return 'jump';
        if (this.isBlocking) return 'block';
        if (this.isMoving) return 'walk';
        return 'idle';
    }

    renderSimple(ctx) {
        // Original simple rendering with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.primaryColor);
        gradient.addColorStop(1, this.secondaryColor);

        // Flash white when hurt
        if (this.isHurt && Math.floor(this.hurtTimer / 50) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = gradient;
        }

        // Body
        ctx.fillRect(0, 0, this.width, this.height);

        // Add some details to make it look more like armor/character
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.width, this.height);

        // Head
        ctx.fillStyle = this.isHurt ? '#ffffff' : this.primaryColor;
        ctx.fillRect(this.width * 0.25, -20, this.width * 0.5, 20);
    }

    drawDebugBoxes(ctx) {
        // Draw hurtbox
        const hurtbox = this.getHurtbox();
        ctx.strokeStyle = CONFIG.HURTBOX_COLOR;
        ctx.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);

        // Draw hitbox if attacking
        if (this.isAttacking) {
            const hitbox = this.getHitbox();
            if (hitbox) {
                ctx.fillStyle = CONFIG.HITBOX_COLOR;
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
        }
    }

    // Movement methods
    moveLeft() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.velocityX = -this.speed;
            this.isMoving = true;
        }
    }

    moveRight() {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.velocityX = this.speed;
            this.isMoving = true;
        }
    }

    stopMoving() {
        this.isMoving = false;
    }

    jump() {
        if (!this.isAttacking && !this.isHurt) {
            if (this.isOnGround()) {
                this.velocityY = this.jumpForce;
                this.isJumping = true;
                this.isJumping = true;
            }
            /* Double jump disabled
            else if (this.canDoubleJump) {
                this.velocityY = this.jumpForce * 0.8;
                this.canDoubleJump = false;
            } */
        }
    }

    // Combat methods
    punch() {
        this.performAttack('punch', 300, 8);
    }

    kick() {
        this.performAttack('kick', 400, 12);
    }

    special() {
        this.performAttack('special', 600, 18);
    }

    performAttack(type, duration, damage) {
        if (!this.isAttacking && !this.isHurt && !this.isBlocking) {
            this.isAttacking = true;
            this.hasFiredProjectile = false;
            this.attackTimer = duration;
            this.attackType = type;
            this.attackDamage = damage;

            // Check for combo
            const now = Date.now();
            if (now - this.lastAttackTime < CONFIG.COMBO_WINDOW) {
                this.comboCount++;
            } else {
                this.comboCount = 1;
            }
            this.lastAttackTime = now;
        }
    }

    block(isBlocking) {
        if (!this.isAttacking && !this.isHurt) {
            this.isBlocking = isBlocking;
        }
    }

    takeDamage(damage, opponent, effectsManager) {
        let actualDamage = damage;

        if (this.isBlocking) {
            actualDamage *= CONFIG.BLOCK_REDUCTION;
        }

        this.health -= actualDamage;
        this.health = Math.max(0, this.health);

        if (!this.isBlocking) {
            this.isHurt = true;
            this.hurtTimer = CONFIG.HIT_STUN_DURATION;
            this.isAttacking = false;

            // Knockback - Always away from attacker
            const directionToAttacker = Math.sign(opponent.x - this.x);
            // If attacker is to the right (1), we move left (-1). If to left (-1), we move right (1).
            // Fallback to -this.facing if positions are identical (rare)
            const knockbackDir = directionToAttacker !== 0 ? -directionToAttacker : -this.facing;

            this.velocityX = knockbackDir * 8;
            this.velocityY = -3;
        }

        // Create visual effects
        if (effectsManager) {
            const hitX = this.x + this.width / 2;
            const hitY = this.y + this.height / 2;

            if (this.isBlocking) {
                effectsManager.createHitSpark(hitX, hitY, '#00d4ff');
            } else {
                effectsManager.createHitSpark(hitX, hitY, '#ffff00');
                effectsManager.createBloodEffect(hitX, hitY, this.primaryColor);
                effectsManager.createImpactFlash(hitX, hitY, 40);
                Utils.screenShake.start(actualDamage / 2, 200);
            }
        }

        return actualDamage;
    }

    // Collision boxes
    getHurtbox() {
        // Hurtbox más pequeña - solo el torso central
        const hurtboxWidth = this.width * 0.6;  // 60% del ancho
        const hurtboxHeight = this.height * 0.7; // 70% de la altura
        const offsetX = this.width * 0.2;  // Centrado
        const offsetY = this.height * 0.15; // Un poco más arriba

        return {
            x: this.x + offsetX,
            y: this.y + offsetY,
            width: hurtboxWidth,
            height: hurtboxHeight
        };
    }

    getHitbox() {
        if (!this.isAttacking) return null;

        let hitboxWidth = 10;  // MICROSCÓPICO
        let hitboxHeight = 15;
        // Hitbox completamente en el borde
        let offsetX = this.facing === 1 ? this.width : -hitboxWidth;
        let offsetY = this.height / 2 - hitboxHeight / 2;

        // Different hitboxes for different attacks
        if (this.attackType === 'kick') {
            hitboxWidth = 12;
            offsetY = this.height / 2;
        } else if (this.attackType === 'special') {
            hitboxWidth = 18;
            hitboxHeight = 20;
            offsetY = this.height / 2 - 10;
        }

        return {
            x: this.x + offsetX,
            y: this.y + offsetY,
            width: hitboxWidth,
            height: hitboxHeight,
            damage: this.attackDamage
        };
    }

    isOnGround() {
        return this.y + this.height >= CONFIG.GROUND_Y;
    }

    isAlive() {
        return this.health > 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.isJumping = false;
        this.isBlocking = false;
        this.isMoving = false;
        this.isAttacking = false;
        this.isHurt = false;
        this.comboCount = 0;
    }
}
