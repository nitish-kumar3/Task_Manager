const router = require('express').Router();
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], signup);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], login);

router.get('/me', authenticate, getMe);

module.exports = router;
