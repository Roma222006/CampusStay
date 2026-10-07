const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Warden = require('../models/Warden');
const HostelBlock = require('../models/HostelBlock');
const Room = require('../models/Room');
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

const AdminController = {
  getDashboardStats: async (req, res) => {
    try {
      const studentCount = await Student.countDocuments();
      const facultyCount = await Faculty.countDocuments();
      const wardenCount = await Warden.countDocuments();
      
      const blocks = await HostelBlock.find();
      const rooms = await Room.find();

      let totalFloors = 0;
      let totalBeds = 0;
      let occupiedBeds = 0;

      blocks.forEach(b => {
        totalFloors += b.totalFloors;
      });

      rooms.forEach(r => {
        totalBeds += r.capacity;
        occupiedBeds += (r.occupiedBeds || 0);
      });

      const vacantBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

      const studentsOnLeave = await Leave.countDocuments({
        status: 'Approved Warden',
        checkOutTime: { $ne: null },
        checkInTime: null
      });

      const totalComplaints = await Complaint.countDocuments();
      const pendingComplaints = await Complaint.countDocuments({ status: { $in: ['Pending', 'In Progress', 'Assigned'] } });

      // Recent activities: gather latest leaves and complaints
      const recentLeaves = await Leave.find()
        .populate('student', 'name registerNumber')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      const recentComplaints = await Complaint.find()
        .populate('student', 'name registerNumber')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      const recentActivities = [];
      recentLeaves.forEach(l => {
        recentActivities.push({
          type: 'Leave',
          description: `${l.student ? l.student.name : 'Student'} applied for ${l.leaveType} leave (${l.status}).`,
          time: l.createdAt
        });
      });

      recentComplaints.forEach(c => {
        recentActivities.push({
          type: 'Complaint',
          description: `${c.student ? c.student.name : 'Student'} raised an ${c.category} complaint (${c.status}).`,
          time: c.createdAt
        });
      });

      recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Fetch all notices posted by wardens/admins for notices panel
      const recentNotices = await Notification.find({ type: 'notice' })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      return res.status(200).json({
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        totalFaculties: facultyCount,
        totalWardens: wardenCount,
        totalBlocks: blocks.length,
        totalFloors,
        totalRooms: rooms.length,
        totalBedCapacity: totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyRate: Number(occupancyRate),
        studentsOnLeave,
        totalComplaints,
        pendingComplaints,
        recentActivities: recentActivities.slice(0, 8),
        recentNotices
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({ message: 'Error loading admin stats.' });
    }
  },

  // Get users for Admin user management table
  getAdminUsers: async (req, res) => {
    try {
      const { role, search } = req.query;
      let users = [];

      if (!role || role === 'All' || role === 'Student') {
        const students = await Student.find({}, '-password').populate('room').lean();
        students.forEach(s => {
          users.push({
            _id: s._id,
            id: s._id,
            name: s.name,
            email: s.email,
            role: 'Student',
            department: s.department,
            phone: s.phone,
            identifier: s.registerNumber || 'Pending',
            hostelBlock: s.hostelBlock || 'Unallocated',
            room: s.room ? s.room.roomNumber : 'None',
            createdAt: s.createdAt
          });
        });
      }

      if (!role || role === 'All' || role === 'Faculty') {
        const faculties = await Faculty.find({}, '-password').lean();
        faculties.forEach(f => {
          users.push({
            _id: f._id,
            id: f._id,
            name: f.name,
            email: f.email,
            role: 'Faculty',
            department: f.department,
            phone: f.phone,
            identifier: f.facultyID || 'Pending',
            hostelBlock: 'N/A',
            createdAt: f.createdAt
          });
        });
      }

      if (!role || role === 'All' || role === 'Warden') {
        const wardens = await Warden.find({}, '-password').lean();
        wardens.forEach(w => {
          users.push({
            _id: w._id,
            id: w._id,
            name: w.name,
            email: w.email,
            role: 'Warden',
            department: 'Hostel Administration',
            phone: w.phone,
            identifier: w.wardenID || 'Pending',
            hostelBlock: w.hostelBlock || 'All Blocks',
            createdAt: w.createdAt
          });
        });
      }

      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => 
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.identifier?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }

      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ users });
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return res.status(500).json({ message: 'Error retrieving users.' });
    }
  },

  // Create Staff (Faculty / Warden) from Admin Dashboard
  createStaff: async (req, res) => {
    try {
      const { name, email, password, role, department, phone, hostelBlock, staffID } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password, and role are required.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (role === 'Faculty') {
        const existing = await Faculty.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Faculty with this email already exists.' });

        const faculty = new Faculty({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          department: department || 'General',
          facultyID: staffID || `FAC-${Date.now().toString().slice(-4)}`,
          phone: phone || ''
        });
        await faculty.save();
        return res.status(201).json({ message: 'Faculty account created successfully.', user: faculty });
      } else if (role === 'Warden') {
        const existing = await Warden.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Warden with this email already exists.' });

        const warden = new Warden({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          hostelBlock: hostelBlock || department || 'Aryabhata Block',
          wardenID: staffID || `WRD-${Date.now().toString().slice(-4)}`,
          phone: phone || ''
        });
        await warden.save();
        return res.status(201).json({ message: 'Warden account created successfully.', user: warden });
      } else {
        return res.status(400).json({ message: 'Invalid staff role specified.' });
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      return res.status(500).json({ message: error.message || 'Error creating staff user.' });
    }
  },

  // Delete User (Student, Faculty, Warden)
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const student = await Student.findById(userId);
      if (student) {
        if (student.room) {
          const room = await Room.findById(student.room);
          if (room) {
            room.currentStudents = room.currentStudents.filter(id => id.toString() !== userId.toString());
            room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
            await room.save();
          }
        }
        await Student.findByIdAndDelete(userId);
        return res.status(200).json({ message: 'Student account deleted successfully.' });
      }

      const faculty = await Faculty.findById(userId);
      if (faculty) {
        await Faculty.findByIdAndDelete(userId);
        return res.status(200).json({ message: 'Faculty account deleted successfully.' });
      }

      const warden = await Warden.findById(userId);
      if (warden) {
        await Warden.findByIdAndDelete(userId);
        return res.status(200).json({ message: 'Warden account deleted successfully.' });
      }

      return res.status(404).json({ message: 'User not found across all collections.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Error deleting user.' });
    }
  }
};

module.exports = AdminController;
