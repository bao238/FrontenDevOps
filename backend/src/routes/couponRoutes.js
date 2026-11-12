const express = require('express');
const couponController = require('../controllers/couponController');
const {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  requireStaff
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Khách hàng áp dụng mã giảm giá khi thanh toán
router.post('/apply', optionalAuth, asyncHandler(couponController.applyCoupon));

// Quản trị viên / Nhân viên quản lý mã khuyến mãi
router.get('/', authMiddleware, requireStaff, asyncHandler(couponController.getCoupons));
router.post('/', authMiddleware, requireStaff, asyncHandler(couponController.createCoupon));
router.put('/:id', authMiddleware, requireStaff, asyncHandler(couponController.updateCoupon));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(couponController.deleteCoupon));

module.exports = router;
