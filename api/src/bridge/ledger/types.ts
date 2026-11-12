import { z } from "zod";
import { bridgeSettingsSchema } from "./settings";

// One row of the sync_ledger table (docs/bridge/SPEC.md, Stage 2). Not a
// vendor type: Salesforce/ERPNext ids are carried as plain strings here,
// same as everywhere outside the adapter folders.
export const syncLedgerStatusSchema = z.enum(["pending", "needs_review", "succeeded", "failed"]);
export type SyncLedgerStatus = z.infer<typeof syncLedgerStatusSchema>;

export const syncLedgerEntrySchema = z.object({
  id: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().nullable(),
  status: syncLedgerStatusSchema,
  payloadHash: z.string().min(1),
  bridgeSettings: bridgeSettingsSchema,
  attempts: z.number().int().min(0),
  lastError: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SyncLedgerEntry = z.infer<typeof syncLedgerEntrySchema>;
