const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Notification = require('../models/Notification');

const ComplaintController = {
  // Create a new complaint (Student only)
  createComplaint: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { title, category, description, complaintType } = req.body;

      if (!title || !category || !description) {
        return res.status(400).json({ message: 'Title, category, and description are required.' });
      }

      const typeOfComplaint = complaintType || 'Hostel';

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      // Validate Hosteller constraint for Hostel complaints
      if (typeOfComplaint === 'Hostel' && student.studentType === 'Dayscholar') {
        return res.status(400).json({ message: 'Dayscholars cannot file hostel-specific complaints.' });
      }

      let imagePath = '';
      if (req.file) {
        imagePath = '/uploads/' + req.file.filename;
      }

      const complaint = new Complaint({
        student: studentId,
        title,
        complaintType: typeOfComplaint,
        category,
        description,
        imagePath,
        status: 'Pending'
      });

      await complaint.save();

      // Notifications depending on complaint type
      if (typeOfComplaint === 'Hostel') {
        // Notify Wardens of this block
        await createNotification(
          student.hostelBlock,
          'Warden',
          'New Hostel Complaint',
          `A new ${category} complaint has been raised by ${student.name} (Room ${student.room ? 'allocated' : 'not allocated'}).`,
          'complaint'
        );
      } else {
        // Campus complaints go to Admin
        await createNotification(
          'admin_static_id', // Static admin ID
          'Admin',
          'New Campus Complaint',
          `A new campus fault complaint (${category}) has been raised by ${student.name}.`,
          'complaint'
        );
      }

      return res.status(201).json({ message: 'Complaint registered successfully.', complaint });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error creating complaint.' });
    }
  },

  // Get complaints list based on role
  getComplaints: async (req, res) => {
    try {
      const { role, id } = req.user;
      const { status, category } = req.query;

      let filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;

      if (role === 'Student') {
        filter.student = id;
      } else if (role === 'Warden') {
        const warden = await Warden.findById(id);
        if (!warden) return res.status(404).json({ message: 'Warden not found.' });
        
        // Wardens only see Hostel complaints for their specific hostel block
        const students = await Student.find({ hostelBlock: warden.hostelBlock });
        filter.student = { $in: students.map(s => s._id) };
        filter.complaintType = 'Hostel';
      } else if (role === 'Admin') {
        // Admins see all Campus complaints, and any Hostel complaints that have been Escalated
        filter.$or = [
          { complaintType: 'Campus' },
          { isEscalated: true }
        ];
      }

      const complaints = await Complaint.find(filter)
        .populate({
          path: 'student',
          select: 'name registerNumber department hostelBlock room studentType',
          populate: { path: 'room', select: 'roomNumber' }
        })
        .sort({ createdAt: -1 })
        .exec();

      return res.status(200).json({ complaints });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching complaints.' });
    }
  },

  // Escalate an unresolved complaint (Student only)
  escalateComplaint: async (req, res) => {
    try {
      const { complaintId } = req.params;
      const studentId = req.user.id;
      const { remarks } = req.body;

      const complaint = await Complaint.findOne({ _id: complaintId, student: studentId }).populate('student');
      if (!complaint) return res.status(404).json({ message: 'Complaint not found or unauthorized.' });

      if (complaint.status === 'Rectified') {
        return res.status(400).json({ message: 'Cannot escalate a rectified/resolved complaint.' });
      }

      complaint.isEscalated = true;
      complaint.escalationRemarks = remarks || 'Unresolved issue escalated by student.';
      await complaint.save();

      // Create Admin notifications for escalated complaints
      await createNotification(
        'admin_static_id',
        'Admin',
        'Escalated Student Complaint',
        `Student ${complaint.student.name} escalated an unresolved ${complaint.complaintType} complaint: ${complaint.title}.`,
        'complaint'
      );

      return res.status(200).json({ message: 'Complaint escalated to Administrator successfully.', complaint });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error during escalation.' });
    }
  },

  // Update complaint status (Warden/Admin)
  updateStatus: async (req, res) => {
    try {
      const { complaintId } = req.params;
      const { status, remarks, assignedStaff } = req.body;

      const complaint = await Complaint.findById(complaintId).populate('student');
      if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

      if (status) {
        // Support mapping legacy statuses
        let finalStatus = status;
        if (status === 'Resolved') finalStatus = 'Rectified';
        if (status === 'In Progress') finalStatus = 'Ongoing';
        
        if (!['Pending', 'Ongoing', 'Rectified', 'Rejected'].includes(finalStatus)) {
          return res.status(400).json({ message: 'Invalid status update value.' });
        }
        complaint.status = finalStatus;
      }
      
      if (assignedStaff !== undefined) complaint.assignedStaff = assignedStaff;
      if (remarks !== undefined) complaint.remarks = remarks;

      await complaint.save();

      // Notify Student
      await createNotification(
        complaint.student._id,
        'Student',
        `Complaint Update: ${complaint.status}`,
        `Your complaint (${complaint.title}) status is now: ${complaint.status}. Remarks: ${complaint.remarks || 'None'}`,
        'complaint'
      );

      return res.status(200).json({ message: 'Complaint status updated successfully.', complaint });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error updating complaint.' });
    }
  }
};

// Notification Helper
async function createNotification(recipientId, role, title, message, type) {
  try {
    const notify = new Notification({
      recipientId: recipientId.toString(),
      recipientRole: role,
      title,
      message,
      type
    });
    await notify.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

module.exports = ComplaintController;
