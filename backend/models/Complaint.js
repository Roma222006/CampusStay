const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  complaintType: {
    type: String,
    enum: ['Hostel', 'Campus'],
    default: 'Hostel'
  },
  category: {
    type: String,
    enum: ['Electrical', 'Furniture', 'Cleaning', 'Internet', 'Water', 'Plumbing', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  imagePath: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Rectified', 'Rejected'],
    default: 'Pending'
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalationRemarks: {
    type: String,
    default: ''
  },
  assignedStaff: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
