const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

router.post('/login', AuthController.login);
router.post('/register', AuthController.registerUser);

// Post-Login Profile Completion Wizards
router.put('/student-profile', authenticate, upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]), AuthController.completeStudentProfile);

router.put('/faculty-profile', authenticate, upload.single('profilePhoto'), AuthController.completeFacultyProfile);
router.put('/warden-profile', authenticate, upload.single('profilePhoto'), AuthController.completeWardenProfile);

// General profile
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);

// Avatar upload (any authenticated user)
router.post('/avatar', authenticate, upload.single('avatar'), AuthController.uploadAvatar);

module.exports = router;
