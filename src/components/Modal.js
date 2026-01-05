'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, footer, width, theme = 'light', className = '' }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { if (typeof document !== 'undefined') document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // Use Portals to render the modal outside the page hierarchy
    return createPortal(
        <div className={`modal-overlay ${theme === 'dark' ? 'modal-dark-overlay' : ''} ${className}`} onClick={onClose}>
            <div
                className={`modal-container ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: width || '700px' }}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body custom-scrollbar">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.getElementById('modal-root')
    );
}
