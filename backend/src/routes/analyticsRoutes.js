const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, requireStaff } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/summary', authMiddleware, requireStaff, asyncHandler(analyticsController.getAnalyticsSummary));

module.exports = router;
