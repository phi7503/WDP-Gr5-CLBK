import { useEffect } from "react";
import { Button, Form, Input, InputNumber, Select } from "antd";

export default function BranchForm({
  mode = "create",
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    // Chỉ gửi các key có giá trị (tránh gửi null sai schema)
    const payload = Object.fromEntries(
      Object.entries({
        name: values.name?.trim(),
        address: values.address?.trim(),
        city: values.city?.trim(),
        phone: values.phone?.trim(),
        lat: values.lat ?? undefined,
        lng: values.lng ?? undefined,
        status: values.status || "active",
      }).filter(([, v]) => v !== undefined && v !== "")
    );
    onSubmit?.(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ status: "active" }}
      onFinish={handleFinish}
    >
      <Form.Item
        label="Tên chi nhánh"
        name="name"
        rules={[{ required: true, message: "Nhập tên chi nhánh" }]}
      >
        <Input placeholder="Ví dụ: CLBK – Cầu Giấy" />
      </Form.Item>

      <Form.Item label="Địa chỉ" name="address">
        <Input placeholder="Số nhà, đường, phường/xã..." />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Thành phố" name="city">
          <Input placeholder="Hà Nội / HCM / ..." />
        </Form.Item>
        <Form.Item label="Điện thoại" name="phone">
          <Input placeholder="0123456789" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Vĩ độ (lat)" name="lat">
          <InputNumber className="w-full" placeholder="21.028" step="0.0001" />
        </Form.Item>
        <Form.Item label="Kinh độ (lng)" name="lng">
          <InputNumber className="w-full" placeholder="105.852" step="0.0001" />
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
        <Button onClick={onCancel}>Huỷ</Button>
        <Button type="primary" htmlType="submit">
          {mode === "create" ? "Tạo" : "Lưu"}
        </Button>
      </div>
    </Form>
  );
}
