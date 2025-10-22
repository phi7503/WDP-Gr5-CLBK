# Hướng dẫn Test Employee Dashboard (Không cần Auth)

## ✅ Đã tắt Authentication

Tôi đã tạm thời tắt authentication để bạn có thể test dễ dàng hơn:

### Backend:

- Tất cả API endpoints đều bypass authentication trong development mode
- User mặc định được tạo: `employee@cinema.com` với role `employee`

### Frontend:

- Không cần đăng nhập
- API calls không cần token

## 🚀 Cách Test:

### 1. Chạy Backend:

```bash
cd BE
npm start
```

### 2. Chạy Frontend:

```bash
cd FE
npm run dev
```

### 3. Truy cập Employee Dashboard:

- Mở browser và vào: `http://localhost:3000/employee/dashboard`
- Không cần đăng nhập, sẽ tự động load dữ liệu

### 4. Test các trang Employee:

- Dashboard: `http://localhost:3000/employee/dashboard`
- Bookings: `http://localhost:3000/employee/bookings`
- Book Ticket: `http://localhost:3000/employee/book-ticket`
- QR Checkin: `http://localhost:3000/employee/qr-checkin`

## 📊 Dữ liệu Test:

Nếu chưa có dữ liệu, chạy:

```bash
cd BE
npm run seed
```

Điều này sẽ tạo:

- 3 users (admin, employee, customer)
- 2 movies
- 2 branches và theaters
- 2 showtimes
- Sample bookings

## 🔧 API Endpoints có thể test:

- `GET http://localhost:5000/api/bookings/employee-all` - Lấy tất cả booking
- `GET http://localhost:5000/api/bookings/employee/507f1f77bcf86cd799439011` - Lấy booking theo employee
- `POST http://localhost:5000/api/bookings/verify-ticket` - Verify QR code
- `POST http://localhost:5000/api/bookings/check-in` - Check-in ticket

## ⚠️ Lưu ý:

- Authentication chỉ bị tắt trong development mode
- Khi deploy production, nhớ bật lại authentication
- User ID mặc định: `507f1f77bcf86cd799439011`

Bây giờ bạn có thể test tất cả tính năng employee mà không cần đăng nhập!
