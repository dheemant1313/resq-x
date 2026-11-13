const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiClient {
  private static token: string | null = localStorage.getItem('resqx_token');

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('resqx_token', token);
    } else {
      localStorage.removeItem('resqx_token');
    }
  }

  public static getToken(): string | null {
    return this.token || localStorage.getItem('resqx_token');
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
}

// Health check endpoint
export const checkSystemHealth = async () => {
  return ApiClient.get<{ status: string; service: string; version: string; database: { status: string; dialect: string } }>('/health');
};
