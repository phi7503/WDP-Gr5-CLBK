// src/services/branches.service.js
import api from "../lib/axios";

export async function listBranches({ page = 1, size = 10, search = "" } = {}) {
  const res = await api.get("/branches", { params: { page, size, search } });
  const data = res.data;
  return {
    items: data?.items || data?.data || data?.results || [],
    total:
      data?.total ??
      data?.count ??
      (Array.isArray(data?.items) ? data.items.length : 0),
  };
}

export async function getBranchById(id) {
  const res = await api.get(`/branches/${id}`);
  return res.data;
}

export async function createBranch(payload) {
  // payload tối thiểu: { name } ; các field khác tuỳ backend
  const res = await api.post("/branches", payload);
  return res.data;
}

export async function updateBranch(id, payload) {
  const res = await api.put(`/branches/${id}`, payload);
  return res.data;
}

export async function deleteBranch(id) {
  const res = await api.delete(`/branches/${id}`);
  return res.data;
}
