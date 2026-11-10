/**
 * Script nạp dữ liệu quy mô lớn (Big Data ~2GB) cho MongoDB BookStore trên AWS EC2
 * Mục tiêu theo yêu cầu người dùng:
 * - Bảng products: ~1.0 GB (10,000 cuốn sách có nội dung số hóa chi tiết)
 * - Các bảng còn lại chia đều: ~1.0 GB (~256 MB mỗi bảng: reviews, users, orders, orderitems)
 * - Tổng dung lượng database bookstore: ~2.05 GB
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

// Danh sách thể loại sách
const CATEGORIES = [
  'Văn học - Tiểu thuyết',
  'Kinh tế - Kinh doanh',
  'Kỹ năng sống',
  'Công nghệ - Lập trình',
  'Khoa học - Triết học',
  'Thiếu nhi',
  'Tâm lý học',
  'Lịch sử - Địa lý',
  'Ngoại ngữ'
];

// Danh sách nhà xuất bản
const PUBLISHERS = [
  'NXB Trẻ',
  'NXB Kim Đồng',
  'NXB Hội Nhà Văn',
  'NXB Phụ Nữ',
  'NXB Thế Giới',
  'NXB Lao Động',
  'NXB Dân Trí',
  'NXB Tổng Hợp TP.HCM'
];

// Danh sách các tác giả
const AUTHORS = [
  'Nguyễn Nhật Ánh', 'Paulo Coelho', 'Tô Hoài', 'Vũ Trọng Phụng', 'Haruki Murakami',
  'Dale Carnegie', 'Napoleon Hill', 'Yuval Noah Harari', 'Stephen Hawking', 'Robert C. Martin',
  'Dan Brown', 'J.K. Rowling', 'George Orwell', 'Ayn Rand', 'Victor Hugo'
];

// Danh sách họ tên Việt Nam
const VIETNAMESE_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Thảo', 'Phạm Quốc Hưng', 'Lê Bảo Châu', 'Hoàng Minh Tuấn',
  'Đặng Văn Lâm', 'Ngô Thị Mai', 'Trịnh Hoàng Long', 'Đỗ Thị Lan', 'Nguyễn Duy Cường',
  'Bùi Tuyết Mai', 'Vũ Thành Đạt', 'Lý Hải Đăng', 'Đinh Hồng Hạnh', 'Dương Gia Huy',
  'Hà Thị Thùy Dung', 'Mai Đức Chung', 'Lương Bích Hữu', 'Hồ Hoài Anh', 'Phan Anh Tuấn'
];

// Danh sách thành phố
const CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
  'Huế', 'Nha Trang', 'Buôn Ma Thuột', 'Vũng Tàu', 'Đà Lạt'
];

// Tạo đoạn văn bản tiếng Việt mẫu để làm nội dung sách
const SAMPLE_BOOK_TEXT = `Tác phẩm phản ánh chân thực dòng chảy văn hóa, lịch sử và tâm lý nhân loại qua các thời kỳ phát triển rực rỡ. Mỗi chương sách là một lát cắt sâu sắc về số phận con người trước những biến thiên thời đại, khẳng định giá trị vĩnh cửu của tình thương, lòng dũng cảm và khát vọng tự do. `;

/**
 * Sinh chuỗi nội dung văn bản số hóa (kích thước tính theo byte)
 */
function createContentPayload(targetBytes) {
  const repeatCount = Math.floor(targetBytes / Buffer.byteLength(SAMPLE_BOOK_TEXT, 'utf8'));
  const textPart = SAMPLE_BOOK_TEXT.repeat(Math.max(1, repeatCount));
  const remaining = targetBytes - Buffer.byteLength(textPart, 'utf8');
  const padPart = remaining > 0 ? crypto.randomBytes(Math.floor(remaining / 2)).toString('hex') : '';
  return textPart + padPart;
}

