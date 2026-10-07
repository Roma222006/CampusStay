const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  hostelBlock: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true,
    min: 0
  },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Four Sharing'],
    default: 'Double'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  occupiedBeds: {
    type: Number,
    default: 0,
    min: 0
  },
  restroomType: {
    type: String,
    enum: ['Attached', 'Common'],
    default: 'Common'
  },
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance', 'Locked'],
    default: 'Available'
  },
  currentStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  maintenanceNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Pre-save middleware to set capacity based on roomType
roomSchema.pre('save', function(next) {
  const capacities = {
    'Single': 1,
    'Double': 2,
    'Triple': 3,
    'Four Sharing': 4
  };
  this.capacity = capacities[this.roomType] || 2;
  
  if (this.occupiedBeds >= this.capacity) {
    this.status = 'Full';
  } else if (this.status === 'Full') {
    this.status = 'Available';
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
