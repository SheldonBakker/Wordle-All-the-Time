import React, { useState, RefObject, useEffect } from 'react';
import { signIn, signUp, isDisplayNameTaken } from '../../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Add list of classic cartoon character names
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

type AuthFormProps = {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
  onSwitchMode?: () => void;
  emailInputRef?: RefObject<HTMLInputElement>;
};

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onSwitchMode, emailInputRef }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isNameTaken, setIsNameTaken] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  
  const navigate = useNavigate();

  // Reset error when mode changes and suggest a new name for signup
  useEffect(() => {
    setError(null);
    if (mode === 'signup') {
      generateUniqueName();
    }
  }, [mode]);

  // Check if the name is already taken when display name changes
  useEffect(() => {
    if (mode === 'signup' && displayName.trim()) {
      const checkName = async () => {
        setIsCheckingName(true);
        setNameChecked(false);
        
        try {
          // Add delay to avoid too many requests during typing
          const timeoutId = setTimeout(async () => {
            const taken = await isDisplayNameTaken(displayName);
            setIsNameTaken(taken);
            setNameChecked(true);
            setIsCheckingName(false);
          }, 500);
          
          return () => clearTimeout(timeoutId);
        } catch (err) {
          console.error('Error checking name:', err);
          setIsCheckingName(false);
        }
      };
      
      checkName();
    }
  }, [displayName, mode]);

  const generateUniqueName = async () => {
    let newName = getRandomCartoonName();
    let isTaken = true;
    let attempts = 0;
    
    // Try to find a unique name, but limit attempts to avoid infinite loop
    while (isTaken && attempts < 5) {
      try {
        isTaken = await isDisplayNameTaken(newName);
        if (isTaken) {
          newName = getRandomCartoonName();
        }
      } catch (err) {
        console.error('Error generating unique name:', err);
        break;
      }
      attempts++;
    }
    
    setSuggestedName(newName);
  };

  const handleSuggestNewName = async () => {
    await generateUniqueName();
  };

  const handleUseSuggestedName = () => {
    setDisplayName(suggestedName);
    setIsNameTaken(false);
    setNameChecked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if the name is already taken
    if (mode === 'signup' && isNameTaken) {
      setError("Display name is already taken. Please choose a different name.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      } else {
        // Include display name in user metadata for signup
        const { error } = await signUp(email, password, displayName || suggestedName);
        if (error) throw error;
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/?newUser=true');
        }
      }
    } catch (error: any) {
      console.error(`Auth error (${mode}):`, error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/50 shadow-sm flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-indigo-100 dark:border-indigo-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 dark:text-white shadow-sm transition-all duration-200"
            required
            ref={emailInputRef}
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-indigo-100 dark:border-indigo-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 dark:text-white shadow-sm transition-all duration-200"
            required
            minLength={6}
            placeholder={mode === 'signup' ? "Create a password (min. 6 characters)" : "Enter your password"}
          />
        </div>
        
        {/* Display name field for signup only */}
        {mode === 'signup' && (
          <div>
            <label 
              htmlFor="displayName" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Display Name <span className="text-xs text-indigo-500 dark:text-indigo-400">(must be unique)</span>
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={suggestedName}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-indigo-500 bg-white dark:bg-gray-800 dark:text-white shadow-sm transition-all duration-200 ${
                    isNameTaken 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                      : nameChecked && displayName.trim() 
                        ? 'border-green-300 dark:border-green-700 focus:ring-green-500' 
                        : 'border-indigo-100 dark:border-indigo-800/50 focus:ring-indigo-500'
                  }`}
                />
                
                {isCheckingName && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                
                {!isCheckingName && displayName.trim() && nameChecked && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isNameTaken ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              
              {isNameTaken && displayName.trim() && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  This display name is already taken. Please choose a different one.
                </p>
              )}
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                    Suggested: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{suggestedName}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSuggestNewName}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 shadow-sm"
                    >
                      New Name
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSuggestedName}
                      className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-700/50 transition-colors duration-200 shadow-sm"
                    >
                      Use This Name
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || (mode === 'signup' && isNameTaken)}
          className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Authenticating...</span>
            </div>
          ) : mode === 'login' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="border-t border-indigo-100 dark:border-indigo-800/50 w-full"></div>
          <div className="px-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white dark:bg-gray-800">or</div>
          <div className="border-t border-indigo-100 dark:border-indigo-800/50 w-full"></div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? (
            <>
              Don't have an account yet?{' '}
              {onSwitchMode ? (
                <button 
                  type="button"
                  onClick={onSwitchMode} 
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                >
                  Create an Account
                </button>
              ) : (
                <a href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                  Create an Account
                </a>
              )}
            </>
          ) : (
            <>
              Already have an account?{' '}
              {onSwitchMode ? (
                <button 
                  type="button"
                  onClick={onSwitchMode} 
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
              ) : (
                <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                  Sign In
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 