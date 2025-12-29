'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    if (typeof window === 'undefined') return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type} animate-toast`}>
                    <div className="toast-icon">
                        {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                        {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                        {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                        {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
                    </div>
                    <div className="toast-content">
                        {toast.message}
                    </div>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="toast-progress"></div>
                </div>
            ))}
        </div>
    );
};
