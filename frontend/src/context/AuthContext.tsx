import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginPayload } from '../types/auth';
import { authApi } from '../api';
import { authStorage } from '../lib/cookies';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSales: boolean;
  isWarehouse: boolean;
  isFinance: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Authenticate directly via browser's protected HttpOnly cookie
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch (error) {
        authStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for session expiration events broadcasted by axios interceptor
    const handleAuthExpired = () => {
      authStorage.clearTokens();
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(payload);
      // Clean up any legacy localStorage/unprotected tokens
      authStorage.clearTokens();

      if (res.user) {
        setUser(res.user);
        toast.success(`Welcome back, ${res.user.full_name}!`);
      } else {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        toast.success(`Welcome back, ${currentUser.full_name}!`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please verify credentials.';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    authStorage.clearTokens();
    setUser(null);
    toast.success('Logged out successfully.');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const isSuperAdmin = !!user?.is_super_admin || user?.email === 'manager@sims.in';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const isManager = user?.role === 'MANAGER' || isSuperAdmin;
  const isSales = user?.role === 'SALES';
  const isWarehouse = user?.role === 'WAREHOUSE';
  const isFinance = user?.role === 'FINANCE';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin,
        isAdmin,
        isManager,
        isSales,
        isWarehouse,
        isFinance,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
