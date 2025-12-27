'use client';

import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, width }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.2s ease-out;
                    padding: 20px;
                }

                .modal-container {
                    background: white;
                    width: 90%;
                    max-width: ${width || '650px'};
                    max-height: 90vh;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.3s ease-out;
                    overflow: hidden;
                }

                .modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.25rem;
                    color: var(--primary-dark);
                    margin: 0;
                }

                .close-btn {
                    background: #f1f5f9;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }

                .modal-body {
                    padding: 2.5rem 2rem 2rem 2rem;
                    overflow-y: auto;
                    flex: 1;
                    scroll-padding-top: 20px;
                }

                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }

                .modal-body::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }

                .modal-body::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }

                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .modal-footer {
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    background: #f8fafc;
                    border-bottom-left-radius: 20px;
                    border-bottom-right-radius: 20px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .modal-overlay {
                        padding: 10px;
                    }
                    
                    .modal-container {
                        width: 95%;
                        max-height: 85vh;
                    }
                    
                    .modal-header {
                        padding: 1rem 1.25rem;
                    }
                    
                    .modal-body {
                        padding: 1.5rem 1.25rem;
                    }
                    
                    .modal-footer {
                        padding: 1rem 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
}
