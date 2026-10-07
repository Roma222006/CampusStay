/**
 * api.js
 * Centralized Axios API client for CampusStay.
 * JWT token attached automatically via request interceptor.
 */

import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginApi              = (data)        => API.post('/auth/login', data);
export const registerApi           = (data)        => API.post('/auth/register', data);
export const getProfileApi         = ()            => API.get('/auth/profile');
export const updateProfileApi      = (data)        => API.put('/auth/profile', data);
export const uploadAvatarApi       = (formData)    => API.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePasswordApi     = (data)        => API.put('/auth/change-password', data);

// ─── Students ────────────────────────────────────────────────────────────────
export const getStudentDashboardApi = ()           => API.get('/students/dashboard');
export const getAllStudentsApi       = (params)    => API.get('/students', { params });

// ─── Faculty ─────────────────────────────────────────────────────────────────
export const getFacultyDashboardApi = ()           => API.get('/faculties/dashboard/stats');
export const getFacultyLeavesApi    = ()           => API.get('/faculties/leaves');

// ─── Warden ──────────────────────────────────────────────────────────────────
export const getWardenDashboardApi  = ()           => API.get('/wardens/dashboard/stats');
export const getWardenLeavesApi     = ()           => API.get('/wardens/leaves');
export const getWardenComplaintsApi = ()           => API.get('/wardens/complaints');

// ─── Admin ───────────────────────────────────────────────────────────────────
export const getAdminStatsApi    = ()              => API.get('/admin/stats');
export const getAdminUsersApi    = (role)          => API.get('/admin/users', { params: role ? { role } : {} });
export const createStaffUserApi  = (data)          => API.post('/admin/create-staff', data);
export const deleteUserApi       = (userId)        => API.delete(`/admin/users/${userId}`);

// ─── Leaves ──────────────────────────────────────────────────────────────────
export const getLeavesApi                      = (params)     => API.get('/leaves', { params });
export const applyLeaveApi                     = (data)       => API.post('/leaves', data);
export const updateLeaveStatusApi              = (id, data)   => API.put(`/leaves/${id}/status`, data);
export const checkoutStudentApi                = (id)         => API.put(`/leaves/${id}/checkout`);
export const checkinStudentApi                 = (id)         => API.put(`/leaves/${id}/checkin`);
export const getStudentHistoryApi              = (studentId)  => API.get(`/leaves/student-history/${studentId}`);
export const downloadStudentApprovedLeavesPDFApi = ()         => API.get('/leaves/student-approved/pdf', { responseType: 'blob' });
export const exportLeavesPDFApi                = ()           => API.get('/leaves/export/pdf',   { responseType: 'blob' });
export const exportLeavesExcelApi              = ()           => API.get('/leaves/export/excel', { responseType: 'blob' });

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const getRoomsApi                = (params)           => API.get('/rooms', { params });
export const getHostelBlocksApi         = ()                 => API.get('/rooms/blocks');
export const createHostelBlockApi       = (data)             => API.post('/rooms/blocks', data);
export const deleteHostelBlockApi       = (id)               => API.delete(`/rooms/blocks/${id}`);
export const createRoomApi              = (data)             => API.post('/rooms', data);
export const updateRoomApi              = (id, data)         => API.put(`/rooms/${id}/update`, data);
export const updateRoomStatusApi        = (roomId, data)     => API.put(`/rooms/${roomId}/status`, data);
export const deleteRoomApi              = (id)               => API.delete(`/rooms/${id}`);
export const getDashboardMetricsApi     = ()                 => API.get('/rooms/dashboard/metrics');
export const getBlockStatsApi           = ()                 => API.get('/rooms/block-stats');
export const allocateStudentApi         = (data)             => API.post('/rooms/allocate', data);
export const autoAllocateApi            = ()                 => API.post('/rooms/auto-allocate');
export const transferStudentApi         = (data)             => API.post('/rooms/transfer', data);
export const swapStudentsApi            = (data)             => API.post('/rooms/swap', data);
export const deallocateStudentApi       = (data)             => API.post('/rooms/deallocate', data);
export const requestRoomAllocationApi   = (data)             => API.post('/rooms/allocation-request', data);
export const selectRoomApi              = (roomId)           => API.post('/rooms/allocation-request', { roomId });
export const requestRoomChangeApi       = (data)             => API.post('/rooms/change-request', data);
export const requestRoomSwapApi         = (data)             => API.post('/rooms/swap-request', data);
export const getRoomRequestsApi         = ()                 => API.get('/rooms/requests');
export const reviewRoomRequestApi       = (id, data)         => API.put(`/rooms/requests/${id}/review`, data);

