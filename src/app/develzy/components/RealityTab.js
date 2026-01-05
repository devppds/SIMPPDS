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
            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reality Check & System Truth</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Lapisan kebenaran sistem. Mendeteksi anomali tersembunyi, traffic bayangan, dan deviasi kepercayaan.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>

                {/* Layer 11: Reality Check */}
                <div className="develzy-card">
                    <div className="flex items-center gap-2 mb-4">
                        <i className="fas fa-balance-scale text-blue-400 text-xl"></i>
                        <h4 className="font-bold text-gray-200">Drift Detector (Config vs Reality)</h4>
                    </div>
                    <div className="space-y-3">
                        {drifts.map((d, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', borderLeft: d.severity === 'high' ? '3px solid #ef4444' : '3px solid #f59e0b' }}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-sm text-gray-300">{d.item}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${d.severity === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>{d.severity.toUpperCase()}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex justify-between">
                                    <span>Ideal: <span className="text-slate-300">{d.ideal}</span></span>
                                    <span>Actual: <span className="text-red-400 font-mono">{d.actual}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Layer 14: Dark Traffic & Phantom Load */}
                <div className="develzy-card">
                    <div className="flex items-center gap-2 mb-4">
                        <i className="fas fa-ghost text-purple-400 text-xl"></i>
                        <h4 className="font-bold text-gray-200">Dark Traffic & Phantom Load</h4>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                            <span>Legitimate Load</span>
                            <span>Phantom Load ({trafficStats.phantom}%)</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: '#334155', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${trafficStats.legit}%`, background: '#10b981' }}></div>
                            <div className="pulse-danger" style={{ width: `${trafficStats.phantom}%`, background: '#a855f7' }}></div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {trafficStats.sources.map((src, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                <i className="fas fa-circle text-[6px] text-purple-500"></i>
                                {src}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => { setSinkholeActive(true); showToast("Phantom Traffic dialihkan ke Sinkhole.", "success"); }}
                        disabled={sinkholeActive}
                        className="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
                        style={{
                            background: sinkholeActive ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.2)',
                            color: sinkholeActive ? '#a855f7' : '#d8b4fe',
                            border: `1px solid ${sinkholeActive ? 'transparent' : '#a855f7'}`
                        }}
                    >
                        {sinkholeActive ? <><i className="fas fa-check mr-2"></i> Sinkhole Active</> : <><i className="fas fa-filter mr-2"></i> Activate Sinkhole</>}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">Mengalihkan beban hantu ke /dev/null</p>
                </div>

                {/* Layer 13: Trust Engine */}
                <div className="develzy-card" style={{ gridColumn: 'span 2' }}> // Wide card
                    <div className="flex items-center gap-2 mb-4">
                        <i className="fas fa-user-check text-emerald-400 text-xl"></i>
                        <h4 className="font-bold text-gray-200">Trust & Legitimacy Engine</h4>
                    </div>

                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}>
                                    <th style={{ textAlign: 'left', padding: '10px' }}>User Entitas</th>
                                    <th style={{ textAlign: 'left', padding: '10px' }}>Trust Score</th>
                                    <th style={{ textAlign: 'left', padding: '10px' }}>Status Analisis</th>
                                    <th style={{ textAlign: 'right', padding: '10px' }}>Rekomendasi Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trustScores.map((t, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '12px 10px', color: '#f1f5f9', fontWeight: 600 }}>{t.user}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '4px', background: '#334155', borderRadius: '2px', width: '60px' }}>
                                                    <div style={{ width: `${t.score}%`, background: t.score > 80 ? '#10b981' : t.score > 50 ? '#f59e0b' : '#ef4444', height: '100%' }}></div>
                                                </div>
                                                <span className={t.score > 80 ? 'text-emerald-400' : 'text-red-400'}>{t.score}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <span style={{ color: t.score > 80 ? '#94a3b8' : '#f87171' }}>{t.status}</span>
                                            {t.msg && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.msg}</div>}
                                        </td>
                                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                            {t.score < 60 && (
                                                <button className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-bold hover:bg-red-500/20">
                                                    FREEZE
                                                </button>
                                            )}
                                            {t.score >= 60 && <span className="text-xs text-slate-600 italic">No action needed</span>}
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
