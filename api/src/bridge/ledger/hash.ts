import { createHash } from "node:crypto";

// A fingerprint of exactly what was sent (docs/bridge/MAPPING_DRAFT.md,
// "Database normalisation" -- the one deliberate exception to "store IDs,
// not copies"), used to tell a retried request apart from a genuine
// idempotency-key conflict. Keys are sorted recursively so the same payload
// always hashes the same way regardless of property insertion order.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
}
