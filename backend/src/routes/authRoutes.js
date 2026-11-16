const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

// 1. Đăng nhập & Đăng ký
router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));

// 2. Hồ sơ cá nhân người dùng hiện tại
router.get('/me', authMiddleware, asyncHandler(authController.getMe));
router.put('/me', authMiddleware, asyncHandler(authController.updateMe));

// 3. Luồng Quên mật khẩu & Đặt lại mật khẩu bằng mã xác thực OTP
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));

// 4. Đổi mật khẩu an toàn khi người dùng đã đăng nhập JWT
router.put('/change-password', authMiddleware, asyncHandler(authController.changePassword));

module.exports = router;
