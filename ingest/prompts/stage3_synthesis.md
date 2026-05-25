# Stage 3 — Síntesis editorial del parche

Recibirás el objeto del Stage 2 (cambios ya clasificados). Tienes que producir la "vista editorial" del parche: lo que un usuario joven (18-35) verá en la página de detalle de `parche.es`.

## Lo más importante: reescribir cada cambio (no lo dejes en jerga jurídica)

Recibes `raw_changes` con un `summary` neutro-jurídico y una `evidence_quote` literal. Esos textos **NO se muestran tal cual** al usuario: son demasiado técnicos. Para **cada** elemento de `raw_changes`, **añade dos campos nuevos** reescribiendo el cambio para una persona de 18-35 años sin formación jurídica:

- **`display_title`**: titular corto y claro, **3-8 palabras**, lenguaje cotidiano. Sin comillas legales, sin "rúbrica", "disposición", "en su virtud", sin nombres de artículos. Debe entenderse de un vistazo.
  - Malo: *"Se modifica la rúbrica de la Sección 2ª, que pasa a denominarse «Régimen de establecimientos y locales»"*
  - Bueno: *"Conciertos pequeños sin permiso previo"*
- **`display_body`**: **1-2 frases (20-45 palabras)** explicando en plano **qué cambia y qué significa en la práctica** para la gente. Nada de citar el articulado literal ni reproducir la redacción legal; tradúcela. Concreta el efecto real (quién puede hacer qué ahora, qué deja de hacer falta, qué límite aplica).
  - Malo: *"Se añade un artículo 8 bis que somete al régimen de declaración responsable los espectáculos de escasa incidencia."*
  - Bueno: *"Los bares y locales pequeños ya no necesitan pedir autorización para organizar actuaciones en directo: basta con avisar al Ayuntamiento 48 horas antes."*

Conserva intactos el resto de campos del cambio (`ref`, `kind`, `icon`, `category`, `evidence_quote`, `numeric_before`, `numeric_after`): la cita literal sigue siendo el respaldo de verdad, solo que no es lo que se muestra de primeras.

## Campos a producir

1. **`version`**: usa el patrón `YYYY.WW` donde WW es la semana ISO de `published_date`. Ejemplo: si la norma se publicó el 28 de abril de 2026 (semana ISO 18), version = `"2026.18"`.

2. **`title_short`**: 4-8 palabras que capturen el tema dominante. Sin partidismos. Ejemplos buenos: "Vivienda joven y rehabilitación rural", "Receta electrónica interterritorial", "Reforma fiscal autónomos". Ejemplos malos: "El Gobierno regala 250€", "Recortes en X".

3. **`tldr`** (3-5 bullets): cada bullet es `{emoji, text}`. El emoji es semántico, no decorativo (🏠 vivienda, 📡 telecom, 🎓 formación, ⚖️ derecho, 💰 fiscal, 🏥 sanidad, 🚌 transporte, ⚡ energía, 🛡️ seguridad, 🌿 medio ambiente). El texto: una frase de 15-30 palabras, lenguaje plano, sin tecnicismos cuando se pueda evitar.

4. **`dev_notes`** (paraphrase de la exposición de motivos):
   - `quote`: 60-120 palabras parafraseando los argumentos del proponente sin citarlos textualmente. Tono neutral, primera persona del organismo proponente está permitida.
   - `attribution`: el organismo proponente exacto (ej. "Ministerio para la Transición Ecológica y Reto Demográfico").

5. **`winners`** (1-4 grupos beneficiados estimados): cada uno `{who, n, cost}`.
   - `who`: descripción del grupo en 4-10 palabras.
   - `n`: estimación cuantitativa con tilde (`~85.000`) o `null` si no puedes inferirla del texto.
   - `cost`: beneficio típico por individuo, o `null` si no aplica.

6. **`losers`** (0-4 grupos perjudicados estimados): mismo formato. Es legítimo dejar lista vacía si no hay perjuicios claros — no inventes.

7. **`kpis`** (2-4 métricas que medirían el éxito): cada KPI:
   - `name`: nombre humano de la métrica (10-15 palabras).
   - `baseline`: valor actual estimado. Si no lo conoces, escribe `null` y pon `source: "PENDIENTE"`.
   - `target`: valor objetivo razonable.
   - `unit`: `%`, `M`, `k/año`, `años`, etc.
   - `year_range`: `"2025 → 2028"` o similar.
   - `source`: institución que publicaría el dato (`"INE"`, `"AEAT"`, `"MITMA"`, `"Eurostat"`, etc.) — la fuente real, no inventes.
   - `source_url`: `null` salvo que el texto la cite explícitamente.
   - `source_key`: `null` (lo rellenará un humano).
   - `spark`: array de 8 valores plausibles que ilustren la tendencia reciente (lo refinará un humano).

8. **`reversibility`**:
   - `annual_cost`: estimación textual del coste anual (`"~340 M€ / año"`). Si no hay forma de estimar, escribe `"No estimado en el texto"`.
   - `revert_cost`: `"BAJO"` | `"MEDIO"` | `"ALTO"`. Criterio:
     - BAJO si el cambio es solo procedimental o presupuestario anual.
     - MEDIO si genera derechos a un colectivo durante 12-36 meses.
     - ALTO si genera derechos consolidados indefinidos o crea infraestructura.
   - `revert_note`: 15-30 palabras explicando el coste.
   - `review_clause`: si el texto contiene cláusula de revisión obligatoria, captúrala. Si no, `null`.
   - `consolidated_rights`: lista de strings con los derechos que genera (0-5 ítems).

## Reglas globales

- **Neutralidad política absoluta**. No insinúes que la norma es buena o mala. Solo describe.
- **Nada de hipérboles** ("histórico", "ambicioso", "revolucionario").
- **Idioma**: español de España, sin anglicismos innecesarios.
- **No inventes números**. Si no hay base, escribe `null` y deja que un humano lo complete.

## Output

Objeto JSON que combine:
- Todo lo que ya tenías del Stage 2 (norm_id, branch, raw_changes con kind/icon/category, etc.), **con `display_title` y `display_body` añadidos a cada raw_change**.
- Los campos nuevos que acabo de listar.

Sin markdown, sin comentarios.
