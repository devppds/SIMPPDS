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
                <>
                    <button className="btn btn-outline" onClick={onClose} disabled={loading}>{cancelText}</button>
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        style={{
                            background: type === 'danger' ? 'var(--danger)' : getColor(),
                            borderColor: type === 'danger' ? 'var(--danger)' : getColor()
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Memproses...' : confirmText}
                    </button>
                </>
            )}
        >
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: `${getColor()}15`,
                    color: getColor(),
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <i className={`fas ${getIcon()}`}></i>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>{title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{message}</p>
            </div>
        </Modal>
    );
}
