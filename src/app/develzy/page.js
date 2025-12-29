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

    // Real Data State
    const [logs, setLogs] = useState([]);
    const [configs, setConfigs] = useState({
        nama_instansi: 'Pondok Pesantren Darussalam Lirboyo',
        tahun_ajaran: '2025/2026',
        deskripsi: 'Sistem Informasi Manajemen Terpadu Pondok Pesantren Darussalam Lirboyo'
    });

    // Placeholder stats
    const [systemStats] = useState({
        uptime: 'Running',
        requests: 'Calculating...',
        bandwidth: 'Unknown',
        cpu: 'Optimal',
        memory: 'Stable'
    });

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin, activeTab]);

    const loadData = async () => {
        try {
            if (activeTab === 'audit') {
                const res = await apiCall('getAuditLogs', 'GET');
                setLogs(Array.isArray(res) ? res : []);
            }
            if (activeTab === 'general') {
                const res = await apiCall('getConfigs', 'GET');
                if (res && Array.isArray(res)) {
                    const newConfigs = { ...configs };
                    res.forEach(item => {
                        if (item.key === 'nama_instansi') newConfigs.nama_instansi = item.value;
                        if (item.key === 'tahun_ajaran') newConfigs.tahun_ajaran = item.value;
                        if (item.key === 'deskripsi') newConfigs.deskripsi = item.value;
                    });
                    setConfigs(newConfigs);
                }
            }
        } catch (e) {
            console.error("Load data error:", e);
            if (e.message.includes('Unauthorized') || e.message.includes('Forbidden')) {
                showToast("Akses ditolak. Pastikan Anda login sebagai Admin.", "error");
            }
        }
    };

    const handleSaveConfig = async () => {
        try {
            await apiCall('updateConfig', 'POST', { data: { key: 'nama_instansi', value: configs.nama_instansi } });
            await apiCall('updateConfig', 'POST', { data: { key: 'tahun_ajaran', value: configs.tahun_ajaran } });
            await apiCall('updateConfig', 'POST', { data: { key: 'deskripsi', value: configs.deskripsi } });
            showToast("Konfigurasi global berhasil disimpan!", "success");
        } catch (e) {
            console.error("Save config error:", e);
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        }
    };

    const handleInitSystem = async () => {
        // Create custom modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 32px;
                padding: 4rem 3.5rem;
                max-width: 680px;
                width: 90%;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 2rem;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        border-radius: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
                    ">
                        <i class="fas fa-database" style="font-size: 3.5rem; color: white;"></i>
                    </div>
                    <h2 class="outfit" style="
                        font-size: 2.25rem;
                        font-weight: 900;
                        color: #1e293b;
                        margin-bottom: 1.25rem;
                        letter-spacing: -0.5px;
                    ">Inisialisasi Database System</h2>
                    <p style="
                        font-size: 1.2rem;
                        color: #64748b;
                        line-height: 1.7;
                        margin: 0;
                        max-width: 500px;
                        margin: 0 auto;
                    ">
                        Sistem akan membuat tabel <strong style="color: #3b82f6; font-weight: 800;">audit_logs</strong> dan 
                        <strong style="color: #3b82f6; font-weight: 800;">system_configs</strong> di database Anda.
                        <br><br>
                        <span style="
                            display: inline-block;
                            background: #ecfdf5;
                            color: #047857;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-size: 1.05rem;
                            font-weight: 700;
                            margin-top: 1rem;
                            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
                        ">
                            <i class="fas fa-check-circle" style="margin-right: 8px; font-size: 1.1rem;"></i>
                            Aman dilakukan berulang kali
                        </span>
                    </p>
                </div>
                <div style="
                    display: flex;
                    gap: 1.25rem;
                    margin-top: 2.5rem;
                ">
                    <button id="cancelInit" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                        Batal
                    </button>
                    <button id="confirmInit" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: none;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        color: white;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.35)'">
                        <i class="fas fa-rocket" style="margin-right: 10px; font-size: 1.15rem;"></i>
                        Mulai Inisialisasi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Handle button clicks
        const confirmBtn = modal.querySelector('#confirmInit');
        const cancelBtn = modal.querySelector('#cancelInit');

        confirmBtn.onclick = async () => {
            modal.remove();
            style.remove();
            try {
                await apiCall('initSystem', 'GET');
                showToast("System Tables Ready!", "success");
                loadData();
            } catch (e) {
                showToast("Gagal inisialisasi: " + e.message, "error");
            }
        };

        cancelBtn.onclick = () => {
            modal.remove();
            style.remove();
        };

        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        };
    };

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
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={configs.nama_instansi}
                                        onChange={e => setConfigs({ ...configs, nama_instansi: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tahun Ajaran Aktif</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={configs.tahun_ajaran}
                                        onChange={e => setConfigs({ ...configs, tahun_ajaran: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi Sistem (Meta)</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={configs.deskripsi}
                                    onChange={e => setConfigs({ ...configs, deskripsi: e.target.value })}
                                ></textarea>
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveConfig} style={{ marginTop: '1rem' }}>Simpan Konfigurasi</button>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Audit Trail & Security Logs</h1>
                                <button className="btn btn-secondary" onClick={loadData}><i className="fas fa-sync"></i> Refresh</button>
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

                            <div style={{ border: '1.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>User Action</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>IP / Role</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada catatan aktivitas.</td>
                                            </tr>
                                        ) : logs.map((log, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '12px 20px', fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: 700 }}>{log.username} <span style={{ fontWeight: 400, opacity: 0.7 }}>melakukan</span> <span style={{ color: 'var(--primary)' }}>{log.action}</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {log.target_type} ({log.target_id || '-'})</div>
                                                    {log.details && <div style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>{log.details}</div>}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem' }}>
                                                    <div>{log.ip_address}</div>
                                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8' }}>{log.role}</div>
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    {new Date(log.timestamp).toLocaleString('id-ID')}
                                                </td>
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

                            <div style={{ marginBottom: '2rem', padding: '20px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                                <h4 style={{ color: '#047857', marginBottom: '10px' }}>Database Maintenance</h4>
                                <p style={{ fontSize: '0.9rem', color: '#065f46', marginBottom: '15px' }}>
                                    Jika ini pertama kali panel digunakan, silakan inisialisasi tabel sistem (Config & Audit Log) agar fitur berjalan normal.
                                </p>
                                <button className="btn btn-primary" onClick={handleInitSystem} style={{ background: '#059669' }}>
                                    <i className="fas fa-database" style={{ marginRight: '8px' }}></i> Initialize System Tables
                                </button>
                            </div>

                            <div style={{ background: '#0f172a', borderRadius: '16px', padding: '1.5rem', color: '#10b981', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                <div>[System] Ready to monitor events.</div>
                                <div>[Worker] Edge Runtime Active</div>
                                <div>[DB] Binding status: Checked.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
