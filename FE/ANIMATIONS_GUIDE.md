# 🎬 HƯỚNG DẪN SỬ DỤNG ANIMATIONS - CINEMA BOOKING SYSTEM

## 📋 Tổng quan

Hệ thống đã được tích hợp **đầy đủ** các animations theo spec Netflix/Disney+ style với:

- ✅ Hero Carousel với ảnh ngang + Auto-play
- ✅ Stagger animations cho movie cards
- ✅ Glow effects & Shimmer effects
- ✅ Fire flicker animation cho trending badges
- ✅ Smooth transitions & Parallax scrolling
- ✅ Toast notifications
- ✅ Modal animations
- ✅ Loading states
- ✅ Responsive & Performance optimized
- ✅ Reduced motion support

---

## 🎨 CÁC ANIMATIONS ĐÃ IMPLEMENT

### 1. HOMEPAGE ANIMATIONS

#### A. Hero Carousel
- **Auto-play**: Chuyển slide mỗi 5 giây
- **Backdrop zoom**: Scale 1.1 → 1 khi load
- **Content slide in**: Từ phải vào trái
- **Navigation dots**: Animated width expansion
- **Arrow buttons**: Hover scale + glow effect

#### B. Movie Cards  
- **Entrance**: Stagger fadeInUp (mỗi card delay 100ms)
- **Hover**: Scale 1.05 + translateY(-8px) + glow shadow
- **Glow effect**: Radial gradient với pulse animation
- **Image**: Brightness & saturation increase khi hover

#### C. Trending Section
- **Fire badge**: Flicker animation (2s infinite)
- **Glow pulse**: Box-shadow animation cho trending cards
- **Float effect**: Fire icon di chuyển lên xuống

#### D. Combo Cards
- **Shimmer effect**: Diagonal shine chạy qua khi hover
- **Transform**: Scale + translateY khi hover
- **Border glow**: Gradient border xuất hiện

#### E. Trailer Cards
- **Play button**: Pulse animation (1.5s infinite)
- **Hover**: Scale 1.15 + glow shadow
- **Overlay**: Gradient tối hơn khi hover

### 2. GLOBAL ANIMATIONS

#### A. Scroll Animations
- **Fade In Up**: Opacity 0→1 + translateY 50px→0
- **Fade In Left/Right**: Lateral entrance
- **Scale In**: Scale 0.8→1 with fade

#### B. Button Effects
- **Shine effect**: Gradient chạy từ trái sang phải
- **Hover**: Scale + shadow transformation
- **Active**: Scale 0.98

#### C. Loading States
- **Skeleton**: Shimmer effect với gradient
- **Spinner**: Rotate 360deg infinite
- **Progress bar**: Width 0→100%

#### D. Toasts
- **Enter**: Slide from right + fade in
- **Exit**: Slide to right + fade out
- **Progress**: Auto-dismiss bar animation

#### E. Modals
- **Backdrop**: Fade in + blur
- **Content**: Slide up + scale with bounce
- **Close**: Reverse animation

---

## 📁 CẤU TRÚC FILES

```
FE/
  src/
    animations.css        ← Tất cả animations advanced
    style.css             ← Base styles + basic animations
    main.jsx              ← Import animations.css
    components/
      HomePage.jsx        ← Hero carousel + sections
      MovieCard.jsx       ← Card component với badges
```

---

## 🖼️ HƯỚNG DẪN ĐẶT ẢNH NGANG

### Bước 1: Chuẩn bị ảnh

**Kích thước khuyến nghị:**
- **1920x800px** (tỷ lệ 21:9) - TỐT NHẤT
- **1920x1080px** (tỷ lệ 16:9) - Tốt
- **Dung lượng**: < 500KB (nén JPEG quality 80-85)

**Định dạng**: JPG, PNG, WEBP

### Bước 2: Đặt ảnh vào Backend

```
BE/
  uploads/
    backdrops/
      van.jpg              ← Đặt ảnh vào đây
      avengers.jpg
      inception.jpg
      interstellar.jpg
      dark-knight.jpg
```

### Bước 3: Cập nhật đường dẫn

File: `FE/src/components/HomePage.jsx` (dòng 25-76)

```jsx
const featuredMoviesSlider = [
  {
    id: 1,
    title: "Vân Cờ Vây - The Match",
    backdropImage: "http://localhost:5000/uploads/backdrops/van.jpg", // 👈 Thay đổi tại đây
    description: "...",
    rating: 8.5,
    duration: 130,
    genre: ["Action", "Crime", "Drama"],
    releaseDate: "2024"
  },
  // ... thêm phim khác
];
```

### Bước 4: Test

1. Start backend: `cd BE && npm start`
2. Start frontend: `cd FE && npm run dev`
3. Mở browser: `http://localhost:3000`
4. Check carousel hoạt động và ảnh hiển thị đúng

---

## 🎯 TÙYCHỈNH ANIMATIONS

### Thay đổi thời gian auto-play

**File**: `HomePage.jsx` - dòng 79

```jsx
const interval = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % featuredMoviesSlider.length);
}, 5000); // 👈 Thay đổi 5000 (5 giây) thành số khác
```

