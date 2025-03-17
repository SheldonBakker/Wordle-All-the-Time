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
} from "./utils/gameUtils";
import "./styles/anime.css";

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

// Dark mode toggle component
const DarkModeToggle: React.FC<{ 
  isDarkMode: boolean; 
  toggleDarkMode: () => void 
}> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        // Sun icon for light mode
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        // Moon icon for dark mode
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

// SaveStatus component to show when the game is saved
const SaveStatus: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="save-status fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 py-1 px-3 rounded-md text-sm transition-opacity duration-500 opacity-70">
      Game progress saved
    </div>
  );
};

const Board: React.FC = () => {
  const inputRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(null))
  );

  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(""))
  );
  const [attempt, setAttempt] = useState(0);
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

  // Add state for dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user previously set dark mode preference
    const savedDarkMode = localStorage.getItem("wordGameDarkMode");
    // If no saved preference, use system preference
    if (savedDarkMode === null) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return savedDarkMode === "true";
  });

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
        setLettersEntered(savedGame.lettersEntered);
        
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
    saveGameState(gameState);
    
    // Show save indicator
    setShowSaveStatus(true);
    
    // Hide save indicator after 1.5 seconds
    const timer = setTimeout(() => {
      setShowSaveStatus(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [grid, attempt, lockedRows, keyColors, gameStatus, targetWord, lettersEntered, cellStates]);

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
        
        // This part can remain async
        checkWordExists(guess).then(wordExists => {
          if (!wordExists) {
            setError("Not in word list");
            triggerShake(attempt);
            return;
          }
          
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
        });
        
        keyHandled = true;
      } catch (error) {
        console.error("Error checking guess:", error);
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
    // Get fresh reset data
    const resetData = resetGameState();
    
    // Generate a new target word
    const newTargetWord = getRandomWord(words);
    console.log("New target word:", newTargetWord);
    
    // Reset all state
    setGrid(resetData.grid);
    setAttempt(0);
    setTargetWord(newTargetWord);
    setLockedRows(resetData.lockedRows);
    setKeyColors({});
    setError(null);
    setShakeRow(null);
    setGameStatus(null);
    setLettersEntered(resetData.lettersEntered);
    setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => 
      Array(WORD_LENGTH).fill("")
    ));
    
    // Clear saved game from localStorage
    localStorage.removeItem("wordGame");
    
    console.log("Game reset successfully");
    
    // Immediately save the new game state to localStorage
    setTimeout(() => {
      const newGameState: GameState = {
        grid: resetData.grid,
        attempt: 0,
        lockedRows: resetData.lockedRows,
        keyColors: {},
        gameStatus: null,
        targetWord: newTargetWord,
        lettersEntered: resetData.lettersEntered,
        cellStates: Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill("")),
      };
      saveGameState(newGameState);
    }, 0);
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
          baseClasses += " bg-[#6aaa64] border-[#6aaa64] text-white dark:bg-[#538d4e] dark:border-[#538d4e]";
          break;
        case "present":
          baseClasses += " bg-[#c9b458] border-[#c9b458] text-white dark:bg-[#b59f3b] dark:border-[#b59f3b]";
          break;
        case "absent":
          baseClasses += " bg-[#787c7e] border-[#787c7e] text-white dark:bg-[#3a3a3c] dark:border-[#3a3a3c]";
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div 
      className={`word-finder-game no-select flex flex-col min-h-screen w-full items-center p-2 sm:p-4 gap-2 sm:gap-4 ${isDarkMode ? 'dark bg-stone-900 text-white' : 'bg-white text-gray-900'}`}
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
        overflow: 'hidden'    // Added to ensure confetti doesn't cause scrollbars
      }}
    >
      {/* Show confetti when the user has won */}
      {gameStatus === "correct" && <Confetti />}
      
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row w-full items-center sm:justify-between mb-1 gap-2">
        <div className="flex justify-between w-full sm:w-auto">
          <button
            onClick={() => setInstructionsVisible(true)}
            className="py-1 px-2 sm:py-2 sm:px-4 text-sm sm:text-base text-gray-800 dark:text-gray-200 rounded-md font-medium"
            aria-label="How to Play"
          >
            How to Play
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-center">Find Me</h1>
          <div className="block sm:hidden">
            <DarkModeToggle
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <div className="hidden sm:block">
            <DarkModeToggle
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </div>
          <button
            onClick={resetGame}
            className="py-1 px-3 sm:py-2 sm:px-4 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm sm:text-base font-medium"
          >
            New Game
          </button>
        </div>
      </div>

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

      <div className="flex flex-col items-center justify-center space-y-0 flex-grow max-w-full">
        <div className="board-scale-container flex justify-center items-center py-3 sm:py-4">
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
        <div className="h-6 sm:h-8"></div>

        <div className="keyboard-wrapper w-full max-w-[500px] px-2">
          <Keyboard
            onKeyPress={handleKeyPress}
            keyColors={keyColors}
          />
        </div>
      </div>

      {/* Add SaveStatus component */}
      <SaveStatus visible={showSaveStatus} />
      
      {instructionsVisible && (
        <InstructionsModal onClose={() => setInstructionsVisible(false)} />
      )}
    </div>
  );
};

export default Board;
