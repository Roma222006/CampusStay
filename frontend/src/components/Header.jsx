/**
 * Header.jsx
 * Glassmorphic sticky header with notification bell, profile dropdown, and mobile toggle.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = ({ title, onToggleMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultAvatar = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png';
  const avatarUrl = user?.profilePhotoPath || (user?.avatar ? `/uploads/${user.avatar}` : defaultAvatar);

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleMobile && (
          <button className="mobile-menu-btn" onClick={onToggleMobile} aria-label="Toggle menu">
            <i className="fa-solid fa-bars" />
          </button>
        )}
        <div className="page-title">
          <h2>{title || 'Dashboard'}</h2>
        </div>
      </div>

      <div className="user-profile-section">
        <NotificationBell />

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            className="profile-dropdown" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img 
              src={avatarUrl} 
              alt={user?.name || 'User'} 
              className="profile-avatar"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
            <div className="profile-info">
              <div className="profile-name">{user?.name || 'User'}</div>
              <div className="profile-role">{user?.role || 'Guest'}</div>
            </div>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              width: '180px',
              background: 'var(--surface-solid)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-solid)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'dropdownSlide 0.2s ease'
            }}>
              <Link 
                to="/profile" 
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  transition: 'background 0.2s',
                  fontWeight: 500
                }}
              >
                <i className="fa-regular fa-user" style={{ color: 'var(--primary)' }} />
                My Profile
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  color: '#EF4444',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid var(--border-solid)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 500
                }}
              >
                <i className="fa-solid fa-right-from-bracket" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
