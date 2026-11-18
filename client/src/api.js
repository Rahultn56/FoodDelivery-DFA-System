const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getToken() {
  return localStorage.getItem('food-dfa-token');
}

export function setToken(token) {
  localStorage.setItem('food-dfa-token', token);
}

export function clearToken() {
  localStorage.removeItem('food-dfa-token');
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(payload.message || `HTTP ${response.status}: Request failed`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const money = (amount) =>
  '₹' + Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const BASE_URL = BASE;
