/**
 * NotificationBell.jsx
 * Premium notification bell with categorized dropdown, unread badge, and clear-all.
 * Shows color-coded notifications by type (leave, complaint, room, notice, maintenance).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificationsApi, markNotificationReadApi, markAllReadApi, getUnreadCountApi, clearAllNotificationsApi } from '../services/api';

const TYPE_CONFIG = {
  leave:       { icon: 'fa-calendar-check',          color: '#3B82F6', bg: '#DBEAFE', label: 'Leave' },
  complaint:   { icon: 'fa-triangle-exclamation',    color: '#F97316', bg: '#FFEDD5', label: 'Complaint' },
  room:        { icon: 'fa-door-open',               color: '#22C55E', bg: '#DCFCE7', label: 'Room' },
  maintenance: { icon: 'fa-wrench',                  color: '#EAB308', bg: '#FEF9C3', label: 'Maintenance' },
  notice:      { icon: 'fa-bullhorn',                color: '#8B5CF6', bg: '#EDE9FE', label: 'Notice' },
  general:     { icon: 'fa-bell',                    color: '#64748B', bg: '#F1F5F9', label: 'General' },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCountApi();
      setUnread(res.data?.unreadCount || 0);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotificationsApi();
      setNotifications(res.data || []);
      const unreadCount = (res.data || []).filter(n => !n.isRead).length;
      setUnread(unreadCount);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh badge every minute
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotificationsApi();
      setNotifications([]);
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) await handleMarkRead(notif._id);
    setOpen(false);
    // Navigate based on type
    if (notif.type === 'leave')     navigate('/leave');
    else if (notif.type === 'complaint') navigate('/complaints');
    else if (notif.type === 'room') navigate('/hostel');
  };

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const typeFilters = ['all', 'leave', 'complaint', 'room', 'notice', 'maintenance'];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell button */}
      <button
        className="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        id="notification-bell"
        aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <i className="fa-solid fa-bell" />
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications panel">
          {/* Header */}
          <div className="notif-header">
            <h4>
              <i className="fa-solid fa-bell" style={{ color: 'var(--primary)', marginRight: 8 }} />
              Notifications
              {unread > 0 && (
                <span className="badge badge-info" style={{ marginLeft: 8, fontSize: '0.7rem' }}>{unread} new</span>
              )}
            </h4>
            <div className="notif-actions">
              {unread > 0 && (
                <button className="btn btn-ghost btn-xs" onClick={handleMarkAll} title="Mark all as read">
                  <i className="fa-solid fa-check-double" />
                </button>
              )}
              {notifications.length > 0 && (
                <button className="btn btn-ghost btn-xs" onClick={handleClearAll} title="Clear all" style={{ color: 'var(--danger)' }}>
                  <i className="fa-solid fa-trash" />
                </button>
              )}
            </div>
          </div>

          {/* Type filters */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 14px', overflowX: 'auto', borderBottom: '1px solid var(--border-solid)' }}>
            {typeFilters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  border: '1px solid',
                  borderColor: activeFilter === f ? 'var(--primary)' : 'var(--border-solid)',
                  background: activeFilter === f ? 'var(--primary-glass)' : 'transparent',
                  color: activeFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {f === 'all' ? 'All' : (TYPE_CONFIG[f]?.label || f)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">
                <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--primary)' }} />
                <p style={{ marginTop: 8 }}>Loading…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <i className="fa-regular fa-bell-slash" />
                <p>No {activeFilter !== 'all' ? activeFilter : ''} notifications</p>
              </div>
            ) : (
              filtered.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                return (
                  <div
                    key={n._id}
                    className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleItemClick(n)}
                  >
                    <div className="notif-item-icon" style={{ background: config.bg, color: config.color }}>
                      <i className={`fa-solid ${config.icon}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-msg">{n.message}</div>
                      <div className="notif-item-time">
                        <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
                        {timeAgo(n.createdAt)}
                        {!n.isRead && (
                          <span style={{
                            display: 'inline-block', width: 6, height: 6,
                            borderRadius: '50%', background: 'var(--primary)',
                            marginLeft: 6, verticalAlign: 'middle'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
