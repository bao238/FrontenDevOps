// Script chạy nạp dữ liệu trực tiếp vào MongoDB cho đề tài BookStore
// Tự động dọn dẹp cơ sở dữ liệu cũ "techstore" và tạo mới database "bookstore" với 18 đầu sách

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');
const { seedData } = require('../config/seed');

// Địa chỉ kết nối MongoDB mục tiêu
const TARGET_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

async function runDirectSeed() {
  console.log('========================================================');
  console.log('🚀 [BookStore Database Migration & Seeding Tool]');
  console.log(`🔌 Kết nối tới MongoDB: ${TARGET_URI}`);
  console.log('========================================================\n');

  try {
    // 1. Kết nối tới database bookstore
    await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    console.log(`✅ Kết nối thành công tới database: [${mongoose.connection.name}]`);

    // 2. Dọn dẹp database cũ "techstore" nếu tồn tại trên MongoDB server
    try {
      const adminDb = mongoose.connection.db.admin();
      const dbList = await adminDb.listDatabases();
      const hasOldTechstore = dbList.databases.some((d) => d.name === 'techstore');

      if (hasOldTechstore) {
        console.log('🧹 Phát hiện database cũ "techstore", đang tiến hành xóa bỏ để tránh nhầm lẫn...');
        const oldConn = mongoose.createConnection('mongodb://127.0.0.1:27017/techstore');
        await new Promise((resolve) => oldConn.once('open', resolve));
        await oldConn.dropDatabase();
        await oldConn.close();
        console.log('✅ Đã xóa database cũ "techstore" thành công!');
      }
    } catch (dropErr) {
      console.log('ℹ️ Ghi chú kiểm tra database cũ:', dropErr.message);
    }

    // 3. Làm sạch các collections trong database bookstore hiện tại
    console.log('🔄 Đang làm sạch các collections trong database bookstore...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Review.deleteMany({});

    // 4. Chạy nạp toàn bộ dữ liệu sách, người dùng, đơn hàng và đánh giá
    console.log('📦 Đang nạp toàn bộ dữ liệu mẫu BookStore vào MongoDB...');
    await seedData();

    // 5. Thống kê số lượng bản ghi thực tế vừa nạp
    const pCount = await Product.countDocuments();
    const uCount = await User.countDocuments();
    const oCount = await Order.countDocuments();
    const oiCount = await OrderItem.countDocuments();
    const rCount = await Review.countDocuments();

    console.log('\n========================================================');
    console.log('🎉 THỐNG KÊ DỮ LIỆU ĐÃ NẠP THÀNH CÔNG VÀO MONGODB COMPASS:');
    console.log('========================================================');
    console.log(`📚 Collection [products]   : ${pCount} cuốn sách Bestseller (6 thể loại)`);
    console.log(`👥 Collection [users]      : ${uCount} tài khoản (@bookstore.vn)`);
    console.log(`📦 Collection [orders]     : ${oCount} đơn hàng mua sách`);
    console.log(`📑 Collection [orderitems] : ${oiCount} chi tiết món hàng`);
    console.log(`⭐ Collection [reviews]    : ${rCount} đánh giá nhận xét của độc giả`);
    console.log('========================================================');
    console.log('💡 Hướng dẫn kiểm tra trên MongoDB Compass:');
    console.log('   1. Mở MongoDB Compass, nhấn nút Refresh 🔄 ở góc trên bên trái.');
    console.log('   2. Bạn sẽ thấy database mới [bookstore] xuất hiện thay cho [techstore]!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn.');
    process.exit(0);
  }
}

runDirectSeed();
