// Supabase Manager for Submarine Game
// Handles leaderboards and player score persistence

window.SupabaseManager = class SupabaseManager {
    constructor() {
        // Supabase configuration
        // NOTE: Replace these with your actual Supabase project URL and anon key
        this.supabaseUrl = 'https://fgqonjqmlumeoxmxqwvr.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncW9uanFtbHVtZW94bXhxd3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5Nzg3NDEsImV4cCI6MjA1NzU1NDc0MX0._dWHGoVB2fW77o2wd4W8rf5upV2cybDe619TLtrH1kY';
        
        // Initialize Supabase client
        this.supabase = null;
        
        // Player info
        this.currentPlayer = null;
        
        // Initialize
        this.initialize();
    }
    
    // Initialize Supabase connection
    initialize() {
        try {
            // Check if Supabase client is available
            if (typeof supabase === 'undefined') {
                console.error('Supabase client not loaded! Make sure to include the Supabase script in your HTML.');
                return;
            }
            
            console.log('Creating Supabase client with URL:', this.supabaseUrl);
            // Create Supabase client
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase client initialized successfully');
            
            // Test the connection
            this.testConnection();
            
            // Handle auth state changes (if we implement authentication later)
            this.supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    console.log('User signed in:', session.user);
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                }
            });
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
        }
    }
    
    // Test the Supabase connection
    async testConnection() {
        try {
            console.log('Testing Supabase connection...');
            const { data, error } = await this.supabase
                .from('leaderboard')
                .select('*')
                .limit(1);
                
            if (error) {
                console.error('Supabase connection test failed:', error);
                return false;
            }
            
            console.log('Supabase connection test successful. Found leaderboard table.');
            return true;
        } catch (error) {
            console.error('Exception during Supabase connection test:', error);
            return false;
        }
    }
    
    // Set current player info
    setCurrentPlayer(playerName, difficulty) {
        this.currentPlayer = {
            name: playerName || 'Anonymous',
            difficulty: difficulty || 3
        };
        console.log('Current player set:', this.currentPlayer);
    }
    
    // Submit a score to the leaderboard
    async submitScore(score, wave, playTime, gameMode = 'single') {
        if (!this.supabase) {
            console.error('Supabase client not initialized');
            return null;
        }
        
        if (!this.currentPlayer) {
            console.error('Current player not set, cannot submit score');
            return null;
        }
        
        // Validate inputs to prevent null values
        score = score || 0;
        wave = wave || 1;
        playTime = playTime || 0;
        gameMode = gameMode || 'single';
        
        console.log('Submitting score with data:', {
            player_name: this.currentPlayer.name,
            score,
            wave,
            difficulty: this.currentPlayer.difficulty,
            play_time_seconds: playTime,
            game_mode: gameMode
        });
        
        const scoreData = {
            player_name: this.currentPlayer.name || 'Anonymous',
            score: score,
            wave: wave,
            difficulty: this.currentPlayer.difficulty || 'normal',
            play_time_seconds: playTime,
            game_mode: gameMode,
            created_at: new Date().toISOString()
        };
        
        try {
            console.log('Sending score data to Supabase...');
            const { data, error } = await this.supabase
                .from('leaderboard')
                .insert([scoreData])
                .select();
                
            if (error) {
                console.error('Error submitting score:', error);
                return null;
            }
            
            console.log('Score submitted successfully:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Exception submitting score:', error);
            return null;
        }
    }
    
    // Get top scores from the leaderboard
    async getTopScores(limit = 10, difficultyFilter = null, gameMode = null) {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return [];
        }
        
        try {
            let query = this.supabase
                .from('leaderboard')
                .select('*')
                .order('score', { ascending: false })
                .limit(limit);
                
            // Apply difficulty filter if specified
            if (difficultyFilter !== null) {
                query = query.eq('difficulty', difficultyFilter);
            }
            
            // Apply game mode filter if specified
            if (gameMode !== null) {
                query = query.eq('game_mode', gameMode);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('Error fetching leaderboard:', error);
                return [];
            }
            
            console.log(`Retrieved ${data.length} leaderboard entries`);
            return data;
        } catch (error) {
            console.error('Exception fetching leaderboard:', error);
            return [];
        }
    }
    
    // Get player's personal best scores
    async getPlayerBestScores(playerName, limit = 5) {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return [];
        }
        
        if (!playerName && this.currentPlayer) {
            playerName = this.currentPlayer.name;
        }
        
        if (!playerName) {
            console.error('No player name specified');
            return [];
        }
        
        try {
            const { data, error } = await this.supabase
                .from('leaderboard')
                .select('*')
                .eq('player_name', playerName)
                .order('score', { ascending: false })
                .limit(limit);
                
            if (error) {
                console.error('Error fetching player scores:', error);
                return [];
            }
            
            console.log(`Retrieved ${data.length} scores for player ${playerName}`);
            return data;
        } catch (error) {
            console.error('Exception fetching player scores:', error);
            return [];
        }
    }
    
    // Create a formatted HTML leaderboard
    createLeaderboardHTML(scores) {
        if (!scores || scores.length === 0) {
            return '<p>No scores available</p>';
        }
        
        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Wave</th>
                        <th>Difficulty</th>
                        <th>Game Mode</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        const difficultyNames = ['Easy', 'Normal', 'Hard', 'Expert', 'Impossible'];
        
        scores.forEach((score, index) => {
            const date = new Date(score.created_at).toLocaleDateString();
            const difficultyName = difficultyNames[score.difficulty - 1] || 'Unknown';
            
            html += `
                <tr class="${index < 3 ? 'top-score' : ''}">
                    <td>${index + 1}</td>
                    <td>${score.player_name}</td>
                    <td>${score.score.toLocaleString()}</td>
                    <td>${score.wave}</td>
                    <td>${difficultyName}</td>
                    <td>${score.game_mode}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    }
    
    // Show leaderboard in a modal
    async showLeaderboardModal() {
        console.log('Showing leaderboard modal...');
        
        try {
            // Get top scores
            const scores = await this.getTopScores(10, null, 'single');
            
            if (!scores || scores.length === 0) {
                alert('No scores available yet. Be the first to set a high score!');
                return;
            }
            
            // Create modal container if it doesn't exist
            let modal = document.getElementById('leaderboard-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'leaderboard-modal';
                modal.style.position = 'fixed';
                modal.style.top = '50%';
                modal.style.left = '50%';
                modal.style.transform = 'translate(-50%, -50%)';
                modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                modal.style.padding = '20px';
                modal.style.borderRadius = '10px';
                modal.style.color = 'white';
                modal.style.zIndex = '1000';
                modal.style.minWidth = '500px';
                modal.style.maxHeight = '80vh';
                modal.style.overflowY = 'auto';
                modal.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
                document.body.appendChild(modal);
            }
            
            // Clear previous content
            modal.innerHTML = '';
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = 'Top Submarine Captains';
            title.style.textAlign = 'center';
            title.style.marginBottom = '20px';
            title.style.color = '#00cc44';
            modal.appendChild(title);
            
            // Create table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '20px';
            
            // Add table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const headers = ['Rank', 'Captain', 'Score', 'Wave', 'Difficulty', 'Play Time'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.padding = '10px';
                th.style.borderBottom = '2px solid #00cc44';
                th.style.textAlign = 'left';
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Add table body
            const tbody = document.createElement('tbody');
            
            scores.forEach((score, index) => {
                const row = document.createElement('tr');
                
                // Format play time
                const minutes = Math.floor(score.play_time_seconds / 60);
                const seconds = score.play_time_seconds % 60;
                const formattedTime = `${minutes}m ${seconds}s`;
                
                // Add cells
                const cells = [
                    `#${index + 1}`,
                    score.player_name,
                    score.score.toLocaleString(),
                    score.wave,
                    this.getDifficultyName(score.difficulty),
                    formattedTime
                ];
                
                cells.forEach(cellText => {
                    const td = document.createElement('td');
                    td.textContent = cellText;
                    td.style.padding = '10px';
                    td.style.borderBottom = '1px solid rgba(0, 204, 68, 0.3)';
                    row.appendChild(td);
                });
                
                // Highlight current player's score
                if (this.currentPlayer && score.player_name === this.currentPlayer.name) {
                    row.style.backgroundColor = 'rgba(0, 204, 68, 0.2)';
                    row.style.fontWeight = 'bold';
                }
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            modal.appendChild(table);
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.display = 'block';
            closeButton.style.margin = '0 auto';
            closeButton.style.padding = '10px 20px';
            closeButton.style.backgroundColor = '#00cc44';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '5px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => {
                document.body.removeChild(modal);
            };
            
            modal.appendChild(closeButton);
        } catch (error) {
            console.error('Error showing leaderboard:', error);
            alert('Failed to load leaderboard. Please try again later.');
        }
    }
    
    // Helper method to get difficulty name
    getDifficultyName(difficultyLevel) {
        const difficultyNames = {
            1: 'Easy',
            2: 'Normal',
            3: 'Hard',
            4: 'Expert',
            5: 'Impossible'
        };
        
        return difficultyNames[difficultyLevel] || `Level ${difficultyLevel}`;
    }
};

// Add CSS styles for the leaderboard
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .game-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
        }
        
        .modal-content {
            background-color: #121212;
            color: #ffffff;
            margin: 10% auto;
            padding: 20px;
            border: 1px solid #3d85c6;
            width: 80%;
            max-width: 800px;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 150, 255, 0.5);
        }
        
        .close-button {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close-button:hover {
            color: #fff;
        }
        
        .leaderboard-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            color: #ddd;
        }
        
        .leaderboard-table th, .leaderboard-table td {
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #444;
        }
        
        .leaderboard-table th {
            background-color: #1a1a1a;
            color: #3d85c6;
        }
        
        .leaderboard-table .top-score {
            background-color: rgba(61, 133, 198, 0.2);
        }
        
        .difficulty-selector {
            margin: 15px 0;
        }
        
        .difficulty-selector select {
            background-color: #333;
            color: #fff;
            padding: 5px 10px;
            border: 1px solid #555;
            border-radius: 4px;
        }
        
        .game-mode-selector {
            margin: 15px 0;
        }
        
        .game-mode-selector select {
            background-color: #333;
            color: #fff;
            padding: 5px 10px;
            border: 1px solid #555;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
});

// Export the SupabaseManager class to the global scope
window.SupabaseManager = SupabaseManager;
