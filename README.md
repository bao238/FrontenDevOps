# 📚 BookStore - Nhà Sách Trực Tuyến & DevOps CI/CD Pipeline

> **Môn học**: DevOps & Cloud Computing - Khoa Công Nghệ Thông Tin - Đại học Đông Á  
> **Dự án**: `BookStore` (Hệ thống thương mại điện tử Nhà Sách Trực Tuyến & Tự động hóa CI/CD với Docker Compose, GitHub Actions, AWS EC2)

---

## 📌 1. Giới thiệu Dự án

**BookStore** là nền tảng thương mại điện tử chuyên cung cấp các đầu sách Bestseller trong nước và quốc tế (Văn học, Kinh tế, Kỹ năng sống, Công nghệ lập trình, Khoa học và Sách thiếu nhi), được xây dựng theo kiến trúc Full-Stack hiện đại:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, TypeScript.
- **Backend**: Node.js, Express, Mongoose ORM.
- **Database**: MongoDB (chạy container hóa với Docker Volume lưu trữ dữ liệu vĩnh viễn `bookstore-mongo-data`).
- **Tính năng nghiệp vụ nổi bật**:
  - 📖 **Duyệt sách theo 6 thể loại chuẩn hóa**: *Văn học - Tiểu thuyết, Kinh tế - Kinh doanh, Kỹ năng sống, Công nghệ - Lập trình, Khoa học - Triết học, Thiếu nhi*.
  - 🔍 **Tìm kiếm sách & Lọc đa tiêu chí**: Tìm kiếm tựa sách thời gian thực, lọc theo thể loại, sắp xếp giá bán và điểm đánh giá độc giả.
  - 📑 **Thông tin tác phẩm chi tiết**: Hiển thị bảng thông tin Tác giả, Nhà xuất bản, Năm xuất bản, Số trang, Hình thức bìa, Mã ISBN.
  - ⭐ **Hệ thống Đánh giá & Phê bình văn học**: Độc giả có thể đọc nhận xét và viết cảm nhận thực tế lưu trực tiếp vào collection `reviews` trong MongoDB.
  - 🛒 **Giỏ sách & Ưu đãi độc quyền**: Thêm sách vào giỏ, cập nhật số lượng, áp dụng mã voucher `BOOKWORM10` hoặc `DEVOPS10` (-10%).
  - 💳 **Quy trình Thanh toán & Đơn hàng**: Tạo đơn hàng lưu vào MongoDB kèm bảng riêng `order_items` chi tiết.
  - ⚙️ **Trang Quản trị (Admin Console)**: Quản lý danh mục sách, quản lý độc giả/nhân viên, theo dõi và cập nhật trạng thái đơn hàng.
- **Hạ tầng DevOps**:
  - 🐳 **Docker Multi-stage & Compose**: Đóng gói Frontend (Nginx), Backend (Node.js), và MongoDB trong cùng một hệ thống mạng `bookstore-network`.
  - 🔄 **GitHub Actions CI/CD**: Tự động hóa quy trình build Docker image, push lên Docker Hub, và SSH triển khai tự động lên AWS EC2 khi push vào nhánh `main`.
  - ☁️ **AWS EC2**: Triển khai trực tiếp trên máy chủ đám mây AWS.

---

