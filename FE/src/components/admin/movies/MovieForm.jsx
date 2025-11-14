import { useEffect } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;

export default function MovieForm({
  mode = "create",
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        releaseDate: initialValues.releaseDate
          ? dayjs(initialValues.releaseDate)
          : null,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    const genres =
      Array.isArray(values.genres) && values.genres.length > 0
        ? values.genres.filter(Boolean)
        : typeof values.genres === "string"
        ? values.genres
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const payload = {
      title: values.title?.trim(),
      description: values.description?.trim() || "",
      duration: values.duration ?? null,
      // BE dùng field "genre"
      genre: genres,
      releaseDate: values.releaseDate
        ? values.releaseDate.format("YYYY-MM-DD")
        : null,
      // Trùng với BE: now-showing / coming-soon / ended
      status: values.status || "coming-soon",
    };

    onSubmit?.(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ status: "coming-soon" }}
    >
      <Form.Item
        label="Tiêu đề"
        name="title"
        rules={[{ required: true, message: "Nhập tiêu đề phim" }]}
      >
        <Input placeholder="Ví dụ: The Dark Knight" />
      </Form.Item>

      <Form.Item label="Mô tả" name="description">
        <TextArea rows={4} placeholder="Tóm tắt nội dung..." />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Thời lượng (phút)" name="duration">
          <InputNumber min={0} className="w-full" placeholder="120" />
        </Form.Item>

        <Form.Item label="Ngày khởi chiếu" name="releaseDate">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </div>

      <Form.Item label="Thể loại" name="genres">
        <Select
          mode="tags"
          tokenSeparators={[","]}
          placeholder="Nhập và nhấn Enter (ví dụ: Action, Drama)"
        />
      </Form.Item>

      <Form.Item label="Trạng thái" name="status">
        <Select
          options={[
            { value: "now-showing", label: "Đang chiếu" },
            { value: "coming-soon", label: "Sắp chiếu" },
            { value: "ended", label: "Ngừng chiếu" },
          ]}
        />
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
