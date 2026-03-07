import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges tailwind classes with conflict resolution', () => {
    const result = cn('px-2 py-1', 'px-4', false && 'hidden', undefined, 'text-sm');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('text-sm');
  });
});
