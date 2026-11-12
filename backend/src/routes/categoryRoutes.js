const express = require('express');
const categoryController = require('../controllers/categoryController');
const {
  authMiddleware,
  requireAdmin,
  requireStaff
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(categoryController.getCategories));
router.post('/', authMiddleware, requireStaff, asyncHandler(categoryController.createCategory));
router.put('/:id', authMiddleware, requireStaff, asyncHandler(categoryController.updateCategory));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(categoryController.deleteCategory));

module.exports = router;
