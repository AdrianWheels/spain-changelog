# Handoff — Spain Changelog (parche.es)

Pega el bloque de "Prompt para nueva sesión" como primer mensaje en una ventana nueva. Todo el contexto necesario está dentro.

---

## Prompt para nueva sesión

> Estoy continuando el proyecto **spain-changelog** en `D:\Proyectos\spain-changelog`. Es una web tipo "patch notes de videojuego" que reformatea el BOE (Boletín Oficial del Estado) para audiencia joven. Stack ya decidido: Astro 5 + React 18 + Tailwind v4 + InsForge (Postgres BaaS) + pipeline Python que llama a `claude -p` CLI. NO usar el SDK de Anthropic — el usuario tiene una memoria explícita que prefiere shellear al CLI.
>
> **Estado actual:**
>
> - **V0 frontend completo y verificado visualmente** por el usuario. Componentes Astro + islas React `.tsx` con dark/light toggle, fade-in KPIs, hover prev/next, etc. Datos hardcodeados en `src/data/seed-2026.18.ts`. Ruta funcionando: `/parches/2026.18`.
> - **Pipeline `ingest/` escrito pero con bug**: `ingest/boe_client.py` falla al parsear el sumario BOE con `xml.etree.ElementTree.ParseError: mismatched tag: line 22, column 4`. El parser asume una estructura XML que no coincide con la real. Hay que investigar el formato real del sumario de `https://www.boe.es/diario_boe/xml.php?id=BOE-S-YYYYMMDD` (puede que la URL haya cambiado, o que el XML contenga HTML inline en títulos que rompe el parser estricto, o que el endpoint devuelva HTML cuando no hay sumario). Mira la API de datos abiertos del BOE: https://www.boe.es/datosabiertos/.
> - **InsForge NO linkeado todavía**. El usuario me dará el `.env` cuando ejecute `npx @insforge/cli link --project-id 8b6f4ec1-6a95-4b55-ac51-2893a644cf5c`.
>
> **Tareas pendientes en orden:**
>
> 1. Arreglar el ParseError del BOE en `ingest/boe_client.py`. Verifica la URL real (puede que sea `boe.es/datosabiertos/api/...` ahora) y el formato. Después ejecuta `python -m ingest.run --list` y luego `python -m ingest.run` para procesar una norma real. Coste estimado del pipeline completo: ~$0.80/norma.
> 2. Cuando el usuario te pase las credenciales InsForge: crear `db/schema.sql` con las tablas del plan (patches, changes, kpis, impact_rows, dev_notes, reversibility, tldr_items, subscriptions), `src/lib/insforge.ts` cliente singleton, y `scripts/seed.ts` que toma `out/<id>.patch.json` del pipeline y hace UPSERT a todas las tablas. Usa el skill `insforge-cli` para schema/migraciones y el skill `insforge` para el cliente SDK.
> 3. Adaptar `src/pages/parches/[version].astro` para que `getStaticPaths` lea de InsForge en build time. Verificar visualmente.
>
> **Decisiones ya tomadas (NO re-debatir):**
>
> - Stack: Astro 5 + React 18 + Tailwind v4 + InsForge. No Next.js, no Supabase, no drop literal del bundle Claude Design.
> - LLM via `claude -p --output-format json` (CLI, no SDK). Wrapper en `ingest/llm.py`. Modelos: Sonnet 4.6 para extracción/síntesis, Haiku 4.5 para clasificación, Opus 4.7 para revisión.
> - Pipeline 4 stages con prompts en `ingest/prompts/stage{1..4}_*.md`. Reglas críticas: `evidence_quote` literal obligatorio por cambio, polaridad conservadora (AJUSTE por defecto), neutralidad política absoluta.
> - Tweaks panel del bundle original descartado en producción — sustituido por un `ThemeToggle.tsx` simple.
> - El panel admin de revisión humana es V1 (no urgente). El user revisa el JSON `out/<id>.patch.json` a mano antes de seed por ahora.
> - El usuario prefiere respuestas en español, concisas, sin Co-Authored-By en commits, sin emojis.
>
> **Archivos clave (D:\\Proyectos\\spain-changelog\\):**
>
> ```
> astro.config.mjs
> package.json                          # npm install ya ejecutado
> src/pages/parches/[version].astro     # ruta dinámica frontend
> src/data/seed-2026.18.ts              # datos hardcodeados temporales
> src/lib/types.ts                      # tipo Patch que el pipeline debe respetar
> ingest/boe_client.py                  # ★ aquí está el bug del parser
> ingest/llm.py                         # wrapper claude CLI (no tocar)
> ingest/pipeline.py                    # 4 stages orchestrator
> ingest/prompts/*.md                   # 4 prompts editables
> ingest/run.py                         # entrypoint CLI
> ingest/README.md                      # docs del módulo
> HANDOFF.md                            # este documento
> ```
>
> **El plan completo está en:** `C:\\Users\\drila\\.claude\\plans\\fetch-this-design-file-reactive-harp.md`
>
> Empieza arreglando el ParseError del BOE. Lánzame `python -m ingest.run --list` cuando creas que está fix.

---

## Notas para la nueva sesión

- El usuario salió de Auto Mode antes del handoff. Si vuelves a tener el bug del clasificador (`temporarily unavailable` para `python`/`npm`/`claude`), pídele que confirme con `/config` que sigue fuera de Auto Mode, o que active `bypassPermissions`.
- El error `xml.etree.ElementTree.ParseError: mismatched tag: line 22, column 4` se reproduce con `python -m ingest.run --list`. El traceback original termina en `boe_client.py:88` → `ET.fromstring(raw)`. Probablemente el endpoint devolvió HTML, no XML, o el XML tiene entidades HTML embebidas.
- Para inspeccionar manualmente lo que devuelve el BOE: `curl -A "spain-changelog-ingest/0.1" "https://www.boe.es/diario_boe/xml.php?id=BOE-S-20260523" | head -50` (ajustar fecha al sábado más reciente).
