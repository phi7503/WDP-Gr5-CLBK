// src/pages/admin/SeatLayoutManagement.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  listSeatLayouts,
  deleteSeatLayout,
  generateSeatsForTheater,
  getSeatLayoutById,
} from "../../services/seatLayouts.service";
import { listTheaters } from "../../services/theaters.service";
import SeatLayoutEditor from "./SeatLayoutEditor";

const toBadge = (active) => (
  <Tag color={active ? "green" : "default"} className="rounded-full">
    {active ? "Active" : "Inactive"}
  </Tag>
);

const countByType = (grid) => {
  const stat = { S: 0, V: 0, C: 0, X: 0 };
  if (!Array.isArray(grid)) return stat;
  for (const row of grid)
    for (const cell of row) if (stat[cell] !== undefined) stat[cell]++;
  return stat;
};

const MiniPreview = ({ grid = [], rows = 0, cols = 0 }) => {
  const g =
    Array.isArray(grid) && grid.length
      ? grid
      : Array.from({ length: rows || 0 }, () =>
          Array.from({ length: cols || 0 }, () => "S")
        );

  return (
    <div className="mt-2 rounded-lg border border-white/10 p-2 bg-[#0f0f0f]">
      <div className="text-center text-xs text-neutral-400 mb-1">SCREEN</div>
      <div className="h-1 w-full bg-white/20 rounded-full mb-2" />
      <div className="max-h-40 overflow-auto">
        {g.map((r, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1">
            {r.map((c, ci) => {
              const base = "w-3.5 h-3.5 rounded-sm border";
              const byType =
                c === "S"
                  ? "bg-[#123c4a] border-[#1e5a6d]"
                  : c === "V"
                  ? "bg-[#3a0f0f] border-[#6b1f1f]"
                  : c === "C"
                  ? "bg-[#2a0f3a] border-[#4b1f6b]"
                  : c === "X"
                  ? "bg-[#2a2a2a] border-[#444]"
                  : "bg-transparent border-dashed border-white/20";
              return <div key={ci} className={`${base} ${byType}`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SeatLayoutManagement() {
  const [theaterOptions, setTheaterOptions] = useState([]);
  const [filters, setFilters] = useState({
    theater: "",
    status: "",
    search: "",
  });
  const [data, setData] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const th = await listTheaters({ page: 1, size: 1000 });
        const items = Array.isArray(th?.items)
          ? th.items
          : Array.isArray(th)
          ? th
          : [];
        setTheaterOptions(
          items.map((t) => ({ value: t._id || t.id, label: t.name }))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const { items, total, pages } = await listSeatLayouts({
        theater: filters.theater,
        isActive: filters.status === "" ? "" : filters.status === "active",
        page,
        limit: 12,
        search: filters.search,
      });
      setData(items || []);
      setPageInfo({ page, pages, total });
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách seat layouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.theater, filters.status]);

  const onCreate = () => {
    setEditing(null);
    setOpenEditor(true);
  };

  const onEdit = async (layout) => {
    try {
      const id = layout._id || layout.id;
      const full = await getSeatLayoutById(id); // lấy đúng grid đã lưu
      setEditing(full || layout);
      setOpenEditor(true);
    } catch {
      setEditing(layout);
      setOpenEditor(true);
    }
  };

  const onDelete = async (layout) => {
    try {
      await deleteSeatLayout(layout._id || layout.id);
      message.success("Đã xoá layout");
      fetchList(pageInfo.page);
    } catch {
      message.error("Xoá thất bại");
    }
  };

  const onGenerate = async (layout) => {
    try {
      const tId =
        layout?.theater?._id || layout?.theater?.id || layout?.theater;
      const bId = layout?.branch?._id || layout?.branch?.id || layout?.branch;
      await generateSeatsForTheater(tId, bId);
      message.success("Đã generate seats từ layout");
    } catch {
      message.error("Generate seats thất bại");
    }
  };

  const filtered = useMemo(() => {
    let arr = data;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(
        (x) =>
          x?.name?.toLowerCase()?.includes(q) ||
          x?.theater?.name?.toLowerCase()?.includes(q) ||
          x?.branch?.name?.toLowerCase()?.includes(q)
      );
    }
    return arr;
  }, [data, filters.search]);

  return (
    <div className="min-h-screen text-white">
      <div className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Seat Layout Management</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Create New Layout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Card className="bg-[#101010] border-white/10">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="min-w-[220px]">
              <div className="text-xs text-neutral-400 mb-1">Theater</div>
              <Select
                allowClear
                className="w-[260px]"
                placeholder="All theaters"
                options={theaterOptions}
                value={filters.theater || undefined}
                onChange={(v) =>
                  setFilters((s) => ({ ...s, theater: v || "" }))
                }
                optionFilterProp="label"
                showSearch
              />
            </div>

            <div className="min-w-[180px]">
              <div className="text-xs text-neutral-400 mb-1">Status</div>
              <Select
                className="w-[200px]"
                value={filters.status}
                onChange={(v) => setFilters((s) => ({ ...s, status: v }))}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>

            <div className="flex-1 min-w-[220px]">
              <div className="text-xs text-neutral-400 mb-1">Search</div>
              <Input
                placeholder="Search layouts..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, search: e.target.value }))
                }
                onPressEnter={() => fetchList(1)}
              />
            </div>

            <div className="ml-auto">
              <Button onClick={() => fetchList(1)} loading={loading}>
                Reload
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {filtered.map((item) => {
            const dimensions = `${item?.rows || 0} rows × ${
              item?.seatsPerRow || 0
            } seats`;
            const totalSeats = (item?.rows || 0) * (item?.seatsPerRow || 0);
            const stat = countByType(item?.grid);

            return (
              <Card
                key={item._id || item.id}
                className="bg-[#101010] border-white/10"
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {(item?.theater?.name || "Theater") +
                        " - " +
                        (item?.name || "Layout")}
                    </span>
                    {toBadge(item?.isActive)}
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-sm text-neutral-300">
                    <div>
                      <span className="text-neutral-400">Dimensions:</span>{" "}
                      {dimensions}
                    </div>
                    <div>
                      <span className="text-neutral-400">Total Seats:</span>{" "}
                      {totalSeats}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-neutral-400">Seat Types:</span>
                      <Tag className="rounded-full">{stat.S} Standard</Tag>
                      <Tag color="volcano" className="rounded-full">
                        {stat.V} VIP
                      </Tag>
                      <Tag color="purple" className="rounded-full">
                        {stat.C} Couple
                      </Tag>
                    </div>
                  </div>

                  <MiniPreview
                    grid={item?.grid}
                    rows={item?.rows}
                    cols={item?.seatsPerRow}
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-neutral-500">
                    Created:{" "}
                    {item?.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "-"}
                  </div>

                  <Space>
                    <Tooltip title="Edit">
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => onEdit(item)}
                      />
                    </Tooltip>

                    <Popconfirm
                      title="Delete this layout?"
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onDelete(item)}
                    >
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>

                    <Tooltip title="Generate seats">
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => onGenerate(item)}
                      >
                        Generate Seats
                      </Button>
                    </Tooltip>
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Drawer Editor (Create/Edit) */}
      <Drawer
        open={openEditor}
        onClose={() => setOpenEditor(false)}
        width={1000}
        bodyStyle={{ background: "#0f0f0f" }}
        title={
          <span className="text-white">
            {editing ? "Edit Seat Layout" : "Create New Seat Layout"}
          </span>
        }
      >
        <div className="bg-[#101010] border border-white/10 rounded-xl p-4">
          {/* 👉 Quan trọng: đổi key để remount khi đổi layout */}
          <SeatLayoutEditor
            key={(editing?._id || editing?.id) ?? "create"}
            theaterId={
              editing?.theater?._id || editing?.theater?.id || editing?.theater
            }
            initialLayout={editing || null}
            onClose={() => setOpenEditor(false)}
            onSaved={() => {
              setOpenEditor(false);
              fetchList(pageInfo.page);
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}
