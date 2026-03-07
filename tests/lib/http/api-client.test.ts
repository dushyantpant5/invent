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

vi.mock('@/lib/http/axios', () => ({ default: mocks.axiosInstance }));
vi.mock('@/lib/http/core-axios', () => ({ default: mocks.coreAxiosInstance }));

import { createApiClient, createCoreServiceClient } from '@/lib/http/api-client';

describe('createApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps get to axios instance and returns response data', async () => {
    mocks.axiosInstance.get.mockResolvedValueOnce({ data: { ok: true } });
    const client = createApiClient('/auth');

    const result = await client.get<{ ok: boolean }>('/signIn');

    expect(mocks.axiosInstance.get).toHaveBeenCalledWith('/auth/signIn', undefined);
    expect(result).toEqual({ ok: true });
  });

  it('maps post to axios instance and returns response data', async () => {
    mocks.axiosInstance.post.mockResolvedValueOnce({ data: { id: '1' } });
    const client = createApiClient('/inventory');
    const payload = { name: 'Main' };

    const result = await client.post<{ id: string }>('/create-inventory', payload);

    expect(mocks.axiosInstance.post).toHaveBeenCalledWith(
      '/inventory/create-inventory',
      payload,
      undefined
    );
    expect(result).toEqual({ id: '1' });
  });

  it('maps put/patch/delete correctly', async () => {
    mocks.axiosInstance.put.mockResolvedValueOnce({ data: { ok: 'put' } });
    mocks.axiosInstance.patch.mockResolvedValueOnce({ data: { ok: 'patch' } });
    mocks.axiosInstance.delete.mockResolvedValueOnce({ data: { ok: 'delete' } });
    const client = createApiClient('/resource');

    await expect(client.put('/1', { a: 1 })).resolves.toEqual({ ok: 'put' });
    await expect(client.patch('/1', { a: 2 })).resolves.toEqual({ ok: 'patch' });
    await expect(client.delete('/1')).resolves.toEqual({ ok: 'delete' });

    expect(mocks.axiosInstance.put).toHaveBeenCalledWith('/resource/1', { a: 1 }, undefined);
    expect(mocks.axiosInstance.patch).toHaveBeenCalledWith('/resource/1', { a: 2 }, undefined);
    expect(mocks.axiosInstance.delete).toHaveBeenCalledWith('/resource/1', undefined);
  });
});

describe('createCoreServiceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses core axios instance for requests', async () => {
    mocks.coreAxiosInstance.get.mockResolvedValueOnce({ data: { products: [] } });
    const client = createCoreServiceClient('/product');

    const result = await client.get<{ products: unknown[] }>('/');

    expect(mocks.coreAxiosInstance.get).toHaveBeenCalledWith('/product/', undefined);
    expect(result).toEqual({ products: [] });
    expect(mocks.axiosInstance.get).not.toHaveBeenCalled();
  });
});
