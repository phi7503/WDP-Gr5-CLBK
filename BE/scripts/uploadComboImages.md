# Hướng dẫn Upload Ảnh Combo Thật

Vì các ảnh từ Pexels/Unsplash có thể không đúng với combo thật, bạn có thể tự upload ảnh thật cho từng combo.

## Cách 1: Upload qua API

1. **Upload ảnh qua endpoint:**
   ```
   POST /api/upload/combo
   Content-Type: multipart/form-data
   Body: file (field name: "combo")
   ```

2. **Update combo với ảnh đã upload:**
   ```
   PUT /api/combos/:id
   Body: {
     "image": "uploads/combos/combo-xxxxx.jpg"
   }
   ```

## Cách 2: Đặt ảnh trực tiếp vào thư mục

1. Đặt ảnh vào thư mục `BE/uploads/combos/`
2. Đặt tên file theo format: `combo-[tên-combo].jpg` (ví dụ: `combo-pepsi-500ml.jpg`)
3. Chạy script để update:
   ```bash
   node scripts/updateComboImagesFromFolder.js
   ```

## Cách 3: Sử dụng Admin Panel

1. Vào Admin Panel → Quản lý Combo
2. Chọn combo cần update
3. Click "Upload Ảnh" và chọn file ảnh
4. Lưu thay đổi

## Yêu cầu ảnh:

- **Format**: JPG, PNG, WebP
- **Kích thước**: Tối đa 5MB
- **Tỷ lệ**: 1:1 (vuông) hoặc 4:3
- **Độ phân giải**: Tối thiểu 800x800px

## Ảnh cần có cho từng combo:

1. **2 Popcorn**: Ảnh 2 hộp/bịch bắp rang lớn
2. **Pepsi 500mL**: Ảnh chai Pepsi 500ml thật
3. **Combo Đôi**: Ảnh 1 bắp rang + 2 nước ngọt cùng nhau
4. **Combo Gia Đình**: Ảnh 2 bắp rang + 2 nước + snack cùng nhau
5. **Bắp Rang Bơ Nhỏ**: Ảnh 1 bắp rang nhỏ
6. **Coca Cola 500mL**: Ảnh chai Coca Cola 500ml thật
7. **Combo Nhỏ**: Ảnh 1 bắp rang nhỏ + 1 nước ngọt cùng nhau



