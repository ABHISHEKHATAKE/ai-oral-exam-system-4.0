import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">📚</span>
            <span className="brand-text">AI Oral Exam</span>
          </Link>

          <div className="navbar-links">
            {user ? (
              <>
                <Link to={isTeacher ? "/teacher/dashboard" : "/student/dashboard"} className="nav-link">
                  Dashboard
                </Link>
                <div className="user-menu">
                  <span className="user-name">{user.full_name}</span>
                  <span className="user-role">{user.role}</span>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;