# Quản Lý Chi Tiêu Cá Nhân (Expense Tracker)

Một ứng dụng web đơn giản, hiện đại giúp bạn quản lý ngân sách, theo dõi chi tiêu hàng ngày và xem báo cáo trực quan.

## ✨ Tính năng chính

- **Quản lý ngân sách tháng**: Thiết lập số tiền mục tiêu cho mỗi tháng.
- **Ghi chép chi tiêu**: Lưu lại các khoản chi nhanh chóng (không cần mô tả rườm rà).
- **Chi tiêu định kỳ**: Tự động trừ tiền cho các khoản cố định (hàng ngày, hàng tuần, hàng tháng).
- **Danh mục tùy chỉnh**: Tự tạo, sửa, xóa các danh mục chi tiêu với màu sắc riêng.
- **Lịch sử chi tiết**: Xem danh sách chi tiêu được nhóm theo ngày với tổng tiền mỗi ngày.
- **Báo cáo trực quan**: Biểu đồ hình quạt (Pie Chart) và chi tiết chi tiêu theo danh mục.
- **Lưu trữ cục bộ**: Dữ liệu được lưu an toàn trên trình duyệt của bạn (LocalStorage).

## 🚀 Công nghệ sử dụng

- **React 19** + **TypeScript**
- **Vite** (Công cụ build nhanh)
- **Tailwind CSS** (Giao diện hiện đại)
- **Framer Motion** (Hiệu ứng chuyển động mượt mà)
- **Recharts** (Biểu đồ báo cáo)
- **Lucide React** (Bộ icon đẹp mắt)
- **Date-fns** (Xử lý thời gian)

## 🛠 Hướng dẫn cài đặt và chạy

### 1. Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên).

### 2. Cài đặt
Tải mã nguồn về hoặc clone từ GitHub, sau đó mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### 3. Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Sau đó mở trình duyệt tại địa chỉ: `http://localhost:3000`

### 4. Biên dịch để đưa lên Host (Build)
```bash
npm run build
```
Sau khi chạy xong, toàn bộ file chạy được sẽ nằm trong thư mục **`dist`**. Bạn chỉ cần upload nội dung thư mục này lên host (GitHub Pages, Vercel, Netlify, Hostinger...).

## 📝 Lưu ý khi đưa lên GitHub Pages
Nếu bạn muốn deploy lên GitHub Pages, hãy đảm bảo cập nhật `base` trong `vite.config.ts` nếu dự án không nằm ở root của domain.

---
Được tạo bởi [nfshop90](https://github.com/nfshop90)
