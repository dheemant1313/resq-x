const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  role: 'ADMIN' | 'OPERATOR' | 'RELIEF_CENTER';
  username: string;
  center_id?: number | null;
}

export class ApiClient {
  private static token: string | null = localStorage.getItem('resqx_token');
  private static refreshToken: string | null = localStorage.getItem('resqx_refresh_token');

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('resqx_token', token);
    } else {
      localStorage.removeItem('resqx_token');
    }
  }

  public static setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('resqx_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('resqx_refresh_token');
    }
  }

  public static getToken(): string | null {
    return this.token || localStorage.getItem('resqx_token');
  }

  public static getRefreshToken(): string | null {
    return this.refreshToken || localStorage.getItem('resqx_refresh_token');
  }

  public static clearSession() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('resqx_token');
    localStorage.removeItem('resqx_refresh_token');
  }

  public static async refreshSession(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      const data: AuthSession = await response.json();
      this.setToken(data.access_token);
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  public static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Backend logout notification failed:', err);
      }
    }
    this.clearSession();
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}, retryOn401 = true): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && retryOn401 && this.getRefreshToken() && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `Request failed with HTTP ${response.status}`);
    }

    return response.json();
  }

  public static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public static post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public static put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Health check endpoint
export const checkSystemHealth = async () => {
  return ApiClient.get<{
    status: string;
    service: string;
    version: string;
    database: { status: string; dialect: string };
  }>('/health');
};
