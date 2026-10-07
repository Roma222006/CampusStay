const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/stats', authenticate, authorize(['Admin']), AdminController.getDashboardStats);
router.get('/dashboard/stats', authenticate, authorize(['Admin']), AdminController.getDashboardStats);
router.get('/users', authenticate, authorize(['Admin']), AdminController.getAdminUsers);
router.post('/create-staff', authenticate, authorize(['Admin']), AdminController.createStaff);
router.delete('/users/:userId', authenticate, authorize(['Admin']), AdminController.deleteUser);

module.exports = router;
