const express = require('express');
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.get('/me', authenticateJWT, asyncHandler(authController.getMe));

module.exports = router;
