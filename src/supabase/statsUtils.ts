import { supabase } from './supabaseClient';
import { GameState } from '../components/utils/gameUtils';

// Define types for statistics
export interface UserStats {
  id: string;
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

// Save game result to Supabase
export const saveGameResult = async (
  userId: string,
  gameState: GameState,
  won: boolean
): Promise<void> => {
  if (!userId) {
    console.error('No user ID provided for saving game result');
    return;
  }

  try {
    // First, save the game in the history
    const { error: historyError } = await supabase
      .from('game_history')
      .insert({
        user_id: userId,
        target_word: gameState.targetWord,
        attempts: gameState.attempt,
        won,
        grid: gameState.grid
      });

    if (historyError) {
      throw historyError;
    }

    // Next, update user statistics
    // First, get the current stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw statsError;
    }

    let stats: UserStats;
    
    if (!statsData) {
      // Create initial stats if none exist - this is the first game
      stats = {
        id: userId,
        games_played: 0,
        games_won: 0,
        current_streak: 0,
        max_streak: 0,
        guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
      };
      
      // Get user's display name from Supabase auth
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          // Get display name from user metadata
          const displayName = 
            userData.user.user_metadata?.display_name || 
            userData.user.user_metadata?.full_name || 
            userData.user.email?.split('@')[0] || 
            `Player ${userId.substring(0, 6)}`;
          
          // Add display name to stats
          (stats as any).user_display_name = displayName;
        }
      } catch (authError) {
        console.error('Error fetching user data for display name:', authError);
        // Continue without display name - non-critical error
      }
    } else {
      stats = statsData as UserStats;
    }

    // Update stats based on game result
    stats.games_played += 1;
    
    if (won) {
      stats.games_won += 1;
      stats.current_streak += 1;
      
      // Update guess distribution
      const attempts = gameState.attempt.toString();
      if (stats.guess_distribution[attempts] !== undefined) {
        stats.guess_distribution[attempts] += 1;
      }
      
      // Update max streak if needed
      if (stats.current_streak > stats.max_streak) {
        stats.max_streak = stats.current_streak;
      }
    } else {
      // Reset streak on loss
      stats.current_streak = 0;
    }
    
    // Update stats in database
    const { error: updateError } = !statsData 
      ? await supabase.from('user_stats').insert(stats)
      : await supabase.from('user_stats').update({
          games_played: stats.games_played,
          games_won: stats.games_won,
          current_streak: stats.current_streak,
          max_streak: stats.max_streak,
          guess_distribution: stats.guess_distribution,
          updated_at: new Date().toISOString()
        }).eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log('Game result saved successfully');
  } catch (error) {
    console.error('Error saving game result:', error);
    throw error;
  }
};

// Fetch user stats from Supabase
export const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
  if (!userId) {
    console.error('No user ID provided for fetching stats');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data as UserStats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}; 