'use client';

import React from 'react';
import Modal from './Modal';

/**
 * ConfirmModal - Modal kustom untuk konfirmasi aksi (Satu Pintu)
 * Menggantikan jendela confirm() browser yang membosankan.
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi Aksi',
    message = 'Apakah Anda yakin ingin melakukan tindakan ini?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batalkan',
    type = 'danger', // danger, warning, info
    loading = false
}) {
    const getColor = () => {
        switch (type) {
            case 'danger': return 'var(--danger)';
            case 'warning': return '#f59e0b';
            case 'info': return 'var(--primary)';
            default: return 'var(--primary)';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return 'fa-exclamation-triangle';
            case 'warning': return 'fa-exclamation-circle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-question-circle';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            width="450px"
            footer={(
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button className="btn btn-outline" onClick={onClose} disabled={loading} style={{ flex: 1, borderRadius: '14px' }}>{cancelText}</button>
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            borderRadius: '14px',
                            background: type === 'danger' ? '#ef4444' : getColor(),
                            borderColor: type === 'danger' ? '#ef4444' : getColor(),
                            color: 'white',
                            fontWeight: 800
                        }}
                        disabled={loading}
                    >
                        {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Tunggu...</> : confirmText}
                    </button>
                </div>
            )}
        >
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: `${getColor()}15`,
                    color: getColor(),
                    fontSize: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    transform: 'rotate(-5deg)',
                    boxShadow: `0 10px 20px -5px ${getColor()}30`
                }}>
                    <i className={`fas ${getIcon()}`}></i>
                </div>
                <h3 style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    marginBottom: '0.75rem',
                    color: '#0f172a',
                    letterSpacing: '-0.5px'
                }}>{title}</h3>
                <p style={{
                    color: '#64748b',
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    fontWeight: 500
                }}>{message}</p>
            </div>
        </Modal>
    );
}