// ─── Complaints ──────────────────────────────────────────────────────────────
export const getComplaintsApi        = (params) => API.get('/complaints', { params });
export const fileComplaintApi        = (data)   => API.post('/complaints', data);
export const updateComplaintStatusApi = (id, data) => API.put(`/complaints/${id}/status`, data);
export const escalateComplaintApi    = (id, data) => API.put(`/complaints/${id}/escalate`, data);

// ─── Notifications ───────────────────────────────────────────────────────────
export const getNotificationsApi       = ()   => API.get('/notifications');
export const getUnreadCountApi         = ()   => API.get('/notifications/unread-count');
export const markNotificationReadApi   = (id) => API.put(`/notifications/${id}/read`);
export const markAllReadApi            = ()   => API.put('/notifications/read-all');
export const clearAllNotificationsApi  = ()   => API.delete('/notifications/clear-all');
export const createNoticeApi           = (data) => API.post('/notifications/notices', data);
export const getNoticesApi             = ()   => API.get('/notifications/notices');

// ─── Reports ─────────────────────────────────────────────────────────────────
export const getLeaveReportApi      = (params) => API.get('/reports/leave',     { params });
export const getStudentReportApi    = (params) => API.get('/reports/student',   { params });
export const getComplaintReportApi  = (params) => API.get('/reports/complaint', { params });
export const getOccupancyReportApi  = (params) => API.get('/reports/occupancy', { params });
export const getFacultyReportApi    = (params) => API.get('/reports/faculty',   { params });
export const getRoomReportApi       = (params) => API.get('/reports/room',      { params });
export const getRecentActivitiesApi = ()       => API.get('/reports/activities');

// Report exports (PDF/Excel) — pass format=pdf or format=excel in query params
export const exportReportApi = (type, format, params = {}) =>
  API.get(`/reports/${type}`, { params: { ...params, format }, responseType: 'blob' });

// Helper: download blob as file
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Innovative Features APIs ────────────────────────────────────────────────
// Gate Pass & Scanner Terminal
export const requestGatePassApi        = (data)   => API.post('/gatepass/request', data);
export const getMyGatePassesApi        = ()       => API.get('/gatepass/my-passes');
export const getAllGatePassesApi       = (params) => API.get('/gatepass/all', { params });
export const scanOrVerifyGatePassApi   = (data)   => API.post('/gatepass/scan-verify', data);
export const getGateAnalyticsApi       = ()       => API.get('/gatepass/analytics');

// Smart Mess & Food Waste Reduction
export const getWeeklyMenuApi          = (params) => API.get('/mess/menu', { params });
export const getMessAnalyticsApi       = ()       => API.get('/mess/analytics');
export const rateMealApi               = (data)   => API.post('/mess/rate', data);
export const toggleSkipMealApi         = (data)   => API.post('/mess/toggle-skip', data);
export const updateMealApi             = (data)   => API.put('/mess/update-meal', data);

// Lost & Found Community Hub
export const getLostFoundItemsApi      = (params)   => API.get('/lostfound', { params });
export const reportLostFoundItemApi    = (formData) => API.post('/lostfound/report', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const claimLostFoundItemApi     = (id, data) => API.put(`/lostfound/${id}/claim`, data);
export const resolveLostFoundItemApi   = (id, data) => API.put(`/lostfound/${id}/resolve`, data);

// Emergency SOS & Rapid Dispatch
export const triggerSOSApi             = (data)     => API.post('/emergency/sos', data);
export const getEmergencyAlertsApi     = (params)   => API.get('/emergency/alerts', { params });
export const updateEmergencyStatusApi  = (id, data) => API.put(`/emergency/${id}/status`, data);

// Campus Polls & Student Voice
export const getCampusPollsApi         = ()         => API.get('/polls');
export const castVoteApi               = (pollId, data) => API.post(`/polls/vote/${pollId}`, data);
export const createCampusPollApi       = (data)     => API.post('/polls/create', data);
export const closeCampusPollApi        = (pollId)   => API.put(`/polls/close/${pollId}`);

// AI Roommate Radar & Compatibility Engine
export const getRoommateRadarApi       = ()         => API.get('/rooms/roommate-radar');

export default API;
