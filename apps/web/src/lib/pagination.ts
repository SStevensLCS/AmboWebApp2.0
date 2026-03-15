export type PaginationParams = {
  page: number;
  limit: number;
  from: number;
  to: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function parsePagination(
  url: URL,
  defaults = { page: 1, limit: 25 }
): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || String(defaults.page)));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || String(defaults.limit))));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
