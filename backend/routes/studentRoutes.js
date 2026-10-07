const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['Admin', 'Warden', 'Faculty']), StudentController.getAllStudents);
router.get('/dashboard', authenticate, StudentController.getDashboard);
router.get('/roommates', authenticate, StudentController.getRoommates);
router.get('/:id', authenticate, StudentController.getStudentById);
router.put('/preferences', authenticate, StudentController.updatePreferences);
router.delete('/:id', authenticate, authorize(['Admin']), StudentController.deleteStudent);

module.exports = router;
