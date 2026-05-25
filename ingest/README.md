# `ingest/` — pipeline BOE → LLM → Patch JSON

Toma una norma del BOE, la pasa por 4 stages contra el CLI `claude`, y produce un JSON con la forma del tipo `Patch` del frontend.

## Requisitos

- Python 3.11+ (stdlib únicamente, sin dependencias externas).
- `claude` CLI instalado en PATH y autenticado (ver Claude Code).

## Comandos

```powershell
# Sumario más reciente, elige norma automáticamente y procesa
python -m ingest.run

# Solo listar normas del último sumario disponible
python -m ingest.run --list

# Procesar una norma concreta
python -m ingest.run --id BOE-A-2026-7234

# Fetch + texto sin LLM (para inspección)
python -m ingest.run --id BOE-A-2026-7234 --no-llm
```

## Salida

- `out/<id>.stage1.json` — extracción estructurada con `evidence_quote` por cambio.
- `out/<id>.stage2.json` — cambios clasificados (NUEVO/BUFF/NERF/AJUSTE/ELIMINADO/BUG FIX).
- `out/<id>.stage3.json` — síntesis editorial (TL;DR, dev_notes, KPIs, winners/losers).
- `out/<id>.stage4.json` — revisión con `confidence` + `warnings`.
- `out/<id>.patch.json` — JSON final en forma `Patch`, listo para seed.

## Modelos por stage

| Stage | Modelo por defecto | Coste estimado |
|---|---|---|
| 1 extracción | `claude-sonnet-4-6` | ~$0.30 por norma de 50k tokens |
| 2 clasificación | `claude-haiku-4-5` | ~$0.02 |
| 3 síntesis | `claude-sonnet-4-6` | ~$0.20 |
| 4 revisión | `claude-opus-4-7` | ~$0.30 |
| **Total** | | **~$0.80 / norma** |

Ajustar en `ingest/config.py`.

## Reglas críticas del pipeline (codificadas en los prompts)

- **Cada cambio requiere `evidence_quote` literal** del texto fuente. Si falta, se descarta.
- **Cifras numéricas** solo se rellenan si `evidence_quote` las contiene explícitamente.
- **Polaridad conservadora**: usar AJUSTE por defecto si BUFF/NERF no es claramente medible.
- **Neutralidad política absoluta**: lenguaje sin carga ideológica en todos los campos.
- **Stage 4 marca `blocking: true`** si detecta alucinación, error numérico o lenguaje cargado — en ese caso el seed a DB debería bloquearse hasta revisión humana.

## Cache

Las descargas del BOE se cachean en `.boe-cache/` (ignorado por git). Sumario: TTL 24h. Normas individuales: TTL 30 días (inmutables).
