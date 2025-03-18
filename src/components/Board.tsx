import React, { useState, useRef, useEffect } from "react";
import WordGameBoard from "./WordGameBoard";
import Keyboard from "./Keyboard";
import InstructionsModal from "./InstructionsModal";
import words from "./data/words.json";
import {
  getRandomWord,
  saveGameState,
  loadGameState,
  checkWordExists,
  resetGameState,
  GameState,
  getStorageStatusMessage,
  isLocalStorageAvailable,
} from "./utils/gameUtils";
import "./styles/anime.css";
import { useSupabase } from "../supabase/SupabaseContext";
import { saveGameResult } from "../supabase/statsUtils";

// ADDED: Define the Confetti component
const Confetti: React.FC = () => {
  return (
    <div className="confetti-container">
      {Array.from({ length: 150 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            backgroundColor: [
              '#6aaa64', // Green
              '#ffd700', // Gold
              '#ff4500', // Orange-red
              '#00bfff', // Deep sky blue
              '#ff1493', // Deep pink
            ][Math.floor(Math.random() * 5)],
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 4 + 2}px`,
          }}
        />
      ))}
    </div>
  );
};

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

// SaveStatus component to show when the game is saved
const SaveStatus: React.FC<{ visible: boolean; message?: string; isError?: boolean }> = ({ 
  visible, 
  message = "Game progress saved",
  isError = false
}) => {
  if (!visible) return null;
  
  return (
    <div className={`save-status fixed bottom-4 right-4 py-1 px-3 rounded-md text-sm transition-opacity duration-500 opacity-70 ${
      isError 
        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" 
        : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
    }`}>
      {message}
    </div>
  );
};

interface BoardProps {
  showInstructions?: boolean;
  onInstructionsShown?: () => void;
  triggerNewGame?: boolean;
}

const Board: React.FC<BoardProps> = ({ 
  showInstructions = false, 
  onInstructionsShown,
  triggerNewGame
}) => {
  const inputRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(null))
  );

  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(""))
  );
  const [attempt, setAttempt] = useState(0);
  // Word list is only used to randomly select the target word
  // Player guesses can be any valid dictionary word
  const [targetWord, setTargetWord] = useState<string>(getRandomWord(words));
  const [lockedRows, setLockedRows] = useState<boolean[]>(
    Array(MAX_ATTEMPTS).fill(false)
  );
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [keyColors, setKeyColors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [lettersEntered, setLettersEntered] = useState<boolean[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(false))
  );
  const [cellStates, setCellStates] = useState<string[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(""))
  );
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState("Game progress saved");
  const [isSaveError, setIsSaveError] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Get user from Supabase context
  const { user } = useSupabase();
  const [statisticsSaved, setStatisticsSaved] = useState(false);

  // Check localStorage availability on component mount
  useEffect(() => {
    const available = isLocalStorageAvailable();
    setStorageAvailable(available);
    
    if (!available) {
      const message = getStorageStatusMessage();
      if (message) {
        setSaveStatusMessage(message);
        setIsSaveError(true);
        setShowSaveStatus(true);
        
        // Hide the message after 5 seconds
        const timer = setTimeout(() => {
          setShowSaveStatus(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const savedGame = loadGameState();
      
      if (savedGame) {
        console.log("Loading saved game state:", savedGame);
        
        setGrid(savedGame.grid);
        setAttempt(savedGame.attempt);
        setLockedRows(savedGame.lockedRows);
        setKeyColors(savedGame.keyColors || {});
        setGameStatus(savedGame.gameStatus);
        setTargetWord(savedGame.targetWord);
        setLettersEntered(savedGame.lettersEntered || 
          Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(false)));
        
        if (savedGame.cellStates) {
          setCellStates(savedGame.cellStates);
        } else {
          setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => 
            Array(WORD_LENGTH).fill("")
          ));
        }
      } else {
        // If no saved game state, initialize a new word
        setTargetWord(getRandomWord(words));
      }
    } catch (error) {
      console.error("Error loading game state:", error);
      const resetData = resetGameState();
      setGrid(resetData.grid);
      setAttempt(0);
      setLockedRows(resetData.lockedRows);
      setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => 
        Array(WORD_LENGTH).fill("")
      ));
      setTargetWord(getRandomWord(words));
    }

    window.addEventListener("keydown", preventKeyPress);
    return () => window.removeEventListener("keydown", preventKeyPress);
  }, []);

  // Save game state whenever relevant state changes
  useEffect(() => {
    // Skip save if storage is not available
    if (!storageAvailable) {
      return;
    }
  
    const gameState: GameState = {
      grid,
      attempt,
      lockedRows,
      keyColors,
      gameStatus,
      targetWord,
      lettersEntered,
      cellStates,
    };
    
    console.log("Saving game state:", gameState);
    const saveSuccessful = saveGameState(gameState);
    
    if (saveSuccessful) {
      // Show success indicator
      setSaveStatusMessage("Game progress saved");
      setIsSaveError(false);
      setShowSaveStatus(true);
    } else {
      // Show error indicator
      setSaveStatusMessage("Failed to save game progress");
      setIsSaveError(true);
      setShowSaveStatus(true);
    }
    
    // Hide save indicator after 1.5 seconds
    const timer = setTimeout(() => {
      setShowSaveStatus(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [grid, attempt, lockedRows, keyColors, gameStatus, targetWord, lettersEntered, cellStates, storageAvailable]);

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.add("dark");
    // Save dark mode preference with error handling
    try {
      localStorage.setItem("wordGameDarkMode", "true");
    } catch (e) {
      console.warn("Could not save dark mode preference:", e);
      // Non-critical error, can be ignored
    }
  }, []);

  // Add effect to save game statistics to Supabase when game ends
  useEffect(() => {
    const saveStats = async () => {
      // Only save stats if user is logged in and game has ended
      if (user && gameStatus && !statisticsSaved) {
        try {
          const won = gameStatus === "correct";
          await saveGameResult(user.id, {
            grid,
            attempt,
            lockedRows,
            keyColors,
            gameStatus,
            targetWord,
            lettersEntered,
            cellStates
          }, won);
          setStatisticsSaved(true);
          console.log('Game statistics saved to Supabase');
        } catch (error) {
          console.error('Failed to save game statistics:', error);
        }
      }
    };

    saveStats();
  }, [gameStatus, user, statisticsSaved, grid, attempt, lockedRows, keyColors, targetWord, lettersEntered, cellStates]);

  // Reset statisticsSaved when starting a new game
  useEffect(() => {
    if (gameStatus === null) {
      setStatisticsSaved(false);
    }
  }, [gameStatus]);

  // Effect to handle showing instructions from props
  useEffect(() => {
    if (showInstructions) {
      setInstructionsVisible(true);
      onInstructionsShown?.();
    }
  }, [showInstructions, onInstructionsShown]);
  
  // Effect to handle new game from header
  useEffect(() => {
    if (triggerNewGame !== undefined) {
      const newWord = getRandomWord(words);
      setTargetWord(newWord);
      setGrid(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill("")));
      setAttempt(0);
      setLockedRows(Array(MAX_ATTEMPTS).fill(false));
      setKeyColors({});
      setError(null);
      setGameStatus(null);
      setLettersEntered(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(false)));
      setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill("")));
      setShakeRow(null);
      console.log("New game started with word:", newWord);
    }
  }, [triggerNewGame]);

  const preventKeyPress = (e: KeyboardEvent) => {
    // Only prevent default for arrow keys to prevent page scrolling
    // but allow other keys to be handled by the WordGameBoard component
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (row: number, col: number, value: string) => {
    // Don't process if the row is locked or if the game is over
    if (lockedRows[row] || gameStatus) return;
    
    if (/^[A-Za-z]*$/.test(value)) {
      // Only update the grid if the value is different from current value (prevent duplicate updates)
      if (grid[row][col] !== value.toUpperCase()) {
        const newGrid = [...grid];
        newGrid[row][col] = value.slice(0, 1).toUpperCase();
        setGrid(newGrid);

        const newLettersEntered = [...lettersEntered];
        newLettersEntered[row][col] = Boolean(value); // Set to true if value exists, false if empty
        setLettersEntered(newLettersEntered);
      }

      // Move focus to the next cell only if there's a value and we're not at the end of the row
      if (value && col < WORD_LENGTH - 1) {
        inputRefs.current[row][col + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string) => {
    // Don't process key presses if game is over
    if (gameStatus) return false;

    // Clear any text selection when a key is pressed
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection) selection.removeAllRanges();
    }

    // Create a variable to track if a key press has been handled
    let keyHandled = false;

    if (key === "Enter") {
      // Execute the guess check without any additional delay
      try {
        // We need to move this out of Promise to make it happen immediately
        const guess = grid[attempt].join("");
        
        // Skip processing if word is incomplete
        if (guess.length !== WORD_LENGTH) {
          setError("Not enough letters");
          triggerShake(attempt);
          return false; // Return false to indicate the action wasn't completed
        }
        
        // We'll check if the word exists in the next step, first clear any errors
        setError(null);
        
        // IMPROVED: Show a "Checking..." message during API call
        setError("Checking...");
        
        // This part can remain async
        checkWordExists(guess).then(wordExists => {
          if (!wordExists) {
            setError("Not found in dictionary");
            triggerShake(attempt);
            return;
          }
          
          // Clear the "Checking..." message
          setError(null);
          
          // Word is valid, process it
          processGuess(guess, attempt);
          
          const newLockedRows = [...lockedRows];
          newLockedRows[attempt] = true;
          setLockedRows(newLockedRows);
          
          setAttempt(attempt + 1);
          
          if (guess === targetWord) {
            setGameStatus("correct");
          } else if (attempt + 1 >= MAX_ATTEMPTS) {
            setGameStatus("incorrect");
          }
        }).catch(error => {
          // ADDED: Handle explicit API errors
          console.error("Error validating word:", error);
          setError("Dictionary check failed - try again");
          triggerShake(attempt);
        });
        
        keyHandled = true;
      } catch (error) {
        console.error("Error checking guess:", error);
        // ADDED: Show error message to user
        setError("Error checking word - try again");
        triggerShake(attempt);
        keyHandled = false;
      }
      
      return keyHandled;
    } else if (key === "Delete" || key === "Backspace") {
      keyHandled = true;
      handleDelete(grid[attempt]);
    } else if (/^[A-Z]$/.test(key) && attempt < MAX_ATTEMPTS) {
      const currentRow = [...grid[attempt]];
      const emptyIndex = currentRow.findIndex((cell) => cell === "");
      
      if (emptyIndex !== -1) {
        // Check if this position already has the same letter to prevent double typing
        if (grid[attempt][emptyIndex] !== key) {
          keyHandled = true;
          handleChange(attempt, emptyIndex, key);
        }
      }
    }

    // Return whether the key was handled
    return keyHandled;
  };

  const handleDelete = (currentRow: string[]) => {
    if (gameStatus) return;
    
    const lastFilledIndex = currentRow.reduce(
      (lastIndex, cell, index) => (cell ? index : lastIndex),
      -1
    );
    
    if (lastFilledIndex !== -1) {
      const newGrid = [...grid];
      newGrid[attempt][lastFilledIndex] = "";
      setGrid(newGrid);
      
      if (inputRefs.current[attempt][lastFilledIndex]) {
        inputRefs.current[attempt][lastFilledIndex]?.focus();
      }
    }
  };

  const processGuess = (guess: string, row: number) => {
    const targetWordArray = targetWord.split("");
    const guessArray = guess.split("");
    const newCellStates = [...cellStates];
    const newKeyColors = { ...keyColors };
    
    guessArray.forEach((letter, i) => {
      if (letter === targetWordArray[i]) {
        newCellStates[row][i] = "correct";
        newKeyColors[letter] = "green-500";
        targetWordArray[i] = "#";
      }
    });
    
    guessArray.forEach((letter, i) => {
      if (newCellStates[row][i] === "correct") {
        return;
      }
      
      const targetIndex = targetWordArray.indexOf(letter);
      if (targetIndex !== -1) {
        newCellStates[row][i] = "present";
        if (newKeyColors[letter] !== "green-500") {
          newKeyColors[letter] = "yellow-500";
        }
        targetWordArray[targetIndex] = "#";
      } else {
        newCellStates[row][i] = "absent";
        if (!newKeyColors[letter]) {
          newKeyColors[letter] = "stone-300";
        }
      }
    });
    
    setCellStates(newCellStates);
    setKeyColors(newKeyColors);
  };

  const triggerShake = (row: number) => {
    setShakeRow(row);
    setTimeout(() => setShakeRow(null), 500);
  };

  const resetGame = () => {
    const newWord = getRandomWord(words);
    setTargetWord(newWord);
    setGrid(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill("")));
    setAttempt(0);
    setLockedRows(Array(MAX_ATTEMPTS).fill(false));
    setKeyColors({});
    setError(null);
    setGameStatus(null);
    setLettersEntered(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(false)));
    setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill("")));
    setShakeRow(null);
    console.log("New game started with word:", newWord);
  };

  const inputClassNames = (
    isRowLocked: boolean,
    letter: string,
    colIndex: number,
    rowIndex: number
  ) => {
    let cellState = cellStates[rowIndex][colIndex];
    let baseClasses = "border-2 flex items-center justify-center transition-all";
    
    if (!letter) {
      baseClasses += " border-gray-300 dark:border-gray-600";
    } else if (!isRowLocked) {
      baseClasses += " border-[#878a8c] dark:border-[#565758] bg-[#878a8c] dark:bg-[#565758] text-white";
    } else {
      switch (cellState) {
        case "correct":
          baseClasses += " bg-game-correct text-white dark:bg-game-correct-dark dark:text-white border-game-correct dark:border-game-correct-dark";
          break;
        case "present":
          baseClasses += " bg-game-present text-white dark:bg-game-present-dark dark:text-white border-game-present dark:border-game-present-dark";
          break;
        case "absent":
          baseClasses += " bg-game-absent text-white dark:bg-game-absent-dark dark:text-white border-game-absent dark:border-game-absent-dark";
          break;
        default:
          baseClasses += " border-stone-800 dark:border-stone-800";
      }
    }
    
    if (shakeRow === rowIndex) {
      baseClasses += " animate-shake";
    }
    
    return baseClasses;
  };

  return (
    <div 
      className="word-finder-game no-select flex flex-col min-h-screen w-full items-center p-1 sm:p-2 gap-1 sm:gap-2"
      onMouseDown={(e) => {
        // MODIFIED: Only prevent default for non-input elements
        if (!(e.target as HTMLElement).closest('button, [role="button"], .board-tile')) {
          e.preventDefault();
        }
        // Clear any text selection
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection) selection.removeAllRanges();
        }
      }}
      onTouchStart={(e) => {
        // MODIFIED: Only prevent default for container elements
        if ((e.target as HTMLElement) === e.currentTarget) {
          e.preventDefault();
        }
      }}
      style={{
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        position: 'relative', // Added for confetti positioning
        overflow: 'hidden',   // Added to ensure confetti doesn't cause scrollbars
        paddingTop: '0'       // Eliminated top padding completely
      }}
    >
      {/* Show confetti when the user has won */}
      {gameStatus === "correct" && <Confetti />}
      
      {/* Game status message */}
      {gameStatus && (
        <div 
          className={`text-center py-2 px-3 rounded-md font-medium mb-1 text-sm sm:text-base ${
            gameStatus === "correct" 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>
              {gameStatus === "correct" 
                ? "You won! The word was: " + targetWord 
                : "Game over! The word was: " + targetWord}
            </span>
            <button
              onClick={resetGame}
              className="py-1 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-500 dark:text-red-400 text-center mb-1 text-sm sm:text-base">{error}</div>
      )}

      <div className="flex flex-col items-center justify-center space-y-0 flex-grow max-w-full mt-0 pt-0">
        <div className="board-scale-container flex justify-center items-center py-0">
          <WordGameBoard
            grid={grid}
            attempt={attempt}
            lockedRows={lockedRows}
            shakeRow={shakeRow}
            cellStates={cellStates}
            handleChange={handleChange}
            inputRefs={inputRefs}
            inputClassNames={inputClassNames}
            gameStatus={gameStatus}
          />
        </div>

        {/* Space between board and keyboard */}
        <div className="h-1 sm:h-2"></div>

        <div className="keyboard-wrapper w-full max-w-[500px] px-2">
          <Keyboard
            onKeyPress={handleKeyPress}
            keyColors={keyColors}
          />
        </div>
      </div>

      {/* Instructions modal */}
      <InstructionsModal
        isOpen={instructionsVisible}
        onClose={() => setInstructionsVisible(false)}
      />
      
      {/* Save status indicator */}
      <SaveStatus 
        visible={showSaveStatus} 
        message={saveStatusMessage}
        isError={isSaveError}
      />
    </div>
  );
};

export default Board;
