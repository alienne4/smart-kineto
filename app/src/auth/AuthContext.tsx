import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, tokenStore, type Role, type User } from "../api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name?: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (await tokenStore.access()) {
          const me = await api.me();
          if (active) setUser(me);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const response = await api.login(email, password);
        await tokenStore.set(response.access, response.refresh);
        setUser(response.user);
      },
      async register(payload) {
        await api.register(payload);
        const response = await api.login(payload.email, payload.password);
        await tokenStore.set(response.access, response.refresh);
        setUser(response.user);
      },
      async logout() {
        await tokenStore.clear();
        setUser(null);
      },
      async refreshUser() {
        setUser(await api.me());
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
