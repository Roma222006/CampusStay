const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  leave: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
    default: null
  },
  passCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  passType: {
    type: String,
    enum: ['Day Outing', 'Weekend Leave', 'Emergency Leave', 'Campus Outing'],
    default: 'Day Outing'
  },
  qrPayload: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  expectedReturnTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  checkInTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Approved', 'Active/Out', 'Returned', 'Overdue', 'Cancelled'],
    default: 'Approved'
  },
  parentApproved: {
    type: Boolean,
    default: true
  },
  parentContact: {
    type: String,
    default: ''
  },
  gateNotes: {
    type: String,
    default: ''
  },
  verifiedByWarden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warden',
    default: null
  }
}, { timestamps: true });

// Check and flag overdue if pass is Active/Out and return time has passed
gatePassSchema.methods.checkOverdue = function() {
  if (this.status === 'Active/Out' && new Date() > new Date(this.expectedReturnTime)) {
    this.status = 'Overdue';
    return true;
  }
  return false;
};

module.exports = mongoose.model('GatePass', gatePassSchema);
