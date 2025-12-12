import React, { createContext, useEffect, useState, useContext } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Leer tema guardado o por defecto "light"
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    // Elimina ambas primero para evitar que se quede pegado
    root.classList.remove("light", "dark");

    // Aplica la nueva
    root.classList.add(theme);

    // Guarda en localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
