'use client';

import { useStore } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} color="var(--success)" />}
          {toast.type === 'error' && <AlertCircle size={18} color="var(--error)" />}
          {toast.type === 'info' && <Info size={18} color="var(--accent-purple)" />}
          
          <span style={{ flex: 1 }}>{toast.message}</span>

          <button onClick={() => removeToast(toast.id)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
