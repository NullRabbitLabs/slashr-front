import { useState, useEffect } from 'react';

const MESSAGES = [
  'Finding your delegations...',
  'Checking incident history...',
  'Estimating cost of downtime...',
  'Grading your validators...',
];

export function LoadingSequence() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 200);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--color-text-tertiary)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }}
        />
        {MESSAGES[index]}
      </div>
    </div>
  );
}
