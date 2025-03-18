import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  current_streak: number;
  max_streak: number;
}

interface UserStats {
  id: string;
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  user_display_name?: string;
}

// Map to store display names fetched from Supabase auth
type DisplayNameMap = {
  [userId: string]: string;
};

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayNames, setDisplayNames] = useState<DisplayNameMap>({});

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Add a user-friendly display name based on user ID
  const getDisplayName = (userId: string, savedName?: string): string => {
    // Check if we already have the user's display name in our cache
    if (displayNames[userId]) {
      return displayNames[userId];
    }
    
    // Use the saved name from user_stats if available
    if (savedName) {
      return savedName;
    }
    
    // Fallback to a generic name
    return `Player ${userId.substring(0, 6)}`;
  };

  // Safe implementation that won't fail if the stored procedure doesn't exist
  const ensureDisplayNameColumn = async () => {
    try {
      // Check if the column exists first (this works even for anon users)
      const { error } = await supabase
        .from('user_stats')
        .select('user_display_name')
        .limit(1);
      
      // If we got data or a different error, the column might exist
      if (!error || !error.message.includes('column "user_display_name" does not exist')) {
        return; // Column exists or different error
      }
      
      // Try adding the column with RPC (requires auth and permission)
      try {
        await supabase.rpc('add_display_name_column');
        console.log('Successfully added user_display_name column');
      } catch (rpcError) {
        // RPC failed (normal for anon users), but we can still show stats without display names
        console.log('Could not add column - anonymous users will see generic names');
      }
    } catch (err) {
      // Continue without display name column
      console.error('Error checking for display name column:', err);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to ensure the display_name column exists, but continue if fails
      await ensureDisplayNameColumn();

      // Get user stats with all columns - this works for anonymous users if RLS allows SELECT
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .gt('games_played', 0); // Only include users who have played at least one game

      if (statsError) {
        throw statsError;
      }
      
      if (!statsData || statsData.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Get the current user's info if they're logged in
      let userDisplayNames: DisplayNameMap = {};
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        
        if (currentUser) {
          userDisplayNames[currentUser.id] = 
            currentUser.user_metadata?.display_name || 
            currentUser.user_metadata?.full_name || 
            currentUser.email?.split('@')[0] || 
            `Player ${currentUser.id.substring(0, 6)}`;
            
          // Update display names in local state for future reference
          setDisplayNames(userDisplayNames);
        }
      } catch (authError) {
        // Continue even if auth fails - just means we're in anonymous mode
        console.log('Not logged in or auth error - using generic player names');
      }

      // Create leaderboard entries from stats data
      const leaderboard = statsData.map((stat: UserStats) => {
        const winPercentage = stat.games_played > 0 
          ? Math.round((stat.games_won / stat.games_played) * 100) 
          : 0;
        
        // Get the display name for this user
        let displayName = stat.user_display_name;
        
        // If there's no display name in stats, try to get it from our user cache
        if (!displayName) {
          displayName = getDisplayName(stat.id);
          
          // If we have a better name from auth and we're logged in, update it in the stats table
          if (userDisplayNames[stat.id] && (!displayName || displayName.startsWith('Player'))) {
            const betterName = userDisplayNames[stat.id];
            
            // Only attempt update if user is logged in with matching ID (will fail otherwise due to RLS)
            try {
              supabase
                .from('user_stats')
                .update({ user_display_name: betterName })
                .eq('id', stat.id)
                .then(({ error }) => {
                  if (error) {
                    // This is expected to fail for non-matching users due to RLS
                    console.debug(`Not updating name for ${stat.id} - not authorized`);
                  }
                });
            } catch (updateError) {
              // Ignore update errors for anonymous users
            }
            
            displayName = betterName;
          }
        }
        
        return {
          id: stat.id,
          display_name: displayName || `Player ${stat.id.substring(0, 6)}`,
          games_played: stat.games_played,
          games_won: stat.games_won,
          win_percentage: winPercentage,
          current_streak: stat.current_streak,
          max_streak: stat.max_streak
        };
      });

      // Sort by games won (descending), then by win percentage, then by games played
      const sortedLeaderboard = [...leaderboard].sort((a, b) => 
        b.games_won - a.games_won || 
        b.win_percentage - a.win_percentage || 
        b.games_played - a.games_played
      );
      
      setLeaderboardData(sortedLeaderboard);
    } catch (error: any) {
      console.error('Error fetching leaderboard data:', error);
      setError(error.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  // Function to determine badge for player based on win percentage
  const getPlayerBadge = (winPercentage: number) => {
    if (winPercentage >= 90) return "Wordsmith Master";
    if (winPercentage >= 70) return "Word Wizard";
    if (winPercentage >= 50) return "Vocabulary Virtuoso";
    if (winPercentage >= 30) return "Word Explorer";
    if (winPercentage >= 5) return "Word Enthusiast";
    return "Beginner";
  }

  // Function to get badge color class
  const getBadgeColorClass = (badge: string) => {
    switch (badge) {
      case "Wordsmith Master": return "bg-gradient-to-r from-purple-500 to-indigo-600";
      case "Word Wizard": return "bg-gradient-to-r from-blue-500 to-indigo-500";
      case "Vocabulary Virtuoso": return "bg-gradient-to-r from-green-500 to-teal-500";
      case "Word Explorer": return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "Word Enthusiast": return "bg-gradient-to-r from-teal-500 to-cyan-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  }

  // Get medal for top 3 players

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-indigo-50 dark:bg-indigo-900/20">
        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 text-center">
          Player Rankings
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="p-3 sm:p-5 m-2 sm:m-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-xs sm:text-sm">
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-400 font-medium">
            No players have completed any games yet.
          </p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mt-2">
            Complete a game to be the first on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="p-2 sm:p-4">
          {/* Player Cards */}
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {leaderboardData.map((entry, index) => {
              const badge = getPlayerBadge(entry.win_percentage);
              const badgeColorClass = getBadgeColorClass(badge);
              
              // Determine background gradient based on rank
              let cardBg = "bg-gray-50 dark:bg-gray-800";
              if (index === 0) cardBg = "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border-l-4 border-yellow-500";
              else if (index === 1) cardBg = "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/10 border-l-4 border-gray-400";
              else if (index === 2) cardBg = "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border-l-4 border-amber-700";
              
              return (
                <div 
                  key={entry.id}
                  className={`${cardBg} rounded-lg p-2 sm:p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 relative overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    {/* Rank - horizontal on mobile instead of stacked */}
                    <div className="flex w-full sm:w-24 mb-2 sm:mb-0 mr-0 sm:mr-3">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                        index === 0 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-md' 
                          : index === 1 
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' 
                            : index === 2 
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      } flex items-center justify-center font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <div className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center whitespace-nowrap">
                        {index < 3 ? 'Top Player' : ''}
                      </div>
                      
                      {/* Mobile-only badge */}
                      <div className="ml-auto sm:hidden flex items-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white ${
                          badge === "Word Wizard" ? "bg-blue-600" : badgeColorClass
                        }`}>
                          {badge}
                        </span>
                      </div>
                    </div>
                    
                    {/* Player info and stats - container */}
                    <div className="flex flex-col sm:flex-row w-full items-center">
                      {/* Player info */}
                      <div className="flex-grow">
                        <div className="flex items-center justify-center sm:justify-start flex-wrap sm:flex-nowrap">
                          <div className="relative mr-2 sm:mr-4">
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                              index < 3 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md' 
                                : 'bg-indigo-600'
                            } text-white font-bold text-sm`}>
                              {entry.display_name.charAt(0).toUpperCase()}
                            </div>
                            {entry.current_streak >= 3 && (
                              <div className="absolute -right-1 -bottom-1">
                                <div className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs border border-white dark:border-gray-900">
                                  🔥
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center sm:items-start justify-center">
                            <div className="text-gray-800 dark:text-white font-medium text-sm text-center sm:text-left">
                              {entry.display_name}
                            </div>
                            <div className="flex items-center mt-0.5 hidden sm:flex">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white ${
                                badge === "Word Wizard" ? "bg-blue-600" : badgeColorClass
                              }`}>
                                {badge}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats section - responsive */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full sm:w-auto ml-0 sm:ml-2 mt-2 sm:mt-0 text-center text-xs sm:text-sm">
                        {/* Win % */}
                        <div className="bg-white dark:bg-gray-900/50 rounded p-1 border border-gray-100 dark:border-gray-700">
                          <div className="text-green-600 dark:text-green-500 font-bold text-xs sm:text-sm">
                            {entry.win_percentage}%
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Win Rate</div>
                        </div>
                        
                        {/* W/L */}
                        <div className="bg-white dark:bg-gray-900/50 rounded p-1 border border-gray-100 dark:border-gray-700">
                          <div className="text-xs sm:text-sm">
                            <span className="text-green-600 dark:text-green-500 font-bold">{entry.games_won}</span>
                            <span className="text-gray-500">/</span>
                            <span className="text-red-600 dark:text-red-500 font-bold">{entry.games_played - entry.games_won}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Games</div>
                        </div>
                        
                        {/* Streak */}
                        <div className="bg-white dark:bg-gray-900/50 rounded p-1 border border-gray-100 dark:border-gray-700">
                          <div className="flex justify-center items-center">
                            <span className="text-purple-600 dark:text-purple-500 font-bold text-xs sm:text-sm mr-0.5">{entry.max_streak}</span>
                            {entry.max_streak >= 5 && <span className="text-xs">🏆</span>}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Best Streak
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 