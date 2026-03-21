import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api, setToken, getToken } from '../lib/api';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  updateMe: (payload: {
    name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
  }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

const AUTH_CONTEXT_KEY = '__edlearn_auth_context__';

const AuthContext: React.Context<AuthContextType | undefined> =
  ((globalThis as any)[AUTH_CONTEXT_KEY] as React.Context<AuthContextType | undefined> | undefined) ??
  createContext<AuthContextType | undefined>(undefined);

(globalThis as any)[AUTH_CONTEXT_KEY] = AuthContext;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);

    setToken(res.token);

    const nextUser: User = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
    };

    setUser(nextUser);
    sessionStorage.setItem('edlearn_user', JSON.stringify(nextUser));

    return nextUser;
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.loginWithGoogle(credential);

    setToken(res.token);

    const nextUser: User = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
    };

    setUser(nextUser);
    sessionStorage.setItem('edlearn_user', JSON.stringify(nextUser));

    return nextUser;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('edlearn_user');
    setToken(null);
  };

  const updateMe = async (payload: {
    name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
  }) => {
    const me = await api.updateMe(payload);

    const nextUser: User = {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
    };

    setUser(nextUser);
    sessionStorage.setItem('edlearn_user', JSON.stringify(nextUser));

    return nextUser;
  };

  // Check for stored user on mount
  React.useEffect(() => {
    let cancelled = false;

    const sessionStored = sessionStorage.getItem('edlearn_user');
    if (sessionStored) {
      try {
        if (!cancelled) setUser(JSON.parse(sessionStored));
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
      return () => {
        cancelled = true;
      };
    }

    // One-time migration from localStorage -> sessionStorage
    const legacyStored = localStorage.getItem('edlearn_user');
    if (legacyStored) {
      try {
        sessionStorage.setItem('edlearn_user', legacyStored);
        localStorage.removeItem('edlearn_user');
        if (!cancelled) setUser(JSON.parse(legacyStored));
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const token = getToken();
    if (!token) {
      if (!cancelled) setIsHydrating(false);
      return () => {
        cancelled = true;
      };
    }

    api
      .me()
      .then((me) => {
        if (cancelled) return;
        const nextUser: User = {
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
        };
        setUser(nextUser);
        sessionStorage.setItem('edlearn_user', JSON.stringify(nextUser));
      })
      .catch(() => {
        if (cancelled) return;
        logout();
      })
      .finally(() => {
        if (!cancelled) setIsHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        updateMe,
        logout,
        isAuthenticated: !!user,
        isHydrating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
