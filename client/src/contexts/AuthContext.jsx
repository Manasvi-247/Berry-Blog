import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, initSocket } from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      
      // Initialize Socket.IO when user is authenticated
      initSocket();
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, username) => {
    try {
      const data = await authAPI.register(username, email, password);
      setUser(data.user);
      initSocket();
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      initSocket();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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