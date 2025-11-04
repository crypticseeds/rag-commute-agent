
import React, { useEffect } from 'react';
import type { Toast as ToastType } from '../types';
import { CloseIcon } from './icons';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  const baseClasses = "flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 animate-fade-in-right";
  const typeClasses = {
    success: "text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200",
    error: "text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200"
  };
  const iconBg = typeClasses[toast.type];

  return (
    <div className={baseClasses} role="alert">
       <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${iconBg}`}>
         {toast.type === 'success' ? (
           <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
             <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
           </svg>
         ) : (
           <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
             <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
           </svg>
         )}
      </div>
      <div className="ms-3 text-sm font-normal">{toast.message}</div>
      <button 
        type="button" 
        className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" 
        onClick={() => onDismiss(toast.id)}
      >
        <CloseIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

interface ToasterProps {
  toasts: ToastType[];
  onDismiss: (id: number) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
