import api from "../lib/axios";

/**
 * Lấy danh sách phim (admin)
 */
export async function listMovies({ page = 1, size = 10, search = "" } = {}) {
  // BE dùng "page" + "limit"
  const params = {
    page,
    limit: size,
  };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  const res = await api.get("/movies", { params });
  const data = res.data;

  // Trường hợp BE trả thẳng array
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  // Chuẩn hoá format { items, total }
  const items =
    data?.items ||
    data?.movies || // dạng BE hiện tại
    data?.data ||
    data?.results ||
    [];

  const total =
    data?.total ??
    data?.count ??
    (Array.isArray(data?.items) ? data.items.length : undefined) ??
    (Array.isArray(data?.movies) ? data.movies.length : 0);

  return {
    items,
    total: total ?? 0,
  };
}

export async function getMovieById(id) {
  const res = await api.get(`/movies/${id}`);
  return res.data;
}

export async function createMovie(payload) {
  const res = await api.post("/movies", payload);
  return res.data;
}

export async function updateMovie(id, payload) {
  const res = await api.put(`/movies/${id}`, payload);
  return res.data;
}

export async function deleteMovie(id) {
  const res = await api.delete(`/movies/${id}`);
  return res.data;
}
