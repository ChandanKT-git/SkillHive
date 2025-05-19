import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

let toastTimeoutId = null;

const Toast = () => {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(null);

  // Listen for custom toast events
  useEffect(() => {
    const handleToast = (event) => {
      clearTimeout(toastTimeoutId);
      
      setToast(event.detail);
      setVisible(true);
      
      // Auto hide after duration
      toastTimeoutId = setTimeout(() => {
        setVisible(false);
      }, event.detail.duration || 5000);
    };

    window.addEventListener('toast', handleToast);
    
    return () => {
      window.removeEventListener('toast', handleToast);
      clearTimeout(toastTimeoutId);
    };
  }, []);

  const closeToast = () => {
    setVisible(false);
    clearTimeout(toastTimeoutId);
  };

  if (!visible || !toast) return null;

  // Determine icon based on toast type
  let Icon = Info;
  let bgColor = 'bg-blue-100 dark:bg-blue-900';
  let iconColor = 'text-blue-600 dark:text-blue-400';
  
  if (toast.type === 'success') {
    Icon = CheckCircle;
    bgColor = 'bg-green-100 dark:bg-green-900';
    iconColor = 'text-green-600 dark:text-green-400';
  } else if (toast.type === 'error') {
    Icon = AlertCircle;
    bgColor = 'bg-red-100 dark:bg-red-900';
    iconColor = 'text-red-600 dark:text-red-400';
  } else if (toast.type === 'warning') {
    Icon = XCircle;
    bgColor = 'bg-yellow-100 dark:bg-yellow-900';
    iconColor = 'text-yellow-600 dark:text-yellow-400';
  }

  return (
    <div 
      className="fixed top-20 right-5 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex items-center max-w-sm border border-gray-200 dark:border-gray-700 z-50 slide-in"
      role="alert"
    >
      <div className={`${bgColor} p-2 rounded-full mr-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        {toast.title && (
          <p className="font-medium text-gray-900 dark:text-white text-sm">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-gray-600 dark:text-gray-300 text-xs">{toast.message}</p>
        )}
      </div>
      <button 
        className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        onClick={closeToast}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Helper function to show toasts programmatically
export const showToast = (options) => {
  window.dispatchEvent(
    new CustomEvent('toast', { detail: options })
  );
};

export default Toast;
