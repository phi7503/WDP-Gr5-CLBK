import api from "../lib/axios";

// Lấy layout theo theaterId
export async function getLayoutByTheater(theaterId) {
  const res = await api.get("/seats/layouts", { params: { theaterId } });
  const data = res.data;
  // backend có thể trả {items:[...]} hoặc object trực tiếp
  const item = Array.isArray(data?.items)
    ? data.items[0]
    : Array.isArray(data)
    ? data[0]
    : data;
  return item || null;
}

// Tạo layout mới
export async function createSeatLayout(payload) {
  // payload: { theaterId, rows, cols, grid, seats? }
  return (await api.post("/seats/layouts", payload)).data;
}

// Cập nhật layout
export async function updateSeatLayout(id, payload) {
  return (await api.put(`/seats/layouts/${id}`, payload)).data;
}

// Xoá layout (tuỳ nhu cầu)
export async function deleteSeatLayout(id) {
  return (await api.delete(`/seats/layouts/${id}`)).data;
}
