/**
 * ReportController.js
 * Generates reports for Leave, Student, Complaint, Occupancy, Faculty, and Room data.
 * Supports JSON (for charts), PDF (via pdfkit), and Excel (via exceljs) output formats.
 */

const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Warden = require('../models/Warden');
const Room = require('../models/Room');
const HostelBlock = require('../models/HostelBlock');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

/* ─── helpers ───────────────────────────────────────────────────────────── */

/** Write a branded PDF header and return the initial Y cursor. */
function writePDFHeader(doc, title, subtitle) {
  doc.rect(40, 40, 515, 80).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('CampusStay', 60, 55);
  doc.fontSize(11).font('Helvetica').text(title, 60, 79);
  doc.fontSize(8).fillColor('#94A3B8').text(`Generated: ${moment().format('MMMM Do YYYY, h:mm a')}`, 60, 97);
  if (subtitle) {
    doc.fillColor('#CBD5E1').fontSize(8).text(subtitle, 350, 80, { align: 'right', width: 200 });
  }
  return 145;
}

/** Draw a simple table row line */
function pdfLine(doc, y) {
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
}

/** Format a date range label */
function formatRange(from, to) {
  if (!from && !to) return 'All Time';
  const f = from ? moment(from).format('DD-MM-YYYY') : 'Start';
  const t = to ? moment(to).format('DD-MM-YYYY') : 'Today';
  return `${f} → ${t}`;
}

/* ─── filter builder ────────────────────────────────────────────────────── */

function buildDateFilter(from, to) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  return Object.keys(dateFilter).length > 0 ? dateFilter : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. LEAVE REPORT
═══════════════════════════════════════════════════════════════════════════ */

