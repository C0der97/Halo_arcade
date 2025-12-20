// Utility Functions
const Utils = {
    // Check collision between two rectangles
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Linear interpolation
    lerp(start, end, amount) {
        return start + (end - start) * amount;
    },

    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Distance between two points
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // Screen shake effect
    screenShake: {
        intensity: 0,
        duration: 0,
        timer: 0,

        start(intensity, duration) {
            this.intensity = intensity;
            this.duration = duration;
            this.timer = duration;
        },

        update(deltaTime) {
            if (this.timer > 0) {
                this.timer -= deltaTime;
                return {
                    x: (Math.random() - 0.5) * this.intensity * (this.timer / this.duration),
                    y: (Math.random() - 0.5) * this.intensity * (this.timer / this.duration)
                };
            }
            return { x: 0, y: 0 };
        }
    }
};
