/**
 * Seed de InsForge desde objetos Patch.
 *
 * Fuente: out/*.patch.json (salida del pipeline de ingesta sobre BOE real).
 *
 * Idempotente por `version`: borra el parche existente (CASCADE limpia hijos)
 * y reinserta. Ejecutar: `npm run seed`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// --- cargar .env en process.env antes de tocar el cliente -------------------
const ENV_PATH = join(process.cwd(), '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

import { db } from '../src/lib/insforge';
import type { Patch } from '../src/lib/types';

const VALID_BRANCHES = ['Estado', 'CCAA', 'Diputacion', 'Municipio'];
const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
  jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
};

/** Acepta ISO 'YYYY-MM-DD' o español '28 abr 2026' → ISO o null. */
function parseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (iso) return iso[1];
  const esp = /(\d{1,2})\s+([a-záéíóú]{3,})\.?\s+(\d{4})/i.exec(s);
  if (esp) {
    const mm = MESES[esp[2].slice(0, 3).toLowerCase()];
    if (mm) return `${esp[3]}-${mm}-${esp[1].padStart(2, '0')}`;
  }
  return null;
}

function boeId(p: any): string | null {
  if (p._source?.norm_id) return p._source.norm_id;
  const m = /id=(BOE-A-[\w-]+)/.exec(p.boeUrl ?? '');
  return m ? m[1] : null;
}

async function seedPatch(p: Patch & Record<string, any>): Promise<void> {
  const client = db();
  const version = p.version;

  // Idempotencia: borrar existente (CASCADE elimina hijos)
  const existing = await client.database.from('patches').select('id').eq('version', version).maybeSingle();
  if (existing.error) throw new Error(`select patches ${version}: ${existing.error.message}`);
  if (existing.data) {
    const del = await client.database.from('patches').delete().eq('id', (existing.data as any).id);
    if (del.error) throw new Error(`delete patches ${version}: ${del.error.message}`);
  }

  // Normalizar rama
  let branch = p.branch as string;
  let branch_region: string | null = null;
  if (!VALID_BRANCHES.includes(branch)) {
    branch_region = branch;
    branch = 'CCAA';
  }

  // Insertar fila raíz
  const ins = await client.database
    .from('patches')
    .insert([
      {
        version,
        title: p.title,
        norm: p.norm,
        branch,
        branch_region,
        published_boe: parseDate(p.publishedBoe),
        in_force: parseDate(p.inForce),
        boe_url: p.boeUrl ?? null,
        boe_id: boeId(p),
        status: 'published',
        published_at: new Date().toISOString(),
      },
    ])
    .select();
  if (ins.error) throw new Error(`insert patches ${version}: ${ins.error.message}`);
  const patchId = (ins.data as any[])[0].id;

  // Hijos
  const tldr = p.tldr.map((t, i) => ({ patch_id: patchId, ord: i, emoji: t.emoji, text: t.text }));
  const changes = p.changes.map((ch, i) => ({
    patch_id: patchId, ord: i, kind: ch.kind, category: ch.cat, icon: ch.icon,
    title: ch.title, body: ch.body,
    diff_from: ch.diff?.from ?? null, diff_to: ch.diff?.to ?? null,
    ref: ch.ref || null, ref_url: ch.refUrl || null,
  }));
  const kpis = p.kpis.map((k, i) => ({
    patch_id: patchId, ord: i, name: k.name, baseline: k.baseline,
    current_val: k.current, target: k.target ?? null, unit: k.unit,
    year_range: k.year, source: k.source, source_url: k.sourceUrl || null,
    source_key: null, spark: k.spark,
  }));
  const impact = [
    ...p.winners.map((r, i) => ({ patch_id: patchId, kind: 'win', ord: i, who: r.who, n: r.n || null, cost: r.cost || null })),
    ...p.losers.map((r, i) => ({ patch_id: patchId, kind: 'lose', ord: i, who: r.who, n: r.n || null, cost: r.cost || null })),
  ];

  for (const [table, rows] of [['tldr_items', tldr], ['changes', changes], ['kpis', kpis], ['impact_rows', impact]] as const) {
    if (rows.length === 0) continue;
    const r = await client.database.from(table).insert(rows as any[]);
    if (r.error) throw new Error(`insert ${table} ${version}: ${r.error.message}`);
  }

  const dn = await client.database.from('dev_notes').insert([
    { patch_id: patchId, quote: p.devNotes.quote ?? '', attribution: p.devNotes.attribution ?? '' },
  ]);
  if (dn.error) throw new Error(`insert dev_notes ${version}: ${dn.error.message}`);

  const rev = p.reversibility;
  const rv = await client.database.from('reversibility').insert([
    {
      patch_id: patchId, annual_cost: rev.annualCost ?? 'No estimado', revert_cost: rev.revertCost ?? 'MEDIO',
      revert_note: rev.revertNote ?? null, review_clause: rev.review ?? null,
      consolidated_rights: rev.consolidatedRights ?? [],
    },
  ]);
  if (rv.error) throw new Error(`insert reversibility ${version}: ${rv.error.message}`);

  console.log(`  ✓ ${version} — ${p.changes.length} cambios, ${p.kpis.length} KPIs, rama ${branch}${branch_region ? `/${branch_region}` : ''}`);
}

async function main() {
  const sources: (Patch & Record<string, any>)[] = [];

  // Solo normas REALES del pipeline. La maqueta seed-2026.18 (ficticia) ya no
  // se siembra: este producto solo muestra BOE real.
  const outDir = join(process.cwd(), 'out');
  if (existsSync(outDir)) {
    for (const f of readdirSync(outDir).filter((f) => f.endsWith('.patch.json'))) {
      sources.push(JSON.parse(readFileSync(join(outDir, f), 'utf8')));
    }
  }

  console.log(`[seed] ${sources.length} parche(s) a sembrar`);
  for (const p of sources) await seedPatch(p);
  console.log('[seed] hecho.');
}

main().catch((e) => {
  console.error('[seed] ERROR:', e.message);
  process.exit(1);
});
