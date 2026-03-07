import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('emailjs-com', () => ({
  default: { send },
}));

describe('lib/email/emailjs', () => {
  const originalEnv = {
    service: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    template: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
    user: process.env.NEXT_PUBLIC_EMAILJS_USER_ID,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID = originalEnv.service;
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = originalEnv.template;
    process.env.NEXT_PUBLIC_EMAILJS_USER_ID = originalEnv.user;
  });

  it('throws when emailjs env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    delete process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    delete process.env.NEXT_PUBLIC_EMAILJS_USER_ID;
    const mod = await import('@/lib/email/emailjs');

    await expect(mod.sendOtpEmail({ toEmail: 'user@example.com', otp: '123456' })).rejects.toThrow(
      'EmailJS environment variables are not configured'
    );
  });

  it('sends otp email using configured env values', async () => {
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID = 'service-id';
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = 'template-id';
    process.env.NEXT_PUBLIC_EMAILJS_USER_ID = 'user-id';
    send.mockResolvedValueOnce({ status: 200, text: 'ok' });
    const mod = await import('@/lib/email/emailjs');

    await mod.sendOtpEmail({ toEmail: 'user@example.com', otp: '123456' });

    expect(send).toHaveBeenCalledWith(
      'service-id',
      'template-id',
      { email: 'user@example.com', passcode: '123456' },
      'user-id'
    );
  });
});
