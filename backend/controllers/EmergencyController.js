const EmergencySOS = require('../models/EmergencySOS');
const Student = require('../models/Student');
const { createNotification } = require('../utils/notificationHelper');

const EmergencyController = {
  // Trigger 1-tap SOS distress
  triggerSOS: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { emergencyType, severity, locationDetails, contactPhone, notes } = req.body;

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student record not found.' });

      const sos = new EmergencySOS({
        student: studentId,
        studentName: student.name,
        registerNumber: student.registerNumber || 'N/A',
        hostelBlock: student.hostelBlock || 'Hostel Campus',
        roomNumber: student.room ? student.room.toString() : 'N/A',
        emergencyType: emergencyType || 'Medical',
        severity: severity || 'Critical',
        locationDetails: locationDetails || `${student.hostelBlock || 'Hostel'}, Room ${student.room || 'Resident Area'}`,
        contactPhone: contactPhone || student.phone || student.emergencyContact || '',
        notes: notes || 'Immediate response requested.',
        status: 'Active',
        actionLog: [{
          action: 'Distress Beacon Triggered by Resident',
          byUser: student.name,
          byRole: 'Student',
          timestamp: new Date()
        }]
      });

      await sos.save();

      // Immediate notification broadcast to Wardens and Admins
      await createNotification(
        'All',
        'Warden',
        `EMERGENCY SOS: ${emergencyType} Alert!`,
        `Resident ${student.name} (${student.registerNumber}) raised ${severity || 'Critical'} ${emergencyType} alert at ${sos.locationDetails}.`,
        'notice'
      );

      await createNotification(
        'All',
        'Admin',
        `EMERGENCY SOS: ${emergencyType} Alert!`,
        `Resident ${student.name} (${student.registerNumber}) raised ${severity || 'Critical'} ${emergencyType} alert at ${sos.locationDetails}.`,
        'notice'
      );

      return res.status(201).json({
        message: 'EMERGENCY BEACON DISPATCHED! Campus Security & Warden have been notified immediately.',
        sos
      });
    } catch (error) {
      console.error('Error raising emergency SOS:', error);
      return res.status(500).json({ message: 'Server error triggering emergency distress beacon.' });
    }
  },

  // Get active and past emergency alerts (Warden / Admin / Student)
  getAlerts: async (req, res) => {
    try {
      const { status, block } = req.query;
      let filter = {};

      if (status && status !== 'All') filter.status = status;

      let alerts = await EmergencySOS.find(filter)
        .populate('student', 'name registerNumber department hostelBlock room phone emergencyContact parentPhone')
        .sort({ createdAt: -1 });

      if (block && block !== 'All') {
        alerts = alerts.filter(a => a.hostelBlock === block || a.student?.hostelBlock === block);
      }

      const activeCount = alerts.filter(a => a.status === 'Active').length;

      return res.status(200).json({
        activeCount,
        alerts
      });
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      return res.status(500).json({ message: 'Error retrieving emergency distress alerts.' });
    }
  },

  // Update alert status (Dispatched / Resolved)
  updateStatus: async (req, res) => {
    try {
      const { alertId } = req.params;
      const { status, actionNote } = req.body;
      const responderName = req.user.name || 'Campus Official';
      const responderRole = req.user.role;

      const alert = await EmergencySOS.findById(alertId);
      if (!alert) return res.status(404).json({ message: 'Emergency record not found.' });

      alert.status = status;
      alert.actionLog.push({
        action: actionNote || `Status updated to ${status} by ${responderName}`,
        byUser: responderName,
        byRole: responderRole,
        timestamp: new Date()
      });

      if (status === 'Resolved') {
        alert.resolvedAt = new Date();
        alert.resolvedBy = `${responderName} (${responderRole})`;
      }

      await alert.save();

      // Notify the student
      await createNotification(
        alert.student,
        'Student',
        `Emergency Alert ${status}`,
        `Your SOS report has been updated to: ${status}. Action: ${actionNote || 'Support dispatched/resolved'}.`,
        'notice'
      );

      return res.status(200).json({ message: `Emergency alert status updated to ${status}.`, alert });
    } catch (error) {
      console.error('Error updating emergency status:', error);
      return res.status(500).json({ message: 'Error updating emergency status.' });
    }
  }
};

module.exports = EmergencyController;
