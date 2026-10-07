import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import NotificationBell from '../components/NotificationBell';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  getFacultyDashboardApi,
  getLeavesApi,
  updateLeaveStatusApi,
  getStudentHistoryApi,
  getNoticesApi,
  getAllStudentsApi,
  exportLeavesPDFApi,
  exportLeavesExcelApi,
  downloadBlob
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    studentsOnLeave: 0
  });

  const [leaves, setLeaves] = useState([]);
  const [notices, setNotices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves', 'students', 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Review Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approved Faculty', 'Rejected Faculty', or 'Clarification Required'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Student Leave History
  const [studentHistory, setStudentHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, leavesRes, noticesRes, studentsRes] = await Promise.allSettled([
        getFacultyDashboardApi(),
        getLeavesApi(),
        getNoticesApi(),
        getAllStudentsApi({ department: user?.department })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
        setStats(statsRes.value.data.stats);
      }

      if (leavesRes.status === 'fulfilled' && leavesRes.value.data) {
        setLeaves(leavesRes.value.data.leaves || leavesRes.value.data || []);
      }

      if (noticesRes.status === 'fulfilled' && noticesRes.value.data) {
        setNotices(noticesRes.value.data);
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
        setStudents(studentsRes.value.data.students || studentsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const openActionModal = async (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
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

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      await updateLeaveStatusApi(selectedLeave._id, {
        status: actionType,
        remarks: remarks || `${actionType} by Faculty Advisor`
      });
      setIsModalOpen(false);
      fetchDashboardData();
      showToast(`Leave request updated to: ${actionType}`, 'success');
    } catch (err) {
      console.error('Error updating leave status:', err);
      showToast(err.response?.data?.message || 'Error updating leave request', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      showToast('Preparing PDF…', 'info');
      const res = await exportLeavesPDFApi();
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), 'Faculty_Leaves_Audit.pdf');
      showToast('PDF downloaded!', 'success');
    } catch (err) {
      showToast('Error exporting PDF', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      showToast('Preparing Excel…', 'info');
      const res = await exportLeavesExcelApi();
      downloadBlob(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Faculty_Leaves_Audit.xlsx');
      showToast('Excel downloaded!', 'success');
    } catch (err) {
      showToast('Error exporting Excel', 'error');
    }
  };

  const filteredLeaves = leaves.filter(l => 
    l.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.student?.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.registerNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Compute stats for analytics graphs
  const countByStatus = { Approved: 0, Pending: 0, Rejected: 0 };
  const countByType = { Casual: 0, Medical: 0, Emergency: 0, 'Home Visit': 0, 'On Duty': 0 };
  
  leaves.forEach(l => {
    if (l.status.includes('Approved')) countByStatus.Approved++;
    else if (l.status.includes('Rejected')) countByStatus.Rejected++;
    else countByStatus.Pending++;

    if (countByType[l.leaveType] !== undefined) {
      countByType[l.leaveType]++;
    }
  });

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="page-title" style={{ fontSize: '1.15rem' }}>
            <i className="fa-solid fa-chalkboard-teacher" style={{ color: 'var(--primary)', marginRight: 10 }} />
            Faculty Advisor Dashboard
          </div>
          <div className="page-subtitle">{user?.name} — {user?.department}</div>
        </div>
        <div className="topbar-right">
          <NotificationBell />
          <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={handleExportExcel}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="stats-row">
        <div className="glass-card stat-widget faculty-card-accent">
          <div className="stat-info">
            <span className="stat-label">Assigned Students</span>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper primary" style={{ backgroundColor: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary-color)' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
        </div>

        <div className="glass-card stat-widget faculty-card-accent">
          <div className="stat-info">
            <span className="stat-label">Pending Leaves</span>
            <div className="stat-value">{stats.pendingLeaves}</div>
          </div>
          <div className="stat-icon-wrapper accent" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
        </div>

        <div className="glass-card stat-widget faculty-card-accent">
          <div className="stat-info">
            <span className="stat-label">Total Approved</span>
            <div className="stat-value">{stats.approvedLeaves}</div>
          </div>
          <div className="stat-icon-wrapper secondary" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div className="glass-card stat-widget faculty-card-accent">
          <div className="stat-info">
            <span className="stat-label">Total Rejected</span>
            <div className="stat-value">{stats.rejectedLeaves}</div>
          </div>
          <div className="stat-icon-wrapper danger" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
        </div>
      </div>

      {/* Official Notice Board */}
      {notices.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', backgroundColor: 'rgba(16, 185, 129, 0.03)', borderLeft: '5px solid var(--accent-color)' }}>
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

      {/* Main Content Area */}
      <div className="glass-card" style={{ padding: '0', marginBottom: '28px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('leaves')} 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-calendar-check"></i> Pending Leaves ({stats.pendingLeaves})
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-users"></i> Assigned Students Directory ({students.length})
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-chart-pie"></i> Analytics & Charts
          </button>
        </div>

        {/* Tab 1: Leaves Approvals */}
        {activeTab === 'leaves' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                Student Leave Approval Queue
              </h3>
              <input
                type="text"
                className="form-control"
                placeholder="Search by student or reason..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '260px' }}
              />
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Register Number</th>
                    <th>Priority</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading leaves queue...</td></tr>
                  ) : filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No pending leave requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((l) => (
                      <tr key={l._id} style={{ borderLeft: l.priority === 'High/Emergency' ? '4px solid var(--danger-color)' : 'none' }}>
                        <td style={{ fontWeight: 600 }}>{l.student?.name}</td>
                        <td>{l.student?.registerNumber || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${l.priority === 'High/Emergency' ? 'rejected' : l.priority === 'Medium' ? 'pending' : 'approved'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {l.priority || 'Medium'}
                          </span>
                        </td>
                        <td>{l.leaveType}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {new Date(l.fromDate || l.startDate).toLocaleDateString()} - {new Date(l.toDate || l.endDate).toLocaleDateString()}
                        </td>
                        <td>{l.reason}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openActionModal(l, 'Approved Faculty')}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => openActionModal(l, 'Rejected Faculty')}>
                              Reject
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => openActionModal(l, 'Clarification Required')}>
                              Clarify
                            </button>
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

        {/* Tab 2: Assigned Students */}
        {activeTab === 'students' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                My Department Registry ({user?.department})
              </h3>
              <input
                type="text"
                className="form-control"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{ width: '260px' }}
              />
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Register Number</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Block / Room</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading registry...</td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No students assigned under your department registry.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.registerNumber || s.rollNo}</td>
                        <td>{s.email}</td>
                        <td>{s.phone || 'N/A'}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: s.studentType === 'Hosteller' ? 'rgba(30, 58, 138, 0.08)' : 'rgba(15, 118, 110, 0.08)' }}>
                            {s.studentType || 'N/A'}
                          </span>
                        </td>
                        <td>{s.hostelBlock && s.roomNumber ? `${s.hostelBlock} - ${s.roomNumber}` : 'Dayscholar'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Analytics & Charts */}
        {activeTab === 'analytics' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-color)', marginBottom: '24px', fontWeight: 600 }}>
              Leave Analytics Dashboard
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              {/* Approval Ratio Graph (Pie Chart represented beautifully in clean custom vector SVGs) */}
              <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
                  Leave Request Status Ratio
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <svg width="180" height="180" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                    {/* SVG Circular charts illustrating Approved, Pending, Rejected ratios */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--accent-color)" strokeWidth="12" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (stats.approvedLeaves / (leaves.length || 1)))} 
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', marginTop: '16px' }}>
                  <div><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'var(--accent-color)', marginRight: '6px' }}></span>Approved: {stats.approvedLeaves}</div>
                  <div><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#F59E0B', marginRight: '6px' }}></span>Pending: {stats.pendingLeaves}</div>
                  <div><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#DC2626', marginRight: '6px' }}></span>Rejected: {stats.rejectedLeaves}</div>
                </div>
              </div>

              {/* Leave Types Graph */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '16px', fontWeight: 600 }}>
                  Requested Leave Types
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(countByType).map(([type, count]) => {
                    const pct = leaves.length ? Math.round((count / leaves.length) * 100) : 0;
                    return (
                      <div key={type} style={{ fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>{type}</span>
                          <strong>{count} ({pct}%)</strong>
                        </div>
                        <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
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

      {/* Review Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Faculty Decision: ${actionType}`}
      >
        <form onSubmit={handleStatusSubmit}>
          <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
            Submit status change: <strong>{actionType}</strong> for student <strong>{selectedLeave?.student?.name}</strong>.
          </p>

          {/* Student Leave History Block */}
          {historyLoading ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading student leave history...</p>
          ) : studentHistory && (
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
              <h5 style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '8px', fontWeight: 600 }}>
                <i className="fa-solid fa-clock-history"></i> Leave History Monitoring
              </h5>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                Total Approved Leaves: <strong style={{ color: studentHistory.totalLeavesAvail > 3 ? 'var(--danger-color)' : 'var(--success-color)' }}>{studentHistory.totalLeavesAvail}</strong>
              </div>
              
              {studentHistory.leaves && studentHistory.leaves.length > 0 ? (
                <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {studentHistory.leaves.map((lh, i) => (
                    <div key={lh._id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                      #{i+1} - {lh.leaveType} ({lh.durationDays} Days, {new Date(lh.fromDate || lh.startDate).toLocaleDateString()}) - <strong>{lh.status}</strong> - "{lh.reason}"
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>No previous leave records.</p>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Advisor Remarks / Clarification Comments</label>
            <textarea
              className="form-control"
              rows="3"
              required
              placeholder="Provide remarks or details for the student or warden..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--primary-color)' }}>
              Submit Review
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default FacultyDashboard;
