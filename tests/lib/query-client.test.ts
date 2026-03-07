import { queryClient } from '@/lib/query-client';

describe('lib queryClient', () => {
  it('configures query defaults', () => {
    const queryDefaults = queryClient.getDefaultOptions().queries;
    const mutationDefaults = queryClient.getDefaultOptions().mutations;

    expect(queryDefaults?.retry).toBe(1);
    expect(queryDefaults?.staleTime).toBe(30_000);
    expect(mutationDefaults?.retry).toBe(0);
  });
});
