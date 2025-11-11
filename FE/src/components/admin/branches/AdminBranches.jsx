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
  EnvironmentOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import {
  listBranches,
  deleteBranch,
  createBranch,
  updateBranch,
  getBranchById,
} from "../../../services/branches.service";
import BranchForm from "./BranchForm";

export default function AdminBranches() {
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
      const { items, total } = await listBranches({
        page: p,
        size: s,
        search: q,
      });
      setRows(items);
      setTotal(total);
    } catch (e) {
      console.error(e);
      message.error("Tải danh sách chi nhánh thất bại");
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
      const data = await getBranchById(id);
      setMode("edit");
      setEditingId(id);
      setInitialValues({
        name: data?.name ?? "",
        address: data?.address ?? "",
        city: data?.city ?? "",
        phone: data?.phone ?? "",
        lat: data?.lat ?? data?.latitude ?? null,
        lng: data?.lng ?? data?.longitude ?? null,
        status: data?.status ?? "active",
      });
      setDrawerOpen(true);
    } catch (e) {
      console.error(e);
      message.error("Không lấy được chi tiết chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await deleteBranch(id);
      message.success("Đã xoá chi nhánh");
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
        await createBranch(values);
        message.success("Tạo chi nhánh thành công");
      } else if (editingId) {
        await updateBranch(editingId, values);
        message.success("Cập nhật chi nhánh thành công");
      }
      setDrawerOpen(false);
      setPage(1);
      await fetchData(1, size, search);
    } catch (e) {
      console.error(e);
      message.error("Lưu chi nhánh thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Tên chi nhánh",
        dataIndex: "name",
        key: "name",
        render: (text) => <span className="font-medium">{text}</span>,
      },
      {
        title: "Địa chỉ",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
      },
      {
        title: "Thành phố",
        dataIndex: "city",
        key: "city",
        width: 160,
      },
      {
        title: "Điện thoại",
        dataIndex: "phone",
        key: "phone",
        width: 150,
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
        title: "Toạ độ",
        key: "coords",
        width: 160,
        render: (_, r) =>
          r?.lat && r?.lng ? (
            <span className="inline-flex items-center gap-1 text-neutral-300">
              <EnvironmentOutlined />
              {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}
            </span>
          ) : (
            "-"
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
                title="Xoá chi nhánh?"
                description="Hành động này không thể hoàn tác."
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
            <BranchesOutlined className="text-xl" />
            <h1 className="text-xl font-semibold">Admin · Branches</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input.Search
              allowClear
              placeholder="Tìm theo tên/địa chỉ..."
              onSearch={onSearch}
              enterButton={<SearchOutlined />}
              className="w-80"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm chi nhánh
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
        title={mode === "create" ? "Thêm chi nhánh" : "Sửa chi nhánh"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        destroyOnClose
      >
        <BranchForm
          mode={mode}
          initialValues={initialValues}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </div>
  );
}
