'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import KopSurat from '@/components/KopSurat';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

const JABATAN_OPTIONS = [
    "Pendidikan",
    "Wajar & Murottil",
    "Keamanan",
    "Jam'iyyah",
    "Keuangan",
    "PLP",
    "Humasy & Logistik",
    "Kebersihan (KBR)",
    "Blok",
    "Pembangunan",
    "Dok-Media Pondok",
    "Takmir Masjid B",
    "Takmir Masjid C",
    "Kesehatan",
    "BUMP"
];

export default function StaticQRPage() {
    const { showToast } = useToast();
    const [allowedJabatan, setAllowedJabatan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Generate static token
    const staticToken = btoa(`STATIC_QR_TOKEN_SIMPPDS_2024_SALT`);

    const loadConfig = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'presensi_config' });
            const config = (res || []).find(c => c.key === 'allowed_static_jabatan');
            if (config && config.value) {
                setAllowedJabatan(JSON.parse(config.value));
            } else {
                // Default fallback if no config found
                setAllowedJabatan(["Kesehatan", "Jam'iyyah", "Dok-Media Pondok", "Humasy & Logistik", "PLP", "Pembangunan"]);
            }
        } catch (e) {
            console.error("Failed to load presensi config:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleToggleJabatan = (jabatan) => {
        setAllowedJabatan(prev =>
            prev.includes(jabatan)
                ? prev.filter(j => j !== jabatan)
                : [...prev, jabatan]
        );
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'presensi_config' });
            const existing = (res || []).find(c => c.key === 'allowed_static_jabatan');

            await apiCall('saveData', 'POST', {
                type: 'presensi_config',
                data: {
                    id: existing?.id || null,
                    key: 'allowed_static_jabatan',
                    value: JSON.stringify(allowedJabatan),
                    keterangan: 'Daftar jabatan yang diizinkan menggunakan QR Statis'
                }
            });
            showToast("Konfigurasi Jabatan Berhasil Disimpan!", "success");
        } catch (e) {
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="view-container animate-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', py: '2rem', background: 'var(--bg-secondary)' }}>
            <KopSurat judul="PRESENSI DIGITAL (QR STATIS)" subJudul="QR Code Permanen - Konfigurasi Akses Unit Kerja" hideOnScreen={false} />

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1200px' }}>

                {/* QR Section */}
                <div style={{
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '30px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    textAlign: 'center',
                    border: '8px solid var(--primary-light)',
                    flex: '1',
                    minWidth: '350px',
                    maxWidth: '500px'
                }}>
                    <h2 className="outfit" style={{ marginBottom: '0.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>QR CODE PERMANEN</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>Cetak & Tempel untuk Presensi Unit</p>

                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '25px', display: 'inline-block', border: '2px solid #e2e8f0' }}>
                        <QRCodeSVG value={staticToken} size={280} level="H" includeMargin={true} />
                    </div>

                    <div style={{ marginTop: '2rem' }} className="no-print">
                        <button className="btn btn-primary w-full" onClick={() => window.print()} style={{ borderRadius: '15px', height: '50px' }}>
                            <i className="fas fa-print"></i> Cetak QR Code
                        </button>
                    </div>
                </div>

                {/* Configuration Section */}
                <div style={{
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '30px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    flex: '1',
                    minWidth: '400px',
                    maxWidth: '600px'
                }} className="no-print">
                    <h3 className="outfit" style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-user-lock"></i> Izin Akses Jabatan
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Pilih jabatan mana saja yang diperbolehkan absen menggunakan QR di atas.
                    </p>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}><i className="fas fa-spinner fa-spin"></i> Memuat...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '2rem' }}>
                            {JABATAN_OPTIONS.map(jab => (
                                <div
                                    key={jab}
                                    onClick={() => handleToggleJabatan(jab)}
                                    style={{
                                        padding: '12px 15px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.2s',
                                        background: allowedJabatan.includes(jab) ? 'var(--primary)' : '#f1f5f9',
                                        color: allowedJabatan.includes(jab) ? 'white' : 'var(--text-dark)',
                                        border: allowedJabatan.includes(jab) ? '2px solid var(--primary)' : '2px solid transparent'
                                    }}
                                >
                                    <i className={`fas ${allowedJabatan.includes(jab) ? 'fa-check-square' : 'fa-square'}`}></i>
                                    {jab}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="btn btn-success w-full"
                        onClick={handleSaveConfig}
                        disabled={saving}
                        style={{ borderRadius: '15px', height: '50px', fontWeight: 800 }}
                    >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        {saving ? ' Menyimpan...' : ' Simpan Konfigurasi'}
                    </button>

                    <div style={{ marginTop: '1rem', background: '#fffbeb', padding: '1rem', borderRadius: '15px', border: '1px solid #fde68a' }}>
                        <small style={{ color: '#92400e', fontWeight: 700 }}>
                            <i className="fas fa-info-circle"></i> Catatan: Pengurus diluar jabatan terpilih akan ditolak saat men-scan QR permanen.
                        </small>
                    </div>
                </div>
            </div>

            {/* Print View Helpers */}
            <div className="print-only" style={{ display: 'none', textAlign: 'center', marginTop: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '500px' }}>
                    <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>UNIT TERDAFTAR:</h4>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{allowedJabatan.join(' • ')}</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .view-container { background: white !important; padding: 0 !important; }
                    body { background: white !important; }
                    .sidebar, .header-dashboard { display: none !important; }
                }
            `}</style>
        </div>
    );
}
