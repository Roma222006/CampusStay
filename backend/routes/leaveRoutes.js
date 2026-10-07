const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/LeaveController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['Student']), upload.single('certificate'), LeaveController.applyLeave);
router.get('/', authenticate, LeaveController.getLeaves);
router.put('/:leaveId/faculty-review', authenticate, authorize(['Faculty']), LeaveController.facultyReview);
router.put('/:leaveId/warden-review', authenticate, authorize(['Warden']), LeaveController.wardenReview);
router.put('/:leaveId/status', authenticate, authorize(['Faculty', 'Warden']), LeaveController.updateLeaveStatus);
router.put('/:leaveId/checkout', authenticate, authorize(['Warden']), LeaveController.checkout);
router.put('/:leaveId/checkin', authenticate, authorize(['Warden']), LeaveController.checkin);

router.get('/student-approved/pdf', authenticate, authorize(['Student']), LeaveController.getStudentApprovedLeavesPDF);
router.get('/student-history/:studentId', authenticate, authorize(['Faculty', 'Warden']), LeaveController.getStudentHistory);
router.get('/export/pdf', LeaveController.exportPDF);
router.get('/export/excel', LeaveController.exportExcel);

module.exports = router;
