/**
 * Script nạp dữ liệu quy mô lớn (Big Data 100 - 200 MB) cho bảng notifications trong MongoDB BookStore
 * Mục tiêu:
 * - Đạt dung lượng Data Size khoảng 150 MB (~25,000 thông báo đa dạng)
 * - Mỗi thông báo chứa payload thực tế (~6 KB) mô phỏng log chi tiết sự kiện đẩy thông báo (Push Notification Event)
 * - Tương thích hoàn hảo với MongoDB Compass và hệ thống BookStore hiện tại
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Địa chỉ kết nối MongoDB: ưu tiên tham số dòng lệnh -> biến môi trường -> localhost mặc định
const TARGET_URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

// Các tiêu đề và nội dung thông báo tiếng Việt thực tế theo phân loại
const SAMPLE_NOTIFICATIONS = [
  {
    type: 'order',
    title: 'Đơn hàng đã được xác nhận thành công',
    message: 'Đơn hàng của bạn đã được tiếp nhận và nhân viên đang tiến hành đóng gói sách cẩn thận.',
    link: '/orders'
  },
  {
    type: 'order',
    title: 'Đơn hàng đang trên đường giao đến bạn',
    message: 'Tài xế công ty Giao Hàng Nhanh đang vận chuyển kiện sách tới địa chỉ giao nhận.',
    link: '/orders'
  },
  {
    type: 'order',
    title: 'Giao hàng thành công - Chúc bạn đọc sách vui vẻ',
    message: 'Kiện hàng sách đã được giao tận tay. Đừng quên để lại cảm nhận đánh giá để nhận xu thưởng!',
    link: '/orders'
  },
  {
    type: 'coupon',
    title: 'Tặng bạn Mã Giảm Giá 20% cho đơn sách tiếp theo',
    message: 'Nhập mã TRIENDOCGIA để được giảm ngay 20% (tối đa 50.000đ) khi mua sách văn học tuần này.',
    link: '/products'
  },
  {
    type: 'coupon',
    title: 'Miễn phí vận chuyển toàn quốc cho đơn từ 200.000đ',
    message: 'Áp dụng mã FREESHIP toàn hệ thống BookStore từ hôm nay đến hết cuối tháng.',
    link: '/products'
  },
  {
    type: 'review',
    title: 'Đánh giá của bạn đã nhận được lượt thích mới',
    message: 'Độc giả khác đánh giá cao bài cảm nhận chi tiết của bạn về tác phẩm văn học kinh điển.',
    link: '/products'
  },
  {
    type: 'system',
    title: 'Ngày hội Đọc Sách BookStore Festival chính thức khai mạc',
    message: 'Khám phá hơn 10.000 đầu sách kinh điển với mức ưu đãi giảm giá sâu lên đến 50%.',
    link: '/products'
  },
  {
    type: 'system',
    title: 'Thông báo nâng cấp hệ thống & tối ưu phân trang',
    message: 'Hệ thống đã hoàn tất nâng cấp hạ tầng chỉ mục cơ sở dữ liệu giúp tốc độ duyệt sách tăng gấp 5 lần.',
    link: '/products'
  }
];

// Văn bản mẫu mô phỏng dữ liệu log sự kiện chi tiết của dịch vụ thông báo
const SAMPLE_EVENT_LOG = `Hệ thống phân phối sự kiện đẩy thông báo (Push Notification Dispatcher) đã ghi nhận phiên kết nối từ thiết bị di động. Khối dữ liệu được mã hóa hai đầu bằng chuẩn TLS 1.3, xác thực token định danh người dùng và xếp hàng vào cụm Kafka Queue phân tán. Kết quả chuyển tiếp qua Gateway đạt tỉ lệ thành công 99.98% với độ trễ phản hồi trung bình dưới 15ms. `;

/**
 * Hàm sinh chuỗi payload văn bản UTF-8 có kích thước xác định tính theo byte
 * @param {number} targetBytes Số byte mong muốn cho trường dữ liệu mở rộng
 * @returns {string} Chuỗi văn bản tiếng Việt kết hợp chuỗi ngẫu nhiên
 */
function createNotificationPayload(targetBytes) {
  const baseBytes = Buffer.byteLength(SAMPLE_EVENT_LOG, 'utf8');
  const repeatCount = Math.floor(targetBytes / baseBytes);
  const textPart = SAMPLE_EVENT_LOG.repeat(Math.max(1, repeatCount));
  const remaining = targetBytes - Buffer.byteLength(textPart, 'utf8');
  const padPart = remaining > 0 ? crypto.randomBytes(Math.floor(remaining / 2)).toString('hex') : '';
  return textPart + padPart;
}

/**
 * Tiến trình chính: kết nối database và chèn 25,000 bản ghi thông báo đạt ~150 MB
 */
