'use client';

import React, { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';

export default function SessionsTab({ activeSessions, onRefresh }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [kickLoading, setKickLoading] = useState(null);
    const [confirmKick, setConfirmKick] = useState({ isOpen: false, sessionId: null, username: '' });

    const handleTerminateActiveSession = (sessionId, username) => {
        setConfirmKick({ isOpen: true, sessionId, username });
    };

    const executeTerminateSession = async () => {
        const { sessionId, username } = confirmKick;
        setKickLoading(sessionId);
        try {
            await apiCall('terminateSession', 'POST', { data: { tokenId: sessionId, username } });
            showToast("User Berhasil Dikeluarkan!", "success");
            setConfirmKick({ isOpen: false, sessionId: null, username: '' });
            onRefresh();
        } catch (e) {
            showToast("Gagal mengeluarkan user: " + e.message, "error");
        } finally {
            setKickLoading(null);
        }
    };

    const safeTime = (dateStr) => {
        if (!dateStr) return '--:--';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '--:--';
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    };

    return (
        <div className="animate-in">
            <ConfirmModal
                isOpen={confirmKick.isOpen}
                onClose={() => setConfirmKick({ isOpen: false, sessionId: null, username: '' })}
                onConfirm={executeTerminateSession}
                title="Keluarkan Paksa User?"
                message={`Apakah Anda yakin ingin mengeluarkan paksa user ${confirmKick.username}? Sesi mereka akan segera dibatalkan.`}
                confirmText="Ya, Keluarkan"
                loading={kickLoading === confirmKick.sessionId}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daftar Sesi Aktif</h1>
                <button className="btn btn-secondary" onClick={onRefresh}><i className="fas fa-sync"></i> Refresh</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {activeSessions.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <i className="fas fa-users-slash" style={{ fontSize: '2.5rem', color: '#475569' }}></i>
                        </div>
                        <h3 style={{ color: '#f1f5f9', marginBottom: '8px' }}>Tidak Ada Sesi Aktif</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Semua user sedang offline atau sesi telah berakhir.</p>
                    </div>
                ) : activeSessions.map((session, i) => (
                    <div key={i} className="develzy-card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.fullname)}&background=random&color=fff&bold=true`}
                                    style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover' }}
                                    alt="User"
                                />
                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '3px solid #0f172a', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>{session.fullname}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="develzy-badge" style={{ background: session.role === 'admin' || session.role === 'develzy' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', color: session.role === 'admin' || session.role === 'develzy' ? '#f87171' : '#94a3b8' }}>{session.role}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>@{session.username}</span>
                                </div>
                            </div>
                        </div>

                        <div className="develzy-glass-card" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#475569' }}><i className="fas fa-network-wired" style={{ width: '20px' }}></i> IP Address</span>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9' }}>{session.ip_address}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#475569' }}><i className="fas fa-desktop" style={{ width: '20px' }}></i> Device</span>
                                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{session.user_agent?.includes('Windows') ? 'Windows / Laptop' : session.user_agent?.includes('Android') ? 'Android / Mobile' : 'Unknown Device'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#475569' }}><i className="fas fa-clock" style={{ width: '20px' }}></i> Login</span>
                                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{safeTime(session.login_at)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleTerminateActiveSession(session.id, session.fullname)}
                            className="develzy-btn-kick"
                            style={{
                                background: kickLoading === session.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            }}
                            disabled={kickLoading === session.id || session.username === user?.username}
                        >
                            {kickLoading === session.id ? (
                                <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Terminating...</>
                            ) : session.username === user?.username ? (
                                <><i className="fas fa-user-check" style={{ marginRight: '8px' }}></i> Active Session (You)</>
                            ) : (
                                <><i className="fas fa-power-off" style={{ marginRight: '8px' }}></i> Kick User</>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
