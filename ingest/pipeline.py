"""Pipeline 4-stages: BOE text → Patch JSON.

Stages:
1. Extracción estructurada de cambios (Sonnet)
2. Clasificación BUFF/NERF/NUEVO/... (Haiku, más barato)
3. Síntesis editorial (TL;DR, dev_notes, KPIs, winners/losers) (Sonnet)
4. Auto-revisión con confidence + warnings (Opus)
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .boe_client import NormaFull
from .config import INGEST_DIR, MAX_NORMA_CHARS, MODELS
from .llm import claude_json, log_step


PROMPTS_DIR = INGEST_DIR / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8")


def _truncate(text: str, max_chars: int = MAX_NORMA_CHARS) -> str:
    if len(text) <= max_chars:
        return text
    head = text[: max_chars // 2]
    tail = text[-max_chars // 2:]
    return f"{head}\n\n[…texto truncado…]\n\n{tail}"


def stage1_extract(norma: NormaFull) -> dict[str, Any]:
    """Extracción estructurada con evidence quotes."""
    log_step(f"stage1: extracción → modelo {MODELS['stage1_extraction']}")
    system = _load_prompt("stage1_extraction.md")
    text = _truncate(norma.text)
    prompt = (
        f"## NORMA\n\n"
        f"- norm_id: {norma.ref.norm_id}\n"
        f"- norm_type: {norma.ref.norm_type}\n"
        f"- title: {norma.ref.title}\n"
        f"- published_date: {norma.ref.published_date}\n"
        f"- departamento: {norma.ref.departamento}\n\n"
        f"## TEXTO COMPLETO\n\n{text}\n\n"
        f"## INSTRUCCIONES\n\n"
        f"Procesa la norma según las reglas del sistema. Devuelve solo el JSON.\n"
    )
    return claude_json(prompt, model=MODELS["stage1_extraction"], system=system)


def stage2_classify(stage1_out: dict[str, Any]) -> dict[str, Any]:
    """Asigna kind/icon/category a cada cambio."""
    log_step(f"stage2: clasificación → modelo {MODELS['stage2_classification']}")
    system = _load_prompt("stage2_classification.md")
    payload = {k: v for k, v in stage1_out.items() if k != "_meta"}
    prompt = (
        f"## OBJETO STAGE 1\n\n"
        f"```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```\n\n"
        f"## INSTRUCCIONES\n\n"
        f"Enriquece cada raw_changes con kind, icon y category según las reglas. "
        f"Devuelve el objeto completo en JSON.\n"
    )
    return claude_json(prompt, model=MODELS["stage2_classification"], system=system)


def stage3_synthesize(stage2_out: dict[str, Any]) -> dict[str, Any]:
    """Genera tldr, dev_notes, winners/losers, kpis, reversibility."""
    log_step(f"stage3: síntesis → modelo {MODELS['stage3_synthesis']}")
    system = _load_prompt("stage3_synthesis.md")
    payload = {k: v for k, v in stage2_out.items() if k != "_meta"}
    prompt = (
        f"## OBJETO STAGE 2\n\n"
        f"```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```\n\n"
        f"## INSTRUCCIONES\n\n"
        f"Produce la vista editorial del parche. Devuelve un objeto JSON completo.\n"
    )
    return claude_json(prompt, model=MODELS["stage3_synthesis"], system=system)


def stage4_review(stage3_out: dict[str, Any], source_excerpt: str = "") -> dict[str, Any]:
    """Revisa el patch propuesto, marca confidence y warnings."""
    log_step(f"stage4: revisión → modelo {MODELS['stage4_review']}")
    system = _load_prompt("stage4_review.md")
    payload = {k: v for k, v in stage3_out.items() if k != "_meta"}
    excerpt = source_excerpt[:30_000] if source_excerpt else ""
    prompt = (
        f"## PATCH PROPUESTO\n\n"
        f"```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```\n\n"
        f"## EXTRACTO TEXTO FUENTE (primeras ~30k chars)\n\n{excerpt}\n\n"
        f"## INSTRUCCIONES\n\nDevuelve el objeto de revisión.\n"
    )
    return claude_json(prompt, model=MODELS["stage4_review"], system=system)


def to_app_shape(stage3: dict[str, Any], stage4: dict[str, Any]) -> dict[str, Any]:
    """Convierte el JSON del pipeline a la forma del tipo `Patch` del frontend.

    Adapta nombres de campos snake_case → camelCase y mapea raw_changes → changes.
    """
    patch = stage4.get("patch") or stage3

    # Cambios al shape del frontend
    changes_out = []
    for c in patch.get("raw_changes", []):
        diff = None
        if c.get("numeric_before") and c.get("numeric_after"):
            diff = {"from": c["numeric_before"], "to": c["numeric_after"]}
        elif c.get("numeric_after") and not c.get("numeric_before"):
            diff = {"from": "—", "to": c["numeric_after"]}
        # display_title/display_body los produce el stage3 reescribiendo en
        # lenguaje plano; el summary jurídico queda solo como fallback.
        title = c.get("display_title") or c.get("summary", "")[:80]
        body = c.get("display_body") or c.get("summary", "")
        changes_out.append(
            {
                "kind": c.get("kind", "AJUSTE"),
                "cat": c.get("category", "Otra"),
                "icon": c.get("icon", "scroll"),
                "title": title,
                "body": body,
                "diff": diff,
                "ref": c.get("ref", ""),
                "refUrl": "#",
            }
        )

    kpis_out = []
    for k in patch.get("kpis", []) or []:
        kpis_out.append(
            {
                "name": k.get("name", ""),
                "baseline": k.get("baseline") if k.get("baseline") is not None else 0,
                "current": k.get("current"),
                "target": k.get("target", 0),
                "unit": k.get("unit", ""),
                "year": k.get("year_range", ""),
                "source": k.get("source", "PENDIENTE"),
                "sourceUrl": k.get("source_url") or "#",
                "spark": k.get("spark") or [0, 0, 0, 0, 0, 0, 0, 0],
            }
        )

    rev = patch.get("reversibility", {}) or {}
    dev_notes = patch.get("dev_notes", {}) or {}
    tldr_out = patch.get("tldr", []) or []
    winners = patch.get("winners", []) or []
    losers = patch.get("losers", []) or []

    out = {
        "version": patch.get("version", ""),
        "title": patch.get("title_short") or patch.get("title", "")[:80],
        "norm": patch.get("norm_type", "") + (
            f" {patch.get('norm_number', '')}" if patch.get("norm_number") else ""
        ),
        "publishedBoe": patch.get("published_date", ""),
        "inForce": patch.get("in_force_date") or patch.get("published_date", ""),
        "branch": patch.get("branch", "Estado"),
        "boeUrl": f"https://www.boe.es/buscar/act.php?id={patch.get('norm_id', '')}",
        "tldr": [{"emoji": t.get("emoji", "•"), "text": t.get("text", "")} for t in tldr_out],
        "changes": changes_out,
        "devNotes": {
            "quote": dev_notes.get("quote", ""),
            "attribution": dev_notes.get("attribution", ""),
        },
        "kpis": kpis_out,
        "winners": [
            {"who": w.get("who", ""), "n": w.get("n") or "—", "cost": w.get("cost") or "—"}
            for w in winners
        ],
        "losers": [
            {"who": l.get("who", ""), "n": l.get("n") or "—", "cost": l.get("cost") or "—"}
            for l in losers
        ],
        "reversibility": {
            "annualCost": rev.get("annual_cost", "No estimado"),
            "revertCost": rev.get("revert_cost", "MEDIO"),
            "revertNote": rev.get("revert_note", ""),
            "review": rev.get("review_clause") or "",
            "consolidatedRights": rev.get("consolidated_rights", []) or [],
        },
        "discussion": {"count": 0},
        "nav": {
            "prev": {"v": "—", "title": "—", "date": "—", "branch": "Estado", "tags": [], "changes": 0},
            "next": {"v": "—", "title": "—", "date": "—", "branch": "Estado", "tags": [], "changes": 0},
        },
        "_review": {
            "confidence": stage4.get("confidence"),
            "warnings": stage4.get("warnings", []),
            "blocking": stage4.get("blocking", False),
        },
        "_source": {
            "norm_id": patch.get("norm_id", ""),
            "boe_url": f"https://www.boe.es/diario_boe/xml.php?id={patch.get('norm_id', '')}",
        },
    }
    return out


def run_full(norma: NormaFull, save_intermediate: bool = True) -> dict[str, Any]:
    """Ejecuta los 4 stages y produce el patch en forma `Patch` del frontend."""
    from .config import OUTPUT_DIR

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = norma.ref.norm_id.replace("/", "-")

    s1 = stage1_extract(norma)
    if save_intermediate:
        (OUTPUT_DIR / f"{stem}.stage1.json").write_text(
            json.dumps(s1, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    s2 = stage2_classify(s1)
    if save_intermediate:
        (OUTPUT_DIR / f"{stem}.stage2.json").write_text(
            json.dumps(s2, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    s3 = stage3_synthesize(s2)
    if save_intermediate:
        (OUTPUT_DIR / f"{stem}.stage3.json").write_text(
            json.dumps(s3, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    s4 = stage4_review(s3, source_excerpt=norma.text[:30_000])
    if save_intermediate:
        (OUTPUT_DIR / f"{stem}.stage4.json").write_text(
            json.dumps(s4, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    app_shape = to_app_shape(s3, s4)
    final_path = OUTPUT_DIR / f"{stem}.patch.json"
    final_path.write_text(
        json.dumps(app_shape, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log_step(f"patch final → {final_path}")
    return app_shape
