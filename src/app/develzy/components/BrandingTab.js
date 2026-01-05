'use client';

import React, { useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import FileUploader from '@/components/FileUploader';

export default function BrandingTab({ configs, setConfigs }) {
    const { showToast } = useToast();

    // Default configuration fallback
    const defaults = {
        primary_color: '#2563eb',
        accent_color: '#06b6d4',
        danger_color: '#ef4444',
        sidebar_theme: '#1e1b4b',
        layout_density: 'comfortable',
        border_radius: '16px',
        glass_effect: true,
        logo_url: ''
    };

    const handleSaveConfig = async () => {
        try {
            const keysToSave = ['primary_color', 'accent_color', 'danger_color', 'sidebar_theme', 'logo_url', 'layout_density', 'border_radius', 'glass_effect'];
            for (const key of keysToSave) {
                let val = configs[key];
                if (val === undefined) val = defaults[key];

                // Handle booleans as strings for DB storage if needed, or rely on flexible backend
                if (typeof val === 'boolean') val = val.toString();

                await apiCall('updateConfig', 'POST', { data: { key, value: val } });
            }
            showToast("System Appearance Protocols Updated!", "success");
        } catch (e) {
            showToast("Failed to propagate system DNA: " + e.message, "error");
        }
    };

    // Live Injection of CSS Variables for Preview
    useEffect(() => {
        const r = document.documentElement;
        r.style.setProperty('--primary', configs.primary_color || defaults.primary_color);
        r.style.setProperty('--accent', configs.accent_color || defaults.accent_color);
        r.style.setProperty('--sidebar-bg', configs.sidebar_theme || defaults.sidebar_theme);

        // Density logic
        const density = configs.layout_density || defaults.layout_density;
        const padding = density === 'compact' ? '0.75rem' : density === 'spacious' ? '2rem' : '1.5rem';
        r.style.setProperty('--card-padding', padding);

        // Radius logic
        r.style.setProperty('--radius', configs.border_radius || defaults.border_radius);

    }, [configs]);

    const updateConfig = (key, val) => {
        setConfigs(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="animate-in">
            <div style={{ marginBottom: '2rem' }}>
                <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f8fafc' }}>System Appearance Engine</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Kontrol DNA visual sistem. Mempengaruhi seluruh user interface secara global.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

                {/* 1. Chromatic Protocol (Colors) */}
                <div className="develzy-card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-palette"></i> Chromatic Protocol
                    </div>

                    <div className="space-y-6">
                        {/* Primary */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Primary Signal</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Warna dominan antarmuka</div>
                            </div>
                            <div style={{ position: 'relative', width: '60px', height: '40px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input type="color" value={configs.primary_color || defaults.primary_color} onChange={(e) => updateConfig('primary_color', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                <div style={{ position: 'absolute', inset: 0, background: configs.primary_color || defaults.primary_color, pointerEvents: 'none' }}></div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Navigation Deep Layer</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Background sidebar/menu</div>
                            </div>
                            <div style={{ position: 'relative', width: '60px', height: '40px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input type="color" value={configs.sidebar_theme || defaults.sidebar_theme} onChange={(e) => updateConfig('sidebar_theme', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                <div style={{ position: 'absolute', inset: 0, background: configs.sidebar_theme || defaults.sidebar_theme, pointerEvents: 'none' }}></div>
                            </div>
                        </div>

                        {/* Accent */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Accent Pulse</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sorotan sekunder & fokus</div>
                            </div>
                            <div style={{ position: 'relative', width: '60px', height: '40px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input type="color" value={configs.accent_color || defaults.accent_color} onChange={(e) => updateConfig('accent_color', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                <div style={{ position: 'absolute', inset: 0, background: configs.accent_color || defaults.accent_color, pointerEvents: 'none' }}></div>
                            </div>
                        </div>

                        {/* DANGER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Critical Alert</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Warna error & peringatan</div>
                            </div>
                            <div style={{ position: 'relative', width: '60px', height: '40px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input type="color" value={configs.danger_color || defaults.danger_color} onChange={(e) => updateConfig('danger_color', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                <div style={{ position: 'absolute', inset: 0, background: configs.danger_color || defaults.danger_color, pointerEvents: 'none' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Structural Integrity (Layout) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="develzy-card">
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-layer-group"></i> Structural Integrity
                        </div>

                        {/* Density Selector */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>Kepadatan Layout (Density)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                {['compact', 'comfortable', 'spacious'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => updateConfig('layout_density', d)}
                                        style={{
                                            padding: '10px', borderRadius: '8px',
                                            background: (configs.layout_density || defaults.layout_density) === d ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                                            color: (configs.layout_density || defaults.layout_density) === d ? '#38bdf8' : '#64748b',
                                            border: `1px solid ${(configs.layout_density || defaults.layout_density) === d ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`,
                                            fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize'
                                        }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Border Radius Selector */}
                        <div>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>Radius Sudut (Geometry)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                {[
                                    { id: '0px', label: 'Sharp' },
                                    { id: '12px', label: 'Rounded' },
                                    { id: '24px', label: 'Smooth' }
                                ].map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => updateConfig('border_radius', r.id)}
                                        style={{
                                            padding: '10px', borderRadius: r.id === '0px' ? '2px' : r.id === '12px' ? '8px' : '16px',
                                            background: (configs.border_radius || defaults.border_radius) === r.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                                            color: (configs.border_radius || defaults.border_radius) === r.id ? '#a855f7' : '#64748b',
                                            border: `1px solid ${(configs.border_radius || defaults.border_radius) === r.id ? '#a855f7' : 'rgba(255,255,255,0.05)'}`,
                                            fontWeight: 700, fontSize: '0.8rem'
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Identity Core */}
                    <div className="develzy-card">
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-fingerprint"></i> Identity Core
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #64748b' }}>
                                <img src={configs.logo_url} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%' }} onError={(e) => e.target.style.display = 'none'} />
                                {!configs.logo_url && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>NO IMG</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <FileUploader
                                    currentUrl={configs.logo_url}
                                    onUploadSuccess={url => updateConfig('logo_url', url)}
                                    folder="branding_assets"
                                    label="Upload New Identity"
                                />
                                <div style={{ fontSize: '0.75rem', marginTop: '8px', color: '#64748b' }}>
                                    Replaces system-wide branding assets instantly.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button className="btn neon-text" onClick={handleSaveConfig} style={{ width: '100%', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <i className="fas fa-save"></i> Commit System DNA Changes
            </button>
        </div>
    );
}
