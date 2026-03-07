// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces value updates with trailing mode', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 100, leading: false, trailing: true }),
      { initialProps: { value: 'a' } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('ab');
  });

  it('supports leading-only mode', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 100, leading: true, trailing: false }),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    // During the same debounce window, leading has already fired and value stays unchanged.
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'abc' });
    expect(result.current).toBe('abc');
  });
});
