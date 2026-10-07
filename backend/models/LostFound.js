const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Electronics', 'ID & Cards', 'Keys & Locks', 'Books & Notes', 'Clothing & Accessories', 'Sports & Gear', 'Other'],
    default: 'Other'
  },
  itemType: {
    type: String,
    enum: ['Lost', 'Found'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  dateOccurred: {
    type: Date,
    default: Date.now
  },
  imagePath: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    trim: true,
    default: ''
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reporterModel',
    required: true
  },
  reporterModel: {
    type: String,
    enum: ['Student', 'Faculty', 'Warden', 'Admin'],
    default: 'Student'
  },
  reporterName: {
    type: String,
    default: 'Campus Resident'
  },
  status: {
    type: String,
    enum: ['Open', 'Claim Pending', 'Resolved'],
    default: 'Open'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  claimantName: {
    type: String,
    default: ''
  },
  claimNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('LostFound', lostFoundSchema);
