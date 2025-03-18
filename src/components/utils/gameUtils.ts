// utils.ts
export const getRandomWord = (words: string[]): string =>
  words[Math.floor(Math.random() * words.length)];

export interface GameState {
  grid: string[][];
  attempt: number;
  lockedRows: boolean[];
  keyColors: Record<string, string>;
  gameStatus: "correct" | "incorrect" | null;
  targetWord: string;
  lettersEntered: boolean[][];
  cellStates: string[][];
  timestamp?: number;
}

// Create a safe wrapper for localStorage operations
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`Error reading from localStorage (${key}):`, e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`Error writing to localStorage (${key}):`, e);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing from localStorage (${key}):`, e);
      return false;
    }
  }
};

// Check if localStorage is available and working
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = 'wordGameStorageTest';
    const testValue = 'test';
    
    // Try to use the safe wrapper
    if (!safeStorage.setItem(testKey, testValue)) {
      return false;
    }
    
    const retrievedValue = safeStorage.getItem(testKey);
    safeStorage.removeItem(testKey);
    
    return retrievedValue === testValue;
  } catch (e) {
    console.error("Error testing localStorage availability:", e);
    return false;
  }
};

// Get localStorage status message for user feedback
export const getStorageStatusMessage = (): string | null => {
  try {
    if (!isLocalStorageAvailable()) {
      // Check if in private browsing mode (approximate detection)
      try {
        // Try accessing localStorage without storing unused variables
        // Just check that we can access it
        localStorage && sessionStorage;
        
        // If we got here, storage exists but might be full or otherwise restricted
        return "Game progress can't be saved. Your browser may be blocking storage or storage might be full.";
      } catch (e) {
        return "Game progress can't be saved in private/incognito browsing mode.";
      }
    }
    return null;
  } catch (e) {
    return "Game progress can't be saved due to a browser error.";
  }
};

export const saveGameState = (gameState: GameState): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available - game state will not be saved");
    return false;
  }
  
  try {
    // Add timestamp to track when the game was saved
    const stateToSave = {
      ...gameState,
      timestamp: Date.now()
    };
    
    // Convert to JSON string to check size
    let stateJSON: string;
    try {
      stateJSON = JSON.stringify(stateToSave);
    } catch (e) {
      console.error("Error stringifying game state:", e);
      return false;
    }
    
    // Check size before saving (5MB is typical localStorage limit)
    // But we'll warn at 2MB to be safe
    if (stateJSON.length > 2000000) {
      console.warn("Game state is very large, may exceed storage limits");
    }
    
    if (!safeStorage.setItem("wordGame", stateJSON)) {
      throw new Error("Failed to save game state");
    }
    
    console.log("Game state saved successfully at", new Date().toISOString());
    return true;
  } catch (error) {
    console.error("Error saving game state:", error);
    
    // Try to save a minimal version if full save failed
    try {
      // Create minimal state with just essential data
      const minimalState = {
        grid: gameState.grid,
        attempt: gameState.attempt,
        lockedRows: gameState.lockedRows,
        targetWord: gameState.targetWord,
        timestamp: Date.now()
      };
      
      const minimalJSON = JSON.stringify(minimalState);
      if (!safeStorage.setItem("wordGame_minimal", minimalJSON)) {
        throw new Error("Failed to save minimal game state");
      }
      
      console.log("Minimal game state saved as fallback");
      return true;
    } catch (fallbackError) {
      console.error("Failed to save even minimal game state:", fallbackError);
      return false;
    }
  }
};

export const loadGameState = (): GameState | null => {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available - cannot load saved game");
    return null;
  }
  
  try {
    // Try to load the regular save first
    const savedGame = safeStorage.getItem("wordGame");
    
    // Fall back to minimal save if main save doesn't exist
    const minimalSave = !savedGame ? safeStorage.getItem("wordGame_minimal") : null;
    
    if (!savedGame && !minimalSave) {
      console.log("No saved game found");
      return null;
    }
    
    // Parse the available save
    let parsedState: Partial<GameState>;
    try {
      parsedState = savedGame 
        ? JSON.parse(savedGame) as GameState 
        : JSON.parse(minimalSave!) as Partial<GameState>;
    } catch (e) {
      console.error("Error parsing saved game:", e);
      safeStorage.removeItem("wordGame");
      safeStorage.removeItem("wordGame_minimal");
      return null;
    }
    
    // Validate that the saved state has all required properties
    const requiredProps = ['grid', 'attempt', 'lockedRows', 'targetWord'];
    const hasAllProps = requiredProps.every(prop => prop in parsedState);
    
    if (!hasAllProps) {
      console.warn("Saved game state is missing required properties");
      safeStorage.removeItem("wordGame");
      safeStorage.removeItem("wordGame_minimal");
      return null;
    }
    
    // Check if saved state is properly structured
    if (!Array.isArray(parsedState.grid) || !Array.isArray(parsedState.lockedRows)) {
      console.warn("Saved game state has invalid structure");
      safeStorage.removeItem("wordGame");
      safeStorage.removeItem("wordGame_minimal");
      return null;
    }
    
    // If loading from minimal save, reconstruct the full state
    if (!savedGame && minimalSave) {
      console.log("Reconstructing from minimal save");
      
      // Create default values for missing properties
      const fullState: GameState = {
        grid: parsedState.grid!,
        attempt: parsedState.attempt!,
        lockedRows: parsedState.lockedRows!,
        targetWord: parsedState.targetWord!,
        keyColors: parsedState.keyColors || {},
        gameStatus: parsedState.gameStatus || null,
        lettersEntered: parsedState.lettersEntered || 
          Array.from({ length: parsedState.grid!.length }, () => 
            Array(parsedState.grid![0].length).fill(false)
          ),
        cellStates: parsedState.cellStates || 
          Array.from({ length: parsedState.grid!.length }, () => 
            Array(parsedState.grid![0].length).fill("")
          ),
        timestamp: parsedState.timestamp
      };
      
      return fullState;
    }
    
    console.log("Game state loaded successfully from", 
                parsedState.timestamp ? new Date(parsedState.timestamp).toISOString() : "unknown time");
    return parsedState as GameState;
  } catch (error) {
    console.error("Error loading game state:", error);
    // Clear potentially corrupted state
    safeStorage.removeItem("wordGame");
    safeStorage.removeItem("wordGame_minimal");
    return null;
  }
};

export const checkWordExists = async (word: string): Promise<boolean> => {
  try {
    // Add a timeout to prevent hanging requests
    const timeout = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000);
    });
    
    const fetchPromise = fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    
    // Race between the fetch and the timeout
    const response = await Promise.race([fetchPromise, timeout]) as Response;
    return response.ok;
  } catch (error) {
    console.error("Error checking word:", error);
    // MODIFIED: Return false on errors to be strict about word validation
    // This prevents invalid words from being accepted during API failures
    return false;
  }
};

export const resetGameState = () => {
  return {
    grid: Array.from({ length: 6 }, () => Array(5).fill("")),
    attempt: 0,
    lockedRows: Array(6).fill(false),
    keyColors: {},
    error: null,
    gameStatus: null,
    lettersEntered: Array.from({ length: 6 }, () => Array(5).fill(false)),
    targetWord: null,
    cellStates: Array.from({ length: 6 }, () => Array(5).fill("")),
  };
};
