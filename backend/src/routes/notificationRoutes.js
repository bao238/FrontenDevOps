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

// Lấy danh sách toàn bộ thông báo hệ thống dành riêng cho Quản trị viên (Hỗ trợ tìm kiếm, lọc, phân trang)
router.get('/admin', authMiddleware, requireStaff, asyncHandler(notificationController.getAdminNotifications));

// Thống kê tổng quan số liệu thông báo cho Quản trị viên (KPI cards)
router.get('/stats', authMiddleware, requireStaff, asyncHandler(notificationController.getNotificationStats));

// Đánh dấu tất cả thông báo của người dùng là đã đọc
router.patch('/read-all', authMiddleware, asyncHandler(notificationController.markAllAsRead));

// Đánh dấu một thông báo cụ thể là đã đọc
router.patch('/:id/read', authMiddleware, asyncHandler(notificationController.markAsRead));

// Xóa toàn bộ thông báo (Hỗ trợ người dùng đã đăng nhập hoặc khách vãng lai)
router.delete('/clear-all', optionalAuth, asyncHandler(notificationController.deleteAllNotifications));

// Xóa một thông báo cụ thể
router.delete('/:id', authMiddleware, asyncHandler(notificationController.deleteNotification));

// Tạo thông báo mới (Dành cho Nhân viên / Quản trị viên phát sóng thông báo ưu đãi hoặc hệ thống)
router.post('/', authMiddleware, requireStaff, asyncHandler(notificationController.createNotification));

module.exports = router;
