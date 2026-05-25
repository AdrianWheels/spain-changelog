import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { Kpi } from '@/lib/types';

interface Props {
  kpi: Kpi;
  delay: number;
  blockPad: string;
  showSpark: boolean;
}

const fmt = (n: number, unit: string) =>
  `${n.toFixed(n < 10 && n % 1 !== 0 ? 1 : 0)}${unit}`;

function Sparkline({ data }: { data: number[] }) {
  const width = 72;
  const height = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.0001, max - min);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressBar({
  baseline,
  current,
  target,
  unit,
  show,
}: {
  baseline: number;
  current: number | null;
  target: number;
  unit: string;
  show: boolean;
}) {
  if (!show) return null;
  const goingUp = target >= baseline;
  const total = Math.abs(target - baseline);
  const progressed = current != null ? Math.abs(current - baseline) : 0;
  const pct = total === 0 ? 0 : Math.min(100, Math.max(0, (progressed / total) * 100));

  return (
    <div className="mt-3">
      <div
        className="relative h-[6px] rounded-full overflow-hidden"
        style={{ background: 'var(--track)' }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-700"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
        <div
          className="absolute inset-y-[-3px] right-0 w-[2px]"
          style={{ background: 'var(--text)' }}
        />
      </div>
      <div
        className="flex justify-between mt-1.5 font-mono text-[10.5px]"
        style={{ color: 'var(--muted)' }}
      >
        <span>{fmt(baseline, unit)}</span>
        {current != null && (
          <span style={{ color: 'var(--text)' }} className="inline-flex items-center gap-1">
            <Icon name={goingUp ? 'trendingUp' : 'trendingDown'} size={11} />
            {fmt(current, unit)}
          </span>
        )}
        <span>{fmt(target, unit)}</span>
      </div>
    </div>
  );
}

export default function KpiCard({ kpi, delay, blockPad, showSpark }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 80 + delay);
    return () => clearTimeout(id);
  }, [delay]);

  const pctOfTarget =
    kpi.current != null
      ? Math.round(((kpi.current - kpi.baseline) / (kpi.target - kpi.baseline)) * 100)
      : null;

  return (
    <div
      className={`rounded-md border ${blockPad} transition-all duration-500`}
      style={{
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h4
          className="text-[13.5px] font-medium leading-snug"
          style={{ textWrap: 'pretty' }}
        >
          {kpi.name}
        </h4>
        <Sparkline data={kpi.spark} />
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--muted)' }}
          >
            baseline
          </div>
          <div
            className="font-mono text-[18px] leading-none mt-1"
            style={{ color: 'var(--text-2)' }}
          >
            {fmt(kpi.baseline, kpi.unit)}
          </div>
        </div>
        <Icon name="arrowRight" size={14} className="mb-1" />
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--muted)' }}
          >
            target {kpi.year.split('→')[1]?.trim() ?? ''}
          </div>
          <div
            className="font-mono text-[18px] leading-none mt-1"
            style={{ color: 'var(--accent)' }}
          >
            {fmt(kpi.target, kpi.unit)}
          </div>
        </div>
        {kpi.current != null && (
          <div className="ml-auto text-right">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: 'var(--muted)' }}
            >
              actual
            </div>
            <div
              className="font-mono text-[14px] mt-1"
              style={{ color: 'var(--text)' }}
            >
              {fmt(kpi.current, kpi.unit)}
              <span className="ml-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                · {pctOfTarget}%
              </span>
            </div>
          </div>
        )}
      </div>
      <ProgressBar
        baseline={kpi.baseline}
        current={kpi.current}
        target={kpi.target}
        unit={kpi.unit}
        show={showSpark}
      />
      <div
        className="mt-3 flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <a
          href={kpi.sourceUrl}
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px]"
          style={{ color: 'var(--muted)' }}
        >
          <Icon name="externalLink" size={10} /> {kpi.source}
        </a>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--muted)' }}>
          {kpi.year}
        </span>
      </div>
    </div>
  );
}
