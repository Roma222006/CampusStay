/**
 * notificationHelper.js
 * Shared utility to create in-app notifications stored in MongoDB.
 * Import this in any controller instead of defining a local createNotification function.
 */

const Notification = require('../models/Notification');

/**
 * Create a notification record for a user or a role group.
 *
 * @param {string} recipientId  - ObjectId or identifier string (e.g. block name for Wardens)
 * @param {string} role         - 'Student' | 'Faculty' | 'Warden' | 'Admin'
 * @param {string} title        - Short notification title
 * @param {string} message      - Full notification message
 * @param {string} type         - 'leave' | 'complaint' | 'room' | 'notice' | 'maintenance' | 'general'
 */
async function createNotification(recipientId, role, title, message, type = 'general') {
  try {
    const notify = new Notification({
      recipientId: recipientId ? recipientId.toString() : '',
      recipientRole: role,
      title,
      message,
      type,
    });
    await notify.save();
  } catch (error) {
    console.error('[NotificationHelper] Error creating notification:', error.message);
  }
}

module.exports = { createNotification };
