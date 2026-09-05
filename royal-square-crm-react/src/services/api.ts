import { getCsrfToken, generateToken } from '../security/csrf';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function secureFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-CSRF-Token', getCsrfToken());
  headers.set('X-Idempotency-Key', generateToken());

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {
        // Fallback to text
      }
      return { status: response.status, error: errorMsg };
    }

    const data = await response.json();
    return { status: response.status, data };
  } catch (err: any) {
    return { status: 0, error: err.message || 'Network connection failed' };
  }
}
