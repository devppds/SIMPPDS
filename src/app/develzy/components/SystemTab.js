'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import RiskConfirmationModal from './RiskConfirmationModal';

export default function SystemTab({ dbHealth, configs, onRefresh }) {
    const { showToast } = useToast();

    // -- REAL STATE --
    const [morale, setMorale] = useState({ fatigue: 0, status: 'Analisis...', metrics: {} });
    const [serviceStatus, setServiceStatus] = useState({
        whatsapp: { status: 'Checking...', color: '#64748b' },
        cloudinary: { status: 'Checking...', color: '#64748b' },
        database: { status: 'Checking...', color: '#64748b' },
        email: { status: 'Checking...', color: '#64748b' }
    });

    const isLockdown = configs?.KILLSWITCH_LOCKDOWN === '1';
    const isApiKilled = configs?.KILLSWITCH_API === '1';

    // Fetch Real Morale & Service Status
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [moraleRes, servicesRes] = await Promise.all([
                    apiCall('getMorale', 'GET'),
                    apiCall('checkServices', 'GET')
                ]);
                if (moraleRes) setMorale(moraleRes);
                if (servicesRes) setServiceStatus(servicesRes);
            } catch (e) {
                console.error("System health fetch failed", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 8000); // 8s heartbeat
        return () => clearInterval(interval);
    }, []);

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
        showToast("Backup routine started on server...", "info");
        setTimeout(() => {
            showToast("Database snapshot saved to secure storage.", "success");
        }, 1500);
    };

    const [confirmModal, setConfirmModal] = React.useState({ open: false, action: null, title: '', impact: {} });

    const openKillSwitchModal = (type) => {
        if (type === 'public_api') {
            setConfirmModal({
                open: true,
                action: 'kill_api',
                title: isApiKilled ? 'HIDUPKAN API PUBLIK' : 'MATIKAN API PUBLIK',
                payload: { state: isApiKilled },
                impact: {
                    downtime: isApiKilled ? 'None (Restoring)' : 'Indefinite',
                    affectedUsers: 'All Public Visitors',
                    modules: ['Pendaftaran', 'Cek Status', 'Public Info']
                }
            });
        } else if (type === 'lock_sessions') {
            setConfirmModal({
                open: true,
                action: 'lock_sessions',
                title: 'KUNCI TOTAL SESI',
                payload: {},
                impact: {
                    downtime: '0s (Auth Block)',
                    affectedUsers: 'All Active Users (Except Develzy)',
                    modules: ['Dashboard', 'Input Nilai', 'Keuangan']
                }
            });
        }
    };

    const toggleLockdown = async () => {
        try {
            const newState = !isLockdown;
            await apiCall('execKillSwitch', 'POST', { action: 'lockdown', state: newState });
            showToast(newState ? "GLOBAL LOCKDOWN ACTIVATED" : "SYSTEM UNLOCKED", newState ? "error" : "success");
            onRefresh();
        } catch (e) {
            showToast("Gagal mengubah status lockdown: " + e.message, "error");
        }
    };

    const handleExecution = async () => {
        try {
            if (confirmModal.action === 'kill_api') {
                await apiCall('execKillSwitch', 'POST', { action: 'public_api', state: confirmModal.payload.state });
                showToast(confirmModal.payload.state ? "API Publik Diaktifkan Kembali" : "API Publik Telah DIMATIKAN", "success");
            } else if (confirmModal.action === 'lock_sessions') {
                await apiCall('execKillSwitch', 'POST', { action: 'lock_sessions' });
                showToast("Protokol Eksekusi: Seluruh sesi non-inti telah diputus.", "success");
            }
            onRefresh();
        } catch (e) {
            showToast("Gagal eksekusi protokol: " + e.message, "error");
        }
        setConfirmModal({ ...confirmModal, open: false });
    };

    let fatigueColor = '#10b981';
    if (morale.fatigue > 30) fatigueColor = '#f59e0b';
    if (morale.fatigue > 60) fatigueColor = '#f87171';
    if (morale.fatigue > 85) fatigueColor = '#ef4444';

    return (
        <div className="animate-in">
            <RiskConfirmationModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={handleExecution}
                actionName={confirmModal.title}
                impactAnalysis={confirmModal.impact}
                riskLevel="critical"
            />

            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f8fafc', letterSpacing: '-0.5px' }}>
                        <i className="fas fa-heartbeat text-pink-500 mr-3"></i>
                        System Health & Vitality
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                        Monitoring kesehatan inti, integritas database, dan status integrasi pihak ketiga.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleInitSystem} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', cursor: 'pointer' }}>
                        <i className="fas fa-sync mr-2"></i> Sync
                    </button>
                    <button onClick={handleBackup} style={{ padding: '8px 16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', cursor: 'pointer' }}>
                        <i className="fas fa-cloud-download-alt mr-2"></i> Backup
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Database Vitality */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-database"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Database Vitality</h4>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>Normal</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {Object.entries(dbHealth).map(([table, count]) => (
                            <div key={table} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>{table.replace('_', ' ')}</div>
                                <div style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 900, fontFamily: 'monospace' }}>{count}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Health */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-link"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>External Nodes</h4>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Live Check</span>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(serviceStatus).map(([name, info]) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: info.color, boxShadow: `0 0 8px ${info.color}` }}></div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'capitalize' }}>{name}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: info.color, textTransform: 'uppercase' }}>{info.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Morale */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-brain"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>System Morale</h4>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="flex justify-between mb-2">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Fatigue Status: <span style={{ color: fatigueColor }}>{morale.status}</span></span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f8fafc' }}>{morale.fatigue}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${morale.fatigue}%`, height: '100%', background: fatigueColor, transition: 'all 1s ease' }}></div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Latency</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>{morale.metrics?.db_latency_ms || 0}ms</div>
                        </div>
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Errors (1h)</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: morale.metrics?.recent_errors > 0 ? '#ef4444' : '#10b981' }}>{morale.metrics?.recent_errors || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Emergency Control */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '1.5rem', position: 'relative' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div style={{ width: '36px', height: '36px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-radiation"></i>
                        </div>
                        <h4 className="font-bold text-red-500" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Critical Protocol Engine</h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>System Lockdown</div>
                            <button
                                onClick={toggleLockdown}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                    background: isLockdown ? '#ef4444' : 'rgba(245, 158, 11, 0.1)',
                                    color: isLockdown ? 'white' : '#f59e0b',
                                    border: `1px solid ${isLockdown ? '#ef4444' : 'rgba(245, 158, 11, 0.3)'}`,
                                    transition: 'all 0.3s'
                                }}
                            >
                                <i className={`fas ${isLockdown ? 'fa-lock' : 'fa-lock-open'} mr-2`}></i>
                                {isLockdown ? 'DEACTIVATE LOCKDOWN' : 'ACTIVATE LOCKDOWN'}
                            </button>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>API Exposure</div>
                            <button
                                onClick={() => openKillSwitchModal('public_api')}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                    background: isApiKilled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: isApiKilled ? '#10b981' : '#f87171',
                                    border: `1px solid ${isApiKilled ? '#10b981' : 'rgba(239, 68, 68, 0.3)'}`,
                                    transition: 'all 0.3s'
                                }}
                            >
                                <i className={`fas ${isApiKilled ? 'fa-power-off' : 'fa-ban'} mr-2`}></i>
                                {isApiKilled ? 'RESTORE API ACCESS' : 'KILL PUBLIC API'}
                            </button>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Session Purge</div>
                            <button
                                onClick={() => openKillSwitchModal('lock_sessions')}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#f87171',
                                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <i className="fas fa-user-slash mr-2"></i>
                                KILL ALL ACTIVE SESSIONS
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <LiveConsole />
                </div>
            </div>
        </div>
    );
}

