import { useState, useEffect, useRef, useCallback } from 'react';

interface RotatingPlaceholderState {
  text: string;
  opacity: number;
}

export function useRotatingPlaceholder(
  items: string[],
  intervalMs = 3500,
): RotatingPlaceholderState {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    if (fadeTimeoutRef.current !== null) clearTimeout(fadeTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setOpacity(0);

      fadeTimeoutRef.current = setTimeout(() => {
        setIndex(prev => (prev + 1) % items.length);
        setOpacity(1);
      }, 300);
    }, intervalMs);

    return cleanup;
  }, [items, intervalMs, cleanup]);

  return { text: items[index] ?? '', opacity };
}
