-- Stage 2 (docs/bridge/SPEC.md): the sync ledger. One row per Idempotency-Key
-- (Stage 3 adds the header; this stage builds the table and repository it
-- writes to). docs/bridge/MAPPING_DRAFT.md, "Database normalisation": the
-- ledger stores IDs that point to records, not copies of customer data; the
-- payload hash is a deliberate exception, kept as audit evidence.

-- A plain serial (int4), not bigserial: node-postgres returns int8/bigint
-- columns as strings (since not every bigint fits in a JS number), which
-- would force every caller to deal with a string id. A billion-plus-row
-- ledger is not this prototype's problem.
CREATE TABLE sync_ledger (
  id serial PRIMARY KEY,
  idempotency_key text NOT NULL,
  source_id text NOT NULL,
  target_id text,
  status text NOT NULL CHECK (status IN ('pending', 'needs_review', 'succeeded', 'failed')),
  payload_hash text NOT NULL,
  -- Snapshot of the bridge settings in effect when this entry was written
  -- (MAPPING_DRAFT.md, "Bridge settings"), so changing a setting later never
  -- rewrites history.
  bridge_settings jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_ledger_idempotency_key_key UNIQUE (idempotency_key)
);

CREATE INDEX sync_ledger_source_id_idx ON sync_ledger (source_id);
CREATE INDEX sync_ledger_status_idx ON sync_ledger (status);
