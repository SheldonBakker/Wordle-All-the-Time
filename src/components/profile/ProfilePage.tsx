import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../../supabase/SupabaseContext';
import { supabase, signOut, updateUserProfile } from '../../supabase/supabaseClient';
import StatsDisplay from './StatsDisplay';

interface UserStats {
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<string, number>;
  user_display_name?: string;
}

// Add list of classic cartoon character names for the name generator
const cartoonCharacters = [
  "Mickey Mouse", "Bugs Bunny", "Tom & Jerry", "Donald Duck", "Fred Flintstone",
  "Scooby-Doo", "Daffy Duck", "Tweety Bird", "Popeye", "Woody Woodpecker",
  "Road Runner", "Wile E. Coyote", "Yogi Bear", "Betty Boop", "Porky Pig",
  "Elmer Fudd", "Foghorn Leghorn", "Sylvester", "Pink Panther", "Barney Rubble",
  "Speedy Gonzales", "Felix the Cat", "Huckleberry Hound", "Top Cat", "Snagglepuss",
  "George Jetson", "Droopy", "Marvin the Martian", "Quick Draw McGraw", "Magilla Gorilla",
  "Mighty Mouse", "Atom Ant", "Secret Squirrel", "Heckle and Jeckle", "Deputy Dawg"
];

