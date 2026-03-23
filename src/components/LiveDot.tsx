import { useState, useEffect } from 'react';

export function LiveDot() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const i = setInterval(() => setOn(v => !v), 1200);
    return () => clearInterval(i);
  }, []);

  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: on ? '#14F195' : 'rgba(20,241,149,0.3)',
        transition: 'background 0.3s',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}
