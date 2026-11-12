import type { Pool } from "pg";
import type { BridgeSettings } from "./settings";
import { hashPayload } from "./hash";
import { syncLedgerEntrySchema, type SyncLedgerEntry, type SyncLedgerStatus } from "./types";

// Shape of a raw sync_ledger row as pg returns it (snake_case columns;
// bridge_settings comes back already parsed from jsonb).
interface SyncLedgerRow {
  id: number;
  idempotency_key: string;
  source_id: string;
  target_id: string | null;
  status: string;
  payload_hash: string;
  bridge_settings: unknown;
  attempts: number;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntry(row: SyncLedgerRow): SyncLedgerEntry {
  return syncLedgerEntrySchema.parse({
    id: row.id,
    idempotencyKey: row.idempotency_key,
    sourceId: row.source_id,
    targetId: row.target_id,
    status: row.status,
    payloadHash: row.payload_hash,
    bridgeSettings: row.bridge_settings,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export type RecordSyncResult =
  | { outcome: "created"; entry: SyncLedgerEntry }
  | { outcome: "duplicate"; entry: SyncLedgerEntry }
  | { outcome: "conflict"; existing: SyncLedgerEntry; message: string };

export interface RecordSyncParams {
  idempotencyKey: string;
  sourceId: string;
  payload: unknown;
  bridgeSettings: BridgeSettings;
  initialStatus?: SyncLedgerStatus;
}

// Stage 2 (docs/bridge/SPEC.md): writes and reads sync_ledger rows. No
// business logic about what to do with a deal lives here -- that is Stage
// 3 (the inbound API) and Stage 4 (the ERPNext worker).
export class SyncLedgerRepository {
  constructor(private readonly pool: Pool) {}

  // Same key + same payload -> the existing row, untouched ("duplicate").
  // Same key + different payload -> "conflict", nothing written. A brand
  // new key -> "created". The INSERT ... ON CONFLICT DO NOTHING is atomic
  // at the database level, so concurrent callers racing with the exact
  // same key can never create two rows or crash -- only one insert wins,
  // every other caller falls through to the SELECT below and reports the
  // same outcome a sequential call would have reported.
  async recordSync(params: RecordSyncParams): Promise<RecordSyncResult> {
    const payloadHash = hashPayload(params.payload);
    const status = params.initialStatus ?? "pending";

    const inserted = await this.pool.query<SyncLedgerRow>(
      `INSERT INTO sync_ledger (idempotency_key, source_id, status, payload_hash, bridge_settings)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [params.idempotencyKey, params.sourceId, status, payloadHash, JSON.stringify(params.bridgeSettings)],
    );
    if (inserted.rows.length > 0) {
      return { outcome: "created", entry: toEntry(inserted.rows[0]) };
    }

    const existingResult = await this.pool.query<SyncLedgerRow>(
      "SELECT * FROM sync_ledger WHERE idempotency_key = $1",
      [params.idempotencyKey],
    );
    if (existingResult.rows.length === 0) {
      throw new Error(`Idempotency key "${params.idempotencyKey}" conflicted on insert but no row was found`);
    }
    const existing = toEntry(existingResult.rows[0]);

    if (existing.payloadHash === payloadHash) {
      return { outcome: "duplicate", entry: existing };
    }
    return {
      outcome: "conflict",
      existing,
      message: `Idempotency key "${params.idempotencyKey}" was already used with a different payload`,
    };
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<SyncLedgerEntry | null> {
    const result = await this.pool.query<SyncLedgerRow>(
      "SELECT * FROM sync_ledger WHERE idempotency_key = $1",
      [idempotencyKey],
    );
    return result.rows.length > 0 ? toEntry(result.rows[0]) : null;
  }

  // Stage 4 (the ERPNext worker) is the real caller of this; Stage 2 only
  // needs the ledger to support every status, including NEEDS_REVIEW
  // (docs/bridge/MAPPING_DRAFT.md, Decision 4's lookalike-match park).
  async updateStatus(
    id: number,
    status: SyncLedgerStatus,
    details: { targetId?: string; lastError?: string } = {},
  ): Promise<SyncLedgerEntry> {
    const result = await this.pool.query<SyncLedgerRow>(
      `UPDATE sync_ledger
       SET status = $2,
           target_id = COALESCE($3, target_id),
           last_error = $4,
           attempts = attempts + 1,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status, details.targetId ?? null, details.lastError ?? null],
    );
    if (result.rows.length === 0) throw new Error(`No sync_ledger entry with id ${id}`);
    return toEntry(result.rows[0]);
  }
}
