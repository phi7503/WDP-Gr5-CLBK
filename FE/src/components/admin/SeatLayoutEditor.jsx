import { useEffect, useMemo, useState } from "react";
import { Button, InputNumber, message, Radio, Space, Tag } from "antd";
import {
  createSeatLayout,
  updateSeatLayout,
} from "../../services/seatLayouts.service";

const TYPES = [
  { key: "S", label: "Standard", color: "default" },
  { key: "V", label: "VIP", color: "volcano" },
  { key: "C", label: "Couple", color: "purple" },
  { key: "X", label: "Blocked", color: "error" },
  { key: "_", label: "Aisle", color: "processing" },
];

function makeEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "S")
  );
}
function cloneGrid(g) {
  return g.map((r) => [...r]);
}
function labelOf(r, c) {
  return String.fromCharCode(65 + r) + (c + 1);
}

export default function SeatLayoutEditor({
  theaterId,
  initialLayout,
  onClose,
  onSaved,
}) {
  const [rows, setRows] = useState(initialLayout?.rows || 8);
  const [cols, setCols] = useState(initialLayout?.cols || 12);
  const [grid, setGrid] = useState(() => {
    if (initialLayout?.grid && Array.isArray(initialLayout.grid))
      return cloneGrid(initialLayout.grid);
    return makeEmptyGrid(rows, cols);
  });
  const [activeType, setActiveType] = useState("S");
  const layoutId = initialLayout?._id || initialLayout?.id;

  // resize grid khi rows/cols đổi
  useEffect(() => {
    setGrid((g) => {
      const newG = makeEmptyGrid(rows, cols);
      for (let r = 0; r < Math.min(rows, g.length); r++) {
        for (let c = 0; c < Math.min(cols, g[0].length); c++) {
          newG[r][c] = g[r][c];
        }
      }
      return newG;
    });
  }, [rows, cols]);

  const legend = useMemo(
    () =>
      TYPES.map((t) => (
        <Tag key={t.key} color={t.color} className="px-3 py-1 rounded-md">
          {t.label}
        </Tag>
      )),
    []
  );

  const applyCell = (r, c) => {
    setGrid((g) => {
      const ng = cloneGrid(g);
      ng[r][c] = activeType;
      return ng;
    });
  };

  const clearAll = () => setGrid(makeEmptyGrid(rows, cols));
  const fillAisleRow = (r) =>
    setGrid((g) => {
      const ng = cloneGrid(g);
      for (let c = 0; c < cols; c++) ng[r][c] = "_";
      return ng;
    });

  const toSeatsArray = () => {
    const seats = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = grid[r][c];
        if (t === "_") continue; // aisle: không phải ghế
        seats.push({
          row: r,
          col: c,
          code: labelOf(r, c),
          type:
            t === "S"
              ? "standard"
              : t === "V"
              ? "vip"
              : t === "C"
              ? "couple"
              : "blocked",
          available: t !== "X",
        });
      }
    }
    return seats;
  };

  const handleSave = async () => {
    try {
      const payload = {
        theaterId,
        rows,
        cols,
        grid,
        seats: toSeatsArray(), // nếu backend không cần 'seats' sẽ bỏ qua
      };
      let saved;
      if (layoutId) saved = await updateSeatLayout(layoutId, payload);
      else saved = await createSeatLayout(payload);
      message.success("Đã lưu sơ đồ ghế");
      onSaved?.(saved);
    } catch (e) {
      console.error(e);
      message.error("Lưu sơ đồ thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="text-neutral-300">Kích thước:</span>
          <InputNumber
            min={1}
            max={30}
            value={rows}
            onChange={(v) => setRows(v || 1)}
          />
          <span className="text-neutral-400">x</span>
          <InputNumber
            min={1}
            max={30}
            value={cols}
            onChange={(v) => setCols(v || 1)}
          />
          <span className="ml-4 text-neutral-300">Loại ghế:</span>
          <Radio.Group
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            {TYPES.map((t) => (
              <Radio.Button key={t.key} value={t.key}>
                {t.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        <Space>
          <Button onClick={clearAll}>Làm mới</Button>
          <Button type="primary" onClick={handleSave}>
            Lưu sơ đồ
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      </div>

      <div className="text-sm text-neutral-400">{legend}</div>

      {/* hàng nút nhanh cho "lối đi" theo hàng */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: rows }).map((_, r) => (
          <Button key={r} size="small" onClick={() => fillAisleRow(r)}>
            Hàng {String.fromCharCode(65 + r)} = Lối đi
          </Button>
        ))}
      </div>

      {/* Lưới ghế */}
      <div className="overflow-auto">
        <div className="inline-block rounded-xl border border-white/10 p-3 bg-[#0f0f0f]">
          {grid.map((row, r) => (
            <div key={r} className="flex items-center gap-2 mb-2">
              <div className="w-8 text-right text-neutral-400">
                {String.fromCharCode(65 + r)}
              </div>
              <div className="flex gap-1">
                {row.map((cell, c) => {
                  const base =
                    "w-9 h-9 rounded-md flex items-center justify-center cursor-pointer border";
                  const byType =
                    cell === "S"
                      ? "bg-[#1f1f1f] border-white/10 hover:bg-[#2a2a2a]"
                      : cell === "V"
                      ? "bg-[#3a0f0f] border-[#6b1f1f] hover:bg-[#4a1a1a]"
                      : cell === "C"
                      ? "bg-[#2a0f3a] border-[#4b1f6b] hover:bg-[#341a4a]"
                      : cell === "X"
                      ? "bg-[#2a2a2a] border-[#444] line-through"
                      : "bg-transparent border-dashed border-white/20";
                  return (
                    <div
                      key={c}
                      className={`${base} ${byType}`}
                      title={labelOf(r, c)}
                      onClick={() => applyCell(r, c)}
                    >
                      {cell === "_" ? "" : labelOf(r, c)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* chỉ số cột */}
          <div className="ml-10 mt-2 flex gap-1 text-neutral-400">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="w-9 text-center">
                {c + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
