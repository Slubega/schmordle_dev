import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
    userName: string;
}

const Header: React.FC<HeaderProps> = ({ userName }) => {
  return (
    <header className="header">
      <nav className="navbar">
        <Link to="/" className="logo-link">
            <h1 className="logo">Schmordle</h1>
        </Link>
        <div className="nav-links">
          <Link to="/solitaire" className="nav-link">Arcade Solo</Link>
          <Link to="/daily" className="nav-link">Daily Challenge</Link>
          <Link to="/multiplayer" className="nav-link">Multiplayer</Link>
        </div>
        <div className="user-info">
            <span title="Your anonymous user ID for Firebase">{userName}</span>
        </div>
      </nav>
    </header>
  );
};

export default Header; 
