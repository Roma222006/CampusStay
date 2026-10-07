const express = require('express');
const router = express.Router();
const WardenController = require('../controllers/WardenController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['Admin']), upload.single('profilePhoto'), WardenController.createWarden);
router.get('/', authenticate, authorize(['Admin']), WardenController.getAllWardens);
router.get('/dashboard/stats', authenticate, authorize(['Warden']), WardenController.getWardenStats);
router.delete('/:id', authenticate, authorize(['Admin']), WardenController.deleteWarden);

module.exports = router;
