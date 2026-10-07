const express = require('express');
const router = express.Router();
const MessController = require('../controllers/MessController');
const { authenticate, authorize } = require('../middleware/auth');

// Public to authenticated users
router.get('/menu', authenticate, MessController.getWeeklyMenu);
router.get('/analytics', authenticate, MessController.getMessAnalytics);

// Student actions
router.post('/rate', authenticate, authorize(['Student']), MessController.rateMeal);
router.post('/toggle-skip', authenticate, authorize(['Student']), MessController.toggleSkipMeal);

// Admin / Warden management
router.put('/update-meal', authenticate, authorize(['Admin', 'Warden']), MessController.updateMeal);

module.exports = router;
