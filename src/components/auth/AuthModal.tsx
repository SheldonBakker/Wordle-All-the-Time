import React, { useState, useEffect, useRef } from 'react';
import AuthForm from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Update mode when initialMode prop changes or when modal opens
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);
  
  // When modal opens, focus the email input and handle keyboard events
  useEffect(() => {
    if (isOpen) {
      // Focus the email input after the modal is rendered
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 50);
      
      // Add keyboard event listener to trap focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      // Create a click handler to prevent clicks from propagating to the game board
      const handleClickOutside = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      
      // Add these event listeners to the document
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('mousedown', handleClickOutside, true);
      
      // Remove event listeners on cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    // Re-focus the email input when switching modes
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 50);
  };
  
  // Stop events from reaching the game board
  const stopGameBoardEvents = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      onKeyDown={stopGameBoardEvents}
    >
      <div 
        ref={modalRef}
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-indigo-100 dark:border-indigo-800/50 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-indigo-100 dark:border-indigo-800/50 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20 rounded-t-xl">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create Your Account'}
          </h2>
          <button 
            onClick={onClose}
            className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-sm border border-indigo-100 dark:border-indigo-800/50 hover:shadow-md transition-all duration-300"
            aria-label="Close"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <AuthForm 
            mode={mode} 
            onSuccess={onClose}
            onSwitchMode={toggleMode}
            emailInputRef={emailInputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 