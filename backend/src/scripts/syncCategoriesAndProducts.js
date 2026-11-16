/**
 * Script chuẩn hóa và đồng bộ danh mục thể loại sách giữa bảng products và categories
 */
const mongoose = require('mongoose');

const TARGET_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

async function run() {
  await mongoose.connect(TARGET_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  const productsCol = mongoose.connection.db.collection('products');
  const categoriesCol = mongoose.connection.db.collection('categories');

  console.log('\n--- BƯỚC 1: SỐ LƯỢNG TRƯỚC KHI ĐỒNG BỘ ---');
  const beforeStats = await productsCol.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  beforeStats.forEach(s => console.log(`- "${s._id}": ${s.count} cuốn`));

  // 1. Lịch sử - Địa lý -> Lịch sử - Địa lý - Văn hóa
  const resHist = await productsCol.updateMany(
    { category: { $in: ['Lịch sử - Địa lý', 'Lịch Sử - Địa lý', 'Lịch sử - địa lý', 'Lịch Sử - Địa Lý'] } },
    { $set: { category: 'Lịch sử - Địa lý - Văn hóa' } }
  );
  console.log(`\n🔄 [1] Cập nhật Lịch sử - Địa lý -> Lịch sử - Địa lý - Văn hóa: ${resHist.modifiedCount} cuốn`);

  // 2. Sách Thiếu nhi -> Thiếu nhi
  const resChild = await productsCol.updateMany(
    { category: { $in: ['Sách Thiếu nhi', 'Sách thiếu nhi', 'sách thiếu nhi', 'Thiếu Nhi'] } },
    { $set: { category: 'Thiếu nhi' } }
  );
  console.log(`🔄 [2] Cập nhật Sách Thiếu nhi -> Thiếu nhi: ${resChild.modifiedCount} cuốn`);

  // 3. Ngoại ngữ -> Ngoại ngữ - Từ điển
  const resLang = await productsCol.updateMany(
    { category: { $in: ['Ngoại ngữ', 'Ngoại Ngữ', 'ngoại ngữ'] } },
    { $set: { category: 'Ngoại ngữ - Từ điển' } }
  );
  console.log(`🔄 [3] Cập nhật Ngoại ngữ -> Ngoại ngữ - Từ điển: ${resLang.modifiedCount} cuốn`);

  // 4. Khoa học - Công nghệ:
  // Robert C. Martin và DevOps Academy -> Công nghệ - Lập trình
  const resTech = await productsCol.updateMany(
    {
      category: 'Khoa học - Công nghệ',
      $or: [
        { author: { $regex: /Robert C\. Martin|DevOps|Martin Fowler|Gene Kim/i } },
        { name: { $regex: /Lập Trình|Phần Mềm|Hệ Thống|CI\/CD|DevOps|Docker|Kubernetes|Web|API|Database|Microservices/i } }
      ]
    },
    { $set: { category: 'Công nghệ - Lập trình' } }
  );
  console.log(`🔄 [4a] Cập nhật Khoa học - Công nghệ (Tech/DevOps) -> Công nghệ - Lập trình: ${resTech.modifiedCount} cuốn`);

  // Stephen Hawking và Yuval Noah Harari (và các sách còn lại của Khoa học - Công nghệ) -> Khoa học - Triết học
  const resSci = await productsCol.updateMany(
    { category: 'Khoa học - Công nghệ' },
    { $set: { category: 'Khoa học - Triết học' } }
  );
  console.log(`🔄 [4b] Cập nhật Khoa học - Công nghệ (Khoa học/Triết học) -> Khoa học - Triết học: ${resSci.modifiedCount} cuốn`);

  console.log('\n--- BƯỚC 2: SỐ LƯỢNG SAU KHI ĐỒNG BỘ TRONG PRODUCTS ---');
  const afterStats = await productsCol.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  let totalProducts = 0;
  afterStats.forEach(s => {
    console.log(`- "${s._id}": ${s.count} cuốn`);
    totalProducts += s.count;
  });
  console.log(`Tổng cộng: ${totalProducts} cuốn sách`);

  console.log('\n--- BƯỚC 3: ĐỐI SOÁT VỚI BẢNG CATEGORIES ---');
  const allCategories = await categoriesCol.find().sort({ displayOrder: 1 }).toArray();
  for (const cat of allCategories) {
    const count = await productsCol.countDocuments({ category: cat.name });
    console.log(`- [Danh mục ${cat.displayOrder}] "${cat.name}": ${count} cuốn`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
