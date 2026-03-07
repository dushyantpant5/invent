import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();

vi.mock('axios', () => ({
  default: { create },
}));

describe('uiRoutes/lib/axios', () => {
  const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });

  it('creates axios instance with baseURL and timeout', async () => {
    vi.resetModules();
    await import('@/uiRoutes/lib/axios');

    expect(create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
    });
  });
});
