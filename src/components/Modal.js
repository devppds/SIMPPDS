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
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease-out;
                    padding: 40px 20px;
                }

                .modal-container {
                    background: white;
                    width: 100%;
                    max-width: ${width || '700px'};
                    max-height: calc(100vh - 80px);
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
                    animation: modalSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    position: relative;
                }

                .modal-header {
                    padding: 1.75rem 2.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                }

                .modal-header h3 {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }

                .close-btn {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                    transform: rotate(90deg);
                }

                .modal-body {
                    padding: 2.5rem;
                    overflow-y: auto;
                    flex: 1;
                    scroll-behavior: smooth;
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
                    padding: 1.5rem 2.5rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    background: #f8fafc;
                    border-bottom-left-radius: 24px;
                    border-bottom-right-radius: 24px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalSlideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(40px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
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
