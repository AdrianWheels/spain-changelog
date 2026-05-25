-- Parche España — schema inicial (V0.5)
-- Modelo normalizado: una fila en `patches` + filas hijas en las demás tablas.
-- El pipeline produce un objeto Patch (camelCase, shape del frontend); scripts/seed.ts
-- lo explota en estas tablas.

-- Tipos enumerados
CREATE TYPE patch_branch AS ENUM ('Estado', 'CCAA', 'Diputacion', 'Municipio');
CREATE TYPE change_kind AS ENUM ('NUEVO', 'BUFF', 'NERF', 'AJUSTE', 'ELIMINADO', 'BUG FIX');
CREATE TYPE impact_kind AS ENUM ('win', 'lose');
CREATE TYPE revert_cost AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- Tabla raíz
CREATE TABLE patches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version       text UNIQUE NOT NULL,          -- '2026.18'
  title         text NOT NULL,
  norm          text NOT NULL,                 -- 'Real Decreto-ley 4/2026'
  branch        patch_branch NOT NULL,
  branch_region text,                          -- 'Andalucía' si CCAA, NULL si Estado
  published_boe date NOT NULL,
  in_force      date,
  boe_url       text,
  boe_id        text UNIQUE,                   -- 'BOE-A-2026-7234' (ingesta idempotente)
  status        text DEFAULT 'draft',          -- draft | review | published
  created_at    timestamptz DEFAULT now(),
  published_at  timestamptz
);

CREATE TABLE tldr_items (
  patch_id uuid REFERENCES patches(id) ON DELETE CASCADE,
  ord      int NOT NULL,
  emoji    text NOT NULL,
  text     text NOT NULL,
  PRIMARY KEY (patch_id, ord)
);

CREATE TABLE changes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id  uuid REFERENCES patches(id) ON DELETE CASCADE,
  ord       int NOT NULL,
  kind      change_kind NOT NULL,
  category  text NOT NULL,                     -- 'Vivienda', 'Fiscalidad', ...
  icon      text NOT NULL,                     -- key de ICONS dict
  title     text NOT NULL,
  body      text NOT NULL,
  diff_from text,                              -- nullable
  diff_to   text,                              -- nullable
  ref       text,                              -- 'Art. 12'
  ref_url   text
);

CREATE TABLE dev_notes (
  patch_id    uuid PRIMARY KEY REFERENCES patches(id) ON DELETE CASCADE,
  quote       text NOT NULL,
  attribution text NOT NULL
);

CREATE TABLE kpis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id    uuid REFERENCES patches(id) ON DELETE CASCADE,
  ord         int NOT NULL,
  name        text NOT NULL,
  baseline    numeric NOT NULL,
  current_val numeric,                         -- NULL si aún no medido
  target      numeric,                         -- NULL si no hay objetivo cuantitativo
  unit        text NOT NULL,                   -- '%', 'M', 'k/año'
  year_range  text NOT NULL,                   -- '2025 → 2028'
  source      text NOT NULL,                   -- 'INE · Padrón'
  source_url  text,
  source_key  text,                            -- handle para adapter V1.5: 'INE:2855:3.1'
  spark       jsonb NOT NULL                   -- [4.92, 4.89, ...]
);

CREATE TABLE impact_rows (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id uuid REFERENCES patches(id) ON DELETE CASCADE,
  kind     impact_kind NOT NULL,
  ord      int NOT NULL,
  who      text NOT NULL,
  n        text,                               -- '~85.000' (texto por las aproximaciones)
  cost     text
);

CREATE TABLE reversibility (
  patch_id             uuid PRIMARY KEY REFERENCES patches(id) ON DELETE CASCADE,
  annual_cost          text NOT NULL,          -- '340 M€ / año'
  revert_cost          revert_cost NOT NULL,
  revert_note          text,
  review_clause        text,
  consolidated_rights  jsonb DEFAULT '[]'      -- array de strings
);

CREATE TABLE subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  branch      patch_branch,                    -- NULL = todas
  region      text,
  created_at  timestamptz DEFAULT now(),
  confirmed   boolean DEFAULT false,
  UNIQUE (email, branch, region)
);

-- Índices clave
CREATE INDEX idx_patches_published     ON patches (published_boe DESC);
CREATE INDEX idx_patches_branch_pub    ON patches (branch, published_boe DESC);
CREATE INDEX idx_changes_patch_ord     ON changes (patch_id, ord);
CREATE INDEX idx_kpis_patch_ord        ON kpis (patch_id, ord);
CREATE INDEX idx_impact_patch_kind_ord ON impact_rows (patch_id, kind, ord);
