import { err, ok, type Result } from "./result";

// Normalisation rules from docs/bridge/MAPPING.md ("Data normalisation").
// Each function keeps the original display value separate from the
// normalised matching/storage value, never guesses, and rejects with a
// clear message when a value cannot be normalised.

const PROVINCE_CODES = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);

const PROVINCE_NAMES: Record<string, string> = {
  alberta: "AB",
  britishcolumbia: "BC",
  manitoba: "MB",
  newbrunswick: "NB",
  newfoundlandandlabrador: "NL",
  newfoundland: "NL",
  novascotia: "NS",
  northwestterritories: "NT",
  nunavut: "NU",
  ontario: "ON",
  princeedwardisland: "PE",
  quebec: "QC",
  "québec": "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

// e.g. "B.C.", "bc" or "British Columbia" -> "BC".
export function normaliseProvince(raw: string): Result<string> {
  const compact = raw.replace(/[.\s]/g, "").toUpperCase();
  if (PROVINCE_CODES.has(compact)) {
    return ok(compact);
  }

  const nameKey = raw.trim().toLowerCase().replace(/[^a-zé]/g, "");
  const byName = PROVINCE_NAMES[nameKey];
  if (byName) {
    return ok(byName);
  }

  return err(`Unrecognised province: "${raw}"`);
}

const COUNTRY_NAMES: Record<string, string> = {
  canada: "CA",
  can: "CA",
};

// Phase 1 only has Canada in its lookup table (see MAPPING.md, Decision 3:
// "Phase 1 accepts Canadian billing addresses only"). Other countries are
// Phase 2 scope, documented but not built.
export function normaliseCountry(raw: string): Result<string> {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase() === "CA") {
    return ok("CA");
  }

  const byName = COUNTRY_NAMES[trimmed.toLowerCase()];
  if (byName) {
    return ok(byName);
  }

  return err(`Unrecognised or unsupported country: "${raw}" (Phase 1 supports Canada only)`);
}

const CANADIAN_POSTAL_CODE_PATTERN = /^([A-Z]\d[A-Z])(\d[A-Z]\d)$/;

// e.g. "v6x1a1" or "V6X-1A1" -> "V6X 1A1".
export function normalisePostalCode(raw: string): Result<string> {
  const compact = raw.replace(/[\s-]/g, "").toUpperCase();
  const match = CANADIAN_POSTAL_CODE_PATTERN.exec(compact);
  if (!match) {
    return err(`Postal code "${raw}" is not a valid Canadian postal code`);
  }

  return ok(`${match[1]} ${match[2]}`);
}

const COMPANY_SUFFIXES = new Set(["limited", "ltd", "incorporated", "inc", "corporation", "corp"]);

// The matching key used for the Decision 4 lookalike check: lowercase,
// punctuation removed, trailing legal suffixes dropped, and spaces removed
// so formatting differences never cause a false mismatch.
export function normaliseCompanyNameKey(raw: string): string {
  const words = raw
    .toLowerCase()
    .replace(/[.,]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  while (words.length > 1 && COMPANY_SUFFIXES.has(words[words.length - 1])) {
    words.pop();
  }

  return words.join("");
}

// Trims and collapses extra whitespace, changing nothing else. Used for any
// display value (company name, street, city, line description) where the
// original wording must be kept -- only formatting noise is removed.
export function collapseWhitespace(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

// The display value for a company name: only extra whitespace is
// trimmed/collapsed, never shown to a user in its normalised-key form.
export function normaliseCompanyNameDisplay(raw: string): string {
  return collapseWhitespace(raw);
}

// Product codes are trimmed only -- otherwise an exact match against the
// ERPNext Item code (MAPPING.md, Decision 1).
export function normaliseProductCode(raw: string): Result<string> {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return err("Product code is missing");
  }

  return ok(trimmed);
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Validates and passes through an ISO 8601 date (YYYY-MM-DD), rejecting
// both malformed strings and dates that do not exist on the calendar
// (e.g. 2026-02-30).
export function normaliseIsoDate(raw: string): Result<string> {
  const match = ISO_DATE_PATTERN.exec(raw.trim());
  if (!match) {
    return err(`Date "${raw}" is not in YYYY-MM-DD format`);
  }

  const [, year, month, day] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
  const isRealDate =
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() + 1 === Number(month) &&
    parsed.getUTCDate() === Number(day);

  if (!isRealDate) {
    return err(`Date "${raw}" is not a valid calendar date`);
  }

  return ok(`${year}-${month}-${day}`);
}
