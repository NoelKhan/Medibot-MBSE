/**
 * HTTP Client Interface
 * =====================
 * Platform-agnostic HTTP client interface
 * Implementations should be provided by the consuming application
 */

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: any): Promise<HttpResponse<T>>;
}
