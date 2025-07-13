import { toast } from 'sonner';
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
}
