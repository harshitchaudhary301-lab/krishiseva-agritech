import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { DEMO_USERS } from '../constants/demoUsers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('krishi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('krishi_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/accounts/me/');
          setUser(res.data);
          localStorage.setItem('krishi_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Token verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/accounts/login/', { username, password });
    const { token: authToken, user: userData } = res.data;
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('krishi_token', authToken);
    localStorage.setItem('krishi_user', JSON.stringify(userData));
    return userData;
  };

  const quickLogin = async (demoKey) => {
    const demo = DEMO_USERS[demoKey];
    if (demo) {
      return await login(demo.username, demo.password);
    }
    throw new Error("Demo user not found");
  };

  const register = async (formData) => {
    const res = await api.post('/accounts/register/', formData);
    const { token: authToken, user: userData } = res.data;
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('krishi_token', authToken);
    localStorage.setItem('krishi_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/accounts/logout/');
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('krishi_token');
      localStorage.removeItem('krishi_user');
    }
  };

  const refreshProfile = async () => {
    if (token) {
      const res = await api.get('/accounts/me/');
      setUser(res.data);
      localStorage.setItem('krishi_user', JSON.stringify(res.data));
      return res.data;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickLogin, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
