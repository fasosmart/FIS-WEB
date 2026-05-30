import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean; // kept for backward compat, always switchable now
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("fis_theme") as Theme) ?? defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove both classes first, then apply the correct one
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("fis_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
