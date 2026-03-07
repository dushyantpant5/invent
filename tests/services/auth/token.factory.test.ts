import { jwtVerify } from 'jose';

import { TokenFactory } from '@/services/auth/token-factory/token.factory';

describe('TokenFactory', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('creates and verifies an access token', async () => {
    const accessToken = await TokenFactory.getAccessToken({
      id: 'u1',
      email: 'user@example.com',
    });

    const payload = await TokenFactory.verifyAccessToken(accessToken.tokenValue);

    expect(payload).toEqual(expect.objectContaining({ id: 'u1', email: 'user@example.com' }));
  });

  it('returns null for invalid access token', async () => {
    await expect(TokenFactory.verifyAccessToken('invalid.token.value')).resolves.toBeNull();
  });

  it('throws on invalid access payload', async () => {
    await expect(TokenFactory.getAccessToken({ id: '', email: '' })).rejects.toThrow(
      'Invalid payload for access token'
    );
  });

  it('generates refresh token and hashes deterministically', async () => {
    const refreshToken = TokenFactory.getRefreshToken();
    expect(refreshToken.tokenValue).toMatch(/^[a-f0-9]{128}$/);

    const hash1 = await TokenFactory.hashRefreshToken('abc');
    const hash2 = await TokenFactory.hashRefreshToken('abc');
    const hash3 = await TokenFactory.hashRefreshToken('xyz');

    expect(hash1).toEqual(hash2);
    expect(hash1).not.toEqual(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates a core token with expected payload', async () => {
    const token = await TokenFactory.getCoreToken({
      userId: 'u1',
      inventoryId: 'inv1',
      role: 'admin',
    });

    const { payload } = await jwtVerify(token, new TextEncoder().encode('test-jwt-secret'));
    expect(payload).toEqual(
      expect.objectContaining({
        userId: 'u1',
        inventoryId: 'inv1',
        role: 'admin',
      })
    );
  });

  it('throws if JWT secret is missing', async () => {
    delete process.env.JWT_SECRET;
    await expect(
      TokenFactory.getCoreToken({ userId: 'u1', inventoryId: 'inv1', role: 'admin' })
    ).rejects.toThrow('JWT secret key is not defined');
  });
});
