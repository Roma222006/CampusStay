import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import NotificationBell from '../components/NotificationBell';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  getWardenDashboardApi,
  getLeavesApi,
  getComplaintsApi,
  updateLeaveStatusApi,
  updateComplaintStatusApi,
  getRoomRequestsApi,
  reviewRoomRequestApi,
  getStudentHistoryApi,
  getNoticesApi,
  checkoutStudentApi,
  checkinStudentApi
} from '../services/api';

const WardenDashboard = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupancyRate: 0,
    pendingLeaves: 0,
    pendingComplaints: 0,
    maintenanceComplaints: 0
  });

  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [roomRequests, setRoomRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves', 'complaints', 'allocations', 'gatelog', 'analytics'

  // Dialog Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(''); // 'leave', 'complaint', or 'allocation'
  const [statusAction, setStatusAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Student Leave History
  const [studentHistory, setStudentHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchWardenData = async () => {
    try {
      const [statsRes, reqsRes, noticesRes, leavesRes, complaintsRes] = await Promise.allSettled([
        getWardenDashboardApi(),
        getRoomRequestsApi(),
        getNoticesApi(),
        getLeavesApi(),
        getComplaintsApi()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
        setStats(statsRes.value.data.stats);
      }
      if (reqsRes.status === 'fulfilled' && reqsRes.value.data) {
        setRoomRequests(reqsRes.value.data);
      }
      if (noticesRes.status === 'fulfilled' && noticesRes.value.data) {
        setNotices(noticesRes.value.data);
      }
      if (leavesRes.status === 'fulfilled' && leavesRes.value.data) {
        setLeaves(leavesRes.value.data.leaves || leavesRes.value.data || []);
      }
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data) {
        setComplaints(complaintsRes.value.data.complaints || complaintsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error loading warden dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData();
  }, []);

  const openLeaveModal = async (leave, action) => {
    setSelectedItem(leave);
    setModalType('leave');
    setStatusAction(action);
    setRemarks('');
    setStudentHistory(null);
    setIsModalOpen(true);
    setHistoryLoading(true);

    try {
      const res = await getStudentHistoryApi(leave.student?._id);
      if (res.data) {
        setStudentHistory(res.data);
      }
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openComplaintModal = (complaint, action) => {
    setSelectedItem(complaint);
    setModalType('complaint');
    setStatusAction(action);
    setRemarks('');
    setIsModalOpen(true);
  };

  const openAllocationModal = (request, action) => {
    setSelectedItem(request);
    setModalType('allocation');
    setStatusAction(action);
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      if (modalType === 'leave') {
        await updateLeaveStatusApi(selectedItem._id, {
          status: statusAction === 'Approved' ? 'Approved Warden' : 'Rejected Warden',
          remarks: remarks || `Warden ${statusAction}`
        });
      } else if (modalType === 'complaint') {
        await updateComplaintStatusApi(selectedItem._id, {
          status: statusAction === 'Resolved' ? 'Rectified' : 'Ongoing',
          remarks: remarks || `Warden status update: ${statusAction}`
        });
      } else if (modalType === 'allocation') {
        await reviewRoomRequestApi(selectedItem._id, {
          status: statusAction,
          remarks: remarks || `Warden allocation: ${statusAction}`
        });
      }
      setIsModalOpen(false);
      fetchWardenData();
      showToast('Status updated successfully!', 'success');
    } catch (err) {
      console.error('Error submitting update:', err);
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    }
  };

  const handleCheckout = async (leaveId) => {
    try {
      await checkoutStudentApi(leaveId);
      showToast('Student checked out successfully!', 'success');
      fetchWardenData();
    } catch (err) {
      showToast('Error updating checkout transit time.', 'error');
    }
  };

  const handleCheckin = async (leaveId) => {
    try {
      await checkinStudentApi(leaveId);
      showToast('Student checked in successfully!', 'success');
      fetchWardenData();
    } catch (err) {
      showToast('Error updating checkin transit time.', 'error');
    }
  };

  // Lists processing
  const pendingLeaves = leaves.filter(l => l.status === 'Approved Faculty');
  const activeComplaints = complaints.filter(c => c.status !== 'Rectified');
  const transitLeaves = leaves.filter(l => l.status === 'Approved Warden');

  // Category counts for complaints chart
  const complaintCats = { Electrical: 0, Plumbing: 0, Internet: 0, Cleanliness: 0, Other: 0 };
  complaints.forEach(c => {
    if (complaintCats[c.category] !== undefined) {
      complaintCats[c.category]++;
    } else {
      complaintCats.Other++;
    }
  });

  return (
    <Layout title="Hostel Warden Dashboard">
      {/* Orange Theme Accent Style overrides */}
      <style>{`
        :root {
          --primary-color: #EA580C !important; /* Orange primary Override */
          --secondary-color: #F97316 !important; /* Orange secondary Override */
          --accent-color: #D97706 !important;
        }
        .warden-card-accent {
          border-top: 4px solid var(--primary-color) !important;
        }
      `}</style>

      {/* Stats row */}
      <div className="stats-row">
        <div className="glass-card stat-widget warden-card-accent">
          <div className="stat-info">
            <span className="stat-label">Pending Leaves</span>
            <div className="stat-value">{stats.pendingLeaves}</div>
          </div>
          <div className="stat-icon-wrapper primary" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: 'var(--primary-color)' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
        </div>

        <div className="glass-card stat-widget warden-card-accent">
          <div className="stat-info">
            <span className="stat-label">Active Complaints</span>
            <div className="stat-value">{stats.pendingComplaints}</div>
          </div>
          <div className="stat-icon-wrapper danger" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
        </div>

        <div className="glass-card stat-widget warden-card-accent">
          <div className="stat-info">
            <span className="stat-label">Occupancy Rate</span>
            <div className="stat-value">{stats.occupancyRate}%</div>
          </div>
          <div className="stat-icon-wrapper secondary" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--secondary-color)' }}>
            <i className="fa-solid fa-hotel"></i>
          </div>
        </div>
      </div>

      {/* Quick Access Campus Hubs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Link to="/gatepass" className="quick-action-card" style={{ padding: '14px', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
          <i className="fa-solid fa-qrcode" style={{ color: '#0284C7', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Gate Terminal</span>
        </Link>
        <Link to="/hostel-map" className="quick-action-card" style={{ padding: '14px', border: '1px solid rgba(15, 118, 110, 0.3)' }}>
          <i className="fa-solid fa-layer-group" style={{ color: '#0F766E', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Floor Map 2D</span>
        </Link>
        <Link to="/mess" className="quick-action-card" style={{ padding: '14px', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
          <i className="fa-solid fa-utensils" style={{ color: '#EA580C', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Mess Analytics</span>
        </Link>
        <Link to="/emergency" className="quick-action-card" style={{ padding: '14px', border: '1.5px solid #EF4444', background: 'rgba(239, 68, 68, 0.04)' }}>
          <i className="fa-solid fa-truck-medical" style={{ color: '#EF4444', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#DC2626' }}>SOS Beacons</span>
        </Link>
        <Link to="/lost-found" className="quick-action-card" style={{ padding: '14px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <i className="fa-solid fa-box-open" style={{ color: '#6366F1', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Lost & Found</span>
        </Link>
        <Link to="/polls" className="quick-action-card" style={{ padding: '14px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
          <i className="fa-solid fa-square-poll-vertical" style={{ color: '#7C3AED', fontSize: '1.3rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Campus Polls</span>
        </Link>
      </div>

      {/* Official Notice Board */}
      {notices.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', backgroundColor: 'rgba(234, 88, 12, 0.03)', borderLeft: '5px solid var(--primary-color)' }}>
          <h4 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className="fa-solid fa-bullhorn"></i> Official Announcements Board
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {notices.map(n => (
              <div key={n._id} style={{ padding: '12px 16px', background: 'white', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px' }}>
                  <span>{n.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation Card */}
      <div className="glass-card" style={{ padding: '0', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('leaves')} className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-outline'}`}>
            <i className="fa-solid fa-clipboard-check"></i> Leaves Pending ({pendingLeaves.length})
          </button>
          <button onClick={() => setActiveTab('complaints')} className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-outline'}`}>
            <i className="fa-solid fa-wrench"></i> Complaints Resolver ({activeComplaints.length})
          </button>
          <button onClick={() => setActiveTab('allocations')} className={`btn ${activeTab === 'allocations' ? 'btn-primary' : 'btn-outline'}`}>
            <i className="fa-solid fa-door-open"></i> Room Configuration ({roomRequests.filter(r => r.status === 'Pending').length})
          </button>
          <button onClick={() => setActiveTab('gatelog')} className={`btn ${activeTab === 'gatelog' ? 'btn-primary' : 'btn-outline'}`}>
            <i className="fa-solid fa-right-to-bracket"></i> Check-In / Check-Out Log
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}>
            <i className="fa-solid fa-chart-line"></i> Analytics & Occupancy
          </button>
        </div>

        {/* Tab 1: Leaves approvals */}
        {activeTab === 'leaves' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
              Warden Final Approval Queue
            </h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Priority</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Faculty Reviewer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leaves pending Warden approval.</td></tr>
                  ) : (
                    pendingLeaves.map(l => (
                      <tr key={l._id}>
                        <td style={{ fontWeight: 600 }}>{l.student?.name}</td>
                        <td>{l.student?.registerNumber || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${l.priority === 'High/Emergency' ? 'rejected' : l.priority === 'Medium' ? 'pending' : 'approved'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {l.priority || 'Medium'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {new Date(l.fromDate || l.startDate).toLocaleDateString()} - {new Date(l.toDate || l.endDate).toLocaleDateString()}
                        </td>
                        <td>{l.reason}</td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>
                            <strong>{l.approvedByFaculty?.name || 'Advisor'}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.facultyRemarks || 'Approved'}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openLeaveModal(l, 'Approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => openLeaveModal(l, 'Rejected')}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Complaints Resolver */}
        {activeTab === 'complaints' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
              Block Maintenance & Complaints Resolver
            </h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeComplaints.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active complaints registered.</td></tr>
                  ) : (
                    activeComplaints.map(c => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>{c.category}</td>
                        <td>{c.student?.name}</td>
                        <td>{c.roomNumber || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <StatusBadge status={c.status} />
                            {c.isEscalated && <span className="status-badge rejected" style={{ fontSize: '0.65rem' }}>Escalated to Admin</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => openComplaintModal(c, 'Ongoing')}>Mark Ongoing</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openComplaintModal(c, 'Resolved')}>Mark Resolved</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Room Configuration Allocations/Swaps */}
        {activeTab === 'allocations' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
              Room Swap & Allocation Requests
            </h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Request Type</th>
                    <th>Target Room / Block</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomRequests.filter(r => r.status === 'Pending').length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending room swap/allocation requests.</td></tr>
                  ) : (
                    roomRequests.filter(r => r.status === 'Pending').map(r => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 600 }}>{r.student?.name}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: r.requestType === 'Swap' ? 'rgba(234, 88, 12, 0.1)' : 'rgba(30, 58, 138, 0.1)' }}>
                            {r.requestType || 'Allocation'}
                          </span>
                        </td>
                        <td>
                          {r.requestType === 'Swap' ? `Room ${r.targetRoomNumber}` : `${r.preferredBlock} (Type: ${r.preferredRoomType})`}
                        </td>
                        <td>{r.reason}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openAllocationModal(r, 'Approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => openAllocationModal(r, 'Rejected')}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Transit Check-In / Check-Out Log */}
        {activeTab === 'gatelog' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
              Student In/Out Gate Log & Transit Registry
            </h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Leave Reason</th>
                    <th>Leave Dates</th>
                    <th>Check Out Time</th>
                    <th>Check In Time</th>
                    <th>Gate Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transitLeaves.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student leaves approved for transit.</td></tr>
                  ) : (
                    transitLeaves.map(l => (
                      <tr key={l._id}>
                        <td style={{ fontWeight: 600 }}>{l.student?.name}</td>
                        <td>{l.reason}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {new Date(l.fromDate || l.startDate).toLocaleDateString()} - {new Date(l.toDate || l.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {l.checkOutTime ? new Date(l.checkOutTime).toLocaleString() : 'On Campus'}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {l.checkInTime ? new Date(l.checkInTime).toLocaleString() : (l.checkOutTime ? 'Absent (Outside)' : 'N/A')}
                        </td>
                        <td>
                          {!l.checkOutTime ? (
                            <button className="btn btn-primary btn-sm" onClick={() => handleCheckout(l._id)}>
                              <i className="fa-solid fa-right-from-bracket"></i> Record Check-Out
                            </button>
                          ) : !l.checkInTime ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCheckin(l._id)}>
                              <i className="fa-solid fa-right-to-bracket"></i> Record Check-In
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success-color)', fontSize: '0.82rem', fontWeight: 600 }}>
                              <i className="fa-solid fa-circle-check"></i> Transit Complete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Analytics & Occupancy */}
        {activeTab === 'analytics' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-color)', marginBottom: '24px', fontWeight: 600 }}>
              Warden Hostel Analytics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              {/* Occupancy Donut Graph */}
              <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
                  Hostel Occupancy Percentage
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <svg width="180" height="180" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--primary-color)" strokeWidth="12" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (stats.occupancyRate / 100))} 
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--primary-color)">
                      {stats.occupancyRate}%
                    </text>
                  </svg>
                </div>
              </div>

              {/* Maintenance categories */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
                  Active Complaints by Categories
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(complaintCats).map(([cat, count]) => {
                    const total = complaints.length || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={cat} style={{ fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>{cat}</span>
                          <strong>{count} ({pct}%)</strong>
                        </div>
                        <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--secondary-color)' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Dialog Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Warden Review: Set Status`}
      >
        <form onSubmit={handleModalSubmit}>
          <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
            Set decision: <strong>{statusAction}</strong> for this request.
          </p>

          {/* Past leaves history monitor (Leaves only) */}
          {modalType === 'leave' && (
            historyLoading ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading student leave history...</p>
            ) : studentHistory && (
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '8px', fontWeight: 600 }}>
                  <i className="fa-solid fa-clock-history"></i> Student Leave History Monitoring
                </h5>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Total Approved Leaves: <strong>{studentHistory.totalLeavesAvail}</strong>
                </div>
                
                {studentHistory.leaves && studentHistory.leaves.length > 0 ? (
                  <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {studentHistory.leaves.map((lh, i) => (
                      <div key={lh._id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                        #{i+1} - {lh.leaveType} ({lh.durationDays} Days) - <strong>{lh.status}</strong> - "{lh.reason}"
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>No previous leave records.</p>
                )}
              </div>
            )
          )}

          <div className="form-group">
            <label>Warden Review Notes / Remarks</label>
            <textarea
              className="form-control"
              rows="3"
              required
              placeholder="Provide remarks or reason..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Status Update
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default WardenDashboard;
