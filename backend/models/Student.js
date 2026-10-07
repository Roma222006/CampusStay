const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  registerNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/missing values during initial signup
    trim: true
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
  department: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  section: {
    type: String,
    trim: true,
    default: ''
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  studentType: {
    type: String,
    enum: ['Hosteller', 'Dayscholar', ''],
    default: ''
  },
  hostelBlock: {
    type: String,
    trim: true,
    default: ''
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  parentName: {
    type: String,
    trim: true,
    default: ''
  },
  parentPhone: {
    type: String,
    trim: true,
    default: ''
  },
  guardianName: {
    type: String,
    trim: true,
    default: ''
  },
  guardianPhone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  bloodGroup: {
    type: String,
    trim: true,
    default: ''
  },
  emergencyContact: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  idCardPath: {
    type: String,
    default: ''
  },
  profilePhotoPath: {
    type: String,
    default: ''
  },
  // Preferences for Smart Room Allocation (only processed for Hostellers)
  preferences: {
    sleepingTime: {
      type: String,
      enum: ['Before 10 PM', '10 PM–12 AM', 'After 12 AM'],
      default: '10 PM–12 AM'
    },
    wakeUpTime: {
      type: String,
      enum: ['Before 6 AM', '6–8 AM', 'After 8 AM'],
      default: '6–8 AM'
    },
    studyEnvironment: {
      type: String,
      enum: ['Silent', 'Moderate Noise', 'No Preference'],
      default: 'No Preference'
    },
    cleanliness: {
      type: String,
      enum: ['Very Clean', 'Moderate', 'No Preference'],
      default: 'No Preference'
    },
    visitorPreference: {
      type: String,
      enum: ['No Visitors', 'Occasional Visitors', 'No Preference'],
      default: 'No Preference'
    },
    preferredLanguage: {
      type: String,
      enum: ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Other'],
      default: 'English'
    },
    roomSharing: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Four Sharing'],
      default: 'Double'
    },
    restroomPreference: {
      type: String,
      enum: ['Attached Restroom', 'Common Restroom', 'No Preference'],
      default: 'No Preference'
    },
    preferredFloor: {
      type: String,
      enum: ['Ground', 'First', 'Second', 'No Preference'],
      default: 'No Preference'
    },
    friendRequestRegisterNumber: {
      type: String,
      trim: true,
      default: ''
    }
  },
  allocatedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
