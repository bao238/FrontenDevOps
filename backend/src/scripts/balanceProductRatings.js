/**
 * Script cân bằng điểm đánh giá (Rating Balancer) cho cơ sở dữ liệu MongoDB BookStore
 * 
 * Mục tiêu:
 * - Cập nhật hàng loạt (Bulk Write) toàn bộ sách trong bảng [products]
 * - Thay thế các giá trị cứng (5 sao, 20 đánh giá) bằng dải điểm phong phú tự nhiên (4.6 - 5.0)
 * - Đảm bảo giá trị trung bình toán học của toàn bộ sách trên hệ thống là 4.90 / 5.0
 * 
 * Cách chạy trên máy local hoặc server AWS EC2:
 * node backend/src/scripts/balanceProductRatings.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/bookstore';

/**
 * Hàm băm chuỗi thành số nguyên 32-bit dương xác định
 */
function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return 42;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Thuật toán tính toán điểm sao và số lượng nhận xét cân bằng 4.9
 * Trọng số phân bổ:
 * - 40% đạt 5.0
 * - 35% đạt 4.9
 * - 15% đạt 4.8
 * - 8% đạt 4.7
 * - 2% đạt 4.6
 * => Điểm trung bình: 4.903 ~ 4.9 / 5.0
 */
function getBalancedRating(productId, index) {
  const seed = String(productId || `prod-index-${index}`);
  const h = hashString(seed);

  const mod = h % 100;
  let rating = 5.0;
  if (mod < 40) {
    rating = 5.0;
  } else if (mod < 75) {
    rating = 4.9;
  } else if (mod < 90) {
    rating = 4.8;
  } else if (mod < 98) {
    rating = 4.7;
  } else {
    rating = 4.6;
  }

  // Số lượng đánh giá dao động từ 24 đến 368 lượt
  const reviewsCount = ((h % 43) * 8) + 24;

  return { rating, reviewsCount };
}

async function runBalanceRatings() {
  console.log('🚀 Bắt đầu quá trình cân bằng điểm đánh giá sách trong MongoDB...');
  console.log(`🔌 Kết nối MongoDB: ${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB thành công!');

    const db = mongoose.connection.db;
    const productsCol = db.collection('products');

    const totalProducts = await productsCol.countDocuments();
    console.log(`📚 Tổng số lượng sách trong collection [products]: ${totalProducts} cuốn`);

    if (totalProducts === 0) {
      console.log('⚠️ Không tìm thấy cuốn sách nào trong collection [products].');
      await mongoose.disconnect();
      return;
    }

    const cursor = productsCol.find({}, { projection: { _id: 1, id: 1, name: 1, rating: 1, reviewsCount: 1 } });

    let bulkOps = [];
    const BATCH_SIZE = 1000;
    let processedCount = 0;
    let totalRatingSum = 0;
    const ratingDistribution = { '5.0': 0, '4.9': 0, '4.8': 0, '4.7': 0, '4.6': 0 };

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const balanced = getBalancedRating(doc.id || doc._id, processedCount);

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              rating: balanced.rating,
              reviewsCount: balanced.reviewsCount,
              updatedAt: new Date()
            }
          }
        }
      });

      totalRatingSum += balanced.rating;
      const key = balanced.rating.toFixed(1);
      ratingDistribution[key] = (ratingDistribution[key] || 0) + 1;
      processedCount++;

      if (bulkOps.length >= BATCH_SIZE) {
        await productsCol.bulkWrite(bulkOps, { ordered: false });
        console.log(`   ⏳ Đã cập nhật xong batch: ${processedCount} / ${totalProducts} cuốn sách...`);
        bulkOps = [];
      }
    }

    if (bulkOps.length > 0) {
      await productsCol.bulkWrite(bulkOps, { ordered: false });
      console.log(`   ⏳ Đã cập nhật xong phần còn lại: ${processedCount} / ${totalProducts} cuốn sách.`);
    }

    const overallAverage = (totalRatingSum / processedCount).toFixed(2);
    console.log('\n======================================================');
    console.log('🎉 CẬP NHẬT HOÀN TẤT THÀNH CÔNG!');
    console.log(`📊 Tổng số sách đã xử lý: ${processedCount}`);
    console.log('⭐ Phân bổ chi tiết số sao:');
    console.log(`   - 5.0 ⭐: ${ratingDistribution['5.0']} cuốn (${((ratingDistribution['5.0'] / processedCount) * 100).toFixed(1)}%)`);
    console.log(`   - 4.9 ⭐: ${ratingDistribution['4.9']} cuốn (${((ratingDistribution['4.9'] / processedCount) * 100).toFixed(1)}%)`);
    console.log(`   - 4.8 ⭐: ${ratingDistribution['4.8']} cuốn (${((ratingDistribution['4.8'] / processedCount) * 100).toFixed(1)}%)`);
    console.log(`   - 4.7 ⭐: ${ratingDistribution['4.7']} cuốn (${((ratingDistribution['4.7'] / processedCount) * 100).toFixed(1)}%)`);
    console.log(`   - 4.6 ⭐: ${ratingDistribution['4.6']} cuốn (${((ratingDistribution['4.6'] / processedCount) * 100).toFixed(1)}%)`);
    console.log(`✨ ĐIỂM SAO TRUNG BÌNH TOÀN BỘ SÁCH: ${overallAverage} / 5.0 ⭐`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình cập nhật rating:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 Đã đóng kết nối MongoDB.');
  }
}

// Chạy trực tiếp nếu file được gọi từ terminal
if (require.main === module) {
  runBalanceRatings();
}

module.exports = { runBalanceRatings, getBalancedRating };
