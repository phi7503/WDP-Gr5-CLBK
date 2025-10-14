# 🎬 HƯỚNG DẪN THAY ĐỔI ẢNH NGANG CHO HERO CAROUSEL

## 📍 Vị trí cần thay đổi

File: `FE/src/components/HomePage.jsx`  
Dòng: **23-76** (trong phần `featuredMoviesSlider`)

---

## 🎯 Cách thay đổi ảnh ngang

### Bước 1: Tìm đến phần khai báo `featuredMoviesSlider`

```jsx
// ⭐ FEATURED MOVIES SLIDER - Danh sách phim nổi bật với ảnh ngang
// 🎬 THAY ĐỔI ẢNH NGANG TẠI ĐÂY
const featuredMoviesSlider = [
  {
    id: 1,
    title: "Vân Cờ Vây - The Match",
    backdropImage: "https://via.placeholder.com/1920x800/...", // 🔴 THAY ẢNH NGANG TẠI ĐÂY
    ...
  },
  ...
]
```

### Bước 2: Thay thế URL ảnh ngang

**Tìm dòng có comment `🔴 THAY ẢNH NGANG TẠI ĐÂY`**

Có 2 cách để thêm ảnh:

#### **Cách 1: Sử dụng ảnh từ Internet (URL)**
```jsx
backdropImage: "https://image.tmdb.org/t/p/original/yourBackdropImage.jpg"
```

#### **Cách 2: Sử dụng ảnh từ Backend**
1. Upload ảnh vào thư mục `BE/uploads/backdrops/`
2. Sử dụng đường dẫn:
```jsx
backdropImage: "http://localhost:5000/uploads/backdrops/van-co-vay-backdrop.jpg"
```

---

## 📐 Kích thước ảnh ngang khuyến nghị

- **Tỷ lệ khung hình**: 16:9 hoặc 21:9
- **Độ phân giải tốt nhất**: 
  - `1920x800px` (21:9) ✅ Khuyến nghị
  - `1920x1080px` (16:9) ✅ Tốt
  - `2560x1080px` (21:9 ultrawide) ✅ Rất đẹp

- **Kích thước file**: < 500KB (tối ưu cho tốc độ tải)
- **Định dạng**: JPG, PNG, WEBP

---

## 🎨 Nguồn lấy ảnh ngang chất lượng cao

### 1. **The Movie Database (TMDB)**
🔗 https://www.themoviedb.org/

**Cách lấy:**
1. Tìm kiếm phim trên TMDB
2. Vào tab "Backdrops" hoặc "Images"
3. Chọn ảnh backdrop (ảnh ngang)
4. Click chuột phải → Copy image address
5. Dán vào `backdropImage`

**Ví dụ:**
```jsx
backdropImage: "https://image.tmdb.org/t/p/original/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg"
```

### 2. **IMDb**
🔗 https://www.imdb.com/

### 3. **Unsplash / Pexels** (ảnh stock chất lượng cao)
🔗 https://unsplash.com/  
🔗 https://www.pexels.com/

---

## 🔧 Ví dụ thực tế

### Thêm phim "Avengers: Endgame"

```jsx
{
  id: 2,
  title: "Avengers: Endgame",
  backdropImage: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", // ✅ Ảnh từ TMDB
  description: "After the devastating events of Avengers: Infinity War...",
  rating: 9.2,
  duration: 181,
  genre: ["Action", "Adventure", "Sci-Fi"],
  releaseDate: "2024"
}
```

### Thêm phim "Inception"

```jsx
{
  id: 3,
  title: "Inception",
  backdropImage: "http://localhost:5000/uploads/backdrops/inception-backdrop.jpg", // ✅ Ảnh từ backend
  description: "A thief who steals corporate secrets...",
  rating: 9.0,
  duration: 148,
  genre: ["Action", "Sci-Fi", "Thriller"],
  releaseDate: "2024"
}
```

---

## 🎭 Thêm/Xóa phim khỏi slider

### Thêm phim mới:
```jsx
const featuredMoviesSlider = [
  // ... các phim hiện tại
  {
    id: 6, // ID mới
    title: "Tên phim mới",
    backdropImage: "URL_ảnh_ngang_của_bạn",
    description: "Mô tả phim...",
    rating: 8.5,
    duration: 120,
    genre: ["Action", "Drama"],
    releaseDate: "2024"
  }
];
```

### Xóa phim:
- Chỉ cần xóa toàn bộ object `{...}` của phim đó

---

## ⚙️ Tùy chỉnh nâng cao

### Thay đổi thời gian tự động chuyển slide

File: `FE/src/components/HomePage.jsx` - Dòng 82

```jsx
const interval = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % featuredMoviesSlider.length);
}, 5000); // 👈 Thay đổi 5000 (5 giây) thành số bạn muốn (đơn vị: milliseconds)
```

**Ví dụ:**
- `3000` = 3 giây
- `7000` = 7 giây
- `10000` = 10 giây

### Thay đổi hiệu ứng chuyển đổi

File: `FE/src/components/HomePage.jsx` - Dòng 174

```jsx
transition: 'opacity 1s ease-in-out', // 👈 Thay đổi tốc độ transition
```

---

## 🚀 Checklist sau khi thay đổi

- [ ] Đã thay tất cả `backdropImage` placeholder bằng ảnh thật
- [ ] Ảnh có tỷ lệ 16:9 hoặc 21:9
- [ ] Ảnh có độ phân giải tối thiểu 1920x800px
- [ ] File ảnh < 500KB (tối ưu tốc độ)
- [ ] Đã test trên browser, carousel hoạt động mượt
- [ ] Gradient overlay che phủ đủ để text dễ đọc

---

## 🎯 Kết quả

Sau khi thay đổi, bạn sẽ có:

✨ **Hero Carousel đẹp mắt với:**
- 5 phim featured (hoặc nhiều hơn nếu bạn thêm)
- Ảnh ngang full-width tuyệt đẹp
- Tự động chuyển slide mỗi 5 giây
- Nút Previous/Next để điều khiển
- Dots indicator ở dưới
- Smooth transitions

---

## 📞 Cần trợ giúp?

Nếu gặp vấn đề:
1. Kiểm tra console (F12) xem có lỗi không
2. Đảm bảo URL ảnh đúng và accessible
3. Nếu dùng ảnh local, check backend đang chạy

**Happy Coding! 🎉**

