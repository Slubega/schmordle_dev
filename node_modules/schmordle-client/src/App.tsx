import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Solitaire from './modes/Solitaire';
import DailyChallenge from './modes/DailyChallenge';
import Multiplayer from './modes/Multiplayer';
import { useAuth } from './hooks/useAuth';
import './App.css'; 

const Home: React.FC = () => (
    <div className="home-container">
        <h2>Welcome to Schmordle!</h2>
        <p>The rhyming word game where all the correct answers rhyme with each other.</p>
        <p>Win by guessing *any* of the words in the daily rhyming set.</p>
        <div className="mode-selection">
            <Link to="/solitaire" className="button-primary mode-button">
                <h3>Solitaire 🧘</h3>
                <p>Relaxed, random sets, practice mode.</p>
            </Link>
            <Link to="/daily" className="button-primary mode-button">
                <h3>Daily Challenge 🗓️</h3>
                <p>New puzzle every day, global leaderboard.</p>
            </Link>
            <Link to="/multiplayer" className="button-primary mode-button">
                <h3>Multiplayer 🏆</h3>
                <p>Race against friends to find the most rhymes!</p>
            </Link>
        </div>
    </div>
);


const App: React.FC = () => {
  const { loading: authLoading, userName } = useAuth();
  
  if (authLoading) {
    return <div className="loading-state full-screen">Authenticating and loading...</div>;
  }

  return (
    <Router>
      <Header userName={userName} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solitaire" element={<Solitaire />} />
          <Route path="/daily" element={<DailyChallenge />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
