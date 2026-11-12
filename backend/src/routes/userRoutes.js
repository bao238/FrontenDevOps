const express = require('express');
const authController = require('../controllers/authController');
const {
  authMiddleware,
  requireAdmin,
  requireStaff,
  requireSelfOrAdmin
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', requireStaff, asyncHandler(authController.getUsers));
router.post('/', requireAdmin, asyncHandler(authController.register));
router.put('/:id', requireSelfOrAdmin, asyncHandler(authController.updateUser));
router.put('/:id/status', requireAdmin, asyncHandler(authController.toggleUserStatus));
router.delete('/:id', requireAdmin, asyncHandler(authController.deleteUser));

module.exports = router;
