/**
 * Script dọn dẹp các thông báo đơn hàng công khai trong MongoDB
 * 
 * Mục tiêu:
 * - Tìm kiếm các thông báo trong collection [notifications] có type là 'order' hoặc 'review' nhưng userId = null
 * - Chuyển đổi các thông báo này thành có userId cụ thể hoặc xóa bỏ
 * - Đảm bảo khách vãng lai chưa đăng nhập không bao giờ nhìn thấy thông báo đơn hàng
 * 
 * Cách chạy:
 * node backend/src/scripts/cleanPublicOrderNotifications.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/bookstore';

async function runClean() {
  console.log('================================================================');
  console.log('🧹 [BookStore] DỌN DẸP THÔNG BÁO ĐƠN HÀNG CÔNG KHAI TRONG MONGODB');
  console.log(`🔌 Kết nối MongoDB: ${TARGET_URI}`);
  console.log('================================================================\n');

  try {
    await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 30000
    });
    console.log(`✅ Kết nối thành công tới database: [${mongoose.connection.name}]\n`);

    const db = mongoose.connection.db;
    const notifCol = db.collection('notifications');

    // Tìm các thông báo đơn hàng hoặc đánh giá đang bị gán userId: null
    const leakedNotifs = await notifCol.countDocuments({
      userId: null,
      type: { $in: ['order', 'review'] }
    });

    console.log(`🔍 Tìm thấy ${leakedNotifs} thông báo đơn hàng / đánh giá có userId: null`);

    if (leakedNotifs > 0) {
      // Xóa hoặc chuyển đổi để bảo vệ quyền riêng tư
      const deleteResult = await notifCol.deleteMany({
        userId: null,
        type: { $in: ['order', 'review'] }
      });
      console.log(`✅ Đã xóa an toàn ${deleteResult.deletedCount} thông báo đơn hàng công khai!`);
    } else {
      console.log('✨ Không có thông báo đơn hàng nào bị lộ công khai.');
    }

    const remainingPublicNotifs = await notifCol.countDocuments({ userId: null });
    console.log(`📢 Tổng số thông báo hệ thống / khuyến mãi công khai còn lại: ${remainingPublicNotifs} thông báo.`);

    await mongoose.disconnect();
    console.log('\n🔌 Đã đóng kết nối MongoDB an toàn.');
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp thông báo:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runClean();
}

module.exports = { runClean };
