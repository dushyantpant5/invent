import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast: mocks.toast }));

import ToastService from '@/services/toast/toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards success/error/info/warning calls', () => {
    ToastService.success('ok');
    ToastService.error('err');
    ToastService.info('info');
    ToastService.warning('warn');

    expect(mocks.toast.success).toHaveBeenCalledWith('ok');
    expect(mocks.toast.error).toHaveBeenCalledWith('err');
    expect(mocks.toast.info).toHaveBeenCalledWith('info');
    expect(mocks.toast.warning).toHaveBeenCalledWith('warn');
  });

  it('wraps toast.promise with default messages', async () => {
    const p = Promise.resolve('ok');
    ToastService.promise(p);

    expect(mocks.toast.promise).toHaveBeenCalledWith(
      p,
      expect.objectContaining({
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error occurred',
      })
    );
  });

  it('shows zod errors and formats capitalization', () => {
    const schema = z.object({ email: z.string().email('invalid email') });
    const parsed = schema.safeParse({ email: 'bad' });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      ToastService.showZodError(parsed.error);
    }

    expect(mocks.toast.error).toHaveBeenCalledWith('Invalid email');
  });

  it('shows unknown validation error fallback', () => {
    ToastService.showZodError(new Error('not zod'));
    expect(mocks.toast.error).toHaveBeenCalledWith('An unknown validation error occurred');
  });
});
