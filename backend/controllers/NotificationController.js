const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Warden = require('../models/Warden');

const NotificationController = {
  // Get all notifications for current user
  getNotifications: async (req, res) => {
    try {
      const { id, role, hostelBlock } = req.user;
      
      let recipients = [id.toString()];

      if (role === 'Warden' && hostelBlock) {
        // Warden receives notices specific to their block
        recipients.push(hostelBlock);
      }
      
      if (role === 'Faculty') {
        const faculty = await Faculty.findById(id);
        if (faculty) {
          // Faculty receives notices of their department
          recipients.push(faculty.department);
        }
      }

      // Add a general role-based filter
      const notifications = await Notification.find({
        recipientId: { $in: recipients },
        recipientRole: role
      }).sort({ createdAt: -1 }).limit(50).exec();

      return res.status(200).json(notifications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error retrieving notifications.' });
    }
  },

  // Mark single notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      return res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating notification status.' });
    }
  },

  // Mark all notifications as read for current user
  markAllAsRead: async (req, res) => {
    try {
      const { id, role, hostelBlock } = req.user;
      let recipients = [id.toString()];

      if (role === 'Warden' && hostelBlock) {
        recipients.push(hostelBlock);
      }
      if (role === 'Faculty') {
        const faculty = await Faculty.findById(id);
        if (faculty) {
          recipients.push(faculty.department);
        }
      }

      await Notification.updateMany(
        { recipientId: { $in: recipients }, recipientRole: role, isRead: false },
        { isRead: true }
      );

      return res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error marking all notifications as read.' });
    }
  },

  // Create standard notice board post (Warden or Admin)
  createNotice: async (req, res) => {
    try {
      const { title, message, targetBlock, targetRole } = req.body; // targetRole: Student, Faculty, Warden, All
      
      if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required.' });
      }

      const role = targetRole || 'Student';
      const rolesToPost = role === 'All' ? ['Student', 'Faculty', 'Warden'] : [role];

      const notices = [];
      for (const r of rolesToPost) {
        const notification = new Notification({
          recipientId: targetBlock || 'All',
          recipientRole: r,
          title: `Notice: ${title}`,
          message,
          type: 'notice'
        });
        await notification.save();
        notices.push(notification);
      }

      return res.status(201).json({ message: 'Notice posted successfully.', notices });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error posting notice.' });
    }
  },

  // Fetch notices (For Student, Faculty, Warden notice boards)
  getNotices: async (req, res) => {
    try {
      const { role, hostelBlock } = req.user;
      
      let filter = {
        type: 'notice'
      };
      
      if (role !== 'Admin') {
        filter.recipientRole = role;
        if (role === 'Student' && hostelBlock) {
          filter.recipientId = { $in: ['All', hostelBlock] };
        }
      }

      const notices = await Notification.find(filter).sort({ createdAt: -1 }).exec();
      return res.status(200).json(notices);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching notice board.' });
    }
  },

  // Get count of unread notifications (used for bell badge)
  getUnreadCount: async (req, res) => {
    try {
      const { id, role, hostelBlock } = req.user;
      let recipients = [id.toString()];

      if (role === 'Warden' && hostelBlock) recipients.push(hostelBlock);
      if (role === 'Faculty') {
        const faculty = await Faculty.findById(id);
        if (faculty) recipients.push(faculty.department);
      }
      if (role === 'Student' && hostelBlock) recipients.push('All', hostelBlock);

      const count = await Notification.countDocuments({
        recipientId: { $in: recipients },
        recipientRole: role,
        isRead: false,
      });

      return res.status(200).json({ unreadCount: count });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching unread count.' });
    }
  },

  // Clear (delete) all notifications for current user
  clearAll: async (req, res) => {
    try {
      const { id, role, hostelBlock } = req.user;
      let recipients = [id.toString()];

      if (role === 'Warden' && hostelBlock) recipients.push(hostelBlock);
      if (role === 'Faculty') {
        const faculty = await Faculty.findById(id);
        if (faculty) recipients.push(faculty.department);
      }

      await Notification.deleteMany({
        recipientId: { $in: recipients },
        recipientRole: role,
      });

      return res.status(200).json({ message: 'All notifications cleared.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error clearing notifications.' });
    }
  },
};

module.exports = NotificationController;
