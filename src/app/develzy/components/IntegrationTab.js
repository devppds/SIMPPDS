'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import FileUploader from '@/components/FileUploader'; // Actually FileUploader is used in Branding, not Integration. Wait.
// Integration tab modal doesn't use FileUploader. Branding tab does.

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
            showToast("Gagal melakukan pengetesan layanan.", "error");
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
            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>API & Service Integrations</h3>
            {[
                { name: 'WhatsApp Gateway', statusKey: 'whatsapp', icon: 'fab fa-whatsapp' },
                { name: 'Cloudinary Storage', statusKey: 'cloudinary', icon: 'fas fa-cloud' },
                { name: 'Database (Cloudflare D1)', statusKey: 'database', icon: 'fas fa-database' },
                { name: 'Email (SMTP)', statusKey: 'email', icon: 'fas fa-envelope' },
            ].map((service, idx) => {
                const status = serviceStatus[service.statusKey] || { status: 'Unknown', color: '#94a3b8' };
                return (
                    <div key={idx} style={{
                        padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${status.color}15`, color: status.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: `1px solid ${status.color}30` }}>
                                <i className={service.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.1rem' }}>{service.name}</div>
                                <div style={{ fontSize: '0.8rem', color: status.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {status.status}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(service.statusKey === 'whatsapp' || service.statusKey === 'cloudinary') && (
                                <button
                                    className="btn"
                                    style={{ padding: '10px 18px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    onClick={() => handleTestService(service.statusKey)}
                                >
                                    <i className="fas fa-vial" style={{ marginRight: '6px' }}></i> Test
                                </button>
                            )}
                            <button
                                className="btn"
                                style={{ padding: '10px 18px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 700 }}
                                onClick={() => handleOpenConfig(service)}
                            >
                                Configure
                            </button>
                        </div>
                    </div>
                );
            })}

            <Modal
                isOpen={configModal.isOpen}
                onClose={() => setConfigModal({ isOpen: false, service: null, data: {} })}
                title={`Konfigurasi: ${configModal.service?.name}`}
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setConfigModal({ isOpen: false, service: null, data: {} })}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSaveServiceConfig} disabled={submittingConfig}>
                            {submittingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                        </button>
                    </div>
                )}
            >
                <div style={{ padding: '10px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', gap: '12px' }}>
                        <i className="fas fa-info-circle" style={{ color: '#3b82f6', marginTop: '3px' }}></i>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            Hati-hati saat mengubah pengaturan ini. Parameter yang salah dapat menyebabkan layanan terkait berhenti berfungsi.
                        </p>
                    </div>

                    {configModal.service?.statusKey === 'whatsapp' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label className="develzy-label">API Gateway Interface</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    placeholder="https://api.whatsapp-gateway.com/v1"
                                    value={configModal.data.whatsapp_api_url || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_api_url: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Authorization Secret (Token)</label>
                                <input
                                    type="password"
                                    className="develzy-input"
                                    placeholder="Masukkan Token API"
                                    value={configModal.data.whatsapp_token || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_token: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Default Transmission Channel (ID)</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    placeholder="Ex: 512"
                                    value={configModal.data.whatsapp_device_id || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_device_id: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'cloudinary' && (
                        <div className="grid gap-4">
                            <div className="form-group">
                                <label className="form-label">Cloud Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configModal.data.cloudinary_cloud_name || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_cloud_name: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">API Key</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configModal.data.cloudinary_api_key || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_api_key: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">API Secret</label>
                                <input
                                    type="password"
                                    className="form-control"
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
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>SMTP Host Protocol</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                        placeholder="smtp.gmail.com"
                                        value={configModal.data.smtp_host || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_host: e.target.value } })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Port</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                        placeholder="465 / 587"
                                        value={configModal.data.smtp_port || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_port: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Credential Identity (User)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                    value={configModal.data.smtp_user || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_user: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Secure Access Key (Pass)</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                    value={configModal.data.smtp_password || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_password: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Outbound Alias (Sender)</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                    placeholder="noreply@pondok.com"
                                    value={configModal.data.smtp_from_email || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_from_email: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'database' && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <i className="fas fa-database" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '1rem' }}></i>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Konfigurasi database dikelola langsung melalui variabel lingkungan (Secrets) di Cloudflare Dashboard untuk keamanan maksimal.
                            </p>
                            <div style={{ marginTop: '1rem', padding: '10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <small style={{ color: '#92400e', fontWeight: 700 }}>Catatan: Tidak dapat diubah dari panel ini.</small>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
