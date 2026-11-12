const express = require('express');
const productController = require('../controllers/productController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(productController.getAllReviews));
router.put('/:id', asyncHandler(productController.updateReview));
router.put('/:id/reply', asyncHandler(productController.replyToReview));
router.put('/:id/moderation', asyncHandler(productController.updateReviewModeration));
router.delete('/:id', asyncHandler(productController.deleteReview));

module.exports = router;
