import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Tag from '@/components/ui/Tag';
import type { Change } from '@/lib/types';

interface Props {
  change: Change;
  index: number;
  blockPad: string;
}

export default function ChangeItem({ change, index, blockPad }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-md border transition-colors"
      style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
    >
      <div className={`${blockPad} flex flex-col gap-3`}>
        <div className="flex items-start gap-3">
          <div
            className="font-mono text-[10.5px] mt-1 select-none"
            style={{ color: 'var(--muted)', minWidth: 22 }}
          >
            {String(index).padStart(2, '0')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Tag kind={change.kind} />
              <span
                className="inline-flex items-center gap-1.5 text-[11.5px] font-mono uppercase tracking-[0.06em]"
                style={{ color: 'var(--muted)' }}
              >
                <Icon name={change.icon} size={12} />
                {change.cat}
              </span>
            </div>
            <h3
              className="text-[15.5px] font-medium leading-snug"
              style={{ textWrap: 'balance' }}
            >
              {change.title}
            </h3>
            <p
              className="mt-1.5 text-[14px] leading-[1.55]"
              style={{ color: 'var(--text-2)', textWrap: 'pretty' }}
            >
              {change.body}
            </p>

            {change.diff && (
              <div
                className="mt-3 inline-flex items-center gap-3 px-3 py-2 rounded-md border font-mono text-[12.5px]"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--panel-2)',
                }}
              >
                <span
                  style={{
                    color: 'var(--muted)',
                    textDecoration: 'line-through',
                    textDecorationColor: 'var(--muted)',
                  }}
                >
                  {change.diff.from}
                </span>
                <Icon name="arrowRight" size={12} />
                <span style={{ color: 'var(--text)' }}>{change.diff.to}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <a
                href={change.refUrl}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1 rounded-[3px] border"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--muted)',
                }}
              >
                <Icon name="externalLink" size={11} />
                BOE · {change.ref}
              </a>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="font-mono text-[11px] px-2 py-1 rounded-[3px]"
                style={{ color: 'var(--muted)' }}
              >
                {open ? '— ocultar contexto' : '+ contexto técnico'}
              </button>
            </div>

            {open && (
              <div
                className="mt-2 pt-3 border-t text-[12.5px] grid grid-cols-3 gap-3 font-mono"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--muted)',
                }}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] mb-0.5">
                    ámbito
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>
                    Estatal · CCAA opt-in
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] mb-0.5">
                    vigencia
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>desde 1 jul 2026</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] mb-0.5">
                    deroga
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>
                    {change.kind === 'BUFF' ? 'RD 853/2021 art. 9' : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
