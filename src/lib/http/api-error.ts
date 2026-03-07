import { AxiosError } from 'axios';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function extractApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error ?? error.message ?? 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ');
}
