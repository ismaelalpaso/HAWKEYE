import React, { useState, useContext } from "react";
import { login as loginApi } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AuthPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"

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
  const navigate = useNavigate();

  // Submit Login
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);

    try {
      const data = await loginApi(usernameLogin, passwordLogin);
      login(data);
      navigate("/usuario"); // O donde quieras redirigir tras login
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
      // TODO: Conectar con tu API real
      alert("✅ Cuenta creada correctamente. Ahora inicia sesión.");
      setTab("login");
    } catch (err) {
      console.error("Error en registro:", err);
      setError("No se pudo completar el registro.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        
        {/* 🔹 Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              tab === "login" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
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
              tab === "register" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
            onClick={() => {
              setError(null);
              setTab("register");
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* ---------------- LOGIN ---------------- */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-bold mb-4 text-center">Bienvenido</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={usernameLogin}
                onChange={(e) => setUsernameLogin(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => alert("Funcionalidad pendiente")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Entrar
            </button>
          </form>
        )}

        {/* ---------------- REGISTRO ---------------- */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <h2 className="text-xl font-bold mb-4 text-center">Crear Cuenta</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={usernameReg}
                onChange={(e) => setUsernameReg(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordReg}
                onChange={(e) => setPasswordReg(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Repetir contraseña
              </label>
              <input
                type="password"
                value={confirmPasswordReg}
                onChange={(e) => setConfirmPasswordReg(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span className="text-gray-600">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => alert("Términos pendientes")}
                  className="text-blue-600 hover:underline"
                >
                  términos y condiciones
                </button>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
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
