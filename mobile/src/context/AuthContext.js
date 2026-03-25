import { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, deleteItem } from '../storage';
import api from '../api';
import i18n from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('bc_token');
        if (!token) return;
        const { data } = await api.get('/auth/me');
        setUser(data);
        if (data.ui_language) i18n.changeLanguage(data.ui_language);
      } catch {
        await deleteItem('bc_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token, userData) => {
    await setItem('bc_token', token);
    if (userData.ui_language) i18n.changeLanguage(userData.ui_language);
    setUser(userData);
  };

  const logout = async () => {
    await deleteItem('bc_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
