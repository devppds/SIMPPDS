'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';

export default function RealityTab() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [sinkholeActive, setSinkholeActive] = useState(false);

    // REAL STATE
    const [drifts, setDrifts] = useState([]);
    const [trustScores, setTrustScores] = useState([]);
    const [trafficStats, setTrafficStats] = useState({ legit: 100, phantom: 0, sources: [] });

    const fetchReality = async () => {
        try {
            const res = await apiCall('getReality', 'GET');
            if (res) {
                setDrifts(res.drifts || []);
                setTrustScores(res.trustScores || []);
                setTrafficStats({
                    legit: res.phantom?.legit || 100,
                    phantom: res.phantom?.phantom || 0,
                    sources: res.phantom?.sources || []
                });
            }
        } catch (e) {
            console.error("Reality Check Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReality();
        const interval = setInterval(fetchReality, 10000); // 10s heartbeat
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Syncing with Reality Layers...</div>;

    return (
        <div className="animate-in">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f8fafc', letterSpacing: '-0.5px' }}>
                        <i className="fas fa-microscope text-blue-400 mr-3"></i>
                        Reality Check & System Truth
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                        Lapisan kebenaran sistem. Mendeteksi anomali tersembunyi, traffic bayangan, dan deviasi kepercayaan.
                    </p>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <i className="fas fa-radar fa-spin mr-2"></i> Scanning Layers
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Layer 11: Reality Check */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #3b82f6, transparent)' }}></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-balance-scale"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Drift Detector</h4>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Config vs Reality</span>
                    </div>

                    <div className="space-y-4">
                        {drifts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                                <i className="fas fa-check-double block mb-2 text-2xl opacity-20"></i>
                                Semua konfigurasi sinkron.
                            </div>
                        ) : drifts.map((d, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                <div className="flex justify-between mb-3">
                                    <span className="font-bold text-sm text-gray-100">{d.item}</span>
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px',
                                        background: d.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: d.severity === 'high' ? '#ef4444' : '#f59e0b',
                                        border: `1px solid ${d.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                        boxShadow: d.severity === 'high' ? '0 0 10px rgba(239, 68, 68, 0.1)' : 'none'
                                    }}>
                                        {d.severity.toUpperCase()} ALERT
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Standard</div>
                                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>{d.ideal}</div>
                                    </div>
                                    <div style={{ padding: '8px', background: d.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', border: d.severity === 'high' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Factum</div>
                                        <div className={d.severity === 'high' ? 'pulse-danger' : ''} style={{ fontSize: '0.85rem', color: d.severity === 'high' ? '#ef4444' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>{d.actual}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Layer 14: Dark Traffic & Phantom Load */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #a855f7, transparent)' }}></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-ghost"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Phantom Load Analyzer</h4>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Dark Traffic Layer</span>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Load Distribution</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#a855f7' }}>{trafficStats.phantom}% ANOMALY</span>
                        </div>
                        <div style={{ height: '14px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${trafficStats.legit}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 1s ease' }}></div>
                            <div className="pulse-danger" style={{ width: `${trafficStats.phantom}%`, background: 'linear-gradient(90deg, #a855f7, #ef4444)', transition: 'width 1s ease' }}></div>
                        </div>
                        <div className="flex justify-between mt-3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>LEGITIMATE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a855f7' }}></div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PHANTOM</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '8px' }}>
                        {trafficStats.sources.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>No identified external phantom sources.</div>
                        ) : trafficStats.sources.map((src, i) => (
                            <div key={i} className="flex items-center justify-between p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-satellite-dish text-purple-500 text-xs"></i>
                                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{src}</span>
                                </div>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }}></div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => { setSinkholeActive(true); showToast("Phantom Traffic dialihkan ke Sinkhole.", "success"); }}
                        disabled={sinkholeActive}
                        className="btn w-full"
                        style={{
                            padding: '14px',
                            background: sinkholeActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                            color: sinkholeActive ? '#10b981' : '#d8b4fe',
                            border: `1px solid ${sinkholeActive ? '#10b981' : 'rgba(168, 85, 247, 0.3)'}`,
                            borderRadius: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem',
                            cursor: sinkholeActive ? 'default' : 'pointer'
                        }}
                    >
                        {sinkholeActive ? <><i className="fas fa-shield-check mr-2"></i> Sinkhole Active (Filtering)</> : <><i className="fas fa-filter mr-2"></i> Activate Sinkhole Layer</>}
                    </button>
                    <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', marginTop: '12px', fontWeight: 600 }}>Protocol 14: Diverting shadow load to null-void.</p>
                </div>

                {/* Layer 13: Trust Engine */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #10b981, transparent)' }}></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-user-check"></i>
                            </div>
                            <h4 className="font-bold text-gray-100" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Trust & Legitimacy Engine</h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800 }}>TRUSTED RATIO</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10b981' }}>{trustScores.filter(t => t.score > 80).length}/{trustScores.length}</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 15px' }}>User Context</th>
                                    <th style={{ textAlign: 'left', padding: '10px 15px' }}>Reputation Score</th>
                                    <th style={{ textAlign: 'left', padding: '10px 15px' }}>Behavior Analysis</th>
                                    <th style={{ textAlign: 'right', padding: '10px 15px' }}>Action Protocol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trustScores.map((t, i) => (
                                    <tr key={i} style={{ background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s ease' }}>
                                        <td style={{ padding: '15px', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: t.score > 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: t.score > 80 ? '#10b981' : '#f87171',
                                                    border: `1px solid ${t.score > 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
                                                }}>
                                                    <i className={t.score > 80 ? 'fas fa-shield-check' : 'fas fa-user-secret'}></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>{t.user}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>IDENTITY VERIFIED</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', width: '80px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${t.score}%`, background: t.score > 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : t.score > 50 ? '#f59e0b' : '#ef4444', height: '100%', transition: 'all 1s ease' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: t.score > 80 ? '#10b981' : t.score > 50 ? '#f59e0b' : '#ef4444', fontFamily: 'monospace' }}>{t.score}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ color: t.score > 80 ? '#94a3b8' : '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>{t.status}</div>
                                            {t.msg && <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px', fontWeight: 500 }}>{t.msg}</div>}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>
                                            {t.score < 60 ? (
                                                <button className="btn" style={{ padding: '6px 14px', fontSize: '0.65rem', fontWeight: 900, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer' }}>
                                                    <i className="fas fa-lock mr-2"></i> FREEZE
                                                </button>
                                            ) : (
                                                <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                                    AUTHENTIC
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
