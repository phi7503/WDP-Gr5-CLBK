import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Select } from "antd";
import { listBranches } from "../../services/branches.service";

export default function TheaterForm({
  mode = "create",
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const br = await listBranches({ page: 1, size: 1000 });
        setBranches(
          (br.items || []).map((b) => ({ value: b._id || b.id, label: b.name }))
        );
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!initialValues) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const typeOptions = useMemo(
    () => [
      { value: "standard", label: "Standard" },
      { value: "vip", label: "VIP" },
      { value: "imax", label: "IMAX" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    []
  );

  const handleFinish = (values) => {
    // chỉ gửi các key có giá trị
    const payload = Object.fromEntries(
      Object.entries({
        name: values.name?.trim(),
        branchId: values.branchId,
        type: values.type || "standard",
        capacity:
          typeof values.capacity === "number"
            ? values.capacity
            : Number(values.capacity || 0),
        status: values.status || "active",
      }).filter(([, v]) => v !== undefined && v !== "")
    );
    onSubmit?.(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ type: "standard", status: "active" }}
    >
      <Form.Item
        label="Tên phòng chiếu"
        name="name"
        rules={[{ required: true, message: "Nhập tên phòng chiếu" }]}
      >
        <Input placeholder="Phòng 1 / Room A" />
      </Form.Item>

      <Form.Item
        label="Chi nhánh"
        name="branchId"
        rules={[{ required: true, message: "Chọn chi nhánh" }]}
      >
        <Select
          showSearch
          placeholder="Chọn chi nhánh"
          options={branches}
          optionFilterProp="label"
        />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Loại" name="type">
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item label="Sức chứa" name="capacity">
          <InputNumber className="w-full" min={0} placeholder="120" />
        </Form.Item>
      </div>

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
