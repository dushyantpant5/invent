import { queryClient } from '@/uiRoutes/lib/queryClient';

describe('uiRoutes queryClient', () => {
  it('sets retry policy for queries', () => {
    const queryDefaults = queryClient.getDefaultOptions().queries;
    expect(queryDefaults?.retry).toBe(1);
  });
});
