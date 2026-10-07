/**
 * Sidebar.jsx
 * Premium dark sidebar with animated collapse, role badge, user avatar,
 * Admin quick-action modals, and tooltip support when collapsed.
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createStaffUserApi,
  createHostelBlockApi,
  createRoomApi,
  getHostelBlocksApi,
  createNoticeApi,
} from '../services/api';

/* ─── Admin quick-action modal ───────────────────────────── */
function AdminModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Sidebar nav item ───────────────────────────────────── */
function NavItem({ to, icon, label, collapsed, tooltip }) {
  return (
    <li className="menu-item" data-tooltip={tooltip || label}>
      <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="menu-icon"><i className={`fa-solid ${icon}`} /></span>
        {!collapsed && <span className="menu-text">{label}</span>}
      </NavLink>
    </li>
  );
}

function ActionItem({ icon, label, collapsed, onClick, tooltip }) {
  return (
    <li className="menu-item" data-tooltip={tooltip || label}>
      <button className="sidebar-action-btn" onClick={onClick}>
        <span className="menu-icon"><i className={`fa-solid ${icon}`} /></span>
        {!collapsed && <span className="menu-text">{label}</span>}
      </button>
    </li>
  );
}

/* ─── Main Sidebar ───────────────────────────────────────── */
const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* Admin modal states */
  const [blocks, setBlocks] = useState([]);
  const [isStaffOpen,  setIsStaffOpen]  = useState(false);
  const [isBlockOpen,  setIsBlockOpen]  = useState(false);
  const [isRoomOpen,   setIsRoomOpen]   = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  /* Form states */
  const [staffForm,  setStaffForm]  = useState({ name:'', email:'', password:'', role:'Faculty', department:'Computer Science', phone:'' });
  const [blockForm,  setBlockForm]  = useState({ name:'', totalFloors:3, description:'' });
  const [roomForm,   setRoomForm]   = useState({ roomNumber:'', hostelBlock:'', floor:0, roomType:'Double', restroomType:'Attached', capacity:2 });
  const [noticeForm, setNoticeForm] = useState({ title:'', message:'', targetRole:'Student' });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  /* ── helpers ── */
  const showMsg = (msg) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(''), 4000); };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getDashboardPath = () => {
    switch (user?.role?.toLowerCase()) {
      case 'student': return '/student-dashboard';
      case 'faculty': return '/faculty-dashboard';
      case 'warden':  return '/warden-dashboard';
      case 'admin':   return '/admin-dashboard';
      default:        return '/login';
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const openRoomModal = async () => {
    setIsRoomOpen(true);
    try {
      const res = await getHostelBlocksApi();
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.blocks || []);
      setBlocks(list);
      if (list.length > 0) setRoomForm(p => ({ ...p, hostelBlock: list[0].name }));
    } catch { /* ignore */ }
  };

  /* ── submit handlers ── */
  const handleStaff = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await createStaffUserApi(staffForm);
      setIsStaffOpen(false);
      setStaffForm({ name:'', email:'', password:'', role:'Faculty', department:'Computer Science', phone:'' });
      showMsg('Staff account created successfully.');
    } catch (err) { showMsg(err.response?.data?.message || 'Error creating staff.'); }
    finally { setSubmitting(false); }
  };

  const handleBlock = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await createHostelBlockApi(blockForm);
      setIsBlockOpen(false);
      setBlockForm({ name:'', totalFloors:3, description:'' });
      showMsg('Hostel block created.');
    } catch (err) { showMsg(err.response?.data?.message || 'Error creating block.'); }
    finally { setSubmitting(false); }
  };

  const handleRoom = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await createRoomApi(roomForm);
      setIsRoomOpen(false);
      setRoomForm({ roomNumber:'', hostelBlock:'', floor:0, roomType:'Double', restroomType:'Attached', capacity:2 });
      showMsg('Room configured successfully.');
    } catch (err) { showMsg(err.response?.data?.message || 'Error creating room.'); }
    finally { setSubmitting(false); }
  };

  const handleNotice = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await createNoticeApi(noticeForm);
      setIsNoticeOpen(false);
      setNoticeForm({ title:'', message:'', targetRole:'Student' });
      showMsg('Announcement broadcasted.');
    } catch (err) { showMsg(err.response?.data?.message || 'Error posting notice.'); }
    finally { setSubmitting(false); }
  };

  const dashPath = getDashboardPath();

  return (
    <>
      {/* ── Global feedback toast inside sidebar ── */}
      {feedbackMsg && (
        <div style={{
          position:'fixed', bottom:24, left:24, zIndex:9999,
          background:'#1E293B', color:'#fff', padding:'12px 20px',
          borderRadius:12, fontSize:'0.85rem', boxShadow:'0 8px 24px rgba(0,0,0,0.2)',
          borderLeft:'4px solid #22C55E', animation:'slideIn 0.3s ease'
        }}>
          <i className="fa-solid fa-circle-check" style={{marginRight:8, color:'#22C55E'}} />
          {feedbackMsg}
        </div>
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="cs-sidebar">
        {/* ─── Header ─── */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="fa-solid fa-hotel" />
            <span>CampusStay</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
            </button>
            {mobileOpen && (
              <button className="collapse-btn" onClick={onCloseMobile} title="Close menu">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {/* ─── User mini display ─── */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.profilePhotoPath || user?.avatar ? (
              <img src={user.profilePhotoPath || `/uploads/${user.avatar}`} alt={user.name} />
            ) : getInitials()}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <span className="sidebar-role-badge">{user?.role || 'Guest'}</span>
            </div>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <ul className="sidebar-menu">
          {user?.role === 'Admin' ? (
            /* ── Admin sidebar ── */
            <>
              <li className="sidebar-section-label">OVERVIEW</li>
              <NavItem to="/admin-dashboard" icon="chart-line"     label="Dashboard"        collapsed={collapsed} />
              <NavItem to="/admin/rooms"     icon="building-user"  label="Room Dashboard"   collapsed={collapsed} />
              <NavItem to="/hostel-map"      icon="layer-group"    label="Floor Map 2D"     collapsed={collapsed} />
              <NavItem to="/reports"         icon="file-invoice"   label="Reports"          collapsed={collapsed} />

              <li className="sidebar-section-label">CAMPUS HUBS</li>
              <NavItem to="/gatepass"        icon="ticket"                 label="Gate Pass & Terminal" collapsed={collapsed} />
              <NavItem to="/mess"            icon="utensils"               label="Smart Mess Hub"       collapsed={collapsed} />
              <NavItem to="/emergency"       icon="truck-medical"          label="Emergency SOS"        collapsed={collapsed} />
              <NavItem to="/lost-found"      icon="box-open"               label="Lost & Found"         collapsed={collapsed} />
              <NavItem to="/polls"           icon="square-poll-vertical"   label="Campus Polls"         collapsed={collapsed} />

              <li className="sidebar-section-label">MANAGEMENT</li>
              <ActionItem icon="user-plus"  label="Add Staff"        collapsed={collapsed} onClick={() => setIsStaffOpen(true)} />
              <ActionItem icon="building"   label="Add Block"        collapsed={collapsed} onClick={() => setIsBlockOpen(true)} />
              <ActionItem icon="door-open"  label="Configure Room"   collapsed={collapsed} onClick={openRoomModal} />
              <ActionItem icon="bullhorn"   label="Broadcast Notice" collapsed={collapsed} onClick={() => setIsNoticeOpen(true)} />

              <li className="sidebar-section-label">ACCOUNT</li>
              <NavItem to="/profile" icon="user-gear" label="Profile" collapsed={collapsed} />
            </>
          ) : (
            /* ── Standard user sidebar ── */
            <>
              <li className="sidebar-section-label">MAIN</li>
              <NavItem to={dashPath} icon="chart-line" label="Dashboard" collapsed={collapsed} />

              {/* Hide Hostel for Dayscholar students */}
              {user?.studentType !== 'Dayscholar' && (
                <>
                  <NavItem to="/hostel"       icon="building-user" label="Hostel & Rooms" collapsed={collapsed} />
                  <NavItem to="/hostel-map"   icon="layer-group"   label="Floor Map 2D"   collapsed={collapsed} />
                  {user?.role === 'Student' && (
                    <NavItem to="/roommate-radar" icon="compass"   label="Roommate Radar" collapsed={collapsed} />
                  )}
                </>
              )}

              <NavItem to="/gatepass"   icon="ticket"                 label="Gate Pass"       collapsed={collapsed} />
              <NavItem to="/leave"      icon="calendar-check"         label="Leave Requests"  collapsed={collapsed} />
              <NavItem to="/mess"       icon="utensils"               label="Mess & Dining"   collapsed={collapsed} />
              <NavItem to="/complaints" icon="clipboard-list"         label="Complaints"      collapsed={collapsed} />
              <NavItem to="/lost-found" icon="box-open"               label="Lost & Found"    collapsed={collapsed} />
              <NavItem to="/polls"      icon="square-poll-vertical"   label="Student Voice"   collapsed={collapsed} />
              <NavItem to="/emergency"  icon="triangle-exclamation"   label="Emergency SOS"   collapsed={collapsed} />

              {user?.role !== 'Student' && (
                <NavItem to="/reports" icon="file-invoice" label="Reports" collapsed={collapsed} />
              )}

              <li className="sidebar-section-label">ACCOUNT</li>
              <NavItem to="/profile" icon="user-gear" label="Profile" collapsed={collapsed} />
            </>
          )}
        </ul>

        {/* ─── Footer logout ─── */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ ADMIN ACTION MODALS ═══════════════ */}

      {/* 1. Add Staff */}
      <AdminModal isOpen={isStaffOpen} onClose={() => setIsStaffOpen(false)} title="Create Staff / Advisor Account">
        <form onSubmit={handleStaff}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" type="text" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email:e.target.value})} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Role</label>
              <select className="form-control" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role:e.target.value})}>
                <option value="Faculty">Faculty Advisor</option>
                <option value="Warden">Hostel Warden</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-control" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department:e.target.value})}>
                {['Computer Science','Information Technology','Electronics','Mechanical','Civil','MBA','MCA'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required minLength={6} value={staffForm.password} onChange={e => setStaffForm({...staffForm, password:e.target.value})} />
          </div>
          <div className="modal-footer" style={{padding:0, marginTop:8}}>
            <button type="button" className="btn btn-outline" onClick={() => setIsStaffOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><i className="fa-solid fa-spinner fa-spin" /> Creating…</> : <><i className="fa-solid fa-user-plus" /> Create Account</>}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* 2. Add Block */}
      <AdminModal isOpen={isBlockOpen} onClose={() => setIsBlockOpen(false)} title="Create Hostel Block">
        <form onSubmit={handleBlock}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Block Name</label>
              <input className="form-control" type="text" placeholder="e.g. Visvesvaraya Block" required value={blockForm.name} onChange={e => setBlockForm({...blockForm, name:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Total Floors</label>
              <input className="form-control" type="number" min="1" max="15" required value={blockForm.totalFloors} onChange={e => setBlockForm({...blockForm, totalFloors:parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="form-group">
            <label>Description <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
            <textarea className="form-control" rows={2} value={blockForm.description} onChange={e => setBlockForm({...blockForm, description:e.target.value})} />
          </div>
          <div className="modal-footer" style={{padding:0, marginTop:8}}>
            <button type="button" className="btn btn-outline" onClick={() => setIsBlockOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : <><i className="fa-solid fa-building" /> Create Block</>}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* 3. Configure Room */}
      <AdminModal isOpen={isRoomOpen} onClose={() => setIsRoomOpen(false)} title="Configure New Room">
        <form onSubmit={handleRoom}>
          <div className="form-group">
            <label>Hostel Block</label>
            <select className="form-control" required value={roomForm.hostelBlock} onChange={e => setRoomForm({...roomForm, hostelBlock:e.target.value})}>
              <option value="">Select block…</option>
              {blocks.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Room Number</label>
              <input className="form-control" type="text" placeholder="e.g. 101" required value={roomForm.roomNumber} onChange={e => setRoomForm({...roomForm, roomNumber:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input className="form-control" type="number" min="0" max="15" required value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor:parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Room Type</label>
              <select className="form-control" value={roomForm.roomType} onChange={e => setRoomForm({...roomForm, roomType:e.target.value})}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Four Sharing">Four Sharing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Restroom Type</label>
              <select className="form-control" value={roomForm.restroomType} onChange={e => setRoomForm({...roomForm, restroomType:e.target.value})}>
                <option value="Attached">Attached</option>
                <option value="Common">Common</option>
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{padding:0, marginTop:8}}>
            <button type="button" className="btn btn-outline" onClick={() => setIsRoomOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : <><i className="fa-solid fa-door-open" /> Create Room</>}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* 4. Broadcast Notice */}
      <AdminModal isOpen={isNoticeOpen} onClose={() => setIsNoticeOpen(false)} title="Broadcast Announcement">
        <form onSubmit={handleNotice}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" type="text" placeholder="e.g. Holiday Notice" required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title:e.target.value})} />
          </div>
          <div className="form-group">
            <label>Target Audience</label>
            <select className="form-control" value={noticeForm.targetRole} onChange={e => setNoticeForm({...noticeForm, targetRole:e.target.value})}>
              <option value="All">All Roles</option>
              <option value="Student">Students Only</option>
              <option value="Faculty">Faculty Only</option>
              <option value="Warden">Wardens Only</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea className="form-control" rows={4} placeholder="Write announcement details…" required value={noticeForm.message} onChange={e => setNoticeForm({...noticeForm, message:e.target.value})} />
          </div>
          <div className="modal-footer" style={{padding:0, marginTop:8}}>
            <button type="button" className="btn btn-outline" onClick={() => setIsNoticeOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Broadcasting…' : <><i className="fa-solid fa-bullhorn" /> Broadcast</>}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default Sidebar;
