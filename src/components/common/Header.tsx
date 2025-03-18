import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSupabase } from '../../supabase/SupabaseContext';
import { signOut } from '../../supabase/supabaseClient';
import AuthModal from '../auth/AuthModal';
import UserMenu from '../auth/UserMenu';

interface HeaderProps {
  onShowInstructions?: () => void;
  isGamePage?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onShowInstructions, isGamePage = false }) => {
  const { user } = useSupabase();
  const location = useLocation();
  
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  
  // Check if user is admin
  const isAdmin = user?.email?.includes('admin') || false;
  
  // Open auth modal with specific mode
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Close auth modal
  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };
  
  // Add dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user previously set dark mode preference
    const savedDarkMode = localStorage.getItem("wordGameDarkMode");
    // If no saved preference, use system preference
    if (savedDarkMode === null) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return savedDarkMode === "true";
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save dark mode preference
    localStorage.setItem("wordGameDarkMode", String(isDarkMode));
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20 border-b border-indigo-100 dark:border-indigo-800/50 shadow-md transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4 relative">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 hover:scale-105 transition-transform duration-300">
              Wordle All the Time
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Game Controls */}
            {isGamePage && (
              <div className="flex items-center space-x-3 mr-4">
                <button
                  onClick={onShowInstructions}
                  className="py-1.5 px-4 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors duration-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  How to Play
                </button>
              </div>
            )}
            
            {/* Nav Links */}
            <nav>
              <ul className="flex space-x-6 items-center">
                <li>
                  <Link 
                    to="/" 
                    className={`text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ${
                      location.pathname === '/' ? 'font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400 pb-0.5' : ''
                    }`}
                  >
                    Game
                  </Link>
                </li>
                
                <li>
                  <Link 
                    to="/leaderboard" 
                    className={`text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ${
                      location.pathname === '/leaderboard' ? 'font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400 pb-0.5' : ''
                    }`}
                  >
                    Leaderboard
                  </Link>
                </li>
                
                {user && (
                  <li>
                    <Link 
                      to="/profile" 
                      className={`text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ${
                        location.pathname === '/profile' ? 'font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400 pb-0.5' : ''
                      }`}
                    >
                      Profile
                    </Link>
                  </li>
                )}
                
                {/* Admin Link - only visible for admin users */}
                {isAdmin && (
                  <li>
                    <Link 
                      to="/admin" 
                      className={`text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ${
                        location.pathname === '/admin' ? 'font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400 pb-0.5' : ''
                      }`}
                    >
                      Admin
                    </Link>
                  </li>
                )}
                
                {/* Auth Links */}
                <li>
                  {user ? (
                    <UserMenu />
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAuthModal('login')}
                        className="py-1.5 px-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-300"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => openAuthModal('signup')}
                        className="py-1.5 px-4 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </li>
                
                {/* Dark Mode Toggle */}
                <li>
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-indigo-100 dark:border-indigo-800/50 hover:shadow-md transition-all duration-300"
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800/50 shadow-sm text-indigo-500 dark:text-indigo-400 transition-all duration-300"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            
            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800/50 shadow-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-300"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-white dark:bg-gray-800 shadow-xl border-t border-indigo-100 dark:border-indigo-800/50 rounded-b-xl z-50">
            <div className="px-4 py-3 space-y-3">
              {isGamePage && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onShowInstructions?.();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors duration-200"
                  >
                    How to Play
                  </button>
                </div>
              )}
              
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
                <Link
                  to="/"
                  className={`block py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === '/' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Game
                </Link>
                
                <Link
                  to="/leaderboard"
                  className={`block py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === '/leaderboard' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                
                {user && (
                  <Link
                    to="/profile"
                    className={`block py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      location.pathname === '/profile' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                )}
                
                {/* Admin Link for mobile - only visible for admin users */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`block py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                
                {user ? (
                  <button
                    onClick={async () => {
                      await signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 px-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-300"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 px-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-sm transition-all duration-300"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-3 px-3 mt-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-indigo-100 dark:border-indigo-800/50 text-indigo-500 dark:text-indigo-400 hover:shadow-md transition-all duration-300"
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authMode} 
      />
    </header>
  );
};

export default Header; 