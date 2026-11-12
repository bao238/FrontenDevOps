const express = require('express');
const { isDbConnected } = require('../config/db');
const { requireDbConnection } = require('../middlewares/dbMiddleware');
const { authMiddleware, requireStaff } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const orderController = require('../controllers/orderController');

const productRoutes = require('./productRoutes');
const reviewRoutes = require('./reviewRoutes');
const orderRoutes = require('./orderRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const couponRoutes = require('./couponRoutes');
const categoryRoutes = require('./categoryRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

// 1. Healthcheck Endpoint cơ bản (Phục vụ Docker Healthcheck & CI/CD Pipeline)
router.get('/health', (req, res) => {
  const dbStatus = isDbConnected() ? 'connected (MongoDB)' : 'disconnected';
  res.json({
    status: 'healthy',
    service: 'bookstore-backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// Kiểm tra kết nối MongoDB tập trung cho các endpoint nghiệp vụ
router.use(requireDbConnection);

// 2. Product & Review Routes
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);

// 3. Order & OrderItem Routes
router.use('/orders', orderRoutes);
router.get('/order-items', authMiddleware, requireStaff, asyncHandler(orderController.getAllOrderItems));

// 4. Auth & User Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// 5. Coupon & Voucher Routes
router.use('/coupons', couponRoutes);

// 6. Category Routes
router.use('/categories', categoryRoutes);

// 7. Analytics & Financial Dashboard Route
router.use('/analytics', analyticsRoutes);

module.exports = router;
