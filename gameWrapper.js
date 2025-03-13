// Game Wrapper - Loads the game script and ensures the initGame function is available

// Create a script element to load the game.js file
const gameScript = document.createElement('script');
gameScript.src = 'game.js';
gameScript.type = 'text/javascript'; // Regular script, not a module

// Add an event listener to know when the script has loaded
gameScript.onload = function() {
    console.log('Game script loaded successfully');
};

gameScript.onerror = function() {
    console.error('Failed to load game script');
};

// Append the script to the document head
document.head.appendChild(gameScript);

console.log('Game wrapper loaded - loading game script');