interface IdempotentRecord<T> {
  payloadSignature: string;
  responseData: T;
  createdAt: string;
}

const jobPostStore = new Map<string, IdempotentRecord<unknown>>();

function stableStringify(input: unknown): string {
  if (input === null || typeof input !== "object") {
    return JSON.stringify(input);
  }

  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`);

  return `{${entries.join(",")}}`;
}

export function buildPayloadSignature(payload: unknown): string {
  return stableStringify(payload);
}

export function getJobIdempotencyRecord(key: string) {
  return jobPostStore.get(key);
}

export function setJobIdempotencyRecord(key: string, payloadSignature: string, responseData: unknown) {
  jobPostStore.set(key, {
    payloadSignature,
    responseData,
    createdAt: new Date().toISOString(),
  });
}
