// src/services/showtimes.service.js
import api from "../lib/axios";

export async function listShowtimes({
  page = 1,
  size = 10,
  search = "",
  includePast = true,
} = {}) {
  const params = { page, limit: size };
  // BE không có search text chung, tham số này nếu có sẽ bị bỏ qua
  if (includePast) params.includePast = 1;

  const res = await api.get("/showtimes", { params });
  const data = res.data || {};
  return {
    items:
      data.showtimes ||
      data.items ||
      data.data ||
      (Array.isArray(data) ? data : []),
    total:
      data.total ??
      data.count ??
      (Array.isArray(data.showtimes) ? data.showtimes.length : 0),
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
