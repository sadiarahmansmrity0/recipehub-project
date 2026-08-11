'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from "@/lib/auth-client";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [favorites, setFavorites] = useState([]);

  const { data: session } = authClient.useSession();

  // Sync social login session with Express backend
  useEffect(() => {
    if (session && !user) {
      const syncSocial = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google-callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              image: session.user.image
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              localStorage.setItem('token', data.token);
              setUser(data.user);
              // Fetch favorites for this newly synced user
              const favsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites`, {
                headers: {
                  'Authorization': `Bearer ${data.token}`
                }
              });
              if (favsRes.ok) {
                const favsData = await favsRes.json();
                if (favsData.success) {
                  setFavorites(favsData.data);
                }
              }
            }
          }
        } catch (err) {
          console.error("Social login sync error:", err);
        }
      };
      syncSocial();
    }
  }, [session]);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Helper for requests with auth
  const fetchWithAuth = async (url, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', 
    });

    return res;
  };

  // Fetch logged in user
  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          // If logged in, fetch favorites **
          fetchFavorites();
        } else {
          // Token expired or invalid
          logoutLocal();
        }
      } else {
        logoutLocal();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFavorites(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    }
  };

  const logoutLocal = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
    setFavorites([]);
  };

  const logout = async () => {
    try {
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      logoutLocal();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      loading,
      setLoading,
      theme,
      toggleTheme,
      favorites,
      setFavorites,
      fetchFavorites,
      checkAuth,
      logout,
      fetchWithAuth
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
