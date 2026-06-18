const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

let _token: string | null = null;
let _refreshToken: string | null = null;
let _refreshing: Promise<boolean> | null = null;

let _onTokensRefreshed: ((token: string, refreshToken: string) => void) | null = null;
let _onSessionExpired: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

export function setRefreshToken(token: string | null): void {
  _refreshToken = token;
}

export function registerAuthHandlers(handlers: {
  onTokensRefreshed: (token: string, refreshToken: string) => void;
  onSessionExpired: () => void;
}): void {
  _onTokensRefreshed = handlers.onTokensRefreshed;
  _onSessionExpired = handlers.onSessionExpired;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!_refreshToken) return false;
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const json = await res.json();
      _token = json.data.token;
      _refreshToken = json.data.refreshToken;
      _onTokensRefreshed?.(_token!, _refreshToken!);
      return true;
    } catch {
      _token = null;
      _refreshToken = null;
      _onSessionExpired?.();
      return false;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, _retried = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && !_retried && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(method, path, body, true);
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

async function requestForm<T>(path: string, formData: FormData, _retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return requestForm<T>(path, formData, true);
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

async function requestBlob(path: string, _retried = false): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return requestBlob(path, true);
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
  getBlob: (path: string) => requestBlob(path),
};
