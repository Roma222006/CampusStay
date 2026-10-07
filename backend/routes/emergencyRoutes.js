const express = require('express');
const router = express.Router();
const EmergencyController = require('../controllers/EmergencyController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sos', authenticate, authorize(['Student']), EmergencyController.triggerSOS);
router.get('/alerts', authenticate, EmergencyController.getAlerts);
router.put('/:alertId/status', authenticate, authorize(['Warden', 'Admin']), EmergencyController.updateStatus);

module.exports = router;
