// Game Wrapper - Loads the game module and exposes the initGame function globally

// Create a script element to load the game.js module
const gameScript = document.createElement('script');
gameScript.type = 'module';
gameScript.textContent = `
    import { initGame } from './game.js';
    window.initGame = initGame;
`;

// Append the script to the document head
document.head.appendChild(gameScript);

console.log('Game wrapper loaded - initGame function will be available shortly');