async function runSeed2GB() {
  console.log('================================================================');
  console.log('🚀 [BookStore Big Data Seeding Tool ~2.0 GB]');
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

    // -------------------------------------------------------------------------
    // 1. NẠP BẢNG PRODUCTS (~1.0 GB): 10,000 cuốn sách, mỗi cuốn ~105 KB
    // -------------------------------------------------------------------------
    console.log('📦 [1/5] Bắt đầu nạp dữ liệu bảng [products] mục tiêu ~1.0 GB...');
    const productsCol = db.collection('products');
    const existingProductsCount = await productsCol.countDocuments();
    const TARGET_PRODUCTS = 10000;
    const PRODUCT_PAYLOAD_SIZE = 102400; // ~100 KB payload per book (Tổng = ~1.02 GB)
    const productBatchSize = 1000;
    const productBatches = Math.ceil((TARGET_PRODUCTS - Math.min(existingProductsCount, 150)) / productBatchSize);

    let prodCreated = 0;
    for (let b = 0; b < productBatches; b++) {
      const batchDocs = [];
      const batchPayload = createContentPayload(PRODUCT_PAYLOAD_SIZE);

      for (let i = 0; i < productBatchSize; i++) {
        const idx = existingProductsCount + prodCreated + 1;
        const cat = CATEGORIES[idx % CATEGORIES.length];
        const author = AUTHORS[idx % AUTHORS.length];
        const pub = PUBLISHERS[idx % PUBLISHERS.length];
        const price = (Math.floor(Math.random() * 25) + 6) * 10000;

        batchDocs.push({
          id: `prod-bulk-${idx}`,
          name: `Tuyệt Phẩm Văn Học & Tri Thức Số ${idx} - ${author}`,
          category: cat,
          price: price,
          originalPrice: Math.round(price * 1.25),
          discountPercent: 20,
          rating: 4.8,
          reviewsCount: 15,
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
          description: `Cuốn sách nổi tiếng chứa đựng tri thức toàn diện về ${cat}, được độc giả toàn quốc yêu thích.`,
          author: author,
          publisher: pub,
          publicationYear: 2024,
          pages: 350,
          isbn: `978-604-${100 + (idx % 800)}-${1000 + (idx % 8000)}-${idx % 9}`,
          specs: {
            'Tác giả': author,
            'Nhà xuất bản': pub,
            'Số trang': '350 trang',
            'Hình thức': 'Bìa mềm'
          },
          inStock: true,
          stockQuantity: 50,
          featured: idx % 10 === 0,
          ebookContent: batchPayload, // ~100 KB nội dung số hóa
          createdAt: new Date(),
          updatedAt: new Date()
        });
        prodCreated++;
      }

      await productsCol.insertMany(batchDocs, { ordered: false });
      const currentMB = ((prodCreated * PRODUCT_PAYLOAD_SIZE) / (1024 * 1024)).toFixed(1);
      console.log(`   📚 Đã nạp batch ${b + 1}/${productBatches} products (+${batchDocs.length} cuốn sách, tích lũy ~${currentMB} MB)`);
    }
    console.log(`✅ Hoàn thành bảng [products]!\n`);

    // -------------------------------------------------------------------------
    // 2. NẠP BẢNG REVIEWS (~256 MB): 25,000 bài đánh giá, mỗi bài ~10.5 KB
    // -------------------------------------------------------------------------
    console.log('⭐ [2/5] Bắt đầu nạp dữ liệu bảng [reviews] mục tiêu ~256 MB...');
    const reviewsCol = db.collection('reviews');
    const existingReviewsCount = await reviewsCol.countDocuments();
    const TARGET_REVIEWS = 25000;
    const REVIEW_PAYLOAD_SIZE = 10500; // ~10.5 KB
    const reviewBatchSize = 2500;
    const reviewBatches = Math.ceil(TARGET_REVIEWS / reviewBatchSize);

    let revCreated = 0;
    for (let b = 0; b < reviewBatches; b++) {
      const batchDocs = [];
      const reviewText = createContentPayload(REVIEW_PAYLOAD_SIZE);

      for (let i = 0; i < reviewBatchSize; i++) {
        const idx = existingReviewsCount + revCreated + 1;
        const author = VIETNAMESE_NAMES[idx % VIETNAMESE_NAMES.length];

        batchDocs.push({
          id: `rev-bulk-${idx}`,
          productId: `prod-bulk-${(idx % 10000) + 1}`,
          userId: `usr-bulk-${(idx % 25000) + 1}`,
          author: author,
          rating: (idx % 5 === 0) ? 4 : 5,
          date: `${(idx % 30) + 1} ngày trước`,
          content: `Bài nhận xét chuyên sâu số ${idx}: ${reviewText}`,
          verified: true,
          likes: idx % 45,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        revCreated++;
      }

      await reviewsCol.insertMany(batchDocs, { ordered: false });
      const currentMB = ((revCreated * REVIEW_PAYLOAD_SIZE) / (1024 * 1024)).toFixed(1);
      console.log(`   ⭐ Đã nạp batch ${b + 1}/${reviewBatches} reviews (+${batchDocs.length} đánh giá, tích lũy ~${currentMB} MB)`);
    }
    console.log(`✅ Hoàn thành bảng [reviews]!\n`);

    // -------------------------------------------------------------------------
    // 3. NẠP BẢNG USERS (~256 MB): 25,000 người dùng, mỗi tài khoản ~10.5 KB
    // -------------------------------------------------------------------------
    console.log('👥 [3/5] Bắt đầu nạp dữ liệu bảng [users] mục tiêu ~256 MB...');
    const usersCol = db.collection('users');
    const existingUsersCount = await usersCol.countDocuments();
    const TARGET_USERS = 25000;
    const USER_PAYLOAD_SIZE = 10500; // ~10.5 KB
    const userBatchSize = 2500;
    const userBatches = Math.ceil(TARGET_USERS / userBatchSize);

    let userCreated = 0;
    for (let b = 0; b < userBatches; b++) {
      const batchDocs = [];
      const userBio = createContentPayload(USER_PAYLOAD_SIZE);

      for (let i = 0; i < userBatchSize; i++) {
        const idx = existingUsersCount + userCreated + 1;
        const rawName = VIETNAMESE_NAMES[idx % VIETNAMESE_NAMES.length];
        const city = CITIES[idx % CITIES.length];

        batchDocs.push({
          id: `usr-bulk-${idx}`,
          name: `${rawName} #${idx}`,
          email: `docgia.vietnam.${idx}@bookstore.vn`,
          phone: `09${String(10000000 + (idx % 89999999))}`,
          role: 'customer',
          status: 'active',
          password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890dummyHashForDevOps',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=usr-${idx}`,
          address: `Số ${10 + (idx % 200)} Đường Độc Lập, ${city}`,
          profileBio: userBio, // ~10.5 KB hồ sơ độc giả
          createdAtStr: new Date().toLocaleDateString('vi-VN'),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        userCreated++;
      }

      await usersCol.insertMany(batchDocs, { ordered: false });
      const currentMB = ((userCreated * USER_PAYLOAD_SIZE) / (1024 * 1024)).toFixed(1);
      console.log(`   👥 Đã nạp batch ${b + 1}/${userBatches} users (+${batchDocs.length} tài khoản, tích lũy ~${currentMB} MB)`);
    }
    console.log(`✅ Hoàn thành bảng [users]!\n`);

    // -------------------------------------------------------------------------
    // 4. NẠP BẢNG ORDERS (~256 MB): 25,000 đơn hàng, mỗi đơn ~10.5 KB
    // -------------------------------------------------------------------------
    console.log('🚚 [4/5] Bắt đầu nạp dữ liệu bảng [orders] mục tiêu ~256 MB...');
    const ordersCol = db.collection('orders');
    const existingOrdersCount = await ordersCol.countDocuments();
    const TARGET_ORDERS = 25000;
    const ORDER_PAYLOAD_SIZE = 10500; // ~10.5 KB
    const orderBatchSize = 2500;
    const orderBatches = Math.ceil(TARGET_ORDERS / orderBatchSize);

    const STATUSES = ['Chờ xác nhận', 'Chờ lấy hàng', 'Chờ giao hàng', 'Hoàn tất'];
    const METHODS = ['VietQR', 'COD', 'Banking'];

    let orderCreated = 0;
    for (let b = 0; b < orderBatches; b++) {
      const batchDocs = [];
      const orderPayload = createContentPayload(ORDER_PAYLOAD_SIZE);

      for (let i = 0; i < orderBatchSize; i++) {
        const idx = existingOrdersCount + orderCreated + 1;
        const customer = VIETNAMESE_NAMES[idx % VIETNAMESE_NAMES.length];
        const status = STATUSES[idx % STATUSES.length];
        const city = CITIES[idx % CITIES.length];

        batchDocs.push({
          id: `ord-bulk-${idx}`,
          orderNumber: `ORD-2026-${String(100000 + idx)}`,
          customerName: customer,
          customerPhone: `09${String(10000000 + (idx % 89999999))}`,
          shippingAddress: `Tòa nhà Tri Thức, ${city}`,
          paymentMethod: METHODS[idx % METHODS.length],
          paymentStatus: status === 'Hoàn tất' ? 'paid' : 'pending',
          orderStatus: status,
          shippingPickupTime: '15:30 11/11/2026',
          totalPrice: (Math.floor(Math.random() * 20) + 5) * 50000,
          itemCount: (idx % 4) + 1,
          trackingTimelineFull: orderPayload, // ~10.5 KB lịch trình vận đơn
          createdAt: new Date(),
          updatedAt: new Date()
        });
        orderCreated++;
      }

      await ordersCol.insertMany(batchDocs, { ordered: false });
      const currentMB = ((orderCreated * ORDER_PAYLOAD_SIZE) / (1024 * 1024)).toFixed(1);
      console.log(`   🚚 Đã nạp batch ${b + 1}/${orderBatches} orders (+${batchDocs.length} đơn hàng, tích lũy ~${currentMB} MB)`);
    }
    console.log(`✅ Hoàn thành bảng [orders]!\n`);

    // -------------------------------------------------------------------------
    // 5. NẠP BẢNG ORDERITEMS (~256 MB): 25,000 chi tiết đơn, mỗi mục ~10.5 KB
    // -------------------------------------------------------------------------
    console.log('📑 [5/5] Bắt đầu nạp dữ liệu bảng [orderitems] mục tiêu ~256 MB...');
    const orderItemsCol = db.collection('orderitems');
    const existingItemsCount = await orderItemsCol.countDocuments();
    const TARGET_ITEMS = 25000;
    const ITEM_PAYLOAD_SIZE = 10500; // ~10.5 KB
    const itemBatchSize = 2500;
    const itemBatches = Math.ceil(TARGET_ITEMS / itemBatchSize);

    let itemCreated = 0;
    for (let b = 0; b < itemBatches; b++) {
      const batchDocs = [];
      const itemPayload = createContentPayload(ITEM_PAYLOAD_SIZE);

      for (let i = 0; i < itemBatchSize; i++) {
        const idx = existingItemsCount + itemCreated + 1;

        batchDocs.push({
          id: `item-bulk-${idx}`,
          orderId: `ord-bulk-${idx}`,
          productId: `prod-bulk-${(idx % 10000) + 1}`,
          productName: `Sách Văn Hóa & Tri Thức Bestseller #${(idx % 10000) + 1}`,
          quantity: (idx % 3) + 1,
          unitPrice: 85000,
          totalPrice: 85000 * ((idx % 3) + 1),
          itemPayload: itemPayload, // ~10.5 KB chi tiết hóa đơn
          createdAt: new Date(),
          updatedAt: new Date()
        });
        itemCreated++;
      }

      await orderItemsCol.insertMany(batchDocs, { ordered: false });
      const currentMB = ((itemCreated * ITEM_PAYLOAD_SIZE) / (1024 * 1024)).toFixed(1);
      console.log(`   📑 Đã nạp batch ${b + 1}/${itemBatches} orderitems (+${batchDocs.length} món hàng, tích lũy ~${currentMB} MB)`);
    }
    console.log(`✅ Hoàn thành bảng [orderitems]!\n`);

    // -------------------------------------------------------------------------
    // BÁO CÁO THỐNG KÊ TỔNG THỂ DUNG LƯỢNG MONGODB COMPASS
    // -------------------------------------------------------------------------
    console.log('================================================================');
    console.log('🎉 THỐNG KÊ CHI TIẾT DUNG LƯỢNG DATABASE TRÊN MONGODB COMPASS');
    console.log('================================================================');

    const collections = ['products', 'reviews', 'users', 'orders', 'orderitems', 'categories', 'coupons'];
    let totalDataBytes = 0;
    let totalStorageBytes = 0;

    for (const c of collections) {
      try {
        const s = await db.command({ collStats: c });
        totalDataBytes += s.size || 0;
        totalStorageBytes += s.storageSize || 0;
        const mbSize = ((s.size || 0) / (1024 * 1024)).toFixed(2);
        const gbSize = ((s.size || 0) / (1024 * 1024 * 1024)).toFixed(2);
        console.log(`📁 Collection [${c.padEnd(11)}] : ${String(s.count).padStart(6)} documents | Size: ${String(mbSize).padStart(8)} MB (~${gbSize} GB)`);
      } catch (err) {
        console.log(`📁 Collection [${c}]: Lỗi lấy stats: ${err.message}`);
      }
    }

    const totalDBStats = await db.stats();
    const finalDataGB = (totalDBStats.dataSize / (1024 * 1024 * 1024)).toFixed(2);
    const finalStorageGB = (totalDBStats.storageSize / (1024 * 1024 * 1024)).toFixed(2);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('----------------------------------------------------------------');
    console.log(`🔥 TỔNG DUNG LƯỢNG DATA SIZE    : ${finalDataGB} GB (~${(totalDBStats.dataSize / (1024 * 1024)).toFixed(1)} MB)`);
    console.log(`💾 TỔNG DUNG LƯỢNG STORAGE SIZE : ${finalStorageGB} GB (~${(totalDBStats.storageSize / (1024 * 1024)).toFixed(1)} MB)`);
    console.log(`⏱️ Thời gian thực thi           : ${duration} giây`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Lỗi nạp Big Data:', err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn.');
  }
}

runSeed2GB().catch(() => process.exit(1));
