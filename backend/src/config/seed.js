const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');

const initialProducts = [
  {
    id: 'prod-1',
    name: 'MacBook Pro 14 inch M3 Pro (18GB / 512GB SSD)',
    category: 'Laptop & PC',
    price: 49990000,
    originalPrice: 54990000,
    discountPercent: 9,
    rating: 4.9,
    reviewsCount: 128,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    description: 'MacBook Pro 14 M3 Pro mang lại hiệu năng đỉnh cao cho lập trình viên và nhà thiết kế. Màn hình Liquid Retina XDR 120Hz siêu nét, thời lượng pin lên đến 18 giờ liên tục.',
    specs: {
      'Chip xử lý': 'Apple M3 Pro 11-core CPU',
      'RAM': '18GB Unified Memory',
      'Ổ cứng': '512GB SSD siêu tốc',
      'Màn hình': '14.2 inch Liquid Retina XDR (3024x1964)',
      'Trọng lượng': '1.61 kg',
      'Cổng kết nối': 'Thunderbolt 4, HDMI, MagSafe 3, SDXC'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-2',
    name: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
    category: 'Điện thoại',
    price: 29490000,
    originalPrice: 34990000,
    discountPercent: 15,
    rating: 4.8,
    reviewsCount: 340,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    description: 'Khung viền Titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ. Chip A17 Pro mạnh mẽ hỗ trợ chơi game đồ họa đỉnh cao, camera tiềm vọng zoom quang học 5x.',
    specs: {
      'Màn hình': '6.7 inch Super Retina XDR OLED 120Hz',
      'Chip': 'Apple A17 Pro (3nm)',
      'Bộ nhớ': '256GB',
      'Camera sau': '48MP + 12MP + 12MP (Zoom 5x)',
      'Cổng sạc': 'USB-C chuẩn 3.0',
      'Kháng nước': 'IP68'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-3',
    name: 'Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao',
    category: 'Âm thanh',
    price: 6990000,
    originalPrice: 8990000,
    discountPercent: 22,
    rating: 4.9,
    reviewsCount: 95,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    description: 'Công nghệ chống ồn chủ động hàng đầu thế giới với 8 micro và bộ xử lý kép V1/QN1. Âm thanh Hi-Res Audio chuẩn phòng thu, thời lượng pin 30 giờ.',
    specs: {
      'Thời lượng pin': '30 giờ (bật ANC)',
      'Công nghệ': 'Chống ồn tự động Auto NC Optimizer',
      'Driver': '30mm màng carbon tổng hợp',
      'Trọng lượng': '250g',
      'Kết nối': 'Bluetooth 5.2, LDAC, AUX 3.5mm'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-4',
    name: 'Bàn phím cơ không dây Keychron Q1 Pro QMK/VIA',
    category: 'Phụ kiện',
    price: 4290000,
    originalPrice: 4890000,
    discountPercent: 12,
    rating: 4.7,
    reviewsCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    description: 'Bàn phím cơ Custom cao cấp với vỏ nhôm nguyên khối CNC, cấu trúc Gasket Mount êm ái, hỗ trợ Hot-swap và tùy biến layout phím qua QMK/VIA.',
    specs: {
      'Layout': '75% (81 phím)',
      'Vỏ': 'Nhôm Anodized nguyên khối',
      'Switch': 'Keychron K Pro Red / Brown',
      'Kết nối': 'Bluetooth 5.1 / Type-C có dây',
      'Tương thích': 'macOS / Windows / Linux'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-5',
    name: 'Màn hình Dell UltraSharp U2723QE 27 inch 4K IPS Black',
    category: 'Laptop & PC',
    price: 13890000,
    originalPrice: 15500000,
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    description: 'Màn hình 4K sắc nét trang bị công nghệ IPS Black mang lại độ tương phản 2000:1 vượt trội, độ phủ màu 98% DCI-P3, tích hợp cổng USB-C sạc 90W và hub mạng RJ45.',
    specs: {
      'Kích thước': '27 inch',
      'Độ phân giải': '4K UHD (3840 x 2160)',
      'Tấm nền': 'IPS Black, 1.07 tỷ màu',
      'Độ phủ màu': '98% DCI-P3, 100% sRGB',
      'Cổng xuất': 'USB-C (Power Delivery 90W), DP 1.4, HDMI 2.0'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-6',
    name: 'Chuột không dây công thái học Logitech MX Master 3S',
    category: 'Phụ kiện',
    price: 2190000,
    originalPrice: 2690000,
    discountPercent: 18,
    rating: 4.8,
    reviewsCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    description: 'Chuột làm việc số 1 cho lập trình viên và chuyên gia văn phòng. Con lăn điện từ MagSpeed cuộn 1000 dòng/giây, click êm ái giảm 90% tiếng ồn, cảm biến 8000 DPI trên mọi bề mặt kính.',
    specs: {
      'Cảm biến': 'Darkfield 8000 DPI',
      'Pin': 'Lên đến 70 ngày cho 1 lần sạc',
      'Kết nối': 'Logi Bolt USB, Bluetooth (3 thiết bị)',
      'Phần mềm': 'Logi Options+ tùy biến thao tác'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-7',
    name: 'Đồng hồ thông minh Apple Watch Series 9 GPS 45mm',
    category: 'Smart Home',
    price: 9990000,
    originalPrice: 11490000,
    discountPercent: 13,
    rating: 4.7,
    reviewsCount: 76,
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    description: 'Chip S9 SiP mạnh mẽ hơn bao giờ hết với tính năng Double Tap điều khiển không chạm. Màn hình sáng gấp đôi 2000 nits, cảm biến đo điện tâm đồ ECG và nồng độ oxy trong máu.',
    specs: {
      'Kích thước mặt': '45mm nhôm',
      'Thời lượng pin': '18 giờ (tiêu chuẩn), 36 giờ (chế độ tiết kiệm)',
      'Tính năng': 'ECG, SpO2, Đo nhịp tim, Phát hiện té ngã, GPS',
      'Kháng nước': '50m (WR50)'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-8',
    name: 'Loa Bluetooth thông minh Marshall Stanmore III',
    category: 'Âm thanh',
    price: 8490000,
    originalPrice: 9990000,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 52,
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    description: 'Thiết kế Vintage sang trọng với chất âm Marshall huyền thoại. Âm trường rộng hơn thế hệ trước, công suất 80W mạnh mẽ lấp đầy không gian phòng khách.',
    specs: {
      'Công suất': '80W (1x 50W Woofer + 2x 15W Tweeter)',
      'Kết nối': 'Bluetooth 5.2, AUX 3.5mm, RCA',
      'Dải tần số': '45 - 20,000 Hz',
      'Trọng lượng': '4.25 kg'
    },
    inStock: false,
    featured: false
  }
];

const initialUsers = [
  {
    id: 'usr-admin-1',
    name: 'Quản Trị Viên (Đình Bảo)',
    email: 'admin@dinhbao.vn',
    phone: '0905 888 999',
    role: 'admin',
    status: 'active',
    password: 'admin123',
    avatarUrl: '/default-avatar.png',
    address: 'Tòa nhà DinhBao Center, Hải Châu, Đà Nẵng'
  },
  {
    id: 'usr-admin-2',
    name: 'Bảo Admin',
    email: 'bao@gmail.com',
    phone: '0905 123 456',
    role: 'admin',
    status: 'active',
    password: 'admin123',
    avatarUrl: '/default-avatar.png',
    address: 'Đà Nẵng'
  },
  {
    id: 'usr-staff-1',
    name: 'Trần Thị Mai (Kinh Doanh)',
    email: 'staff@dinhbao.vn',
    phone: '0912 345 678',
    role: 'staff',
    status: 'active',
    password: 'staff123',
    avatarUrl: '/default-avatar.png',
    address: 'Quận Cẩm Lệ, Đà Nẵng'
  },
  {
    id: 'usr-cust-1',
    name: 'Nguyễn Văn An',
    email: 'demo@dinhbao.vn',
    phone: '0988 776 655',
    role: 'customer',
    status: 'active',
    password: 'demo123',
    avatarUrl: '/default-avatar.png',
    address: '123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng'
  },
  {
    id: 'usr-cust-2',
    name: 'Lê Thị Hồng',
    email: 'hong.le@gmail.com',
    phone: '0977 112 233',
    role: 'customer',
    status: 'active',
    password: 'user123',
    avatarUrl: '/default-avatar.png',
    address: '45 Lê Duẩn, Đà Nẵng'
  },
  {
    id: 'usr-cust-3',
    name: 'Phạm Quốc Hưng (Demo Khóa)',
    email: 'hung.pham@yahoo.com',
    phone: '0935 999 888',
    role: 'customer',
    status: 'locked',
    password: 'user123',
    avatarUrl: '/default-avatar.png',
    address: 'Quận Ba Đình, Hà Nội'
  }
];

const initialOrders = [
  {
    id: 'ORD-2026-001', // Khóa chính (PK)
    userId: 'usr-cust-1', // Khóa ngoại (FK -> User.id)
    date: '2026-10-12',
    customerInfo: {
      fullName: 'Nguyễn Văn An',
      phone: '0988 776 655',
      address: '123 Nguyễn Văn Linh, Đà Nẵng'
    },
    items: [
      {
        product: {
          id: 'prod-2',
          name: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
          price: 29490000,
          imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
        },
        quantity: 1
      }
    ],
    totalAmount: 29490000,
    paymentMethod: 'Chuyển khoản QR',
    status: 'Hoàn tất'
  },
  {
    id: 'ORD-2026-002', // Khóa chính (PK)
    userId: 'usr-cust-2', // Khóa ngoại (FK -> User.id)
    date: '2026-10-12',
    customerInfo: {
      fullName: 'Lê Thị Hồng',
      phone: '0977 112 233',
      address: '45 Lê Duẩn, Đà Nẵng'
    },
    items: [
      {
        product: {
          id: 'prod-3',
          name: 'Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao',
          price: 6990000,
          imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
        },
        quantity: 1
      }
    ],
    totalAmount: 6990000,
    paymentMethod: 'Thanh toán khi nhận hàng (COD)',
    status: 'Đang giao'
  }
];

// Dữ liệu mẫu cho bảng riêng OrderItems
// Khóa chính: id
// Khóa ngoại: orderId -> Orders.id, productId -> Products.id
const initialOrderItems = [
  {
    id: 'item-1',
    orderId: 'ORD-2026-001',
    productId: 'prod-2',
    productName: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
    price: 29490000,
    quantity: 1
  },
  {
    id: 'item-2',
    orderId: 'ORD-2026-002',
    productId: 'prod-3',
    productName: 'Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao',
    price: 6990000,
    quantity: 1
  }
];

// Dữ liệu mẫu cho bảng riêng Reviews
// Khóa chính: id
// Khóa ngoại: productId -> Products.id, userId -> Users.id
const initialReviews = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    userId: 'usr-cust-1',
    author: 'Trần Minh Hoàng',
    rating: 5,
    date: '3 ngày trước',
    content: 'Hàng nguyên seal chính hãng, đóng gói 3 lớp chống sốc cực kỳ an tâm. Shop tư vấn nhiệt tình, giao trong ngày ở Đà Nẵng. Rất hài lòng!',
    verified: true,
    likes: 12
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    userId: 'usr-cust-2',
    author: 'Lê Thị Thu Thảo',
    rating: 5,
    date: '1 tuần trước',
    content: 'Máy chạy cực êm, màn hình nét căng đúng chuẩn mô tả. Đã kiểm tra bảo hành kích hoạt chuẩn 12 tháng từ hãng. Giá tốt hơn các chuỗi lớn nhiều!',
    verified: true,
    likes: 8
  },
  {
    id: 'rev-3',
    productId: 'prod-2',
    userId: 'usr-cust-3',
    author: 'Nguyễn Quốc Bảo',
    rating: 5,
    date: '2 tuần trước',
    content: 'Sản phẩm chất lượng tốt trong tầm giá. Giao hàng nhanh, shipper thân thiện. Sẽ tiếp tục ủng hộ TechStore lần sau.',
    verified: true,
    likes: 5
  },
  {
    id: 'rev-4',
    productId: 'prod-3',
    userId: 'usr-cust-1',
    author: 'Hoàng Nam',
    rating: 5,
    date: '5 ngày trước',
    content: 'Chất âm tuyệt vời, chống ồn tốt nhất phân khúc. Đeo lâu không bị cấn tai.',
    verified: true,
    likes: 9
  }
];

async function seedData() {
  try {
    const pCount = await Product.countDocuments();
    if (pCount === 0) {
      await Product.insertMany(initialProducts);
      console.log('📦 [MongoDB Seed] Đã tự động nạp 8 sản phẩm công nghệ vào collection products!');
    }

    const uCount = await User.countDocuments();
    if (uCount === 0) {
      await User.insertMany(initialUsers);
      console.log('📦 [MongoDB Seed] Đã tự động nạp 6 tài khoản người dùng vào collection users!');
    }

    const oCount = await Order.countDocuments();
    if (oCount === 0) {
      await Order.insertMany(initialOrders);
      console.log('📦 [MongoDB Seed] Đã tự động nạp 2 đơn hàng mẫu vào collection orders!');
    }

    // Tự động nạp bảng riêng order_items
    const oiCount = await OrderItem.countDocuments();
    if (oiCount === 0) {
      await OrderItem.insertMany(initialOrderItems);
      console.log('📦 [MongoDB Seed] Đã tự động nạp bảng riêng order_items vào MongoDB!');
    }

    // Tự động nạp bảng riêng reviews
    const rCount = await Review.countDocuments();
    if (rCount === 0) {
      await Review.insertMany(initialReviews);
      console.log('⭐ [MongoDB Seed] Đã tự động nạp bảng riêng reviews vào MongoDB!');
    }
  } catch (err) {
    console.error('⚠️ [MongoDB Seed] Lỗi nạp dữ liệu khởi tạo:', err.message);
  }
}

module.exports = { seedData };