### Thay đổi tốc độ animation

**File**: `animations.css`

Tìm animation bạn muốn thay đổi và sửa `duration`:

```css
.movie-card-wrapper {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  /*                    ↑ Thay đổi thời gian tại đây */
}
```

### Tắt animations trên mobile

**File**: `animations.css` (line 400+)

Đã có sẵn responsive rules để tối ưu performance mobile.

---

## 🔥 CÁC CLASS ANIMATIONS CÓ SẴN

### Entrance Animations
```jsx
<div className="movie-card-wrapper">  {/* Fade in up with stagger */}
<div className="scroll-reveal">       {/* Scroll-triggered reveal */}
<div className="section-header">      {/* Header with underline */}
```

### Effects
```jsx
<div className="trending-badge">      {/* Fire flicker animation */}
<div className="combo-card">          {/* Shimmer on hover */}
<div className="trailer-card">        {/* Play button pulse */}
```

### Interactive
```jsx
<button className="hero-button-primary">    {/* Shine effect */}
<button className="movie-book-button">      {/* Shine effect */}
```

### Loading
```jsx
<div className="skeleton">            {/* Shimmer loading */}
<div className="toast-notification">  {/* Slide in/out */}
```

---

## 📊 PERFORMANCE

### Đã tối ưu
- ✅ GPU acceleration với `transform` và `opacity`
- ✅ `will-change` chỉ khi cần
- ✅ `backface-visibility: hidden`
- ✅ Tắt complex animations trên mobile
- ✅ Reduced motion support
- ✅ Debounced scroll events

### Best Practices
```css
/* ✅ TỐT - GPU accelerated */
transform: translateX(100px);
opacity: 0.5;

/* ❌ TRÁNH - Trigger layout reflow */
margin-left: 100px;
height: 200px;
```

---

## 🎨 CUSTOM ANIMATIONS

### Tạo animation mới

**Bước 1**: Định nghĩa keyframe trong `animations.css`

```css
@keyframes myCustomAnimation {
  from {
    opacity: 0;
    transform: rotate(0deg) scale(0.5);
  }
  to {
    opacity: 1;
    transform: rotate(360deg) scale(1);
  }
}
```

**Bước 2**: Áp dụng vào element

```css
.my-element {
  animation: myCustomAnimation 1s ease-out forwards;
}
```

**Bước 3**: Sử dụng trong component

```jsx
<div className="my-element">
  Content here
</div>
```

---

## 🐛 TROUBLESHOOTING

### Ảnh không hiển thị?
1. Check backend đang chạy: `http://localhost:5000`
2. Test URL trực tiếp: `http://localhost:5000/uploads/backdrops/van.jpg`
3. Check file name đúng (case-sensitive)
4. Check CORS settings trong `BE/server.js`

### Animations không chạy?
1. Check `animations.css` đã được import trong `main.jsx`
2. Check browser console có lỗi không
3. Thử hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
4. Check reduced motion không bật: Settings → Accessibility

### Performance chậm?
1. Giảm số lượng animated elements cùng lúc
2. Tắt glow effects trên mobile
3. Giảm stagger delay
4. Nén ảnh backdrop < 300KB

---

## 📱 RESPONSIVE

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile adjustments
```css
@media (max-width: 768px) {
  /* Faster animations */
  .movie-card-wrapper {
    animation-duration: 0.4s; /* Giảm từ 0.6s */
  }
  
  /* Disable expensive effects */
  .movie-card::before {
    display: none; /* Tắt glow effect */
  }
}
```

---

## 🎓 TÀI LIỆU THAM KHẢO

### Cubic Bezier Easings
- `ease-out`: cubic-bezier(0, 0, 0.2, 1) - Natural deceleration
- `ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1) - Smooth both ends
- `bounce`: cubic-bezier(0.34, 1.56, 0.64, 1) - Playful overshoot

### Animation Properties
```css
animation: name duration timing-function delay iteration-count direction fill-mode;
```

**Ví dụ:**
```css
animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s 1 normal both;
/*         ↑name   ↑dur   ↑easing                      ↑delay ↑count ↑fill */
```

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] Đã đặt ảnh vào `BE/uploads/backdrops/`
- [ ] Đã cập nhật `backdropImage` trong `HomePage.jsx`
- [ ] Backend đang chạy ở port 5000
- [ ] Frontend đang chạy ở port 3000
- [ ] Carousel tự động chuyển sau 5 giây
- [ ] Hover effects hoạt động mượt mà
- [ ] Animations không lag trên mobile
- [ ] Ảnh load nhanh (< 500KB)

---

## 🚀 NEXT STEPS

1. **Thêm ảnh thật** cho tất cả 5 featured movies
2. **Test trên nhiều browsers** (Chrome, Firefox, Safari, Edge)
3. **Optimize ảnh** bằng tools như TinyPNG, ImageOptim
4. **Deploy backend** để có production URLs
5. **Implement lazy loading** cho ảnh nếu cần

---

**Happy Coding! 🎉**

Nếu cần hỗ trợ thêm, check console hoặc liên hệ dev team.

