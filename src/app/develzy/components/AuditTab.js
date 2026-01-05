'use client';

import React from 'react';

export default function AuditTab({ logs, pagination, onPageChange, onRefresh }) {
    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Audit Trail & Security Logs</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i> Data log dihapus otomatis setiap 24 jam untuk menjaga performa.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={onRefresh}><i className="fas fa-sync"></i> Refresh</button>
            </div>

            {logs.length === 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '20px', background: '#fef3c7', borderRadius: '16px', border: '1px solid #fbbf24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-info-circle" style={{ fontSize: '1.5rem', color: '#d97706' }}></i>
                        <div>
                            <h4 style={{ color: '#92400e', marginBottom: '6px', fontWeight: 700 }}>Belum Ada Data Audit Log</h4>
                            <p style={{ fontSize: '0.9rem', color: '#78350f', margin: 0 }}>
                                Jika ini pertama kali Anda mengakses panel ini, silakan ke tab <strong>System Health</strong> dan klik tombol <strong>"Initialize System Tables"</strong> terlebih dahulu.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="develzy-audit-table-container">
                <table className="develzy-table">
                    <thead>
                        <tr>
                            <th>User Action</th>
                            <th>IP / Role</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada catatan aktivitas.</td>
                            </tr>
                        ) : logs.map((log, i) => (
                            <tr key={i}>
                                <td>
                                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{log.username} <span style={{ fontWeight: 400, opacity: 0.7 }}>melakukan</span> <span style={{ color: '#10b981' }}>{log.action}</span></div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Target: {log.target_type} ({log.target_id || '-'})</div>
                                    {log.details && <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', color: '#94a3b8' }}>{log.details}</div>}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                    <div>{log.ip_address}</div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8' }}>{log.role}</div>
                                </td>
                                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    {new Date(log.timestamp).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    className="btn"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                >
                    <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>
                    Sebelumnya
                </button>
                <div style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#cbd5e1'
                }}>
                    Halaman {pagination.page} / {pagination.totalPages}
                </div>
                <button
                    className="btn"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                >
                    Selanjutnya
                    <i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
                </button>
            </div>
        </div>
    );
}
