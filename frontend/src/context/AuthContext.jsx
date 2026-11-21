import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const DEMO_USERS = {
  farmer: {
    username: 'ramesh_farmer',
    password: 'farmer123',
    label: 'Ramesh Patel (Farmer — 20 Acres, Daurala)',
    role: 'farmer'
  },
  worker: {
    username: 'suresh_worker',
    password: 'worker123',
    label: 'Suresh Kumar (Worker Lead — Harvesting, Daurala)',
    role: 'worker'
  },
  mechanic: {
    username: 'vikram_mechanic',
    password: 'provider123',
    label: 'Vikram Singh (Tractor Mechanic, Daurala)',
    role: 'provider'
  },
  machinery: {
    username: 'baldev_machinery',
    password: 'provider123',
    label: 'Baldev Singh (Machinery Rental — Harvesters, Mawana)',
    role: 'provider'
  },
  tubewell: {
    username: 'amit_tubewell',
    password: 'provider123',
    label: 'Amit Verma (Tubewell & Motor Technician, Daurala)',
    role: 'provider'
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    label: 'Administrator (Operations & Admin Portal)',
    role: 'admin'
  }
};

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
