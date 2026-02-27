import React, { createContext, useContext, useEffect, useState } from "react";
import {
  apiFetch,
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  removeStoredUser,
  setStoredToken,
  setStoredUser,
} from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Stored data is corrupt, clear it
        await removeStoredToken();
        await removeStoredUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }

      if (!data.token || !data.user) {
        return { error: "Invalid response from server" };
      }

      await setStoredToken(data.token);
      await setStoredUser(JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: "Network error. Please check your connection." };
    }
  };

  const logout = async () => {
    await removeStoredToken();
    await removeStoredUser();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        await setStoredUser(JSON.stringify(userData));
      }
    } catch {
      // Silently fail — user data will be stale but functional
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
