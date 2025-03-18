import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSupabase } from '../../supabase/SupabaseContext';
import AuthModal from './AuthModal';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useSupabase();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Manage auth modal state based on auth status
  useEffect(() => {
    let isMounted = true;
    
    // Only open the modal if we're not loading and user is not authenticated
    if (!isLoading && !user && isMounted) {
      setAuthModalOpen(true);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoading, user]);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl text-center font-bold text-gray-800 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
            Please sign in to access this page.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md"
          >
            Sign In
          </button>
        </div>
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
          initialMode="login" 
        />
      </div>
    );
  }

  // If authenticated, render the child route elements
  return <Outlet />;
};

export default ProtectedRoute; 