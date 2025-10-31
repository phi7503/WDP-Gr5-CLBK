# 📋 DANH SÁCH CÁC FILE LIÊN QUAN ĐẾN NOTIFICATION

## 🎨 **FILE THIẾT KẾ NOTIFICATION**

### 1. **`FE/src/styles/notification.css`** ⭐ CHÍNH
   - **Chức năng**: File CSS chính để thiết kế và tạo animation cho notification
   - **Nội dung chính**:
     - Style cho container và notification card
     - Animation "slide from right to left"
     - Màu sắc cho các loại notification (error, success, warning, info)
     - Responsive design cho mobile
   - **Vị trí**: `FE/src/styles/notification.css`

---

## 🔧 **FILE XỬ LÝ NOTIFICATION**

### 2. **`FE/src/services/notificationService.js`** ⭐ CHÍNH
   - **Chức năng**: Service để gọi và hiển thị notification từ bất kỳ đâu trong app
   - **Các function**:
     - `showErrorNotification(errorMessage)` - Hiển thị lỗi
     - `showSuccessNotification(message, description)` - Hiển thị thành công
     - `showWarningNotification(message, description)` - Hiển thị cảnh báo
   - **Vị trí**: `FE/src/services/notificationService.js`

### 3. **`FE/src/services/api.js`** 
   - **Chức năng**: Tự động hiển thị notification khi có lỗi API
   - **Vị trí**: `FE/src/services/api.js`
   - **Sử dụng**: Gọi `showErrorNotification()` từ `notificationService.js`

---

## 🏗️ **FILE CẤU HÌNH & SETUP**

### 4. **`FE/src/main.jsx`**
   - **Chức năng**: Entry point của app, cần import `notification.css`
   - **Cần thêm**: `import "./styles/notification.css";`
   - **Vị trí**: `FE/src/main.jsx`

### 5. **`FE/src/components/NotificationProvider.jsx`** (Optional)
   - **Chức năng**: React component provider cho notification context
   - **Ghi chú**: Hiện tại có thể không cần thiết nếu dùng static method
   - **Vị trí**: `FE/src/components/NotificationProvider.jsx`

---

## 📦 **FILE SỬ DỤNG NOTIFICATION**

### 6. **`FE/src/components/AuthPage.jsx`**
   - **Chức năng**: Trang đăng nhập/đăng ký
   - **Sử dụng**: Notification khi login/register lỗi (tự động từ `api.js`)

### 7. **`FE/src/components/RealTimeBookingPage.jsx`**
   - **Chức năng**: Trang đặt vé real-time
   - **Sử dụng**: Notification khi booking lỗi

### 8. **`FE/src/components/BookingPageModern.jsx`**
   - **Chức năng**: Trang đặt vé (modern version)
   - **Sử dụng**: Notification khi booking lỗi

---

## 🎯 **CÁCH SỬ DỤNG**

### Hiển thị notification từ component:
```javascript
import { showErrorNotification } from '../services/notificationService';

// Trong component
showErrorNotification('Thông báo lỗi');
```

### Notification tự động hiển thị khi:
- API call thất bại (tự động trong `api.js`)
- Lỗi 401, 403, 404, 500, etc.

---

## 📝 **GHI CHÚ**

- **Animation**: Slide từ phải sang trái
- **Vị trí**: Top-right corner (80px từ top, 24px từ right)
- **Duration**: 5 giây mặc định
- **Max count**: 3 notifications cùng lúc
- **Theme**: Dark với backdrop blur

