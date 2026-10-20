// Script nạp và đồng bộ toàn diện cơ sở dữ liệu BookStore trên máy chủ AWS EC2
// Thực thi đồng thời trên cả 2 Database:
// 1. "bookstore" - Database chuẩn mới cho toàn bộ hệ thống BookStore
// 2. "techstore" - Database đang kết nối trực tiếp với backend container để đồng bộ tức thì

const mongoose = require('mongoose');
const path = require('path');

// Nạp các Model Mongoose
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');
const { seedData } = require('../config/seed');

// Danh sách các cơ sở dữ liệu mục tiêu cần đồng bộ trên MongoDB Server
const MONGO_HOST = process.env.MONGO_HOST || 'techstore-mongodb';
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const TARGET_DATABASES = ['bookstore', 'techstore'];

async function seedDatabase(dbName) {
  const uri = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${dbName}`;
  console.log(`\n--------------------------------------------------------`);
  console.log(`🚀 [BẮT ĐẦU ĐỒNG BỘ DATABASE]: [${dbName}]`);
  console.log(`🔌 Chuỗi kết nối: ${uri}`);
  console.log(`--------------------------------------------------------`);

  try {
    // 1. Kết nối tới database cụ thể
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`✅ Kết nối thành công tới database [${mongoose.connection.name}]`);

    // 2. Làm sạch toàn bộ dữ liệu thiết bị điện tử cũ nếu còn sót lại
    console.log(`🧹 Đang dọn dẹp các collection cũ trong [${dbName}]...`);
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Review.deleteMany({});

    // 3. Nạp bộ dữ liệu 18 đầu sách Bestseller và các thực thể liên quan
    console.log(`📦 Đang nạp dữ liệu BookStore hoàn chỉnh vào [${dbName}]...`);
    await seedData();

    // 4. Thống kê kiểm tra số lượng bản ghi thực tế
    const pCount = await Product.countDocuments();
    const uCount = await User.countDocuments();
    const oCount = await Order.countDocuments();
    const oiCount = await OrderItem.countDocuments();
    const rCount = await Review.countDocuments();

    console.log(`✅ Kết quả nạp cho database [${dbName}]:`);
    console.log(`   📚 Sách Bestseller (products)    : ${pCount} cuốn`);
    console.log(`   👥 Người dùng (users)           : ${uCount} tài khoản`);
    console.log(`   📦 Đơn hàng sách (orders)       : ${oCount} đơn`);
    console.log(`   📑 Chi tiết đơn hàng (orderitems): ${oiCount} mục`);
    console.log(`   ⭐ Đánh giá độc giả (reviews)   : ${rCount} nhận xét`);
  } catch (err) {
    console.error(`❌ Lỗi khi đồng bộ database [${dbName}]:`, err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log(`🔌 Đã đóng kết nối tới [${dbName}] an toàn.`);
  }
}

async function runAll() {
  console.log('========================================================');
  console.log('🌟 [BOOKSTORE AWS EC2 MONGODB MIGRATION RUNNER]');
  console.log('========================================================');

  for (const dbName of TARGET_DATABASES) {
    await seedDatabase(dbName);
  }

  console.log('\n========================================================');
  console.log('🎉 TOÀN BỘ CƠ SỞ DỮ LIỆU TRÊN AWS EC2 ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG!');
  console.log('========================================================');
  console.log('📌 Quản trị viên chỉ cần mở MongoDB Compass và bấm nút REFRESH 🔄:');
  console.log('   - Database [bookstore]: Chứa đầy đủ 18 đầu sách mới.');
  console.log('   - Database [techstore]: Đã được thay thế hoàn toàn sang dữ liệu sách.');
  console.log('========================================================\n');
  process.exit(0);
}

runAll().catch((err) => {
  console.error('❌ Migration thất bại:', err);
  process.exit(1);
});
