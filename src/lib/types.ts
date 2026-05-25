export type ChangeKind =
  | 'NUEVO'
  | 'BUFF'
  | 'NERF'
  | 'AJUSTE'
  | 'ELIMINADO'
  | 'BUG FIX';

export type Branch = 'Estado' | 'CCAA' | 'Diputacion' | 'Municipio';

export interface Change {
  kind: ChangeKind;
  cat: string;
  icon: string;
  title: string;
  body: string;
  diff?: { from: string; to: string };
  ref: string;
  refUrl: string;
}

export interface Kpi {
  name: string;
  baseline: number;
  current: number | null;
  target: number;
  unit: string;
  year: string;
  source: string;
  sourceUrl: string;
  spark: number[];
}

export interface ImpactRow {
  who: string;
  n: string;
  cost: string;
}

export interface DevNotes {
  quote: string;
  attribution: string;
}

export interface Reversibility {
  annualCost: string;
  revertCost: 'BAJO' | 'MEDIO' | 'ALTO';
  revertNote: string;
  review: string;
  consolidatedRights: string[];
}

export interface TldrItem {
  emoji: string;
  text: string;
}

export interface PatchNavCard {
  v: string;
  title: string;
  date: string;
  branch: Branch;
  tags: string[];
  changes: number;
}

export interface Patch {
  version: string;
  title: string;
  norm: string;
  publishedBoe: string;
  inForce: string;
  branch: Branch;
  boeUrl: string;
  tldr: TldrItem[];
  changes: Change[];
  devNotes: DevNotes;
  kpis: Kpi[];
  winners: ImpactRow[];
  losers: ImpactRow[];
  reversibility: Reversibility;
  discussion: { count: number };
  nav: { prev: PatchNavCard; next: PatchNavCard };
}
