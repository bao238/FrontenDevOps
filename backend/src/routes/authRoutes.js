const express = require('express');
const authController = require('../controllers/authController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));

module.exports = router;
