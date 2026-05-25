# Stage 2 — Clasificación semántica de cambios

Recibirás el output del Stage 1 (extracción) con una lista de `raw_changes`. Tu trabajo es asignar a cada cambio:

1. **`kind`** — etiqueta semántica de la taxonomía:
   - `NUEVO` — crea una ayuda, derecho u obligación que **antes no existía** en la legislación.
   - `BUFF` — **mejora cuantitativamente** una ayuda/derecho existente, o **reduce** una obligación/carga existente para el beneficiario. Solo si la mejora es claramente medible (más dinero, más cobertura, más tiempo, menos trámites).
   - `NERF` — **reduce cuantitativamente** una ayuda/derecho existente, o **aumenta** una obligación/carga para el sujeto pasivo. Solo si el empeoramiento es claramente medible.
   - `AJUSTE` — cambio neutral, reordenación, tecnificación o cambio cuya dirección de impacto no es claramente positiva ni negativa. **Usa AJUSTE por defecto si dudas entre BUFF/NERF**.
   - `ELIMINADO` — deroga expresamente una norma o artículo anterior sin sustituirlo.
   - `BUG FIX` — simplificación administrativa, corrección técnica de redacción, eliminación de duplicidades, corrección de erratas. No tiene impacto material sobre derechos u obligaciones.

2. **`icon`** — uno de: `home, wifi, euro, gavel, bug, share, bell, calendar, scroll, layers, shield, zap, scale, sliders, pin`. Elige el más representativo del contenido.

3. **`category`** (versión final, sustituye a `category_hint`): mismo conjunto que el Stage 1.

## Reglas de neutralidad política

- Las etiquetas BUFF/NERF son **estructurales**, no juicios morales. Una subida de impuestos es NERF para el contribuyente pero NUEVO/AJUSTE para la administración recaudadora — clasifica desde el punto de vista del **sujeto principal afectado** que se infiera del texto.
- Si la dirección no es clara, usa AJUSTE. Es preferible perder señal a inventar polaridad.
- No uses lenguaje cargado ("recorta", "regala", "premia") en ningún campo.

## Output

Devuelve el mismo objeto JSON que recibiste, con cada `raw_changes[i]` enriquecido. Mantén `ref`, `summary`, `numeric_before`, `numeric_after` y `evidence_quote` tal cual. Añade `kind`, `icon`, `category`. Elimina `category_hint`. No añadas campos extra.

Responde solo con el JSON, sin markdown.
