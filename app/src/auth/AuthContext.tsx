import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, AuthUser, Role } from "../api/client";
import { clearTokens, getAccessToken, setTokens } from "../api/token";
import { registerForPush } from "../notifications";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    full_name: string;
    role: Role;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const access = await getAccessToken();
        if (access) {
          setUser(await api.me());
        }
      } catch {
        await clearTokens();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Register for push whenever we have an authenticated user.
  useEffect(() => {
    if (user) registerForPush();
  }, [user]);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    await setTokens(res.access, res.refresh);
    setUser(res.user);
  }

  async function register(payload: {
    email: string;
    full_name: string;
    role: Role;
    password: string;
  }) {
    await api.register(payload);
    await login(payload.email, payload.password);
  }

  async function logout() {
    await clearTokens();
    setUser(null);
  }

  async function refreshUser() {
    setUser(await api.me());
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
