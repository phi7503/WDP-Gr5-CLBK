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
  BankOutlined,
} from "@ant-design/icons";
import {
  listTheaters,
  deleteTheater,
  createTheater,
  updateTheater,
  getTheaterById,
} from "../../services/theaters.service";
import TheaterForm from "./TheaterForm";

export default function TheaterManagement() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const fetchData = async (p = page, s = size, q = search) => {
    setLoading(true);
    try {
      const { items, total } = await listTheaters({
        page: p,
        size: s,
        search: q,
      });
      setRows(items);
      setTotal(total);
    } catch (e) {
      console.error(e);
      message.error("Tải danh sách phòng chiếu thất bại");
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
      const data = await getTheaterById(id);
      setMode("edit");
      setEditingId(id);
      setInitialValues({
        name: data?.name ?? "",
        branchId:
          data?.branchId ??
          data?.branch?.id ??
          data?.branch?._id ??
          (typeof data?.branch === "string" ? data.branch : undefined),
        type: data?.type ?? "standard",
        capacity: data?.capacity ?? undefined,
        status: data?.status ?? "active",
      });
      setDrawerOpen(true);
    } catch (e) {
      console.error(e);
      message.error("Không lấy được chi tiết phòng chiếu");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await deleteTheater(id);
      message.success("Đã xoá phòng chiếu");
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
        await createTheater(values);
        message.success("Tạo phòng chiếu thành công");
      } else if (editingId) {
        await updateTheater(editingId, values);
        message.success("Cập nhật phòng chiếu thành công");
      }
      setDrawerOpen(false);
      setPage(1);
      await fetchData(1, size, search);
    } catch (e) {
      console.error(e);
      message.error("Lưu phòng chiếu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Phòng chiếu",
        dataIndex: "name",
        key: "name",
        render: (text) => <span className="font-medium">{text}</span>,
      },
      {
        title: "Thuộc chi nhánh",
        key: "branch",
        render: (r) => r?.branch?.name || r?.branchName || "-",
      },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (t) => t || "standard",
      },
      {
        title: "Sức chứa",
        dataIndex: "capacity",
        key: "capacity",
        width: 120,
        render: (v) => v ?? "-",
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
                title="Xoá phòng chiếu?"
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
            <BankOutlined className="text-xl" />
            <h1 className="text-xl font-semibold">Admin · Theaters</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input.Search
              allowClear
              placeholder="Tìm theo tên phòng/chi nhánh..."
              onSearch={onSearch}
              enterButton={<SearchOutlined />}
              className="w-80"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm phòng
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
        title={mode === "create" ? "Thêm phòng chiếu" : "Sửa phòng chiếu"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        destroyOnClose
      >
        <TheaterForm
          mode={mode}
          initialValues={initialValues}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </div>
  );
}
