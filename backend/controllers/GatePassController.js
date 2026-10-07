const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const Student = require('../models/Student');
const Leave = require('../models/Leave');
const Warden = require('../models/Warden');
const { createNotification } = require('../utils/notificationHelper');
const moment = require('moment');

const GatePassController = {
  // Request a new digital Gate Pass
  requestGatePass: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { passType, purpose, destination, departureTime, expectedReturnTime, parentContact } = req.body;

      if (!purpose || !destination || !departureTime || !expectedReturnTime) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
      }

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student record not found.' });

      // Generate unique pass code: GP-YYMM-XXXX
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const passCode = `GP-${moment().format('YYMM')}-${randomSuffix}`;
      const qrPayload = `CAMPUSSTAY_PASS_${passCode}_${student.registerNumber || student._id}_${Date.now()}`;

      const gatePass = new GatePass({
        student: studentId,
        passCode,
        passType: passType || 'Day Outing',
        qrPayload,
        purpose,
        destination,
        departureTime: new Date(departureTime),
        expectedReturnTime: new Date(expectedReturnTime),
        parentContact: parentContact || student.parentPhone || student.emergencyContact || '',
        status: 'Approved' // Standard day outings auto-approved or pre-verified
      });

      await gatePass.save();

      // Notify Warden of the block
      if (student.hostelBlock) {
        await createNotification(
          student.hostelBlock,
          'Warden',
          'Digital Gate Pass Issued',
          `Gate Pass [${passCode}] generated for ${student.name} (${student.registerNumber || 'Student'}). Destination: ${destination}.`,
          'notice'
        );
      }

      return res.status(201).json({
        message: 'Digital Gate Pass generated successfully!',
        gatePass
      });
    } catch (error) {
      console.error('Error generating gate pass:', error);
      return res.status(500).json({ message: 'Server error generating gate pass.' });
    }
  },

  // Get current student's gate passes
  getMyPasses: async (req, res) => {
    try {
      const studentId = req.user.id;
      const passes = await GatePass.find({ student: studentId })
        .populate('student', 'name registerNumber department hostelBlock room phone')
        .sort({ createdAt: -1 });

      // Update overdue status dynamically
      passes.forEach(p => p.checkOverdue());

      return res.status(200).json(passes);
    } catch (error) {
      console.error('Error retrieving passes:', error);
      return res.status(500).json({ message: 'Error retrieving gate passes.' });
    }
  },

  // Get all passes (Warden / Admin)
  getAllPasses: async (req, res) => {
    try {
      const { status, block, search } = req.query;
      let filter = {};
      if (status && status !== 'All') filter.status = status;

      let passes = await GatePass.find(filter)
        .populate('student', 'name registerNumber department hostelBlock room phone parentPhone')
        .sort({ departureTime: -1 })
        .lean();

      // Check overdue dynamically
      const now = new Date();
      passes = passes.map(p => {
        if (p.status === 'Active/Out' && now > new Date(p.expectedReturnTime)) {
          p.status = 'Overdue';
        }
        return p;
      });

      if (block && block !== 'All') {
        passes = passes.filter(p => p.student?.hostelBlock === block);
      }

      if (search) {
        const q = search.toLowerCase();
        passes = passes.filter(p =>
          p.passCode?.toLowerCase().includes(q) ||
          p.student?.name?.toLowerCase().includes(q) ||
          p.student?.registerNumber?.toLowerCase().includes(q) ||
          p.destination?.toLowerCase().includes(q)
        );
      }

      return res.status(200).json(passes);
    } catch (error) {
      console.error('Error fetching all gate passes:', error);
      return res.status(500).json({ message: 'Error fetching gate passes.' });
    }
  },

  // Scan or Verify Gate Pass (One-click or Scanner terminal)
  scanOrVerify: async (req, res) => {
    try {
      const { passIdentifier, action, gateNotes } = req.body; // passIdentifier can be passCode or qrPayload
      const wardenId = req.user.id;

      if (!passIdentifier) {
        return res.status(400).json({ message: 'Pass code or QR payload is required.' });
      }

      const pass = await GatePass.findOne({
        $or: [
          { passCode: passIdentifier.trim().toUpperCase() },
          { qrPayload: passIdentifier.trim() },
          { _id: mongoose.isValidObjectId(passIdentifier) ? passIdentifier : null }
        ]
      }).populate('student');

      if (!pass) {
        return res.status(404).json({ message: 'Invalid or expired Gate Pass.' });
      }

      const now = new Date();

      if (action === 'checkout' || (!action && pass.status === 'Approved')) {
        pass.status = 'Active/Out';
        pass.checkOutTime = now;
        pass.gateNotes = gateNotes || pass.gateNotes;
        if (req.user.role === 'Warden') pass.verifiedByWarden = wardenId;
        await pass.save();

        await createNotification(
          pass.student._id,
          'Student',
          'Gate Check-Out Confirmed',
          `You have checked out through the campus gate. Expected return: ${moment(pass.expectedReturnTime).format('hh:mm A, DD MMM')}.`,
          'leave'
        );

        return res.status(200).json({
          message: `Student ${pass.student.name} checked OUT successfully.`,
          pass,
          actionTaken: 'checkout'
        });
      } else if (action === 'checkin' || (!action && (pass.status === 'Active/Out' || pass.status === 'Overdue'))) {
        const wasOverdue = pass.status === 'Overdue' || now > new Date(pass.expectedReturnTime);
        pass.status = 'Returned';
        pass.checkInTime = now;
        if (gateNotes) pass.gateNotes = (pass.gateNotes ? pass.gateNotes + ' | ' : '') + gateNotes;
        await pass.save();

        await createNotification(
          pass.student._id,
          'Student',
          'Gate Check-In Confirmed',
          `Welcome back! Check-in confirmed at ${moment(now).format('hh:mm A')}.${wasOverdue ? ' [Late Return Logged]' : ''}`,
          'leave'
        );

        return res.status(200).json({
          message: `Student ${pass.student.name} checked IN successfully.${wasOverdue ? ' (Late Return Recorded)' : ''}`,
          pass,
          actionTaken: 'checkin',
          wasOverdue
        });
      } else {
        return res.status(400).json({
          message: `Pass is currently in status '${pass.status}'. No transition possible.`,
          pass
        });
      }
    } catch (error) {
      console.error('Error verifying gate pass:', error);
      return res.status(500).json({ message: 'Error processing gate scan.' });
    }
  },

  // Gate Analytics & Live Metrics
  getGateAnalytics: async (req, res) => {
    try {
      const now = new Date();
      const startOfDay = moment().startOf('day').toDate();
      const endOfDay = moment().endOf('day').toDate();

      const totalToday = await GatePass.countDocuments({
        departureTime: { $gte: startOfDay, $lte: endOfDay }
      });

      const currentlyOut = await GatePass.countDocuments({ status: 'Active/Out' });
      const returnedToday = await GatePass.countDocuments({
        status: 'Returned',
        checkInTime: { $gte: startOfDay, $lte: endOfDay }
      });

      // Overdue passes
      const overduePasses = await GatePass.find({
        status: 'Active/Out',
        expectedReturnTime: { $lt: now }
      }).populate('student', 'name registerNumber hostelBlock phone parentPhone room');

      return res.status(200).json({
        totalToday,
        currentlyOut,
        returnedToday,
        overdueCount: overduePasses.length,
        overdueList: overduePasses
      });
    } catch (error) {
      console.error('Error fetching gate analytics:', error);
      return res.status(500).json({ message: 'Error retrieving gate statistics.' });
    }
  }
};

module.exports = GatePassController;
