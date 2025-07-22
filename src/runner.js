/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {Object} opt_config
 * @constructor
 * @export
 */
function Runner(outerContainerId, opt_config) {
    // Singleton
    if (Runner.instance_) {
        return Runner.instance_;
    }
    Runner.instance_ = this;

    this.outerContainerEl = document.querySelector(outerContainerId);
    this.containerEl = null;
    this.snackbarEl = null;
    this.detailsButton = this.outerContainerEl.querySelector('#details-button');

    this.config = opt_config || RunnerConfig;

    this.dimensions = DefaultDimensions;

    this.canvas = null;
    this.canvasCtx = null;

    this.tRex = null;

    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / FPS;
    this.currentSpeed = this.config.SPEED;

    this.obstacles = [];

    this.activated = false; // Whether the easter egg has been activated.
    this.playing = false; // Whether the game is currently in play state.
    this.crashed = false;
    this.paused = false;
    this.inverted = false;
    this.invertTimer = 0;
    this.resizeTimerId_ = null;

    this.playCount = 0;

    // Images.
    this.images = {};
    this.imagesLoaded = 0;

    if (this.isDisabled()) {
        this.setupDisabledRunner();
    } else {
        this.loadImages();
    }
}

// Attach static properties from config
Runner.config = RunnerConfig;
Runner.defaultDimensions = DefaultDimensions;
Runner.classes = Classes;
Runner.spriteDefinition = SpriteDefinition;
Runner.events = Events;
Runner.updateCanvasScaling = updateCanvasScaling;

