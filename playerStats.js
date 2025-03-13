// Player Stats Module for Submarine Game

// Player stats class to manage health, ammo, and lives
window.PlayerStats = class PlayerStats {
    constructor(initialHealth = 100, initialAmmo = 100, initialLives = 3) {
        // Core stats
        this.maxHealth = initialHealth;
        this.health = initialHealth;
        this.maxAmmo = initialAmmo;
        this.ammo = initialAmmo;
        this.maxLives = initialLives;
        this.lives = initialLives;
        
        // Game stats
        this.currentWave = 1;
        this.highestWave = 1;
        
        // UI elements
        this.healthDisplay = null;
        this.ammoDisplay = null;
        this.livesDisplay = null;
        this.waveDisplay = null;
        
        // Initialize UI
        this.createStatsUI();
    }
    
    // Create UI elements for displaying stats
    createStatsUI() {
        // Check if dashboard exists, create it if not
        let dashboard = document.getElementById('dashboard');
        if (!dashboard) {
            dashboard = document.createElement('div');
            dashboard.id = 'dashboard';
            document.body.appendChild(dashboard);
        }
        
        // Add health display
        const healthGauge = this.createGauge('HEALTH', 'health-value', `${this.health}/${this.maxHealth}`);
        this.healthDisplay = healthGauge.querySelector('.gauge-value');
        
        // Add ammo display
        const ammoGauge = this.createGauge('AMMO', 'ammo-value', `${this.ammo}/${this.maxAmmo}`);
        this.ammoDisplay = ammoGauge.querySelector('.gauge-value');
        
        // Add lives display
        const livesGauge = this.createGauge('LIVES', 'lives-value', this.lives);
        this.livesDisplay = livesGauge.querySelector('.gauge-value');
        
        // Add wave display
        const waveGauge = this.createGauge('WAVE', 'wave-value', this.currentWave);
        this.waveDisplay = waveGauge.querySelector('.gauge-value');
        
        // Add gauges to dashboard
        dashboard.appendChild(healthGauge);
        dashboard.appendChild(ammoGauge);
        dashboard.appendChild(livesGauge);
        dashboard.appendChild(waveGauge);
    }
    
    // Helper function to create a gauge element
    createGauge(title, id, value) {
        const gauge = document.createElement('div');
        gauge.classList.add('gauge');
        
        const gaugeTitle = document.createElement('div');
        gaugeTitle.classList.add('gauge-title');
        gaugeTitle.textContent = title;
        
        const gaugeValue = document.createElement('div');
        gaugeValue.classList.add('gauge-value');
        gaugeValue.id = id;
        gaugeValue.textContent = value;
        
        gauge.appendChild(gaugeTitle);
        gauge.appendChild(gaugeValue);
        
        return gauge;
    }
    
    // Update all UI elements
    updateUI() {
        if (this.healthDisplay) this.healthDisplay.textContent = `${this.health}/${this.maxHealth}`;
        if (this.ammoDisplay) this.ammoDisplay.textContent = `${this.ammo}/${this.maxAmmo}`;
        if (this.livesDisplay) this.livesDisplay.textContent = this.lives;
        if (this.waveDisplay) this.waveDisplay.textContent = this.currentWave;
        
        // Update health display color based on health percentage
        if (this.healthDisplay) {
            const healthPercent = this.health / this.maxHealth;
            if (healthPercent <= 0.2) {
                this.healthDisplay.style.color = '#ff0000'; // Red for critical health
            } else if (healthPercent <= 0.5) {
                this.healthDisplay.style.color = '#ffaa00'; // Orange for low health
            } else {
                this.healthDisplay.style.color = '#ffffff'; // White for normal health
            }
        }
        
        // Update ammo display color when low
        if (this.ammoDisplay) {
            const ammoPercent = this.ammo / this.maxAmmo;
            if (ammoPercent <= 0.2) {
                this.ammoDisplay.style.color = '#ffaa00'; // Orange for low ammo
            } else {
                this.ammoDisplay.style.color = '#ffffff'; // White for normal ammo
            }
        }
    }
    
    // Take damage and update health
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateUI();
        
        // Check if player has died
        if (this.health <= 0) {
            this.loseLife();
        }
        
        return this.health;
    }
    
    // Use ammo for firing torpedoes
    useAmmo(amount = 1) {
        if (this.ammo >= amount) {
            this.ammo -= amount;
            this.updateUI();
            return true; // Successfully used ammo
        }
        return false; // Not enough ammo
    }
    
    // Add ammo (from pickup)
    addAmmo(amount) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
        this.updateUI();
        return this.ammo;
    }
    
    // Lose a life and respawn if lives remain
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives > 0) {
            // Respawn player
            this.respawn();
            // Dispatch respawn event
            const respawnEvent = new CustomEvent('playerRespawn');
            document.dispatchEvent(respawnEvent);
        } else {
            // Game over
            this.gameOver();
        }
        
        return this.lives;
    }
    
    // Respawn player with full health
    respawn() {
        this.health = this.maxHealth;
        this.updateUI();
        
        // Show respawn message
        this.showMessage(`Life Lost! ${this.lives} remaining`, 3000);
    }
    
    // Game over when all lives are lost
    gameOver() {
        // Update highest wave reached
        this.highestWave = Math.max(this.highestWave, this.currentWave);
        
        // Dispatch game over event
        const gameOverEvent = new CustomEvent('gameOver', {
            detail: {
                wave: this.currentWave,
                highestWave: this.highestWave
            }
        });
        document.dispatchEvent(gameOverEvent);
        
        // Show game over message
        this.showMessage(`GAME OVER! Highest Wave: ${this.highestWave}`, 5000);
    }
    
    // Set current wave
    setWave(waveNumber) {
        this.currentWave = waveNumber;
        this.highestWave = Math.max(this.highestWave, waveNumber);
        this.updateUI();
    }
    
    // Helper to show temporary messages
    showMessage(text, duration = 3000) {
        // Create or get message container
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            document.body.appendChild(messageContainer);
            
            // Add CSS for message container
            const style = document.createElement('style');
            style.textContent = `
                #message-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    font-family: 'Arial', sans-serif;
                    font-size: 24px;
                    text-align: center;
                    z-index: 1000;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                #message-container.visible {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set message text and show
        messageContainer.textContent = text;
        messageContainer.classList.add('visible');
        
        // Hide after duration
        setTimeout(() => {
            messageContainer.classList.remove('visible');
        }, duration);
    }
}

// PlayerStats class is now available globally as window.PlayerStats