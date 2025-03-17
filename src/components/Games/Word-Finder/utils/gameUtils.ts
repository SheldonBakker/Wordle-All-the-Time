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

export const saveGameState = (gameState: GameState): void => {
  try {
    // Add timestamp to track when the game was saved
    const stateToSave = {
      ...gameState,
      timestamp: Date.now()
    };
    localStorage.setItem("wordGame", JSON.stringify(stateToSave));
    console.log("Game state saved successfully at", new Date().toISOString());
  } catch (error) {
    console.error("Error saving game state:", error);
  }
};

export const loadGameState = (): GameState | null => {
  try {
    const savedGame = localStorage.getItem("wordGame");
    if (!savedGame) {
      console.log("No saved game found");
      return null;
    }
    
    const parsedState = JSON.parse(savedGame) as GameState;
    
    // Validate that the saved state has all required properties
    const requiredProps = ['grid', 'attempt', 'lockedRows', 'targetWord', 'lettersEntered', 'cellStates'];
    const hasAllProps = requiredProps.every(prop => prop in parsedState);
    
    if (!hasAllProps) {
      console.warn("Saved game state is missing required properties");
      localStorage.removeItem("wordGame"); // Clear invalid state
      return null;
    }
    
    // Check if saved state is properly structured
    if (!Array.isArray(parsedState.grid) || 
        !Array.isArray(parsedState.lockedRows) || 
        !Array.isArray(parsedState.lettersEntered) ||
        !Array.isArray(parsedState.cellStates)) {
      console.warn("Saved game state has invalid structure");
      localStorage.removeItem("wordGame"); // Clear invalid state
      return null;
    }
    
    console.log("Game state loaded successfully from", 
                parsedState.timestamp ? new Date(parsedState.timestamp).toISOString() : "unknown time");
    return parsedState;
  } catch (error) {
    console.error("Error loading game state:", error);
    localStorage.removeItem("wordGame"); // Clear corrupted state
    return null;
  }
};

export const checkWordExists = async (word: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.ok;
  } catch {
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
