# Hướng dẫn Setup và Chạy Ứng dụng Cinema Booking System

## Yêu cầu hệ thống

- Node.js (phiên bản 16 trở lên)
- MongoDB (đang chạy trên localhost:27017)
- npm hoặc yarn

## Bước 1: Cài đặt Backend

1. Mở terminal và di chuyển vào thư mục BE:

```bash
cd BE
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file `.env` trong thư mục BE với nội dung:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/cinema_booking
JWT_SECRET=your_jwt_secret_key_here_very_long_and_secure
ACCESS_TOKEN_SECRET=your_access_token_secret_here_very_long_and_secure
```

4. Chạy script seed để tạo dữ liệu mẫu:

```bash
npm run seed
```

5. Khởi động backend server:

```bash
npm start
```

Backend sẽ chạy trên http://localhost:5000

## Bước 2: Cài đặt Frontend

1. Mở terminal mới và di chuyển vào thư mục FE:

```bash
cd FE
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Khởi động frontend:

```bash
npm run dev
```

Frontend sẽ chạy trên http://localhost:3000

## Bước 3: Đăng nhập và Test

### Tài khoản mẫu được tạo:

1. **Admin Account:**

   - Email: admin@cinema.com
   - Password: 123456
   - Role: admin

2. **Employee Account:**

   - Email: employee@cinema.com
   - Password: 123456
   - Role: employee

3. **Customer Account:**
   - Email: customer@cinema.com
   - Password: 123456
   - Role: customer

### Cách test:

1. Đăng nhập với tài khoản employee hoặc admin
2. Bạn sẽ được chuyển hướng đến `/employee/dashboard`
3. Dashboard sẽ hiển thị:

   - Thống kê tổng quan (tổng vé, doanh thu, v.v.)
   - Danh sách vé gần đây
   - Menu điều hướng

4. Các trang employee có sẵn:
   - Dashboard: `/employee/dashboard`
   - Đặt vé cho khách: `/employee/book-ticket`
   - Quét QR vé: `/employee/qr-checkin`
   - Quản lý vé: `/employee/bookings`

## Cấu trúc API

### Authentication

- `POST /api/users/login` - Đăng nhập
- `POST /api/users/register` - Đăng ký

### Bookings (cho Employee)

- `GET /api/bookings/employee-all` - Lấy tất cả booking
- `GET /api/bookings/employee/:employeeId` - Lấy booking theo employee
- `POST /api/bookings` - Tạo booking mới
- `PUT /api/bookings/:id/payment` - Cập nhật trạng thái thanh toán

### QR Code

- `POST /api/bookings/verify-ticket` - Xác thực vé từ QR code
- `POST /api/bookings/check-in` - Check-in vé

## Troubleshooting

### Lỗi kết nối MongoDB:

- Đảm bảo MongoDB đang chạy trên localhost:27017
- Kiểm tra file .env có đúng MONGO_URI không

### Lỗi CORS:

- Backend đã cấu hình CORS cho localhost:3000
- Nếu vẫn lỗi, kiểm tra port frontend có đúng không

### Lỗi API không load được:

- Kiểm tra backend có chạy trên port 5000 không
- Kiểm tra file api.js có đúng baseURL không

## Dữ liệu mẫu được tạo:

- 3 users (admin, employee, customer)
- 2 movies (Avengers: Endgame, Spider-Man: No Way Home)
- 2 branches (CGV Vincom Center, CGV Crescent Mall)
- 2 theaters
- 2 showtimes
- 2 combos
- 1 voucher
- 2 sample bookings

Bây giờ bạn có thể test các tính năng employee dashboard với dữ liệu thực từ MongoDB!
