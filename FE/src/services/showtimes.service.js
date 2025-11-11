import api from "../lib/axios";

export async function listShowtimes({ page = 1, size = 10, search = "" } = {}) {
  const res = await api.get("/showtimes", { params: { page, size, search } });
  const data = res.data;
  return {
    items: data?.items || data?.data || data?.results || [],
    total:
      data?.total ??
      data?.count ??
      (Array.isArray(data?.items) ? data.items.length : 0),
  };
}

export async function getShowtimeById(id) {
  const res = await api.get(`/showtimes/${id}`);
  return res.data;
}

export async function createShowtime(payload) {
  return (await api.post("/showtimes", payload)).data;
}

export async function updateShowtime(id, payload) {
  return (await api.put(`/showtimes/${id}`, payload)).data;
}

export async function deleteShowtime(id) {
  return (await api.delete(`/showtimes/${id}`)).data;
}
