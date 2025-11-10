import { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Form, InputNumber, Select } from "antd";
import dayjs from "dayjs";
import { listMovies } from "../../services/movies.service";
import { listTheaters } from "../../services/theaters.service";

export default function ShowtimeForm({
  mode = "create",
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [movieOpts, setMovieOpts] = useState([]);
  const [theaterOpts, setTheaterOpts] = useState([]);

  useEffect(() => {
    (async () => {
      const mv = await listMovies({ page: 1, size: 1000 });
      setMovieOpts(
        (mv.items || []).map((m) => ({ value: m._id || m.id, label: m.title }))
      );
      const th = await listTheaters({ page: 1, size: 1000 });
      setTheaterOpts(
        (th.items || []).map((t) => ({ value: t._id || t.id, label: t.name }))
      );
    })();
  }, []);

  useEffect(() => {
    if (!initialValues) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      ...initialValues,
      startTime: initialValues.startTime
        ? dayjs(initialValues.startTime)
        : null,
      endTime: initialValues.endTime ? dayjs(initialValues.endTime) : null,
    });
  }, [initialValues, form]);

  const statusOptions = useMemo(
    () => [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    []
  );

  const handleFinish = (v) => {
    const payload = {
      movieId: v.movieId,
      theaterId: v.theaterId,
      startTime: v.startTime?.toISOString(),
      endTime: v.endTime?.toISOString(),
      price: Number(v.price || 0),
      status: v.status || "active",
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
        name="movieId"
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
        label="Rạp/Phòng"
        name="theaterId"
        rules={[{ required: true, message: "Chọn rạp/phòng" }]}
      >
        <Select
          showSearch
          placeholder="Chọn rạp/phòng"
          options={theaterOpts}
          optionFilterProp="label"
        />
      </Form.Item>

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

      <Form.Item
        label="Giá vé"
        name="price"
        rules={[{ required: true, message: "Nhập giá" }]}
      >
        <InputNumber
          className="w-full"
          min={0}
          step={1000}
          placeholder="80000"
        />
      </Form.Item>

      <Form.Item label="Trạng thái" name="status">
        <Select options={statusOptions} />
      </Form.Item>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>Huỷ</Button>
        <Button type="primary" htmlType="submit">
          {mode === "create" ? "Tạo" : "Lưu"}
        </Button>
      </div>
    </Form>
  );
}
