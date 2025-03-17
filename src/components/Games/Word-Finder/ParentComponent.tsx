import { useState, useRef } from "react";
import WordGameBoard from "./WordGameBoard";

// Example word list for validation
const validWords = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY"];

const ParentComponent = () => {
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

  // ADDED: State for game status
  const [gameStatus, setGameStatus] = useState<"correct" | "incorrect" | null>(null);

  const inputRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: grid.length }, () => Array(grid[0].length).fill(null))
  );

  const currentRowIndex = useRef<number>(0); // Track the current row being filled
  const currentColumnIndex = useRef<number>(0); // Track the current column index being filled

  return (
    <WordGameBoard
      grid={grid}
      inputRefs={inputRefs}
      lockedRows={lockedRows}
      inputClassNames={(isRowLocked) =>
        `p-4 text-xl border-2 ${isRowLocked ? "bg-gray-400" : "bg-white"}`
      }
      attempt={currentRowIndex.current}
      shakeRow={null}
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
          const isValid = validWords.includes(enteredWord);
          
          // Lock the row if a valid word is found
          if (isValid) {
            const newLockedRows = [...lockedRows];
            newLockedRows[row] = true;
            setLockedRows(newLockedRows);
            
            // ADDED: If the word is correct (matches a specific target word), set game status to 'correct'
            if (enteredWord === "ABCDE") { // Example target word, replace with actual logic
              setGameStatus("correct");
            }
          }
          
          // Move to next row
          currentRowIndex.current += 1;
          currentColumnIndex.current = 0;
          
          // ADDED: If we've tried all rows and haven't found the correct word
          if (currentRowIndex.current >= grid.length) {
            setGameStatus("incorrect");
          }
        }
      }}
      gameStatus={gameStatus}
    />
  );
};

export default ParentComponent;
