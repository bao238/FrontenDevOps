/**
 * Script đồng bộ danh tính người dùng (Users) và đánh giá (Reviews) trong MongoDB
 * 
 * Mục tiêu:
 * 1. Quét toàn bộ collection [reviews] trong MongoDB.
 * 2. Đảm bảo 100% người đánh giá (author) xuất hiện trong các bài review đều có tài khoản tương ứng
 *    trong collection [users]. Nếu chưa có, tự động tạo tài khoản độc giả hoàn chỉnh.
 * 3. Đồng bộ chuẩn xác khóa ngoại userId giữa [reviews] và [users].
 * 4. Khi Admin tìm kiếm bất kỳ tên người đánh giá nào (như 'Minh Hoàng', 'Bảo Anh', 'Vũ.'...),
 *    hệ thống sẽ tìm thấy ngay lập tức trong bảng Người Dùng!
 * 
 * Cách chạy:
 * node backend/src/scripts/syncUsersAndReviews.js
 * hoặc truyền URI:
 * node backend/src/scripts/syncUsersAndReviews.js mongodb://127.0.0.1:27017/bookstore
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/bookstore';

// Chuyển đổi tên tiếng Việt có dấu thành chuỗi slug không dấu cho email và id
function toSlug(str) {
  if (!str) return 'user';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || 'user';
}

async function runSyncUsersAndReviews() {
  console.log('================================================================');
  console.log('👥 [BookStore] BẮT ĐẦU ĐỒNG BỘ DANH TÍNH GIỮA USERS VÀ REVIEWS MONGODB');
  console.log(`🔌 Kết nối MongoDB: ${TARGET_URI}`);
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 30000
    });
    console.log(`✅ Kết nối thành công tới database: [${mongoose.connection.name}]\n`);

    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const reviewsCol = db.collection('reviews');

    const totalUsers = await usersCol.countDocuments();
    const totalReviews = await reviewsCol.countDocuments();
    console.log(`👥 Tổng số người dùng hiện có trong [users]: ${totalUsers} tài khoản`);
    console.log(`⭐ Tổng số đánh giá hiện có trong [reviews]: ${totalReviews} bài\n`);

    // 1. Tải toàn bộ danh sách users hiện có vào Map (tra cứu theo id và theo name)
    console.log('🔍 Đang tải và lập chỉ mục danh sách người dùng...');
    const allExistingUsers = await usersCol.find({}, { projection: { _id: 1, id: 1, name: 1, email: 1 } }).toArray();
    const userByIdMap = new Map();
    const userByNameMap = new Map();

    allExistingUsers.forEach((u) => {
      if (u.id) userByIdMap.set(String(u.id), u);
      if (u.name) userByNameMap.set(String(u.name).trim().toLowerCase(), u);
    });
    console.log(`   ✓ Đã lập chỉ mục ${userByIdMap.size} mã ID và ${userByNameMap.size} tên độc giả.\n`);

    // 2. Lấy danh sách duy nhất các tác giả đánh giá (authors) từ collection [reviews]
    console.log('🔍 Đang trích xuất danh sách tất cả người đánh giá trong collection [reviews]...');
    const distinctAuthors = await reviewsCol.aggregate([
      {
        $group: {
          _id: { author: '$author', userId: '$userId' },
          count: { $sum: 1 },
          sampleRevId: { $first: '$id' },
          sampleCreatedAt: { $first: '$createdAt' }
        }
      }
    ]).toArray();

    console.log(`   ✓ Tìm thấy ${distinctAuthors.length} cặp (author, userId) duy nhất trong bảng đánh giá.`);

    // 3. Kiểm tra xem người đánh giá nào chưa có tài khoản trong [users] và tạo mới
    const newUsersToInsert = [];
    const reviewsToUpdateUserId = [];
    let existingMatchCount = 0;
    let newUsersCreatedCount = 0;

    for (let i = 0; i < distinctAuthors.length; i++) {
      const item = distinctAuthors[i];
      const authorName = String(item._id.author || '').trim();
      const currentUserId = String(item._id.userId || '').trim();

      if (!authorName) continue;

      const normalizedName = authorName.toLowerCase();
      let matchedUser = userByNameMap.get(normalizedName) || (currentUserId ? userByIdMap.get(currentUserId) : null);

      if (matchedUser) {
        existingMatchCount++;
        // Nếu review chưa có userId chuẩn, lên kế hoạch cập nhật
        if (currentUserId !== matchedUser.id) {
          reviewsToUpdateUserId.push({
            author: authorName,
            targetUserId: matchedUser.id
          });
        }
      } else {
        // Chưa có tài khoản người dùng -> Tạo mới tài khoản độc giả chuẩn
        const slug = toSlug(authorName);
        const newUserId = currentUserId && !userByIdMap.has(currentUserId)
          ? currentUserId
          : `usr-reviewer-${slug}-${Date.now().toString().slice(-4)}${i}`;

        const newUserDoc = {
          id: newUserId,
          name: authorName,
          email: `${slug}.${Date.now().toString().slice(-4)}${i}@bookstore.vn`,
          phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
          role: 'customer',
          status: 'active',
          password: '$2a$10$dummyHashPasswordForSynchronizedUserAccount1234567890',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`,
          address: 'TP. Hồ Chí Minh',
          createdAtStr: new Date(item.sampleCreatedAt || Date.now()).toLocaleDateString('vi-VN'),
          createdAt: item.sampleCreatedAt ? new Date(item.sampleCreatedAt) : new Date(),
          updatedAt: new Date()
        };

        newUsersToInsert.push(newUserDoc);
        userByIdMap.set(newUserId, newUserDoc);
        userByNameMap.set(normalizedName, newUserDoc);
        newUsersCreatedCount++;

        reviewsToUpdateUserId.push({
          author: authorName,
          targetUserId: newUserId
        });
      }
    }

    // 4. Chèn người dùng mới vào collection [users]
    if (newUsersToInsert.length > 0) {
      console.log(`\n⏳ Đang bổ sung ${newUsersToInsert.length} tài khoản độc giả mới vào collection [users]...`);
      await usersCol.insertMany(newUsersToInsert, { ordered: false });
      console.log(`✅ Đã nạp thành công ${newUsersToInsert.length} tài khoản người dùng tương ứng với người đánh giá!`);
    } else {
      console.log('\nℹ️ Toàn bộ người đánh giá đều đã có tài khoản trong [users].');
    }

    // 5. Cập nhật khóa ngoại userId trong collection [reviews]
    if (reviewsToUpdateUserId.length > 0) {
      console.log(`\n🔄 Đang cập nhật lại khóa ngoại userId cho các bài đánh giá...`);
      const reviewBulkOps = reviewsToUpdateUserId.map(op => ({
        updateMany: {
          filter: { author: op.author },
          update: { $set: { userId: op.targetUserId, updatedAt: new Date() } }
        }
      }));

      const BATCH_SIZE = 500;
      for (let i = 0; i < reviewBulkOps.length; i += BATCH_SIZE) {
        const chunk = reviewBulkOps.slice(i, i + BATCH_SIZE);
        await reviewsCol.bulkWrite(chunk, { ordered: false });
      }
      console.log(`✅ Đã đồng bộ khóa ngoại userId cho toàn bộ bài đánh giá!`);
    }

    // 6. Kiểm tra lại việc tìm kiếm người dùng cụ thể (như 'Trần Minh Hoàng', 'Bảo Anh', 'Vũ.')
    console.log('\n🔍 Kiểm tra thử nghiệm tìm kiếm danh tính người dùng vừa đồng bộ:');
    const testNames = ['Trần Minh Hoàng', 'Bảo Anh', 'Vũ.', 'Cao Đình Bảo'];
    for (const name of testNames) {
      const found = await usersCol.findOne({
        $or: [
          { name: { $regex: name, $options: 'i' } },
          { id: { $regex: name, $options: 'i' } }
        ]
      });
      if (found) {
        console.log(`   ✓ [Tìm thấy]: "${found.name}" | ID: ${found.id} | Email: ${found.email} | Role: ${found.role}`);
      } else {
        console.log(`   ⚠️ [Chưa thấy]: "${name}"`);
      }
    }

    const finalUsersCount = await usersCol.countDocuments();
    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n================================================================');
    console.log('🎉🎉🎉 ĐỒNG BỘ DANH TÍNH USERS & REVIEWS MONGODB THÀNH CÔNG!');
    console.log('================================================================');
    console.log(`⏱️ Thời gian thực thi: ${totalSeconds} giây`);
    console.log(`👥 Tổng số người dùng hiện tại trong MongoDB: ${finalUsersCount} tài khoản`);
    console.log(`✨ Số tài khoản độc giả mới được tạo tự động: ${newUsersCreatedCount} tài khoản`);
    console.log(`🔗 Số bài đánh giá đã được chuẩn hóa khóa ngoại: ${reviewsToUpdateUserId.length} nhóm`);
    console.log('================================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Đã đóng kết nối MongoDB an toàn.');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình đồng bộ Users và Reviews:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSyncUsersAndReviews();
}

module.exports = { runSyncUsersAndReviews };
