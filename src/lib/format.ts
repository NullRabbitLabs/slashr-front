export function truncateMiddle(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const side = Math.floor((maxLen - 3) / 2);
  return `${text.slice(0, side + 1)}...${text.slice(-side)}`;
}

export function formatStake(amount: number, token: string): string {
  return `${Math.round(amount).toLocaleString()} ${token}`;
}

export function stripCidr(ip: string): string {
  return ip.replace(/\/\d+$/, '');
}
