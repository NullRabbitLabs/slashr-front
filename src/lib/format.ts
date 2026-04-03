export function truncateMiddle(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const side = Math.floor((maxLen - 3) / 2);
  return `${text.slice(0, side + 1)}...${text.slice(-side)}`;
}

export function formatStake(amount: number, token: string): string {
  return `${Math.round(amount).toLocaleString()} ${token} at risk`;
}

export function formatCompact(n: number): string {
  if (!isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${strip(n / 1_000_000_000, 2)}B`;
  if (abs >= 1_000_000) return `${strip(n / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${strip(n / 1_000, 1)}K`;
  return n.toLocaleString();
}

function strip(n: number, decimals: number): string {
  const s = n.toFixed(decimals);
  return s.replace(/\.?0+$/, '');
}

export function formatStakeCompact(amount: number): string {
  return formatCompact(amount);
}

export function stripCidr(ip: string): string {
  return ip.replace(/\/\d+$/, '');
}
