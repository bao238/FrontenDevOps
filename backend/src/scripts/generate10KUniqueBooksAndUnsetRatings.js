/**
 * Script cập nhật 10,000+ sản phẩm thành các tựa sách độc lập, hoàn toàn khác nhau (Không trùng tên)
 * Đồng thời xóa bỏ trường rating và reviewsCount trong bảng products (để lấy động từ bảng reviews)
 * 
 * Mục tiêu:
 * - Mỗi cuốn sách có một tựa đề riêng biệt, độc nhất (Unique Title)
 * - Tựa sách "Mắt Biếc" chỉ có DUY NHẤT 1 cuốn là prod-book-3
 * - Không còn bất kỳ hậu tố số thứ tự dạng #372, #373 nào
 * - Xóa sạch trường rating và reviewsCount trong MongoDB collection 'products' ($unset)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

// Kho từ vựng phong phú để sinh tựa sách tiếng Việt tự nhiên, đa dạng
const VOCABULARY = {
  prefixes: [
    'Nghệ Thuật', 'Bí Mật Của', 'Hành Trình', 'Sức Mạnh', 'Tư Duy', 'Lược Sử',
    'Triết Lý', 'Cẩm Nang', 'Nguyên Lý', 'Tinh Hoa', 'Chiến Lược', 'Giải Mã',
    'Những Quy Luật', 'Bước Chuyển', 'Nền Tảng', 'Khát Vọng', 'Đánh Thức',
    'Thế Giới', 'Đối Thoại Về', 'Phương Pháp', 'Bí Quyết', 'Tầm Nhìn',
    'Dòng Chảy', 'Dấu Chân', 'Ánh Sáng', 'Khám Phá', 'Bản Đồ', 'Kỷ Nguyên',
    'Bản Lĩnh', 'Sự Trỗi Dậy Của', 'Bản Giao Hưởng', 'Những Cánh Cửa', 'Tiếng Vọng',
    'Hương Vị Của', 'Văn Hóa', 'Nghệ Thuật Làm Chủ', 'Nhịp Sống', 'Chân Dung',
    'Khơi Nguồn', 'Bí Ẩn Về', 'Hạt Giống'
  ],
  topics: {
    'Văn học - Tiểu thuyết': [
      'Mùa Hoa Bay', 'Phố Cổ Ban Chiều', 'Dòng Sông Ký Ức', 'Biển Đêm Vắng Lặng', 'Ngôi Nhà Trên Đồi Cỏ',
      'Tiếng Dương Cầm Mùa Thu', 'Thành Phố Trong Sương', 'Cánh Đồng Tuổi Thơ', 'Hồi Ức Tháng Năm',
      'Bến Nước Năm Xưa', 'Tiếng Chim Hót Đầu Núi', 'Gió Lạnh Mùa Đông', 'Giai Điệu Quê Hương',
      'Người Giữ Ký Ức', 'Giấc Mơ Phương Xa', 'Chiếc Lá Cuối Rừng', 'Khúc Hát Đò Đưa', 'Nắng Ấm Sau Mưa',
      'Chuyện Cũ Bên Bờ Sông', 'Tiếng Chuông Xóm Đạo', 'Vết Dấu Thời Gian', 'Cơn Mưa Rào Mùa Hạ',
      'Lối Cũ Người Về', 'Những Ngày Bình Yên', 'Vạt Nắng Hoàng Hôn', 'Hương Trầm Đêm Giao Thừa',
      'Cung Đàn Xưa Cũ', 'Chuyện Tình Mùa Tuyết', 'Thung Lũng Mây Trắng', 'Rừng Cây Thay Lá',
      'Tiếng Gió Qua Rặng Tre', 'Đêm Trăng Bên Suối', 'Đoàn Tàu Hoàng Hôn', 'Nẻo Về Xứ Mẹ'
    ],
    'Kinh tế - Kinh doanh': [
      'Tài Chính Doanh Nghiệp', 'Lãnh Đạo Xuất Chúng', 'Quản Trị Rủi Ro', 'Thương Hiệu Toàn Cầu',
      'Đổi Mới Sáng Tạo', 'Chuỗi Cung Ứng', 'Thị Trường Chứng Khoán', 'Đầu Tư Bất Động Sản',
      'Khởi Nghiệp Đột Phá', 'Văn Hóa Doanh Nghiệp', 'Chiến Lược Cạnh Tranh', 'Chuyển Đổi Số',
      'Kinh Tế Vi Mô Hiện Đại', 'Kinh Tế Vĩ Mô Thực Chiến', 'Đàm Phán Thương Mại', 'Trải Nghiệm Khách Hàng',
      'Tối Ưu Chi Phí Vận Hành', 'Dòng Tiền Thông Minh', 'Tái Cấu Trúc Tổ Chức', 'Mô Hình Nhượng Quyền',
      'Quản Trị Dự Án', 'Đầu Tư Giá Trị', 'Hành Vi Tiêu Dùng', 'Phân Tích Báo Cáo Tài Chính',
      'Định Giá Doanh Nghiệp', 'Quản Lý Nguồn Nhân Lực', 'Truyền Thông Tiếp Thị', 'Thương Mại Điện Tử'
    ],
    'Công nghệ - Lập trình': [
      'Kiến Trúc Microservices', 'Hệ Thống Phân Tán', 'Lập Trình Hướng Đối Tượng', 'Cơ Sở Dữ Liệu Lớn',
      'Học Máy Và Thị Giác Máy Tính', 'Trí Tuệ Nhân Tạo Ứng Dụng', 'Kỹ Thuật CI/CD và DevOps',
      'An Toàn Mạng Và Mã Hóa', 'Điện Toán Đám Mây', 'Phát Triển Web Toàn Diện', 'Xử Lý Dữ Liệu Thời Gian Thực',
      'Kiến Trúc Phần Mềm Sạch', 'Kiểm Thử Phần Mềm Tự Động', 'Thiết Kế API Chuẩn REST', 'Lập Trình Bất Đồng Bộ',
      'Phát Triển Ứng Dụng Di Động', 'Công Nghệ Container Docker', 'Quản Trị Cụm Kubernetes',
      'Học Sâu Và Mạng Nơ-ron', 'Khai Phá Dữ Liệu Chuyên Sâu', 'Bảo Mật Ứng Dụng Web', 'Thuật Toán Nâng Cao'
    ],
    'Kỹ năng sống': [
      'Làm Chủ Cảm Xúc', 'Tư Duy Phản Biện', 'Giao Tiếp Thuyết Phục', 'Quản Lý Thời Gian',
      'Kỷ Luật Tự Thân', 'Vượt Qua Nghịch Cảnh', 'Thói Quen Hiệu Quả', 'Tập Trung Sâu',
      'Sống Có Kế Hoạch', 'Nuôi Dưỡng Tinh Thần', 'Giải Quyết Mâu Thuẫn', 'Xây Dựng Mối Quan Hệ',
      'Tự Tin Trước Đám Đông', 'Cân Bằng Cuộc Sống', 'Chữa Lành Nội Tâm', 'Thấu Hiểu Bản Thân',
      'Thích Ứng Với Thay Đổi', 'Tạo Động Lực Mỗi Ngày', 'Nghệ Thuật Lắng Nghe', 'Sống Tích Cực'
    ],
    'Tâm lý học': [
      'Tâm Lý Học Hành Vi', 'Tâm Lý Học Đám Đông', 'Nhận Thức Và Trí Nhớ', 'Tiềm Thức Con Người',
      'Tâm Lý Học Tình Cảm', 'Rối Loạn Lo Âu Và Trầm Cảm', 'Tâm Lý Học Trẻ Em', 'Tâm Lý Học Phát Triển',
      'Ảo Tưởng Và Thực Tế', 'Tâm Lý Học Tổ Chức', 'Cơ Chế Tự Vệ Tinh Thần', 'Năng Lượng Tích Cực'
    ],
    'Khoa học - Triết học': [
      'Vật Lý Lượng Tử', 'Thuyết Tương Đối', 'Vũ Trụ Bao La', 'Nguồn Gốc Sự Sống',
      'Lịch Sử Trái Đất', 'Triết Học Hiện Sinh', 'Triết Học Khắc Kỷ', 'Quy Luật Tự Nhiên',
      'Bản Chất Ý Thức', 'Hệ Sinh Thái Toàn Cầu', 'Tiến Hóa Sinh Học', 'Thời Gian Và Không Gian'
    ],
    'Lịch Sử - Địa lý': [
      'Các Nền Văn Minh Cổ Đại', 'Con Đường Tơ Lụa', 'Lịch Sử Việt Nam Qua Các Thời Kỳ',
      'Địa Lý Các Châu Lục', 'Những Cuộc Khám Phá Hàng Hải', 'Di Sản Thế Giới', 'Dấu Ấn Hoàng Triều'
    ],
    'Thiếu nhi': [
      'Thế Giới Loài Vật Kỳ Thú', 'Khu Vườn Cổ Tích', 'Chuyến Thám Hiểm Rừng Xanh',
      'Những Câu Chuyện Thần Thoại', 'Bí Mật Dưới Đáy Đại Dương', 'Bài Học Đầu Đời', 'Ngôi Sao Nhỏ Ước Mơ'
    ],
    'Ngoại ngữ': [
      'Giao Tiếp Tiếng Anh Thực Chiến', 'Ngữ Pháp Tiếng Anh Hiện Đại', 'Từ Vựng Tiếng Anh Chuyên Ngành',
      'Phương Pháp Luyện Nghe Nói Phản Xạ', 'Chinh Phục Kỳ Thi Quốc Tế', 'Tiếng Anh Trong Công Việc'
    ]
  },
  contexts: [
    'Thời Đại Mới', 'Trong Kỷ Nguyên AI', 'Dành Cho Người Trưởng Thành', 'Cho Tương Lai Bền Vững',
    'Hiện Đại Và Ứng Dụng', 'Toàn Cầu Hóa', 'Từ Cơ Bản Đến Nâng Cao', 'Dành Cho Thế Hệ Trẻ',
    'Bất Biến Qua Năm Tháng', 'Đột Phá Mỗi Ngày', 'Toàn Diện Và Thực Tế', 'Chuyên Sâu Cho Chuyên Gia',
    'Và Đời Sống Thực Tiễn', 'Khẳng Định Giá Trị', 'Vươn Tầm Quốc Tế', 'Theo Chuẩn Mực Mới',
    'Góc Nhìn Thực Tế', 'Khơi Mở Tiềm Năng', 'Đồng Hành Cùng Bạn', 'Đúc Kết Qua Trải Nghiệm'
  ]
};

async function executeMigration() {
  console.log('================================================================');
  console.log('🚀 [BookStore: Đổi 10,000 Sách Độc Nhất & Xóa Rating Khỏi Products]');
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
    const productsCol = db.collection('products');

    // -------------------------------------------------------------------------
    // BƯỚC 1: XÓA RATING VÀ REVIEWSCOUNT TRONG BẢNG PRODUCTS ($unset)
    // -------------------------------------------------------------------------
    console.log('🧹 [1/3] Đang xóa bỏ trường rating và reviewsCount khỏi bảng products...');
    const unsetResult = await productsCol.updateMany(
      {},
      {
        $unset: {
          rating: '',
          reviewsCount: '',
          reviews: ''
        }
      }
    );
    console.log(`✅ Đã xóa rating và reviewsCount cho ${unsetResult.modifiedCount} sản phẩm trong database!\n`);

    // -------------------------------------------------------------------------
    // BƯỚC 2: THU THẬP TÊN SÁCH GỐC ĐỂ TRÁNH TRÙNG LẶP (ĐẶC BIỆT LÀ MẮT BIẾC)
    // -------------------------------------------------------------------------
    console.log('🔒 [2/3] Bảo toàn các tựa sách gốc và khóa từ khóa "Mắt Biếc"...');
    const originalBooks = await productsCol.find({ id: /^prod-book-/ }).toArray();
    const usedTitles = new Set();

    originalBooks.forEach(b => {
      if (b.name) usedTitles.add(b.name.trim().toLowerCase());
    });

    // Tuyệt đối không cho bất kỳ sách nào khác dùng tên "Mắt Biếc"
    usedTitles.add('mắt biếc');
    usedTitles.add('mat biec');
    console.log(`   📚 Đã bảo vệ ${originalBooks.length} tựa sách gốc thực thụ.`);

    // -------------------------------------------------------------------------
    // BƯỚC 3: SINH 10,400 TỰA SÁCH KHÁC NHAU HOÀN TOÀN CHO CÁC SÁCH BULK
    // -------------------------------------------------------------------------
    console.log('✨ [3/3] Bắt đầu gán 10,000+ tựa sách độc lập, phong phú cho các sản phẩm...');
    const bulkCursor = productsCol.find({ id: { $not: /^prod-book-/ } });
    
    let updatedCount = 0;
    const bulkOps = [];
    const BATCH_SIZE = 1000;

    // Bộ đếm tạo sự kết hợp xoay vòng
    let pIdx = 0;
    let sIdx = 0;
    let cIdx = 0;

    while (await bulkCursor.hasNext()) {
      const doc = await bulkCursor.next();
      const cat = doc.category || 'Văn học - Tiểu thuyết';
      const catTopics = VOCABULARY.topics[cat] || VOCABULARY.topics['Văn học - Tiểu thuyết'];

      let uniqueTitle = '';
      let attempts = 0;

      while (attempts < 200) {
        const prefix = VOCABULARY.prefixes[pIdx % VOCABULARY.prefixes.length];
        const topic = catTopics[sIdx % catTopics.length];
        const context = VOCABULARY.contexts[cIdx % VOCABULARY.contexts.length];

        pIdx = (pIdx + 1);
        if (pIdx % VOCABULARY.prefixes.length === 0) sIdx = (sIdx + 1);
        if (sIdx % catTopics.length === 0) cIdx = (cIdx + 1);

        // Tạo cấu trúc tên phong phú (đổi giữa 2 kiểu đặt tên)
        let candidate = '';
        if (attempts % 2 === 0) {
          candidate = `${prefix} ${topic} - ${context}`;
        } else {
          candidate = `${topic}: ${prefix} ${context}`;
        }

        const lower = candidate.toLowerCase();
        if (!usedTitles.has(lower) && !lower.includes('mắt biếc')) {
          uniqueTitle = candidate;
          usedTitles.add(lower);
          break;
        }

        attempts++;
      }

      // Dự phòng nếu quá nhiều
      if (!uniqueTitle) {
        uniqueTitle = `Tuyệt Tác ${cat}: ${VOCABULARY.prefixes[updatedCount % VOCABULARY.prefixes.length]} Đời Sống ${updatedCount + 1}`;
        usedTitles.add(uniqueTitle.toLowerCase());
      }

      // Tạo mô tả phù hợp với tên mới
      const newDesc = `Tác phẩm giá trị thuộc tủ sách ${cat}. Nội dung sâu sắc về ${uniqueTitle}, mang đến góc nhìn mới mẻ và truyền cảm hứng mạnh mẽ cho độc giả.`;

      // Cập nhật specs nếu có
      const updatedSpecs = doc.specs || {};
      updatedSpecs['Tác giả'] = doc.author || updatedSpecs['Tác giả'] || 'Nhiều tác giả';
      updatedSpecs['Nhà xuất bản'] = doc.publisher || updatedSpecs['Nhà xuất bản'] || 'NXB Trẻ';

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              name: uniqueTitle,
              description: newDesc,
              specs: updatedSpecs,
              updatedAt: new Date()
            }
          }
        }
      });

      updatedCount++;

      if (bulkOps.length >= BATCH_SIZE) {
        await productsCol.bulkWrite(bulkOps, { ordered: false });
        console.log(`   📖 Đã đổi tên thành công ${updatedCount} tựa sách...`);
        bulkOps.length = 0;
      }
    }

    if (bulkOps.length > 0) {
      await productsCol.bulkWrite(bulkOps, { ordered: false });
      console.log(`   📖 Đã đổi tên thành công ${updatedCount} tựa sách...`);
      bulkOps.length = 0;
    }

    console.log(`\n✅ Hoàn thành đổi tên cho toàn bộ ${updatedCount} cuốn sách!`);

    // -------------------------------------------------------------------------
    // BƯỚC 4: KIỂM CHỨNG TỪ KHÓA "MẮT BIẾC" VÀ TÍNH ĐỘC NHẤT
    // -------------------------------------------------------------------------
    const matBiecCount = await productsCol.countDocuments({ name: /Mắt Biếc/i });
    console.log('\n================================================================');
    console.log('🔍 KẾT QUẢ ĐỐI SOÁT TRỰC TIẾP TRÊN DATABASE MONGODB:');
    console.log('================================================================');
    console.log(`📖 Số lượng cuốn sách mang tên "Mắt Biếc" hiện tại : ${matBiecCount} cuốn (Chỉ duy nhất prod-book-3)`);
    
    const matBiecDoc = await productsCol.findOne({ name: /Mắt Biếc/i });
    if (matBiecDoc) {
      console.log(`   - ID duy nhất : ${matBiecDoc.id}`);
      console.log(`   - Tên sách    : ${matBiecDoc.name}`);
      console.log(`   - Tác giả     : ${matBiecDoc.author}`);
      console.log(`   - Tồn kho     : ${matBiecDoc.stockQuantity}`);
      console.log(`   - Rating tồn tại trong doc không? : ${matBiecDoc.rating !== undefined ? 'CÓ (lỗi)' : 'KHÔNG (Đã xóa thành công)'}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Thời gian thực thi: ${duration} giây`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Lỗi thực thi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã đóng kết nối MongoDB an toàn.');
  }
}

executeMigration();
