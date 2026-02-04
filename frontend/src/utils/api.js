const RAW_API_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

export function apiUrl(path) {
  if (!API_BASE) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
