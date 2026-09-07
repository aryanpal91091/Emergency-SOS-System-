import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: Role | string;
  }) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'resqroute_token';
const USER_KEY = 'resqroute_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.data?.success && response.data.user) {
          const verifiedUser: User = response.data.user;
          setUser(verifiedUser);
          localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
        } else {
          // Token is invalid
          logout();
        }
      } catch (err: any) {
        console.warn('⚡ [AuthContext] Verify token notice:', err);
        // If 401, token is definitely expired
        if (err.status === 401) {
          logout();
        }
        // If network error / 500 (e.g. backend spin-up delay), keep cached session so user is not stuck
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      if (response.data?.success && response.data.token && response.data.user) {
        const authToken = response.data.token;
        const authUser: User = response.data.user;

        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));

        setToken(authToken);
        setUser(authUser);
        return authUser;
      } else {
        throw new Error(response.data?.message || 'Authentication failed');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to authentication services. Please check credentials or network.';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: Role | string;
  }): Promise<User> => {
    setError(null);
    try {
      const response = await authApi.register(data);
      if (response.data?.success && response.data.token && response.data.user) {
        const authToken = response.data.token;
        const authUser: User = response.data.user;

        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));

        setToken(authToken);
        setUser(authUser);
        return authUser;
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check form details.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
