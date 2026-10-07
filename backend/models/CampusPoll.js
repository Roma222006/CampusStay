const mongoose = require('mongoose');

const campusPollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['Mess & Dining', 'Hostel Amenities', 'Campus Rules & Timings', 'Sports & Events', 'General'],
    default: 'General'
  },
  targetAudience: {
    type: String,
    enum: ['All', 'Hostellers', 'Dayscholars', 'Faculty'],
    default: 'All'
  },
  options: [{
    optionId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    votesCount: {
      type: Number,
      default: 0
    },
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorModel'
  },
  creatorModel: {
    type: String,
    enum: ['Admin', 'Warden', 'Faculty'],
    default: 'Admin'
  },
  creatorName: {
    type: String,
    default: 'Campus Administration'
  },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
  }
}, { timestamps: true });

// Virtual to calculate total votes
campusPollSchema.virtual('totalVotes').get(function() {
  if (!this.options) return 0;
  return this.options.reduce((acc, curr) => acc + (curr.votesCount || 0), 0);
});

campusPollSchema.set('toJSON', { virtuals: true });
campusPollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CampusPoll', campusPollSchema);
