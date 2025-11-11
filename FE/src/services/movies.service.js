import api from "../lib/axios";

export async function listMovies({ page = 1, size = 10, search = "" } = {}) {
  const res = await api.get("/movies", {
    params: { page, size, search },
  });
  // Chuẩn hoá format {items, total}
  const data = res.data;
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return {
    items: data?.items || data?.data || data?.results || [],
    total: data?.total || data?.count || (data?.items?.length ?? 0),
  };
}

export async function getMovieById(id) {
  const res = await api.get(`/movies/${id}`);
  return res.data;
}

export async function createMovie(payload) {
  // payload: { title, description?, duration?, genres?, releaseDate?, status? }
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
