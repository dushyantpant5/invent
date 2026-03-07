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
  return { state, axiosModule };
});

vi.mock('axios', () => ({
  default: mocks.axiosModule,
}));

describe('lib/http/core-axios', () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalCoreBase = process.env.CORE_SERVICE_API_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    process.env.CORE_SERVICE_API_BASE_URL = 'http://localhost:4000';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    process.env.CORE_SERVICE_API_BASE_URL = originalCoreBase;
  });

  it('creates core axios instance with expected config', async () => {
    vi.resetModules();
    await import('@/lib/http/core-axios');

    expect(mocks.axiosModule.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000',
      timeout: 10000,
    });
  });

  it('injects bearer token via request interceptor', async () => {
    vi.resetModules();
    await import('@/lib/http/core-axios');

    mocks.axiosModule.get.mockResolvedValueOnce({
      data: { data: { authJwt: 'core-jwt' } },
    });

    const result = await mocks.state.onRequest?.({ headers: {} });

    expect(mocks.axiosModule.get).toHaveBeenCalledWith('http://localhost:3000/auth/getCoreToken');
    expect(result?.headers.Authorization).toBe('Bearer core-jwt');
  });

  it('throws when core token is missing in refresh payload', async () => {
    vi.resetModules();
    await import('@/lib/http/core-axios');

    mocks.axiosModule.get.mockResolvedValueOnce({
      data: { data: {} },
    });

    await expect(mocks.state.onRequest?.({ headers: {} })).rejects.toThrow(
      'Core service token unavailable'
    );
  });
});
