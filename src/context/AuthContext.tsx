import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User, type LanInfo } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  loading: boolean;
  lanInfo: LanInfo | null;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pos_token'));
  const [loading, setLoading] = useState(true);
  const [lanInfo, setLanInfo] = useState<LanInfo | null>(null);

  // Check auth & fetch LAN info on startup
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Fetch LAN info so users see their network URL
      try {
        const info = await api.getLanInfo();
        if (isMounted) setLanInfo(info);
      } catch {
        // Ignore LAN info error
      }

      // 2. Validate existing token if present
      const savedToken = localStorage.getItem('pos_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (isMounted) {
            setUser(res.user);
            localStorage.setItem('pos_user', JSON.stringify(res.user));
          }
        } catch {
          if (isMounted) {
            logout();
          }
        }
      }

      if (isMounted) setLoading(false);
    };

    init();

    // Listen for 401 unauthorized events from api client
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const loginWithPassword = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('pos_token', res.token);
    localStorage.setItem('pos_user', JSON.stringify(res.user));
  };

  const loginWithPin = async (pin: string) => {
    const res = await api.login({ pin });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('pos_token', res.token);
    localStorage.setItem('pos_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      localStorage.setItem('pos_user', JSON.stringify(res.user));
    } catch {
      logout();
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';
  const isCashier = user?.role === 'cashier';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isCashier,
        loading,
        lanInfo,
        loginWithPassword,
        loginWithPin,
        logout,
        refreshUser,
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
