import React from "react";
import classNames from "classnames";

interface WordGameBoardProps {
  grid: string[][];
  inputRefs: React.MutableRefObject<(HTMLDivElement | null)[][]>;
  lockedRows: boolean[];
  inputClassNames: (
    isRowLocked: boolean,
    letter: string,
    colIndex: number,
    rowIndex: number
  ) => string;
  attempt: number;
  shakeRow: number | null;
  cellStates: string[][];
  handleChange: (row: number, col: number, value: string) => void;
  gameStatus: "correct" | "incorrect" | null;
}

const WordGameBoard: React.FC<WordGameBoardProps> = ({
  grid,
  inputRefs,
  lockedRows,
  inputClassNames,
  attempt,
  shakeRow,
  cellStates,
  handleChange,
  gameStatus
}) => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colIndex: number
  ) => {
    // MODIFIED: Only prevent default for navigation keys
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || 
        e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Handle arrow navigation
    if (e.key === "ArrowRight" && colIndex < grid[0].length - 1) {
      inputRefs.current[rowIndex][colIndex + 1]?.focus();
    } else if (e.key === "ArrowLeft" && colIndex > 0) {
      inputRefs.current[rowIndex][colIndex - 1]?.focus();
    } else if (/^[a-zA-Z]$/.test(e.key) && rowIndex === attempt) {
      // Handle letter input
      handleChange(rowIndex, colIndex, e.key);
    } else if (e.key === "Backspace" && rowIndex === attempt) {
      // Handle backspace
      if (grid[rowIndex][colIndex]) {
        handleChange(rowIndex, colIndex, "");
      } else if (colIndex > 0) {
        handleChange(rowIndex, colIndex - 1, "");
        inputRefs.current[rowIndex][colIndex - 1]?.focus();
      }
    }
    // Let Enter key event bubble up naturally
  };

  // Handle tile click/tap - still keep internal references updated
  const handleTileInteraction = (rowIndex: number, colIndex: number) => {
    if (rowIndex === attempt && !lockedRows[rowIndex]) {
      // Still focus this tile internally but visual focus indicator will be hidden by CSS
      inputRefs.current[rowIndex][colIndex]?.focus();
    }
  };

  // MODIFIED: Fixed function to check if a tile should have the winning animation
  const isWinningTile = (rowIndex: number, _colIndex: number): boolean => {
    // Apply to all tiles in the winning row when game is won
    return (
      gameStatus === "correct" && 
      rowIndex === attempt - 1 // The winning row is the last completed row
    );
  };

  return (
    <div 
      className="grid grid-rows-6 mx-auto board-container no-select"
      style={{
        width: 'min(85vw, var(--board-width))',
        height: 'auto',
        maxWidth: 'var(--board-width)',
        aspectRatio: '5/6',
        touchAction: 'manipulation',
        transform: 'scale(0.98)',
        margin: '0 auto',
        padding: 'calc(var(--tile-gap) * 0.3)',
        gap: 'calc(var(--tile-gap) * 0.8)',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default'
      }}
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        // Allow touch events for interaction but prevent selection
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {grid.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`grid grid-cols-5 ${shakeRow === rowIndex ? "animate-shake" : ""} no-select`}
          style={{ 
            gap: 'calc(var(--tile-gap) * 0.8)',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            cursor: 'default'
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {row.map((letter, colIndex) => {
            const isRowLocked = lockedRows[rowIndex];
            const hasLetter = Boolean(letter);
            
            // Calculate animation delay for flip animation
            const flipDelay = isRowLocked ? `${colIndex * 300}ms` : "0ms";
            
            // Get cell state for this position
            const cellState = cellStates[rowIndex][colIndex];
            
            // Determine if letter was just entered (for animation)
            const letterEntered = hasLetter && rowIndex === attempt && !isRowLocked;
            
            // ADDED: Check if this is a winning tile
            const isWinning = isWinningTile(rowIndex, colIndex);
            
            const tileClassName = classNames(
              // Base styles
              "board-tile",
              "aspect-square",
              "inline-flex items-center justify-center",
              "text-base sm:text-xl md:text-2xl font-bold",
              "select-none",
              "border-2",
              "transition-all duration-100",
              "rounded-sm sm:rounded",
              
              // Empty state styling
              !letter && !isRowLocked ? "empty-tile" : "",
              
              // Typed letter styling
              letter && !isRowLocked ? "typed-letter" : "",
              
              // ADDED: Add winning-tile class for the winning word
              isWinning ? "winning-tile" : "",
              
              // Hide focus outline class
              "focus:outline-none",
              
              // Apply input class names from parent component
              inputClassNames(isRowLocked, letter, colIndex, rowIndex),
              
              // Pop animation when letter entered
              letterEntered ? "animate-bounce-in" : "",
              
              // Flip animation when row locked (result revealed)
              isRowLocked ? "animate-flip-in" : "",
              
              // Cell state colors
              cellState === "correct" ? "bg-green-500 text-white border-green-500" : "",
              cellState === "present" ? "bg-yellow-500 text-white border-yellow-500" : "",
              cellState === "absent" ? "bg-gray-500 text-white border-gray-500" : ""
            );

            return (
              <div
                ref={(el) => {
                  if (inputRefs.current?.[rowIndex]) {
                    inputRefs.current[rowIndex][colIndex] = el;
                  }
                }}
                key={`${rowIndex}-${colIndex}`}
                className={tileClassName}
                style={{
                  animationDelay: flipDelay,
                  animationFillMode: "backwards",
                  touchAction: "manipulation",
                  WebkitUserSelect: "none",
                  userSelect: "none", 
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  WebkitTouchCallout: "none",
                  cursor: "default",
                  // Hide focus outline styles
                  outline: "none"
                }}
                tabIndex={rowIndex === attempt && !isRowLocked ? 0 : -1}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                onClick={() => handleTileInteraction(rowIndex, colIndex)}
                onMouseDown={(e: React.MouseEvent) => {
                  if (rowIndex === attempt && !isRowLocked) {
                    // Clear text selection
                    if (window.getSelection) {
                      const selection = window.getSelection();
                      if (selection) selection.removeAllRanges();
                    }
                  } else {
                    e.preventDefault();
                  }
                }}
                onFocus={(e) => {
                  // Remove the focus indicator when element receives focus
                  (e.target as HTMLElement).style.outline = "none";
                }}
                onMouseOver={(e: React.MouseEvent) => {
                  // Ensure cursor remains default on hover
                  (e.target as HTMLElement).style.cursor = 'default';
                }}
                role="button"
                aria-label={`Letter ${colIndex + 1} in row ${rowIndex + 1}${letter ? `: ${letter}` : ''}`}
                data-row={rowIndex}
                data-col={colIndex}
                unselectable="on"
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WordGameBoard;
