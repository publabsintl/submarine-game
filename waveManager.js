// Wave Manager Module for Submarine Game

// Wave manager class to handle enemy wave spawning and progression
window.WaveManager = class WaveManager {
    constructor(scene, playerStats, difficultyLevel = 1) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.difficultyLevel = difficultyLevel;
        
        // Make difficulty level globally accessible
        window.currentDifficultyLevel = difficultyLevel;
        
        // Wave properties
        this.currentWave = 1;
        this.enemiesPerWave = 1; // Start with 1 enemy
        this.enemiesRemaining = 0;
        this.waveActive = false;
        this.timeBetweenWaves = 3000; // 3 seconds between waves
        this.waveStartTime = 0;
        this.waveEndTime = 0;
        this.nextWaveCountdown = 0;
        
        // Enemy manager reference (will be set later)
        this.enemyManager = null;
        
        // UI elements
        this.waveMessageElement = null;
        this.countdownElement = null;
        
        // Create UI elements
        this.createWaveUI();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    // Set the enemy manager reference
    setEnemyManager(enemyManager) {
        this.enemyManager = enemyManager;
    }
    
    // Create UI elements for wave messages
    createWaveUI() {
        // Create wave message container
        const waveMessageContainer = document.createElement('div');
        waveMessageContainer.id = 'wave-message-container';
        document.body.appendChild(waveMessageContainer);
        
        // Create wave message element
        this.waveMessageElement = document.createElement('div');
        this.waveMessageElement.id = 'wave-message';
        waveMessageContainer.appendChild(this.waveMessageElement);
        
        // Create countdown element
        this.countdownElement = document.createElement('div');
        this.countdownElement.id = 'wave-countdown';
        waveMessageContainer.appendChild(this.countdownElement);
        
        // Add CSS for wave UI
        const style = document.createElement('style');
        style.textContent = `
            #wave-message-container {
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                color: white;
                font-family: 'Arial', sans-serif;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            #wave-message-container.visible {
                opacity: 1;
            }
            
            #wave-message {
                font-size: 36px;
                text-shadow: 0 0 10px rgba(0, 153, 255, 0.8);
                margin-bottom: 10px;
            }
            
            #wave-countdown {
                font-size: 24px;
                text-shadow: 0 0 8px rgba(0, 153, 255, 0.8);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Listen for enemy destroyed events
        document.addEventListener('enemyDestroyed', () => {
            if (this.waveActive) {
                this.enemiesRemaining--;
                
                // Check if wave is complete
                if (this.enemiesRemaining <= 0) {
                    this.endWave();
                }
            }
        });
        
        // Listen for game over events
        document.addEventListener('gameOver', () => {
            this.waveActive = false;
            this.hideWaveMessage();
        });
        
        // Listen for player respawn events
        document.addEventListener('playerRespawn', () => {
            // If a wave was active, continue it
            if (!this.waveActive && this.enemiesRemaining > 0) {
                this.waveActive = true;
            }
        });
    }
    
    // Start the game with wave 1
    startGame() {
        this.currentWave = 1;
        this.startWave();
    }
    
    // Start a new wave
    startWave() {
        if (!this.enemyManager) {
            console.error('Enemy manager not set in WaveManager');
            return;
        }
        
        // Calculate enemies for this wave
        this.calculateEnemiesForWave();
        
        // Update player stats with current wave
        if (this.playerStats) {
            this.playerStats.setWave(this.currentWave);
        }
        
        // Show wave message
        this.showWaveMessage();
        
        // Set wave as active
        this.waveActive = true;
        this.waveStartTime = performance.now();
        
        // Spawn enemies for this wave
        this.spawnWaveEnemies();
    }
    
    // Calculate how many enemies to spawn for the current wave
    calculateEnemiesForWave() {
        // Base formula: wave number + difficulty modifier
        // This creates a gradual increase in difficulty
        this.enemiesPerWave = Math.min(
            Math.floor(this.currentWave * this.difficultyLevel),
            10 // Cap at 10 enemies per wave for performance
        );
        
        // Ensure at least 1 enemy
        this.enemiesPerWave = Math.max(1, this.enemiesPerWave);
        
        // Set remaining enemies counter
        this.enemiesRemaining = this.enemiesPerWave;
    }
    
    // Spawn enemies for the current wave
    spawnWaveEnemies() {
        if (!this.enemyManager) return;
        
        // Clear any existing enemies
        this.enemyManager.clearEnemies();
        
        // Spawn new enemies for this wave
        for (let i = 0; i < this.enemiesPerWave; i++) {
            // Stagger enemy spawning slightly for better gameplay
            setTimeout(() => {
                if (this.waveActive) { // Only spawn if wave is still active
                    this.enemyManager.spawnEnemy();
                }
            }, i * 500); // 0.5 second between each enemy spawn
        }
    }
    
    // End the current wave
    endWave() {
        this.waveActive = false;
        this.waveEndTime = performance.now();
        
        // Increment wave counter
        this.currentWave++;
        
        // Potentially increase difficulty every few waves
        if (this.currentWave % 3 === 0 && this.difficultyLevel < 5) {
            this.difficultyLevel = Math.min(5, this.difficultyLevel + 0.5);
            window.currentDifficultyLevel = this.difficultyLevel;
            console.log(`Difficulty increased to: ${this.difficultyLevel}`);
        }
        
        // Show wave complete message
        this.showWaveCompleteMessage();
        
        // Start countdown to next wave
        this.startNextWaveCountdown();
    }
    
    // Start countdown to next wave
    startNextWaveCountdown() {
        this.nextWaveCountdown = this.timeBetweenWaves;
        
        // Update countdown display
        this.updateCountdown();
        
        // Set timeout for next wave
        setTimeout(() => {
            this.startWave();
        }, this.timeBetweenWaves);
    }
    
    // Update countdown display
    updateCountdown() {
        if (!this.countdownElement) return;
        
        const updateInterval = 100; // Update every 100ms for smooth countdown
        const secondsRemaining = Math.ceil(this.nextWaveCountdown / 1000);
        
        this.countdownElement.textContent = `Next wave in ${secondsRemaining}...`;
        
        this.nextWaveCountdown -= updateInterval;
        
        if (this.nextWaveCountdown > 0) {
            setTimeout(() => this.updateCountdown(), updateInterval);
        }
    }
    
    // Show wave message
    showWaveMessage() {
        if (!this.waveMessageElement) return;
        
        const container = document.getElementById('wave-message-container');
        if (!container) return;
        
        this.waveMessageElement.textContent = `WAVE ${this.currentWave}`;
        this.countdownElement.textContent = `Enemies: ${this.enemiesPerWave}`;
        
        container.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            container.classList.remove('visible');
        }, 3000);
    }
    
    // Show wave complete message
    showWaveCompleteMessage() {
        if (!this.waveMessageElement) return;
        
        const container = document.getElementById('wave-message-container');
        if (!container) return;
        
        this.waveMessageElement.textContent = `WAVE ${this.currentWave - 1} COMPLETE`;
        
        container.classList.add('visible');
    }
    
    // Hide wave message
    hideWaveMessage() {
        const container = document.getElementById('wave-message-container');
        if (container) {
            container.classList.remove('visible');
        }
    }
    
    // Update function called each frame
    update(deltaTime) {
        // Nothing to update per frame currently
        // Wave progression is handled by events and timeouts
    }
}

// WaveManager class is now available globally as window.WaveManager