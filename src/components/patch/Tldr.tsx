import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { TldrItem } from '@/lib/types';

interface Props {
  items: TldrItem[];
}

export default function Tldr({ items }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}
      >
        <span
          className="font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--muted)' }}
        >
          TL;DR · {items.length} puntos
        </span>
        <Icon name={open ? 'chevDown' : 'chevRight'} size={13} />
      </button>
      {open && (
        <ul className="px-5 py-4 space-y-3">
          {items.map((b, i) => (
            <li key={i} className="flex gap-3 leading-snug">
              <span className="text-[16px] leading-none mt-0.5 select-none">
                {b.emoji}
              </span>
              <span
                className="text-[14.5px]"
                style={{ color: 'var(--text-2)', textWrap: 'pretty' }}
              >
                {b.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
