/**
 * useToast.js
 * Global toast notification hook — replaces all alert() calls.
 * Usage:
 *   const { toasts, showToast } = useToast();
 *   showToast('Operation successful!', 'success');
 *   <ToastContainer toasts={toasts} />
 */

import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
