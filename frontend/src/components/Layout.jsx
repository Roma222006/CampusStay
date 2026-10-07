/**
 * Layout.jsx
 * Main app layout — applies role-based theme class, renders sidebar + content.
 * Includes mobile menu toggle and responsive sidebar overlay.
 */

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const ROLE_THEME = {
  Student: '',
  Faculty: 'theme-faculty',
  Warden:  'theme-warden',
  Admin:   'theme-admin',
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  const themeClass = ROLE_THEME[user?.role] || '';
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Apply theme to body so CSS vars cascade everywhere
    document.body.className = themeClass;
    return () => { document.body.className = ''; };
  }, [themeClass]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [children]);

  return (
    <div className={`app-layout ${themeClass}`}>
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} 
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      
      <main className="main-content" id="main-content">
        {/* Mobile menu button injected into each page's topbar */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { onToggleMobile: () => setMobileOpen(v => !v) });
          }
          return child;
        })}
      </main>
    </div>
  );
};

export default Layout;
