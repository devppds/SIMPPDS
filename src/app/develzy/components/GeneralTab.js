'use client';

import React from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

export default function GeneralTab({ configs, setConfigs }) {
    const { showToast } = useToast();

    const handleSaveConfig = async () => {
        try {
            // Save each config key
            const keysToSave = ['nama_instansi', 'tahun_ajaran', 'deskripsi'];
            for (const key of keysToSave) {
                if (configs[key] !== undefined) {
                    await apiCall('updateConfig', 'POST', { data: { key, value: configs[key] } });
                }
            }
            showToast("Konfigurasi Global Berhasil Disimpan!", "success");
        } catch (e) {
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        }
    };

    return (
        <div className="animate-in">
            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>Konfigurasi Global</h3>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Nama Instansi / Pondok</label>
                    <input
                        type="text"
                        className="form-control"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                        value={configs.nama_instansi || ''}
                        onChange={e => setConfigs({ ...configs, nama_instansi: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Tahun Ajaran Aktif</label>
                    <input
                        type="text"
                        className="form-control"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                        value={configs.tahun_ajaran || ''}
                        onChange={e => setConfigs({ ...configs, tahun_ajaran: e.target.value })}
                    />
                </div>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Deskripsi Sistem (Meta)</label>
                <textarea
                    className="form-control"
                    rows="3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%', resize: 'none' }}
                    value={configs.deskripsi || ''}
                    onChange={e => setConfigs({ ...configs, deskripsi: e.target.value })}
                ></textarea>
            </div>
            <button className="btn" onClick={handleSaveConfig} style={{ marginTop: '2rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 800 }}>
                <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Simpan Konfigurasi
            </button>
        </div>
    );
}
