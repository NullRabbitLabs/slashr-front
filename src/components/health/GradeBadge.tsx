import type { Grade } from '@/types/api';
import { gradeColor, gradeBg } from '@/lib/grades';

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { box: 22, font: 11 },
  md: { box: 32, font: 16 },
  lg: { box: 56, font: 32 },
} as const;

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const s = SIZES[size];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.box,
        height: s.box,
        borderRadius: 4,
        fontSize: s.font,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: gradeColor(grade),
        background: gradeBg(grade),
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {grade}
    </span>
  );
}
