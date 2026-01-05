'use client';

import React, { useState } from 'react';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';

export default function FeaturesTab({ configs, setConfigs }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(null);

    // Simulated Feature Flags (In real app, this would come from DB/Config)
    const [features, setFeatures] = useState([
        { id: 'f_payment_gateway', name: 'Payment Gateway (Xendit)', status: 'active', mode: 'production', risk: 'high' },
        { id: 'f_shadow_ban', name: 'Auto-Ban Suspicious User', status: 'active', mode: 'shadow', risk: 'medium' },
        { id: 'f_new_dashboard', name: 'Dashboard V4 (Beta)', status: 'inactive', mode: 'dev', risk: 'low' },
        { id: 'f_wa_blast', name: 'WhatsApp Blast Engine', status: 'active', mode: 'production', risk: 'high' },
        { id: 'f_ai_analyst', name: 'AI Santri Analyst', status: 'active', mode: 'shadow', risk: 'medium' },
    ]);

    const handleToggle = (id, field) => {
        setLoading(id);
        // Simulate API call
        setTimeout(() => {
            setFeatures(prev => prev.map(f => {
                if (f.id === id) {
                    const newVal = field === 'status'
                        ? (f.status === 'active' ? 'inactive' : 'active')
                        : (f.mode === 'production' ? 'shadow' : f.mode === 'shadow' ? 'dev' : 'production');

                    showToast(`Fitur ${f.name} diperbarui: ${newVal.toUpperCase()}`, "success");
                    return { ...f, [field]: newVal };
                }
                return f;
            }));
            setLoading(null);
        }, 600);
    };

    return (
        <div className="animate-in">
            <div style={{ marginBottom: '2rem' }}>
                <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ghost Layer & Feature Flags</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Kontrol visibilitas fitur tanpa redeploy. Gunakan <strong>Shadow Mode</strong> untuk menguji fitur di production tanpa diketahui user pengguna.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {features.map((feature) => (
                    <div key={feature.id} className="develzy-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderLeft: feature.status === 'active' ? '4px solid #10b981' : '4px solid #475569' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{feature.name}</h4>
                                <span className={`develzy-badge ${feature.risk === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`} style={{ border: `1px solid ${feature.risk === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                                    {feature.risk.toUpperCase()} RISK
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', alignItems: 'center' }}>
                                <code>ID: {feature.id}</code>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Mode: <span style={{ color: feature.mode === 'shadow' ? '#f59e0b' : feature.mode === 'production' ? '#10b981' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{feature.mode}</span>
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Mode Toggle */}
                            <button
                                onClick={() => handleToggle(feature.id, 'mode')}
                                className="btn"
                                disabled={loading === feature.id}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#cbd5e1',
                                    fontSize: '0.75rem',
                                    padding: '8px 12px',
                                    borderRadius: '8px'
                                }}
                            >
                                <i className="fas fa-random mr-2"></i> Switch Mode
                            </button>

                            {/* Main Toggle */}
                            <div
                                onClick={() => handleToggle(feature.id, 'status')}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    background: feature.status === 'active' ? '#10b981' : '#334155',
                                    borderRadius: '20px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '4px',
                                    left: feature.status === 'active' ? '26px' : '4px',
                                    transition: 'left 0.3s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed #f59e0b', borderRadius: '16px' }}>
                <h4 style={{ color: '#f59e0b', margin: '0 0 10px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    Peringatan Shadow Mode
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fbbf24', lineHeight: 1.6 }}>
                    Fitur dalam <strong>Shadow Mode</strong> akan berjalan di latar belakang (memproses data, mencatat log) tetapi <strong>TIDAK AKAN TAMPIL</strong> di antarmuka pengguna. Gunakan mode ini untuk memverifikasi stabilitas fitur backend sebelum rilis publik sepenuhnya.
                </p>
            </div>
        </div>
    );
}
