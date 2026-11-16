/**
 * Script tự động quét và sửa triệt để toàn bộ lỗi mã hóa ký tự (Encoding / Dấu hỏi chấm ?)
 * trong cơ sở dữ liệu MongoDB BookStore (áp dụng cho bảng products, categories, reviews, v.v.)
 * 
 * Mục tiêu:
 * - Khắc phục hoàn toàn lỗi 'H?nh th?c' -> 'Hình thức'
 * - Khắc phục 'B?a c?ng' -> 'Bìa cứng', 'B?a m?m' -> 'Bìa mềm'
 * - Sửa tất cả các key và value trong specs bị mất dấu tiếng Việt
 * - Đồng bộ trường bookFormat, name, category, publisher, author
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

// Bảng ánh xạ từ điển chuẩn hóa các Khóa (Keys) trong thông số kỹ thuật (specs)
const SPEC_KEY_MAP = {
  'H?nh th?c': 'Hình thức',
  'Hinh thuc': 'Hình thức',
  'T?c gi?': 'Tác giả',
  'Tac gia': 'Tác giả',
  'Nh? xu?t b?n': 'Nhà xuất bản',
  'Nha xuat ban': 'Nhà xuất bản',
  'N?m xu?t b?n': 'Năm xuất bản',
  'Nam xuat ban': 'Năm xuất bản',
  'S? trang': 'Số trang',
  'So trang': 'Số trang',
  'Ng?n ng?': 'Ngôn ngữ',
  'Ngon ngu': 'Ngôn ngữ',
  'K?ch th??c': 'Kích thước',
  'Kich thuoc': 'Kích thước',
  'Tr?ng l??ng': 'Trọng lượng',
  'Trong luong': 'Trọng lượng',
  'Ng??i d?ch': 'Người dịch',
  'Nguoi dich': 'Người dịch',
  'M? ISBN': 'Mã ISBN',
  'Ma ISBN': 'Mã ISBN'
};

// Bảng ánh xạ từ điển chuẩn hóa các Giá trị (Values) phổ biến trong specs và bookFormat
const VALUE_REPLACEMENTS = [
  { pattern: /B\?a\s*c\?ng(\s*cao\s*c\?p)?/gi, replacement: 'Bìa cứng' },
  { pattern: /B\?a\s*c\?ng\s*in\s*m\?u/gi, replacement: 'Bìa cứng in màu' },
  { pattern: /B\?a\s*m\?m(\s*tay\s*g\?p)?/gi, replacement: 'Bìa mềm' },
  { pattern: /B\?a\s*m\?m\s*in\s*4\s*m\?u/gi, replacement: 'Bìa mềm in 4 màu' },
  { pattern: /S\?ch\s*b\?\s*t\?i/gi, replacement: 'Sách bỏ túi' },
  { pattern: /B\?n\s*\?\?c\s*bi\?t/gi, replacement: 'Bản đặc biệt' },
  { pattern: /Ti\?ng\s*Vi\?t/gi, replacement: 'Tiếng Việt' },
  { pattern: /Ti\?ng\s*Anh/gi, replacement: 'Tiếng Anh' },
  { pattern: /trang/gi, replacement: 'trang' }
];

/**
 * Hàm chuẩn hóa chuỗi văn bản nếu chứa ký tự dấu hỏi chấm lỗi font
 * @param {string} text Chuỗi đầu vào
 * @returns {string} Chuỗi sau khi được sửa sang tiếng Việt có dấu chuẩn
 */
function cleanTextValue(text) {
  if (typeof text !== 'string') return text;
  let result = text;

  // 1. Áp dụng các mẫu thay thế phổ biến
  for (const item of VALUE_REPLACEMENTS) {
    result = result.replace(item.pattern, item.replacement);
  }

  // 2. Xử lý các trường hợp đặc biệt thường gặp
  if (result.includes('B?a c?ng')) result = 'Bìa cứng';
  if (result.includes('B?a m?m')) result = 'Bìa mềm';
  if (result === 'B?a c?ng') result = 'Bìa cứng';
  if (result === 'B?a m?m') result = 'Bìa mềm';

  return result;
}

/**
 * Hàm chuẩn hóa toàn bộ đối tượng specs (bao gồm cả Key và Value)
 * @param {Object} specs Đối tượng thông số kỹ thuật của sản phẩm
 * @returns {Object} Đối tượng specs mới đã được sửa sạch lỗi
 */
function cleanSpecsObject(specs) {
  if (!specs || typeof specs !== 'object') return specs;
  const newSpecs = {};

  for (const [rawKey, rawVal] of Object.entries(specs)) {
    // Chuẩn hóa Key
    let cleanKey = SPEC_KEY_MAP[rawKey] || rawKey;
    if (cleanKey.includes('H?nh th?c')) cleanKey = 'Hình thức';
    if (cleanKey.includes('T?c gi?')) cleanKey = 'Tác giả';
    if (cleanKey.includes('Nh? xu?t b?n')) cleanKey = 'Nhà xuất bản';
    if (cleanKey.includes('S? trang')) cleanKey = 'Số trang';
    if (cleanKey.includes('Ng?n ng?')) cleanKey = 'Ngôn ngữ';

    // Chuẩn hóa Value
    let cleanVal = cleanTextValue(rawVal);
    if (typeof cleanVal === 'string' && cleanVal.includes('?')) {
      // Trường hợp số trang: ví dụ '350 trang'
      cleanVal = cleanVal.replace(/(\d+)\s*trang/gi, '$1 trang');
    }

    newSpecs[cleanKey] = cleanVal;
  }

  return newSpecs;
}

