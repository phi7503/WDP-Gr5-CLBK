import api from "../lib/axios";

/** Map kiểu ghế -> ký hiệu */
function typeToCell(t, available = true) {
  if (available === false) return "X";
  const key = String(t || "").toLowerCase();
  if (key === "vip") return "V";
  if (key === "couple") return "C";
  if (key === "blocked") return "X";
  return "S";
}
function rowToIndex(row) {
  if (typeof row === "number") return row; // 0-based
  if (typeof row === "string" && row.length) {
    return row.trim().toUpperCase().charCodeAt(0) - 65; // 'A'->0
  }
  return -1;
}

/** —— CHUẨN HOÁ: trả về object có {rows, seatsPerRow, cols, grid} —— */
export function normalizeSeatLayout(layout) {
  if (!layout || typeof layout !== "object") return null;
  // Nếu đã có grid => chỉ bổ sung cols rồi trả ra
  if (Array.isArray(layout.grid) && layout.grid.length > 0) {
    const rows = layout.rows ?? layout.grid.length;
    const cols =
      layout.cols ??
      layout.seatsPerRow ??
      (Array.isArray(layout.grid[0]) ? layout.grid[0].length : 0);
    return { ...layout, rows, cols, seatsPerRow: cols, grid: layout.grid };
  }

  // Ước lượng rows/cols
  let rows = layout.rows || 0;
  let cols = layout.seatsPerRow || layout.cols || 0;
  if (!rows && Array.isArray(layout.rowLabels)) rows = layout.rowLabels.length;

  // Nếu có mảng seats -> suy ra rows/cols lớn nhất
  if (Array.isArray(layout.seats) && layout.seats.length) {
    for (const s of layout.seats) {
      const r = rowToIndex(s.row);
      const c =
        typeof s.col === "number"
          ? s.col
          : typeof s.number === "number"
          ? s.number - 1
          : -1;
      if (r >= 0) rows = Math.max(rows, r + 1);
      if (c >= 0) cols = Math.max(cols, c + 1);
    }
  }
  rows = rows || 0;
  cols = cols || 0;

  // Tạo grid mặc định 'S'
  const grid =
    rows && cols
      ? Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => "S")
        )
      : [];

  // Áp seats[] nếu có
  if (Array.isArray(layout.seats)) {
    for (const s of layout.seats) {
      const r = rowToIndex(s.row);
      const c =
        typeof s.col === "number"
          ? s.col
          : typeof s.number === "number"
          ? s.number - 1
          : -1;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = typeToCell(s.type, s.available);
      }
    }
  }

  // Áp VIP theo hàng (vipRows)
  if (Array.isArray(layout.vipRows)) {
    for (const label of layout.vipRows) {
      const r = rowToIndex(label);
      if (r >= 0 && r < rows) {
        for (let c = 0; c < cols; c++) grid[r][c] = "V";
      }
    }
  }

  // Áp coupleSeats: { row: 'D', startSeat, endSeat }
  if (Array.isArray(layout.coupleSeats)) {
    for (const seg of layout.coupleSeats) {
      const r = rowToIndex(seg.row);
      if (r >= 0 && r < rows) {
        const from = Math.max(1, seg.startSeat || 1);
        const to = Math.min(cols, seg.endSeat || cols);
        for (let n = from; n <= to; n++) grid[r][n - 1] = "C";
      }
    }
  }

  // Áp disabledSeats: { row: 'E', number: 6 }
  if (Array.isArray(layout.disabledSeats)) {
    for (const d of layout.disabledSeats) {
      const r = rowToIndex(d.row);
      const c = (d.number || 1) - 1;
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = "X";
    }
  }

  return { ...layout, rows, cols, seatsPerRow: cols, grid };
}

/** Danh sách layouts (lọc + trang) và normalize để preview/đếm loại ghế đúng */
export async function listSeatLayouts({
  branch = "",
  theater = "",
  isActive = "",
  page = 1,
  limit = 12,
  search = "",
} = {}) {
  const params = { page, limit };
  if (branch) params.branch = branch;
  if (theater) params.theater = theater;
  if (isActive !== "") params.isActive = isActive;
  if (search) params.search = search;

  const res = await api.get("/seats/layouts", { params });
  const data = res.data || {};
  let items =
    data.seatLayouts ||
    data.items ||
    data.data ||
    (Array.isArray(data) ? data : []);
  items = (items || []).map((x) => normalizeSeatLayout(x));
  const total = data.total ?? items.length;
  const pages = data.pages ?? 1;
  return { items, total, pages, page };
}

/** Lấy layout theo theater (normalize để Editor nhận grid đúng) */
export async function getLayoutByTheater(theaterId) {
  const res = await api.get("/seats/layouts", {
    params: { theater: theaterId, limit: 1, page: 1 },
  });
  const data = res.data;
  const list =
    data?.seatLayouts ||
    data?.items ||
    data?.data ||
    (Array.isArray(data) ? data : []);
  const raw = Array.isArray(list) ? list[0] : list;
  return raw ? normalizeSeatLayout(raw) : null;
}

/** Lấy layout theo id (để bấm Edit lấy đủ chi tiết & normalize) */
export async function getSeatLayoutById(id) {
  const res = await api.get(`/seats/layouts/${id}`);
  const raw = res.data?.seatLayout || res.data;
  return raw ? normalizeSeatLayout(raw) : null;
}

export async function createSeatLayout(payload) {
  const body = {
    name: payload?.name || "Seat Layout",
    branch: payload?.branch || payload?.branchId,
    theater: payload?.theater || payload?.theaterId,
    rows: payload?.rows,
    seatsPerRow: payload?.cols ?? payload?.seatsPerRow,
    rowLabels: payload?.rowLabels,
    vipRows: payload?.vipRows,
    coupleSeats: payload?.coupleSeats,
    aisleAfterColumns: payload?.aisleAfterColumns,
    disabledSeats: payload?.disabledSeats,
    screenPosition: payload?.screenPosition,
    isActive: payload?.isActive,
    grid: payload?.grid,
  };
  return (await api.post("/seats/layouts", body)).data;
}

export async function updateSeatLayout(id, payload) {
  const body = {
    name: payload?.name,
    rows: payload?.rows,
    seatsPerRow: payload?.cols ?? payload?.seatsPerRow,
    rowLabels: payload?.rowLabels,
    vipRows: payload?.vipRows,
    coupleSeats: payload?.coupleSeats,
    aisleAfterColumns: payload?.aisleAfterColumns,
    disabledSeats: payload?.disabledSeats,
    screenPosition: payload?.screenPosition,
    isActive: payload?.isActive,
    grid: payload?.grid,
  };
  return (await api.put(`/seats/layouts/${id}`, body)).data;
}

export async function deleteSeatLayout(id) {
  return (await api.delete(`/seats/layouts/${id}`)).data;
}

export async function generateSeatsForTheater(theaterId, branchId) {
  return (
    await api.post(`/seats/generate-theater/${theaterId}`, null, {
      params: { branchId },
    })
  ).data;
}
