import { z } from "zod";

// The bridge settings a sync ledger entry was written under
// (docs/bridge/MAPPING.md, Decision 5, "Bridge settings"). Stage 2 only
// defines and validates this snapshot so the ledger table can store it;
// reading a customer's own Payment Terms Template and refusing to start if
// BRIDGE_DEFAULT_PAYMENT_TERMS does not exist in ERPNext are Stage 4
// concerns, since there is no ERPNext connection yet.
function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const bridgeSettingsSchema = z.object({
  timezone: z.string().refine(isValidTimeZone, "Must be a valid IANA time zone name"),
  defaultPaymentTerms: z.string().min(1),
  autoSubmit: z.boolean(),
  maxCloseDateAgeDays: z.number().int().min(1),
});
export type BridgeSettings = z.infer<typeof bridgeSettingsSchema>;

const BOOLEAN_VALUES: Record<string, boolean> = { true: true, false: false };

export function loadBridgeSettings(env: NodeJS.ProcessEnv = process.env): BridgeSettings {
  const rawAutoSubmit = env.BRIDGE_AUTO_SUBMIT ?? "false";
  const autoSubmit = BOOLEAN_VALUES[rawAutoSubmit];
  if (autoSubmit === undefined) {
    throw new Error(`Invalid bridge settings: BRIDGE_AUTO_SUBMIT must be "true" or "false" (got "${rawAutoSubmit}")`);
  }

  const rawMaxAge = env.BRIDGE_MAX_CLOSE_DATE_AGE_DAYS ?? "30";
  const maxCloseDateAgeDays = Number(rawMaxAge);

  const parsed = bridgeSettingsSchema.safeParse({
    timezone: env.BRIDGE_TIMEZONE ?? "America/Vancouver",
    defaultPaymentTerms: env.BRIDGE_DEFAULT_PAYMENT_TERMS ?? "Net 30",
    autoSubmit,
    maxCloseDateAgeDays,
  });
  if (!parsed.success) {
    throw new Error(`Invalid bridge settings: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return parsed.data;
}
