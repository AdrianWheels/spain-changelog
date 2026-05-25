import { TAG_STYLES } from '@/lib/icons';

interface Props {
  kind: string;
}

export default function Tag({ kind }: Props) {
  const s = TAG_STYLES[kind] ?? TAG_STYLES.AJUSTE;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] uppercase px-2 py-[3px] rounded-[3px]"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.dot }} />
      {kind}
    </span>
  );
}
