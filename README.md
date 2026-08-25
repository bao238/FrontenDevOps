# 🛒 TechStore - Dự án Shop Bán Hàng Online (Next.js & DevOps CI/CD)

> **Môn học**: DevOps - Khoa Công Nghệ Thông Tin - Đại học Đông Á  
> **Dự án**: `TechStore` (Cửa hàng thiết bị công nghệ trực tuyến & Tự động hóa CI/CD với Docker, GitHub Actions, Render)

---

## 📌 1. Giới thiệu Dự án

**TechStore** là ứng dụng Web thương mại điện tử chuyên cung cấp thiết bị công nghệ (MacBook, iPhone, Tai nghe, Bàn phím cơ, Smartwatch...), được xây dựng bằng:
- **Frontend Stack**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons.
- **Tính năng nổi bật**:
  - 🛍️ Duyệt sản phẩm theo danh mục (*Điện thoại, Laptop & PC, Phụ kiện, Âm thanh, Smart Home*).
  - 🔍 Tìm kiếm thời gian thực & Sắp xếp theo giá, đánh giá sao.
  - 🛒 **Giỏ hàng tương tác (Slide-over drawer)**: Tăng/giảm số lượng, xóa món hàng, nhập coupon `DEVOPS10` giảm 10%.
  - 💳 **Quy trình Thanh toán (Checkout Modal)**: Nhập thông tin giao hàng, chọn phương thức COD/Chuyển khoản QR, tạo mã đơn hàng tự động.
  - ⚡ **Xem chi tiết sản phẩm**: Xem bảng thông số kỹ thuật, đánh giá và tình trạng kho.
- **Hạ tầng DevOps**:
  - 🐳 **Docker Multi-stage**: Đóng gói container 2 giai đoạn (Builder & Runner) siêu nhẹ, an toàn.
  - 🔄 **GitHub Actions CI/CD**: Tự động build và push image lên Docker Hub mỗi khi push vào nhánh `main`.
  - ☁️ **Render Cloud**: Triển khai trực tiếp Web Service miễn phí với HTTPS tự động.

---

## 🛠️ 2. Hướng dẫn Chạy Local (Môi trường phát triển)

### Cách 1: Chạy trực tiếp với Node.js
```bash
# Cài đặt thư viện
npm install

# Khởi chạy server phát triển
npm run dev
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### Cách 2: Chạy với Docker Compose
```bash
# Build và chạy container
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng container
docker-compose down
```
Truy cập tại: [http://localhost:3000](http://localhost:3000)

---

## 🚀 3. Hướng dẫn Triển khai (Deploy) Lên Render Từng Bước

### Bước 1: Khởi tạo Git & Push lên GitHub
1. Mở terminal tại thư mục dự án (`d:/Nam4/LTDevOps`):
```bash
git init
git add .
git commit -m "feat: techstore e-commerce app with docker and github actions"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

### Bước 2: Tạo Token trên Docker Hub
1. Truy cập [Docker Hub](https://hub.docker.com/) và đăng nhập.
2. Nhấp vào Avatar góc phải ➔ Chọn **Account settings** ➔ Mục **Personal access tokens**.
3. Chọn **Generate new token**:
   - **Description**: `GitHub_Actions_TechStore`
   - **Permissions**: `Read & Write`
4. Copy mã Access Token vừa tạo.

---

### Bước 3: Cấu hình Secrets trên GitHub Repository
1. Trên GitHub Repo của bạn, vào mục:  
   **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ Nhấp **New repository secret**.
2. Thêm 2 Secrets sau:
   - `DOCKER_USERNAME`: Tên tài khoản Docker Hub của bạn (ví dụ: `boyka74` hoặc `your_username`).
   - `DOCKER_PASSWORD`: Personal Access Token vừa lấy ở Bước 2.

> Sau khi cấu hình xong, mỗi khi bạn `git push` lên nhánh `main`, GitHub Actions sẽ tự động kích hoạt workflow build & push Docker image lên Docker Hub!

---

### Bước 4: Triển khai trên Render Web Service (Render.com)

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/).
2. Nhấp vào nút **+ New** (góc phải trên cùng) ➔ Chọn **Web Service**.
3. Chọn phương thức:
   - **Cách A (Kết nối GitHub Repo - Khuyên dùng)**: Chọn mục **Git Provider** ➔ Chọn repository GitHub bạn vừa push code lên. Render sẽ tự động nhận diện `Dockerfile` và tiến hành build.
   - **Cách B (Dùng Docker Image)**: Chọn tab **Existing Image** ➔ Điền: `docker.io/<your_docker_username>/vtabs_socibot_front_end:latest`.
4. Tại mục **Instance Type**: Chọn gói **Free ($0/month)**.
5. Nhấp nút **Deploy Web Service** (hoặc **Create Web Service**).
6. Đợi 1-3 phút để Render build & deploy container. Bạn sẽ nhận được đường link web trực tuyến dạng:  
   `https://techstore-devops.onrender.com`

---

## 📂 4. Cấu trúc Thư mục

```
LTDevOps/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Workflow CI/CD GitHub Actions
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Giao diện khung, header, footer & metadata TechStore
│   │   ├── page.tsx          # Trang chủ Shop bán hàng online, Giỏ hàng, Checkout & DevOps Status
│   │   └── globals.css       # Tailwind CSS style
│   └── data/
│       └── products.ts       # Danh sách sản phẩm mẫu & thông số kỹ thuật
├── Dockerfile                # Multi-stage Dockerfile tối ưu
├── docker-compose.yml        # Docker compose quản lý container
├── .dockerignore             # Bỏ qua files không cần thiết khi build image
├── package.json              # Khai báo thư viện Next.js 14, React 18, Tailwind
├── tailwind.config.ts        # Cấu hình Tailwind CSS
└── next.config.mjs           # Cấu hình Next.js
```
