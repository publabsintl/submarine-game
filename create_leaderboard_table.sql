-- Create leaderboard table for submarine game
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    wave INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    play_time_seconds INTEGER NOT NULL,
    game_mode TEXT DEFAULT 'single',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON public.leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS leaderboard_player_name_idx ON public.leaderboard (player_name);
CREATE INDEX IF NOT EXISTS leaderboard_difficulty_idx ON public.leaderboard (difficulty);

-- Set up Row Level Security (RLS)
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read leaderboard entries
CREATE POLICY "Allow public read access" 
ON public.leaderboard FOR SELECT USING (true);

-- Create policy to allow anyone to insert their own scores
CREATE POLICY "Allow public insert access" 
ON public.leaderboard FOR INSERT WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.leaderboard IS 'Stores player scores and statistics for the submarine game';
