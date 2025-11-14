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
  VideoCameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listMovies,
  deleteMovie,
  createMovie,
  updateMovie,
  getMovieById,
} from "../../../services/movies.service";
import MovieForm from "./MovieForm";

export default function AdminMovies() {
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

  const normalizeGenres = (movie) => {
    if (Array.isArray(movie.genres)) return movie.genres;
    if (Array.isArray(movie.genre)) return movie.genre;
    if (typeof movie.genre === "string") {
      return movie.genre
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  const fetchData = async (p = page, s = size, q = search) => {
    setLoading(true);
    try {
      const { items, total } = await listMovies({
        page: p,
        size: s,
        search: q,
      });

      const normalized = (items || []).map((m) => ({
        ...m,
        genres: normalizeGenres(m),
      }));

      setRows(normalized);
      setTotal(total);
    } catch (e) {
      console.error(e);
      message.error("Tải danh sách phim thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const onSearch = async (value) => {
    const v = value?.trim() ?? "";
    setSearch(v);
    setPage(1);
    await fetchData(1, size, v);
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
      const data = await getMovieById(id);

      const genres = normalizeGenres(data);

      setMode("edit");
      setEditingId(id);
      setInitialValues({
        title: data?.title ?? "",
        description: data?.description ?? "",
        duration: data?.duration ?? undefined,
        genres,
        releaseDate: data?.releaseDate ? dayjs(data.releaseDate) : null,
        status: data?.status ?? "coming-soon",
      });
      setDrawerOpen(true);
    } catch (e) {
      console.error(e);
      message.error("Không lấy được chi tiết phim");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await deleteMovie(id);
      message.success("Đã xoá phim");
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
        await createMovie(values);
        message.success("Tạo phim thành công");
      } else if (editingId) {
        await updateMovie(editingId, values);
        message.success("Cập nhật phim thành công");
      }
      setDrawerOpen(false);
      setPage(1);
      await fetchData(1, size, search);
    } catch (e) {
      console.error(e);
      message.error("Lưu phim thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
        render: (text) => <span className="font-medium">{text}</span>,
      },
      {
        title: "Thời lượng",
        dataIndex: "duration",
        key: "duration",
        width: 120,
        render: (v) => (v ? `${v} phút` : "-"),
      },
      {
        title: "Thể loại",
        dataIndex: "genres",
        key: "genres",
        render: (arr) =>
          Array.isArray(arr) && arr.length > 0 ? (
            <Space wrap>
              {arr.map((g, i) => (
                <Tag key={i} color="volcano">
                  {g}
                </Tag>
              ))}
            </Space>
          ) : (
            <span>-</span>
          ),
      },
      {
        title: "Khởi chiếu",
        dataIndex: "releaseDate",
        key: "releaseDate",
        width: 160,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (s) => {
          let color = "default";
          let label = s || "-";

          if (s === "now-showing") {
            color = "green";
            label = "Đang chiếu";
          } else if (s === "coming-soon") {
            color = "blue";
            label = "Sắp chiếu";
          } else if (s === "ended") {
            color = "default";
            label = "Ngừng chiếu";
          }

          return <Tag color={color}>{label}</Tag>;
        },
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
                title="Xoá phim?"
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
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VideoCameraOutlined className="text-xl" />
            <h1 className="text-xl font-semibold">Admin · Movies</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input.Search
              allowClear
              placeholder="Tìm theo tiêu đề..."
              onSearch={onSearch}
              enterButton={<SearchOutlined />}
              className="w-72"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm phim
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
              Tải lại
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
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

      {/* Drawer form */}
      <Drawer
        title={mode === "create" ? "Thêm phim" : "Sửa phim"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        destroyOnClose
      >
        <MovieForm
          mode={mode}
          initialValues={initialValues}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </div>
  );
}
