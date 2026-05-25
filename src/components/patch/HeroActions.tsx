import { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface Props {
  version: string;
}

export default function HeroActions({ version }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`parche.es/${version}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="mt-7 flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => setSubscribed((s) => !s)}
        className="inline-flex items-center gap-2 px-3.5 h-9 rounded-md text-[12.5px] font-medium transition-colors hero-cta"
        data-on={subscribed ? '1' : '0'}
      >
        <Icon name={subscribed ? 'check' : 'bell'} size={13} />
        {subscribed ? 'Suscrito a parches' : 'Suscribirse a parches'}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3.5 h-9 rounded-md text-[12.5px] border"
        style={{
          borderColor: 'var(--border-strong)',
          color: 'var(--text-2)',
        }}
      >
        <Icon name={copied ? 'check' : 'share'} size={13} />
        {copied ? 'Enlace copiado' : 'Compartir'}
      </button>
      <a
        href="#changelog"
        className="hidden md:inline-flex items-center gap-2 px-3.5 h-9 rounded-md text-[12.5px]"
        style={{ color: 'var(--muted)' }}
      >
        <Icon name="scroll" size={13} /> Ver changelog completo
      </a>
      <style>{`
        .hero-cta[data-on='0'] { background: var(--accent); border: 1px solid var(--accent); }
        :root:not([data-theme='light']) .hero-cta[data-on='0'] { color: #0B0D10; }
        :root[data-theme='light'] .hero-cta[data-on='0'] { color: #FFFFFF; }
        .hero-cta[data-on='1'] {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border-strong);
        }
      `}</style>
    </div>
  );
}
