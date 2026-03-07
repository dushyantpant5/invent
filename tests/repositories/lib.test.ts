import { DatabaseError } from '@/repositories/lib';

describe('DatabaseError', () => {
  it('sets expected metadata', () => {
    const error = new DatabaseError('db failed');
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('db failed');
    expect(error.statusCode).toBe(500);
  });
});
