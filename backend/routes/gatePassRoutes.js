const express = require('express');
const router = express.Router();
const GatePassController = require('../controllers/GatePassController');
const { authenticate, authorize } = require('../middleware/auth');

// Student endpoints
router.post('/request', authenticate, authorize(['Student']), GatePassController.requestGatePass);
router.get('/my-passes', authenticate, authorize(['Student']), GatePassController.getMyPasses);

// Warden / Admin / Security Terminal endpoints
router.get('/all', authenticate, authorize(['Warden', 'Admin']), GatePassController.getAllPasses);
router.post('/scan-verify', authenticate, authorize(['Warden', 'Admin']), GatePassController.scanOrVerify);
router.get('/analytics', authenticate, authorize(['Warden', 'Admin']), GatePassController.getGateAnalytics);

module.exports = router;
