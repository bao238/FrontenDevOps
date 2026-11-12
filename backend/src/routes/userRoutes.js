const express = require('express');
const authController = require('../controllers/authController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(authController.getUsers));
router.post('/', asyncHandler(authController.register));
router.put('/:id', asyncHandler(authController.updateUser));
router.put('/:id/status', asyncHandler(authController.toggleUserStatus));
router.delete('/:id', asyncHandler(authController.deleteUser));

module.exports = router;
