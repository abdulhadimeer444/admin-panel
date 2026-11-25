const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("shopco_admin_token");
}
export function saveSession(token, user) {
  localStorage.setItem("shopco_admin_token", token);
  localStorage.setItem("shopco_admin_user", JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem("shopco_admin_token");
  localStorage.removeItem("shopco_admin_user");
}
export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
export const imageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};
