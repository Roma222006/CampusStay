const mongoose = require('mongoose');

const wardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  wardenID: {
    type: String,
    unique: true,
    sparse: true, // Allows initial creation with empty key
    trim: true
  },
  hostelBlock: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  profilePhotoPath: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Warden', wardenSchema);
