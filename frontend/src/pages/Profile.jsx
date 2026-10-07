/**
 * Profile.jsx
 * User profile page: photo upload, edit details, change password with strength meter,
 * activity history, and recent login info — for all roles.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Layout from '../components/Layout';
import NotificationBell from '../components/NotificationBell';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { updateProfileApi, changePasswordApi, uploadAvatarApi, getNotificationsApi } from '../services/api';

/* ─── Password strength util ───────────────────────────── */
function checkStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: 'Too Short',  color: '#EF4444', width: 10 },
    { label: 'Weak',       color: '#F97316', width: 30 },
    { label: 'Fair',       color: '#EAB308', width: 55 },
    { label: 'Good',       color: '#3B82F6', width: 80 },
    { label: 'Strong',     color: '#22C55E', width: 100 },
  ];
  return { ...levels[score], score };
}

/* ─── Activity Items from notifications ─────────────────── */
function buildActivities(notifications) {
  const iconMap = {
    leave:       { icon: 'fa-calendar-check',       bg: '#DBEAFE', color: '#2563EB' },
    complaint:   { icon: 'fa-triangle-exclamation', bg: '#FFEDD5', color: '#F97316' },
    room:        { icon: 'fa-door-open',            bg: '#DCFCE7', color: '#22C55E' },
    notice:      { icon: 'fa-bullhorn',             bg: '#EDE9FE', color: '#7C3AED' },
    maintenance: { icon: 'fa-wrench',               bg: '#FEF9C3', color: '#CA8A04' },
    general:     { icon: 'fa-bell',                 bg: '#F1F5F9', color: '#64748B' },
  };
  return (notifications || []).slice(0, 15).map(n => ({
    ...iconMap[n.type] || iconMap.general,
    title: n.title,
    desc: n.message,
    time: n.createdAt,
  }));
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── Section title ──────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`fa-solid ${icon}`} style={{ color: 'var(--primary)', fontSize: '1rem' }} />
        {title}
      </h3>
      {subtitle && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 28 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Info Row ───────────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-solid)' }}>
      <span style={{ width: 140, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef(null);

  /* State */
  const [activeTab, setActiveTab] = useState('profile');
  const [activities, setActivities] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* Profile form */
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    department: user?.department || '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  /* Password form */
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const pwdStrength = pwdForm.newPassword ? checkStrength(pwdForm.newPassword) : null;

  /* Load activity from notifications */
  useEffect(() => {
    getNotificationsApi().then(res => setActivities(buildActivities(res.data))).catch(() => {});
  }, []);

  /* ── Avatar Upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Please select an image file.', 'error');
    if (file.size > 5 * 1024 * 1024) return showToast('Image must be under 5MB.', 'error');

    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      await uploadAvatarApi(formData);
      await refreshUser();
      showToast('Profile photo updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally { setUploadingAvatar(false); }
  };

  /* ── Profile Update ── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const res = await updateProfileApi(profileForm);
      updateUser(res.data?.user || { ...user, ...profileForm });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setProfileSubmitting(false); }
  };

  /* ── Change Password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return showToast('Passwords do not match.', 'error');
    if (!pwdStrength || pwdStrength.score < 2) return showToast('Password is too weak. Add uppercase, numbers, or symbols.', 'warning');
    setPwdSubmitting(true);
    try {
      await changePasswordApi({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Password change failed.', 'error');
    } finally { setPwdSubmitting(false); }
  };

  /* ── Render ── */
  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const ROLE_COLORS = { Student: '#2563EB', Faculty: '#16A34A', Warden: '#EA580C', Admin: '#6366F1' };
  const roleColor = ROLE_COLORS[user?.role] || '#2563EB';

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top bar */}
      <div className="topbar">
        <div>
          <div className="page-title" style={{ fontSize: '1.15rem' }}>
            <i className="fa-solid fa-user-gear" style={{ color: 'var(--primary)', marginRight: 10 }} />
            My Profile
          </div>
        </div>
        <div className="topbar-right">
          <NotificationBell />
        </div>
      </div>

      {/* ── Profile Hero Card ── */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          {user?.avatar ? (
            <img src={`/uploads/${user.avatar}`} alt="Profile" className="profile-avatar" />
          ) : (
            <div className="avatar-placeholder" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}>
              {getInitials()}
            </div>
          )}
          {uploadingAvatar ? (
            <div className="avatar-upload-btn" style={{ background: '#64748B' }}>
              <i className="fa-solid fa-spinner fa-spin" />
            </div>
          ) : (
            <div className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()} title="Change photo">
              <i className="fa-solid fa-camera" />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} id="avatar-upload-input" />
        </div>

        {/* User info */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{user?.name}</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className={`badge badge-${user?.role === 'Admin' ? 'purple' : user?.role === 'Faculty' ? 'success' : user?.role === 'Warden' ? 'orange' : 'info'}`} style={{ fontSize: '0.8rem' }}>
              <i className={`fa-solid ${user?.role === 'Admin' ? 'fa-shield-halved' : user?.role === 'Faculty' ? 'fa-chalkboard-teacher' : user?.role === 'Warden' ? 'fa-building-user' : 'fa-graduation-cap'}`} style={{ marginRight: 4 }} />
              {user?.role}
            </span>
            {user?.department && <span className="badge badge-gray">{user.department}</span>}
            {user?.section && <span className="badge badge-gray">Section {user.section}</span>}
            {user?.hostelBlock && <span className="badge badge-info">{user.hostelBlock}</span>}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {user?.email && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)' }} /> {user.email}
              </span>
            )}
            {user?.phone && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)' }} /> {user.phone}
              </span>
            )}
            {user?.registerNumber && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-id-card" style={{ color: 'var(--primary)' }} /> {user.registerNumber}
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--primary-glass)', borderRadius: 12 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              {activities.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Activities</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(34,197,94,0.1)', borderRadius: 12 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22C55E' }}>
              {user?.role === 'Student' ? (user?.room ? 'Yes' : 'No') : 'Active'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {user?.role === 'Student' ? 'Room Alloc.' : 'Status'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cs-tabs">
        {[
          { id: 'profile',  icon: 'fa-user',            label: 'Profile Info' },
          { id: 'account',  icon: 'fa-lock',            label: 'Security' },
          { id: 'activity', icon: 'fa-clock-rotate-left', label: 'Activity History' },
        ].map(t => (
          <button key={t.id} className={`cs-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} id={`profile-tab-${t.id}`}>
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile Info ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Edit form */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fa-solid fa-pen-to-square" /> Edit Profile
              </div>
            </div>
            <div className="section-card-body">
              <form onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" type="text" required value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input className="form-control" type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                {user?.role !== 'Student' && (
                  <div className="form-group">
                    <label>Department</label>
                    <select className="form-control" value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}>
                      {['Computer Science','Information Technology','Electronics','Mechanical','Civil','MBA','MCA'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-control" rows={2} value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={profileSubmitting}>
                  {profileSubmitting
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                    : <><i className="fa-solid fa-check" /> Save Changes</>
                  }
                </button>
              </form>
            </div>
          </div>

          {/* Read-only details */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title"><i className="fa-solid fa-circle-info" /> Account Details</div>
            </div>
            <div className="section-card-body">
              <InfoRow label="Email"       value={user?.email} />
              <InfoRow label="Role"        value={user?.role} />
              <InfoRow label="Department"  value={user?.department} />
              {user?.role === 'Student' && <>
                <InfoRow label="Register No"   value={user?.registerNumber} />
                <InfoRow label="Section"       value={user?.section} />
                <InfoRow label="Student Type"  value={user?.studentType} />
                <InfoRow label="Hostel Block"  value={user?.hostelBlock} />
                <InfoRow label="Parent Name"   value={user?.parentName} />
                <InfoRow label="Parent Phone"  value={user?.parentPhone} />
              </>}
              {user?.role === 'Faculty' && <>
                <InfoRow label="Faculty ID"    value={user?.facultyID} />
              </>}
              {user?.role === 'Warden' && <>
                <InfoRow label="Hostel Block"  value={user?.assignedBlock} />
              </>}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Security ── */}
      {activeTab === 'account' && (
        <div style={{ maxWidth: 560 }}>
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title"><i className="fa-solid fa-lock" /> Change Password</div>
            </div>
            <div className="section-card-body">
              <form onSubmit={handleChangePassword}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwdForm.currentPassword}
                      onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <i className={`fa-solid ${showCurrentPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwdForm.newPassword}
                      onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <i className={`fa-solid ${showNewPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  {/* Strength bar */}
                  {pwdStrength && (
                    <div className="password-strength">
                      <div className="strength-bar-track">
                        <div className="strength-bar-fill" style={{ width: `${pwdStrength.width}%`, background: pwdStrength.color }} />
                      </div>
                      <div className="strength-label" style={{ color: pwdStrength.color }}>{pwdStrength.label}</div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    required
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    style={{
                      borderColor: pwdForm.confirmPassword && pwdForm.confirmPassword !== pwdForm.newPassword ? 'var(--danger)' : undefined
                    }}
                  />
                  {pwdForm.confirmPassword && pwdForm.confirmPassword !== pwdForm.newPassword && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>
                      <i className="fa-solid fa-circle-xmark" style={{marginRight:4}} />Passwords do not match.
                    </p>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pwdSubmitting}>
                  {pwdSubmitting
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Changing…</>
                    : <><i className="fa-solid fa-key" /> Change Password</>
                  }
                </button>
              </form>

              {/* Security tips */}
              <div style={{ marginTop: 24, padding: '16px', background: 'var(--primary-glass)', borderRadius: 12 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
                  <i className="fa-solid fa-shield-halved" style={{marginRight:6}} />Password Tips
                </p>
                {['Use at least 8 characters','Include uppercase letters','Add numbers and symbols','Avoid common passwords'].map((tip, i) => (
                  <p key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-check" style={{ color: '#22C55E', fontSize: '0.7rem' }} />{tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Activity History ── */}
      {activeTab === 'activity' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Activity timeline */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title"><i className="fa-solid fa-timeline" /> Activity History</div>
              <span className="badge badge-info">{activities.length} events</span>
            </div>
            <div className="section-card-body">
              {activities.length === 0 ? (
                <div className="cs-empty">
                  <i className="fa-regular fa-clock" />
                  <p>No activity recorded yet.</p>
                </div>
              ) : activities.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon" style={{ background: a.bg, color: a.color }}>
                    <i className={`fa-solid ${a.icon}`} />
                  </div>
                  <div className="activity-meta">
                    <div className="activity-title">{a.title}</div>
                    <div className="activity-desc">{a.desc?.substring(0, 90)}</div>
                  </div>
                  <div className="activity-time">{timeAgo(a.time)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent login info */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title"><i className="fa-solid fa-shield-check" /> Session Info</div>
            </div>
            <div className="section-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: 'fa-circle-check',  color: '#22C55E', label: 'Login Status',       value: 'Active' },
                  { icon: 'fa-user',           color: '#3B82F6', label: 'Account Role',        value: user?.role },
                  { icon: 'fa-envelope',       color: '#8B5CF6', label: 'Email',               value: user?.email },
                  { icon: 'fa-building',       color: '#F97316', label: 'Department',          value: user?.department || '—' },
                  { icon: 'fa-id-badge',       color: '#14B8A6', label: 'Register / ID',       value: user?.registerNumber || user?.facultyID || '—' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-solid)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${item.color}18`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fa-solid ${item.icon}`} style={{ fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
