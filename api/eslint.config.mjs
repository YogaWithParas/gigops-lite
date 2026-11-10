import js from "@eslint/js";
import tseslint from "typescript-eslint";

// The anti-corruption layer rule from docs/bridge/SPEC.md: Salesforce and
// ERPNext vendor-shaped types may only be imported inside their own adapter
// folder, so the rest of the bridge only ever sees our own Deal/Customer/
// Invoice types.
// Matches both a distant import ("../../adapters/salesforce/types") and a
// same-level sibling import from the other adapter folder
// ("../salesforce/types"), since the second form has no "adapters" segment.
const salesforceTypesRestriction = {
  group: ["**/salesforce/types"],
  message: "Salesforce vendor types may only be imported inside src/bridge/adapters/salesforce/.",
};
const erpnextTypesRestriction = {
  group: ["**/erpnext/types"],
  message: "ERPNext vendor types may only be imported inside src/bridge/adapters/erpnext/.",
};

function restrict(...patterns) {
  return { rules: { "no-restricted-imports": ["error", { patterns }] } };
}

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Everywhere else in the bridge: neither vendor's types may be imported.
  { files: ["src/**/*.ts"], ...restrict(salesforceTypesRestriction, erpnextTypesRestriction) },
  // Inside each adapter folder, only that adapter's own vendor types are
  // allowed -- importing the OTHER vendor's types is still blocked, so the
  // two adapters stay independent of each other.
  { files: ["src/bridge/adapters/salesforce/**/*.ts"], ...restrict(erpnextTypesRestriction) },
  { files: ["src/bridge/adapters/erpnext/**/*.ts"], ...restrict(salesforceTypesRestriction) },
);
