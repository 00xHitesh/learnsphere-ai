import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeCtx {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = "lumen-theme";
const ThemeContext = createContext<ThemeCtx | null>(null);

function systemIsDark() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(t: Theme): "light" | "dark" {
  return t === "system" ? (systemIsDark() ? "dark" : "light") : t;
}

function applyClass(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeRaw] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load saved preference on mount and wire system-preference listener
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeRaw(saved);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      // Only reacts when the user has chosen "system"
      setThemeRaw((curr) => {
        if (curr === "system") {
          const r = mq.matches ? "dark" : "light";
          applyClass(r);
          setResolvedTheme(r);
        }
        return curr;
      });
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  // Apply class + persist whenever the theme choice changes
  useEffect(() => {
    const r = resolve(theme);
    applyClass(r);
    setResolvedTheme(r);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeRaw }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Blocking inline script for <head>.
 * Runs before React hydrates so the correct class is on <html> immediately,
 * preventing a flash of the wrong theme.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('lumen-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
