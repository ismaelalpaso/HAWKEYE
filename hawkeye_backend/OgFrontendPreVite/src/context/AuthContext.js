// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 🔹 Cargar sesión existente al abrir la app
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");

    if (savedToken) {
      setToken(savedToken);
      try {
        const decoded = jwtDecode(savedToken);
        setUser(decoded);
      } catch (error) {
        console.error("Error al decodificar token:", error);
      }
    }
  }, []);

  // 🔹 Login
  const login = (data) => {
    const { access } = data;

    setToken(access);
    localStorage.setItem("accessToken", access);

    try {
      const decoded = jwtDecode(access);
      setUser(decoded);
    } catch (err) {
      console.error("Token inválido:", err);
      setUser(null);
    }
  };

  // 🔹 Logout con Fade-Out
  const logout = () => {
    const app = document.getElementById("app-container");

    if (app) {
      app.classList.remove("show");
      app.classList.add("hide");

      setTimeout(() => {
        localStorage.removeItem("accessToken");

        setUser(null);
        setToken(null);
      }, 700); // ⬅️ ahora coincide con fade-in
    } else {
      localStorage.removeItem("accessToken");
      setUser(null);
      setToken(null);
    }
  };

  // 🔹 Derivación del estado de autenticación
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
