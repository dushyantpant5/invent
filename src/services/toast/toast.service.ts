import { toast } from 'sonner';
import { ZodError } from 'zod';

export default class ToastService {
  static success(message: string) {
    toast.success(message);
  }

  static error(message: string) {
    toast.error(message);
  }

  static info(message: string) {
    toast.info(message);
  }

  static warning(message: string) {
    toast.warning(message);
  }

  static promise<T>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) {
    return toast.promise(promise, {
      loading: options.loading || 'Loading...',
      success: options.success || 'Success!',
      error: options.error || 'Error occurred',
    });
  }

  static showZodError(error: unknown) {
    if (error instanceof ZodError) {
      error.issues.forEach((issue) => {
        const message = this.formatErrorMessage(issue.message);
        ToastService.error(message);
      });
    } else {
      ToastService.error('An unknown validation error occurred');
    }
  }

  private static formatErrorMessage(errorMessage: string): string {
    return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1).toLowerCase();
  }
}
