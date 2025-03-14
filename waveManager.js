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
        
        // Set wave as active
        this.waveActive = true;
        this.waveStartTime = performance.now();
        
        // Show wave message
        this.showWaveMessage();
        
        // Spawn enemies
        this.spawnWaveEnemies();
    }
    
    // Calculate how many enemies to spawn for the current wave
    calculateEnemiesForWave() {
        // Steeper progression curve with higher enemy counts
        
        let baseEnemies;
        
        if (this.currentWave === 1) {
            // First wave has 2 enemies
            baseEnemies = 2;
        } else if (this.currentWave === 2) {
            // Second wave has 5 enemies
            baseEnemies = 5;
        } else if (this.currentWave === 3) {
            // Third wave has 9 enemies
            baseEnemies = 9;
        } else if (this.currentWave <= 5) {
            // Waves 4-5: follow exponential growth
            // Wave 4: ~14 enemies, Wave 5: ~20 enemies
            baseEnemies = Math.round(9 * Math.pow(1.5, this.currentWave - 3));
        } else {
            // Waves 6+: continue exponential growth but slower
            // Roughly: 25, 30, 35, 40...
            baseEnemies = Math.round(20 + 5 * (this.currentWave - 5));
        }
        
        // Apply difficulty multiplier from settings
        // Easy (1): 70% of base enemies
        // Normal (2): 85% of base enemies
        // Hard (3): 100% of base enemies
        // Expert (4): 115% of base enemies
        // Impossible (5): 130% of base enemies
        const difficultyMultipliers = [0.7, 0.85, 1.0, 1.15, 1.3];
        const difficultyIndex = Math.min(Math.max(Math.floor(this.difficultyLevel) - 1, 0), 4);
        const difficultyMultiplier = difficultyMultipliers[difficultyIndex];
        
        // Calculate final enemy count (rounded to nearest integer)
        const enemyCount = Math.round(baseEnemies * difficultyMultiplier);
        
        // Cap at 30 enemies per wave for performance
        this.enemiesRemaining = Math.min(30, enemyCount);
        
        console.log(`Wave ${this.currentWave}: Spawning ${this.enemiesRemaining} enemies (Difficulty: ${this.difficultyLevel})`);
    }
    
    // Spawn enemies for the current wave
    spawnWaveEnemies() {
        if (!this.enemyManager) return;
        
        // Clear any existing enemies
        this.enemyManager.clearEnemies();
        
        // Spawn new enemies for this wave
        for (let i = 0; i < this.enemiesRemaining; i++) {
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
        
        // Calculate enemies for next wave without affecting current state
        // This allows us to show the player what's coming
        const nextWave = this.currentWave;
        let nextWaveEnemies = 0;
        
        // Use the same logic as calculateEnemiesForWave but without modifying state
        if (nextWave === 1) {
            nextWaveEnemies = 2;
        } else if (nextWave === 2) {
            nextWaveEnemies = 5;
        } else if (nextWave === 3) {
            nextWaveEnemies = 9;
        } else if (nextWave <= 5) {
            nextWaveEnemies = Math.round(9 * Math.pow(1.5, nextWave - 3));
        } else {
            nextWaveEnemies = Math.round(20 + 5 * (nextWave - 5));
        }
        
        // Apply difficulty multiplier
        const difficultyMultipliers = [0.7, 0.85, 1.0, 1.15, 1.3];
        const difficultyIndex = Math.min(Math.max(Math.floor(this.difficultyLevel) - 1, 0), 4);
        const difficultyMultiplier = difficultyMultipliers[difficultyIndex];
        nextWaveEnemies = Math.min(30, Math.round(nextWaveEnemies * difficultyMultiplier));
        
        this.countdownElement.textContent = `Wave ${nextWave} starting in ${secondsRemaining}s...`;
        
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
        this.countdownElement.textContent = `Enemies: ${this.enemiesRemaining}`;
        
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