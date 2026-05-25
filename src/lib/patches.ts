import { db } from './insforge';
import type { Branch, Patch, PatchNavCard } from './types';

/**
 * Lee los parches desde InsForge y los reconstruye en el shape `Patch` del
 * frontend (modelo normalizado → objeto anidado). Se ejecuta en build time
 * dentro de getStaticPaths. La navegación prev/next se calcula por fecha.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2026-05-25' → '25 may 2026'. Mantiene el formato del prototipo. */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} ${MESES[parseInt(mo, 10) - 1]} ${y}`;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const PLACEHOLDER_NAV: PatchNavCard = {
  v: '—', title: '—', date: '—', branch: 'Estado', tags: [], changes: 0,
};

async function fetchChildren(patchId: string) {
  const client = db();
  const [tldr, changes, kpis, impact, devNotes, reversibility] = await Promise.all([
    client.database.from('tldr_items').select().eq('patch_id', patchId).order('ord', { ascending: true }),
    client.database.from('changes').select().eq('patch_id', patchId).order('ord', { ascending: true }),
    client.database.from('kpis').select().eq('patch_id', patchId).order('ord', { ascending: true }),
    client.database.from('impact_rows').select().eq('patch_id', patchId).order('ord', { ascending: true }),
    client.database.from('dev_notes').select().eq('patch_id', patchId).maybeSingle(),
    client.database.from('reversibility').select().eq('patch_id', patchId).maybeSingle(),
  ]);
  for (const r of [tldr, changes, kpis, impact, devNotes, reversibility]) {
    if (r.error) throw new Error(`Error leyendo hijos del parche ${patchId}: ${r.error.message ?? r.error}`);
  }
  return {
    tldr: tldr.data ?? [],
    changes: changes.data ?? [],
    kpis: kpis.data ?? [],
    impact: impact.data ?? [],
    devNotes: devNotes.data ?? null,
    reversibility: reversibility.data ?? null,
  };
}

/** Construye el contenido del Patch (todo menos `nav`, que necesita vecinos). */
async function buildContent(row: any): Promise<Patch> {
  const c = await fetchChildren(row.id);

  return {
    version: row.version,
    title: row.title,
    norm: row.norm,
    publishedBoe: fmtDate(row.published_boe),
    inForce: fmtDate(row.in_force ?? row.published_boe),
    branch: row.branch as Branch,
    boeUrl: row.boe_url ?? '#',
    tldr: c.tldr.map((t: any) => ({ emoji: t.emoji, text: t.text })),
    changes: c.changes.map((ch: any) => ({
      kind: ch.kind,
      cat: ch.category,
      icon: ch.icon,
      title: ch.title,
      body: ch.body,
      diff:
        ch.diff_from != null || ch.diff_to != null
          ? { from: ch.diff_from ?? '—', to: ch.diff_to ?? '—' }
          : undefined,
      ref: ch.ref ?? '',
      refUrl: ch.ref_url ?? '#',
    })),
    devNotes: {
      quote: c.devNotes?.quote ?? '',
      attribution: c.devNotes?.attribution ?? '',
    },
    kpis: c.kpis.map((k: any) => ({
      name: k.name,
      baseline: num(k.baseline),
      current: k.current_val == null ? null : num(k.current_val),
      target: k.target == null ? 0 : num(k.target),
      unit: k.unit,
      year: k.year_range,
      source: k.source,
      sourceUrl: k.source_url ?? '#',
      spark: Array.isArray(k.spark) ? k.spark.map((x: any) => (x == null ? 0 : num(x))) : [],
    })),
    winners: c.impact.filter((r: any) => r.kind === 'win').map((r: any) => ({ who: r.who, n: r.n ?? '—', cost: r.cost ?? '—' })),
    losers: c.impact.filter((r: any) => r.kind === 'lose').map((r: any) => ({ who: r.who, n: r.n ?? '—', cost: r.cost ?? '—' })),
    reversibility: {
      annualCost: c.reversibility?.annual_cost ?? 'No estimado',
      revertCost: c.reversibility?.revert_cost ?? 'MEDIO',
      revertNote: c.reversibility?.revert_note ?? '',
      review: c.reversibility?.review_clause ?? '',
      consolidatedRights: c.reversibility?.consolidated_rights ?? [],
    },
    discussion: { count: 0 },
    nav: { prev: PLACEHOLDER_NAV, next: PLACEHOLDER_NAV }, // se rellena en getAllPatches
  };
}

function navCard(p: Patch): PatchNavCard {
  const tags = Array.from(new Set(p.changes.map((c) => c.cat))).slice(0, 3);
  return { v: p.version, title: p.title, date: p.publishedBoe, branch: p.branch, tags, changes: p.changes.length };
}

/**
 * Devuelve todos los parches publicables reconstruidos, con nav prev/next
 * resuelta por orden cronológico (prev = más antiguo, next = más reciente).
 */
export async function getAllPatches(): Promise<Patch[]> {
  const client = db();
  const { data: rows, error } = await client.database
    .from('patches')
    .select()
    .order('published_boe', { ascending: true });
  if (error) throw new Error(`Error leyendo patches: ${error.message ?? error}`);
  if (!rows || rows.length === 0) return [];

  const patches = await Promise.all(rows.map((r: any) => buildContent(r)));

  // Mismo orden que `rows` (asc por fecha). Resolver vecinos.
  patches.forEach((p, i) => {
    p.nav = {
      prev: i > 0 ? navCard(patches[i - 1]) : PLACEHOLDER_NAV,
      next: i < patches.length - 1 ? navCard(patches[i + 1]) : PLACEHOLDER_NAV,
    };
  });

  return patches;
}
