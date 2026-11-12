const express = require('express');
const categoryController = require('../controllers/categoryController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(categoryController.getCategories));
router.post('/', asyncHandler(categoryController.createCategory));
router.put('/:id', asyncHandler(categoryController.updateCategory));
router.delete('/:id', asyncHandler(categoryController.deleteCategory));

module.exports = router;
