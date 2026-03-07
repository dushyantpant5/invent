import { queryKeys } from '@/lib/query-keys';

describe('query keys', () => {
  it('returns expected product keys', () => {
    expect(queryKeys.products.all()).toEqual(['products']);
    expect(queryKeys.products.detail('p1')).toEqual(['products', 'p1']);
  });

  it('returns expected inventory keys', () => {
    expect(queryKeys.inventory.all()).toEqual(['inventory']);
    expect(queryKeys.inventory.detail('inv-1')).toEqual(['inventory', 'inv-1']);
  });
});
