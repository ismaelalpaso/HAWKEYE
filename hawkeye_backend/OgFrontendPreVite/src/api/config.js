// src/components/api/config.js

// 1) Permite override por .env si quieres (opcional)
const ENV_API = process.env.REACT_APP_API_URL;

// 2) Detección automática según desde dónde abras el front
function detectBase() {
  const host = window.location.hostname;

  // Desarrollo en tu PC
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8000";
  }

  // Cualquier otro host (móvil, tablet en tu LAN)
  // → usa la IP LAN de tu PC que nos diste
  return "http://192.168.1.40:8000";
}

// 3) Resolución final: primero .env, si no hay → detección
export const apiBase = (ENV_API && ENV_API.trim()) ? ENV_API.trim() : detectBase();

// Helper para construir URL absolutas
export const buildApiUrl = (path) => {
  if (!path) return apiBase;
  return path.startsWith("http") ? path : `${apiBase}${path}`;
};
