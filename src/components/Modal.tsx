import React from "react";
import { useSpring, animated } from "react-spring";

interface ModalProps {
  onClose: () => void;
  isVisible: boolean;
  targetWord: string;
  gameStatus: "correct" | "incorrect" | null;
  onRestart: () => void;
}

const GameModal: React.FC<ModalProps> = ({
  isVisible,
  targetWord,
  gameStatus,
  onRestart,
}) => {
  // Moved useSpring before the conditional return
  const props = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(-50px)",
    config: { tension: 300, friction: 20 },
  });

  if (!isVisible) return null;

  const modalClass = gameStatus === "correct" ? "bg-green-500" : "bg-black";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <animated.div
        style={props}
        className={`p-8 rounded-lg shadow-lg max-w-md w-full transition-all duration-300 ${modalClass}`}
      >
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          {gameStatus === "correct" ? "🎉 Congratulations!" : "❌ Game Over!"}
        </h2>
        <p className="text-center text-lg mb-6 text-white">
          {gameStatus === "correct"
            ? "You guessed the word!"
            : `The word was: ${targetWord}`}
        </p>
        
        <p className="text-center text-sm mb-4 text-white opacity-80">
          Any 5-letter word in the dictionary is valid! Words are checked against a dictionary API.
        </p>

        <div className="flex flex-col gap-4">
          <button
            className="w-full bg-orange-600 text-black font-semibold py-2 rounded-lg transition duration-200 hover:bg-gray-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => {
              onRestart(); // This resets the game and closes the modal
            }}
          >
            Restart Game
          </button>
        </div>
      </animated.div>
    </div>
  );
};

export default GameModal;
