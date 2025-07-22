/**
 * T-Rex Runner Game - Main Entry Point
 * This file loads all the game components and initializes the game
 */

// Load all game components
// Note: In a browser environment, you would include these as script tags in HTML
// For module environments, these would be proper imports

// Game initialization function
function onDocumentLoad() {
    new Runner('.interstitial-wrapper');
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', onDocumentLoad);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        onDocumentLoad,
        Runner,
        Trex,
        Obstacle,
        Cloud,
        Horizon,
        HorizonLine,
        NightMode,
        CollisionBox
    };
} 