Runner.prototype = {
    /**
     * Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
     * @return {boolean}
     */
    isDisabled: function () {
        // return loadTimeData && loadTimeData.valueExists('disabledEasterEgg');
        return false;
    },

    /**
     * For disabled instances, set up a snackbar with the disabled message.
     */
    setupDisabledRunner: function () {
        this.containerEl = document.createElement('div');
        this.containerEl.className = Runner.classes.SNACKBAR;
        this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg');
        this.outerContainerEl.appendChild(this.containerEl);
    },

    /**
     * Setting individual settings for debugging.
     * @param {string} setting
     * @param {*} value
     */
    updateConfigSetting: function (setting, value) {
        if (setting in this.config && value != undefined) {
            this.config[setting] = value;

            switch (setting) {
                case 'GRAVITY':
                case 'MIN_JUMP_HEIGHT':
                case 'SPEED_DROP_COEFFICIENT':
                    this.tRex.config[setting] = value;
                    break;
                case 'INITIAL_JUMP_VELOCITY':
                    this.tRex.setJumpVelocity(value);
                    break;
                case 'SPEED':
                    this.setSpeed(value);
                    break;
            }
        }
    },

    /**
     * Cache the appropriate image sprite from the page and get the sprite sheet
     * definition.
     */
    loadImages: function () {
        if (IS_HIDPI) {
            Runner.imageSprite = document.getElementById('offline-resources-2x');
            this.spriteDef = Runner.spriteDefinition.HDPI;
        } else {
            Runner.imageSprite = document.getElementById('offline-resources-1x');
            this.spriteDef = Runner.spriteDefinition.LDPI;
        }

        if (Runner.imageSprite.complete) {
            this.init();
        } else {
            // If the images are not yet loaded, add a listener.
            Runner.imageSprite.addEventListener(Runner.events.LOAD,
                this.init.bind(this));
        }
    },

    /**
     * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
     * @param {number} opt_speed
     */
    setSpeed: function (opt_speed) {
        var speed = opt_speed || this.currentSpeed;

        // Reduce the speed on smaller mobile screens.
        if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
            var mobileSpeed = speed * this.dimensions.WIDTH / DEFAULT_WIDTH *
                this.config.MOBILE_SPEED_COEFFICIENT;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        } else if (opt_speed) {
            this.currentSpeed = opt_speed;
        }
    },

    /**
     * Game initialiser.
     */
    init: function () {
        this.adjustDimensions();
        this.setSpeed();

        this.containerEl = document.createElement('div');
        this.containerEl.className = Runner.classes.CONTAINER;
        
        // Set container to full width from the start
        this.containerEl.style.width = this.dimensions.WIDTH + 'px';
        this.containerEl.style.height = this.dimensions.HEIGHT + 'px';

        // Player canvas container.
        this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
            this.dimensions.HEIGHT, Runner.classes.PLAYER);

        this.canvasCtx = this.canvas.getContext('2d');
        this.canvasCtx.fillStyle = '#f7f7f7';
        this.canvasCtx.fill();
        Runner.updateCanvasScaling(this.canvas);

        // Horizon contains clouds, obstacles and the ground.
        this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions,
            this.config.GAP_COEFFICIENT);

        // Draw t-rex
        this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

        this.outerContainerEl.appendChild(this.containerEl);

        this.startGame();
        
        // Auto-start the game with a first jump
        setTimeout(function() {
            if (!this.tRex.jumping) {
                this.tRex.startJump(this.currentSpeed);
            }
        }.bind(this), 500);
        
        this.update();

        window.addEventListener(Runner.events.RESIZE,
            this.debounceResize.bind(this));
    },

    /**
     * Debounce the resize event.
     */
    debounceResize: function () {
        if (!this.resizeTimerId_) {
            this.resizeTimerId_ =
                setInterval(this.adjustDimensions.bind(this), 250);
        }
    },

    /**
     * Adjust game space dimensions on resize.
     */
    adjustDimensions: function () {
        clearInterval(this.resizeTimerId_);
        this.resizeTimerId_ = null;

        var boxStyles = window.getComputedStyle(this.outerContainerEl);
        var padding = Number(boxStyles.paddingLeft.substr(0,
            boxStyles.paddingLeft.length - 2));

        this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
        this.dimensions.WIDTH = Math.min(DEFAULT_WIDTH, this.dimensions.WIDTH); //Arcade Mode
        if (this.activated) {
            this.setArcadeModeContainerScale();
        }
        
        // Redraw the elements back onto the canvas.
        if (this.canvas) {
            this.canvas.width = this.dimensions.WIDTH;
            this.canvas.height = this.dimensions.HEIGHT;

            Runner.updateCanvasScaling(this.canvas);

            this.clearCanvas();
            this.horizon.update(0, 0, true);
            this.tRex.update(0);

            // Outer container.
            if (this.playing || this.crashed || this.paused) {
                this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                this.stop();
            } else {
                this.tRex.draw(0, 0);
            }
        }
    },

    /**
     * Play the game intro.
     * Canvas container is already at full width.
     */
    playIntro: function () {
        if (!this.activated && !this.crashed) {
            this.playingIntro = true;
            this.tRex.playingIntro = true;

            // Start the game immediately
            this.startGame();

            this.playing = true;
            this.activated = true;
        } else if (this.crashed) {
            this.restart();
        }
    },

    /**
     * Update the game status to started.
     */
    startGame: function () {
        this.setArcadeMode();
        this.runningTime = 0;
        this.playingIntro = false;
        this.tRex.playingIntro = false;
        this.containerEl.style.webkitAnimation = '';
        this.playCount++;
        this.playing = true;

        // Handle tabbing off the page. Pause the current game.
        document.addEventListener(Runner.events.VISIBILITY,
            this.onVisibilityChange.bind(this));

        window.addEventListener(Runner.events.BLUR,
            this.onVisibilityChange.bind(this));

        window.addEventListener(Runner.events.FOCUS,
            this.onVisibilityChange.bind(this));
    },

    clearCanvas: function () {
        this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
            this.dimensions.HEIGHT);
    },

    /**
     * Check if dino should auto-jump based on nearby obstacles.
     */
    checkAutoJump: function () {
        if (this.horizon.obstacles.length > 0) {
            var obstacle = this.horizon.obstacles[0];
            var obstacleDistance = obstacle.xPos - this.tRex.xPos;
            
            // Jump if obstacle is within jump distance and dino is not already jumping
            if (obstacleDistance > 0 && obstacleDistance < this.config.AUTO_JUMP_DISTANCE && 
                !this.tRex.jumping && !this.tRex.ducking) {
                this.tRex.startJump(this.currentSpeed);
            }
        }
    },

    /**
     * Update the game frame and schedules the next one.
     */
    update: function () {
        this.updatePending = false;

        var now = getTimeStamp();
        var deltaTime = now - (this.time || now);
        this.time = now;

        if (this.playing) {
            this.clearCanvas();

            if (this.tRex.jumping) {
                this.tRex.updateJump(deltaTime);
            }

            this.runningTime += deltaTime;
            var hasObstacles = this.runningTime > this.config.CLEAR_TIME;

            // First jump triggers the intro.
            if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                this.playIntro();
            }

            // Update horizon normally since intro is immediate
            deltaTime = !this.activated ? 0 : deltaTime;
            this.horizon.update(deltaTime, this.currentSpeed, hasObstacles,
                this.inverted);

            // Check for auto jump
            if (hasObstacles) {
                this.checkAutoJump();
            }

            if (this.currentSpeed < this.config.MAX_SPEED) {
                this.currentSpeed += this.config.ACCELERATION;
            }
        }

        if (this.playing || (!this.activated &&
            this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
            this.tRex.update(deltaTime);
            this.scheduleNextUpdate();
        }
    },

    /**
     * RequestAnimationFrame wrapper.
     */
    scheduleNextUpdate: function () {
        if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
    },

    /**
     * Whether the game is running.
     * @return {boolean}
     */
    isRunning: function () {
        return !!this.raqId;
    },

    stop: function () {
        this.playing = false;
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    },

    play: function () {
        if (!this.crashed) {
            this.playing = true;
            this.paused = false;
            this.tRex.update(0, Trex.status.RUNNING);
            this.time = getTimeStamp();
            this.update();
        }
    },

    restart: function () {
        if (!this.raqId) {
            this.playCount++;
            this.runningTime = 0;
            this.playing = true;
            this.crashed = false;
            this.setSpeed(this.config.SPEED);
            this.time = getTimeStamp();
            this.containerEl.classList.remove(Runner.classes.CRASHED);
            this.clearCanvas();
            this.horizon.reset();
            this.tRex.reset();
            this.invert(true);
            this.update();
        }
    },
    
    /**
     * Hides offline messaging for a fullscreen game only experience.
     */
    setArcadeMode() {
        document.body.classList.add(Runner.classes.ARCADE_MODE);
        this.setArcadeModeContainerScale();
    },

    /**
     * Sets the scaling for arcade mode.
     */
    setArcadeModeContainerScale() {
        const windowHeight = window.innerHeight;
        const scaleHeight = windowHeight / this.dimensions.HEIGHT;
        const scaleWidth = window.innerWidth / this.dimensions.WIDTH;
        const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
        const scaledCanvasHeight = this.dimensions.HEIGHT * scale;
        // Positions the game container at 10% of the available vertical window
        // height minus the game container height.
        const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
                                                  Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
                                              Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT)) *
              window.devicePixelRatio;

        const cssScale = scale;
        this.containerEl.style.transform =
            'scale(' + cssScale + ') translateY(' + translateY + 'px)';
    },
    
    /**
     * Pause the game if the tab is not in focus.
     */
    onVisibilityChange: function (e) {
        if (document.hidden || document.webkitHidden || e.type == 'blur' ||
            document.visibilityState != 'visible') {
            this.stop();
        } else if (!this.crashed) {
            this.tRex.reset();
            this.play();
        }
    },

    /**
     * Inverts the current page / canvas colors.
     * @param {boolean} Whether to reset colors.
     */
    invert: function (reset) {
        if (reset) {
            document.body.classList.toggle(Runner.classes.INVERTED, false);
            this.invertTimer = 0;
            this.inverted = false;
        } else {
            this.inverted = document.body.classList.toggle(Runner.classes.INVERTED,
                this.invertTrigger);
        }
    }
};

// Export the Runner class and make it globally available
window['Runner'] = Runner;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Runner;
} 