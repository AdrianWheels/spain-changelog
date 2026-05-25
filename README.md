# spain-changelog · parche.es

El **BOE leído como un changelog de videojuego**. Toma normas reales del Boletín
Oficial del Estado y las reformatea como "patch notes" (NUEVO / BUFF / NERF /
AJUSTE / ELIMINADO / BUG FIX) para una audiencia de 18-35 años: resumen plano,
cambios estructurados, KPIs medibles, impacto distributivo y reversibilidad.

Datos abiertos, sin filiación política.

## Stack

- **Frontend**: Astro 5 + islas React 18 + Tailwind v4 (SSG, render en build time).
- **DB**: InsForge (Postgres BaaS). Modelo normalizado (`patches` + tablas hijas).
- **Ingesta**: Python 3.11 sobre la API de datos abiertos del BOE.
- **LLM**: pipeline de 4 stages vía `claude -p` CLI (Sonnet extracción/síntesis,
  Haiku clasificación, Opus revisión). Sin SDK de Anthropic.

## Estructura

```
ingest/            Pipeline BOE → patch JSON (Python)
  boe_client.py    Cliente API datos abiertos del BOE
  pipeline.py      4 stages: extracción → clasificación → síntesis → revisión
  prompts/         Prompts editables por stage
  run.py           Entrypoint: python -m ingest.run
migrations/        Schema InsForge (versionado)
scripts/seed.ts    Siembra out/*.patch.json en InsForge (idempotente)
src/               App Astro
  lib/patches.ts   Reconstruye el Patch desde la DB (lectura en build)
  pages/parches/[version].astro
```

## Desarrollo

```bash
npm install
cp .env.example .env          # rellenar con credenciales InsForge (server-only)

# Generar un parche desde el BOE
python -m ingest.run --list   # ver normas del último sumario
python -m ingest.run          # procesar la más sustancial (~$0.80 en LLM)

npm run seed                  # subir out/*.patch.json a InsForge
npm run dev                   # http://localhost:4321
```

## Estado

V0.5: frontend + DB + pipeline funcionando end-to-end. Pendiente: endpoint de
suscripción, panel de revisión humana (V1), adapters de KPIs reales (V1.5).

> ⚠️ Verificación humana obligatoria antes de publicar: el LLM puede equivocarse
> en cifras o clasificaciones. Revisar `out/<id>.patch.json` antes del seed.
