import { beforeEach, describe, expect, it, vi } from 'vitest';

type InterceptorConfig = { headers: Record<string, string> };

const mocks = vi.hoisted(() => {
  const state: { onRequest?: (config: InterceptorConfig) => Promise<InterceptorConfig> } = {};
  const axiosModule = {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn((onRequest) => {
            state.onRequest = onRequest;
          }),
        },
      },
    })),
    get: vi.fn(),
  };
  const jwt = {
    sign: vi.fn(() => 'signed-jwt'),
  };
  return { state, axiosModule, jwt };
});

vi.mock('axios', () => ({
  default: mocks.axiosModule,
}));

vi.mock('jsonwebtoken', () => ({
  default: mocks.jwt,
}));

describe('uiRoutes/lib/coreAxios', () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalCoreBase = process.env.CORE_SERVICE_API_BASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    process.env.CORE_SERVICE_API_BASE_URL = 'http://localhost:4000';
    process.env.JWT_SECRET = 'jwt-secret';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    process.env.CORE_SERVICE_API_BASE_URL = originalCoreBase;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('creates core axios instance with expected config', async () => {
    vi.resetModules();
    await import('@/uiRoutes/lib/coreAxios');

    expect(mocks.axiosModule.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000',
      timeout: 10000,
    });
  });

  it('runs request interceptor and signs a jwt from core-token payload', async () => {
    vi.resetModules();
    await import('@/uiRoutes/lib/coreAxios');

    mocks.axiosModule.get.mockResolvedValueOnce({
      data: { userId: 'u1', inventoryId: 'inv-1', role: 'admin' },
    });

    const config = await mocks.state.onRequest?.({ headers: {} });

    expect(mocks.axiosModule.get).toHaveBeenCalledWith('http://localhost:3000/auth/getCoreToken');
    expect(mocks.jwt.sign).toHaveBeenCalledWith(
      { userId: 'u1', inventoryId: 'inv-1', role: 'admin' },
      'jwt-secret'
    );
    expect(config?.headers.Authorization).toContain('Bearer ');
  });
});
