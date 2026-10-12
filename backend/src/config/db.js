const sql = require('mssql');
require('dotenv').config();

let pool = null;
let isConnected = false;

const config = {
  user: process.env.DB_USER || 'techstore_admin',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'den1.mssql8.gear.host',
  database: process.env.DB_DATABASE || 'techstore_devops',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
    connectTimeout: 7000,
    requestTimeout: 10000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function connectDB() {
  if (process.env.DB_PASSWORD === 'your_password_here' || !process.env.DB_PASSWORD) {
    console.log('⚠️ [Database] Chưa cấu hình DB_PASSWORD thực tế từ GearHost trong backend/.env');
    console.log('💡 [Database] Backend sẽ tự động dùng Dữ liệu Dự phòng (Mock Memory) để bạn test web trước!');
    return null;
  }

  try {
    console.log(`🔌 [Database] Đang kết nối tới MS SQL Server: ${config.server}/${config.database}...`);
    pool = await new sql.ConnectionPool(config).connect();
    isConnected = true;
    console.log('✅ [Database] Kết nối thành công tới Microsoft SQL Server (GearHost)!');
    await initTables(pool);
    return pool;
  } catch (err) {
    isConnected = false;
    console.warn(`⚠️ [Database] Không thể kết nối tới GearHost (${err.message}).`);
    console.log('💡 [Database] Tự động chuyển sang chế độ Dữ liệu Dự phòng (Mock Memory) để server hoạt động bình thường.');
    return null;
  }
}

async function initTables(p) {
  try {
    await p.request().query(`
      IF OBJECT_ID('dbo.Users', 'U') IS NULL
      CREATE TABLE dbo.Users (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        phone NVARCHAR(50),
        role NVARCHAR(50) NOT NULL DEFAULT 'customer',
        status NVARCHAR(50) NOT NULL DEFAULT 'active',
        password NVARCHAR(255) NOT NULL,
        avatar_url NVARCHAR(500) DEFAULT '/default-avatar.png',
        address NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETDATE()
      );

      IF OBJECT_ID('dbo.Products', 'U') IS NULL
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
        specs NVARCHAR(MAX),
        in_stock BIT DEFAULT 1,
        featured BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE()
      );

      IF OBJECT_ID('dbo.Orders', 'U') IS NULL
      CREATE TABLE dbo.Orders (
        id NVARCHAR(50) PRIMARY KEY,
        customer_name NVARCHAR(255) NOT NULL,
        customer_phone NVARCHAR(50) NOT NULL,
        customer_address NVARCHAR(500) NOT NULL,
        total_amount DECIMAL(18, 0) NOT NULL,
        payment_method NVARCHAR(100) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT N'Đang xử lý',
        created_at DATETIME2 DEFAULT GETDATE()
      );

      IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
      CREATE TABLE dbo.OrderItems (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id NVARCHAR(50) NOT NULL,
        product_id NVARCHAR(50) NOT NULL,
        product_name NVARCHAR(255) NOT NULL,
        price DECIMAL(18, 0) NOT NULL,
        quantity INT NOT NULL DEFAULT 1
      );
    `);
    console.log('📦 [Database] Tự động khởi tạo/kiểm tra bảng Users, Products, Orders thành công!');
  } catch (initErr) {
    console.warn('⚠️ [Database] Lỗi khi tạo bảng tự động:', initErr.message);
  }
}

// Khởi tạo kết nối khi server boot
connectDB();

module.exports = {
  sql,
  getPool: () => pool,
  isDbConnected: () => isConnected,
  reconnect: connectDB
};
