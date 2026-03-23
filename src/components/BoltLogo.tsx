interface BoltLogoProps {
  size?: number;
}

export function BoltLogo({ size = 32 }: BoltLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 32"
      width={size * 0.75}
      height={size}
      style={{ flexShrink: 0 }}
    >
      <path
        d="M16.5 0L4 18h7.5L9.5 32 22 14h-7.5L16.5 0z"
        fill="#FF4545"
      />
    </svg>
  );
}
