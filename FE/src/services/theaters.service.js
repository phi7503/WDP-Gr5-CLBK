import api from "../lib/axios";

export async function listTheaters({ page = 1, size = 10, search = "" } = {}) {
  const res = await api.get("/theaters", { params: { page, size, search } });
  const data = res.data;

  // Nếu BE trả về dạng { items, total } hoặc tương tự
  let items =
    data?.items ||
    data?.data ||
    data?.results ||
    (Array.isArray(data) ? data : []);

  const total =
    data?.total ??
    data?.count ??
    (Array.isArray(data?.items)
      ? data.items.length
      : Array.isArray(items)
      ? items.length
      : 0);

  return {
    items,
    total,
  };
}

export async function getTheaterById(id) {
  const res = await api.get(`/theaters/${id}`);
  return res.data;
}

export async function createTheater(payload) {
  // payload: { name, branchId, type?, capacity?, status? }
  const res = await api.post("/theaters", payload);
  return res.data;
}

export async function updateTheater(id, payload) {
  const res = await api.put(`/theaters/${id}`, payload);
  return res.data;
}

export async function deleteTheater(id) {
  const res = await api.delete(`/theaters/${id}`);
  return res.data;
}
