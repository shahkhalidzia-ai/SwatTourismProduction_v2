import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} color="var(--ok)" />;
      case 'warning':
        return <AlertCircle size={18} color="var(--acc)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--bad)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--pri)" />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--card)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-button)',
        boxShadow: '0 4px 12px rgba(18, 50, 74, 0.08)',
        minWidth: '280px',
        maxWidth: '420px',
      }}
    >
      {getIcon()}
      <span style={{ flex: 1, fontSize: 'var(--font-sm)', fontWeight: 500 }}>
        {toast.message}
      </span>
      {toast.actionLabel && (
        <button
          onClick={toast.onAction}
          style={{
            color: 'var(--pri)',
            fontWeight: 600,
            fontSize: 'var(--font-xs)',
            minHeight: 'auto',
            padding: '4px 8px',
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss"
        style={{
          color: 'var(--mute)',
          minHeight: 'auto',
          padding: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
