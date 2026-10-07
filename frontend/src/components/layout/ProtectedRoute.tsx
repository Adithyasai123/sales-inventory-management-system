import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Skeleton } from '../ui/Skeleton';
import { PageLoader, ContentLoader } from '../ui/Loader';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  screenId?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  screenId,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    if (screenId || allowedRoles) {
      return <ContentLoader message="Verifying access..." />;
    }
    return <PageLoader message="Verifying session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super admin has unrestricted access to all screens and roles
  const isSuperAdmin = user.is_super_admin || user.role === 'MANAGER';

  // Check if user has explicit screen access configured for this module
  const hasExplicitScreenAccess =
    screenId &&
    user.allowed_screens &&
    user.allowed_screens.some((s) => s.toLowerCase() === screenId.toLowerCase());

  // Check role-based restrictions
  if (!isSuperAdmin && !hasExplicitScreenAccess && allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-dangerSoft/50 border border-danger/20 flex items-center justify-center text-danger mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7 text-danger" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-text font-serif">
          Access Restricted
        </h2>
        <p className="text-caption text-muted max-w-md mb-6 leading-relaxed">
          Your current role (<strong>{user.role}</strong>) does not have permission
          to access this module. Please contact your Manager for permissions.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<Home className="w-3.5 h-3.5" />}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check granular screen access configured by Manager
  if (!isSuperAdmin && screenId && user.allowed_screens && user.allowed_screens.length > 0) {
    const hasScreenAccess = user.allowed_screens.includes(screenId.toLowerCase());
    if (!hasScreenAccess) {
      // Find the first screen the user does have access to
      const firstAllowed = user.allowed_screens[0] || 'dashboard';
      const redirectPath = `/${firstAllowed}`;

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
            <ShieldAlert className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-text font-serif">
            Screen Access Not Granted
          </h2>
          <p className="text-caption text-muted max-w-md mb-6 leading-relaxed">
            Your account does not have access to the <strong className="capitalize text-text">{screenId}</strong> module.
            Your Manager (Super Admin) controls individual screen permissions.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Go Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate(redirectPath)} leftIcon={<Home className="w-3.5 h-3.5" />}>
              Go to Allowed Module
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
