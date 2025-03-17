import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import WordGame from "./components/Games/Word-Finder/Board"; // Importing the WordGame component
import { HelmetProvider } from "react-helmet-async";

const App: React.FC = () => {

  return (
    <HelmetProvider>
      <main>
          <Routes>
            <Route path="/" element={<WordGame />} />
          </Routes>
      </main>
    </HelmetProvider>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
