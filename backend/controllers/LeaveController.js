const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Warden = require('../models/Warden');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');
const { createNotification } = require('../utils/notificationHelper');

const LeaveController = {
  // Apply Leave (Student only)
  applyLeave: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { leaveType, fromDate, toDate, reason, priority } = req.body;

      if (!leaveType || !fromDate || !toDate || !reason) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      const start = moment(fromDate);
      const end = moment(toDate);
      if (end.isBefore(start)) {
        return res.status(400).json({ message: 'To Date cannot be before From Date.' });
      }

      const durationDays = end.diff(start, 'days') + 1;

      // Handle certificate upload for Medical type
      let certificatePath = '';
      if (leaveType === 'Medical' && req.file) {
        certificatePath = '/uploads/' + req.file.filename;
      }

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      const newLeave = new Leave({
        student: studentId,
        leaveType,
        fromDate: start.toDate(),
        toDate: end.toDate(),
        durationDays,
        reason,
        priority: priority || 'Medium',
        certificatePath,
        status: 'Pending Faculty'
      });

      await newLeave.save();

      // Notify Faculty Advisors of the student's department
      await createNotification(
        student.department,
        'Faculty',
        'New Leave Request',
        `Student ${student.name} (${student.registerNumber}) applied for ${durationDays} days of ${leaveType} leave.`,
        'leave'
      );

      return res.status(201).json({ message: 'Leave application submitted successfully.', leave: newLeave });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error applying for leave.' });
    }
  },

  // Get Leaves list based on role and filters
  getLeaves: async (req, res) => {
    try {
      const { role, id } = req.user;
      const { status, type, search } = req.query;

      let filter = {};

      if (status) filter.status = status;
      if (type) filter.leaveType = type;

      // Role-specific scoping
      if (role === 'Student') {
        filter.student = id;
      } else if (role === 'Faculty') {
        // Faculty views students in their department
        const faculty = await Faculty.findById(id);
        if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });
        const students = await Student.find({ department: faculty.department });
        filter.student = { $in: students.map(s => s._id) };
      } else if (role === 'Warden') {
        // Warden views students in their hostel block
        const warden = await Warden.findById(id);
        if (!warden) return res.status(404).json({ message: 'Warden not found.' });
        const students = await Student.find({ hostelBlock: warden.hostelBlock });
        filter.student = { $in: students.map(s => s._id) };
        // Wardens typically only approve leaves that are already approved by faculty
        if (!status) {
          filter.status = { $in: ['Approved Faculty', 'Approved Warden', 'Rejected Warden'] };
        }
      }

      // Populate student details and approvedByFaculty reference
      let leaves = await Leave.find(filter)
        .populate({
          path: 'student',
          select: 'name registerNumber department section hostelBlock phone'
        })
        .populate({
          path: 'approvedByFaculty',
          select: 'name email department'
        })
        .sort({ createdAt: -1 })
        .exec();

      if (search) {
        const query = search.toLowerCase();
        leaves = leaves.filter(l => 
          l.student && (
            l.student.name.toLowerCase().includes(query) ||
            l.student.registerNumber.toLowerCase().includes(query)
          )
        );
      }

      // Sort by priority first (High/Emergency > Medium > Low), then by createdAt descending
      const priorityOrder = { 'High/Emergency': 1, 'Medium': 2, 'Low': 3 };
      leaves.sort((a, b) => {
        const pA = priorityOrder[a.priority] || 2;
        const pB = priorityOrder[b.priority] || 2;
        if (pA !== pB) return pA - pB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return res.status(200).json(leaves);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching leave requests.' });
    }
  },

  // Faculty approval/rejection
  facultyReview: async (req, res) => {
    try {
      const { leaveId } = req.params;
      const { status, remarks } = req.body; // status: 'Approved Faculty' or 'Rejected Faculty'
      const facultyId = req.user.id;

      if (!['Approved Faculty', 'Rejected Faculty'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status for Faculty review.' });
      }

      const leave = await Leave.findById(leaveId).populate('student');
      if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

      leave.status = status;
      leave.facultyRemarks = remarks || '';
      if (status === 'Approved Faculty') {
        leave.approvedByFaculty = facultyId;
      }
      await leave.save();

      // Notify Student
      await createNotification(
        leave.student._id,
        'Student',
        `Leave Status: ${status === 'Approved Faculty' ? 'Forwarded' : 'Rejected'}`,
        `Your leave request was reviewed by Faculty Advisor: ${status === 'Approved Faculty' ? 'Approved & Forwarded' : 'Rejected'}. Remarks: ${remarks || 'None'}`,
        'leave'
      );

      // If approved, notify Warden of the student's block
      if (status === 'Approved Faculty') {
        await createNotification(
          leave.student.hostelBlock,
          'Warden',
          'Leave Request Pending Warden',
          `Faculty approved leave for ${leave.student.name} (${leave.student.registerNumber}). Pending Warden final approval.`,
          'leave'
        );
      }

      return res.status(200).json({ message: 'Leave request reviewed successfully.', leave });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error during faculty review.' });
    }
  },

  // Warden approval/rejection
  wardenReview: async (req, res) => {
    try {
      const { leaveId } = req.params;
      const { status, remarks } = req.body; // status: 'Approved Warden' or 'Rejected Warden'
      const wardenId = req.user.id;

      if (!['Approved Warden', 'Rejected Warden'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status for Warden review.' });
      }

      const leave = await Leave.findById(leaveId).populate('student');
      if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

      leave.status = status;
      leave.wardenRemarks = remarks || '';
      if (status === 'Approved Warden') {
        leave.approvedByWarden = wardenId;
      }
      await leave.save();

      // Notify Student
      await createNotification(
        leave.student._id,
        'Student',
        `Leave final decision: ${status === 'Approved Warden' ? 'Approved' : 'Rejected'}`,
        `Warden has ${status === 'Approved Warden' ? 'Approved' : 'Rejected'} your leave. Remarks: ${remarks || 'None'}`,
        'leave'
      );

      return res.status(200).json({ message: 'Leave request final decision saved.', leave });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error during warden review.' });
    }
  },

  // Record Check Out
  checkout: async (req, res) => {
    try {
      const { leaveId } = req.params;
      const leave = await Leave.findById(leaveId).populate('student');
      if (!leave) return res.status(404).json({ message: 'Leave record not found.' });

      if (leave.status !== 'Approved Warden') {
        return res.status(400).json({ message: 'Cannot check out. Leave must be approved by Warden.' });
      }

      leave.checkOutTime = new Date();
      await leave.save();

      await createNotification(leave.student._id, 'Student', 'Checked Out', 'You have checked out of the hostel block.', 'leave');
      return res.status(200).json({ message: 'Check-out recorded.', leave });
    } catch (error) {
      return res.status(500).json({ message: 'Error recording checkout.' });
    }
  },

  // Record Check In
  checkin: async (req, res) => {
    try {
      const { leaveId } = req.params;
      const leave = await Leave.findById(leaveId).populate('student');
      if (!leave) return res.status(404).json({ message: 'Leave record not found.' });

      if (!leave.checkOutTime) {
        return res.status(400).json({ message: 'Cannot check in. Student has not checked out yet.' });
      }

      leave.checkInTime = new Date();
      await leave.save();

      await createNotification(leave.student._id, 'Student', 'Checked In', 'You have checked back into the hostel block.', 'leave');
      return res.status(200).json({ message: 'Check-in recorded.', leave });
    } catch (error) {
      return res.status(500).json({ message: 'Error recording checkin.' });
    }
  },

  // PDF Report Generation (using PDFKit)
  exportPDF: async (req, res) => {
    try {
      const leaves = await Leave.find().populate('student').exec();

      const doc = new PDFDocument({ margin: 50 });
      let filename = `Leave_Report_${moment().format('YYYY-MM-DD')}.pdf`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      // Title & Header Style
      doc.fillColor('#0F172A').fontSize(24).text('CampusStay', { align: 'center' });
      doc.fontSize(14).fillColor('#0F766E').text('Leave Management Report', { align: 'center' });
      doc.moveDown(2);

      // Table Header
      let y = 150;
      doc.fontSize(10).fillColor('#1E3A8A');
      doc.text('Student Name', 50, y);
      doc.text('Reg No', 160, y);
      doc.text('Type', 250, y);
      doc.text('Duration', 330, y);
      doc.text('Status', 410, y);
      doc.text('Created At', 480, y);

      // Line
      doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#CBD5E1').stroke();
      y += 25;

      // Table Body
      doc.fillColor('#1F2937');
      leaves.forEach((l) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        const name = l.student ? l.student.name : 'Unknown';
        const reg = l.student ? l.student.registerNumber : 'N/A';
        doc.text(name.substring(0, 18), 50, y);
        doc.text(reg, 160, y);
        doc.text(l.leaveType, 250, y);
        doc.text(`${l.durationDays} Days`, 330, y);
        doc.text(l.status, 410, y);
        doc.text(moment(l.createdAt).format('DD-MM-YYYY'), 480, y);
        y += 20;
      });

      doc.end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error generating PDF report.' });
    }
  },

  // Excel Report Generation (using ExcelJS)
  exportExcel: async (req, res) => {
    try {
      const leaves = await Leave.find().populate('student').exec();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leaves Report');

      // Define Columns
      worksheet.columns = [
        { header: 'Student Name', key: 'name', width: 22 },
        { header: 'Register Number', key: 'regNo', width: 15 },
        { header: 'Department', key: 'dept', width: 12 },
        { header: 'Leave Type', key: 'type', width: 12 },
        { header: 'From Date', key: 'from', width: 12 },
        { header: 'To Date', key: 'to', width: 12 },
        { header: 'Duration (Days)', key: 'duration', width: 15 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Reason', key: 'reason', width: 30 }
      ];

      // Format Header Row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Royal Blue
      };

      // Add Data
      leaves.forEach((l) => {
        worksheet.addRow({
          name: l.student ? l.student.name : 'Unknown',
          regNo: l.student ? l.student.registerNumber : 'N/A',
          dept: l.student ? l.student.department : 'N/A',
          type: l.leaveType,
          from: moment(l.fromDate).format('DD-MM-YYYY'),
          to: moment(l.toDate).format('DD-MM-YYYY'),
          duration: l.durationDays,
          status: l.status,
          reason: l.reason
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Leave_Report_${moment().format('YYYY-MM-DD')}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error generating Excel report.' });
    }
  },

  // Dynamic Status Router helper for frontend client calls
  updateLeaveStatus: async (req, res) => {
    try {
      const { role } = req.user;
      if (role === 'Faculty') {
        if (req.body.status === 'Approved') req.body.status = 'Approved Faculty';
        if (req.body.status === 'Rejected') req.body.status = 'Rejected Faculty';
        return LeaveController.facultyReview(req, res);
      } else if (role === 'Warden') {
        if (req.body.status === 'Approved') req.body.status = 'Approved Warden';
        if (req.body.status === 'Rejected') req.body.status = 'Rejected Warden';
        return LeaveController.wardenReview(req, res);
      } else {
        return res.status(403).json({ message: 'Access denied: role not authorized to review leaves.' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error updating leave status.' });
    }
  },

  // Get student leave history (Warden & Faculty review monitoring)
  getStudentHistory: async (req, res) => {
    try {
      const { studentId } = req.params;
      const history = await Leave.find({ student: studentId })
        .populate({
          path: 'approvedByFaculty',
          select: 'name email department'
        })
        .sort({ createdAt: -1 })
        .exec();
      
      const totalLeavesAvail = history.filter(l => l.status === 'Approved Warden' || l.status === 'Approved Faculty').length;
      return res.status(200).json({
        totalLeavesAvail,
        leaves: history
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error retrieving student history.' });
    }
  },

  // Generate Student approved leaves report PDF
  getStudentApprovedLeavesPDF: async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      const approvedLeaves = await Leave.find({
        student: studentId,
        status: { $in: ['Approved Faculty', 'Approved Warden'] }
      })
      .populate('approvedByFaculty')
      .sort({ fromDate: -1 })
      .exec();

      const doc = new PDFDocument({ margin: 40 });
      const filename = `${student.name.replace(/\s+/g, '_')}_Approved_Leaves_Report.pdf`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      // Header Banner Box
      doc.rect(40, 40, 532, 85).fill('#0F766E');
      
      // Header text
      doc.fillColor('#FFFFFF').fontSize(18).text('CampusStay', 60, 55, { bold: true });
      doc.fontSize(11).text('APPROVED LEAVE AUDIT REPORT', 60, 78);
      doc.fontSize(9).text(`Generated: ${moment().format('MMMM Do YYYY, h:mm a')}`, 60, 95);

      doc.moveDown(4);

      // Student details
      doc.fillColor('#0F172A').fontSize(11).text('Student Information', 40, 145, { bold: true });
      doc.fontSize(9).fillColor('#334155');
      doc.text(`Name: ${student.name}`, 40, 162);
      doc.text(`Register Number / Roll No: ${student.registerNumber || 'N/A'}`, 40, 175);
      doc.text(`Department: ${student.department || 'N/A'}`, 40, 188);
      doc.text(`Total Approved Leaves: ${approvedLeaves.length}`, 40, 201);

      doc.moveTo(40, 220).lineTo(572, 220).strokeColor('#E2E8F0').stroke();

      let y = 235;
      if (approvedLeaves.length === 0) {
        doc.fillColor('#64748B').text('No approved leave applications found.', 40, y);
      } else {
        doc.fillColor('#0F172A').fontSize(11).text('Approved Leave Records', 40, y, { bold: true });
        y += 20;

        approvedLeaves.forEach((l, index) => {
          if (y > 680) {
            doc.addPage();
            y = 40;
          }

          const facultyName = l.approvedByFaculty ? l.approvedByFaculty.name : 'Faculty Advisor';
          const fromStr = moment(l.fromDate).format('DD-MM-YYYY');
          const toStr = moment(l.toDate).format('DD-MM-YYYY');

          doc.rect(40, y, 532, 75).fill('#F8FAFC');
          
          doc.fontSize(9).fillColor('#0F766E').text(`Leave Request #${index + 1} - ${l.leaveType} (${l.durationDays} Days)`, 55, y + 8, { bold: true });
          doc.fillColor('#334155');
          doc.text(`Date Range: ${fromStr} to ${toStr}`, 55, y + 22);
          doc.text(`Approved By: ${facultyName}`, 55, y + 34, { bold: true });
          doc.text(`Cause of Leave: ${l.reason}`, 55, y + 46);
          doc.text(`Advisor Remarks: ${l.facultyRemarks || 'Verified and approved.'}`, 55, y + 58);

          y += 90;
        });
      }

      doc.end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error generating PDF report.' });
    }
  }
};

module.exports = LeaveController;
