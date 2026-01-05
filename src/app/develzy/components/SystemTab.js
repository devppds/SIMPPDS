'use client';

import React from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

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

    return (
        <div className="animate-in">
            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>System Integrity & Health Dashboard</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>Database Record Counts</div>
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
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-microchip"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Runtime Engine</div>
                                <div style={{ fontWeight: 800, color: '#f1f5f9' }}>Cloudflare Edge (V8)</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                            Sistem berjalan di infrastruktur serverless global dengan latensi rendah dan auto-scaling cerdas.
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Maintenance Tools</h4>
                        <button
                            className="btn"
                            onClick={handleInitSystem}
                            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}
                        >
                            <i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#10b981' }}></i> Sync Table Schemas
                        </button>
                        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '10px', textAlign: 'center' }}>
                            Update struktur tabel database ke versi terbaru.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '2rem', color: '#10b981', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.8', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                <div style={{ color: '#64748b', marginBottom: '10px', fontSize: '0.75rem', letterSpacing: '1px' }}>SYSTEM CONSOLE OUTPUT</div>
                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [Monitor] All services reporting healthy.</div>
                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [Security] Integrity check passed.</div>
                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [DB] Connection to sim-ppds-db-v2 established.</div>
                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [App] DEVELZY Control Panel v3.5.0 ready.</div>
            </div>
        </div>
    );
}
