import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { Reversibility as Rev } from '@/lib/types';

interface Props {
  reversibility: Rev;
}

function StatCell({
  label,
  value,
  mono,
  accent,
  muted,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  muted?: boolean;
}) {
  const color = accent ? 'var(--accent)' : muted ? 'var(--muted)' : 'var(--text)';
  return (
    <div className="px-5 py-4" style={{ borderColor: 'var(--border)' }}>
      <div
        className="font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div
        className={`mt-1.5 ${mono ? 'font-mono' : 'font-medium'} text-[17px] leading-tight`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

export default function Reversibility({ reversibility }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg border"
      style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
    >
      <div
        className="grid grid-cols-2 md:grid-cols-4 divide-x"
        style={{ borderColor: 'var(--border)' }}
      >
        <StatCell label="Coste anual" value={reversibility.annualCost} mono />
        <StatCell label="Coste de revertir" value={reversibility.revertCost} accent />
        <StatCell label="Revisión" value="36 meses" mono />
        <StatCell label="Sunset" value="No previsto" muted />
      </div>
      <div
        className="border-t px-5 py-4 text-[13.5px] leading-relaxed"
        style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
      >
        <p>
          {reversibility.revertNote} {reversibility.review}
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: 'var(--accent)' }}
        >
          <Icon name={open ? 'chevDown' : 'chevRight'} size={11} />
          Derechos consolidados ({reversibility.consolidatedRights.length})
        </button>
        {open && (
          <ul className="mt-3 space-y-1.5">
            {reversibility.consolidatedRights.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <span
                  className="font-mono text-[10px] mt-1.5"
                  style={{ color: 'var(--muted)' }}
                >
                  ·
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
