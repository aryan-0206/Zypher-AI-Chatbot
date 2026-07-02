import React, { useEffect, useRef } from 'react';

/**
 * Toast notification system for Zypher AI.
 * Usage: pass `toasts` array and `removeToast` function from useToast hook.
 */

const Toast = ({ toast, onRemove }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`toast ${toast.type || 'info'}`}
      onClick={() => onRemove(toast.id)}
      role="alert"
    >
      {toast.icon && <span>{toast.icon}</span>}
      <span>{toast.message}</span>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
};

/**
 * useToast hook
 * const { toasts, toast, removeToast } = useToast();
 * toast.success('Copied!');  toast.error('Failed'); toast.info('Loaded');
 */
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', icon = '', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, icon, duration }]);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (msg) => addToast(msg, 'success', '✅'),
    error:   (msg) => addToast(msg, 'error',   '❌'),
    info:    (msg) => addToast(msg, 'info',     'ℹ️'),
  }), [addToast]);

  return { toasts, toast, removeToast };
};

export default Toast;