## 🛠️ 2. Hướng dẫn Khởi chạy Local (Môi trường phát triển)

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng)
```bash
# Khởi động toàn bộ Frontend, Backend, và MongoDB
docker-compose up -d --build

# Xem logs hoạt động
docker-compose logs -f

# Dừng hệ thống container
docker-compose down
```
- Frontend: [http://localhost:3000](http://localhost:3000) (hoặc cổng 80)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- MongoDB: `localhost:27017/bookstore`

### Cách 2: Chạy trực tiếp với Node.js & Vite
```bash
# 1. Chạy Backend
cd backend
npm install
npm run dev

# 2. Chạy Frontend (ở terminal khác tại thư mục gốc)
npm install
npm run dev
```

---

## 📂 3. Cấu trúc Thư mục Dự án

```
LTDevOps/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Pipeline CI/CD GitHub Actions (Build, Push & SSH Deploy EC2)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Kết nối Mongoose tới MongoDB (Database: bookstore)
│   │   │   └── seed.js             # Dữ liệu khởi tạo 18 cuốn sách Bestseller, users, reviews, orders
│   │   ├── controllers/
│   │   │   ├── authController.js   # Xử lý xác thực & quản lý tài khoản người dùng
│   │   │   ├── orderController.js  # Xử lý đơn mua sách & chi tiết order_items
│   │   │   └── productController.js# Xử lý danh mục sách & đánh giá độc giả
│   │   ├── models/
│   │   │   ├── Order.js            # Mongoose Schema Đơn hàng (Khóa ngoại: userId -> Users)
│   │   │   ├── OrderItem.js        # Mongoose Schema Chi tiết đơn sách (Khóa ngoại: orderId, productId)
│   │   │   ├── Product.js          # Mongoose Schema Cuốn sách (Khóa chính: id)
│   │   │   ├── Review.js           # Mongoose Schema Đánh giá sách (Khóa ngoại: productId, userId)
│   │   │   └── User.js             # Mongoose Schema Người dùng (Khóa chính: id)
│   │   └── server.js               # Express Server & REST API endpoints
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                  # Dockerfile đóng gói Backend REST API
│   └── package.json
├── public/
│   ├── default-avatar.png
│   └── images/
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx          # Bảng điều khiển quản trị viên nhà sách
│   │   ├── CartPage.tsx            # Trang chi tiết giỏ sách & gợi ý tác phẩm
│   │   └── ProductDetailPage.tsx   # Trang chi tiết cuốn sách, trích dẫn & nhận xét
│   ├── data/
│   │   ├── products.ts             # TypeScript Type definitions sách & thể loại
│   │   └── users.ts                # TypeScript Type definitions người dùng
│   ├── services/
│   │   └── api.ts                  # Axios/Fetch API client kết nối Backend
│   ├── App.tsx                     # Component chính ứng dụng Nhà Sách
│   ├── main.tsx                    # Entry point React
│   └── index.css                   # Tailwind styles
├── docker-compose.yml              # Cấu hình đa container (Frontend, Backend, MongoDB)
├── Dockerfile                      # Multi-stage Dockerfile cho Frontend (React + Nginx)
├── nginx.conf                      # Cấu hình Nginx reverse proxy
├── package.json                    # Cấu hình Frontend dependencies & scripts
├── tsconfig.json                   # Cấu hình TypeScript
└── vite.config.ts                  # Cấu hình Vite & API Proxy
```

---

## 🗄️ 4. Danh sách API Endpoints Chính

| Phương thức | Đường dẫn API | Mô tả chức năng |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra tình trạng server & kết nối MongoDB |
| `GET` | `/api/products` | Lấy danh sách toàn bộ các đầu sách |
| `GET` | `/api/products/:id` | Xem chi tiết 1 cuốn sách theo mã |
| `POST` | `/api/products` | Thêm đầu sách mới (Admin) |
| `PUT` | `/api/products/:id` | Cập nhật thông tin sách (Admin) |
| `DELETE` | `/api/products/:id` | Xóa sách khỏi hệ thống (Admin) |
| `GET` | `/api/products/:id/reviews` | Lấy nhận xét & đánh giá của cuốn sách |
| `POST` | `/api/products/:id/reviews` | Gửi đánh giá và điểm số (1-5 sao) |
| `GET` | `/api/orders` | Danh sách đơn hàng mua sách |
| `POST` | `/api/orders` | Đặt mua sách (Lưu Orders và OrderItems) |
| `POST` | `/api/auth/login` | Đăng nhập tài khoản độc giả / Admin |
| `POST` | `/api/auth/register` | Đăng ký tài khoản độc giả mới |
