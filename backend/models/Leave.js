const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Casual', 'Medical', 'Emergency', 'Home Visit', 'On Duty'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High/Emergency'],
    default: 'Medium'
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  certificatePath: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending Faculty', 'Approved Faculty', 'Approved Warden', 'Rejected Faculty', 'Rejected Warden'],
    default: 'Pending Faculty'
  },
  facultyRemarks: {
    type: String,
    default: ''
  },
  approvedByFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  wardenRemarks: {
    type: String,
    default: ''
  },
  approvedByWarden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warden',
    default: null
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
