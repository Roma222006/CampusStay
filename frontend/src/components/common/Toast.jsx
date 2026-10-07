/**
 * Toast.jsx
 * Animated toast notification container. Drop it at the top level of any page.
 * Props: toasts (array), removeToast (fn)
 */

import React, { useEffect, useState } from 'react';

const ICONS = {
  success: { icon: 'fa-circle-check', color: '#22C55E' },
  error:   { icon: 'fa-circle-xmark', color: '#EF4444' },
  warning: { icon: 'fa-triangle-exclamation', color: '#F59E0B' },
  info:    { icon: 'fa-circle-info', color: '#3B82F6' },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger slide-in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const meta = ICONS[toast.type] || ICONS.info;

  return (
    <div
      className={`cs-toast cs-toast--${toast.type}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(120%)' }}
      role="alert"
      aria-live="assertive"
    >
      <i className={`fa-solid ${meta.icon}`} style={{ color: meta.color, fontSize: '1.2rem', flexShrink: 0 }} />
      <span className="cs-toast__message">{toast.message}</span>
      <button className="cs-toast__close" onClick={() => onRemove(toast.id)} aria-label="Close notification">
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="cs-toast-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
