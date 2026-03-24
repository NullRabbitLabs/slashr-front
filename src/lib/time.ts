export function relativeTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatUtcTime(isoString: string): string {
  const d = new Date(isoString);
  const day = d.getUTCDate();
  const mon = SHORT_MONTHS[d.getUTCMonth()];
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const yr = String(d.getUTCFullYear()).slice(-2);
  return `${mon} ${day} ${yr}, ${h}:${m} UTC`;
}
