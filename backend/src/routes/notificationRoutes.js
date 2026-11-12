const express = require('express');
const notificationController = require('../controllers/notificationController');
const {
  authMiddleware,
  optionalAuth,
  requireStaff
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Lấy danh sách thông báo (Hỗ trợ cả khách vãng lai và người dùng có đăng nhập JWT)
router.get('/', optionalAuth, asyncHandler(notificationController.getNotifications));

// Đánh dấu tất cả thông báo của người dùng là đã đọc
router.patch('/read-all', authMiddleware, asyncHandler(notificationController.markAllAsRead));

// Đánh dấu một thông báo cụ thể là đã đọc
router.patch('/:id/read', authMiddleware, asyncHandler(notificationController.markAsRead));

// Xóa một thông báo cụ thể
router.delete('/:id', authMiddleware, asyncHandler(notificationController.deleteNotification));

// Tạo thông báo mới (Dành cho Nhân viên / Quản trị viên phát sóng thông báo)
router.post('/', authMiddleware, requireStaff, asyncHandler(notificationController.createNotification));

module.exports = router;
