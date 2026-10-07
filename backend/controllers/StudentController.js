const Student = require('../models/Student');
const Room = require('../models/Room');
const Notification = require('../models/Notification');

const StudentController = {
  // Get all students (Admin/Warden search & filter)
  getAllStudents: async (req, res) => {
    try {
      const { search, hostelBlock, department, hasRoom } = req.query;
      let filter = {};

      if (hostelBlock) filter.hostelBlock = hostelBlock;
      if (department) filter.department = department;
      if (hasRoom !== undefined) {
        if (hasRoom === 'true') {
          filter.room = { $ne: null };
        } else if (hasRoom === 'false') {
          filter.room = null;
        }
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { registerNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const students = await Student.find(filter).populate('room').exec();
      return res.status(200).json(students);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching students.' });
    }
  },

  // Get single student details
  getStudentById: async (req, res) => {
    try {
      const student = await Student.findById(req.params.id).populate('room').exec();
      if (!student) return res.status(404).json({ message: 'Student not found.' });
      return res.status(200).json(student);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching student.' });
    }
  },

  // Update student preferences (Smart roommate criteria)
  updatePreferences: async (req, res) => {
    try {
      const studentId = req.user.id;
      const {
        sleepingTime,
        wakeUpTime,
        studyEnvironment,
        cleanliness,
        visitorPreference,
        preferredLanguage,
        roomSharing,
        restroomPreference,
        preferredFloor,
        friendRequestRegisterNumber
      } = req.body;

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      if (student.room) {
        return res.status(400).json({ message: 'Preferences cannot be changed after room allocation.' });
      }

      student.preferences = {
        sleepingTime,
        wakeUpTime,
        studyEnvironment,
        cleanliness,
        visitorPreference,
        preferredLanguage,
        roomSharing,
        restroomPreference,
        preferredFloor,
        friendRequestRegisterNumber
      };

      await student.save();
      return res.status(200).json({ message: 'Roommate preferences updated successfully.', preferences: student.preferences });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating preferences.' });
    }
  },

  // Get Roommate information for allocated student
  getRoommates: async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student || !student.room) {
        return res.status(200).json({ roommates: [], room: null });
      }

      const room = await Room.findById(student.room);
      if (!room) return res.status(404).json({ message: 'Allocated room not found.' });

      // Fetch other students sharing this room
      const roommates = await Student.find({
        room: student.room,
        _id: { $ne: studentId }
      }, 'name registerNumber email phone department year profilePhotoPath').exec();

      return res.status(200).json({ roommates, room });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching roommates.' });
    }
  },

  // Delete student account (Admin option)
  deleteStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const student = await Student.findById(id);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      // Remove from room
      if (student.room) {
        const room = await Room.findById(student.room);
        if (room) {
          room.currentStudents = room.currentStudents.filter(sId => sId.toString() !== id);
          room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
          await room.save();
        }
      }

      await Student.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Student deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting student.' });
    }
  },

  getDashboard: async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId).populate('room');
      return res.status(200).json({ student });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error loading dashboard.' });
    }
  }
};

module.exports = StudentController;
