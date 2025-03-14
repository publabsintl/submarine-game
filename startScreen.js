// Start Screen Module for Submarine Game

// Global variables to store player settings
let playerName = "Captain";
let submarineColor = 0x333344; // Default color
let difficultyLevel = 1; // Default difficulty (1-5)

// Function to create and manage the start screen
function createStartScreen() {
    // Create the start screen container
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    
    // Create the title
    const title = document.createElement('h1');
    title.textContent = 'Advanced Submarine Battle Simulator';
    title.classList.add('game-title');
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('buttons-container');
    
    // Create buttons
    const singlePlayerButton = createButton('Single Player', () => {
        // Show customization screen instead of starting game directly
        showCustomizationScreen(startScreen);
    });
    
    const multiPlayerButton = createButton('Multiplayer', () => {
        // Hide the start screen
        hideStartScreen();
        
        // Initialize the game in multiplayer mode
        if (typeof initGame === 'function') {
            initGame('multi');
        } else {
            console.error('initGame function not found');
        }
    });
    
    // Create leaderboard button
    const leaderboardButton = createButton('Leaderboard', () => {
        // Show leaderboard
        if (typeof SupabaseManager !== 'undefined') {
            const supabase = new SupabaseManager();
            supabase.showLeaderboardModal();
        } else {
            console.error('SupabaseManager not found');
        }
    });
    
    // Create controls button
    const controlsButton = createButton('Controls', () => {
        // Show controls modal
        const controlsModal = document.getElementById('controls-modal');
        if (controlsModal) {
            controlsModal.style.display = 'flex';
        } else {
            console.error('Controls modal not found');
        }
    });
    
    // Add buttons to container
    buttonsContainer.appendChild(singlePlayerButton);
    buttonsContainer.appendChild(multiPlayerButton);
    buttonsContainer.appendChild(leaderboardButton);
    buttonsContainer.appendChild(controlsButton);
    
    // Add elements to start screen
    startScreen.appendChild(title);
    startScreen.appendChild(buttonsContainer);
    
    // Add start screen to body
    document.body.appendChild(startScreen);
    
    // Hide dashboard and controls initially
    const dashboard = document.getElementById('dashboard');
    const controlsInfo = document.getElementById('controls-info');
    
    if (dashboard) dashboard.style.display = 'none';
    if (controlsInfo) controlsInfo.style.display = 'none';
    
    // Add CSS styles for the start screen
    addStartScreenStyles();
    
    // Function to hide the start screen
    function hideStartScreen() {
        startScreen.style.display = 'none';
        
        // Show dashboard and controls
        if (dashboard) dashboard.style.display = 'flex';
        if (controlsInfo) controlsInfo.style.display = 'block';
    }
}

