import js from "@eslint/js";
import tseslint from "typescript-eslint";

// The anti-corruption layer rule from docs/bridge/SPEC.md: Salesforce and
// ERPNext vendor-shaped types may only be imported inside their own adapter
// folder, so the rest of the bridge only ever sees our own Deal/Customer/
// Invoice types.
const vendorTypeRestriction = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/adapters/salesforce/types"],
            message: "Salesforce vendor types may only be imported inside src/bridge/adapters/salesforce/.",
          },
          {
            group: ["**/adapters/erpnext/types"],
            message: "ERPNext vendor types may only be imported inside src/bridge/adapters/erpnext/.",
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["src/**/*.ts"], ...vendorTypeRestriction },
  { files: ["src/bridge/adapters/salesforce/**/*.ts"], rules: { "no-restricted-imports": "off" } },
  { files: ["src/bridge/adapters/erpnext/**/*.ts"], rules: { "no-restricted-imports": "off" } },
);
