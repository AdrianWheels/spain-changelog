import { useEffect, useState } from 'react';
import Icon from './Icon';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'parche-theme';

function readInitial(): Theme {
  if (typeof document === 'undefined') return 'dark';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-md border transition-colors"
      style={{ borderColor: 'var(--border-strong)', color: 'var(--text-2)' }}
      aria-label="Cambiar tema"
    >
      <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={11} />
      {theme}
    </button>
  );
}
