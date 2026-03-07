import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const axiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  const coreAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  return { axiosInstance, coreAxiosInstance };
});

vi.mock('@/uiRoutes/lib/axios', () => ({ default: mocks.axiosInstance }));
vi.mock('@/uiRoutes/lib/coreAxios', () => ({ default: mocks.coreAxiosInstance }));

import { createApiClient, createCoreServiceClient } from '@/uiRoutes/lib/createApiClient';

describe('uiRoutes createApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns response data for get calls', async () => {
    mocks.axiosInstance.get.mockResolvedValueOnce({ data: { status: 'ok' } });
    const client = createApiClient('/auth');

    const result = await client.get<{ status: string }>('/signIn');

    expect(mocks.axiosInstance.get).toHaveBeenCalledWith('/auth/signIn', undefined);
    expect(result).toEqual({ status: 'ok' });
  });

  it('returns response data for write calls', async () => {
    mocks.axiosInstance.post.mockResolvedValueOnce({ data: { ok: true } });
    mocks.axiosInstance.put.mockResolvedValueOnce({ data: { ok: true } });
    mocks.axiosInstance.patch.mockResolvedValueOnce({ data: { ok: true } });
    mocks.axiosInstance.delete.mockResolvedValueOnce({ data: { ok: true } });
    const client = createApiClient('/resource');

    await client.post('/1', { a: 1 });
    await client.put('/1', { a: 1 });
    await client.patch('/1', { a: 1 });
    await client.delete('/1');

    expect(mocks.axiosInstance.post).toHaveBeenCalledWith('/resource/1', { a: 1 }, undefined);
    expect(mocks.axiosInstance.put).toHaveBeenCalledWith('/resource/1', { a: 1 }, undefined);
    expect(mocks.axiosInstance.patch).toHaveBeenCalledWith('/resource/1', { a: 1 }, undefined);
    expect(mocks.axiosInstance.delete).toHaveBeenCalledWith('/resource/1', undefined);
  });
});

describe('uiRoutes createCoreServiceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses core axios instance and returns response data', async () => {
    mocks.coreAxiosInstance.get.mockResolvedValueOnce({ data: { data: [] } });
    const client = createCoreServiceClient('/product');

    const result = await client.get<{ data: unknown[] }>('/');

    expect(mocks.coreAxiosInstance.get).toHaveBeenCalledWith('/product/', undefined);
    expect(result).toEqual({ data: [] });
  });
});
