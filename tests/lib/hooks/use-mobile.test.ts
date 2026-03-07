// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        addEventListener: (_event: string, cb: () => void) => listeners.push(cb),
        removeEventListener: (_event: string, cb: () => void) => {
          listeners = listeners.filter((l) => l !== cb);
        },
      })),
    });
  });

  it('returns true on mobile width', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false on desktop width', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('updates value when media query listener fires', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(false));

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    act(() => {
      listeners.forEach((cb) => cb());
    });

    await waitFor(() => expect(result.current).toBe(true));
  });
});
