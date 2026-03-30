import type { Severity } from '@/types/api';

interface SeverityMarkProps {
  severity: Severity;
}

export function SeverityMark({ severity }: SeverityMarkProps) {
  if (severity !== 'critical') return null;

  return (
    <span
      style={{
        color: 'var(--color-danger)',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      slashed
    </span>
  );
}
