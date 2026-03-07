import { AxiosInstance, AxiosRequestConfig } from 'axios';

import axiosInstance from './axios';
import coreAxiosInstance from './core-axios';

export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

function buildApiClient(instance: AxiosInstance, basePath: string): ApiClient {
  return {
    get: async <T>(url: string, config?: AxiosRequestConfig) => {
      const { data } = await instance.get<T>(`${basePath}${url}`, config);
      return data;
    },
    post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
      const { data } = await instance.post<T>(`${basePath}${url}`, body, config);
      return data;
    },
    put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
      const { data } = await instance.put<T>(`${basePath}${url}`, body, config);
      return data;
    },
    patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
      const { data } = await instance.patch<T>(`${basePath}${url}`, body, config);
      return data;
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig) => {
      const { data } = await instance.delete<T>(`${basePath}${url}`, config);
      return data;
    },
  };
}

export const createApiClient = (basePath: string): ApiClient =>
  buildApiClient(axiosInstance, basePath);

export const createCoreServiceClient = (basePath: string): ApiClient =>
  buildApiClient(coreAxiosInstance, basePath);
