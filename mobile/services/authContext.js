import React, { createContext, useEffect, useState } from 'react';
import { getProfile, login, logout, register } from './api';

export const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      console.log('REFRESHED PROFILE:', profile);

      setUser(profile);
      return profile;
    } catch (error) {
      console.log('REFRESH PROFILE ERROR:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      await refreshProfile();
      setLoading(false);
    })();
  }, []);

  const signIn = async (credentials) => {
    const result = await login(credentials);
    console.log('LOGIN RESULT:', result);

    const profile = await refreshProfile();
    console.log('PROFILE AFTER LOGIN:', profile);

    return profile;
  };

  const signUp = async (payload) => {
    const result = await register(payload);
    console.log('REGISTER RESULT:', result);

    const profile = await signIn({
      email: payload.email,
      password: payload.password,
    });

    return profile;
  };

  const signOut = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}