// Animation System
class AnimationSystem {
    constructor() {
        this.animations = {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    addAnimation(name, frames, frameDuration = 100) {
        this.animations[name] = {
            frames: frames,
            frameDuration: frameDuration,
            loop: true
        };
    }

    play(name, loop = true) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.frameTimer = 0;
            if (this.animations[name]) {
                this.animations[name].loop = loop;
            }
        }
    }

    update(deltaTime) {
        if (!this.currentAnimation || !this.animations[this.currentAnimation]) {
            return;
        }

        const anim = this.animations[this.currentAnimation];
        this.frameTimer += deltaTime;

        if (this.frameTimer >= anim.frameDuration) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frames.length - 1;
                    return 'complete';
                }
            }
        }
    }

    getCurrentFrame() {
        if (!this.currentAnimation || !this.animations[this.currentAnimation]) {
            return 0;
        }
        return this.animations[this.currentAnimation].frames[this.currentFrame];
    }
}
