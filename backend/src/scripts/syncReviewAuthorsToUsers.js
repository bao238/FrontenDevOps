/**
 * Script kiểm tra và đồng bộ tác giả đánh giá (reviews) vào bảng người dùng (users)
 * Đảm bảo 100% người đánh giá trong reviews đều có tài khoản tương ứng trong collection users
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const Review = require('../models/Review');

async function syncAuthors() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';
  console.log(`🔌 Kết nối MongoDB: ${mongoUri}`);

  await mongoose.connect(mongoUri);

  // 1. Kiểm tra tài khoản Trần Minh Hoàng cụ thể
  const existingTMH = await User.findOne({ name: /Trần Minh Hoàng/i });
  console.log(`Kiểm tra Trần Minh Hoàng trong users:`, existingTMH ? `Đã có (${existingTMH.id})` : 'Chưa có');

  // 2. Tạo tài khoản chính thức cho Trần Minh Hoàng nếu chưa có
  let tmhUserId = 'usr-cust-tmh';
  if (!existingTMH) {
    const newUser = await User.create({
      id: tmhUserId,
      name: 'Trần Minh Hoàng',
      email: 'tranminhhoang@bookstore.vn',
      phone: '0912 345 678',
      role: 'customer',
      status: 'active',
      password: 'demo123', // Mật khẩu mẫu
      avatarUrl: '/default-avatar.png',
      address: '15 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng'
    });
    console.log(`✅ Đã tạo mới tài khoản cho Trần Minh Hoàng: ID = ${newUser.id}`);
  } else {
    tmhUserId = existingTMH.id;
  }

  // 3. Cập nhật userId trong bảng reviews cho các review của Trần Minh Hoàng
  const updateResult = await Review.updateMany(
    { author: /Trần Minh Hoàng/i },
    { $set: { userId: tmhUserId } }
  );
  console.log(`✅ Đã cập nhật ${updateResult.modifiedCount} đánh giá của Trần Minh Hoàng trỏ về userId: ${tmhUserId}`);

  // 4. Kiểm tra các review mẫu ban đầu khác (rev-1 đến rev-12)
  const initialAuthors = [
    { name: 'Nguyễn Quốc Bảo', email: 'quocbao@bookstore.vn', phone: '0905 111 222' },
    { name: 'Võ Thành Đạt (Dev)', email: 'thanhdat.dev@bookstore.vn', phone: '0905 333 444' },
    { name: 'Nguyễn Hoàng Nam', email: 'hoangnam@bookstore.vn', phone: '0905 555 666' },
    { name: 'Đặng Văn Lâm', email: 'vanlam@bookstore.vn', phone: '0905 777 888' },
    { name: 'Phan Thanh Tùng', email: 'thanhtung@bookstore.vn', phone: '0905 999 000' },
    { name: 'Hoàng Minh Tuấn', email: 'minhtuan@bookstore.vn', phone: '0913 111 222' },
    { name: 'Bùi Phương Linh', email: 'phuonglinh@bookstore.vn', phone: '0913 333 444' },
    { name: 'Lê Bảo Châu', email: 'baochau@bookstore.vn', phone: '0913 555 666' },
    { name: 'Vũ Mai Anh', email: 'maianh@bookstore.vn', phone: '0913 777 888' },
    { name: 'Đỗ Thị Lan', email: 'dothilan@bookstore.vn', phone: '0913 999 000' }
  ];

  for (let i = 0; i < initialAuthors.length; i++) {
    const item = initialAuthors[i];
    const exists = await User.findOne({ name: item.name });
    let uId = `usr-cust-mock-${i + 1}`;
    if (!exists) {
      const u = await User.create({
        id: uId,
        name: item.name,
        email: item.email,
        phone: item.phone,
        role: 'customer',
        status: 'active',
        password: 'demo123',
        avatarUrl: '/default-avatar.png',
        address: 'Đà Nẵng'
      });
      console.log(`✅ Đã tạo user bổ sung: ${u.name} (ID: ${u.id})`);
    } else {
      uId = exists.id;
    }
    await Review.updateMany({ author: item.name }, { $set: { userId: uId } });
  }

  const finalCheck = await User.findOne({ name: /Trần Minh Hoàng/i });
  console.log(`🎉 Kiểm tra lại Trần Minh Hoàng:`, {
    id: finalCheck.id,
    name: finalCheck.name,
    email: finalCheck.email,
    role: finalCheck.role
  });

  await mongoose.disconnect();
}

syncAuthors().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
