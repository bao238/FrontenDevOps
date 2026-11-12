const express = require('express');
const productController = require('../controllers/productController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

// Đánh giá theo từng đầu sách
router.get('/:id/reviews', asyncHandler(productController.getProductReviews));
router.post('/:id/reviews', asyncHandler(productController.addProductReview));

module.exports = router;
