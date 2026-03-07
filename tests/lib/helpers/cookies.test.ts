import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookiesFn: vi.fn(),
  encryptSignupPayload: vi.fn(),
  encryptInventoryData: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookiesFn,
}));

vi.mock('@/helpers/encryption', () => ({
  encryptSignupPayload: mocks.encryptSignupPayload,
  encryptInventoryData: mocks.encryptInventoryData,
}));

import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setInventoryData,
  setSignUpData,
  setTokensAtTheTimeOfSignUp,
} from '@/helpers/cookies';

describe('helpers/cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.encryptSignupPayload.mockResolvedValue('encrypted-signup');
    mocks.encryptInventoryData.mockResolvedValue('encrypted-inventory');
  });

  it('sets and clears auth cookies', async () => {
    const response = { cookies: { set: vi.fn() } };

    await setAccessToken('access-token', response as never);
    setTokensAtTheTimeOfSignUp('access-token', 'refresh-token', response as never);
    clearAuthCookies(response as never);

    expect(response.cookies.set).toHaveBeenCalled();
  });

  it('sets encrypted payload cookies', async () => {
    const response = { cookies: { set: vi.fn() } };

    await setSignUpData({ email: 'u@x.com', password: 'Passw0rd!' }, response as never);
    await setInventoryData('inv-1', response as never);

    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'userPayload', value: 'encrypted-signup' })
    );
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'inventoryData', value: 'encrypted-inventory' })
    );
  });

  it('gets access and refresh token wrappers from cookie store', async () => {
    mocks.cookiesFn.mockResolvedValueOnce({
      get: vi.fn((key: string) =>
        key === 'accessToken'
          ? { value: 'access' }
          : key === 'refreshToken'
            ? { value: 'refresh' }
            : undefined
      ),
    });
    const access = await getAccessToken();

    mocks.cookiesFn.mockResolvedValueOnce({
      get: vi.fn((key: string) =>
        key === 'accessToken'
          ? { value: 'access' }
          : key === 'refreshToken'
            ? { value: 'refresh' }
            : undefined
      ),
    });
    const refresh = await getRefreshToken();

    expect(access?.tokenValue).toBe('access');
    expect(refresh?.tokenValue).toBe('refresh');
  });
});
