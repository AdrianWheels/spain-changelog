"""Entry point del pipeline de ingesta.

Uso:
    # Sumario más reciente disponible, escoger automáticamente la norma "más jugosa"
    python -m ingest.run

    # Listar las normas del último sumario sin procesar LLM (dry-run)
    python -m ingest.run --list

    # Procesar una norma específica
    python -m ingest.run --id BOE-A-2026-7234

    # Solo fetch + texto (sin LLM), útil para inspeccionar
    python -m ingest.run --id BOE-A-2026-7234 --no-llm

Salida:
    out/<BOE-A-id>.stage{1..4}.json   - intermedios
    out/<BOE-A-id>.patch.json          - listo para seed a InsForge
"""
from __future__ import annotations

import argparse
import json
import sys

from .boe_client import fetch_norma, find_latest_sumario, pick_juiciest
from .config import OUTPUT_DIR
from .llm import log_step
from .pipeline import run_full


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Ingesta BOE → patch JSON")
    p.add_argument("--id", help="BOE-A-YYYY-NNNN específico (omitir = autopicker)")
    p.add_argument("--list", action="store_true", help="Solo listar sumario, no procesar")
    p.add_argument("--no-llm", action="store_true", help="Fetch + texto, sin LLM")
    p.add_argument("--max-offset", type=int, default=7, help="Días hacia atrás a buscar")
    args = p.parse_args(argv)

    # Si el usuario pidió listado, mostramos sumario del más reciente y salimos
    if args.list and not args.id:
        date, normas = find_latest_sumario(max_offset=args.max_offset)
        log_step(f"sumario {date.isoformat()} — {len(normas)} normas sección I")
        for n in normas:
            mark = " *" if n.looks_substantive else "  "
            print(f"{mark} {n.norm_id}  [{n.norm_type:24}]  {n.title[:120]}")
        return 0

    # Elegir norma
    if args.id:
        norm_id = args.id
        log_step(f"norma fija: {norm_id}")
    else:
        date, normas = find_latest_sumario(max_offset=args.max_offset)
        log_step(f"sumario {date.isoformat()} — {len(normas)} normas")
        pick = pick_juiciest(normas)
        if pick is None:
            log_step("Ninguna norma 'jugosa' en el sumario. Use --list o --id.")
            return 2
        norm_id = pick.norm_id
        log_step(f"escogida: {norm_id} [{pick.norm_type}] — {pick.title[:120]}")

    # Fetch full
    norma = fetch_norma(norm_id)
    log_step(f"texto: {len(norma.text)} chars")

    if args.no_llm:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out = OUTPUT_DIR / f"{norm_id}.text.txt"
        out.write_text(norma.text, encoding="utf-8")
        log_step(f"texto plano → {out}")
        return 0

    # Run pipeline
    patch = run_full(norma)
    log_step(f"warnings: {patch.get('_review', {}).get('warnings', [])}")
    log_step(f"confidence: {patch.get('_review', {}).get('confidence')}")
    log_step(f"blocking: {patch.get('_review', {}).get('blocking')}")
    print(json.dumps({"norm_id": norm_id, "version": patch.get("version")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