const LeaveReport = {
  getData: async (req, res) => {
    try {
      const { from, to, status, department, format } = req.query;
      const filter = {};

      const dateF = buildDateFilter(from, to);
      if (dateF) filter.createdAt = dateF;
      if (status) filter.status = status;

      let leaves = await Leave.find(filter)
        .populate('student', 'name registerNumber department section hostelBlock')
        .populate('approvedByFaculty', 'name')
        .sort({ createdAt: -1 })
        .lean();

      if (department) {
        leaves = leaves.filter(l => l.student?.department === department);
      }

      // Monthly chart data (last 6 months)
      const monthly = {};
      for (let i = 5; i >= 0; i--) {
        const m = moment().subtract(i, 'months').format('MMM YYYY');
        monthly[m] = 0;
      }
      leaves.forEach(l => {
        const m = moment(l.createdAt).format('MMM YYYY');
        if (monthly[m] !== undefined) monthly[m]++;
      });

      // Status distribution
      const statusDist = {};
      leaves.forEach(l => {
        statusDist[l.status] = (statusDist[l.status] || 0) + 1;
      });

      // Leave type distribution
      const typeDist = {};
      leaves.forEach(l => {
        typeDist[l.leaveType] = (typeDist[l.leaveType] || 0) + 1;
      });

      if (!format || format === 'json') {
        return res.status(200).json({
          total: leaves.length,
          leaves,
          charts: { monthly, statusDist, typeDist },
          range: formatRange(from, to),
        });
      }

      if (format === 'pdf') return LeaveReport.exportPDF(res, leaves, { from, to, department });
      if (format === 'excel') return LeaveReport.exportExcel(res, leaves, { from, to });

      return res.status(400).json({ message: 'Unknown format. Use json, pdf, or excel.' });
    } catch (err) {
      console.error('Leave report error:', err);
      return res.status(500).json({ message: 'Error generating leave report.' });
    }
  },

  exportPDF: async (res, leaves, { from, to, department }) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename="Leave_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    let y = writePDFHeader(doc, 'Leave Management Report', department ? `Dept: ${department}` : formatRange(from, to));

    const headers = ['Student', 'Reg No', 'Dept', 'Type', 'Duration', 'Status'];
    const colX = [40, 155, 230, 305, 380, 440];

    // Header row
    doc.rect(40, y, 515, 20).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: 110 }));
    y += 22;

    doc.font('Helvetica').fontSize(8);
    leaves.forEach((l, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      const fill = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(40, y, 515, 18).fill(fill);
      doc.fillColor('#1F2937');
      doc.text((l.student?.name || 'N/A').substring(0, 18), colX[0], y + 4, { width: 110 });
      doc.text(l.student?.registerNumber || 'N/A', colX[1], y + 4, { width: 70 });
      doc.text((l.student?.department || 'N/A').substring(0, 12), colX[2], y + 4, { width: 70 });
      doc.text(l.leaveType, colX[3], y + 4, { width: 70 });
      doc.text(`${l.durationDays}d`, colX[4], y + 4, { width: 55 });
      doc.text((l.status || '').substring(0, 20), colX[5], y + 4, { width: 110 });
      y += 19;
    });

    doc.end();
  },

  exportExcel: async (res, leaves, { from, to }) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CampusStay';
    const ws = workbook.addWorksheet('Leave Report');

    ws.columns = [
      { header: 'Student Name', key: 'name', width: 22 },
      { header: 'Register No', key: 'reg', width: 15 },
      { header: 'Department', key: 'dept', width: 16 },
      { header: 'Leave Type', key: 'type', width: 14 },
      { header: 'From', key: 'from', width: 13 },
      { header: 'To', key: 'to', width: 13 },
      { header: 'Days', key: 'days', width: 8 },
      { header: 'Status', key: 'status', width: 22 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Reason', key: 'reason', width: 35 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    ws.getRow(1).height = 20;

    leaves.forEach(l => {
      ws.addRow({
        name: l.student?.name || 'N/A',
        reg: l.student?.registerNumber || 'N/A',
        dept: l.student?.department || 'N/A',
        type: l.leaveType,
        from: moment(l.fromDate).format('DD-MM-YYYY'),
        to: moment(l.toDate).format('DD-MM-YYYY'),
        days: l.durationDays,
        status: l.status,
        priority: l.priority || 'Medium',
        reason: l.reason,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Leave_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. STUDENT REPORT
═══════════════════════════════════════════════════════════════════════════ */

const StudentReport = {
  getData: async (req, res) => {
    try {
      const { department, studentType, allocated, format } = req.query;
      const filter = {};
      if (department) filter.department = department;
      if (studentType) filter.studentType = studentType;
      if (allocated === 'true') filter.room = { $ne: null };
      if (allocated === 'false') filter.room = null;

      const students = await Student.find(filter)
        .populate('room', 'roomNumber hostelBlock floor roomType')
        .sort({ name: 1 })
        .lean();

      const typeDist = { Hosteller: 0, Dayscholar: 0 };
      const deptDist = {};
      const allocationDist = { Allocated: 0, Unallocated: 0 };

      students.forEach(s => {
        typeDist[s.studentType] = (typeDist[s.studentType] || 0) + 1;
        deptDist[s.department] = (deptDist[s.department] || 0) + 1;
        if (s.room) allocationDist.Allocated++; else allocationDist.Unallocated++;
      });

      if (!format || format === 'json') {
        return res.status(200).json({ total: students.length, students, charts: { typeDist, deptDist, allocationDist } });
      }

      if (format === 'pdf') return StudentReport.exportPDF(res, students);
      if (format === 'excel') return StudentReport.exportExcel(res, students);

      return res.status(400).json({ message: 'Unknown format.' });
    } catch (err) {
      console.error('Student report error:', err);
      return res.status(500).json({ message: 'Error generating student report.' });
    }
  },

  exportPDF: async (res, students) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename="Student_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    let y = writePDFHeader(doc, 'Student Registry Report', `Total: ${students.length}`);

    const headers = ['Name', 'Reg No', 'Dept', 'Type', 'Room', 'Block'];
    const colX = [40, 155, 245, 340, 400, 465];

    doc.rect(40, y, 515, 20).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: 110 }));
    y += 22;

    doc.font('Helvetica').fontSize(8);
    students.forEach((s, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      const fill = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(40, y, 515, 18).fill(fill);
      doc.fillColor('#1F2937');
      doc.text((s.name || '').substring(0, 18), colX[0], y + 4, { width: 110 });
      doc.text(s.registerNumber || 'N/A', colX[1], y + 4, { width: 85 });
      doc.text((s.department || '').substring(0, 14), colX[2], y + 4, { width: 90 });
      doc.text(s.studentType || 'N/A', colX[3], y + 4, { width: 55 });
      doc.text(s.room?.roomNumber || '—', colX[4], y + 4, { width: 60 });
      doc.text((s.room?.hostelBlock || s.hostelBlock || '—').substring(0, 14), colX[5], y + 4, { width: 90 });
      y += 19;
    });

    doc.end();
  },

  exportExcel: async (res, students) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Students');
    ws.columns = [
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Register No', key: 'reg', width: 15 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Student Type', key: 'type', width: 14 },
      { header: 'Hostel Block', key: 'block', width: 16 },
      { header: 'Room No', key: 'room', width: 10 },
      { header: 'Phone', key: 'phone', width: 14 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    students.forEach(s => {
      ws.addRow({
        name: s.name, reg: s.registerNumber, dept: s.department,
        section: s.section, type: s.studentType,
        block: s.room?.hostelBlock || s.hostelBlock || '—',
        room: s.room?.roomNumber || '—', phone: s.phone,
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Student_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. COMPLAINT REPORT
═══════════════════════════════════════════════════════════════════════════ */

const ComplaintReport = {
  getData: async (req, res) => {
    try {
      const { from, to, status, complaintType, format } = req.query;
      const filter = {};
      const dateF = buildDateFilter(from, to);
      if (dateF) filter.createdAt = dateF;
      if (status) filter.status = status;
      if (complaintType) filter.complaintType = complaintType;

      const complaints = await Complaint.find(filter)
        .populate('student', 'name registerNumber department hostelBlock')
        .sort({ createdAt: -1 })
        .lean();

      const statusDist = {};
      const typeDist = {};
      const monthly = {};
      for (let i = 5; i >= 0; i--) {
        const m = moment().subtract(i, 'months').format('MMM YYYY');
        monthly[m] = 0;
      }
      complaints.forEach(c => {
        statusDist[c.status] = (statusDist[c.status] || 0) + 1;
        typeDist[c.complaintType || 'Hostel'] = (typeDist[c.complaintType || 'Hostel'] || 0) + 1;
        const m = moment(c.createdAt).format('MMM YYYY');
        if (monthly[m] !== undefined) monthly[m]++;
      });

      if (!format || format === 'json') {
        return res.status(200).json({ total: complaints.length, complaints, charts: { statusDist, typeDist, monthly } });
      }
      if (format === 'pdf') return ComplaintReport.exportPDF(res, complaints, { from, to });
      if (format === 'excel') return ComplaintReport.exportExcel(res, complaints);
      return res.status(400).json({ message: 'Unknown format.' });
    } catch (err) {
      console.error('Complaint report error:', err);
      return res.status(500).json({ message: 'Error generating complaint report.' });
    }
  },

  exportPDF: async (res, complaints, { from, to }) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename="Complaint_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    let y = writePDFHeader(doc, 'Complaint Management Report', formatRange(from, to));
    const headers = ['Student', 'Dept', 'Block', 'Category', 'Type', 'Status', 'Date'];
    const colX = [40, 145, 220, 290, 360, 420, 480];
    doc.rect(40, y, 515, 20).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: 90 }));
    y += 22;
    doc.font('Helvetica').fontSize(7.5);
    complaints.forEach((c, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      const fill = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(40, y, 515, 18).fill(fill).fillColor('#1F2937');
      doc.text((c.student?.name || 'N/A').substring(0, 15), colX[0], y + 4, { width: 100 });
      doc.text((c.student?.department || 'N/A').substring(0, 10), colX[1], y + 4, { width: 70 });
      doc.text((c.student?.hostelBlock || '—').substring(0, 12), colX[2], y + 4, { width: 65 });
      doc.text((c.category || 'General').substring(0, 12), colX[3], y + 4, { width: 65 });
      doc.text(c.complaintType || 'Hostel', colX[4], y + 4, { width: 55 });
      doc.text(c.status || 'Pending', colX[5], y + 4, { width: 55 });
      doc.text(moment(c.createdAt).format('DD-MM-YY'), colX[6], y + 4, { width: 55 });
      y += 19;
    });
    doc.end();
  },

  exportExcel: async (res, complaints) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Complaints');
    ws.columns = [
      { header: 'Student Name', key: 'name', width: 20 },
      { header: 'Register No', key: 'reg', width: 15 },
      { header: 'Department', key: 'dept', width: 16 },
      { header: 'Hostel Block', key: 'block', width: 16 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Escalated', key: 'escalated', width: 10 },
      { header: 'Description', key: 'desc', width: 35 },
      { header: 'Date', key: 'date', width: 13 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    complaints.forEach(c => {
      ws.addRow({
        name: c.student?.name || 'N/A', reg: c.student?.registerNumber || 'N/A',
        dept: c.student?.department || 'N/A', block: c.student?.hostelBlock || '—',
        category: c.category || 'General', type: c.complaintType || 'Hostel',
        status: c.status, escalated: c.isEscalated ? 'Yes' : 'No',
        desc: c.description, date: moment(c.createdAt).format('DD-MM-YYYY'),
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Complaint_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. OCCUPANCY REPORT
═══════════════════════════════════════════════════════════════════════════ */

const OccupancyReport = {
  getData: async (req, res) => {
    try {
      const { format } = req.query;
      const blocks = await HostelBlock.find().lean();
      const rooms = await Room.find().populate('currentStudents', 'name registerNumber').lean();

      const blockStats = blocks.map(b => {
        const blockRooms = rooms.filter(r => r.hostelBlock === b.name);
        const totalCap = blockRooms.reduce((s, r) => s + r.capacity, 0);
        const occupied = blockRooms.reduce((s, r) => s + r.occupiedBeds, 0);
        return {
          block: b.name, totalRooms: blockRooms.length,
          totalCapacity: totalCap, occupiedBeds: occupied,
          vacantBeds: totalCap - occupied,
          occupancyRate: totalCap > 0 ? ((occupied / totalCap) * 100).toFixed(1) : '0.0',
          maintenance: blockRooms.filter(r => r.status === 'Maintenance').length,
        };
      });

      const roomTypeDist = {};
      rooms.forEach(r => {
        roomTypeDist[r.roomType] = (roomTypeDist[r.roomType] || 0) + 1;
      });

      const statusDist = { Available: 0, Full: 0, Partial: 0, Maintenance: 0 };
      rooms.forEach(r => {
        if (r.status === 'Maintenance') statusDist.Maintenance++;
        else if (r.occupiedBeds === 0) statusDist.Available++;
        else if (r.occupiedBeds >= r.capacity) statusDist.Full++;
        else statusDist.Partial++;
      });

      if (!format || format === 'json') {
        return res.status(200).json({ blockStats, rooms, charts: { roomTypeDist, statusDist } });
      }
      if (format === 'pdf') return OccupancyReport.exportPDF(res, blockStats, rooms);
      if (format === 'excel') return OccupancyReport.exportExcel(res, blockStats, rooms);
      return res.status(400).json({ message: 'Unknown format.' });
    } catch (err) {
      console.error('Occupancy report error:', err);
      return res.status(500).json({ message: 'Error generating occupancy report.' });
    }
  },

  exportPDF: async (res, blockStats, rooms) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename="Occupancy_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    let y = writePDFHeader(doc, 'Hostel Occupancy Report', `Total Rooms: ${rooms.length}`);

    // Block summary table
    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Block Summary', 40, y);
    y += 16;
    const bHeaders = ['Block', 'Rooms', 'Capacity', 'Occupied', 'Vacant', 'Occupancy %', 'Maintenance'];
    const bColX = [40, 155, 220, 285, 350, 415, 490];
    doc.rect(40, y, 515, 20).fill('#1E3A8A');
    doc.fillColor('#FFF').fontSize(8).font('Helvetica-Bold');
    bHeaders.forEach((h, i) => doc.text(h, bColX[i], y + 5, { width: 90 }));
    y += 22;
    doc.font('Helvetica').fontSize(8.5);
    blockStats.forEach((b, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.rect(40, y, 515, 18).fill(idx % 2 === 0 ? '#F0F9FF' : '#FFF');
      doc.fillColor('#1F2937');
      doc.text(b.block.substring(0, 18), bColX[0], y + 4);
      doc.text(String(b.totalRooms), bColX[1], y + 4);
      doc.text(String(b.totalCapacity), bColX[2], y + 4);
      doc.text(String(b.occupiedBeds), bColX[3], y + 4);
      doc.text(String(b.vacantBeds), bColX[4], y + 4);
      doc.text(`${b.occupancyRate}%`, bColX[5], y + 4);
      doc.text(String(b.maintenance), bColX[6], y + 4);
      y += 19;
    });
    doc.end();
  },

  exportExcel: async (res, blockStats, rooms) => {
    const workbook = new ExcelJS.Workbook();
    const ws1 = workbook.addWorksheet('Block Summary');
    ws1.columns = [
      { header: 'Hostel Block', key: 'block', width: 20 }, { header: 'Total Rooms', key: 'rooms', width: 12 },
      { header: 'Total Capacity', key: 'cap', width: 14 }, { header: 'Occupied', key: 'occ', width: 10 },
      { header: 'Vacant', key: 'vac', width: 10 }, { header: 'Occupancy %', key: 'rate', width: 13 },
      { header: 'Maintenance', key: 'maint', width: 12 },
    ];
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    blockStats.forEach(b => ws1.addRow({ block: b.block, rooms: b.totalRooms, cap: b.totalCapacity, occ: b.occupiedBeds, vac: b.vacantBeds, rate: `${b.occupancyRate}%`, maint: b.maintenance }));

    const ws2 = workbook.addWorksheet('Room Details');
    ws2.columns = [
      { header: 'Room No', key: 'room', width: 10 }, { header: 'Block', key: 'block', width: 20 },
      { header: 'Floor', key: 'floor', width: 8 }, { header: 'Type', key: 'type', width: 14 },
      { header: 'Restroom', key: 'restroom', width: 12 }, { header: 'Capacity', key: 'cap', width: 10 },
      { header: 'Occupied', key: 'occ', width: 10 }, { header: 'Status', key: 'status', width: 14 },
    ];
    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    rooms.forEach(r => ws2.addRow({ room: r.roomNumber, block: r.hostelBlock, floor: r.floor, type: r.roomType, restroom: r.restroomType, cap: r.capacity, occ: r.occupiedBeds, status: r.status }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Occupancy_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. FACULTY REPORT
═══════════════════════════════════════════════════════════════════════════ */

const FacultyReport = {
  getData: async (req, res) => {
    try {
      const { format } = req.query;
      const faculties = await Faculty.find().lean();
      const students = await Student.find().lean();
      const leaves = await Leave.find().populate('approvedByFaculty', 'name department').lean();

      const facultyStats = faculties.map(f => {
        const assigned = students.filter(s => s.department === f.department).length;
        const approved = leaves.filter(l => l.approvedByFaculty && l.approvedByFaculty._id?.toString() === f._id.toString() && l.status.includes('Approved')).length;
        const pending = leaves.filter(l => l.status === 'Pending Faculty').length;
        return { name: f.name, email: f.email, department: f.department, assignedStudents: assigned, leavesApproved: approved, leavesPending: pending };
      });

      if (!format || format === 'json') {
        return res.status(200).json({ total: faculties.length, facultyStats });
      }
      if (format === 'pdf') return FacultyReport.exportPDF(res, facultyStats);
      if (format === 'excel') return FacultyReport.exportExcel(res, facultyStats);
      return res.status(400).json({ message: 'Unknown format.' });
    } catch (err) {
      console.error('Faculty report error:', err);
      return res.status(500).json({ message: 'Error generating faculty report.' });
    }
  },

  exportPDF: async (res, facultyStats) => {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Disposition', `attachment; filename="Faculty_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    let y = writePDFHeader(doc, 'Faculty Advisor Report', `Total: ${facultyStats.length}`);
    const headers = ['Name', 'Department', 'Assigned Students', 'Leaves Approved', 'Pending'];
    const colX = [40, 170, 310, 400, 480];
    doc.rect(40, y, 515, 20).fill('#1E3A8A');
    doc.fillColor('#FFF').fontSize(8.5).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: 130 }));
    y += 22;
    doc.font('Helvetica').fontSize(9);
    facultyStats.forEach((f, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.rect(40, y, 515, 18).fill(idx % 2 === 0 ? '#F0FDF4' : '#FFF').fillColor('#1F2937');
      doc.text(f.name.substring(0, 20), colX[0], y + 4, { width: 125 });
      doc.text(f.department.substring(0, 18), colX[1], y + 4, { width: 135 });
      doc.text(String(f.assignedStudents), colX[2], y + 4);
      doc.text(String(f.leavesApproved), colX[3], y + 4);
      doc.text(String(f.leavesPending), colX[4], y + 4);
      y += 19;
    });
    doc.end();
  },

  exportExcel: async (res, facultyStats) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Faculty');
    ws.columns = [
      { header: 'Name', key: 'name', width: 22 }, { header: 'Email', key: 'email', width: 28 },
      { header: 'Department', key: 'dept', width: 18 }, { header: 'Assigned Students', key: 'students', width: 18 },
      { header: 'Leaves Approved', key: 'approved', width: 16 }, { header: 'Pending Leaves', key: 'pending', width: 15 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
    facultyStats.forEach(f => ws.addRow({ name: f.name, email: f.email, dept: f.department, students: f.assignedStudents, approved: f.leavesApproved, pending: f.leavesPending }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Faculty_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. ROOM REPORT
═══════════════════════════════════════════════════════════════════════════ */

const RoomReport = {
  getData: async (req, res) => {
    try {
      const { hostelBlock, status, format } = req.query;
      const filter = {};
      if (hostelBlock) filter.hostelBlock = hostelBlock;
      if (status) filter.status = status;

      const rooms = await Room.find(filter)
        .populate('currentStudents', 'name registerNumber department phone')
        .lean();

      const blockDist = {};
      const typeDist = {};
      const restroomDist = { Attached: 0, Common: 0 };
      rooms.forEach(r => {
        blockDist[r.hostelBlock] = (blockDist[r.hostelBlock] || 0) + 1;
        typeDist[r.roomType] = (typeDist[r.roomType] || 0) + 1;
        restroomDist[r.restroomType] = (restroomDist[r.restroomType] || 0) + 1;
      });

      if (!format || format === 'json') {
        return res.status(200).json({ total: rooms.length, rooms, charts: { blockDist, typeDist, restroomDist } });
      }
      if (format === 'pdf') return RoomReport.exportPDF(res, rooms);
      if (format === 'excel') return RoomReport.exportExcel(res, rooms);
      return res.status(400).json({ message: 'Unknown format.' });
    } catch (err) {
      console.error('Room report error:', err);
      return res.status(500).json({ message: 'Error generating room report.' });
    }
  },

  exportPDF: async (res, rooms) => {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Disposition', `attachment; filename="Room_Report_${moment().format('YYYYMMDD')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    let y = writePDFHeader(doc, 'Room Management Report', `Total Rooms: ${rooms.length}`);
    const headers = ['Room No', 'Block', 'Floor', 'Type', 'Restroom', 'Cap', 'Occ', 'Status'];
    const colX = [40, 90, 195, 260, 335, 400, 430, 470];
    doc.rect(40, y, 515, 20).fill('#1E293B');
    doc.fillColor('#FFF').fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: 80 }));
    y += 22;
    doc.font('Helvetica').fontSize(8);
    rooms.forEach((r, idx) => {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.rect(40, y, 515, 18).fill(idx % 2 === 0 ? '#F8FAFC' : '#FFF').fillColor('#1F2937');
      doc.text(r.roomNumber, colX[0], y + 4, { width: 45 });
      doc.text(r.hostelBlock.substring(0, 16), colX[1], y + 4, { width: 100 });
      doc.text(String(r.floor), colX[2], y + 4);
      doc.text(r.roomType, colX[3], y + 4, { width: 70 });
      doc.text(r.restroomType, colX[4], y + 4, { width: 60 });
      doc.text(String(r.capacity), colX[5], y + 4);
      doc.text(String(r.occupiedBeds), colX[6], y + 4);
      doc.text(r.status, colX[7], y + 4, { width: 80 });
      y += 19;
    });
    doc.end();
  },

  exportExcel: async (res, rooms) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Rooms');
    ws.columns = [
      { header: 'Room No', key: 'room', width: 10 }, { header: 'Hostel Block', key: 'block', width: 20 },
      { header: 'Floor', key: 'floor', width: 8 }, { header: 'Room Type', key: 'type', width: 14 },
      { header: 'Restroom', key: 'restroom', width: 12 }, { header: 'Capacity', key: 'cap', width: 10 },
      { header: 'Occupied', key: 'occ', width: 10 }, { header: 'Status', key: 'status', width: 14 },
      { header: 'Maintenance Note', key: 'maint', width: 25 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    rooms.forEach(r => ws.addRow({ room: r.roomNumber, block: r.hostelBlock, floor: r.floor, type: r.roomType, restroom: r.restroomType, cap: r.capacity, occ: r.occupiedBeds, status: r.status, maint: r.maintenanceNote || '' }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Room_Report_${moment().format('YYYYMMDD')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   RECENT ACTIVITIES
═══════════════════════════════════════════════════════════════════════════ */

const getRecentActivities = async (req, res) => {
  try {
    const [recentLeaves, recentComplaints, recentRoomReqs] = await Promise.allSettled([
      Leave.find().populate('student', 'name').sort({ createdAt: -1 }).limit(8).lean(),
      Complaint.find().populate('student', 'name').sort({ createdAt: -1 }).limit(8).lean(),
      require('../models/RoomRequest').find().populate('student', 'name').sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    const activities = [];

    if (recentLeaves.status === 'fulfilled') {
      recentLeaves.value.forEach(l => {
        activities.push({ type: 'leave', icon: 'calendar-check', color: '#3B82F6', title: `Leave: ${l.student?.name || 'N/A'}`, desc: `${l.leaveType} — ${l.status}`, time: l.createdAt });
      });
    }
    if (recentComplaints.status === 'fulfilled') {
      recentComplaints.value.forEach(c => {
        activities.push({ type: 'complaint', icon: 'triangle-exclamation', color: '#F97316', title: `Complaint: ${c.student?.name || 'N/A'}`, desc: `${c.category || 'General'} — ${c.status}`, time: c.createdAt });
      });
    }
    if (recentRoomReqs.status === 'fulfilled') {
      recentRoomReqs.value.forEach(r => {
        activities.push({ type: 'room', icon: 'door-open', color: '#22C55E', title: `Room Request: ${r.student?.name || 'N/A'}`, desc: `${r.requestType} — ${r.status}`, time: r.createdAt });
      });
    }

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    return res.status(200).json(activities.slice(0, 20));
  } catch (err) {
    console.error('Recent activities error:', err);
    return res.status(500).json({ message: 'Error fetching recent activities.' });
  }
};

/* ─── exports ───────────────────────────────────────────────────────────── */

module.exports = { LeaveReport, StudentReport, ComplaintReport, OccupancyReport, FacultyReport, RoomReport, getRecentActivities };
