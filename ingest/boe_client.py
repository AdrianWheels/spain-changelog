"""Cliente del Boletín Oficial del Estado.

El BOE expone:
- Sumario diario: https://www.boe.es/diario_boe/xml.php?id=BOE-S-YYYYMMDD
- Norma individual XML: https://www.boe.es/diario_boe/xml.php?id=BOE-A-YYYY-NNNN

XML público, sin auth, sin rate limit declarado. Cacheamos en disco para no
machacar el servidor durante iteración.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from .config import (
    BOE_NORMA_XML_URL,
    BOE_SUMARIO_URL,
    CACHE_DIR,
    IRRELEVANT_KEYWORDS,
    RELEVANT_NORM_TYPES,
)


USER_AGENT = "spain-changelog-ingest/0.1 (contact: dev@parche.es)"


@dataclass
class NormaRef:
    norm_id: str          # BOE-A-2026-XXXX
    norm_type: str        # 'Real Decreto-ley'
    title: str
    section: str          # 'I', 'II', etc.
    departamento: str
    pdf_url: str | None
    xml_url: str
    published_date: str   # 'YYYY-MM-DD'

    @property
    def looks_substantive(self) -> bool:
        """Filtro heurístico para descartar nombramientos, becas, etc."""
        if self.norm_type not in RELEVANT_NORM_TYPES:
            return False
        low = self.title.lower()
        return not any(kw in low for kw in IRRELEVANT_KEYWORDS)


@dataclass
class NormaFull:
    ref: NormaRef
    text: str             # texto plano de la norma
    raw_xml: str          # XML completo, por si se necesita


def _fetch(url: str, ttl_sec: int = 6 * 3600, accept: str | None = None) -> bytes:
    """HTTP GET con caché en disco (TTL 6h por defecto).

    `accept`: cabecera Accept. La API de datos abiertos del BOE devuelve
    HTTP 400 ("No soportado ningún mime type") si no se especifica.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
    cache = CACHE_DIR / f"{key}.bin"
    if cache.exists():
        age = dt.datetime.now().timestamp() - cache.stat().st_mtime
        if age < ttl_sec:
            return cache.read_bytes()

    headers = {"User-Agent": USER_AGENT}
    if accept:
        headers["Accept"] = accept
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
    cache.write_bytes(body)
    return body


def fetch_sumario(date: dt.date) -> list[NormaRef]:
    """Devuelve las normas de la sección I (Disposiciones generales) del día.
    Si no hay sumario (festivo/domingo), lanza FileNotFoundError."""
    yyyymmdd = date.strftime("%Y%m%d")
    url = BOE_SUMARIO_URL.format(date=yyyymmdd)
    try:
        raw = _fetch(url, ttl_sec=24 * 3600, accept="application/xml")
    except urllib.error.HTTPError as e:
        # La API de datos abiertos devuelve 404 los días sin BOE (domingos).
        if e.code == 404:
            raise FileNotFoundError(f"Sin sumario para {date.isoformat()}") from e
        raise

    root = ET.fromstring(raw)
    # La API envuelve todo en <response><status><code>...</code></status><data>.
    status_code = root.findtext("status/code", default="")
    if status_code and status_code != "200":
        raise FileNotFoundError(f"Sin sumario para {date.isoformat()} (código {status_code})")

    out: list[NormaRef] = []
    # Estructura: data → sumario → diario → seccion[@codigo='1'] → departamento
    #             → epigrafe → item. El id es el hijo <identificador>, no un atributo;
    #             url_pdf/url_xml ya vienen absolutas.
    for seccion in root.findall(".//seccion"):
        codigo = seccion.get("codigo", "") or seccion.get("num", "")
        # Sección I = "1" (Disposiciones generales)
        if codigo not in ("1", "I"):
            continue
        for departamento in seccion.findall(".//departamento"):
            dep_name = (departamento.get("nombre") or "").strip()
            for item in departamento.findall(".//item"):
                norm_id = (item.findtext("identificador") or "").strip()
                if not norm_id.startswith("BOE-A-"):
                    continue
                titulo_el = item.find("titulo")
                if titulo_el is None or not titulo_el.text:
                    continue
                title = titulo_el.text.strip()
                norm_type = _classify_norm_type(title)
                pdf_el = item.find("url_pdf")
                xml_el = item.find("url_xml")
                pdf_url = pdf_el.text.strip() if pdf_el is not None and pdf_el.text else None
                xml_url = (
                    xml_el.text.strip()
                    if xml_el is not None and xml_el.text
                    else BOE_NORMA_XML_URL.format(norm_id=norm_id)
                )
                out.append(
                    NormaRef(
                        norm_id=norm_id,
                        norm_type=norm_type,
                        title=title,
                        section="I",
                        departamento=dep_name,
                        pdf_url=pdf_url,
                        xml_url=xml_url,
                        published_date=date.isoformat(),
                    )
                )
    return out


