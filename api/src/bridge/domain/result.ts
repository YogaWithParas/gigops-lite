// Mapping and validation functions return a Result instead of throwing, so a
// mapper can collect every problem with the input and report them all at
// once, rather than stopping at the first one found.
export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(...errors: string[]): Result<T> {
  return { ok: false, errors };
}
