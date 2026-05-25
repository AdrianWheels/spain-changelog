import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { PatchNavCard } from '@/lib/types';

interface Props {
  side: 'prev' | 'next';
  data: PatchNavCard;
}

function HoverCard({
  visible,
  anchor,
  children,
}: {
  visible: boolean;
  anchor: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute z-30 ${anchor === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-[280px] rounded-md border p-3 text-left transition-all duration-150 pointer-events-none`}
      style={{
        background: 'var(--panel-2)',
        borderColor: 'var(--border)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        boxShadow: visible ? '0 12px 40px rgba(0,0,0,.45)' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export default function PatchNav({ side, data }: Props) {
  const [hover, setHover] = useState(false);
  const prev = side === 'prev';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <a
        href={`/parches/${data.v}`}
        className="block rounded-md border p-4 transition-colors"
        style={{
          background: 'var(--panel)',
          borderColor: hover ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <div
          className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--muted)' }}
        >
          <span className="flex items-center gap-1.5">
            {prev && <Icon name="arrowLeft" size={11} />}
            {prev ? 'parche anterior' : 'parche siguiente'}
            {!prev && <Icon name="arrowRight" size={11} />}
          </span>
          <span>{data.v}</span>
        </div>
        <div
          className="mt-2 text-[14px] font-medium leading-snug"
          style={{ textWrap: 'balance' }}
        >
          {data.title}
        </div>
        <div className="mt-2 font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
          {data.date} · {data.branch} · {data.changes} cambios
        </div>
      </a>
      <HoverCard visible={hover} anchor={prev ? 'left' : 'right'}>
        <div
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] mb-2"
          style={{ color: 'var(--accent)' }}
        >
          parche {data.v}
        </div>
        <div
          className="text-[13px] font-medium leading-snug mb-2"
          style={{ color: 'var(--text)' }}
        >
          {data.title}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tg) => (
            <span
              key={tg}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] border"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-2)' }}
            >
              {tg}
            </span>
          ))}
        </div>
        <div className="mt-3 font-mono text-[10.5px]" style={{ color: 'var(--muted)' }}>
          {data.changes} cambios · publicado {data.date}
        </div>
      </HoverCard>
    </div>
  );
}
