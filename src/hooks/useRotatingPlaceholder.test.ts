import { renderHook, act } from '@testing-library/react';
import { useRotatingPlaceholder } from './useRotatingPlaceholder';

const ITEMS = ['first', 'second', 'third'];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRotatingPlaceholder', () => {
  it('returns the first item with opacity 1 initially', () => {
    const { result } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));
    expect(result.current.text).toBe('first');
    expect(result.current.opacity).toBe(1);
  });

  it('fades out after interval', () => {
    const { result } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));

    act(() => { vi.advanceTimersByTime(3500); });

    expect(result.current.opacity).toBe(0);
    expect(result.current.text).toBe('first');
  });

  it('swaps text and fades in after fade-out delay', () => {
    const { result } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));

    act(() => { vi.advanceTimersByTime(3500); }); // fade out
    act(() => { vi.advanceTimersByTime(300); });  // fade-in after swap

    expect(result.current.text).toBe('second');
    expect(result.current.opacity).toBe(1);
  });

  it('cycles through all items in order', () => {
    const { result } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));

    // first -> second
    act(() => { vi.advanceTimersByTime(3500); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.text).toBe('second');

    // second -> third
    act(() => { vi.advanceTimersByTime(3500); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.text).toBe('third');
  });

  it('wraps around to first item after last', () => {
    const { result } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));

    // Cycle through all 3 items
    for (let i = 0; i < 3; i++) {
      act(() => { vi.advanceTimersByTime(3500); });
      act(() => { vi.advanceTimersByTime(300); });
    }

    expect(result.current.text).toBe('first');
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = renderHook(() => useRotatingPlaceholder(ITEMS, 3500));

    unmount();

    // Advancing timers after unmount should not throw
    act(() => { vi.advanceTimersByTime(10000); });
  });
});
