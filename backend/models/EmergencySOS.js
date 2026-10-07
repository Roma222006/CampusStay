const mongoose = require('mongoose');

const emergencySOSSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  registerNumber: {
    type: String,
    default: 'N/A'
  },
  hostelBlock: {
    type: String,
    default: 'Campus'
  },
  roomNumber: {
    type: String,
    default: 'N/A'
  },
  emergencyType: {
    type: String,
    enum: ['Medical', 'Security Threat', 'Fire & Hazard', 'Mental Health / Distress', 'Hostel Facility Disaster', 'Other'],
    default: 'Medical'
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Moderate'],
    default: 'Critical'
  },
  locationDetails: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Dispatched', 'Resolved'],
    default: 'Active'
  },
  actionLog: [{
    action: String,
    byUser: String,
    byRole: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('EmergencySOS', emergencySOSSchema);