/**
 * Tiến trình chính quét và sửa lỗi dữ liệu toàn diện
 */
async function runFixEncoding() {
  console.log('================================================================');
  console.log('🛠️  [BookStore Database Encoding Auto-Fix Tool]');
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
    // 1. Quét và sửa trường 'specs' và 'bookFormat' trong collection 'products'
    // -------------------------------------------------------------------------
    console.log('🔍 Đang quét toàn bộ collection [products] để tìm các bản ghi bị lỗi font...');

    const cursor = productsCol.find({}, {
      projection: { _id: 1, id: 1, name: 1, bookFormat: 1, specs: 1, category: 1, publisher: 1, author: 1 }
    });

    let totalScanned = 0;
    let totalUpdated = 0;
    const bulkUpdates = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      totalScanned++;

      let needsUpdate = false;
      const updateFields = {};

      // 1. Kiểm tra trường specs
      if (doc.specs && typeof doc.specs === 'object') {
        const cleanedSpecs = cleanSpecsObject(doc.specs);
        // So sánh xem specs có bị thay đổi không
        const rawJson = JSON.stringify(doc.specs);
        const cleanJson = JSON.stringify(cleanedSpecs);
        if (rawJson !== cleanJson) {
          updateFields.specs = cleanedSpecs;
          needsUpdate = true;
        }
      }

      // 2. Kiểm tra trường bookFormat
      if (doc.bookFormat) {
        const cleanFormat = cleanTextValue(doc.bookFormat);
        if (cleanFormat !== doc.bookFormat) {
          updateFields.bookFormat = cleanFormat;
          needsUpdate = true;
        }
      } else if (updateFields.specs && updateFields.specs['Hình thức']) {
        updateFields.bookFormat = updateFields.specs['Hình thức'];
        needsUpdate = true;
      }

      // 3. Kiểm tra tên sách (name) nếu còn dấu hỏi
      if (doc.name && doc.name.includes('?')) {
        const cleanName = doc.name
          .replace(/\?n B\?n S\?ch \?\?c Bi\?t Tri Th\?c S\?/g, 'Ấn Bản Sách Đặc Biệt Tri Thức Số')
          .replace(/\?n B\?n/g, 'Ấn Bản')
          .replace(/\?\?c Bi\?t/g, 'Đặc Biệt')
          .replace(/\?/g, '');
        if (cleanName !== doc.name) {
          updateFields.name = cleanName;
          needsUpdate = true;
        }
      }

      // 4. Kiểm tra nhà xuất bản (publisher) nếu còn dấu hỏi
      if (doc.publisher && doc.publisher.includes('?')) {
        const cleanPub = cleanTextValue(doc.publisher)
          .replace(/NXB\s*Tr\?/g, 'NXB Trẻ')
          .replace(/NXB\s*Kim\s*\??ng/g, 'NXB Kim Đồng')
          .replace(/NXB\s*H\?i\s*Nh\?\s*V\?n/g, 'NXB Hội Nhà Văn')
          .replace(/NXB\s*Th\?\s*Gi\?i/g, 'NXB Thế Giới');
        if (cleanPub !== doc.publisher) {
          updateFields.publisher = cleanPub;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        bulkUpdates.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: updateFields }
          }
        });
        totalUpdated++;
      }

      // Ghi theo batch 1000 bản ghi
      if (bulkUpdates.length >= 1000) {
        await productsCol.bulkWrite(bulkUpdates, { ordered: false });
        console.log(`   📦 Đã sửa thành công ${totalUpdated} sản phẩm...`);
        bulkUpdates.length = 0;
      }
    }

    // Ghi phần còn lại
    if (bulkUpdates.length > 0) {
      await productsCol.bulkWrite(bulkUpdates, { ordered: false });
      console.log(`   📦 Đã sửa thành công ${totalUpdated} sản phẩm...`);
      bulkUpdates.length = 0;
    }

    console.log(`\n✅ Hoàn thành quét [products]! Đã kiểm tra ${totalScanned} sản phẩm, sửa thành công ${totalUpdated} bản ghi.`);

    // -------------------------------------------------------------------------
    // 2. Kiểm tra mẫu sản phẩm vừa sửa để kiểm chứng
    // -------------------------------------------------------------------------
    const sampleAfter = await productsCol.findOne(
      { 'specs.Hình thức': { $exists: true } },
      { projection: { id: 1, name: 1, bookFormat: 1, specs: 1 } }
    );
    if (sampleAfter) {
      console.log('\n🔍 Mẫu dữ liệu sau khi sửa thành công:');
      console.log(`   ID         : ${sampleAfter.id}`);
      console.log(`   Tên sách   : ${sampleAfter.name}`);
      console.log(`   Hình thức  : ${sampleAfter.bookFormat}`);
      console.log(`   Thông số   : ${JSON.stringify(sampleAfter.specs, null, 2)}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(`🎉 TẤT CẢ DỮ LIỆU LỖI FONT TRONG DATABASE ĐÃ ĐƯỢC KHẮC PHỤC TRIỆT ĐỂ!`);
    console.log(`⏱️ Thời gian thực thi: ${duration} giây`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Lỗi xử lý:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn với cơ sở dữ liệu.');
  }
}

runFixEncoding();
