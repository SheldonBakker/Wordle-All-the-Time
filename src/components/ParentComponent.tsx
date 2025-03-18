import { useState, useRef, useEffect } from "react";
import WordGameBoard from "./WordGameBoard";
import { getRandomWord, checkWordExists } from "./utils/gameUtils";
// Import a sample wordlist for target word selection
import words from "./data/words.json";

const ParentComponent = () => {
  // Get a random target word from the wordlist
  const [targetWord, setTargetWord] = useState<string>(getRandomWord(words));

  const [grid, setGrid] = useState<string[][]>([
    ["", "", "", "", ""], // Initialize the grid with empty strings for letter inputs
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ]);

  const [lockedRows, setLockedRows] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  // State for game status
  const [gameStatus, setGameStatus] = useState<"correct" | "incorrect" | null>(null);
  
  // Add error state for invalid words
  const [error, setError] = useState<string | null>(null);
  // Add state for shake animation
  const [shakeRow, setShakeRow] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: grid.length }, () => Array(grid[0].length).fill(null))
  );

  const currentRowIndex = useRef<number>(0); // Track the current row being filled
  const currentColumnIndex = useRef<number>(0); // Track the current column index being filled

  // Function to handle word validation with dictionary check
  const validateWord = async (word: string, rowIndex: number) => {
    // First check if the word has 5 letters
    if (word.length === 5) {
      // Then verify the word exists using the dictionary API
      try {
        const isRealWord = await checkWordExists(word);
        
        if (isRealWord) {
          // Word exists in dictionary, lock the row
          const newLockedRows = [...lockedRows];
          newLockedRows[rowIndex] = true;
          setLockedRows(newLockedRows);
          
          // Clear any previous errors
          setError(null);
          
          // Check if word matches target
          if (word === targetWord) {
            setGameStatus("correct");
          }
          
          // Move to next row
          currentRowIndex.current += 1;
          currentColumnIndex.current = 0;
          
          // If we've tried all rows and haven't found the correct word
          if (currentRowIndex.current >= grid.length) {
            setGameStatus("incorrect");
          }
        } else {
          // Word is not in dictionary
          setError("Not in word list");
          setShakeRow(rowIndex);
          setTimeout(() => setShakeRow(null), 500);
        }
      } catch (error) {
        console.error("Error checking word:", error);
        // In case of API error, give benefit of doubt and accept the word
        setError("Dictionary check failed - word accepted");
        // Continue with the game
        const newLockedRows = [...lockedRows];
        newLockedRows[rowIndex] = true;
        setLockedRows(newLockedRows);
        
        // Move to next row
        currentRowIndex.current += 1;
      }
    } else {
      // Word is not 5 letters
      setError("Word must be 5 letters");
      setShakeRow(rowIndex);
      setTimeout(() => setShakeRow(null), 500);
    }
  };

  // Function to start a new game
  const startNewGame = () => {
    // Get a new random target word
    const newTargetWord = getRandomWord(words);
    setTargetWord(newTargetWord);
    
    // Reset game state
    setGrid(Array.from({ length: 5 }, () => Array(5).fill("")));
    setLockedRows(Array(5).fill(false));
    setGameStatus(null);
    setError(null);
    currentRowIndex.current = 0;
    currentColumnIndex.current = 0;
    
    console.log("New game started with target word:", newTargetWord);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Display error message if any */}
      {error && <div className="text-red-500 my-2">{error}</div>}
      
      <WordGameBoard
        grid={grid}
        inputRefs={inputRefs}
        lockedRows={lockedRows}
        inputClassNames={(isRowLocked) =>
          `p-4 text-xl border-2 ${isRowLocked ? "bg-gray-400" : "bg-white"}`
        }
        attempt={currentRowIndex.current}
        shakeRow={shakeRow}
        cellStates={Array.from({ length: grid.length }, () => Array(grid[0].length).fill(""))}
        handleChange={(row, col, value) => {
          const newGrid = [...grid];
          newGrid[row][col] = value.toUpperCase();
          setGrid(newGrid);
          
          if (value && col < grid[row].length - 1) {
            currentColumnIndex.current = col + 1;
          } else if (!value && col > 0) {
            currentColumnIndex.current = col - 1;
          }

          // If we completed a word (reached the end of a row)
          if (value && col === grid[row].length - 1) {
            const enteredWord = newGrid[row].join("");
            
            // Validate word with dictionary check
            validateWord(enteredWord, row);
          }
        }}
        gameStatus={gameStatus}
      />
      
      {/* Game status display */}
      {gameStatus && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md shadow-md">
          <p className="text-center font-medium">
            {gameStatus === "correct" 
              ? `You won! The word was: ${targetWord}` 
              : `Game over! The word was: ${targetWord}`}
          </p>
          <button 
            className="mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={startNewGame}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentComponent;
