import { useEffect, useRef, useState } from 'react';

type TUseDebounceOptions = {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
};

export function useDebounce<T>(value: T, options: TUseDebounceOptions) {
  const { delay = 300, leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leadingCalled = useRef(false);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const shouldCallLeading = leading && !leadingCalled.current;

    if (shouldCallLeading) {
      setDebouncedValue(value);
      leadingCalled.current = true;
    }

    timeoutRef.current = setTimeout(() => {
      if (trailing) setDebouncedValue(value);
      leadingCalled.current = false;
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
}
