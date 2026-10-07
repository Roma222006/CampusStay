const express = require('express');
const router = express.Router();
const ComplaintController = require('../controllers/ComplaintController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['Student']), upload.single('image'), ComplaintController.createComplaint);
router.get('/', authenticate, ComplaintController.getComplaints);
router.put('/:complaintId/status', authenticate, authorize(['Warden', 'Admin']), ComplaintController.updateStatus);
router.put('/:complaintId/escalate', authenticate, authorize(['Student']), ComplaintController.escalateComplaint);

module.exports = router;
