const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  facultyID: {
    type: String,
    unique: true,
    sparse: true, // Allows initial creation with empty key
    trim: true
  },
  department: {
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

module.exports = mongoose.model('Faculty', facultySchema);
