import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Skeleton } from '../ui/Skeleton';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-accent-bg gap-3">
        <div className="w-12 h-12 rounded-full bg-primary animate-pulse flex items-center justify-center text-text text-title">
          S
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-surfaceAlt flex items-center justify-center text-text mb-3">
          <ShieldAlert className="w-6 h-6 text-text" />
        </div>
        <h2 className="text-title mb-1">
          Access Restricted
        </h2>
        <p className="text-caption max-w-sm mb-4">
          Your current role (<strong>{user.role}</strong>) does not have permission
          to access this module.
        </p>
        <Button variant="primary" size="sm" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
