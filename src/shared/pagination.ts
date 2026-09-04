export type PaginationQuery = {
  page?: string;
  limit?: string;
};

export const getPagination = (query: PaginationQuery) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
