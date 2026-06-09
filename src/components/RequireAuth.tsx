import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLandingPath } from '../utils/routing';
import type { Role } from '../types';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleLandingPath(user.role)} replace />;
  }

  return <>{children}</>;
}
