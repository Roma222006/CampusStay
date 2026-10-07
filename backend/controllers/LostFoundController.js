const LostFound = require('../models/LostFound');
const { createNotification } = require('../utils/notificationHelper');

const LostFoundController = {
  // Get all items with search & filters
  getAllItems: async (req, res) => {
    try {
      const { category, itemType, status, search } = req.query;
      let filter = {};

      if (category && category !== 'All') filter.category = category;
      if (itemType && itemType !== 'All') filter.itemType = itemType;
      if (status && status !== 'All') filter.status = status;

      let items = await LostFound.find(filter)
        .populate('claimedBy', 'name registerNumber phone email')
        .sort({ createdAt: -1 });

      if (search) {
        const q = search.toLowerCase();
        items = items.filter(it =>
          it.title.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.location.toLowerCase().includes(q)
        );
      }

      return res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching lost & found items:', error);
      return res.status(500).json({ message: 'Error retrieving lost & found items.' });
    }
  },

  // Report a new Lost or Found item
  reportItem: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { title, category, itemType, description, location, contactNumber, reporterName } = req.body;

      if (!title || !itemType || !description || !location) {
        return res.status(400).json({ message: 'Please provide title, type (Lost/Found), description, and location.' });
      }

      let imagePath = '';
      if (req.file) {
        imagePath = '/uploads/' + req.file.filename;
      }

      const newItem = new LostFound({
        title,
        category: category || 'Other',
        itemType,
        description,
        location,
        contactNumber: contactNumber || '',
        imagePath,
        reportedBy: userId,
        reporterModel: userRole,
        reporterName: reporterName || 'Campus Resident',
        status: 'Open'
      });

      await newItem.save();

      // If found item, notify community
      if (itemType === 'Found') {
        await createNotification(
          'All',
          'Student',
          `New Found Item: ${title}`,
          `A "${title}" was found at ${location}. Check Lost & Found to claim.`,
          'notice'
        );
      }

      return res.status(201).json({ message: `${itemType} item reported successfully!`, item: newItem });
    } catch (error) {
      console.error('Error reporting item:', error);
      return res.status(500).json({ message: 'Error submitting lost/found report.' });
    }
  },

  // Request to Claim a Found Item (Student)
  claimItem: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { itemId } = req.params;
      const { claimNotes, claimantName } = req.body;

      const item = await LostFound.findById(itemId);
      if (!item) return res.status(404).json({ message: 'Item not found.' });

      item.status = 'Claim Pending';
      item.claimedBy = studentId;
      item.claimantName = claimantName || 'Hostel Resident';
      item.claimNotes = claimNotes || '';

      await item.save();

      return res.status(200).json({
        message: 'Claim request submitted. Please coordinate with the finder / warden for handover verification.',
        item
      });
    } catch (error) {
      console.error('Error claiming item:', error);
      return res.status(500).json({ message: 'Error submitting claim request.' });
    }
  },

  // Mark as Resolved / Handed Over
  resolveItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { notes } = req.body;

      const item = await LostFound.findById(itemId);
      if (!item) return res.status(404).json({ message: 'Item not found.' });

      item.status = 'Resolved';
      if (notes) item.claimNotes = (item.claimNotes ? item.claimNotes + ' | ' : '') + notes;

      await item.save();

      return res.status(200).json({ message: 'Item marked as successfully resolved/returned.', item });
    } catch (error) {
      console.error('Error resolving item:', error);
      return res.status(500).json({ message: 'Error updating item status.' });
    }
  }
};

module.exports = LostFoundController;
