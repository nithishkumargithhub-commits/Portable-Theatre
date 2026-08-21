import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginGuest, loginApi, registerApi, demoAdminApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('pt_token') || null;
  });
  const [loading, setLoading] = useState(false);

  const saveAuthSession = (authData) => {
    setUser(authData.user);
    setToken(authData.access_token);
    localStorage.setItem('pt_user', JSON.stringify(authData.user));
    localStorage.setItem('pt_token', authData.access_token);
    return authData.user;
  };

  const loginAsGuest = async (username) => {
    setLoading(true);
    try {
      const res = await loginGuest(username);
      return saveAuthSession(res);
    } catch (err) {
      console.error("Guest login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const res = await loginApi(usernameOrEmail, password);
      return saveAuthSession(res);
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await registerApi(username, email, password);
      return saveAuthSession(res);
    } catch (err) {
      console.error("Registration failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginDemoAdmin = async () => {
    setLoading(true);
    try {
      const res = await demoAdminApi();
      return saveAuthSession(res);
    } catch (err) {
      console.error("Demo admin login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pt_user');
    localStorage.removeItem('pt_token');
  };

  const isAdmin = user?.role === 'admin' || user?.username === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        loginAsGuest,
        loginUser,
        registerUser,
        loginDemoAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
