const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  // In Node/Vitest test environment without origin context, return full fallback URL
  const g = globalThis as { process?: { env?: Record<string, string> } };
  if (g.process && (g.process.env?.NODE_ENV === 'test' || g.process.env?.VITEST)) {
    return 'http://localhost:8090/api/v1';
  }
  // In development and browser with Vite dev proxy:
  // Relative '/api/v1' ensures all requests are forwarded via Vite proxy (port 5180 -> backend target)
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return 'http://localhost:8090/api/v1';
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const BASE_URL = getBaseUrl();
  let token = localStorage.getItem('swat_token');

  const isTest = typeof (globalThis as { process?: { env?: Record<string, string> } }).process !== 'undefined' &&
    ((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.NODE_ENV === 'test' ||
     (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.VITEST);

  // In demo/prototype browser mode: auto-acquire demo tourist token if unauthenticated
  if (!token && !isTest && !endpoint.includes('/auth/')) {
    try {
      const demoRes = await fetch(`${BASE_URL}/auth/demo-login/tourist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (demoRes.ok) {
        const demoData = await demoRes.json();
        if (demoData?.access_token) {
          localStorage.setItem('swat_token', demoData.access_token);
          if (demoData.refresh_token) {
            localStorage.setItem('swat_refresh_token', demoData.refresh_token);
          }
          token = demoData.access_token;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    let message = errorBody.detail;
    if (Array.isArray(message)) {
      message = message.map((m: { msg?: string }) => m.msg || JSON.stringify(m)).join(', ');
    } else if (typeof message === 'object' && message !== null) {
      message = JSON.stringify(message);
    }
    if (!message) {
      message = `Request failed with status ${response.status}`;
    }
    throw new Error(message);
  }

  return response.json();
}
