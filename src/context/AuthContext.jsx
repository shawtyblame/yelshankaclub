import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      let errorMessage = 'Ошибка';
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    if (!data.token || !data.user) {
      throw new Error('Invalid response from server');
    }
    
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (!res.ok) {
      let errorMessage = 'Ошибка регестрации';
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    if (!data.token || !data.user) {
      throw new Error('Invalid response from server');
    }
    
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { API_URL };
