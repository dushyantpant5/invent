import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('emailjs-com', () => ({
  default: { send },
}));

describe('helpers/emailjs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends otp email with legacy hard-coded config', async () => {
    send.mockResolvedValueOnce({ status: 200, text: 'ok' });
    const mod = await import('@/helpers/emailjs');

    await mod.sendOtpEmail({ toEmail: 'user@example.com', otp: '123456' });

    expect(send).toHaveBeenCalledWith(
      'service_tcfnna5',
      'template_vw7lzpr',
      { email: 'user@example.com', passcode: '123456' },
      'KJEBx3PbN3FjIVI50'
    );
  });

  it('rethrows email send errors', async () => {
    send.mockRejectedValueOnce(new Error('send failed'));
    const mod = await import('@/helpers/emailjs');

    await expect(mod.sendOtpEmail({ toEmail: 'user@example.com', otp: '123456' })).rejects.toThrow(
      'send failed'
    );
  });
});
