import { ICONS } from '@/lib/icons';

interface Props {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className = '',
}: Props) {
  const d = ICONS[name];
  if (!d) return null;
  const parts = d
    .split(/(?=\sM)/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {parts.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
