import React from 'react';
import Leaderboard from './Leaderboard';

const LeaderboardPage: React.FC = () => {
  
  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">      
      {/* Stats Cards - Enhanced for day/night mode and made responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-indigo-100 dark:border-indigo-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
          <div className="text-center">
            <div className="text-indigo-500 dark:text-indigo-300 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Success
            </div>
            <div className="text-gray-800 dark:text-white text-base sm:text-xl font-bold">Win Percentage</div>
            <div className="mt-1 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">Based on highest win ratio</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-pink-100 dark:border-pink-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-pink-50 dark:hover:bg-pink-900/30">
          <div className="text-center">
            <div className="text-pink-500 dark:text-pink-300 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Activity
            </div>
            <div className="text-gray-800 dark:text-white text-base sm:text-xl font-bold">Games Played</div>
            <div className="mt-1 text-pink-600 dark:text-pink-400 text-xs sm:text-sm">Most games completed</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-amber-100 dark:border-amber-800/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-amber-50 dark:hover:bg-amber-900/30">
          <div className="text-center">
            <div className="text-amber-500 dark:text-amber-300 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Consistency
            </div>
            <div className="text-gray-800 dark:text-white text-base sm:text-xl font-bold">Longest Streak</div>
            <div className="mt-1 text-amber-600 dark:text-amber-400 text-xs sm:text-sm">Most consecutive wins</div>
          </div>
        </div>
      </div>
        
      {/* Leaderboard Component */}
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage; 