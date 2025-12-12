import React, { useState, useContext } from "react";
import { login as loginApi } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // ⬅️ Importación del Theme Context

export default function AuthPage() {
  const [tab, setTab] = useState("login");

  // Estados Login
  const [usernameLogin, setUsernameLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");

  // Estados Registro
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [usernameReg, setUsernameReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [confirmPasswordReg, setConfirmPasswordReg] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const { theme, toggle } = useTheme(); // ⬅️ Tema
  const navigate = useNavigate();

  // Submit Login
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);

    try {
      const data = await loginApi(usernameLogin, passwordLogin);
      login(data);

      const container = document.getElementById("login-container");
      if (container) {
        container.classList.add("hide");
        setTimeout(() => navigate("/usuario"), 350);
      } else {
        navigate("/usuario");
      }

    } catch (err) {
      console.error("Error de login:", err);
      setError("Credenciales inválidas");
    }
  }

  // Submit Registro
  async function handleRegister(e) {
    e.preventDefault();
    setError(null);

    if (passwordReg !== confirmPasswordReg) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    try {
      // TODO conectar con API
      alert("✅ Cuenta creada correctamente. Ahora inicia sesión.");
      setTab("login");
    } catch (err) {
      console.error("Error en registro:", err);
      setError("No se pudo completar el registro.");
    }
  }

  return (
    <div
      id="login-container"
      className="fade-exit min-h-screen w-full bg-white dark:bg-neutral-900 flex items-center justify-center relative"
    >

      {/* Toggle Tema */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 text-sm px-3 py-1 rounded border text-gray-600 hover:bg-gray-50 
        dark:text-gray-300 dark:border-gray-700 dark:hover:bg-neutral-800 transition"
      >
        {theme === "light" ? "Dark" : "Light"}
      </button>

      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-8 rounded-2xl shadow-md w-96 animate-fadein">

        {/* Tabs */}
        <div className="flex mb-6 border-b dark:border-neutral-600">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              tab === "login"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => {
              setError(null);
              setTab("login");
            }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              tab === "register"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => {
              setError(null);
              setTab("register");
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Bienvenido</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={usernameLogin}
                onChange={(e) => setUsernameLogin(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => alert("Funcionalidad pendiente")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
            >
              Entrar
            </button>
          </form>
        )}

        {/* REGISTRO */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Crear Cuenta</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={usernameReg}
                onChange={(e) => setUsernameReg(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordReg}
                onChange={(e) => setPasswordReg(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Repetir contraseña
              </label>
              <input
                type="password"
                value={confirmPasswordReg}
                onChange={(e) => setConfirmPasswordReg(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 
                dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span className="text-gray-600 dark:text-gray-300">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => alert("Términos pendientes")}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  términos y condiciones
                </button>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
            >
              Crear cuenta
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-600 mt-4 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