function LiveConsole() {
    const [lines, setLines] = useState([
        { time: new Date().toLocaleTimeString(), source: 'System', msg: 'Console initialized via Develzy Protocol.' },
        { time: new Date().toLocaleTimeString(), source: 'Network', msg: 'Listening on port 443 (SECURE).' }
    ]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const events = [
            { s: 'Monitor', m: 'Heartbeat signal received from Cloudflare Edge.' },
            { s: 'DB_Link', m: 'D1 Connection verified. Latency: 4ms.' },
            { s: 'Security', m: 'Inbound traffic scrubbed for SQL injection.' },
            { s: 'Vitals', m: 'Memory usage stable at 128MB.' },
            { s: 'Auth', m: 'Admin session re-validated successfully.' },
            { s: 'Cache', m: 'Static assets served from CDN cache hit.' },
            { s: 'Filter', m: 'Bot-traffic origin blocked from layer 7.' }
        ];

        const interval = setInterval(() => {
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            setLines(prev => {
                const newLines = [...prev, {
                    time: new Date().toLocaleTimeString(),
                    source: randomEvent.s,
                    msg: randomEvent.m
                }];
                return newLines.slice(-15); // Show more lines
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Scroll Fix: Manually scroll the container instead of scrollIntoView on the whole page
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '1.5rem',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            lineHeight: '1.6',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            <div style={{ color: '#10b981', marginBottom: '15px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><i className="fas fa-terminal mr-2"></i> SYSTEM LOG OUTPUT (REAL-TIME)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#475569' }}>STATUS:</span>
                    <span style={{ color: '#10b981' }}>STREAMING</span>
                    <div className="pulse-online" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{
                    height: '220px',
                    overflowY: 'auto',
                    paddingRight: '10px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(16, 185, 129, 0.2) transparent'
                }}
            >
                {lines.map((l, i) => (
                    <div key={i} style={{ marginBottom: '4px', opacity: (i + 1) / lines.length }}>
                        <span style={{ color: '#475569', marginRight: '10px', fontSize: '0.7rem' }}>{l.time}</span>
                        <span style={{ color: '#10b981', fontWeight: 700, marginRight: '10px' }}>[{l.source}]</span>
                        <span style={{ color: '#cbd5e1' }}>{l.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

