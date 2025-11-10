import { useEffect, useState } from "react";
import { Button, Card, Select, message, Space } from "antd";
import { AppstoreAddOutlined, EyeOutlined } from "@ant-design/icons";
import { listTheaters } from "../../services/theaters.service";
import { getLayoutByTheater } from "../../services/seatLayouts.service";
import SeatLayoutEditor from "./SeatLayoutEditor";
import SeatLayoutViewer from "./SeatLayoutViewer";

export default function SeatLayoutManagement() {
  const [theaters, setTheaters] = useState([]);
  const [theaterId, setTheaterId] = useState();
  const [currentLayout, setCurrentLayout] = useState(null);
  const [mode, setMode] = useState("idle"); // 'idle' | 'edit' | 'view'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const th = await listTheaters({ page: 1, size: 1000 });
        setTheaters(
          (th.items || []).map((t) => ({ value: t._id || t.id, label: t.name }))
        );
      } catch (e) {
        message.error("Không tải được danh sách rạp/phòng");
      }
    })();
  }, []);

  const loadLayout = async (tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const layout = await getLayoutByTheater(tid);
      setCurrentLayout(layout);
    } catch (e) {
      setCurrentLayout(null);
    } finally {
      setLoading(false);
    }
  };

  const onOpenEdit = async () => {
    await loadLayout(theaterId);
    setMode("edit");
  };

  const onOpenView = async () => {
    await loadLayout(theaterId);
    setMode("view");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin · Seat Layouts</h1>
          <Space>
            <Select
              showSearch
              placeholder="Chọn rạp/phòng"
              options={theaters}
              value={theaterId}
              onChange={setTheaterId}
              optionFilterProp="label"
              className="w-80"
            />
            <Button
              type="primary"
              icon={<AppstoreAddOutlined />}
              disabled={!theaterId}
              loading={loading}
              onClick={onOpenEdit}
            >
              Cấu hình
            </Button>
            <Button
              icon={<EyeOutlined />}
              disabled={!theaterId}
              loading={loading}
              onClick={onOpenView}
            >
              Xem trước
            </Button>
          </Space>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {mode === "edit" && (
          <Card className="bg-[#111]">
            <SeatLayoutEditor
              theaterId={theaterId}
              initialLayout={currentLayout}
              onClose={() => setMode("idle")}
              onSaved={(layout) => {
                setCurrentLayout(layout);
                setMode("idle");
              }}
            />
          </Card>
        )}

        {mode === "view" && (
          <Card className="bg-[#111]">
            <SeatLayoutViewer layout={currentLayout} />
          </Card>
        )}

        {mode === "idle" && (
          <Card className="bg-[#111]">
            <p className="text-neutral-300">
              Chọn rạp/phòng và nhấn <b>Cấu hình</b> để định nghĩa sơ đồ ghế.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
