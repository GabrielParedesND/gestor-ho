import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type AuthUser } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManagerOrAdmin: boolean;
  isLeader: boolean;
  canVote: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const { profile } = await authService.signIn(email, password);
    setUser(profile);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: authService.isAdmin(user),
    isManagerOrAdmin: authService.isManagerOrAdmin(user),
    isLeader: authService.isLeader(user),
    canVote: authService.canVote(user),
  };

  return (
    <AuthContext.Provider value={value}>
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