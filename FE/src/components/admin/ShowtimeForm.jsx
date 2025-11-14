// src/pages/admin/ShowtimeForm.jsx
import { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Form, InputNumber, Select, Space } from "antd";
import dayjs from "dayjs";
import { listMovies } from "../../services/movies.service";
import { listBranches } from "../../services/branches.service";
import { listTheaters } from "../../services/theaters.service";

const FIXED_TIME_SLOTS = [
  {
    value: "SLOT_0900_1110",
    label: "09:00 – 11:10",
    start: "09:00",
    end: "11:10",
  },
  {
    value: "SLOT_1130_1330",
    label: "11:30 – 13:30",
    start: "11:30",
    end: "13:30",
  },
  {
    value: "SLOT_1400_1600",
    label: "14:00 – 16:00",
    start: "14:00",
    end: "16:00",
  },
  {
    value: "SLOT_1630_1830",
    label: "16:30 – 18:30",
    start: "16:30",
    end: "18:30",
  },
  {
    value: "SLOT_1900_2110",
    label: "19:00 – 21:10",
    start: "19:00",
    end: "21:10",
  },
  {
    value: "SLOT_2130_2330",
    label: "21:30 – 23:30",
    start: "21:30",
    end: "23:30",
  },
];

function parseHHmm(str) {
  const [h, m] = str.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export default function ShowtimeForm({
  mode = "create",
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const [movieOpts, setMovieOpts] = useState([]);
  const [branchOpts, setBranchOpts] = useState([]);
  const [allTheaters, setAllTheaters] = useState([]);

  // watch fields
  const selectedBranch = Form.useWatch("branch", form);
  const selectedDate = Form.useWatch("dateOnly", form);
  const selectedSlot = Form.useWatch("timeSlot", form);

  useEffect(() => {
    (async () => {
      const mv = await listMovies({ page: 1, size: 1000 });
      setMovieOpts(
        (mv.items || []).map((m) => ({ value: m._id || m.id, label: m.title }))
      );

      const br = await listBranches({ page: 1, size: 1000 });
      setBranchOpts(
        (br.items || []).map((b) => ({ value: b._id || b.id, label: b.name }))
      );

      const th = await listTheaters({ page: 1, size: 1000 });
      const thItems = (th.items || th || []).map((t) => ({
        value: t._id || t.id,
        label: t.name,
        branchRef: t.branch?._id || t.branch?.id || t.branch,
      }));
      setAllTheaters(thItems);
    })();
  }, []);

  // filter theaters by branch
  useEffect(() => {
    if (!selectedBranch) {
      form.setFieldsValue({ theater: undefined });
      return;
    }
    const currentTheater = form.getFieldValue("theater");
    if (!currentTheater) return;
    const ok = allTheaters.some(
      (t) => t.value === currentTheater && t.branchRef === selectedBranch
    );
    if (!ok) form.setFieldsValue({ theater: undefined });
  }, [selectedBranch, allTheaters, form]);

  const theaterOpts = useMemo(() => {
    if (!selectedBranch) return [];
    return allTheaters.filter((t) => t.branchRef === selectedBranch);
  }, [allTheaters, selectedBranch]);

  // map edit values -> form
  useEffect(() => {
    if (!initialValues) {
      form.resetFields();
      return;
    }
    const st = initialValues.startTime ? dayjs(initialValues.startTime) : null;
    const et = initialValues.endTime ? dayjs(initialValues.endTime) : null;

    // đoán slot nếu trùng
    let guessedSlot;
    if (st && et) {
      const sHHmm = st.format("HH:mm");
      const eHHmm = et.format("HH:mm");
      guessedSlot = FIXED_TIME_SLOTS.find(
        (s) => s.start === sHHmm && s.end === eHHmm
      )?.value;
    }

    form.setFieldsValue({
      movie: initialValues.movie?._id || initialValues.movie,
      branch: initialValues.branch?._id || initialValues.branch,
      theater: initialValues.theater?._id || initialValues.theater,
      // dateOnly dùng để áp slot
      dateOnly: st ? st.startOf("day") : null,
      timeSlot: guessedSlot,
      // vẫn hiển thị picker giờ để override nếu muốn
      startTime: st,
      endTime: et,
      priceStandard: initialValues.price?.standard ?? undefined,
      priceVip: initialValues.price?.vip ?? undefined,
      priceCouple: initialValues.price?.couple ?? undefined,
      status: initialValues.status || "active",
    });
  }, [initialValues, form]);

  // khi chọn date/slot -> auto điền startTime/endTime
  useEffect(() => {
    if (!selectedDate || !selectedSlot) return;
    const slot = FIXED_TIME_SLOTS.find((s) => s.value === selectedSlot);
    if (!slot) return;

    const { h: sh, m: sm } = parseHHmm(slot.start);
    const { h: eh, m: em } = parseHHmm(slot.end);

    const start = dayjs(selectedDate)
      .hour(sh)
      .minute(sm)
      .second(0)
      .millisecond(0);
    const end = dayjs(selectedDate)
      .hour(eh)
      .minute(em)
      .second(0)
      .millisecond(0);

    form.setFieldsValue({ startTime: start, endTime: end });
  }, [selectedDate, selectedSlot, form]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const handleFinish = (v) => {
    // fallback: nếu start/end trống nhưng có date+slot thì tự tính
    let start = v.startTime,
      end = v.endTime;
    if ((!start || !end) && v.dateOnly && v.timeSlot) {
      const slot = FIXED_TIME_SLOTS.find((s) => s.value === v.timeSlot);
      if (slot) {
        const { h: sh, m: sm } = parseHHmm(slot.start);
        const { h: eh, m: em } = parseHHmm(slot.end);
        start = dayjs(v.dateOnly).hour(sh).minute(sm);
        end = dayjs(v.dateOnly).hour(eh).minute(em);
      }
    }

    const payload = {
      movie: v.movie,
      branch: v.branch,
      theater: v.theater,
      startTime: start?.toISOString(),
      endTime: end?.toISOString(),
      status: v.status || "active",
      price: {
        standard: Number(v.priceStandard || 0),
        vip: v.priceVip != null ? Number(v.priceVip) : undefined,
        couple: v.priceCouple != null ? Number(v.priceCouple) : undefined,
      },
      autoInitializeSeats: true,
    };
    onSubmit?.(payload);
  };

  const validateEndAfterStart = (_, value) => {
    const start = form.getFieldValue("startTime");
    if (!start || !value || value.isAfter(start)) return Promise.resolve();
    return Promise.reject(new Error("Kết thúc phải sau thời điểm bắt đầu"));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ status: "active" }}
    >
      <Form.Item
        label="Phim"
        name="movie"
        rules={[{ required: true, message: "Chọn phim" }]}
      >
        <Select
          showSearch
          placeholder="Chọn phim"
          options={movieOpts}
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item
        label="Chi nhánh"
        name="branch"
        rules={[{ required: true, message: "Chọn chi nhánh" }]}
      >
        <Select
          showSearch
          placeholder="Chọn chi nhánh"
          options={branchOpts}
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item
        label="Rạp/Phòng"
        name="theater"
        rules={[{ required: true, message: "Chọn rạp/phòng" }]}
      >
        <Select
          showSearch
          placeholder={
            selectedBranch ? "Chọn rạp/phòng" : "Chọn chi nhánh trước"
          }
          options={theaterOpts}
          optionFilterProp="label"
          disabled={!selectedBranch}
        />
      </Form.Item>

      {/* Khung giờ chiếu (fix cứng) */}
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="Ngày chiếu"
          name="dateOnly"
          rules={[{ required: true, message: "Chọn ngày chiếu" }]}
          tooltip="Chọn ngày rồi chọn khung giờ để tự đổ giờ bắt đầu/kết thúc"
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="Khung giờ"
          name="timeSlot"
          rules={[{ required: true, message: "Chọn khung giờ" }]}
        >
          <Select placeholder="Chọn khung giờ" options={FIXED_TIME_SLOTS} />
        </Form.Item>
      </div>

      {/* Vẫn cho chỉnh tay */}
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="Bắt đầu"
          name="startTime"
          rules={[{ required: true, message: "Chọn thời gian bắt đầu" }]}
        >
          <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
        </Form.Item>

        <Form.Item
          label="Kết thúc"
          name="endTime"
          rules={[
            { required: true, message: "Chọn thời gian kết thúc" },
            { validator: validateEndAfterStart },
          ]}
        >
          <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Form.Item
          label="Giá Standard"
          name="priceStandard"
          rules={[{ required: true, message: "Nhập giá Standard" }]}
        >
          <InputNumber
            className="w-full"
            min={0}
            step={1000}
            placeholder="80000"
          />
        </Form.Item>
        <Form.Item label="Giá VIP" name="priceVip">
          <InputNumber
            className="w-full"
            min={0}
            step={1000}
            placeholder="120000"
          />
        </Form.Item>
        <Form.Item label="Giá Couple" name="priceCouple">
          <InputNumber
            className="w-full"
            min={0}
            step={1000}
            placeholder="160000"
          />
        </Form.Item>
      </div>

      <Form.Item label="Trạng thái" name="status">
        <Select
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </Form.Item>

      <div className="flex justify-end gap-2 pt-2">
        <Space>
          <Button onClick={onCancel}>Huỷ</Button>
          <Button type="primary" htmlType="submit">
            {mode === "create" ? "Tạo" : "Lưu"}
          </Button>
        </Space>
      </div>
    </Form>
  );
}
