// lib/createApiClient.ts
import axiosInstance from "./axios";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

export const createApiClient = (basePath: string): ApiClient => {
  return {
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const response: AxiosResponse<T> = await axiosInstance.get(
        `${basePath}${url}`,
        config
      );
      return response.data;
    },
    post: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      const response: AxiosResponse<T> = await axiosInstance.post(
        `${basePath}${url}`,
        data,
        config
      );
      return response.data;
    },
    put: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      const response: AxiosResponse<T> = await axiosInstance.put(
        `${basePath}${url}`,
        data,
        config
      );
      return response.data;
    },
    patch: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      const response: AxiosResponse<T> = await axiosInstance.patch(
        `${basePath}${url}`,
        data,
        config
      );
      return response.data;
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const response: AxiosResponse<T> = await axiosInstance.delete(
        `${basePath}${url}`,
        config
      );
      return response.data;
    },
  };
};
