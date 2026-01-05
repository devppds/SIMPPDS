'use client';

import React from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import FileUploader from '@/components/FileUploader';

export default function BrandingTab({ configs, setConfigs }) {
    const { showToast } = useToast();

    const handleSaveConfig = async () => {
        try {
            const keysToSave = ['primary_color', 'sidebar_theme', 'logo_url'];
            for (const key of keysToSave) {
                if (configs[key] !== undefined) {
                    await apiCall('updateConfig', 'POST', { data: { key, value: configs[key] } });
                }
            }
            showToast("Konfigurasi Branding Berhasil Disimpan!", "success");
        } catch (e) {
            showToast("Gagal menyimpan konfigurasi branding: " + e.message, "error");
        }
    };

    return (
        <div className="animate-in">
            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>Branding & UI Engine</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: configs.primary_color || '#2563eb', boxShadow: `0 0 10px ${configs.primary_color || '#2563eb'}` }}></div>
                        <label style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary Interface Color</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="color"
                                value={configs.primary_color || '#2563eb'}
                                onChange={e => setConfigs({ ...configs, primary_color: e.target.value })}
                                style={{ width: '70px', height: '70px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, overflow: 'hidden', background: 'transparent' }}
                            />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.2rem', fontFamily: 'monospace' }}>{configs.primary_color?.toUpperCase()}</div>
                            <small style={{ color: '#475569', fontSize: '0.75rem' }}>HEX PROTOCOL</small>
                        </div>
                    </div>
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: configs.sidebar_theme || '#1e1b4b', boxShadow: `0 0 10px ${configs.sidebar_theme || '#1e1b4b'}` }}></div>
                        <label style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Navigation Backdrop</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <input
                            type="color"
                            value={configs.sidebar_theme || '#1e1b4b'}
                            onChange={e => setConfigs({ ...configs, sidebar_theme: e.target.value })}
                            style={{ width: '70px', height: '70px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, overflow: 'hidden', background: 'transparent' }}
                        />
                        <div>
                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.2rem', fontFamily: 'monospace' }}>{configs.sidebar_theme?.toUpperCase()}</div>
                            <small style={{ color: '#475569', fontSize: '0.75rem' }}>HEX PROTOCOL</small>
                        </div>
                    </div>
                </div>

                <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                    <label style={{ display: 'block', marginBottom: '1.5rem', fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity & Branding Logo</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'center' }}>
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            width: '160px',
                            height: '160px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                        }}>
                            <img
                                src={configs.logo_url || "https://ui-avatars.com/api/?name=LOGO&background=2563eb&color=fff&size=512"}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                alt="Current Logo"
                                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=404&background=ef4444&color=fff"; }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <FileUploader
                                currentUrl={configs.logo_url}
                                onUploadSuccess={url => setConfigs({ ...configs, logo_url: url })}
                                folder="branding_assets"
                                label="Upload Identity Asset"
                            />
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '10px 15px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: '#475569',
                                border: '1px solid rgba(255,255,255,0.03)',
                                wordBreak: 'break-all'
                            }}>
                                PATH: <span style={{ color: configs.logo_url?.includes('cloudinary') ? '#10b981' : '#f59e0b' }}>{configs.logo_url || 'DEFAULT_IDENTIFIER'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button className="btn" onClick={handleSaveConfig} style={{ marginTop: '2rem', padding: '14px 28px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                <i className="fas fa-microchip" style={{ marginRight: '8px' }}></i> Overwrite Global Branding
            </button>
        </div>
    );
}
