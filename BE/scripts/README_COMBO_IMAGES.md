# Hướng dẫn Set Ảnh Combo Thật

## Bạn có 2 ảnh thật:
1. **Ảnh 2 bắp rang** (2 Popcorn) - ✅ Đã được map
2. **Ảnh chai Pepsi 500mL** - ⚠️ Cần map

## Cách 1: Đặt ảnh vào thư mục và chạy script

1. **Đặt ảnh vào thư mục:**
   ```
   BE/uploads/combos/
   ```

2. **Đặt tên file chứa từ khóa:**
   - `pepsi-500ml.jpg` hoặc `pepsi.jpg` cho Pepsi
   - `popcorn-2.jpg` hoặc `2-popcorn.jpg` cho 2 Popcorn
   - `coca-cola.jpg` cho Coca Cola
   - `combo-doi.jpg` cho Combo Đôi
   - `combo-gia-dinh.jpg` cho Combo Gia Đình
   - `combo-nho.jpg` cho Combo Nhỏ

3. **Chạy script tự động:**
   ```bash
   node scripts/assignComboImages.js
   ```

## Cách 2: Set ảnh thủ công cho từng combo

```bash
# Set ảnh cho Pepsi
node scripts/setComboImage.js "Pepsi 500mL" "pepsi-500ml.jpg"

# Set ảnh cho 2 Popcorn
node scripts/setComboImage.js "2 Popcorn" "popcorn-2.jpg"

# Set ảnh cho Coca Cola
node scripts/setComboImage.js "Coca Cola 500mL" "coca-cola.jpg"
```

## Cách 3: Upload qua API

1. **Upload ảnh:**
   ```bash
   POST http://localhost:5000/api/upload/combo
   Content-Type: multipart/form-data
   Body: file (field name: "combo")
   ```

2. **Update combo với ảnh đã upload:**
   ```bash
   PUT http://localhost:5000/api/combos/:id
   Body: {
     "image": "uploads/combos/combo-xxxxx.jpg"
   }
   ```

## Kiểm tra ảnh đã hiển thị

1. **Xem URL ảnh:**
   ```
   http://localhost:5000/uploads/combos/[tên-file]
   ```

2. **Refresh trang combo trong frontend:**
   ```
   http://localhost:3000/combos
   ```

## Danh sách combo cần ảnh:

- ✅ 2 Popcorn - Đã có ảnh
- ⚠️ Pepsi 500mL - Cần đặt ảnh `pepsi-500ml.jpg`
- ⚠️ Coca Cola 500mL - Cần đặt ảnh `coca-cola.jpg`
- ⚠️ Combo Đôi - Cần đặt ảnh `combo-doi.jpg`
- ⚠️ Combo Gia Đình - Cần đặt ảnh `combo-gia-dinh.jpg`
- ⚠️ Bắp Rang Bơ Nhỏ - Có thể dùng ảnh popcorn
- ⚠️ Combo Nhỏ - Cần đặt ảnh `combo-nho.jpg`



