import api from "../lib/axios";

export async function listTheaters({ page = 1, size = 1000, search = "" } = {}) {
  const res = await api.get("/theaters", { params: { page, size, search } });
  const data = res.data;
  return {
    items: data?.items || data?.data || data?.results || [],
    total:
      data?.total ??
      data?.count ??
      (Array.isArray(data?.items) ? data.items.length : 0),
  };
}
