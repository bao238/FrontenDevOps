-- =========================================================================
-- SCRIPT T-SQL KHỞI TẠO CƠ SỞ DỮ LIỆU TECHSTORE (CHO SSMS & GEARHOST)
-- Hướng dẫn: Mở SQL Server Management Studio (SSMS), kết nối vào GearHost,
-- dán toàn bộ script này và nhấn F5 (Execute).
-- =========================================================================

-- Chọn đúng database devops1 trên GearHost
USE devops1;
GO

-- 1. TẠO BẢNG USERS (Tài khoản người dùng & Quản trị)
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

CREATE TABLE dbo.Users (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(50),
    role NVARCHAR(50) NOT NULL DEFAULT 'customer', -- 'admin', 'staff', 'customer'
    status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'locked'
    password NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500) DEFAULT '/default-avatar.png',
    address NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 2. TẠO BẢNG PRODUCTS (Sản phẩm công nghệ)
CREATE TABLE dbo.Products (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    price DECIMAL(18, 0) NOT NULL,
    original_price DECIMAL(18, 0) NOT NULL,
    discount_percent INT DEFAULT 0,
    rating DECIMAL(3, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url NVARCHAR(500),
    description NVARCHAR(MAX),
    specs NVARCHAR(MAX), -- Lưu chuỗi JSON các thông số kỹ thuật
    in_stock BIT DEFAULT 1,
    featured BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 3. TẠO BẢNG ORDERS (Đơn đặt hàng)
CREATE TABLE dbo.Orders (
    id NVARCHAR(50) PRIMARY KEY,
    customer_name NVARCHAR(255) NOT NULL,
    customer_phone NVARCHAR(50) NOT NULL,
    customer_address NVARCHAR(500) NOT NULL,
    total_amount DECIMAL(18, 0) NOT NULL,
    payment_method NVARCHAR(100) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT N'Đang xử lý', -- N'Đang xử lý', N'Đang giao', N'Hoàn tất', N'Đã hủy'
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 4. TẠO BẢNG ORDER_ITEMS (Chi tiết các mặt hàng trong đơn)
CREATE TABLE dbo.OrderItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id NVARCHAR(50) NOT NULL,
    product_id NVARCHAR(50) NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    price DECIMAL(18, 0) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (product_id) REFERENCES dbo.Products(id)
);

-- =========================================================================
-- CHÈN DỮ LIỆU MẪU (SEED DATA)
-- =========================================================================

-- Seed Users
INSERT INTO dbo.Users (id, name, email, phone, role, status, password, avatar_url, address)
VALUES 
('usr-admin-1', N'Quản Trị Viên (Đình Bảo)', 'admin@dinhbao.vn', '0905 888 999', 'admin', 'active', 'admin123', '/default-avatar.png', N'Tòa nhà DinhBao Center, Hải Châu, Đà Nẵng'),
('usr-admin-2', N'Bảo Admin', 'bao@gmail.com', '0905 123 456', 'admin', 'active', 'admin123', '/default-avatar.png', N'Đà Nẵng'),
('usr-staff-1', N'Trần Thị Mai (Kinh Doanh)', 'staff@dinhbao.vn', '0912 345 678', 'staff', 'active', 'staff123', '/default-avatar.png', N'Quận Cẩm Lệ, Đà Nẵng'),
('usr-cust-1', N'Nguyễn Văn An', 'demo@dinhbao.vn', '0988 776 655', 'customer', 'active', 'demo123', '/default-avatar.png', N'123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng'),
('usr-cust-2', N'Lê Thị Hồng', 'hong.le@gmail.com', '0977 112 233', 'customer', 'active', 'user123', '/default-avatar.png', N'45 Lê Duẩn, Đà Nẵng'),
('usr-cust-3', N'Phạm Quốc Hưng (Demo Khóa)', 'hung.pham@yahoo.com', '0935 999 888', 'customer', 'locked', 'user123', '/default-avatar.png', N'Quận Ba Đình, Hà Nội');

-- Seed Products
INSERT INTO dbo.Products (id, name, category, price, original_price, discount_percent, rating, reviews_count, image_url, description, specs, in_stock, featured)
VALUES
(
    'prod-1',
    N'MacBook Pro 14 inch M3 Pro (18GB / 512GB SSD)',
    N'Laptop & PC',
    49990000,
    54990000,
    9,
    4.9,
    128,
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    N'MacBook Pro 14 M3 Pro mang lại hiệu năng đỉnh cao cho lập trình viên và nhà thiết kế. Màn hình Liquid Retina XDR 120Hz siêu nét, thời lượng pin lên đến 18 giờ liên tục.',
    '{"Chip xử lý":"Apple M3 Pro 11-core CPU","RAM":"18GB Unified Memory","Ổ cứng":"512GB SSD siêu tốc","Màn hình":"14.2 inch Liquid Retina XDR (3024x1964)","Trọng lượng":"1.61 kg","Cổng kết nối":"Thunderbolt 4, HDMI, MagSafe 3, SDXC"}',
    1,
    1
),
(
    'prod-2',
    N'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
    N'Điện thoại',
    29490000,
    34990000,
    15,
    4.8,
    340,
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    N'Khung viền Titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ. Chip A17 Pro mạnh mẽ hỗ trợ chơi game đồ họa đỉnh cao, camera tiềm vọng zoom quang học 5x.',
    '{"Màn hình":"6.7 inch Super Retina XDR OLED 120Hz","Chip":"Apple A17 Pro (3nm)","Bộ nhớ":"256GB","Camera sau":"48MP + 12MP + 12MP (Zoom 5x)","Cổng sạc":"USB-C chuẩn 3.0","Kháng nước":"IP68"}',
    1,
    1
),
(
    'prod-3',
    N'Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao',
    N'Âm thanh',
    6990000,
    8990000,
    22,
    4.9,
    95,
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    N'Công nghệ chống ồn chủ động hàng đầu thế giới với 8 micro và bộ xử lý kép V1/QN1. Âm thanh Hi-Res Audio chuẩn phòng thu, thời lượng pin 30 giờ.',
    '{"Thời lượng pin":"30 giờ (bật ANC)","Công nghệ":"Chống ồn tự động Auto NC Optimizer","Driver":"30mm màng carbon tổng hợp","Trọng lượng":"250g","Kết nối":"Bluetooth 5.2, LDAC, AUX 3.5mm"}',
    1,
    1
),
(
    'prod-4',
    N'Bàn phím cơ không dây Keychron Q1 Pro QMK/VIA',
    N'Phụ kiện',
    4290000,
    4890000,
    12,
    4.7,
    64,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    N'Bàn phím cơ Custom cao cấp với vỏ nhôm nguyên khối CNC, cấu trúc Gasket Mount êm ái, hỗ trợ Hot-swap và tùy biến layout phím qua QMK/VIA.',
    '{"Layout":"75% (81 phím)","Vỏ":"Nhôm Anodized nguyên khối","Switch":"Keychron K Pro Red / Brown","Kết nối":"Bluetooth 5.1 / Type-C có dây","Tương thích":"macOS / Windows / Linux"}',
    1,
    0
),
(
    'prod-5',
    N'Màn hình Dell UltraSharp U2723QE 27 inch 4K IPS Black',
    N'Laptop & PC',
    13890000,
    15500000,
    10,
    4.9,
    88,
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    N'Màn hình 4K sắc nét trang bị công nghệ IPS Black mang lại độ tương phản 2000:1 vượt trội, độ phủ màu 98% DCI-P3, tích hợp cổng USB-C sạc 90W và hub mạng RJ45.',
    '{"Kích thước":"27 inch","Độ phân giải":"4K UHD (3840 x 2160)","Tấm nền":"IPS Black, 1.07 tỷ màu","Độ phủ màu":"98% DCI-P3, 100% sRGB","Cổng xuất":"USB-C (Power Delivery 90W), DP 1.4, HDMI 2.0"}',
    1,
    0
),
(
    'prod-6',
    N'Chuột không dây công thái học Logitech MX Master 3S',
    N'Phụ kiện',
    2190000,
    2690000,
    18,
    4.8,
    210,
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    N'Chuột làm việc số 1 cho lập trình viên và chuyên gia văn phòng. Con lăn điện từ MagSpeed cuộn 1000 dòng/giây, click êm ái giảm 90% tiếng ồn, cảm biến 8000 DPI trên mọi bề mặt kính.',
    '{"Cảm biến":"Darkfield 8000 DPI","Pin":"Lên đến 70 ngày cho 1 lần sạc","Kết nối":"Logi Bolt USB, Bluetooth (3 thiết bị)","Phần mềm":"Logi Options+ tùy biến thao tác"}',
    1,
    0
),
(
    'prod-7',
    N'Đồng hồ thông minh Apple Watch Series 9 GPS 45mm',
    N'Smart Home',
    9990000,
    11490000,
    13,
    4.7,
    76,
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    N'Chip S9 SiP mạnh mẽ hơn bao giờ hết với tính năng Double Tap điều khiển không chạm. Màn hình sáng gấp đôi 2000 nits, cảm biến đo điện tâm đồ ECG và nồng độ oxy trong máu.',
    '{"Kích thước mặt":"45mm nhôm","Thời lượng pin":"18 giờ (tiêu chuẩn), 36 giờ (chế độ tiết kiệm)","Tính năng":"ECG, SpO2, Đo nhịp tim, Phát hiện té ngã, GPS","Kháng nước":"50m (WR50)"}',
    1,
    0
),
(
    'prod-8',
    N'Loa Bluetooth thông minh Marshall Stanmore III',
    N'Âm thanh',
    8490000,
    9990000,
    15,
    4.9,
    52,
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    N'Thiết kế Vintage sang trọng với chất âm Marshall huyền thoại. Âm trường rộng hơn thế hệ trước, công suất 80W mạnh mẽ lấp đầy không gian phòng khách.',
    '{"Công suất":"80W (1x 50W Woofer + 2x 15W Tweeter)","Kết nối":"Bluetooth 5.2, AUX 3.5mm, RCA","Dải tần số":"45 - 20,000 Hz","Trọng lượng":"4.25 kg"}',
    0,
    0
);

-- Seed Đơn hàng mẫu
INSERT INTO dbo.Orders (id, customer_name, customer_phone, customer_address, total_amount, payment_method, status)
VALUES 
('ORD-2026-001', N'Nguyễn Văn An', '0988 776 655', N'123 Nguyễn Văn Linh, Đà Nẵng', 29490000, N'Chuyển khoản QR', N'Hoàn tất'),
('ORD-2026-002', N'Lê Thị Hồng', '0977 112 233', N'45 Lê Duẩn, Đà Nẵng', 6990000, N'Thanh toán khi nhận hàng (COD)', N'Đang giao');

INSERT INTO dbo.OrderItems (order_id, product_id, product_name, price, quantity)
VALUES 
('ORD-2026-001', 'prod-2', N'iPhone 15 Pro Max 256GB - Titan Tự Nhiên', 29490000, 1),
('ORD-2026-002', 'prod-3', N'Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao', 6990000, 1);

-- Kiểm tra kết quả
SELECT 'Users Count' AS TableName, COUNT(*) AS TotalRows FROM dbo.Users
UNION ALL
SELECT 'Products Count', COUNT(*) FROM dbo.Products
UNION ALL
SELECT 'Orders Count', COUNT(*) FROM dbo.Orders;
