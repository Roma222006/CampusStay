const MessMenu = require('../models/MessMenu');
const Student = require('../models/Student');
const moment = require('moment');

const MessController = {
  // Get complete weekly menu & today's special
  getWeeklyMenu: async (req, res) => {
    try {
      const { day } = req.query;
      let filter = {};
      if (day) filter.dayOfWeek = day;

      const menu = await MessMenu.find(filter).sort({ dayOfWeek: 1, mealType: 1 });

      const currentDay = moment().format('dddd'); // e.g. "Wednesday"
      const todayMenu = menu.filter(m => m.dayOfWeek === currentDay);

      return res.status(200).json({
        currentDay,
        todayMenu,
        weeklyMenu: menu
      });
    } catch (error) {
      console.error('Error fetching mess menu:', error);
      return res.status(500).json({ message: 'Error retrieving mess menu.' });
    }
  },

  // Update or add a meal in the menu (Admin / Warden)
  updateMeal: async (req, res) => {
    try {
      const { dayOfWeek, mealType, timing, menuItems, specialItem, dietaryTags, calories } = req.body;

      if (!dayOfWeek || !mealType) {
        return res.status(400).json({ message: 'dayOfWeek and mealType are required.' });
      }

      let meal = await MessMenu.findOne({ dayOfWeek, mealType });

      if (!meal) {
        meal = new MessMenu({
          dayOfWeek,
          mealType,
          timing: timing || '',
          menuItems: Array.isArray(menuItems) ? menuItems : (menuItems ? menuItems.split(',').map(s => s.trim()) : []),
          specialItem: specialItem || '',
          dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : (dietaryTags ? dietaryTags.split(',').map(s => s.trim()) : ['Vegetarian']),
          calories: calories || 450
        });
      } else {
        if (timing !== undefined) meal.timing = timing;
        if (menuItems !== undefined) {
          meal.menuItems = Array.isArray(menuItems) ? menuItems : menuItems.split(',').map(s => s.trim());
        }
        if (specialItem !== undefined) meal.specialItem = specialItem;
        if (dietaryTags !== undefined) {
          meal.dietaryTags = Array.isArray(dietaryTags) ? dietaryTags : dietaryTags.split(',').map(s => s.trim());
        }
        if (calories !== undefined) meal.calories = calories;
      }

      await meal.save();
      return res.status(200).json({ message: 'Mess menu meal updated successfully.', meal });
    } catch (error) {
      console.error('Error updating meal:', error);
      return res.status(500).json({ message: 'Error updating mess meal.' });
    }
  },

  // Rate a meal (Student)
  rateMeal: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { mealId, rating, comment } = req.body;

      if (!mealId || !rating) {
        return res.status(400).json({ message: 'Meal ID and rating (1-5) are required.' });
      }

      const student = await Student.findById(studentId);
      const studentName = student ? student.name : 'Hostel Resident';

      const meal = await MessMenu.findById(mealId);
      if (!meal) return res.status(404).json({ message: 'Meal not found.' });

      // Remove previous rating by same student if exists
      meal.ratings = meal.ratings.filter(r => r.student && r.student.toString() !== studentId.toString());

      meal.ratings.push({
        student: studentId,
        studentName,
        rating: Number(rating),
        comment: comment || '',
        date: new Date()
      });

      await meal.save();

      return res.status(200).json({
        message: 'Thank you! Your meal rating and feedback has been recorded.',
        meal
      });
    } catch (error) {
      console.error('Error rating meal:', error);
      return res.status(500).json({ message: 'Error submitting meal rating.' });
    }
  },

  // Toggle meal skip (Food Waste Reduction feature)
  toggleSkipMeal: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { mealId, date, reason } = req.body; // date format: YYYY-MM-DD

      const dateStr = date || moment().format('YYYY-MM-DD');
      const meal = await MessMenu.findById(mealId);
      if (!meal) return res.status(404).json({ message: 'Meal not found.' });

      const student = await Student.findById(studentId);
      const studentName = student ? student.name : 'Student';

      // Check if already skipped
      const existingIndex = meal.mealSkips.findIndex(
        s => s.student && s.student.toString() === studentId.toString() && s.date === dateStr
      );

      let skipped = false;
      if (existingIndex > -1) {
        // Unskip
        meal.mealSkips.splice(existingIndex, 1);
        skipped = false;
      } else {
        // Skip
        meal.mealSkips.push({
          student: studentId,
          studentName,
          date: dateStr,
          mealType: meal.mealType,
          reason: reason || 'Going out / Fasting'
        });
        skipped = true;
      }

      await meal.save();

      return res.status(200).json({
        message: skipped
          ? 'Meal skip recorded! Thank you for helping minimize food wastage 🌱'
          : 'Meal skip cancelled. You are counted in the mess headcount.',
        skipped,
        totalSkipsForMeal: meal.mealSkips.filter(s => s.date === dateStr).length
      });
    } catch (error) {
      console.error('Error toggling meal skip:', error);
      return res.status(500).json({ message: 'Error updating meal attendance preference.' });
    }
  },

  // Mess Headcount & Waste Analytics
  getMessAnalytics: async (req, res) => {
    try {
      const totalHostellers = await Student.countDocuments({ studentType: 'Hosteller' });
      const today = moment().format('YYYY-MM-DD');
      const currentDay = moment().format('dddd');

      const todayMeals = await MessMenu.find({ dayOfWeek: currentDay });

      const mealHeadcounts = todayMeals.map(m => {
        const skipsCount = m.mealSkips.filter(s => s.date === today).length;
        const predictedHeadcount = Math.max(0, (totalHostellers || 45) - skipsCount);
        const foodSavedKgEstimate = (skipsCount * 0.35).toFixed(1); // avg 350g per skipped plate

        return {
          mealId: m._id,
          mealType: m.mealType,
          timing: m.timing,
          totalHostellers: totalHostellers || 45,
          skipsCount,
          predictedHeadcount,
          foodSavedKgEstimate,
          averageRating: m.averageRating,
          ratingsCount: m.ratings.length
        };
      });

      return res.status(200).json({
        date: today,
        dayOfWeek: currentDay,
        totalHostellers: totalHostellers || 45,
        mealHeadcounts
      });
    } catch (error) {
      console.error('Error fetching mess analytics:', error);
      return res.status(500).json({ message: 'Error fetching mess statistics.' });
    }
  }
};

module.exports = MessController;
