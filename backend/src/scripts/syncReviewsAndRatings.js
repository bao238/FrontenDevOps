/**
 * Script đồng bộ và dọn dẹp điểm đánh giá sách chuẩn xác trong MongoDB (Local & EC2)
 * 
 * Mục tiêu:
 * - Đối chiếu từng sản phẩm trong collection [products] với collection [reviews] thực tế.
 * - Xóa sạch toàn bộ số ảo (như rating 5.0, reviewsCount 20 hoặc 2) nếu sách không có bài đánh giá.
 * - Sách chưa có bài đánh giá: Đặt rating = 0, reviewsCount = 0.
 * - Sách có bài đánh giá: reviewsCount = số bài thật, rating = trung bình cộng điểm sao thật.
 * 
 * Cách chạy:
 * node backend/src/scripts/syncReviewsAndRatings.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/bookstore';

async function runSyncReviewsAndRatings() {
  console.log('🚀 Bắt đầu quá trình đồng bộ điểm đánh giá thực tế trong MongoDB...');
  console.log(`🔌 Kết nối MongoDB: ${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB thành công!');

    const db = mongoose.connection.db;
    const productsCol = db.collection('products');
    const reviewsCol = db.collection('reviews');

    const totalProducts = await productsCol.countDocuments();
    const totalReviews = await reviewsCol.countDocuments();
    console.log(`📚 Tổng số lượng sách: ${totalProducts} cuốn`);
    console.log(`⭐ Tổng số bài đánh giá thực tế trong collection [reviews]: ${totalReviews} bài`);

    if (totalProducts === 0) {
      console.log('⚠️ Không tìm thấy sản phẩm nào trong database.');
      await mongoose.disconnect();
      return;
    }

    // 1. Nhóm và tính toán thống kê đánh giá thực tế theo từng productId
    console.log('📊 Đang tổng hợp số liệu bài đánh giá thực tế...');
    const reviewStats = await reviewsCol
      .aggregate([
        {
          $group: {
            _id: '$productId',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ])
      .toArray();

    const statsMap = new Map();
    reviewStats.forEach((st) => {
      statsMap.set(String(st._id), {
        count: st.count,
        avgRating: Number(st.avgRating.toFixed(1))
      });
    });

    console.log(`📝 Đã tìm thấy ${statsMap.size} cuốn sách có bài đánh giá thực tế.`);

    // 2. Cập nhật hàng loạt (Bulk Write) toàn bộ danh mục sản phẩm
    const cursor = productsCol.find({}, { projection: { _id: 1, id: 1, name: 1, rating: 1, reviewsCount: 1 } });
    let bulkOps = [];
    const BATCH_SIZE = 1000;
    let updatedZeroCount = 0;
    let updatedRealCount = 0;
    let processed = 0;

    while (await cursor.hasNext()) {
      const prod = await cursor.next();
      const pId = String(prod.id || prod._id);
      const stat = statsMap.get(pId);

      const targetCount = stat ? stat.count : 0;
      const targetRating = stat ? stat.avgRating : 0;

      // Chỉ cập nhật nếu dữ liệu hiện tại đang bị lệch hoặc chứa số ảo
      if (prod.reviewsCount !== targetCount || prod.rating !== targetRating) {
        bulkOps.push({
          updateOne: {
            filter: { _id: prod._id },
            update: {
              $set: {
                reviewsCount: targetCount,
                rating: targetRating,
                updatedAt: new Date()
              }
            }
          }
        });

        if (targetCount === 0) {
          updatedZeroCount++;
        } else {
          updatedRealCount++;
        }
      }

      processed++;

      if (bulkOps.length >= BATCH_SIZE) {
        await productsCol.bulkWrite(bulkOps, { ordered: false });
        console.log(`⏳ Đã xử lý ${processed}/${totalProducts} cuốn sách...`);
        bulkOps = [];
      }
    }

    if (bulkOps.length > 0) {
      await productsCol.bulkWrite(bulkOps, { ordered: false });
    }

    console.log('\n🎉 ================================================');
    console.log(`✅ ĐỒNG BỘ THÀNH CÔNG CHO ${processed} CUỐN SÁCH:`);
    console.log(`   - Số sách chưa có bài đánh giá (đã đưa về 0 sao, 0 nhận xét): ${updatedZeroCount} cuốn`);
    console.log(`   - Số sách có bài đánh giá thực tế (khớp điểm sao thật): ${updatedRealCount} cuốn`);
    console.log('================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu MongoDB an toàn.');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình đồng bộ rating:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSyncReviewsAndRatings();
}

module.exports = { runSyncReviewsAndRatings };
