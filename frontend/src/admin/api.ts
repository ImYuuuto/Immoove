const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    throw new Error((await response.json().catch(() => null))?.error?.message || `Erreur ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
