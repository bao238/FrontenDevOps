const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const { seedData } = require('./seed');

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/techstore';

let isConnected = false;

async function connectDB() {
  try {
    const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 [Database] Đang kết nối tới MongoDB: ${maskedUri}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    isConnected = true;
    console.log(`✅ [Database] Kết nối thành công tới MongoDB (${mongoose.connection.name})!`);
    await seedData();
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    console.error(`❌ [Database] Lỗi kết nối MongoDB: ${err.message}`);
    return null;
  }
}

// Khởi chạy kết nối khi boot
connectDB();

module.exports = {
  mongoose,
  isDbConnected: () => mongoose.connection.readyState === 1,
  reconnect: connectDB
};
