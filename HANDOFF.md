# Handoff — Spain Changelog (parche.es)

Estado del proyecto al **2026-05-25**. Pega "Prompt para nueva sesión" como primer mensaje si retomas en una ventana nueva.

---

## Qué es

Web tipo "patch notes de videojuego" que reformatea el BOE para audiencia joven (18-35). Pipeline Python ingiere una norma real del BOE → 4 stages de LLM (vía `claude -p` CLI) → objeto `Patch` → InsForge (Postgres) → Astro lo renderiza en build time.

**En producción en Vercel.** Repo: https://github.com/AdrianWheels/spain-changelog (rama `main`).

---

## Estado actual (V0.5 completo y desplegado)

- **Pipeline ingesta**: funcional end-to-end. `ingest/` descarga el sumario y la norma, corre 4 stages y escribe `out/<id>.patch.json`.
- **InsForge**: proyecto "Parche spain" **ya linkeado** (`.insforge/project.json`, gitignoreado). Schema aplicado vía `migrations/` (8 tablas normalizadas + 4 enums + índices).
- **Frontend**: `index.astro` ("/") y `parches/[version].astro` leen de InsForge en build time (`src/lib/patches.ts` → `getAllPatches`). Reconstruye el `Patch` desde las tablas, formatea fechas y calcula nav prev/next por fecha.
- **Síntesis amigable**: el stage3 reescribe cada cambio a lenguaje plano (`display_title`/`display_body`); la cita legal queda como `evidence_quote` de respaldo.
- **2 parches reales en producción**:
  - `2026.21` — RD 400/2026, "Cine a 2€ para mayores de 65".
  - `2026.22` — Ley asturiana 2/2026, "Pequeños directos sin autorización previa".

---

## Flujo de trabajo (cómo sacar y publicar un parche)

```bash
python -m ingest.run --list            # ver normas del último sumario
python -m ingest.run                   # autopicker (la más sustancial), ~$0.80 LLM
python -m ingest.run --id BOE-A-2026-NNNNN   # norma concreta
# revisar a mano out/<id>.patch.json
npm run seed                           # sube TODOS los out/*.patch.json a InsForge (idempotente por version)
npm run build                          # verifica el build local (lee de InsForge)
git add -A && git commit && git push   # Vercel reconstruye y lee la DB → despliega
```

> El despliegue lee la DB en build time. Por eso hay que **sembrar antes de pushear** para que el rebuild de Vercel incluya el parche nuevo.

---

## Despliegue (Vercel)

- Build estático Astro (`output` por defecto = static).
- **Requiere env vars en Vercel** (ya configuradas): `INSFORGE_URL` y `INSFORGE_API_KEY`. Sin ellas el build falla en `getStaticPaths` con "Faltan INSFORGE_URL / INSFORGE_API_KEY" (fue la causa del primer fallo de deploy).
- En local, esas mismas variables viven en `.env` (gitignoreado). `.env.example` documenta el formato.

---

## Decisiones tomadas (no re-debatir)

- Stack: Astro 5 + React 18 + Tailwind v4 + InsForge. No Next.js, no Supabase.
- LLM vía `claude -p --output-format json` (CLI, no SDK Anthropic). Modelos: Sonnet 4.6 extracción/síntesis, Haiku 4.5 clasificación, Opus 4.7 revisión.
- Pipeline 4 stages con prompts en `ingest/prompts/stage{1..4}_*.md`. Reglas: `evidence_quote` literal por cambio, polaridad conservadora (AJUSTE por defecto), neutralidad política.
- Cliente InsForge **server-only** con la admin api_key (toda la lectura es en build time; cero llamadas desde el navegador). Por eso no hay RLS todavía.
- La maqueta ficticia `seed-2026.18` fue **eliminada**: la DB solo contiene BOE real.
- Español, conciso, sin Co-Authored-By en commits, sin emojis.

---

## Próximos pasos (pendientes reales)

1. **Panel admin de revisión (V1)** — el LLM autoflagea warnings (KPIs especulativos, paráfrasis en dev_notes). Hoy la revisión es manual sobre el JSON antes del seed. Falta UI para aprobar/editar y marcar `status='published'`.
2. **Endpoint `/api/subscribe`** (V0.5 paso 8) — insertar en la tabla `subscriptions` (ya existe).
3. **Adapters de KPIs reales (V1.5)** — INE/AEAT vía `source_key`; hoy los KPIs son proyecciones del LLM sin baseline.
4. **Migrar de admin key a anon key + RLS** — si en el futuro hay lecturas desde el cliente (no solo build), montar RLS y usar la anon key en vez de la admin.

## Caveats conocidos

- Warning de hidratación de React en `HeroActions.tsx` (un `<style>` inline con mismatch server/cliente). **Pre-existente del V0**, no afecta a los datos; la página se recupera. Pendiente de limpiar.
- El pipeline puede equivocarse en cifras/clasificaciones (ej. un renombrado de sección salió como `BUG FIX` en vez de `AJUSTE`). **Revisión humana obligatoria** antes de tratar un parche como verdad publicada.

---

## Archivos clave

```
ingest/boe_client.py      # cliente API datos abiertos BOE (sumario + norma)
ingest/pipeline.py        # 4 stages + to_app_shape (Patch del frontend)
ingest/llm.py             # wrapper claude CLI + extracción robusta de JSON
ingest/prompts/*.md       # prompts editables
ingest/run.py             # entrypoint
migrations/*.sql          # schema InsForge
scripts/seed.ts           # out/*.patch.json → InsForge (npm run seed)
src/lib/insforge.ts       # cliente singleton server-only
src/lib/patches.ts        # reconstruye Patch desde DB + nav
src/lib/types.ts          # tipo Patch (contrato frontend)
src/pages/index.astro     # "/" lista parches desde DB
src/pages/parches/[version].astro   # detalle, getStaticPaths desde DB
```

El plan original completo: `C:\Users\drila\.claude\plans\fetch-this-design-file-reactive-harp.md`.
