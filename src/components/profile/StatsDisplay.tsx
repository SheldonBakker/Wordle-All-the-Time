import React from 'react';

interface StatsProps {
  stats: {
    games_played: number;
    games_won: number;
    current_streak: number;
    max_streak: number;
    guess_distribution: Record<string, number>;
  };
}

const StatsDisplay: React.FC<StatsProps> = ({ stats }) => {
  const winPercentage = stats.games_played > 0 
    ? Math.round((stats.games_won / stats.games_played) * 100) 
    : 0;
  
  // Get the maximum value in the distribution for scaling
  const maxDistribution = Math.max(
    ...Object.values(stats.guess_distribution),
    1 // Ensure we don't divide by zero
  );
  
  // Calculate total guesses for percentage
  const totalGuesses = Object.values(stats.guess_distribution).reduce((sum, count) => sum + count, 0);

  // Get gradient color based on number of guesses
  const getBarColor = (guessNumber: number): string => {
    switch(guessNumber) {
      case 1: return 'from-emerald-500 to-green-600';
      case 2: return 'from-green-500 to-teal-600';
      case 3: return 'from-teal-500 to-blue-600';
      case 4: return 'from-blue-500 to-indigo-600';
      case 5: return 'from-indigo-500 to-purple-600';
      case 6: return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">      
      {/* Guess Distribution */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Guess Distribution
        </h3>
        
        <div className="space-y-2">
          {Object.entries(stats.guess_distribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([guess, count]) => {
              const percentage = totalGuesses > 0 ? Math.max((count / maxDistribution) * 100, 4) : 0;
              const displayPercentage = totalGuesses > 0 ? Math.round((count / totalGuesses) * 100) : 0;
              
              return (
                <div key={guess} className="flex items-center">
                  <div className="w-6 text-sm font-bold text-gray-700 dark:text-gray-300 mr-2">{guess}</div>
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(parseInt(guess))} text-white flex items-center justify-end pr-2 text-xs font-medium transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && (
                        <div className="flex items-center">
                          <span>{count}</span>
                          <span className="ml-1 text-white/80">({displayPercentage}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-3 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Games</div>
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{stats.games_played}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-3 shadow-sm border border-green-100 dark:border-green-800/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Win %</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">{winPercentage}%</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-3 shadow-sm border border-amber-100 dark:border-amber-800/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current</div>
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.current_streak}</span>
              {stats.current_streak > 0 && (
                <span className="ml-1 text-amber-500">🔥</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-3 shadow-sm border border-pink-100 dark:border-pink-800/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Max</div>
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold text-pink-700 dark:text-pink-400">{stats.max_streak}</span>
              {stats.max_streak >= 5 && (
                <span className="ml-1 text-pink-500">🏆</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay; 