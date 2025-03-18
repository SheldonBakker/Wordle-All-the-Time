# Wordle All the Time

An enhanced Wordle-inspired word guessing game with full user account system, statistics tracking, leaderboard, and responsive design. Challenge yourself with unlimited games!

## Features

- Classic Wordle gameplay with unlimited puzzles
- User authentication (signup/login/password reset)
- Comprehensive statistics tracking:
  - Games played, win percentage, current and max streaks
  - Detailed guess distribution
  - Game history
- Global leaderboard with user rankings
- Dark/light mode toggle
- Responsive design for all devices
- Animation effects for enhanced user experience

## Technologies Used

- React 18
- TypeScript 5
- Tailwind CSS 3.4
- Supabase (Authentication & PostgreSQL Database)
- React Router 6
- React Spring (for animations)
- Vite 6 (build tool)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SheldonBakker/wordle-all-the-time.git
cd wordle-all-the-time
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one
2. Create a new Supabase project
3. Go to the SQL Editor in your Supabase dashboard
4. Run the following SQL to create the required tables:

```sql
-- Create user_stats table
CREATE TABLE user_stats (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  guess_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create game_history table
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  target_word TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  won BOOLEAN NOT NULL,
  grid JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can CRUD their own stats" ON user_stats
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can CRUD their own game history" ON game_history
  FOR ALL USING (auth.uid() = user_id);
```

5. Configure Authentication:
   - Go to Authentication > Settings
   - Enable Email provider
   - Set up any additional auth providers as needed

6. Get your API keys:
   - Go to Project Settings > API
   - Copy the URL and anon key

### 4. Configure Environment Variables

1. Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase URL and anonymous key.

### 5. Run the Development Server

```bash
npm run dev
```

The app should be running at http://localhost:5173

## Deployment

To deploy to production:

```bash
npm run build
```

This creates an optimized production build in the `dist` directory that can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## Usage

- **Play Game**: Visit the home page to play Wordle
- **Sign Up/Login**: Create an account to track your statistics
- **View Stats**: Check your game statistics on the profile page
- **Leaderboard**: Compare your performance with other players
- **Dark Mode**: Toggle between light and dark mode using the theme switch

## Project Structure

- `/src/components/` - React components
  - `/src/components/auth/` - Authentication-related components
  - `/src/components/profile/` - User profile and statistics components
  - `/src/components/leaderboard/` - Leaderboard functionality
  - `/src/components/common/` - Reusable UI components
  - `/src/components/data/` - Data management components
  - `/src/components/styles/` - Style-related components
- `/src/supabase/` - Supabase configuration and utility functions
  - `supabaseClient.ts` - Supabase client initialization
  - `statsUtils.ts` - Statistics management functions
  - `database.types.ts` - TypeScript types for database
- `/src/assets/` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
