"""Configuración del pipeline de ingesta BOE → LLM → Patch."""
from __future__ import annotations
from pathlib import Path

# Directorio raíz del módulo de ingesta
INGEST_DIR = Path(__file__).resolve().parent
PROJECT_DIR = INGEST_DIR.parent
OUTPUT_DIR = PROJECT_DIR / "out"
CACHE_DIR = PROJECT_DIR / ".boe-cache"

# BOE
# El antiguo endpoint diario_boe/xml.php?id=BOE-S-... fue retirado: ahora
# redirige (302) a una página de error HTML. El sumario vive en la API de
# datos abiertos, que exige cabecera Accept: application/xml.
# La norma individual (BOE-A-...) sí sigue sirviéndose por xml.php.
BOE_BASE_URL = "https://www.boe.es"
BOE_SUMARIO_URL = BOE_BASE_URL + "/datosabiertos/api/boe/sumario/{date}"
BOE_NORMA_XML_URL = BOE_BASE_URL + "/diario_boe/xml.php?id={norm_id}"
BOE_NORMA_HTML_URL = BOE_BASE_URL + "/buscar/act.php?id={norm_id}"

# Modelos por stage. El usuario tiene memoria de usar claude CLI;
# si un modelo no está disponible, ajustar aquí.
MODELS = {
    "stage1_extraction": "claude-sonnet-4-6",
    "stage2_classification": "claude-haiku-4-5-20251001",
    "stage3_synthesis": "claude-sonnet-4-6",
    "stage4_review": "claude-opus-4-7",
}

# Tipos de norma a considerar (sección I del BOE - Disposiciones generales)
RELEVANT_NORM_TYPES = (
    "Real Decreto-ley",
    "Real Decreto",
    "Ley",
    "Ley Orgánica",
    "Real Decreto Legislativo",
)

# Anti-spam: tipos a descartar siempre
IRRELEVANT_KEYWORDS = (
    "nombramiento",
    "cese",
    "conmemorativa",
    "beca",
    "premio nacional",
    "indulto",
)

# Tamaño máximo de texto a enviar al LLM (en caracteres aprox)
# 4 chars ≈ 1 token. 200k chars ≈ 50k tokens es razonable.
MAX_NORMA_CHARS = 200_000

# Timeout por llamada al CLI claude
CLAUDE_TIMEOUT_SEC = 600
