const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { mongoose, isDbConnected } = require('./config/db');
const { seedData } = require('./config/seed');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const authController = require('./controllers/authController');
const couponController = require('./controllers/couponController');
const categoryController = require('./controllers/categoryController');
const analyticsController = require('./controllers/analyticsController');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares tiếp nhận CORS và JSON payload
app.use(cors());
app.use(express.json());

// 1. Healthcheck Endpoint cơ bản (Phục vụ Docker Healthcheck & CI/CD Pipeline)
app.get('/api/health', (req, res) => {
  const dbStatus = isDbConnected() ? 'connected (MongoDB)' : 'disconnected';
  res.json({
    status: 'healthy',
    service: 'bookstore-backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// 2. DevOps & System Monitor Endpoint chi tiết (Phục vụ Tab DevOps trên Admin Panel)
app.get('/api/system/status', async (req, res) => {
  const startTime = Date.now();
  let dbPingMs = null;
  let dbName = 'N/A';
  let isConnected = false;

  try {
    if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
      isConnected = true;
      dbName = mongoose.connection.name;
      // Đo độ trễ ping tới MongoDB
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - startTime;
    }
  } catch (err) {
    console.error('⚠️ [System] Lỗi khi ping cơ sở dữ liệu MongoDB:', err.message);
  }

  // Đếm nhanh số lượng bản ghi trong các collections
  let counts = { products: 0, orders: 0, users: 0, reviews: 0, coupons: 0, categories: 0 };
  if (isConnected) {
    try {
      const Product = require('./models/Product');
      const Order = require('./models/Order');
      const User = require('./models/User');
      const Review = require('./models/Review');
      const Coupon = require('./models/Coupon');
      const Category = require('./models/Category');

      counts.products = await Product.countDocuments();
      counts.orders = await Order.countDocuments();
      counts.users = await User.countDocuments();
      counts.reviews = await Review.countDocuments();
      counts.coupons = await Coupon.countDocuments();
      counts.categories = await Category.countDocuments();
    } catch (e) {
      console.error('⚠️ [System] Lỗi đếm collections:', e.message);
    }
  }

  const memoryUsage = process.memoryUsage();

  return res.json({
    status: isConnected ? 'healthy' : 'warning',
    server: {
      port: PORT,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      }
    },
    database: {
      type: 'MongoDB',
      connected: isConnected,
      name: dbName,
      pingLatencyMs: dbPingMs,
      collections: counts
    },
    timestamp: new Date().toISOString()
  });
});

// Endpoint kích hoạt nạp lại Dữ liệu mẫu (Trigger Seed Data từ Admin)
app.post('/api/system/seed', async (req, res) => {
  try {
    console.log('🔄 [System] Yêu cầu nạp lại dữ liệu mẫu được kích hoạt từ Admin Panel...');
    await seedData();
    return res.json({
      success: true,
      message: 'Khởi tạo và đồng bộ dữ liệu mẫu BookStore thành công vào MongoDB!'
    });
  } catch (err) {
    console.error('❌ [System] Lỗi khi kích hoạt seed dữ liệu:', err.message);
    return res.status(500).json({ error: 'Lỗi nạp dữ liệu', message: err.message });
  }
});

// 3. Product & Review Routes (Quản lý Sách & Đánh giá độc giả)
app.get('/api/products', productController.getProducts);
app.get('/api/products/:id', productController.getProductById);
app.get('/api/products/:id/reviews', productController.getProductReviews);
app.post('/api/products/:id/reviews', productController.addProductReview);
app.get('/api/reviews', productController.getAllReviews);
app.put('/api/reviews/:id', productController.updateReview);
app.delete('/api/reviews/:id', productController.deleteReview);
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);

// 4. Order & OrderItem Routes (Quản lý Đơn mua sách & Chi tiết đơn)
app.get('/api/orders', orderController.getOrders);
app.get('/api/orders/:id/items', orderController.getOrderItems);
app.get('/api/order-items', orderController.getAllOrderItems);
app.post('/api/orders', orderController.createOrder);
app.put('/api/orders/:id/status', orderController.updateOrderStatus);
app.delete('/api/orders/:id', orderController.deleteOrder);

// 5. Auth & User Routes (Xác thực tài khoản độc giả, nhân viên và quản trị)
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.get('/api/users', authController.getUsers);
app.post('/api/users', authController.register);
app.put('/api/users/:id', authController.updateUser);
app.put('/api/users/:id/status', authController.toggleUserStatus);
app.delete('/api/users/:id', authController.deleteUser);

// 6. Coupon & Voucher Routes (Module Quản lý Khuyến mãi & Giảm giá)
app.get('/api/coupons', couponController.getCoupons);
app.post('/api/coupons', couponController.createCoupon);
app.put('/api/coupons/:id', couponController.updateCoupon);
app.delete('/api/coupons/:id', couponController.deleteCoupon);
app.post('/api/coupons/apply', couponController.applyCoupon);

// 7. Category Routes (Module Quản lý Thể loại sách động)
app.get('/api/categories', categoryController.getCategories);
app.post('/api/categories', categoryController.createCategory);
app.put('/api/categories/:id', categoryController.updateCategory);
app.delete('/api/categories/:id', categoryController.deleteCategory);

// 8. Analytics & Financial Dashboard Route (Module Báo cáo & Thống kê Doanh thu)
app.get('/api/analytics/summary', analyticsController.getAnalyticsSummary);

// Khởi chạy server lắng nghe kết nối
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Backend] BookStore API Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 [Healthcheck] http://localhost:${PORT}/api/health`);
  console.log(`📊 [Analytics API] http://localhost:${PORT}/api/analytics/summary`);
  console.log(`🎟️ [Coupons API] http://localhost:${PORT}/api/coupons`);
  console.log(`📂 [Categories API] http://localhost:${PORT}/api/categories`);
  console.log(`📚 [Books API] http://localhost:${PORT}/api/products`);
});
