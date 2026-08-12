export const DEFAULT_PER_PAGE = 10;

export interface PageInfo {
  page: number; // 1-based
  perPage: number;
  from: number; // supabase range start (0-based)
  to: number; // supabase range end (inclusive)
}

/** Parse ?page= param (from Next.js searchParams) into a safe PageInfo. */
export function parsePage(
  raw: string | string[] | undefined,
  perPage = DEFAULT_PER_PAGE
): PageInfo {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const from = (page - 1) * perPage;
  return { page, perPage, from, to: from + perPage - 1 };
}

export function totalPages(count: number, perPage = DEFAULT_PER_PAGE): number {
  return Math.max(1, Math.ceil(count / perPage));
}
