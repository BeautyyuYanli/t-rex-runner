/**
 * Game configuration and constants for T-Rex Runner
 */

/**
 * Default game configuration.
 * @enum {number}
 */
const RunnerConfig = {
    ACCELERATION: 0.001,
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAMEOVER_CLEAR_TIME: 750,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    INVERT_FADE_DURATION: 12000,
    INVERT_DISTANCE: 700,
    MAX_BLINK_COUNT: 3,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_OBSTACLE_DUPLICATION: 2,
    MAX_SPEED: 13,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3,
    ARCADE_MODE_INITIAL_TOP_POSITION: 35,
    ARCADE_MODE_TOP_POSITION_PERCENT: 0.1,
    AUTO_JUMP_DISTANCE: 120  // Distance threshold for automatic jumping
};

/**
 * Default dimensions.
 * @enum {string}
 */
const DefaultDimensions = {
    WIDTH: 600,
    HEIGHT: 150
};

/**
 * CSS class names.
 * @enum {string}
 */
const Classes = {
    ARCADE_MODE: 'arcade-mode',
    CANVAS: 'runner-canvas',
    CONTAINER: 'runner-container',
    CRASHED: 'crashed',
    ICON: 'icon-offline',
    INVERTED: 'inverted',
    SNACKBAR: 'snackbar',
    SNACKBAR_SHOW: 'snackbar-show',
    TOUCH_CONTROLLER: 'controller'
};

/**
 * Sprite definition layout of the spritesheet.
 * @enum {Object}
 */
const SpriteDefinition = {
    LDPI: {
        CACTUS_LARGE: { x: 332, y: 2 },
        CACTUS_SMALL: { x: 228, y: 2 },
        CLOUD: { x: 86, y: 2 },
        HORIZON: { x: 2, y: 54 },
        MOON: { x: 484, y: 2 },
        PTERODACTYL: { x: 134, y: 2 },
        RESTART: { x: 2, y: 2 },
        TEXT_SPRITE: { x: 655, y: 2 },
        TREX: { x: 848, y: 2 },
        STAR: { x: 645, y: 2 }
    },
    HDPI: {
        CACTUS_LARGE: { x: 652, y: 2 },
        CACTUS_SMALL: { x: 446, y: 2 },
        CLOUD: { x: 166, y: 2 },
        HORIZON: { x: 2, y: 104 },
        MOON: { x: 954, y: 2 },
        PTERODACTYL: { x: 260, y: 2 },
        RESTART: { x: 2, y: 2 },
        TEXT_SPRITE: { x: 1294, y: 2 },
        TREX: { x: 1678, y: 2 },
        STAR: { x: 1276, y: 2 }
    }
};

/**
 * Runner event names.
 * @enum {string}
 */
const Events = {
    ANIM_END: 'webkitAnimationEnd',
    RESIZE: 'resize',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RunnerConfig,
        DefaultDimensions,
        Classes,
        SpriteDefinition,
        Events
    };
} 