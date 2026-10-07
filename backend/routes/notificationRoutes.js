const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, NotificationController.getNotifications);
router.get('/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/read-all', authenticate, NotificationController.markAllAsRead);
router.delete('/clear-all', authenticate, NotificationController.clearAll);
router.put('/:notificationId/read', authenticate, NotificationController.markAsRead);
router.post('/notices', authenticate, authorize(['Warden', 'Admin']), NotificationController.createNotice);
router.get('/notices', authenticate, NotificationController.getNotices);

module.exports = router;
