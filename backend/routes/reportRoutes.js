/**
 * reportRoutes.js
 * API routes for CampusStay report generation — accessible to Admin, Faculty, Warden.
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  LeaveReport,
  StudentReport,
  ComplaintReport,
  OccupancyReport,
  FacultyReport,
  RoomReport,
  getRecentActivities,
} = require('../controllers/ReportController');

// All report routes require authentication; Admin + Faculty + Warden only
const reportAuth = [authenticate, authorize(['Admin', 'Faculty', 'Warden'])];

// Leave Report  — GET /api/reports/leave?from=&to=&status=&department=&format=json|pdf|excel
router.get('/leave', reportAuth, LeaveReport.getData);

// Student Report — GET /api/reports/student?department=&studentType=&allocated=true|false&format=
router.get('/student', reportAuth, StudentReport.getData);

// Complaint Report — GET /api/reports/complaint?from=&to=&status=&complaintType=&format=
router.get('/complaint', reportAuth, ComplaintReport.getData);

// Occupancy Report — GET /api/reports/occupancy?format=
router.get('/occupancy', reportAuth, OccupancyReport.getData);

// Faculty Report — GET /api/reports/faculty?format=
router.get('/faculty', [authenticate, authorize(['Admin'])], FacultyReport.getData);

// Room Report — GET /api/reports/room?hostelBlock=&status=&format=
router.get('/room', reportAuth, RoomReport.getData);

// Recent Activities feed — GET /api/reports/activities
router.get('/activities', reportAuth, getRecentActivities);

module.exports = router;
