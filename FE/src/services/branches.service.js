// src/services/branches.service.js
import api from "../lib/axios";

export async function listBranches({ page = 1, size = 10, search = "" } = {}) {
  const params = {};

  // BE lọc theo name, không có "search"
  if (search && search.trim()) {
    params.name = search.trim();
  }

  const res = await api.get("/branches", { params });
  const data = res.data;

  // Trường hợp BE trả thẳng array
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  // Trường hợp BE groupByChain
  if (data?.groupedByChain) {
    const groups = Object.values(data.groupedByChain);
    const flat = groups.flat();
    return {
      items: flat,
      total: data.total ?? flat.length,
    };
  }

  // Fallback cho các format khác (phòng khi sau này backend đổi)
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
