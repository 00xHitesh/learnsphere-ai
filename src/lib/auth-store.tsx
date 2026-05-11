import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "./api";
import { clearTokens, getAccessToken } from "./api/client";
import type { User } from "./types";

interface AuthContextValue {
  currentUser: User | null;
  mounted: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateInterests: (interests: string[]) => Promise<void>;
  updateLocale: (regionCode: string, currencyCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Server always starts with null — token check runs after mount to prevent hydration mismatch
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      authApi.getUser().then((user) => {
        if (user) setCurrentUser(user);
      });
    }
    setMounted(true);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    mounted,
    async login(email, password) {
      const user = await authApi.login(email, password);
      setCurrentUser(user);
      return user;
    },
    async register(name, email, password) {
      const user = await authApi.register(name, email, password);
      setCurrentUser(user);
      return user;
    },
    logout() {
      setCurrentUser(null);
      clearTokens();
    },
    requestReset: (email) => authApi.requestReset(email),
    resetPassword: (token, password) => authApi.resetPassword(token, password),
    async updateInterests(interests) {
      if (!currentUser) return;
      const updated = await authApi.updateInterests(currentUser.id, interests);
      setCurrentUser(updated);
    },
    async updateLocale(regionCode, currencyCode) {
      if (!currentUser) return;
      const updated = await authApi.updateLocale(currentUser.id, regionCode, currencyCode);
      setCurrentUser(updated);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
