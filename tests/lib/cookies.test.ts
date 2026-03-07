import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookiesFn: vi.fn(),
  encryptSignupPayload: vi.fn(),
  encryptInventoryData: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookiesFn,
}));

vi.mock('@/lib/crypto/encryption', () => ({
  encryptSignupPayload: mocks.encryptSignupPayload,
  encryptInventoryData: mocks.encryptInventoryData,
}));

import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setInventoryData,
  setRefreshToken,
  setSignUpData,
  setTokensAtTheTimeOfSignUp,
} from '@/lib/cookies';

describe('lib/cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.encryptSignupPayload.mockResolvedValue('encrypted-signup');
    mocks.encryptInventoryData.mockResolvedValue('encrypted-inventory');
  });

  it('sets access and refresh cookies', () => {
    const response = { cookies: { set: vi.fn() } };

    setAccessToken('access-token', response as never);
    setRefreshToken('refresh-token', response as never);

    expect(response.cookies.set).toHaveBeenCalledTimes(2);
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'accessToken', value: 'access-token' })
    );
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: 'refreshToken', value: 'refresh-token' })
    );
  });

  it('clears old cookies then sets new signup tokens', () => {
    const response = { cookies: { set: vi.fn() } };

    setTokensAtTheTimeOfSignUp('access-token', 'refresh-token', response as never);

    expect(response.cookies.set).toHaveBeenCalledTimes(4);
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'accessToken', maxAge: 0 })
    );
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: 'refreshToken', maxAge: 0 })
    );
  });

  it('sets encrypted signup and inventory payload cookies', async () => {
    const response = { cookies: { set: vi.fn() } };

    await setSignUpData({ email: 'user@example.com', password: 'Passw0rd!' }, response as never);
    await setInventoryData('inv-1', response as never);

    expect(mocks.encryptSignupPayload).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(mocks.encryptInventoryData).toHaveBeenCalledWith('inv-1');
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'userPayload', value: 'encrypted-signup' })
    );
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'inventoryData', value: 'encrypted-inventory' })
    );
  });

  it('reads access and refresh token from cookie store', async () => {
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

  it('returns null when auth cookies are missing', async () => {
    mocks.cookiesFn.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('clears auth cookies', () => {
    const response = { cookies: { set: vi.fn() } };
    clearAuthCookies(response as never);

    expect(response.cookies.set).toHaveBeenCalledTimes(2);
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'accessToken', maxAge: 0, value: '' })
    );
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'refreshToken', maxAge: 0, value: '' })
    );
  });
});
