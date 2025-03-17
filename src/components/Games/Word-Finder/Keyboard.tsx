import React, { useEffect, useRef } from "react";
import classNames from "classnames";

type KeyboardProps = {
  onKeyPress: (key: string) => void;
  keyColors?: Record<string, string>; // Optional prop for custom key colors
};

const keyboardLayout = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Delete"],
];

const getKeyColor = (key: string, keyColors: Record<string, string>) => {
  if (key === "Enter" || key === "Delete") {
    return "bg-[#d3d6da] hover:bg-[#c3c6ca] text-black dark:bg-[#818384] dark:hover:bg-[#919394] dark:text-white"; // Special keys
  }

  switch (keyColors[key]) {
    case "green-500":
      return "bg-[#6aaa64] text-white border-[#6aaa64] dark:bg-[#538d4e] dark:border-[#538d4e]";
    case "yellow-500":
      return "bg-[#c9b458] text-white border-[#c9b458] dark:bg-[#b59f3b] dark:border-[#b59f3b]";
    case "stone-300":
      return "bg-[#787c7e] text-white border-[#787c7e] dark:bg-[#3a3a3c] dark:border-[#3a3a3c]";
    default:
      return "bg-[#d3d6da] hover:bg-[#c3c6ca] text-black border-[#d3d6da] dark:bg-[#818384] dark:hover:bg-[#919394] dark:text-white dark:border-[#818384]";
  }
};

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, keyColors = {} }) => {
  const keyRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ADDED: Global reference to the Enter key button
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // MODIFIED: Set global enterButtonRef when the component mounts
    enterButtonRef.current = keyRefs.current["Enter"];
    
    // Keep focus on the hidden input on mobile
    const preventKeyboard = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Initial focus
    preventKeyboard();

    // Reapply focus when clicking anywhere in the document
    document.addEventListener("click", preventKeyboard);

    // MODIFIED: New function to handle Enter key globally
    const handleGlobalEnterKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        // Prevent default action for Enter key
        e.preventDefault();
        
        // Clear any text selection
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection) selection.removeAllRanges();
        }
        
        // Simulate clicking the Enter button
        if (enterButtonRef.current) {
          // Visual feedback - add pressed state
          enterButtonRef.current.classList.add("scale-95", "opacity-80");
          
          // Trigger the onKeyPress callback
          onKeyPress("Enter");
          
          // Reset visual feedback after a short delay
          setTimeout(() => {
            enterButtonRef.current?.classList.remove("scale-95", "opacity-80");
          }, 100);
        }
        
        // Return true to indicate we've handled the Enter key
        return true;
      }
      return false;
    };

    // Remove previous Fix for Enter key on desktop and replace with our new global handler
    if (window.matchMedia('(min-width: 640px)').matches) {
      document.addEventListener('keydown', handleGlobalEnterKey, { capture: true });
    }

    return () => {
      document.removeEventListener("click", preventKeyboard);
      document.removeEventListener('keydown', handleGlobalEnterKey, { capture: true });
    };
  }, [onKeyPress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      
      // ADDED: Clear any text selection when typing to prevent issues
      if (window.getSelection && !/^(input|textarea)$/i.test((event.target as HTMLElement)?.tagName || '')) {
        // Don't clear selection in actual input fields
        const selection = window.getSelection();
        if (selection && selection.type === 'Range') {
          selection.removeAllRanges();
        }
      }
      
      const activeElement = document.activeElement;
      const isOnGameTile = activeElement?.classList?.contains('board-tile') || 
                          activeElement?.getAttribute('role') === 'button';
      
      // MODIFIED: We skip handling if we're on a game tile, EXCEPT for Enter key
      // which we now want to handle globally
      if (isOnGameTile && event.key.toUpperCase() !== "ENTER") {
        return;
      }
      
      const key = event.key.toUpperCase();

      // MODIFIED: We still handle other keys as before, but Enter is now handled by the global handler
      if (key === "ENTER") {
        // Enter key is now handled by our global handler
        // Don't do anything here to avoid duplicate handling
        return;
      } else if (key === "BACKSPACE") {
        onKeyPress("Delete");
        animateKeyPress("Delete");
      } else if (/^[A-Z]$/.test(key) && keyboardLayout.flat().includes(key)) {
        onKeyPress(key);
        animateKeyPress(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();

      if (key === "BACKSPACE") {
        resetKeyPress("Delete");
      } else if (/^[A-Z]$/.test(key) && keyboardLayout.flat().includes(key)) {
        resetKeyPress(key);
      }
      // MODIFIED: No need to handle Enter key here as it's handled by our global handler
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onKeyPress]);

  const animateKeyPress = (key: string) => {
    const button = keyRefs.current[key];
    if (button) {
      button.classList.add("scale-95");
      button.classList.add("opacity-80");
    }
  };

  const resetKeyPress = (key: string) => {
    const button = keyRefs.current[key];
    if (button) {
      button.classList.remove("scale-95");
      button.classList.remove("opacity-80");
    }
  };

  const handleKeyPress = (key: string) => {
    const wasHandled = onKeyPress(key);
    
    animateKeyPress(key);
    setTimeout(() => resetKeyPress(key), 100);
    
    return wasHandled;
  };

  const handleTouchStart = (key: string, e: React.TouchEvent) => {
    e.preventDefault();
    animateKeyPress(key);
  };

  const handleTouchEnd = (key: string, e: React.TouchEvent) => {
    e.preventDefault();
    
    onKeyPress(key);
    
    setTimeout(() => resetKeyPress(key), 100);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-1 sm:px-2 keyboard-container">
      <input 
        ref={inputRef} 
        className="opacity-0 h-0 w-0 absolute pointer-events-none" 
        readOnly 
      />
      {keyboardLayout.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex justify-center gap-[3px] sm:gap-[5px] mb-1 ${
            rowIndex === 1 ? "mx-[6px] sm:mx-[12px]" : rowIndex === 2 ? "mx-0" : ""
          }`}
        >
          {row.map((key, keyIndex) => {
            const isSpecialKey = key === "Enter" || key === "Delete";
            const isEnterKey = key === "Enter";
            
            return (
              <button
                key={keyIndex}
                ref={(el) => {
                  keyRefs.current[key] = el;
                  // ADDED: Store Enter button reference
                  if (key === "Enter") {
                    enterButtonRef.current = el;
                  }
                }}
                onClick={(e) => {
                  if (e.defaultPrevented) {
                    return;
                  }
                  handleKeyPress(key);
                }}
                onTouchStart={(e) => handleTouchStart(key, e)}
                onTouchEnd={(e) => handleTouchEnd(key, e)}
                className={classNames(
                  "flex items-center justify-center",
                  "h-[45px] sm:h-[58px]",
                  "rounded",
                  "font-bold text-sm",
                  "select-none touch-manipulation",
                  "transition-all duration-150",
                  "shadow-sm active:shadow-inner",
                  isEnterKey ? "desktop-enter-key" : "",
                  isSpecialKey ? 
                    "px-1 sm:px-2 text-xs min-w-[52px] sm:min-w-[68px]" : 
                    "w-[32px] sm:w-[40px] md:w-[45px]",
                  getKeyColor(key, keyColors)
                )}
                style={{ touchAction: "manipulation" }}
                type="button"
              >
                {key === "Delete" ? "⌫" : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
