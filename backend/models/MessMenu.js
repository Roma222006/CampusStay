const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    required: true
  },
  timing: {
    type: String,
    default: ''
  },
  menuItems: [{
    type: String,
    trim: true
  }],
  specialItem: {
    type: String,
    default: ''
  },
  dietaryTags: [{
    type: String,
    trim: true
  }],
  calories: {
    type: Number,
    default: 450
  },
  ratings: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    studentName: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  mealSkips: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    studentName: String,
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    mealType: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: 'Leave / Fasting'
    }
  }]
}, { timestamps: true });

// Virtual to calculate average rating
messMenuSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 4.5;
  const sum = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

messMenuSchema.set('toJSON', { virtuals: true });
messMenuSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);
