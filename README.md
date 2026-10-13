# 🛒 TechStore - Dự án Shop Bán Hàng Online & DevOps CI/CD

> **Môn học**: DevOps - Khoa Công Nghệ Thông Tin - Đại học Đông Á  
> **Dự án**: `TechStore` (Cửa hàng thiết bị công nghệ trực tuyến & Tự động hóa CI/CD với Docker Compose, GitHub Actions, AWS EC2)

---

## 📌 1. Giới thiệu Dự án

**TechStore** là ứng dụng Web thương mại điện tử chuyên cung cấp thiết bị công nghệ (MacBook, iPhone, Tai nghe, Bàn phím cơ, Smartwatch...), được kiến trúc theo mô hình Full-Stack hiện đại:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, TypeScript.
- **Backend**: Node.js, Express, Mongoose ORM.
- **Database**: MongoDB (chạy container hóa với Docker Volume lưu trữ dữ liệu vĩnh viễn).
- **Tính năng nổi bật**:
  - 🛍️ Duyệt sản phẩm theo danh mục (*Điện thoại, Laptop & PC, Phụ kiện, Âm thanh, Smart Home*).
  - 🔍 Tìm kiếm thời gian thực & Lọc sản phẩm theo giá, đánh giá sao.
  - 🛒 **Giỏ hàng tương tác**: Thêm, bớt, xóa sản phẩm, áp dụng mã giảm giá `DEVOPS10`.
  - 💳 **Quy trình Thanh toán**: Tạo đơn hàng thực tế lưu vào cơ sở dữ liệu MongoDB.
  - ⚙️ **Trang Quản trị (Admin Panel)**: Quản lý sản phẩm, tài khoản người dùng, đơn hàng với đầy đủ thao tác CRUD và bảo mật.
- **Hạ tầng DevOps**:
  - 🐳 **Docker Multi-stage & Compose**: Đóng gói Frontend (Nginx), Backend (Node.js), và MongoDB trong cùng một hệ thống mạng `techstore-network`.
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
- MongoDB: `localhost:27017`

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
│   │   │   ├── db.js               # Kết nối Mongoose tới MongoDB
│   │   │   └── seed.js             # Dữ liệu khởi tạo mẫu tự động cho MongoDB
│   │   ├── controllers/
│   │   │   ├── authController.js   # Xử lý xác thực & quản lý tài khoản người dùng
│   │   │   ├── orderController.js  # Xử lý đơn hàng
│   │   │   └── productController.js# Xử lý danh mục & sản phẩm
│   │   ├── models/
│   │   │   ├── Order.js            # Mongoose Schema Đơn hàng (Khóa ngoại: userId -> Users)
│   │   │   ├── OrderItem.js        # Mongoose Schema Chi tiết đơn hàng (Khóa ngoại: orderId, productId)
│   │   │   ├── Product.js          # Mongoose Schema Sản phẩm (Khóa chính: id)
│   │   │   ├── Review.js           # Mongoose Schema Đánh giá sản phẩm (Khóa ngoại: productId, userId)
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
│   │   ├── AdminPanel.tsx          # Bảng điều khiển quản trị viên
│   │   ├── CartPage.tsx            # Trang chi tiết giỏ hàng
│   │   └── ProductDetailPage.tsx   # Trang chi tiết sản phẩm
│   ├── data/
│   │   ├── products.ts             # TypeScript Type definitions sản phẩm
│   │   └── users.ts                # TypeScript Type definitions người dùng
│   ├── services/
│   │   └── api.ts                  # Axios/Fetch API client kết nối Backend
│   ├── App.tsx                     # Component chính ứng dụng
│   ├── main.tsx                    # Entry point React
│   └── index.css                   # Tailwind styles
├── docker-compose.yml              # Cấu hình đa container (Frontend, Backend, MongoDB)
├── Dockerfile                      # Multi-stage Dockerfile cho Frontend (React + Nginx)
├── nginx.conf                      # Cấu hình Nginx reverse proxy
├── package.json                    # Cấu hình Frontend dependencies & scripts
├── tsconfig.json                   # Cấu hình TypeScript
└── vite.config.ts                  # Cấu hình Vite & API Proxy
```
