export const ICONS: Record<string, string> = {
  home: 'M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z',
  wifi: 'M5 12.55a11 11 0 0 1 14 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01',
  euro: 'M4 10h12 M4 14h9 M19 6.41A7.5 7.5 0 1 0 19 17.59',
  gavel: 'm14 13-7.5 7.5a2.121 2.121 0 0 1-3-3L11 10 M16 16l6-6 M8 8l6-6 M9 7l8 8 M21 11l-8-8',
  bug: 'M8 2v2 M16 2v2 M9 9a3 3 0 0 1 6 0v1H9V9Z M5 10h14 M12 10v12 M5 14a7 7 0 0 0 14 0v-2H5v2Z M3 17h2 M19 17h2 M3 21l3-3 M21 21l-3-3',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
  arrowUpRight: 'M7 17 17 7 M7 7h10v10',
  chevDown: 'm6 9 6 6 6-6',
  chevRight: 'm9 18 6-6-6-6',
  check: 'm5 12 5 5L20 7',
  x: 'M18 6 6 18 M6 6l12 12',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
  externalLink:
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14 21 3',
  trendingUp: 'm3 17 6-6 4 4 8-8 M14 7h7v7',
  trendingDown: 'm3 7 6 6 4-4 8 8 M14 17h7v-7',
  calendar: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
  scroll:
    'M8 21h12a2 2 0 0 0 2-2v-2h-10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4 M19 17V5a2 2 0 0 0-2-2H4',
  layers: 'm12 2 9 5-9 5-9-5 9-5z M3 17l9 5 9-5 M3 12l9 5 9-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  dot: 'M12 12h.01',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  pin: 'M12 21v-7 M9 7a3 3 0 0 1 6 0c0 3 3 4 3 7H6c0-3 3-4 3-7Z',
  scale: 'm16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z m-14 0 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z M7 21h10 M12 3v18 M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z',
  sun: 'M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
};

export const TAG_STYLES: Record<
  string,
  { bg: string; fg: string; dot: string }
> = {
  NUEVO: { bg: 'rgba(56,139,253,.12)', fg: '#7DB7FF', dot: '#3B82F6' },
  BUFF: { bg: 'rgba(46,160,67,.12)', fg: '#7CE38B', dot: '#22A148' },
  NERF: { bg: 'rgba(248,81,73,.12)', fg: '#FF8A82', dot: '#E5484D' },
  AJUSTE: { bg: 'rgba(210,153,34,.14)', fg: '#E3B341', dot: '#D29922' },
  ELIMINADO: { bg: 'rgba(140,149,159,.14)', fg: '#9BA3AC', dot: '#8C959F' },
  'BUG FIX': { bg: 'rgba(163,113,247,.14)', fg: '#C8A4FF', dot: '#A371F7' },
};

export type IconName = keyof typeof ICONS;