def _classify_norm_type(title: str) -> str:
    """Saca 'Real Decreto-ley', 'Real Decreto', 'Ley', etc. del título."""
    low = title.lower()
    if low.startswith("ley orgánica"):
        return "Ley Orgánica"
    if low.startswith("real decreto-ley"):
        return "Real Decreto-ley"
    if low.startswith("real decreto legislativo"):
        return "Real Decreto Legislativo"
    if low.startswith("real decreto"):
        return "Real Decreto"
    if low.startswith("ley "):
        return "Ley"
    return "Otro"


def fetch_norma(norm_id: str) -> NormaFull:
    """Descarga una norma BOE-A-YYYY-NNNN completa."""
    url = BOE_NORMA_XML_URL.format(norm_id=norm_id)
    raw = _fetch(url, ttl_sec=30 * 24 * 3600)  # las normas son inmutables
    root = ET.fromstring(raw)

    metadatos = root.find(".//metadatos")
    titulo_el = metadatos.find("titulo") if metadatos is not None else None
    title = titulo_el.text.strip() if titulo_el is not None and titulo_el.text else norm_id

    departamento_el = metadatos.find("departamento") if metadatos is not None else None
    dep_name = (
        departamento_el.text.strip()
        if departamento_el is not None and departamento_el.text
        else "Sin departamento"
    )

    fecha_el = metadatos.find("fecha_publicacion") if metadatos is not None else None
    fecha_pub = (
        fecha_el.text.strip()
        if fecha_el is not None and fecha_el.text
        else ""
    )
    # BOE da fechas como "YYYYMMDD" en algunos campos
    if len(fecha_pub) == 8 and fecha_pub.isdigit():
        fecha_pub = f"{fecha_pub[:4]}-{fecha_pub[4:6]}-{fecha_pub[6:]}"

    # Texto del documento. OJO: hay varios <texto> en el XML — los del bloque
    # <analisis>/<referencias> son snippets cortos de normas relacionadas. El
    # cuerpo real es el <texto> hijo directo de <documento>, no cualquier
    # descendiente (".//texto" agarraría el primer snippet de referencias).
    texto_el = root.find("texto")
    text = _xml_text(texto_el) if texto_el is not None else ""

    ref = NormaRef(
        norm_id=norm_id,
        norm_type=_classify_norm_type(title),
        title=title,
        section="I",
        departamento=dep_name,
        pdf_url=None,
        xml_url=url,
        published_date=fecha_pub,
    )
    return NormaFull(ref=ref, text=text, raw_xml=raw.decode("utf-8", errors="replace"))


def _xml_text(el: ET.Element) -> str:
    """Extrae todo el texto de un elemento XML preservando saltos de párrafo."""
    parts: list[str] = []
    block_tags = {"p", "parrafo", "articulo", "capitulo", "disposicion"}

    def walk(node: ET.Element) -> None:
        tag = node.tag.lower()
        is_block = tag in block_tags
        if node.text and node.text.strip():
            parts.append(node.text.strip())
        for child in list(node):
            walk(child)
            if child.tail and child.tail.strip():
                parts.append(child.tail.strip())
        if is_block:
            parts.append("\n\n")

    walk(el)
    return " ".join(p for p in parts).replace(" \n\n ", "\n\n").strip()


def find_latest_sumario(max_offset: int = 7) -> tuple[dt.date, list[NormaRef]]:
    """Busca el sumario disponible más reciente, iterando hacia atrás."""
    today = dt.date.today()
    for offset in range(0, max_offset + 1):
        d = today - dt.timedelta(days=offset)
        # BOE no publica domingos
        if d.weekday() == 6:
            continue
        try:
            normas = fetch_sumario(d)
            if normas:
                return d, normas
        except FileNotFoundError:
            continue
    raise RuntimeError(
        f"No se encontró sumario BOE en los últimos {max_offset} días."
    )


def pick_juiciest(normas: list[NormaRef]) -> NormaRef | None:
    """Heurística: prioriza Real Decreto-ley > Ley > Real Decreto.
    Dentro del mismo tipo, prefiere títulos más largos (proxy de contenido)."""
    candidates = [n for n in normas if n.looks_substantive]
    if not candidates:
        return None
    type_rank = {
        "Real Decreto-ley": 0,
        "Ley Orgánica": 1,
        "Ley": 2,
        "Real Decreto Legislativo": 3,
        "Real Decreto": 4,
        "Otro": 99,
    }
    candidates.sort(key=lambda n: (type_rank.get(n.norm_type, 99), -len(n.title)))
    return candidates[0]
