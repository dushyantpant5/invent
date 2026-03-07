import { Token } from '@/services/auth/token-factory/token.class';

describe('Token class', () => {
  it('exposes tokenValue via getter', () => {
    const token = new Token('abc123');
    expect(token.tokenValue).toBe('abc123');
  });
});