// Function to get a random cartoon character name
const getRandomCartoonName = () => {
  const randomIndex = Math.floor(Math.random() * cartoonCharacters.length);
  return cartoonCharacters[randomIndex];
};

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useSupabase();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Set initial display name from user metadata
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  // Redirect to home if not logged in (we're using modal auth now)
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  // Handle updating the display name
  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) return;
    
    try {
      setUpdatingName(true);
      setError(null);
      setUpdateSuccess(false);
      
      // Update the user metadata
      const { error: authError } = await updateUserProfile(displayName);
      if (authError) throw authError;
      
      // First ensure the column exists by calling the stored procedure
      try {
        await supabase.rpc('add_display_name_column');
      } catch (columnError) {
        console.error('Error ensuring display name column exists:', columnError);
        // Continue even if this fails - we'll try to update the stats anyway
      }
      
      // Always try to update the user_stats table, even if the check failed
      if (user) {
        try {
          const { error: statsError } = await supabase
            .from('user_stats')
            .update({ user_display_name: displayName })
            .eq('id', user.id);
            
          if (statsError) {
            console.error('Error updating display name in stats:', statsError);
            // This is non-critical, so continue even if it fails
          }
        } catch (statsUpdateError) {
          console.error('Exception updating display name in stats:', statsUpdateError);
          // Also non-critical
        }
      }
      
      setIsEditingName(false);
      setUpdateSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setError(err.message || 'Failed to update display name');
    } finally {
      setUpdatingName(false);
    }
  };

  // Generate a new random cartoon name
  const generateNewCartoonName = () => {
    const newName = getRandomCartoonName();
    setDisplayName(newName);
  };

  // Fetch user stats with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserStats = async () => {
      if (!user) return;
      
      if (isMounted) setStatsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (isMounted) setStats(data as UserStats);
      } catch (error: any) {
        console.error('Error fetching user stats:', error);
        if (isMounted) setError(error.message || 'Failed to load user statistics');
        
        // If no stats found, create an initial stats record
        if (error.code === 'PGRST116' && isMounted) { // No rows returned
          try {
            const initialStats: UserStats = {
              games_played: 0,
              games_won: 0,
              current_streak: 0,
              max_streak: 0,
              guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
            };
            
            // Add user ID to the stats record
            const statsWithId = {
              id: user.id,
              ...initialStats
            };
            
            // Always include user_display_name if possible
            try {
              // First ensure the column exists
              await supabase.rpc('add_display_name_column');
              
              // Add display name from auth metadata
              (statsWithId as any).user_display_name = user.user_metadata?.display_name || 
                                                        user.user_metadata?.full_name || 
                                                        user.email?.split('@')[0] || 
                                                        `Player ${user.id.substring(0, 6)}`;
            } catch (err) {
              console.error('Error with display name column:', err);
              // Continue without adding display name
            }
            
            const { error: insertError } = await supabase
              .from('user_stats')
              .insert(statsWithId);
              
            if (insertError) throw insertError;
            
            if (isMounted) {
              setStats(initialStats);
              setError(null);
            }
          } catch (initError: any) {
            console.error('Error creating initial stats:', initError);
            if (isMounted) setError('Failed to initialize statistics');
          }
        }
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };

    fetchUserStats();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate win percentage for profile header
  const winPercentage = stats && stats.games_played > 0 
    ? Math.round((stats.games_won / stats.games_played) * 100) 
    : 0;

  // Determine player level based on metrics
  const getPlayerLevel = () => {
    if (!stats) return { level: "Newcomer", color: "text-gray-500" };
    
    const { games_played, max_streak } = stats;
    
    if (games_played >= 50 && max_streak >= 10 && winPercentage >= 80) 
      return { level: "Wordsmith Master", color: "text-purple-500" };
    else if (games_played >= 30 && max_streak >= 7 && winPercentage >= 70) 
      return { level: "Word Wizard", color: "text-indigo-500" };
    else if (games_played >= 20 && max_streak >= 5 && winPercentage >= 60) 
      return { level: "Vocabulary Virtuoso", color: "text-blue-500" };
    else if (games_played >= 10 && winPercentage >= 50) 
      return { level: "Word Explorer", color: "text-green-500" };
    else if (games_played >= 5) 
      return { level: "Word Enthusiast", color: "text-teal-500" };
    else 
      return { level: "Beginner", color: "text-gray-500" };
  };

  const playerRank = getPlayerLevel();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Game
        </button>
        
        <button
          onClick={handleSignOut}
          className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zM2 4a2 2 0 012-2h9.586a1 1 0 01.707.293l5 5A1 1 0 0120 8v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" clipRule="evenodd" />
            <path d="M13.707 7.707a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L17 6.414V16a1 1 0 11-2 0V6.414l-1.293 1.293z" />
          </svg>
          Sign Out
        </button>
      </div>
    
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-800/50 mb-6 transform transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {user?.user_metadata?.display_name ? user.user_metadata.display_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {user?.user_metadata?.display_name || 'Player'}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start mt-2 gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${playerRank.color} bg-indigo-100 dark:bg-indigo-900/30`}>
                {playerRank.level}
              </span>
              {stats && stats.current_streak >= 3 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                  🔥 Streak: {stats.current_streak}
                </span>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center pl-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        Performance Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Games Played Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 shadow-md border border-blue-100 dark:border-blue-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-center">
            <div className="text-blue-500 dark:text-blue-300 text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Activity
            </div>
            <div className="text-gray-800 dark:text-white text-3xl font-bold">
              {stats?.games_played || 0}
            </div>
            <div className="mt-1 text-blue-600 dark:text-blue-400 text-sm">Games Played</div>
          </div>
        </div>
        
        {/* Win Percentage Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 shadow-md border border-green-100 dark:border-green-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-center">
            <div className="text-green-500 dark:text-green-300 text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Success
            </div>
            <div className="text-gray-800 dark:text-white text-3xl font-bold">
              {winPercentage}%
            </div>
            <div className="mt-1 text-green-600 dark:text-green-400 text-sm">Win Rate</div>
          </div>
        </div>
        
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 shadow-md border border-amber-100 dark:border-amber-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-center">
            <div className="text-amber-500 dark:text-amber-300 text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Consistency
            </div>
            <div className="text-gray-800 dark:text-white text-3xl font-bold">
              {stats?.max_streak || 0}
            </div>
            <div className="mt-1 text-amber-600 dark:text-amber-400 text-sm">Best Streak</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Title */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center pl-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Profile Details
      </h2>
      
      {/* Main Profile Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Account Settings */}
        <div className="md:col-span-1 order-2 md:order-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Account Info
            </h3>
            
            {/* Display Name Section with Edit Capability */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</span>
                  {!isEditingName ? (
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline focus:outline-none"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                
                {isEditingName ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter display name"
                      />
                      <button
                        onClick={generateNewCartoonName}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        title="Generate random cartoon character name"
                      >
                        🎲
                      </button>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateDisplayName}
                        disabled={updatingName}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingName ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium text-gray-800 dark:text-white px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    {user?.user_metadata?.display_name || 'Not set'}
                  </p>
                )}
              </div>
              
              {updateSuccess && (
                <div className="flex items-center p-3 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Display name updated successfully!
                </div>
              )}
              
              {error && (
                <div className="flex items-center p-3 text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Game Statistics */}
        <div className="md:col-span-2 order-1 md:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Game Statistics
            </h3>
            
            {statsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : stats ? (
              <StatsDisplay stats={stats} />
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg text-gray-700 dark:text-gray-400 font-medium">
                  No statistics available yet
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Complete your first game to see your stats!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 