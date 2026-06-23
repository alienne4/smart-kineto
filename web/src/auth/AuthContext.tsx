import { createContext, useContext, useEffect, useState } from "react";

import { api, AuthUser, Role, tokens } from "../api/client";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (p: { email: string; full_name: string; role: Role; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (tokens.access) {
        try {
          setUser(await api.me());
        } catch {
          tokens.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    tokens.set(res.access, res.refresh);
    setUser(res.user);
  }

  async function register(p: { email: string; full_name: string; role: Role; password: string }) {
    await api.register(p);
    await login(p.email, p.password);
  }

  function logout() {
    tokens.clear();
    setUser(null);
  }

  async function refreshUser() {
    setUser(await api.me());
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
