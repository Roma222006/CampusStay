import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { 
  getAdminStatsApi, 
  getAdminUsersApi, 
  createStaffUserApi, 
  deleteUserApi,
  createHostelBlockApi,
  createRoomApi,
  getHostelBlocksApi,
  getComplaintsApi,
  updateComplaintStatusApi,
  createNoticeApi,
  getNoticesApi
} from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculties: 0,
    totalWardens: 0,
    totalRooms: 0,
    totalBlocks: 0
  });

  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [allNotices, setAllNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'complaints', or 'notices'
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Faculty',
    department: 'Computer Science',
    phone: ''
  });

  const [blockForm, setBlockForm] = useState({
    name: '',
    totalFloors: 3,
    description: ''
  });

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    hostelBlock: '',
    floor: 0,
    roomType: 'Double',
    restroomType: 'Attached',
    capacity: 2
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    targetRole: 'Student'
  });

  // Complaint Update State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintStatus, setComplaintStatus] = useState('Ongoing');
  const [complaintRemarks, setComplaintRemarks] = useState('');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, blocksRes, compRes, noticeRes] = await Promise.allSettled([
        getAdminStatsApi(),
        getAdminUsersApi(),
        getHostelBlocksApi(),
        getComplaintsApi(),
        getNoticesApi()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        setUsers(usersRes.value.data.users || usersRes.value.data || []);
      }
      if (blocksRes.status === 'fulfilled' && blocksRes.value.data) {
        setBlocks(blocksRes.value.data.blocks || blocksRes.value.data || []);
      }
      if (compRes.status === 'fulfilled' && compRes.value.data) {
        setComplaints(compRes.value.data.complaints || compRes.value.data || []);
      }
      if (noticeRes.status === 'fulfilled' && noticeRes.value.data) {
        setAllNotices(noticeRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createStaffUserApi(staffForm);
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '', password: '', role: 'Faculty', department: 'Computer Science', phone: '' });
      fetchAdminData();
    } catch (err) {
      console.error('Error creating staff:', err);
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      await createHostelBlockApi(blockForm);
      setIsBlockModalOpen(false);
      setBlockForm({ name: '', totalFloors: 3, description: '' });
      fetchAdminData();
    } catch (err) {
      console.error('Error creating block:', err);
      alert(err.response?.data?.message || 'Error creating block');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await createRoomApi(roomForm);
      setIsRoomModalOpen(false);
      setRoomForm({ roomNumber: '', hostelBlock: '', floor: 0, roomType: 'Double', restroomType: 'Attached', capacity: 2 });
      fetchAdminData();
    } catch (err) {
      console.error('Error creating room:', err);
      alert(err.response?.data?.message || 'Error creating room');
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      await createNoticeApi(noticeForm);
      setIsNoticeModalOpen(false);
      setNoticeForm({ title: '', message: '', targetRole: 'Student' });
      fetchAdminData();
      alert('Announcement broadcasted successfully!');
    } catch (err) {
      console.error('Error posting notice:', err);
      alert(err.response?.data?.message || 'Error broadcasting notice');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUserApi(userId);
      fetchAdminData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    }
  };

  const openComplaintModal = (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintStatus(complaint.status === 'Pending' ? 'Ongoing' : complaint.status);
    setComplaintRemarks(complaint.remarks || '');
    setIsComplaintModalOpen(true);
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateComplaintStatusApi(selectedComplaint._id, {
        status: complaintStatus,
        remarks: complaintRemarks
      });
      setIsComplaintModalOpen(false);
      fetchAdminData();
      alert('Ticket updated successfully!');
    } catch (err) {
      console.error('Error updating complaint:', err);
      alert('Error updating complaint status');
    }
  };

  const filteredUsers = userRoleFilter === 'All' 
    ? users 
    : users.filter(u => u.role === userRoleFilter);

  return (
    <Layout title="System Administrator Dashboard">


      {/* Stats Widgets */}
      <div className="stats-row">
        <div className="glass-card stat-widget">
          <div className="stat-info">
            <span className="stat-label">Total Students</span>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper primary">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
        </div>

        <div className="glass-card stat-widget">
          <div className="stat-info">
            <span className="stat-label">Hostel Blocks</span>
            <div className="stat-value">{stats.totalBlocks}</div>
          </div>
          <div className="stat-icon-wrapper secondary">
            <i className="fa-solid fa-hotel"></i>
          </div>
        </div>

        <div className="glass-card stat-widget">
          <div className="stat-info">
            <span className="stat-label">Total Staff</span>
            <div className="stat-value">{stats.totalFaculties + stats.totalWardens}</div>
          </div>
          <div className="stat-icon-wrapper accent">
            <i className="fa-solid fa-users-gear"></i>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card" style={{ padding: '0', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-users"></i> Users Directory
          </button>
          <button 
            onClick={() => setActiveTab('complaints')} 
            className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-screwdriver-wrench"></i> Complaints Resolver ({complaints.length})
          </button>
          <button 
            onClick={() => setActiveTab('notices')} 
            className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className="fa-solid fa-bullhorn"></i> Notice Broadcasts ({allNotices.length})
          </button>
        </div>

        {/* Tab 1: Users Directory */}
        {activeTab === 'users' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                System Accounts Registry
              </h3>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {['All', 'Student', 'Faculty', 'Warden', 'Admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`btn btn-sm ${userRoleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderRadius: '20px' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Info / Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading directory...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No user accounts registered under this role.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: u.role === 'Admin' ? 'rgba(30, 58, 138, 0.08)' :
                                             u.role === 'Warden' ? 'rgba(15, 118, 110, 0.08)' :
                                             u.role === 'Faculty' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                            color: u.role === 'Admin' ? 'var(--primary-color)' :
                                   u.role === 'Warden' ? 'var(--secondary-color)' :
                                   u.role === 'Faculty' ? 'var(--accent-color)' : 'var(--text-main)'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.rollNo || u.department || 'N/A'}</td>
                        <td>
                          {u.role !== 'Admin' && (
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(u._id)}
                            >
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
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

        {/* Tab 2: Complaints Resolver */}
        {activeTab === 'complaints' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '20px', fontWeight: 600 }}>
              Campus Faults & Escalated Tickets Resolver
            </h3>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Scope / Type</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading tickets...</td></tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No campus faults or escalated complaints registered.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c._id} style={{ borderLeft: c.isEscalated ? '4px solid var(--danger-color)' : 'none' }}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>{c.category}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: c.complaintType === 'Campus' ? 'rgba(109, 40, 217, 0.08)' : 'rgba(15, 118, 110, 0.08)', color: c.complaintType === 'Campus' ? 'var(--accent-color)' : 'var(--secondary-color)' }}>
                            {c.complaintType || 'Hostel'}
                          </span>
                        </td>
                        <td>{c.student?.name || 'Student'} ({c.student?.studentType || 'N/A'})</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <StatusBadge status={c.status} />
                            {c.isEscalated && (
                              <span className="status-badge rejected" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                                Escalated Ticket
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openComplaintModal(c)}
                          >
                            Update Ticket
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Notice Board Broadcasts */}
        {activeTab === 'notices' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '20px', fontWeight: 600 }}>
              Official Broadcaster Board
            </h3>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Broadcast Title</th>
                    <th>Message</th>
                    <th>Target Audience</th>
                    <th>Date Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading announcements...</td></tr>
                  ) : allNotices.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No notice board announcements posted.
                      </td>
                    </tr>
                  ) : (
                    allNotices.map((n) => (
                      <tr key={n._id}>
                        <td style={{ fontWeight: 600 }}>{n.title}</td>
                        <td style={{ fontSize: '0.85rem' }}>{n.message}</td>
                        <td>
                          <span className="status-badge approved">
                            {n.recipientRole || 'All'}
                          </span>
                        </td>
                        <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Add Staff / Advisor">
        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
              <option value="Faculty">Faculty Advisor</option>
              <option value="Warden">Hostel Warden</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" required value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsStaffModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create User</button>
          </div>
        </form>
      </Modal>

      {/* Add Block Modal */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Create Hostel Block">
        <form onSubmit={handleCreateBlock}>
          <div className="form-group">
            <label>Block Name</label>
            <input type="text" className="form-control" placeholder="e.g. Visvesvaraya Block" required value={blockForm.name} onChange={e => setBlockForm({...blockForm, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Total Floors</label>
            <input type="number" min="1" max="10" className="form-control" required value={blockForm.totalFloors} onChange={e => setBlockForm({...blockForm, totalFloors: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows="2" value={blockForm.description} onChange={e => setBlockForm({...blockForm, description: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-secondary">Create Block</button>
          </div>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Configure New Room">
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label>Hostel Block</label>
            <select className="form-control" required value={roomForm.hostelBlock} onChange={e => setRoomForm({...roomForm, hostelBlock: e.target.value})}>
              <option value="">Select Block...</option>
              {blocks.map(b => (
                <option key={b._id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Room Number</label>
              <input type="text" className="form-control" placeholder="e.g. 101" required value={roomForm.roomNumber} onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input type="number" min="0" max="10" className="form-control" required value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor: parseInt(e.target.value)})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Room Type</label>
              <select className="form-control" value={roomForm.roomType} onChange={e => setRoomForm({...roomForm, roomType: e.target.value})}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Four Sharing">Four Sharing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Restroom Type</label>
              <select className="form-control" value={roomForm.restroomType} onChange={e => setRoomForm({...roomForm, restroomType: e.target.value})}>
                <option value="Attached">Attached</option>
                <option value="Common">Common</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsRoomModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Room</button>
          </div>
        </form>
      </Modal>

      {/* Post Announcement Modal */}
      <Modal isOpen={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} title="Broadcast Announcement">
        <form onSubmit={handlePostNotice}>
          <div className="form-group">
            <label>Announcement Title</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Holiday Announcement / Server Maintenance" 
              required 
              value={noticeForm.title} 
              onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>Target Audience (Role)</label>
            <select 
              className="form-control"
              value={noticeForm.targetRole}
              onChange={e => setNoticeForm({...noticeForm, targetRole: e.target.value})}
            >
              <option value="All">All Audiences</option>
              <option value="Student">Students Only</option>
              <option value="Faculty">Faculty Only</option>
              <option value="Warden">Wardens Only</option>
            </select>
          </div>

          <div className="form-group">
            <label>Announcement message / Details</label>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="Write the message text..." 
              required 
              value={noticeForm.message} 
              onChange={e => setNoticeForm({...noticeForm, message: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsNoticeModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Broadcast Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Review Complaint Modal */}
      <Modal isOpen={isComplaintModalOpen} onClose={() => setIsComplaintModalOpen(false)} title="Update Complaint Ticket">
        <form onSubmit={handleComplaintSubmit}>
          {selectedComplaint && (
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <div><strong>Title:</strong> {selectedComplaint.title}</div>
              <div><strong>Type:</strong> {selectedComplaint.complaintType}</div>
              <div><strong>Description:</strong> {selectedComplaint.description}</div>
              {selectedComplaint.isEscalated && (
                <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginTop: '4px' }}>
                  ⚠️ Escalation Notes: {selectedComplaint.escalationRemarks}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Update Status</label>
            <select 
              className="form-control"
              value={complaintStatus}
              onChange={e => setComplaintStatus(e.target.value)}
            >
              <option value="Ongoing">Ongoing (In Progress)</option>
              <option value="Rectified">Rectified (Resolved)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label>Admin Remarks / Action Taken</label>
            <textarea
              className="form-control"
              rows="3"
              required
              placeholder="e.g. Assigned staff to repair. Resolved leaking pipe..."
              value={complaintRemarks}
              onChange={e => setComplaintRemarks(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsComplaintModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
