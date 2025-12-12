import React, { useEffect, useState, useContext } from "react";
import { login as loginApi } from "../api/auth";
import { AuthContext } from "../context/AuthContext";

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const onExpire = () => setOpen(true);
    window.addEventListener("session-expired", onExpire);
    return () => window.removeEventListener("session-expired", onExpire);
  }, []);

  if (!open) return null;

  async function handleRelogin(e) {
    e.preventDefault();
    setErr(null);
    try {
      const data = await loginApi(username, password);
      login(data);
      setOpen(false);
    } catch (e) {
      setErr("Credenciales inválidas");
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center">
      <form
        onSubmit={handleRelogin}
        className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg w-[360px] animate-fadein"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Sesión expirada
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Vuelve a iniciar sesión para continuar.
        </p>

        <input
          className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 p-2 rounded mb-3"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 p-2 rounded mb-4"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded border text-gray-700 dark:text-gray-200 dark:border-neutral-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Re-entrar
          </button>
        </div>

        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
      </form>
    </div>
  );
}
