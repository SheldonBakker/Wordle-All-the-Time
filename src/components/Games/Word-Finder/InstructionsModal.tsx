import React from "react";

interface InstructionsModalProps {
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] rounded-md p-4 sm:p-8 max-w-[500px] w-[95%] mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">How to Play</h2>
          <button 
            onClick={onClose}
            className="text-[#1a1a1b] dark:text-[#d7dadc] p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
            aria-label="Close instructions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
          <p>
            Guess the Word in 6 tries.
          </p>
          
          <p>
            Each guess must be a valid 5-letter word. Hit the enter button to submit.
          </p>
          
          <p>
            After each guess, the color of the tiles will change to show how close your guess was to the word.
          </p>
          
          <div className="border-t border-b border-[#d3d6da] dark:border-[#3a3a3c] my-3 sm:my-4 py-3 sm:py-4">
            <p className="font-bold mb-3 sm:mb-4">Examples</p>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#6aaa64] dark:bg-[#538d4e] text-white font-bold border-2 border-[#6aaa64] dark:border-[#538d4e] mr-1 text-sm sm:text-base">W</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">E</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">A</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">R</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] text-sm sm:text-base">Y</div>
              </div>
              <p>The letter <strong>W</strong> is in the word and in the correct spot.</p>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">P</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#c9b458] dark:bg-[#b59f3b] text-white font-bold border-2 border-[#c9b458] dark:border-[#b59f3b] mr-1 text-sm sm:text-base">I</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">L</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">L</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] text-sm sm:text-base">S</div>
              </div>
              <p>The letter <strong>I</strong> is in the word but in the wrong spot.</p>
            </div>
            
            <div className="mb-2">
              <div className="flex mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">V</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">A</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">G</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#787c7e] dark:bg-[#3a3a3c] text-white font-bold border-2 border-[#787c7e] dark:border-[#3a3a3c] mr-1 text-sm sm:text-base">U</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-[#121213] text-[#1a1a1b] dark:text-[#d7dadc] font-bold border-2 border-[#d3d6da] dark:border-[#3a3a3c] text-sm sm:text-base">E</div>
              </div>
              <p>The letter <strong>U</strong> is not in the word in any spot.</p>
            </div>
          </div>
          
          <p>
            A new word will be available each time you play.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-[#6aaa64] dark:bg-[#538d4e] text-white py-2 px-4 rounded mt-4 sm:mt-6 font-bold text-sm sm:text-base touch-manipulation"
        >
          Play
        </button>
      </div>
    </div>
  );
};

export default InstructionsModal;
