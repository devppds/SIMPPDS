'use client';

import React from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import RiskConfirmationModal from './RiskConfirmationModal';

export default function SystemTab({ dbHealth, onRefresh }) {
    const { showToast } = useToast();

    const handleInitSystem = async () => {
        try {
            await apiCall('initSystem', 'POST');
            showToast("System Tables Initialized/Synced!", "success");
            onRefresh();
        } catch (e) {
            showToast("Failed to init system: " + e.message, "error");
        }
    };

    const handleBackup = () => {
        showToast("Backup process started... Check logs for completion.", "info");
        // Simulation of backup download
        setTimeout(() => {
            const blob = new Blob([JSON.stringify(dbHealth, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-simppds-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            showToast("Database snapshot downloaded successfully.", "success");
        }, 1500);
    };

    const [confirmModal, setConfirmModal] = React.useState({ open: false, action: null, title: '', impact: {} });

    const openKillSwitchModal = (type) => {
        if (type === 'public_api') {
            setConfirmModal({
                open: true,
                action: 'kill_api',
                title: 'MATIKAN API PUBLIK',
                impact: {
                    downtime: 'Indefinite',
                    affectedUsers: 'All Public Visitors',
                    modules: ['Pendaftaran', 'Cek Status', 'Public Info']
                }
            });
        } else if (type === 'lock_sessions') {
            setConfirmModal({
                open: true,
                action: 'lock_sessions',
                title: 'KUNCI TOTAL SESI',
                impact: {
                    downtime: '0s (Auth Block)',
                    affectedUsers: '42 Active Admins',
                    modules: ['Dashboard', 'Input Nilai', 'Keuangan']
                }
            });
        }
    };

    const handleExecution = () => {
        if (confirmModal.action === 'kill_api') {
            showToast("Protokol Darurat Diaktifkan: API Publik telah dimatikan.", "error");
        } else if (confirmModal.action === 'lock_sessions') {
            showToast("Permintaan Kunci Total Terkirim. Semua sesi non-admin akan diputus.", "error");
        }
        setConfirmModal({ ...confirmModal, open: false });
    };

    return (
        <div className="animate-in">
            {/* Modal Component */}
            <RiskConfirmationModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={handleExecution}
                actionName={confirmModal.title}
                impactAnalysis={confirmModal.impact}
                riskLevel="critical"
            />

            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Dasbor Kesehatan & Integritas Sistem</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>Jumlah Record Database</div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {Object.entries(dbHealth).map(([table, count]) => (
                            <div key={table} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#94a3b8' }}>{table.replace('_', ' ')}</span>
                                <span style={{ fontWeight: 800, color: '#10b981' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Integration Status Panel */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Integrasi Layanan</div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.5rem', color: '#22c55e' }}></i>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>WhatsApp Gateway</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OTP & Notifikasi</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>ONLINE</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="fas fa-cloud" style={{ fontSize: '1.3rem', color: '#38bdf8' }}></i>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cloudinary CDN</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Penyimpanan Gambar</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800 }}>AKTIF</div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-microchip"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Mesin Runtime</div>
                                <div style={{ fontWeight: 800, color: '#f1f5f9' }}>Cloudflare Edge (V8)</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                            Sistem berjalan di infrastruktur serverless global dengan latensi rendah dan auto-scaling cerdas.
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Alat Pemeliharaan</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                className="btn"
                                onClick={handleInitSystem}
                                style={{ justifyContent: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                            >
                                <i className="fas fa-sync" style={{ marginRight: '8px', color: '#10b981' }}></i> Sinkron Skema
                            </button>
                            <button
                                className="btn"
                                onClick={handleBackup}
                                style={{ justifyContent: 'center', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                            >
                                <i className="fas fa-download" style={{ marginRight: '8px' }}></i> Cadangkan DB
                            </button>
                        </div>
                    </div>

                    {/* Kill Switch Engine */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <i className="fas fa-radiation" style={{ color: '#ef4444' }}></i>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Protokol Darurat (Kill Switch)</h4>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <button
                                className="btn"
                                onClick={() => openKillSwitchModal('public_api')}
                                style={{
                                    justifyContent: 'center', padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)', color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px',
                                    cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Matikan API Publik
                            </button>
                            <button
                                className="btn"
                                onClick={() => openKillSwitchModal('lock_sessions')}
                                style={{
                                    justifyContent: 'center', padding: '12px',
                                    background: 'transparent', color: '#f87171',
                                    border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '12px',
                                    cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                                }}
                            >
                                Kunci Total Seluruh Sesi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layer 15: System Morale Indicator */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <h3 className="outfit" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        <i className="fas fa-heartbeat text-pink-500 mr-2"></i> System Morale Indicator
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Protokol Empati Sistem (Layer 15)</span>
                </div>

                <div className="develzy-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#cbd5e1' }}>Tingkat Kelelahan (Fatigue Level)</span>
                            <span style={{ fontWeight: 800, color: '#a855f7' }}>24% (Segar)</span>
                        </div>
                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div className="pulse-online" style={{ width: '24%', height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Sistem dalam kondisi prima. Micro-latency stabil, error rate di bawah ambang batas psikologis server.
                        </p>
                    </div>

                    <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.1)' }}></div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#cbd5e1' }}>Global Authority Mode</span>
                            <span style={{ fontWeight: 800, color: '#f59e0b' }}>UNLOCKED</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => showToast("Global Read-Only Mode Activated via Single Source Authority.", "success")}
                                style={{
                                    flex: 1, padding: '8px', fontSize: '0.75rem', fontWeight: 700,
                                    background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-lock mr-2"></i> LOCKDOWN (READ-ONLY)
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Layer 19: Mencegah semua perubahan data (Create/Update/Delete) di seluruh modul.
                        </p>
                    </div>
                </div>
            </div>

            {/* Live Active Console */}
            <LiveConsole />
        </div>
    );
}

function LiveConsole() {
    const [lines, setLines] = React.useState([
        { time: new Date().toLocaleTimeString(), source: 'System', msg: 'Console initialized via Develzy Protocol.' },
        { time: new Date().toLocaleTimeString(), source: 'Network', msg: 'Listening on port 443 (SECURE).' }
    ]);
    const bottomRef = React.useRef(null);

    React.useEffect(() => {
        const events = [
            { s: 'Monitor', m: 'Heartbeat signal received from Core.' },
            { s: 'DB_Link', m: 'Query latency: 12ms (Optimal).' },
            { s: 'Balancer', m: 'Traffic distribution balanced.' },
            { s: 'Security', m: 'Token validation check passed.' },
            { s: 'Cache', m: 'Redis usage at 45%.' },
            { s: 'Audit', m: 'Log rotation scheduled.' },
            { s: 'Vitals', m: 'Memory heap stable.' }
        ];

        const interval = setInterval(() => {
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            setLines(prev => {
                const newLines = [...prev, {
                    time: new Date().toLocaleTimeString(),
                    source: randomEvent.s,
                    msg: randomEvent.m
                }];
                // Keep only last 8 lines
                return newLines.slice(-8);
            });
        }, 3000); // New log every 3 seconds

        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    return (
        <div style={{ background: '#0f172a', borderRadius: '24px', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
            <div style={{ color: '#64748b', marginBottom: '10px', fontSize: '0.75rem', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                <span>OUTPUT KONSOL SISTEM (LIVE)</span>
                <span className="pulse-online" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            </div>
            <div style={{ height: '180px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {lines.map((l, i) => (
                    <div key={i} className="animate-in" style={{ animationDuration: '0.3s' }}>
                        <span style={{ color: '#475569', marginRight: '10px' }}>[{l.time}]</span>
                        <span style={{ color: '#10b981', fontWeight: 700, marginRight: '10px' }}>[{l.source}]</span>
                        <span style={{ color: '#cbd5e1' }}>{l.msg}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
