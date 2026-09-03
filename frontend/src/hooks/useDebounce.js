import { useEffect, useState } from 'react';

/**
 * Delays reflecting `value` until it stops changing for `delayMs`, so a
 * search box can fire one network request instead of one per keystroke.
 */
export default function useDebounce(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
