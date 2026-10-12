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
    return pool;
  } catch (err) {
    isConnected = false;
    console.warn(`⚠️ [Database] Không thể kết nối tới GearHost (${err.message}).`);
    console.log('💡 [Database] Tự động chuyển sang chế độ Dữ liệu Dự phòng (Mock Memory) để server hoạt động bình thường.');
    return null;
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