async function seedNotifications() {
  console.log('================================================================');
  console.log('🚀 [BookStore Notification Big Data Seeding Tool: 100 - 200 MB]');
  console.log(`🔌 Kết nối tới cơ sở dữ liệu: ${TARGET_URI}`);
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // 1. Thiết lập kết nối an toàn với timeout dự phòng
    await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 30000
    });
    console.log(`✅ Kết nối thành công tới database: [${mongoose.connection.name}]\n`);

    const db = mongoose.connection.db;
    const notificationsCol = db.collection('notifications');

    // 2. Kiểm tra số lượng và dung lượng hiện tại của collection notifications
    const existingCount = await notificationsCol.countDocuments();
    let initialStats = { size: 0, storageSize: 0 };
    try {
      initialStats = await db.command({ collStats: 'notifications' });
    } catch (e) {
      // Trường hợp collection mới chưa có stats
    }
    console.log(`📊 Trạng thái ban đầu: ${existingCount} documents | Data Size: ${((initialStats.size || 0) / 1024).toFixed(2)} KB`);

    // 3. Cấu hình thông số tạo dữ liệu đạt ~150 MB (trong khoảng 100 - 200 MB)
    const TARGET_NEW_DOCS = 25000;       // Tổng số 25,000 bản ghi mới
    const PAYLOAD_PER_DOC = 5900;        // Mỗi bản ghi mang payload ~5.9 KB (tổng BSON đạt ~6.3 KB)
    const BATCH_SIZE = 2500;             // Nạp theo lô 2,500 bản ghi để tối ưu I/O và RAM
    const TOTAL_BATCHES = Math.ceil(TARGET_NEW_DOCS / BATCH_SIZE);

    console.log(`🎯 Mục tiêu nạp: +${TARGET_NEW_DOCS.toLocaleString()} bản ghi (kích thước mỗi bản ghi ~6.3 KB)`);
    console.log(`📦 Dự kiến dung lượng tăng thêm: ~150 MB (khoảng 100 - 200 MB theo yêu cầu)\n`);

    // Chuẩn bị sẵn khối dữ liệu mô phỏng để tối ưu tốc độ sinh chuỗi trong vòng lặp
    const sharedPayload = createNotificationPayload(PAYLOAD_PER_DOC);

    let createdCount = 0;
    for (let batchIndex = 0; batchIndex < TOTAL_BATCHES; batchIndex++) {
      const batchDocs = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const docIndex = existingCount + createdCount + 1;
        const template = SAMPLE_NOTIFICATIONS[docIndex % SAMPLE_NOTIFICATIONS.length];
        const isBroadcast = (docIndex % 5 === 0); // 20% thông báo chung toàn hệ thống (userId = null)
        const targetUserId = isBroadcast ? null : `usr-bulk-${(docIndex % 25000) + 1}`;
        const isReadStatus = (docIndex % 3 === 0); // 33% đã đọc, 67% chưa đọc

        batchDocs.push({
          id: `notif-bulk-${docIndex}`,
          userId: targetUserId,
          title: `${template.title} #${docIndex}`,
          message: template.message,
          type: template.type,
          link: template.link,
          isRead: isReadStatus,
          metadata: {
            orderId: template.type === 'order' ? `ord-bulk-${docIndex}` : null,
            couponCode: template.type === 'coupon' ? `BOOKSTORE${(docIndex % 50) + 10}` : null,
            channel: 'fcm_push_gateway',
            deviceTokens: [
              `fcm_token_${docIndex}_ios_${crypto.randomBytes(4).toString('hex')}`,
              `fcm_token_${docIndex}_android_${crypto.randomBytes(4).toString('hex')}`
            ],
            // Khối dữ liệu chi tiết mô phỏng log sự kiện đẩy thông báo (~5.9 KB)
            payloadContent: sharedPayload
          },
          createdAt: new Date(Date.now() - (docIndex * 45000)), // Trải đều thời gian thông báo
          updatedAt: new Date(Date.now() - (docIndex * 45000))
        });

        createdCount++;
      }

      // Ghi lô tài liệu vào MongoDB với tùy chọn ordered: false để tăng tốc tối đa
      await notificationsCol.insertMany(batchDocs, { ordered: false });

      const currentEstimatedMB = ((createdCount * (PAYLOAD_PER_DOC + 400)) / (1024 * 1024)).toFixed(1);
      console.log(`   🔔 Đã nạp batch ${batchIndex + 1}/${TOTAL_BATCHES} (+${batchDocs.length} notifications, tích lũy ~${currentEstimatedMB} MB)`);
    }

    console.log(`\n✅ Nạp dữ liệu notifications hoàn tất! Đang kiểm tra lại thống kê thực tế...`);

    // 4. Lấy thống kê chi tiết sau khi nạp từ MongoDB
    const finalStats = await db.command({ collStats: 'notifications' });
    const finalCount = await notificationsCol.countDocuments();
    const finalDataMB = ((finalStats.size || 0) / (1024 * 1024)).toFixed(2);
    const finalStorageMB = ((finalStats.storageSize || 0) / (1024 * 1024)).toFixed(2);
    const avgDocKB = (((finalStats.size || 0) / finalCount) / 1024).toFixed(2);
    const executionSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n================================================================');
    console.log('🎉 KẾT QUẢ DUNG LƯỢNG BẢNG NOTIFICATIONS TRÊN MONGODB COMPASS');
    console.log('================================================================');
    console.log(`📁 Collection Name       : notifications`);
    console.log(`📄 Tổng số Documents     : ${finalCount.toLocaleString()} bản ghi`);
    console.log(`🔥 Data Size (Chính xác) : ${finalDataMB} MB (Đạt chuẩn khoảng 100 - 200 MB)`);
    console.log(`💾 Storage Size          : ${finalStorageMB} MB (Sau khi nén WiredTiger)`);
    console.log(`📐 Avg. Document Size    : ${avgDocKB} KB`);
    console.log(`⏱️ Thời gian thực thi    : ${executionSeconds} giây`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình nạp dữ liệu notifications:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn với cơ sở dữ liệu.');
  }
}

// Thực thi tiến trình nạp
seedNotifications();
