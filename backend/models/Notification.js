const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String, // Can store Student ObjectId, Faculty ObjectId, or Admin/Warden role keys
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['Student', 'Faculty', 'Warden', 'Admin'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['leave', 'complaint', 'room', 'notice', 'maintenance'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
