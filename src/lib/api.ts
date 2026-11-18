export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string> {
  const existing = getCookie('agri_csrf');
  if (existing) return existing;
  const res = await fetch('/api/v1/csrf-token', {credentials: 'include'});
  const data = (await res.json()) as {csrfToken?: string};
  return data.csrfToken || getCookie('agri_csrf') || '';
}

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = await ensureCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    const errObj = (parsed as ApiErrorPayload)?.error;
    throw new ApiRequestError(
      response.status,
      errObj?.code || 'REQUEST_FAILED',
      errObj?.message || `Request failed (${response.status})`
    );
  }

  return parsed as T;
}
