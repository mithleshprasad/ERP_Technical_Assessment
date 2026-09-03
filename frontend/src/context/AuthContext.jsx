import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const signIn = useCallback((token, userData) => {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
  }, []);

  // Memoized so consumers relying on referential stability (e.g. a
  // memoized Sidebar/Topbar) don't re-render every time an unrelated provider
  // ancestor re-renders.
  const value = useMemo(() => ({ user, signIn, signOut, isAuthenticated: !!user }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
