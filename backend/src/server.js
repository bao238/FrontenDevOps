const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { mongoose, isDbConnected } = require('./config/db');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const authController = require('./controllers/authController');
const couponController = require('./controllers/couponController');
const categoryController = require('./controllers/categoryController');
const analyticsController = require('./controllers/analyticsController');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares tiếp nhận CORS và JSON payload dung lượng lớn (phục vụ upload ảnh base64 trực tiếp từ máy tính)
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

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

// 2. Product & Review Routes (Quản lý Sách & Đánh giá độc giả)
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

// 3. Order & OrderItem Routes (Quản lý Đơn mua sách & Chi tiết đơn)
app.get('/api/orders', orderController.getOrders);
app.get('/api/orders/:id/items', orderController.getOrderItems);
app.get('/api/order-items', orderController.getAllOrderItems);
app.post('/api/orders', orderController.createOrder);
app.put('/api/orders/:id/status', orderController.updateOrderStatus);
app.delete('/api/orders/:id', orderController.deleteOrder);

// 4. Auth & User Routes (Xác thực tài khoản độc giả, nhân viên và quản trị)
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.get('/api/users', authController.getUsers);
app.post('/api/users', authController.register);
app.put('/api/users/:id', authController.updateUser);
app.put('/api/users/:id/status', authController.toggleUserStatus);
app.delete('/api/users/:id', authController.deleteUser);

// 5. Coupon & Voucher Routes (Module Quản lý Khuyến mãi & Giảm giá)
app.get('/api/coupons', couponController.getCoupons);
app.post('/api/coupons', couponController.createCoupon);
app.put('/api/coupons/:id', couponController.updateCoupon);
app.delete('/api/coupons/:id', couponController.deleteCoupon);
app.post('/api/coupons/apply', couponController.applyCoupon);

// 6. Category Routes (Module Quản lý Thể loại sách động)
app.get('/api/categories', categoryController.getCategories);
app.post('/api/categories', categoryController.createCategory);
app.put('/api/categories/:id', categoryController.updateCategory);
app.delete('/api/categories/:id', categoryController.deleteCategory);

// 7. Analytics & Financial Dashboard Route (Module Báo cáo & Thống kê Doanh thu)
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