// Function to show the customization screen
function showCustomizationScreen(startScreen) {
    // Hide the main menu
    startScreen.style.display = 'none';
    
    // Create customization screen
    const customScreen = document.createElement('div');
    customScreen.id = 'customization-screen';
    customScreen.classList.add('start-screen');
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Customize Your Submarine';
    title.classList.add('game-title');
    
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.classList.add('form-container');
    
    // Name input
    const nameGroup = document.createElement('div');
    nameGroup.classList.add('form-group');
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Captain Name:';
    nameLabel.setAttribute('for', 'player-name');
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'player-name';
    nameInput.value = playerName;
    nameInput.placeholder = 'Enter your name';
    
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    
    // Color selection
    const colorGroup = document.createElement('div');
    colorGroup.classList.add('form-group');
    
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Submarine Color:';
    
    const colorOptions = document.createElement('div');
    colorOptions.classList.add('color-options');
    
    // Color choices
    const colors = [
        { name: 'Navy Blue', value: 0x333344 },
        { name: 'Green', value: 0x006600 },
        { name: 'Black', value: 0x111111 },
        { name: 'Yellow', value: 0xCCAA00 },
        { name: 'Orange', value: 0xCC6600 }
    ];
    
    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.classList.add('color-option');
        colorOption.style.backgroundColor = '#' + color.value.toString(16).padStart(6, '0');
        colorOption.setAttribute('data-color', color.value);
        colorOption.setAttribute('title', color.name);
        
        if (color.value === submarineColor) {
            colorOption.classList.add('selected');
        }
        
        colorOption.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            colorOption.classList.add('selected');
            
            // Update selected color
            submarineColor = parseInt(colorOption.getAttribute('data-color'));
        });
        
        colorOptions.appendChild(colorOption);
    });
    
    colorGroup.appendChild(colorLabel);
    colorGroup.appendChild(colorOptions);
    
    // Difficulty selection
    const difficultyGroup = document.createElement('div');
    difficultyGroup.classList.add('form-group');
    
    const difficultyLabel = document.createElement('label');
    difficultyLabel.textContent = 'Difficulty Level:';
    
    const difficultySelect = document.createElement('select');
    difficultySelect.id = 'difficulty-level';
    
    const difficultyOptions = [
        { value: 1, name: 'Easy - Inaccurate enemy torpedoes' },
        { value: 2, name: 'Normal - Slightly inaccurate torpedoes' },
        { value: 3, name: 'Hard - Moderately accurate torpedoes' },
        { value: 4, name: 'Expert - Highly accurate torpedoes' },
        { value: 5, name: 'Impossible - Perfect aim torpedoes' }
    ];
    
    difficultyOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.name;
        if (option.value === difficultyLevel) {
            optionElement.selected = true;
        }
        difficultySelect.appendChild(optionElement);
    });
    
    difficultyGroup.appendChild(difficultyLabel);
    difficultyGroup.appendChild(difficultySelect);
    
    // Start game button
    const startButton = createButton('Start Mission', () => {
        // Save player settings
        playerName = nameInput.value || "Captain";
        difficultyLevel = parseInt(difficultySelect.value);
        
        // Remove customization screen
        document.body.removeChild(customScreen);
        
        // Show dashboard and controls
        const dashboard = document.getElementById('dashboard');
        const controlsInfo = document.getElementById('controls-info');
        
        if (dashboard) dashboard.style.display = 'flex';
        
        // Initialize the game with player settings
        if (typeof initGame === 'function') {
            // Create player settings object
            const playerSettings = {
                playerName: playerName,
                submarineColor: submarineColor,
                difficultyLevel: difficultyLevel
            };
            
            // Store player name in window object for score submission
            window.playerName = playerName;
            
            // Initialize the game with player settings
            initGame('single', playerSettings);
        } else {
            console.error('initGame function not found');
        }
    });
    
    // Back button
    const backButton = createButton('Back', () => {
        // Remove customization screen
        document.body.removeChild(customScreen);
        
        // Show start screen again
        startScreen.style.display = 'flex';
    });
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('buttons-container');
    
    // Add buttons to container
    buttonsContainer.appendChild(startButton);
    buttonsContainer.appendChild(backButton);
    
    // Add form groups to form container
    formContainer.appendChild(nameGroup);
    formContainer.appendChild(colorGroup);
    formContainer.appendChild(difficultyGroup);
    
    // Add elements to customization screen
    customScreen.appendChild(title);
    customScreen.appendChild(formContainer);
    customScreen.appendChild(buttonsContainer);
    
    // Add customization screen to body
    document.body.appendChild(customScreen);
}

// Helper function to create a button
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('start-button');
    button.addEventListener('click', onClick);
    return button;
}

// Function to add CSS styles for the start screen
function addStartScreenStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #start-screen, #customization-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #001a33, #000033);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .game-title {
            color: #99D6FF;
            font-family: 'Arial', sans-serif;
            font-size: 3rem;
            text-shadow: 0 0 10px rgba(153, 214, 255, 0.7);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        #customization-screen .game-title {
            font-size: 2.5rem;
        }
        
        .buttons-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 300px;
        }
        
        .start-button {
            background-color: rgba(0, 102, 153, 0.7);
            color: white;
            border: 2px solid #0099cc;
            border-radius: 5px;
            padding: 15px 30px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Arial', sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .start-button:hover {
            background-color: rgba(0, 153, 204, 0.9);
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(0, 153, 204, 0.7);
        }
        
        .start-button:active {
            transform: scale(0.98);
        }
        
        /* Customization screen styles */
        .form-container {
            background-color: rgba(0, 51, 102, 0.7);
            border-radius: 10px;
            padding: 20px;
            width: 400px;
            margin-bottom: 20px;
            box-shadow: 0 0 20px rgba(0, 153, 204, 0.5);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #99D6FF;
            font-family: 'Arial', sans-serif;
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            background-color: rgba(0, 25, 51, 0.7);
            border: 1px solid #0099cc;
            border-radius: 5px;
            color: white;
            font-family: 'Arial', sans-serif;
            font-size: 1rem;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #33ccff;
            box-shadow: 0 0 10px rgba(51, 204, 255, 0.5);
        }
        
        .color-options {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        .color-option {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .color-option:hover {
            transform: scale(1.1);
        }
        
        .color-option.selected {
            border-color: #ffffff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
        }
    `;
    document.head.appendChild(style);
}