/**
 * HTTP Client Adapter
 * ===================
 * Adapter to create an HTTP client compatible with the shared library
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { HttpClient, HttpResponse } from '../lib/shared';
import { API_CONFIG } from '../config/api.config';

/**
 * Create an axios instance with the same configuration as apiClient
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * HTTP client adapter for the shared library
 */
export const httpClientAdapter: HttpClient = {
  async get<T = any>(url: string, config?: any): Promise<HttpResponse<T>> {
    const response = await axiosInstance.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  },

  async post<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    const response = await axiosInstance.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  },

  async put<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    const response = await axiosInstance.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  },

  async patch<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  },

  async delete<T = any>(url: string, config?: any): Promise<HttpResponse<T>> {
    const response = await axiosInstance.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  },
};
