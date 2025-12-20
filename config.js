// Game Configuration
const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 576,

    // Physics
    GRAVITY: 0.8,
    GROUND_Y: 480, // Pies alineados con la línea visual del suelo (y=480)
    FRICTION: 0.85,

    // Game settings
    ROUND_TIME: 30,
    MAX_ROUNDS: 3,

    // Character base stats (can be overridden by specific characters)
    BASE_SPEED: 5,
    BASE_JUMP_FORCE: -18,
    BASE_HEALTH: 100,

    // Combat
    HIT_STUN_DURATION: 300, // milliseconds
    BLOCK_REDUCTION: 0, // 100% damage reduction when blocking (0 damage received)
    COMBO_WINDOW: 500, // time window for combos in ms

    // Hitbox colors (for debug mode)
    DEBUG_MODE: false, // Desactivado - hitboxes ya ajustados
    HITBOX_COLOR: 'rgba(255, 0, 0, 0.5)',
    HURTBOX_COLOR: 'rgba(0, 255, 0, 0.5)',
};
