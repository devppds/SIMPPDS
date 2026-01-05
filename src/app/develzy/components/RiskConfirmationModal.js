'use client';

import React, { useState, useEffect } from 'react';

export default function RiskConfirmationModal({ isOpen, onClose, onConfirm, actionName, riskLevel = 'critical', impactAnalysis }) {
    const [timer, setTimer] = useState(5);
    const [confirmInput, setConfirmInput] = useState('');
    const [canConfirm, setCanConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimer(5);
            setConfirmInput('');
            setCanConfirm(false);

            const countdown = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdown);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [isOpen]);

    useEffect(() => {
        if (riskLevel === 'critical') {
            setCanConfirm(timer === 0 && confirmInput === 'SAYA PAHAM');
        } else {
            setCanConfirm(timer === 0);
        }
    }, [timer, confirmInput, riskLevel]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="animate-in" style={{
                background: '#0f172a', border: '1px solid #ef4444',
                borderRadius: '24px', width: '500px', maxWidth: '90%',
                padding: '0', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.5)'
            }}>
                {/* Header */}
                <div style={{ background: '#ef4444', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        <i className="fas fa-biohazard text-white"></i>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>HUMAN ERROR FIREWALL</h3>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Intervensi Keamanan Protokol-16</p>
                    </div>
                </div>

                <div style={{ padding: '2rem' }}>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
                            Anda akan mengeksekusi: <span style={{ color: '#ef4444', textTransform: 'uppercase' }}>{actionName}</span>
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                            Tindakan ini bersifat destruktif dan mungkin tidak dapat dibatalkan.
                        </p>
                    </div>

                    {/* Blast Radius Simulator (Layer 12) */}
                    {impactAnalysis && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-chart-pie"></i> Blast Radius Simulation
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Estimasi Downtime</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{impactAnalysis.downtime || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>User Terdampak</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{impactAnalysis.affectedUsers || '0'} User</div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Modul Terimbas</div>
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                        {impactAnalysis.modules && impactAnalysis.modules.map((m, i) => (
                                            <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#334155', color: '#cbd5e1' }}>{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirmation Input */}
                    {riskLevel === 'critical' && (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>
                                Ketik <strong style={{ color: '#ef4444' }}>SAYA PAHAM</strong> untuk konfirmasi:
                            </label>
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                                placeholder="SAYA PAHAM"
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                    color: 'white', fontWeight: 'bold', textAlign: 'center', letterSpacing: '2px'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #475569', borderRadius: '12px', color: '#cbd5e1', fontWeight: 700, cursor: 'pointer' }}
                        >
                            BATALKAN
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!canConfirm}
                            style={{
                                flex: 1, padding: '1rem',
                                background: canConfirm ? '#ef4444' : '#334155',
                                border: 'none', borderRadius: '12px',
                                color: canConfirm ? 'white' : '#64748b',
                                fontWeight: 800, cursor: canConfirm ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s'
                            }}
                        >
                            {timer > 0 ? `COOL-DOWN (${timer}s)` : 'EKSEKUSI SEKARANG'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
