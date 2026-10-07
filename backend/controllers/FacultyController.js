const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Leave = require('../models/Leave');
const bcrypt = require('bcryptjs');

const FacultyController = {
  // Create Faculty Account (Admin only)
  createFaculty: async (req, res) => {
    try {
      const { name, facultyID, department, email, phone, password } = req.body;

      if (!name || !facultyID || !department || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      const existing = await Faculty.findOne({
        $or: [
          { facultyID: facultyID.trim() },
          { email: email.toLowerCase().trim() }
        ]
      });

      if (existing) {
        return res.status(400).json({ message: 'Faculty with this email or ID already exists.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Profile photo is required.' });
      }

      const profilePhotoPath = '/uploads/' + req.file.filename;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const faculty = new Faculty({
        name,
        facultyID: facultyID.trim(),
        department,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        profilePhotoPath
      });

      await faculty.save();
      return res.status(201).json({ message: 'Faculty account created successfully.', faculty });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error creating faculty.' });
    }
  },

  // Get list of all Faculty members
  getAllFaculty: async (req, res) => {
    try {
      const faculties = await Faculty.find({}, '-password').exec();
      return res.status(200).json(faculties);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching faculty list.' });
    }
  },

  // Get Faculty Dashboard Stats
  getFacultyStats: async (req, res) => {
    try {
      const facultyId = req.user.id;
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

      // Fetch students in faculty's department
      const students = await Student.find({ department: faculty.department });
      const studentIds = students.map(s => s._id);

      // Leave statistics for these students
      const leaves = await Leave.find({ student: { $in: studentIds } });

      const stats = {
        totalStudents: students.length,
        pendingLeaves: leaves.filter(l => l.status === 'Pending Faculty').length,
        approvedLeaves: leaves.filter(l => l.status === 'Approved Faculty' || l.status === 'Approved Warden').length,
        rejectedLeaves: leaves.filter(l => l.status === 'Rejected Faculty').length,
        studentsOnLeave: leaves.filter(l => l.status === 'Approved Warden' && l.checkOutTime && !l.checkInTime).length
      };

      return res.status(200).json({ stats, department: faculty.department });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error fetching faculty statistics.' });
    }
  },

  // Delete Faculty Account
  deleteFaculty: async (req, res) => {
    try {
      const { id } = req.params;
      const faculty = await Faculty.findById(id);
      if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

      await Faculty.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Faculty deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting faculty.' });
    }
  }
};

module.exports = FacultyController;
