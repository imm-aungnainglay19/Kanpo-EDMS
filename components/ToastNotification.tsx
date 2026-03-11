
import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onClose]);

  const bgColor = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const textColor = 'text-white';

  return (
    <div className={`relative flex items-center justify-between w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg ${bgColor} ${textColor} animate-fade-in-right`}>
      <p className="text-sm font-medium">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
        <CloseIcon className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-5 right-5 z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
