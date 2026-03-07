import { ServiceError } from '@/services/lib';

describe('ServiceError', () => {
  it('uses default status code', () => {
    const error = new ServiceError('bad request');
    expect(error.name).toBe('ServiceError');
    expect(error.message).toBe('bad request');
    expect(error.statusCode).toBe(400);
  });

  it('supports custom status code', () => {
    const error = new ServiceError('conflict', 409);
    expect(error.statusCode).toBe(409);
  });
});
