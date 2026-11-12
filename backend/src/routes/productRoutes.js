const express = require('express');
const productController = require('../controllers/productController');
const {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  requireStaff
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Public storefront endpoints
router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.get('/:id/reviews', asyncHandler(productController.getProductReviews));

// Khách hàng hoặc độc giả gửi đánh giá
router.post('/:id/reviews', optionalAuth, asyncHandler(productController.addProductReview));

// Admin / Staff quản lý kho sách
router.post('/', authMiddleware, requireStaff, asyncHandler(productController.createProduct));
router.put('/:id', authMiddleware, requireStaff, asyncHandler(productController.updateProduct));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(productController.deleteProduct));

module.exports = router;
