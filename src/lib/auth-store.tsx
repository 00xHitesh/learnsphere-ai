import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "./api";
import type { User } from "./types";

const AUTH_KEY = "lumen-auth-v1";

interface AuthContextValue {
  currentUser: User | null;
  mounted: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateInterests: (interests: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Server always starts with null — localStorage loads after mount to prevent hydration mismatch
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      try {
        const { userId } = JSON.parse(raw) as { userId: string };
        if (userId) {
          authApi.getUser(userId).then((user) => {
            if (user) setCurrentUser(user);
          });
        }
      } catch {
        /* ignore corrupt data */
      }
    }
    setMounted(true);
  }, []);

  const persistUserId = (userId: string | null) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
  };

  const value: AuthContextValue = {
    currentUser,
    mounted,
    async login(email, password) {
      const user = await authApi.login(email, password);
      setCurrentUser(user);
      persistUserId(user.id);
      return user;
    },
    async register(name, email, password) {
      const user = await authApi.register(name, email, password);
      setCurrentUser(user);
      persistUserId(user.id);
      return user;
    },
    logout() {
      setCurrentUser(null);
      persistUserId(null);
    },
    requestReset: (email) => authApi.requestReset(email),
    resetPassword: (token, password) => authApi.resetPassword(token, password),
    async updateInterests(interests) {
      if (!currentUser) return;
      const updated = await authApi.updateInterests(currentUser.id, interests);
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
