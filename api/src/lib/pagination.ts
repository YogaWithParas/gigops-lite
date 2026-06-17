import { ApiError } from "./errors";
import type { PaginationMeta } from "../types";

export function parsePagination(input: unknown) {
  const query = (input as Record<string, string | undefined>) || {};

  const page = Number(query.page ?? "1");
  const limit = Number(query.limit ?? "10");

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "INVALID_PAGINATION", "Query param page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "INVALID_PAGINATION", "Query param limit must be an integer between 1 and 100");
  }

  return { page, limit };
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = items.slice(start, end);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return { data, meta };
}

export function fullListMeta(total: number): PaginationMeta {
  return {
    page: 1,
    limit: total,
    total,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
}
