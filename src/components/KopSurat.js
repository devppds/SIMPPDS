'use client';

import React from 'react';

/**
 * KopSurat - Komponen standar untuk Kop Surat laporan (Satu Pintu)
 * @param {string} judul - Judul utama laporan (Contoh: 'DAFTAR SANTRI BARU')
 * @param {string} subJudul - Sub-judul laporan (Contoh: 'Periode 2024/2025')
 */
import { useAuth } from '@/lib/AuthContext';

/**
 * KopSurat - Komponen standar untuk Kop Surat laporan (Satu Pintu)
 * @param {string} judul - Judul utama laporan (Contoh: 'DAFTAR SANTRI BARU')
 * @param {string} subJudul - Sub-judul laporan (Contoh: 'Periode 2024/2025')
 */
export default function KopSurat({ judul = '', subJudul = '', hideOnScreen = false }) {
    const [mounted, setMounted] = React.useState(false);
    const { config } = useAuth();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`print-header-unified ${hideOnScreen ? 'print-only' : ''}`} style={{ marginBottom: '2rem' }}>
            {/* Kop Surat Corporate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '3px solid #1e3a8a', paddingBottom: '15px' }}>
                <img
                    src={config?.logo_url || "https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=128&bold=true"}
                    style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    alt="Logo"
                />
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        color: '#1e3a8a',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {config?.nama_instansi || 'PONDOK PESANTREN DARUSSALAM LIRBOYO'}
                    </h1>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 700 }}>
                        Sistem Informasi Manajemen Terpadu (SIM-PPDS)
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Lirboyo, Kota Kediri, Jawa Timur | Telp: (0354) XXX-XXX
                    </p>
                </div>
            </div>

            {/* Judul Laporan */}
            {judul && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#000',
                        textDecoration: 'underline'
                    }}>
                        {judul}
                    </h2>
                    {subJudul && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                            {subJudul}
                        </p>
                    )}
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        Dicetak pada: {mounted ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                </div>
            )}
        </div>
    );
}
