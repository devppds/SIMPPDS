'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

export default function IntegrationTab() {
    const { showToast } = useToast();
    const isMounted = useRef(false);
    const [loading, setLoading] = useState(false);
    const [submittingConfig, setSubmittingConfig] = useState(false);

    const [serviceStatus, setServiceStatus] = useState({
        whatsapp: { status: 'Checking...', color: '#94a3b8' },
        cloudinary: { status: 'Checking...', color: '#94a3b8' },
        database: { status: 'Checking...', color: '#94a3b8' },
        email: { status: 'Not Configured', color: '#94a3b8' }
    });

    const [configModal, setConfigModal] = useState({ isOpen: false, service: null, data: {} });

    const checkServiceStatus = async () => {
        try {
            const res = await apiCall('checkServices', 'GET');
            if (isMounted.current && res) {
                setServiceStatus(res);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleTestService = async (serviceKey) => {
        showToast(`Menguji koneksi ${serviceKey}...`, "info");
        try {
            const res = await apiCall('testService', 'POST', { service: serviceKey });
            if (res.success) {
                showToast(`Koneksi ${serviceKey} BERHASIL!`, "success");
                setServiceStatus(prev => ({
                    ...prev,
                    [serviceKey]: { status: 'Operational', color: '#10b981' }
                }));
            } else {
                throw new Error(res.message || "Unknown error");
            }
        } catch (e) {
            showToast(e.message || "Gagal melakukan pengetesan layanan.", "error");
        }
    };

    const handleOpenConfig = async (service) => {
        setLoading(true);
        try {
            const res = await apiCall('getConfigs', 'GET');
            const data = {};
            if (res && Array.isArray(res)) {
                res.forEach(item => {
                    data[item.key] = item.value;
                });
            }
            setConfigModal({ isOpen: true, service, data });
        } catch (e) {
            showToast("Gagal memuat konfigurasi", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveServiceConfig = async () => {
        setSubmittingConfig(true);
        try {
            const data = configModal.data;
            for (const [key, value] of Object.entries(data)) {
                await apiCall('updateConfig', 'POST', { data: { key, value } });
            }
            showToast(`Konfigurasi ${configModal.service.name} Berhasil Disimpan!`, "success");
            setConfigModal({ isOpen: false, service: null, data: {} });
            checkServiceStatus();
        } catch (e) {
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        } finally {
            setSubmittingConfig(false);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        checkServiceStatus();
        const interval = setInterval(() => {
            if (isMounted.current) checkServiceStatus();
        }, 30000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="animate-in">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f8fafc', letterSpacing: '-0.5px' }}>
                        <i className="fas fa-plug text-indigo-400 mr-3"></i>
                        API & Service Integrations
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                        Pintu gerbang komunikasi sistem. Kelola koneksi pihak ketiga dan integritas data eksternal.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {[
                    { name: 'WhatsApp Gateway', statusKey: 'whatsapp', icon: 'fab fa-whatsapp', desc: 'Layanan notifikasi pesan otomatis (Fonnte).' },
                    { name: 'Cloudinary Storage', statusKey: 'cloudinary', icon: 'fas fa-cloud', desc: 'Penyimpanan gambar dan aset digital.' },
                    { name: 'Database (Cloudflare D1)', statusKey: 'database', icon: 'fas fa-database', desc: 'Penyimpanan data relasional SQL inti.' },
                    { name: 'Email (SMTP)', statusKey: 'email', icon: 'fas fa-envelope', desc: 'Protokol pengiriman email sistem.' },
                ].map((service, idx) => {
                    const status = serviceStatus[service.statusKey] || { status: 'Unknown', color: '#94a3b8' };
                    const isOperational = status.status === 'Operational';

                    return (
                        <div key={idx} style={{
                            padding: '1.5rem',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isOperational ? 'linear-gradient(to bottom, #10b981, transparent)' : 'linear-gradient(to bottom, #475569, transparent)' }}></div>

                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                                <div style={{
                                    minWidth: '56px', height: '56px', borderRadius: '16px',
                                    background: isOperational ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: isOperational ? '#10b981' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.6rem', border: `1px solid ${isOperational ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                    boxShadow: isOperational ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
                                }}>
                                    <i className={service.icon}></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.1rem', letterSpacing: '0.3px' }}>{service.name}</div>
                                        <div style={{
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900,
                                            background: `${status.color}15`, color: status.color, border: `1px solid ${status.color}30`,
                                            textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {status.status}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>{service.desc}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                                {(service.statusKey === 'whatsapp' || service.statusKey === 'cloudinary') && (
                                    <button
                                        className="btn"
                                        style={{
                                            flex: 1, padding: '12px', fontSize: '0.75rem', fontWeight: 800,
                                            background: 'rgba(255,255,255,0.03)', color: '#94a3b8',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleTestService(service.statusKey)}
                                    >
                                        <i className="fas fa-vial mr-2"></i> PING STATUS
                                    </button>
                                )}
                                <button
                                    className="btn"
                                    style={{
                                        flex: 2, padding: '12px', fontSize: '0.75rem', fontWeight: 800,
                                        background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc',
                                        border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleOpenConfig(service)}
                                >
                                    <i className="fas fa-cog mr-2"></i> CONFIGURE INTERFACE
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={configModal.isOpen}
                onClose={() => setConfigModal({ isOpen: false, service: null, data: {} })}
                title={`Terminal Konfigurasi: ${configModal.service?.name}`}
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn" style={{ padding: '10px 20px', background: 'transparent', color: '#64748b', border: '1px solid #334155', borderRadius: '12px', fontWeight: 700 }} onClick={() => setConfigModal({ isOpen: false, service: null, data: {} })}>Batalkan</button>
                        <button className="btn" style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} onClick={handleSaveServiceConfig} disabled={submittingConfig}>
                            {submittingConfig ? 'Syncing...' : 'Simpan & Deploy'}
                        </button>
                    </div>
                )}
            >
                <div style={{ padding: '10px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px dashed rgba(245, 158, 11, 0.3)', display: 'flex', gap: '12px' }}>
                        <i className="fas fa-shield-exclamation" style={{ color: '#f59e0b', marginTop: '3px' }}></i>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                            <strong>Otoritas Keamanan:</strong> Parameter ini bersifat sensitif. Pengalihan endpoint atau kegagalan token akan memutus aliran data real-time layanan.
                        </p>
                    </div>

                    {configModal.service?.statusKey === 'whatsapp' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label className="develzy-label">API Gateway Interface</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    placeholder="https://api.fonnte.com/send"
                                    value={configModal.data.whatsapp_api_url || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_api_url: e.target.value } })}
                                />
                                <small style={{ color: '#475569', fontSize: '0.65rem', marginTop: '4px', display: 'block' }}>Endpoint resmi penyedia layanan WhatsApp API.</small>
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Authorization Secret (Token)</label>
                                <input
                                    type="password"
                                    className="develzy-input"
                                    placeholder="••••••••••••••••"
                                    value={configModal.data.whatsapp_token || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_token: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Default Transmission Channel (ID)</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    placeholder="DEVICE_01"
                                    value={configModal.data.whatsapp_device_id || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_device_id: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'cloudinary' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label className="develzy-label">Cloud Universe Name</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    value={configModal.data.cloudinary_cloud_name || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_cloud_name: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Public Access Key</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    value={configModal.data.cloudinary_api_key || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_api_key: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Private Cipher Secret</label>
                                <input
                                    type="password"
                                    className="develzy-input"
                                    value={configModal.data.cloudinary_api_secret || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_api_secret: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'email' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="develzy-label">SMTP Host Protocol</label>
                                    <input
                                        type="text"
                                        className="develzy-input"
                                        placeholder="smtp.gmail.com"
                                        value={configModal.data.smtp_host || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_host: e.target.value } })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="develzy-label">Net Port</label>
                                    <input
                                        type="text"
                                        className="develzy-input"
                                        placeholder="465"
                                        value={configModal.data.smtp_port || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_port: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Credential Identity (User)</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    value={configModal.data.smtp_user || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_user: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Secure Access Key (Pass)</label>
                                <input
                                    type="password"
                                    className="develzy-input"
                                    value={configModal.data.smtp_password || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_password: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Outbound Alias (Sender Email)</label>
                                <input
                                    type="email"
                                    className="develzy-input"
                                    placeholder="noreply@pondok.com"
                                    value={configModal.data.smtp_from_email || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_from_email: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'database' && (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b', fontSize: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <i className="fas fa-database"></i>
                            </div>
                            <h5 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Security Enforcement</h5>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
                                Konfigurasi basis data SQL dikunci oleh sistem. Perubahan hanya diperbolehkan melalui **Environment Secrets** di dasbor Cloudflare.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
