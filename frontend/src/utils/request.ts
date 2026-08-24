const API = import.meta.env.VITE_API_URL || '/api/v1';
const AUTH_MARKER = 'bouzid_authenticated';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : '';
}

async function getCsrfToken() {
  const existing = readCookie('sidibouzid_csrf');
  if (existing) return existing;
  const response = await fetch(`${API}/auth/csrf-token`, { credentials: 'include' });
  if (!response.ok) throw new Error('Impossible de sécuriser la requête.');
  return ((await response.json()) as { csrfToken: string }).csrfToken;
}

export function clearLocalSession() {
  localStorage.removeItem(AUTH_MARKER);
}

export function redirectToLogin() {
  clearLocalSession();
  if (window.location.pathname !== '/') window.location.assign('/?login=1');
  else window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (MUTATING_METHODS.has(method) && !['/auth/login', '/auth/register'].includes(path)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  const response = await fetch(`${API}${path}`, { ...options, credentials: 'include', headers });

  if (response.ok && ['/auth/login', '/auth/register', '/auth/session'].includes(path)) {
    localStorage.setItem(AUTH_MARKER, '1');
  }
  if (response.ok && ['/auth/logout', '/auth/password'].includes(path)) clearLocalSession();

  if (!response.ok) {
    const serverMessage = (await response.json().catch(() => null))?.error?.message;
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    const message = response.status === 413
      ? 'Votre envoi est trop volumineux. Réduisez la taille du contenu ou des fichiers, puis réessayez.'
      : response.status === 429
        ? serverMessage || (retryAfter ? `Trop de tentatives. Réessayez dans ${retryAfter} secondes.` : 'Trop de tentatives. Veuillez réessayer plus tard.')
        : serverMessage || `Erreur ${response.status}`;
    const incorrectCurrentPassword = path === '/auth/password' && message === 'Current password is incorrect';
    if (response.status === 401 && !incorrectCurrentPassword && localStorage.getItem(AUTH_MARKER) === '1' && !['/auth/login', '/auth/register'].includes(path)) redirectToLogin();
    throw new ApiError(message, response.status, retryAfter);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}
