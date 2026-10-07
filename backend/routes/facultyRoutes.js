const express = require('express');
const router = express.Router();
const FacultyController = require('../controllers/FacultyController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['Admin']), upload.single('profilePhoto'), FacultyController.createFaculty);
router.get('/', authenticate, authorize(['Admin']), FacultyController.getAllFaculty);
router.get('/dashboard/stats', authenticate, authorize(['Faculty']), FacultyController.getFacultyStats);
router.delete('/:id', authenticate, authorize(['Admin']), FacultyController.deleteFaculty);

module.exports = router;
