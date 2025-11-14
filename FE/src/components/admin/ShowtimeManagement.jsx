// src/pages/admin/ShowtimeManagement.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listShowtimes,
  deleteShowtime,
  createShowtime,
  updateShowtime,
  getShowtimeById,
} from "../../services/showtimes.service";
import ShowtimeForm from "./ShowtimeForm";

export default function ShowtimeManagement() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const fetchData = async (p = page, s = size, q = search) => {
    setLoading(true);
    try {
      const { items, total } = await listShowtimes({
        page: p,
        size: s,
        search: q,
        includePast: true, // ✅ hiển thị cả suất đã qua nếu có
      });
      setRows(items);
      setTotal(total);
    } catch (e) {
      console.error(e);
      message.error("Tải danh sách suất chiếu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const onSearch = async (value) => {
    setSearch(value);
    setPage(1);
    await fetchData(1, size, value);
  };

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setInitialValues(null);
    setDrawerOpen(true);
  };

  const openEdit = async (id) => {
    try {
      setLoading(true);
      const data = await getShowtimeById(id);
      // map về initialValues cho form (ID + date + nhóm giá)
      setMode("edit");
      setEditingId(id);
      setInitialValues({
        movie: data.movie?._id || data.movie,
        branch: data.branch?._id || data.branch,
        theater: data.theater?._id || data.theater,
        startTime: data.startTime,
        endTime: data.endTime,
        price: data.price,
        priceStandard: data.price?.standard,
        priceVip: data.price?.vip,
        priceCouple: data.price?.couple,
        status: data.status || "active",
      });
      setDrawerOpen(true);
    } catch (e) {
      console.error(e);
      message.error("Không lấy được chi tiết suất chiếu");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await deleteShowtime(id);
      message.success("Đã xoá suất chiếu");
      fetchData();
    } catch (e) {
      console.error(e);
      message.error("Xoá thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (mode === "create") {
        await createShowtime(values);
        message.success("Tạo suất chiếu thành công");
      } else if (editingId) {
        await updateShowtime(editingId, values);
        message.success("Cập nhật suất chiếu thành công");
      }
      setDrawerOpen(false);
      setPage(1);
      await fetchData(1, size, search);
    } catch (e) {
      console.error(e);
      message.error("Lưu suất chiếu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Phim",
        key: "movie",
        render: (r) => r?.movie?.title || r?.movieTitle || "-",
      },
      {
        title: "Rạp/Phòng",
        key: "theater",
        render: (r) => r?.theater?.name || r?.theaterName || "-",
      },
      {
        title: "Bắt đầu",
        dataIndex: "startTime",
        key: "startTime",
        width: 170,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      },
      {
        title: "Kết thúc",
        dataIndex: "endTime",
        key: "endTime",
        width: 170,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      },
      {
        title: "Giá (Standard)",
        dataIndex: "price",
        key: "price",
        width: 150,
        render: (v, r) =>
          (v?.standard ?? r?.price?.standard ?? 0).toLocaleString("vi-VN") +
          " đ",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (s) =>
          s === "inactive" ? (
            <Tag color="default">Inactive</Tag>
          ) : (
            <Tag color="success">Active</Tag>
          ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 170,
        render: (_, record) => {
          const id = record._id || record.id;
          return (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => openEdit(id)}>
                Sửa
              </Button>
              <Popconfirm
                title="Xoá suất chiếu?"
                okText="Xoá"
                cancelText="Huỷ"
                onConfirm={() => onDelete(id)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xoá
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FieldTimeOutlined className="text-xl" />
            <h1 className="text-xl font-semibold">Admin · Showtimes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input.Search
              allowClear
              placeholder="Tìm theo phim/rạp..."
              onSearch={onSearch}
              enterButton={<SearchOutlined />}
              className="w-80"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm suất chiếu
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
              Tải lại
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Table
          rowKey={(r) => r._id || r.id}
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setSize(s);
            },
          }}
          bordered
          className="rounded-xl overflow-hidden bg-[#111]"
        />
      </div>

      <Drawer
        title={mode === "create" ? "Thêm suất chiếu" : "Sửa suất chiếu"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        destroyOnClose
      >
        <ShowtimeForm
          mode={mode}
          initialValues={initialValues}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </div>
  );
}
