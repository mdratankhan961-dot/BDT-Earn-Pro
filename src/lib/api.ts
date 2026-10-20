/**
 * API client helper with robust error handling, Netlify compatibility,
 * and safe JSON parsing that prevents "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" errors.
 */

// API Base URL - configurable via VITE_API_URL or defaults to current origin ('')
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * Safely fetches a URL and parses the response as JSON.
 * If the response is HTML (e.g. 404/500/SPA fallback on Netlify), it intercepts the HTML
 * and returns an informative error message instead of throwing a SyntaxError.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Ensure endpoint starts with '/' if not an absolute URL
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE}${path}`;

  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'string' && !options.headers) {
    (defaultHeaders as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, mergedOptions);
    const contentType = res.headers.get('content-type') || '';

    // Check if the server actually returned JSON
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        if (!res.ok) {
          return {
            ok: false,
            status: res.status,
            data,
            error: data?.error || data?.message || `Request failed with HTTP status ${res.status}`,
          };
        }
        return { ok: true, status: res.status, data };
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: `Malformed JSON received from server (${res.status}).`,
        };
      }
    }

    // Server returned non-JSON (HTML, text, etc.)
    const text = await res.text();
    const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html');

    let errorMsg: string;
    if (isHtml) {
      if (res.status === 404) {
        errorMsg = `API endpoint "${path}" was not found (HTTP 404). If deployed on Netlify, please ensure Netlify Functions are deployed and netlify.toml is present.`;
      } else if (res.status === 200) {
        errorMsg = `API endpoint "${path}" returned HTML instead of JSON. The request was intercepted by the static single-page app router. Please verify Netlify Functions configuration.`;
      } else {
        errorMsg = `Server returned an HTML error page (HTTP ${res.status}). Please check server logs.`;
      }
    } else if (text.trim().length > 0 && text.length < 200) {
      errorMsg = text.trim();
    } else {
      errorMsg = `Server returned unexpected response with status ${res.status}.`;
    }

    return {
      ok: false,
      status: res.status,
      data: null,
      error: errorMsg,
    };
  } catch (netErr: any) {
    console.error('API Fetch Network Error:', netErr);
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr.message || 'Network connection failed. Please check your internet or server connection.',
    };
  }
}

/**
 * Helper to build authorization header from token
 */
export function authHeader(token?: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
