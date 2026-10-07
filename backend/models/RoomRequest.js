const mongoose = require('mongoose');

const roomRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  requestType: {
    type: String,
    enum: ['Change', 'Swap', 'Allocation'],
    required: true
  },
  preferredBlock: {
    type: String,
    default: ''
  },
  preferredRoomType: {
    type: String,
    default: ''
  },
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  wardenRemarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('RoomRequest', roomRequestSchema);
