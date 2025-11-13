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
    const name = values.name?.trim();
    const address = values.address?.trim();
    const city = values.city?.trim();
    const phone = values.phone?.trim();

    const hasCoords =
      values.lat !== undefined &&
      values.lat !== null &&
      values.lng !== undefined &&
      values.lng !== null;

    const location = {
      address,
      city,
      // Tạm dùng city làm province để thoả điều kiện required của backend
      province: city,
      ...(hasCoords && {
        coordinates: {
          latitude: Number(values.lat),
          longitude: Number(values.lng),
        },
      }),
    };

    const contact = {
      phone,
    };

    const isActive = (values.status || "active") === "active";

    const payload = {
      name,
      location,
      contact,
      isActive,
    };

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

      <Form.Item
        label="Địa chỉ"
        name="address"
        rules={[{ required: true, message: "Nhập địa chỉ" }]}
      >
        <Input placeholder="Số nhà, đường, phường/xã..." />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="Thành phố"
          name="city"
          rules={[{ required: true, message: "Nhập thành phố" }]}
        >
          <Input placeholder="Hà Nội / HCM / ..." />
        </Form.Item>
        <Form.Item
          label="Điện thoại"
          name="phone"
          rules={[{ required: true, message: "Nhập số điện thoại" }]}
        >
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
