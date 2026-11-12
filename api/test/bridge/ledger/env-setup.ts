import { fileURLToPath } from "node:url";

// Loads api/.env (BRIDGE_DATABASE_URL) for the ledger integration tests.
// Node's built-in loader never overrides a variable already set in the
// environment, so CI/cloud runs that export BRIDGE_DATABASE_URL another
// way are unaffected; a missing .env (same environments) is not an error.
try {
  process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));
} catch {
  // No local api/.env -- fine when BRIDGE_DATABASE_URL is set another way.
}
