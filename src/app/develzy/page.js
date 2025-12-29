'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';

export default function DevelzyControlPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(false);

    // Placeholder data for stats
    const [systemStats] = useState({
        uptime: '12 Hari, 4 Jam',
        requests: '1.2k today',
        bandwidth: '240MB used',
        cpu: '18%',
        memory: '312MB'
    });

    if (!isAdmin) {
        return (
            <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1.5rem' }}></i>
                    <h1 className="outfit">Akses Dibatasi</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Halaman ini hanya untuk Administrator Utama (DEVELZY).</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Global Config', icon: 'fas fa-globe' },
        { id: 'branding', label: 'Branding & UI', icon: 'fas fa-paint-brush' },
        { id: 'integration', label: 'API Integrations', icon: 'fas fa-plug' },
        { id: 'audit', label: 'Audit Logs', icon: 'fas fa-history' },
        { id: 'system', label: 'System Health', icon: 'fas fa-heartbeat' },
    ];

    return (
        <div className="view-container">
            {/* Hero Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
                borderRadius: '32px',
                padding: '3rem',
                color: 'white',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(30, 58, 138, 0.3)'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        <i className="fas fa-rocket"></i>
                        Core System Control
                    </div>
                    <h1 className="outfit" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>DEVELZY Control</h1>
                    <p style={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: '600px' }}>
                        Pusat kendali operasional tingkat tinggi untuk konfigurasi infrastruktur,
                        manajemen layanan, dan pemantauan sistem secara real-time.
                    </p>
                </div>
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute', right: '-50px', top: '-50px',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)', zIndex: 1
                }}></div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'System Uptime', value: systemStats.uptime, icon: 'fas fa-clock', color: '#2563eb' },
                    { label: 'CPU Usage', value: systemStats.cpu, icon: 'fas fa-microchip', color: '#10b981' },
                    { label: 'Memory', value: systemStats.memory, icon: 'fas fa-memory', color: '#8b5cf6' },
                    { label: 'Maintenance', value: maintenanceMode ? 'OFFLINE' : 'LIVE', icon: 'fas fa-power-off', color: maintenanceMode ? '#ef4444' : '#10b981' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <i className={stat.icon}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) 1fr', gap: '2.5rem' }}>
                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                border: 'none',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontWeight: activeTab === tab.id ? 800 : 600,
                                fontSize: '0.95rem',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <i className={tab.icon} style={{ width: '20px' }}></i>
                            {tab.label}
                        </button>
                    ))}

                    <div style={{ marginTop: '2rem', padding: '20px', background: '#fff1f2', borderRadius: '20px', border: '1px solid #fee2e2' }}>
                        <h4 className="outfit" style={{ color: '#be123c', fontSize: '0.9rem', marginBottom: '8px' }}>Zona Bahaya</h4>
                        <button
                            className="btn btn-primary"
                            style={{
                                width: '100%', background: '#ef4444', color: 'white',
                                border: 'none', fontSize: '0.8rem', padding: '10px'
                            }}
                            onClick={() => confirm("Aktifkan Mode Pemeliharaan? Ini akan memutus koneksi pengguna non-admin.") && setMaintenanceMode(!maintenanceMode)}
                        >
                            {maintenanceMode ? 'Disable Maintenance' : 'Maintenance Mode'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="card" style={{ padding: '2.5rem', minHeight: '500px' }}>
                    {activeTab === 'general' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Global Configuration</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Nama Instansi / Pondok</label>
                                    <input type="text" className="form-control" defaultValue="Pondok Pesantren Darussalam Lirboyo" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tahun Ajaran Aktif</label>
                                    <input type="text" className="form-control" defaultValue="2025/2026" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi Sistem (Meta)</label>
                                <textarea className="form-control" rows="3" defaultValue="Sistem Informasi Manajemen Terpadu Pondok Pesantren Darussalam Lirboyo"></textarea>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Simpan Konfigurasi</button>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Branding & UI Engine</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                <div style={{ border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px' }}>
                                    <div style={{ width: '100%', height: '100px', background: 'var(--primary)', borderRadius: '12px', marginBottom: '1rem' }}></div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Primary Color</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#2563eb (Lirboyo Blue)</div>
                                </div>
                                <div style={{ border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px' }}>
                                    <div style={{ width: '100%', height: '100px', background: '#1e1b4b', borderRadius: '12px', marginBottom: '1rem' }}></div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sidebar Theme</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Deep Navy Gradient</div>
                                </div>
                                <div style={{ border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-plus" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#94a3b8' }}>Custom Logo</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integration' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>API & Service Integrations</h3>
                            {[
                                { name: 'WhatsApp Gateway', status: 'Connected', icon: 'fab fa-whatsapp', color: '#22c55e' },
                                { name: 'Cloudinary Storage', status: 'Connected', icon: 'fas fa-cloud', color: '#3b82f6' },
                                { name: 'Database (Cloudflare D1)', status: 'Healthy', icon: 'fas fa-database', color: '#8b5cf6' },
                                { name: 'Email (SMTP)', status: 'Not Configured', icon: 'fas fa-envelope', color: '#94a3b8' },
                            ].map((service, idx) => (
                                <div key={idx} style={{
                                    padding: '1.5rem', border: '1.5px solid #f1f5f9',
                                    borderRadius: '16px', marginBottom: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${service.color}15`, color: service.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            <i className={service.icon}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{service.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: service.status === 'Connected' || service.status === 'Healthy' ? '#22c55e' : '#94a3b8', fontWeight: 700 }}>
                                                {service.status}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}>Configure</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="animate-in">
                            <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Audit Trail & Security Logs</h1>
                            <div style={{ border: '1.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>User Action</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>Timestamp</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '12px 20px', fontSize: '0.85rem' }}>
                                                    <span style={{ fontWeight: 700 }}>Admin</span> mengubah password user <code style={{ color: 'var(--primary)' }}>@bendahara</code>
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>29 Des 2025, 17:40</td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontFamily: 'monospace' }}>192.168.1.{i * 10}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>System Health Metrics</h3>
                            <div style={{ background: '#0f172a', borderRadius: '16px', padding: '1.5rem', color: '#10b981', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                <div>[2025-12-29 17:35:12] INFO: Edge Runtime starting...</div>
                                <div>[2025-12-29 17:35:13] INFO: Database connection established.</div>
                                <div>[2025-12-29 17:35:15] DEBUG: Cache warming 80% complete.</div>
                                <div>[2025-12-29 17:40:01] INFO: Daily analytics job started.</div>
                                <div style={{ color: '#fbbf24' }}>[2025-12-29 17:42:10] WARN: Higher latency detected in Singapore-1 edge node.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
