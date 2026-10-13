const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

let pool = null;
let isConnected = false;

let serverHost = process.env.DB_SERVER || 'localhost';
let instanceName = process.env.DB_INSTANCE;
if (serverHost.includes('\\')) {
  const parts = serverHost.split('\\');
  serverHost = parts[0];
  instanceName = parts[1];
} else if (!instanceName && (serverHost.toLowerCase() === 'localhost' || serverHost === '127.0.0.1')) {
  instanceName = 'SQLEXPRESS';
}

const config = {
  user: process.env.DB_USER || 'devops1',
  password: process.env.DB_PASSWORD || 'Mz9bX818-~qM',
  server: serverHost,
  database: process.env.DB_DATABASE || 'devops1',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    ...(instanceName ? { instanceName } : {}),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
    connectTimeout: 10000,
    requestTimeout: 15000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function connectDB() {
  try {
    const target = instanceName ? `${serverHost}\\${instanceName}` : serverHost;
    console.log(`🔌 [Database] Đang kết nối tới MS SQL Server: ${target}/${config.database}...`);
    pool = await new sql.ConnectionPool(config).connect();
    isConnected = true;
    console.log(`✅ [Database] Kết nối thành công 100% tới MS SQL Server (${config.database})!`);
    await initTables(pool);
    return pool;
  } catch (err) {
    isConnected = false;
    console.error(`❌ [Database] Lỗi kết nối MS SQL Server: ${err.message}`);
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
    console.log('📦 [Database] Kiểm tra bảng Users, Products, Orders, OrderItems thành công!');
  } catch (initErr) {
    console.warn('⚠️ [Database] Lỗi khi kiểm tra bảng:', initErr.message);
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
