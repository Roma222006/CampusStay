/**
 * StudentDashboard.jsx
 * Premium Student Dashboard — Blue theme with glassmorphism, animated cards,
 * welcome banner, stat cards, professional tables, and room allocation form.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { SkeletonCards } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { 
  getStudentDashboardApi, 
  getLeavesApi, 
  getComplaintsApi, 
  downloadStudentApprovedLeavesPDFApi,
  getRoomRequestsApi,
  requestRoomAllocationApi,
  getHostelBlocksApi,
  getNoticesApi
} from '../services/api';

const StudentDashboard = ({ onToggleMobile }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [roomRequests, setRoomRequests] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allocForm, setAllocForm] = useState({
    preferredBlock: '',
    preferredRoomType: 'Double',
    reason: '',
    preferences: {
      sleepingTime: '11 PM - 12 AM',
      wakeUpTime: '7 AM - 8 AM',
      studyEnvironment: 'Quiet',
      cleanliness: 'High',
      visitorPreference: 'Rarely',
      preferredLanguage: 'English',
      restroomPreference: 'No Preference',
      preferredFloor: 'No Preference'
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, leavesRes, complaintsRes, roomReqRes, blocksRes, noticesRes] = await Promise.allSettled([
        getStudentDashboardApi(),
        getLeavesApi(),
        getComplaintsApi(),
        getRoomRequestsApi(),
        getHostelBlocksApi(),
        getNoticesApi()
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data) setDashboardData(dashRes.value.data);
      if (leavesRes.status === 'fulfilled' && leavesRes.value.data) setLeaves(leavesRes.value.data.leaves || leavesRes.value.data || []);
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data) setComplaints(complaintsRes.value.data.complaints || complaintsRes.value.data || []);
      if (roomReqRes.status === 'fulfilled' && roomReqRes.value.data) setRoomRequests(roomReqRes.value.data);
      if (blocksRes.status === 'fulfilled' && blocksRes.value.data?.blocks?.length > 0) {
        setBlocks(blocksRes.value.data.blocks);
        setAllocForm(prev => ({ ...prev, preferredBlock: blocksRes.value.data.blocks[0].name }));
      }
      if (noticesRes.status === 'fulfilled' && noticesRes.value.data) setNotices(noticesRes.value.data);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const response = await downloadStudentApprovedLeavesPDFApi();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${user?.name || 'Student'}_Approved_Leaves_Report.pdf`;
      link.click();
    } catch (err) {
      console.error('Error downloading leaves report PDF:', err);
    }
  }, [user?.name]);

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestRoomAllocationApi(allocForm);
      fetchDashboardData();
    } catch (err) {
      console.error('Error submitting allocation:', err);
    }
  };

  const needsRoomPreference = user?.studentType === 'Hosteller' && 
    !user?.roomNumber && 
    !roomRequests.some(r => r.requestType === 'Allocation' && r.status === 'Pending');

  const hostelComplaints = complaints.filter(c => c.complaintType === 'Hostel');
  const campusComplaints = complaints.filter(c => c.complaintType === 'Campus');
  const activeComplaints = user?.studentType === 'Hosteller' 
    ? hostelComplaints.filter(c => c.status !== 'Rectified') 
    : campusComplaints.filter(c => c.status !== 'Rectified');
  const approvedLeaves = leaves.filter(l => l.status === 'Approved' || l.status === 'WardenApproved');
  const pendingLeaves = leaves.filter(l => l.status === 'Pending' || l.status === 'FacultyApproved');

  return (
    <Layout>
      <Header title={`${user?.studentType || 'Student'} Dashboard`} onToggleMobile={onToggleMobile} />

      {loading ? (
        <div style={{ padding: '24px 0' }}>
          <SkeletonCards count={3} height={100} />
          <div style={{ marginTop: 20 }}><SkeletonCards count={2} height={280} /></div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* ─── Welcome Banner ─── */}
          <div className="welcome-banner">
            <h2>Welcome back, {user?.name}! 👋</h2>
            <p>{user?.studentType === 'Hosteller' ? 'Hostel Resident' : 'Day Scholar'} · {user?.department || 'General'}</p>
            <div className="welcome-meta">
              <span className="welcome-meta-item"><i className="fa-solid fa-id-card" /> {user?.rollNo || 'N/A'}</span>
              {user?.studentType === 'Hosteller' && user?.hostelBlock && (
                <span className="welcome-meta-item"><i className="fa-solid fa-building" /> {user.hostelBlock}{user?.roomNumber ? ` — Room ${user.roomNumber}` : ''}</span>
              )}
              <span className="welcome-meta-item"><i className="fa-solid fa-calendar-check" /> {leaves.length} leaves this session</span>
            </div>
          </div>

          {/* ─── Notice Ticker ─── */}
          {notices.length > 0 && (
            <div className="notice-ticker">
              <span className="ticker-label"><i className="fa-solid fa-bullhorn" /> Notice</span>
              <span className="ticker-text">{notices[0]?.title}: {notices[0]?.message}</span>
            </div>
          )}

          {/* ─── Stats Grid ─── */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
                <i className="fa-solid fa-calendar-days" />
              </div>
              <div>
                <div className="stat-value">{leaves.length}</div>
                <div className="stat-label">Total Leaves</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                <i className="fa-solid fa-circle-check" />
              </div>
              <div>
                <div className="stat-value">{approvedLeaves.length}</div>
                <div className="stat-label">Approved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                <i className="fa-solid fa-clock" />
              </div>
              <div>
                <div className="stat-value">{pendingLeaves.length}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <div className="stat-value">{activeComplaints.length}</div>
                <div className="stat-label">Active Complaints</div>
              </div>
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="quick-actions">
            <Link to="/gatepass" className="quick-action-card" style={{ border: '1px solid rgba(2, 132, 199, 0.3)' }}>
              <i className="fa-solid fa-ticket" style={{ color: '#0284C7' }} />
              <span>Digital Gate Pass</span>
            </Link>
            <Link to="/leave" className="quick-action-card">
              <i className="fa-solid fa-plane-departure" />
              <span>Apply Leave</span>
            </Link>
            <Link to="/mess" className="quick-action-card" style={{ border: '1px solid rgba(234, 88, 12, 0.3)' }}>
              <i className="fa-solid fa-utensils" style={{ color: '#EA580C' }} />
              <span>Mess & Dining</span>
            </Link>
            {user?.studentType === 'Hosteller' && (
              <>
                <Link to="/hostel" className="quick-action-card">
                  <i className="fa-solid fa-bed" />
                  <span>My Room</span>
                </Link>
                <Link to="/roommate-radar" className="quick-action-card" style={{ border: '1px solid rgba(37, 99, 235, 0.3)' }}>
                  <i className="fa-solid fa-compass" style={{ color: '#2563EB' }} />
                  <span>Roommate Radar</span>
                </Link>
              </>
            )}
            <Link to="/emergency" className="quick-action-card" style={{ border: '1.5px solid #EF4444', background: 'rgba(239, 68, 68, 0.04)' }}>
              <i className="fa-solid fa-truck-medical" style={{ color: '#EF4444' }} />
              <span style={{ color: '#DC2626', fontWeight: '700' }}>Emergency SOS</span>
            </Link>
            <Link to="/complaints" className="quick-action-card">
              <i className="fa-solid fa-flag" />
              <span>File Complaint</span>
            </Link>
            <Link to="/lost-found" className="quick-action-card">
              <i className="fa-solid fa-box-open" style={{ color: '#6366F1' }} />
              <span>Lost & Found</span>
            </Link>
            <Link to="/polls" className="quick-action-card">
              <i className="fa-solid fa-square-poll-vertical" style={{ color: '#7C3AED' }} />
              <span>Student Voice</span>
            </Link>
            <button onClick={handleDownloadPDF} className="quick-action-card" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <i className="fa-solid fa-file-pdf" style={{ color: '#EF4444' }} />
              <span>Leaves PDF</span>
            </button>
            <Link to="/profile" className="quick-action-card">
              <i className="fa-solid fa-user-gear" />
              <span>My Profile</span>
            </Link>
          </div>

          {/* ─── Room Allocation Onboarding ─── */}
          {needsRoomPreference && (
            <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="section-card-header">
                <h3 className="section-card-title">
                  <i className="fa-solid fa-bed" style={{ color: 'var(--accent)' }} />
                  Room Allocation Preferences
                </h3>
                <span className="badge badge-warning">Action Required</span>
              </div>
              <div className="section-card-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                  Configure your room preferences so the Warden can run compatibility matching.
                </p>
                <form onSubmit={handleAllocationSubmit}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Preferred Block</label>
                      <select className="form-control" value={allocForm.preferredBlock} onChange={e => setAllocForm({...allocForm, preferredBlock: e.target.value})} required>
                        <option value="">Select Block...</option>
                        {blocks.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Room Type</label>
                      <select className="form-control" value={allocForm.preferredRoomType} onChange={e => setAllocForm({...allocForm, preferredRoomType: e.target.value})} required>
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Triple">Triple</option>
                        <option value="Four Sharing">Four Sharing</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid-3" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Sleep Schedule</label>
                      <select className="form-control" value={allocForm.preferences.sleepingTime} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, sleepingTime: e.target.value}})}>
                        <option>Before 10 PM</option><option>10 PM - 11 PM</option><option>11 PM - 12 AM</option><option>After 12 AM</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Cleanliness</label>
                      <select className="form-control" value={allocForm.preferences.cleanliness} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, cleanliness: e.target.value}})}>
                        <option value="High">High</option><option value="Moderate">Moderate</option><option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Language</label>
                      <select className="form-control" value={allocForm.preferences.preferredLanguage} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, preferredLanguage: e.target.value}})}>
                        <option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Special Needs / Notes</label>
                    <textarea className="form-control" rows="2" placeholder="Any special requirements..." value={allocForm.reason} onChange={e => setAllocForm({...allocForm, reason: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fa-solid fa-circle-check" /> Submit Room Preferences
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ─── Data Tables ─── */}
          <div className="two-col">
            {/* Leave Applications */}
            <div className="section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">
                  <i className="fa-solid fa-clock-rotate-left" />
                  Recent Leave Applications
                </h3>
                <Link to="/leave" className="btn btn-ghost btn-sm">View All →</Link>
              </div>
              <div className="cs-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="cs-table">
                  <thead><tr><th>Reason</th><th>Dates</th><th>Status</th></tr></thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr><td colSpan="3"><div className="cs-empty"><i className="fa-solid fa-calendar-xmark" /><p>No leaves submitted yet</p></div></td></tr>
                    ) : (
                      leaves.slice(0, 5).map(l => (
                        <tr key={l._id}>
                          <td><strong>{l.reason}</strong></td>
                          <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            {new Date(l.fromDate || l.startDate).toLocaleDateString()} — {new Date(l.toDate || l.endDate).toLocaleDateString()}
                          </td>
                          <td><StatusBadge status={l.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complaints */}
            <div className="section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">
                  <i className="fa-solid fa-screwdriver-wrench" />
                  {user?.studentType === 'Hosteller' ? 'Hostel Maintenance' : 'Campus Tickets'}
                </h3>
                <Link to="/complaints" className="btn btn-ghost btn-sm">File New →</Link>
              </div>
              <div className="cs-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="cs-table">
                  <thead><tr><th>Category</th><th>Title</th><th>Status</th></tr></thead>
                  <tbody>
                    {(user?.studentType === 'Hosteller' ? hostelComplaints : campusComplaints).length === 0 ? (
                      <tr><td colSpan="3"><div className="cs-empty"><i className="fa-solid fa-face-smile" /><p>No complaints filed</p></div></td></tr>
                    ) : (
                      (user?.studentType === 'Hosteller' ? hostelComplaints : campusComplaints).slice(0, 5).map(c => (
                        <tr key={c._id}>
                          <td><strong>{c.category}</strong></td>
                          <td>{c.title}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <StatusBadge status={c.status} />
                              {c.isEscalated && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Escalated</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;
