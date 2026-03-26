import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    const s = localStorage.getItem('bc_user');
    return s ? JSON.parse(s) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bc_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => { setUser(r.data); localStorage.setItem('bc_user', JSON.stringify(r.data)); })
      .catch(() => { localStorage.removeItem('bc_token'); localStorage.removeItem('bc_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('bc_token', token);
    localStorage.setItem('bc_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bc_token');
    localStorage.removeItem('bc_user');
    setUser(null);
  };

  const refreshUser = () =>
    api.get('/auth/me').then((r) => {
      setUser(r.data);
      localStorage.setItem('bc_user', JSON.stringify(r.data));
    });

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
