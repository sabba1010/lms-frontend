import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If user is authenticated but doesn't have the required role, redirect to their default dashboard
    // or a generic "unauthorized" page. For now, let's redirect to student dashboard as safe fallback.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
