import { describe, expect, it } from 'vitest';
import { formatStake, formatUsd, formatUsdLarge } from './format';

describe('formatUsd', () => {
  it('rolls over to $B instead of rendering billions as $1354.76M', () => {
    expect(formatUsd(1_354_760_000)).toBe('$1.35B');
  });

  it('keeps the M range', () => {
    expect(formatUsd(11_830_000)).toBe('$11.83M');
    expect(formatUsd(999_999_999)).toBe('$1000M'); // boundary stays under B
  });

  it('keeps the K range and small values', () => {
    expect(formatUsd(871_200)).toBe('$871.2K');
    expect(formatUsd(12.5)).toBe('$12.50');
  });

  it('handles null/zero', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(0)).toBe('$0');
  });
});

describe('formatUsdLarge', () => {
  it('rolls over to $B', () => {
    expect(formatUsdLarge(2_000_000_000)).toBe('$2B');
  });
});

describe('formatStake', () => {
  it('says staked, never at risk', () => {
    expect(formatStake(999, 'SOL')).toBe('999 SOL staked');
    expect(formatStake('999', 'SOL')).not.toContain('at risk');
  });
});
