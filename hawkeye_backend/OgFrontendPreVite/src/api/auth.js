// src/components/api/auth.js
import { apiBase, buildApiUrl } from "./config";

export async function login(username, password) {
  const url = buildApiUrl("/api/auth/login/");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    // Intenta leer detalle si el backend lo manda
    let detail = "Login failed";
    try {
      const data = await response.json();
      if (data && (data.detail || data.error)) {
        detail = data.detail || data.error;
      }
    } catch {}
    throw new Error(detail);
  }

  const data = await response.json();

  // ✅ Guarda tokens JWT
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);

  return data;
}

export async function refreshToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;

  const url = buildApiUrl("/api/auth/refresh/");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }

  const data = await response.json();
  localStorage.setItem("accessToken", data.access);
  return data.access;
}

export async function authFetch(url, options = {}) {
  const fullUrl = buildApiUrl(url);
  let token = localStorage.getItem("accessToken");
  let headers = { "Content-Type": "application/json", ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    // Token expirado: intenta refresh
    token = await refreshToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(fullUrl, { ...options, headers });
    // ... dentro de authFetch, en el else de "if (token) ..." tras intentar refresh:
    } else {
      // Antes: window.location.href = '/login';
      // Ahora: disparamos un evento global para mostrar el modal
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('session-expired'));
      return null;
    }
  }

  return response;
}
