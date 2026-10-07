const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const LostFoundController = require('../controllers/LostFoundController');
const { authenticate } = require('../middleware/auth');

// Multer storage configuration for item photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticate, LostFoundController.getAllItems);
router.post('/report', authenticate, upload.single('image'), LostFoundController.reportItem);
router.put('/:itemId/claim', authenticate, LostFoundController.claimItem);
router.put('/:itemId/resolve', authenticate, LostFoundController.resolveItem);

module.exports = router;
