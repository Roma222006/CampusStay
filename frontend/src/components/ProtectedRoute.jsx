import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-color)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--primary-color)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '16px' }}></i>
          <p style={{ fontWeight: 500 }}>Loading CampusStay...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect user to their own role-based dashboard
    switch (user?.role?.toLowerCase()) {
      case 'student': return <Navigate to="/student-dashboard" replace />;
      case 'faculty': return <Navigate to="/faculty-dashboard" replace />;
      case 'warden': return <Navigate to="/warden-dashboard" replace />;
      case 'admin': return <Navigate to="/admin-dashboard" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
