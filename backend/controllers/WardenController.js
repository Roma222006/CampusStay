const Warden = require('../models/Warden');
const Student = require('../models/Student');
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

const WardenController = {
  // Create Warden (Admin only)
  createWarden: async (req, res) => {
    try {
      const { name, wardenID, hostelBlock, email, phone, password } = req.body;

      if (!name || !wardenID || !hostelBlock || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      const existing = await Warden.findOne({
        $or: [
          { wardenID: wardenID.trim() },
          { email: email.toLowerCase().trim() }
        ]
      });

      if (existing) {
        return res.status(400).json({ message: 'Warden with this email or ID already exists.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Profile photo is required.' });
      }

      const profilePhotoPath = '/uploads/' + req.file.filename;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const warden = new Warden({
        name,
        wardenID: wardenID.trim(),
        hostelBlock,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        profilePhotoPath
      });

      await warden.save();
      return res.status(201).json({ message: 'Warden account created successfully.', warden });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error creating warden.' });
    }
  },

  // Get all Wardens list
  getAllWardens: async (req, res) => {
    try {
      const wardens = await Warden.find({}, '-password').exec();
      return res.status(200).json(wardens);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching wardens list.' });
    }
  },

  // Get Warden Dashboard Stats
  getWardenStats: async (req, res) => {
    try {
      const wardenId = req.user.id;
      const warden = await Warden.findById(wardenId);
      if (!warden) return res.status(404).json({ message: 'Warden not found.' });

      const block = warden.hostelBlock;

      // Filter students in the Warden's hostel block
      const students = await Student.find({ hostelBlock: block });
      const studentIds = students.map(s => s._id);

      // Rooms in this block
      const rooms = await Room.find({ hostelBlock: block });
      let totalBeds = 0;
      let occupiedBeds = 0;
      rooms.forEach(r => {
        totalBeds += r.capacity;
        occupiedBeds += r.occupiedBeds;
      });

      // Complaints in this block
      const complaints = await Complaint.find({ student: { $in: studentIds } });

      // Leave requests in this block
      const leaves = await Leave.find({ student: { $in: studentIds } });

      const stats = {
        totalStudents: students.length,
        occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
        pendingLeaves: leaves.filter(l => l.status === 'Approved Faculty').length, // Faculty-approved but Warden-pending
        pendingComplaints: complaints.filter(c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'In Progress').length,
        maintenanceComplaints: complaints.filter(c => c.status === 'In Progress').length
      };

      return res.status(200).json({ stats, hostelBlock: block });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error fetching warden stats.' });
    }
  },

  // Delete Warden Account
  deleteWarden: async (req, res) => {
    try {
      const { id } = req.params;
      const warden = await Warden.findById(id);
      if (!warden) return res.status(404).json({ message: 'Warden not found.' });

      await Warden.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Warden deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting warden.' });
    }
  }
};

module.exports = WardenController;
