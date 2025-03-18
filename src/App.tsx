import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import WordGame from "./components/Board"; // Importing the WordGame component
import { HelmetProvider } from "react-helmet-async";
import { SupabaseProvider } from "./supabase/SupabaseContext";
import Header from "./components/common/Header";
import ProfilePage from "./components/profile/ProfilePage";
import LeaderboardPage from "./components/leaderboard/LeaderboardPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./components/common/NotFound";
import "./App.css";

const AppContent: React.FC = () => {
  const location = useLocation();
  const [showInstructions, setShowInstructions] = useState(false);
  
  const isGamePage = location.pathname === '/';
  
  const handleShowInstructions = () => {
    setShowInstructions(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      <Header 
        isGamePage={isGamePage}
        onShowInstructions={isGamePage ? handleShowInstructions : undefined}
      />
      <main className="flex-grow pt-0 mt-0">
        <Routes>
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* Public routes */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          
          {/* Game route - accessible to everyone but will track stats if logged in */}
          <Route 
            path="/" 
            element={
              <WordGame 
                showInstructions={showInstructions} 
                onInstructionsShown={() => setShowInstructions(false)}
              />
            } 
          />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <SupabaseProvider>
        <Router>
          <AppContent />
        </Router>
      </SupabaseProvider>
    </HelmetProvider>
  );
};

export default App;
