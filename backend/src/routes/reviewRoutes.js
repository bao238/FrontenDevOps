const express = require('express');
const productController = require('../controllers/productController');
const {
  authMiddleware,
  requireAdmin,
  requireStaff
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', requireStaff, asyncHandler(productController.getAllReviews));
router.put('/:id', requireStaff, asyncHandler(productController.updateReview));
router.put('/:id/reply', requireStaff, asyncHandler(productController.replyToReview));
router.put('/:id/moderation', requireStaff, asyncHandler(productController.updateReviewModeration));
router.delete('/:id', requireAdmin, asyncHandler(productController.deleteReview));

module.exports = router;
