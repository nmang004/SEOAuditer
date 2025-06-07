'use client';

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  subscriptionTier: string;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export interface AuthContextType extends AuthState, AuthActions {}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback when context is not available (e.g., outside provider)
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: async () => {},
      logout: () => {},
      register: async () => {},
      refreshToken: async () => {},
      clearError: () => {},
    };
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Reset state
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    
    logger.info('User logged out');
  }, []);

  const refreshToken = useCallback(async () => {
    const currentToken = state.token || localStorage.getItem('authToken');
    if (!currentToken) return;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem('authToken', data.token);
          setState(prev => ({ ...prev, token: data.token }));
        }
      } else {
        // Token is invalid, logout
        logout();
      }
    } catch (error) {
      logger.warn('Token refresh failed:', error);
      logout();
    }
  }, [state.token, logout]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setState(prev => ({
            ...prev,
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          }));
          
          // Validate token
          await refreshToken();
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/secure-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const { user, token } = data.data;
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setState(prev => ({
          ...prev,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        
        logger.info('User logged in successfully');
      } else {
        throw new Error(data.error || data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      logger.error('Login error:', error);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/secure-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const { user, token } = data.data;
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setState(prev => ({
          ...prev,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        
        logger.info('User registered successfully');
      } else {
        throw new Error(data.error || data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      logger.error('Registration error:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = useMemo(() => ({
    ...state,
    login,
    logout,
    register,
    refreshToken,
    clearError,
  }), [state, login, logout, register, refreshToken, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 