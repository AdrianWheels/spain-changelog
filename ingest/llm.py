"""Wrapper alrededor del CLI `claude -p`.

El usuario tiene una memoria explícita prefiriendo el CLI sobre el SDK
Anthropic. Aquí encapsulamos la invocación para que el resto del pipeline
solo dependa de `claude_json(prompt, model)`.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass

from .config import CLAUDE_TIMEOUT_SEC


# Bloque de código markdown ```json ... ``` (o ``` ... ```) en cualquier
# posición del texto. El modelo a veces antepone un preámbulo en prosa.
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


def _extract_json_text(text: str) -> str:
    """Aísla el JSON del texto del modelo, tolerando preámbulo/epílogo en prosa
    y vallas markdown (estén o no al principio)."""
    text = text.strip()
    # 1. Bloque cercado ```json ... ``` en cualquier parte.
    m = _FENCE_RE.search(text)
    if m:
        return m.group(1).strip()
    # 2. Ya es JSON puro.
    if text.startswith(("{", "[")):
        return text
    # 3. Prosa alrededor: recortar del primer { (o [) al último } (o ]).
    starts = [i for i in (text.find("{"), text.find("[")) if i != -1]
    ends = [i for i in (text.rfind("}"), text.rfind("]")) if i != -1]
    if starts and ends:
        start, end = min(starts), max(ends)
        if end > start:
            return text[start:end + 1]
    return text


@dataclass
class LLMResponse:
    text: str
    model: str
    cost_usd: float | None
    duration_ms: int | None
    raw: dict


class LLMError(RuntimeError):
    pass


def claude_call(prompt: str, model: str, system: str | None = None) -> LLMResponse:
    """Invoca `claude -p --output-format json --model <model>` con el prompt por stdin.

    Devuelve el texto crudo del asistente (no parsea JSON aquí — el caller decide)."""
    cmd = ["claude", "-p", "--output-format", "json", "--model", model]
    if system:
        cmd.extend(["--append-system-prompt", system])

    t0 = time.monotonic()
    try:
        proc = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=CLAUDE_TIMEOUT_SEC,
            check=False,
        )
    except FileNotFoundError as e:
        raise LLMError(
            "claude CLI no encontrado en PATH. Instala Claude Code o ajusta PATH."
        ) from e
    except subprocess.TimeoutExpired as e:
        raise LLMError(f"claude CLI timeout ({CLAUDE_TIMEOUT_SEC}s)") from e

    duration_ms = int((time.monotonic() - t0) * 1000)

    if proc.returncode != 0:
        raise LLMError(
            f"claude CLI exit {proc.returncode}:\n"
            f"stderr: {proc.stderr[:2000]}\n"
            f"stdout: {proc.stdout[:1000]}"
        )

    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise LLMError(
            f"claude CLI no devolvió JSON parseable: {proc.stdout[:500]!r}"
        ) from e

    text = payload.get("result") or payload.get("response") or ""
    if not text:
        raise LLMError(f"Respuesta vacía de claude. Payload: {payload}")

    return LLMResponse(
        text=text,
        model=model,
        cost_usd=payload.get("total_cost_usd"),
        duration_ms=duration_ms,
        raw=payload,
    )


def claude_json(prompt: str, model: str, system: str | None = None) -> dict:
    """Como claude_call pero parsea el resultado como JSON.

    El prompt DEBE pedir explícitamente "responde solo con JSON sin markdown".
    Si la respuesta viene envuelta en ```json ... ```, lo destripa.
    """
    resp = claude_call(prompt, model=model, system=system)
    text = _extract_json_text(resp.text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        snippet = text[:1500]
        raise LLMError(
            f"El modelo no devolvió JSON válido (modelo={model}).\n"
            f"Error: {e}\n"
            f"Inicio del output:\n{snippet}"
        ) from e

    # Conservar metadata
    if isinstance(data, dict):
        data.setdefault("_meta", {})
        data["_meta"]["model"] = resp.model
        data["_meta"]["cost_usd"] = resp.cost_usd
        data["_meta"]["duration_ms"] = resp.duration_ms

    return data


def log_step(msg: str) -> None:
    print(f"[ingest] {msg}", file=sys.stderr, flush=True)
