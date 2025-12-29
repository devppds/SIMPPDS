'use client';

import React from 'react';

/**
 * KopSurat - Komponen standar untuk Kop Surat laporan (Satu Pintu)
 * @param {string} judul - Judul utama laporan (Contoh: 'DAFTAR SANTRI BARU')
 * @param {string} subJudul - Sub-judul laporan (Contoh: 'Periode 2024/2025')
 */
export default function KopSurat({ judul = '', subJudul = '', hideOnScreen = false }) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`print-header-unified ${hideOnScreen ? 'print-only' : ''}`} style={{ marginBottom: '2rem' }}>
            {/* Kop Surat Corporate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '3px solid #1e3a8a', paddingBottom: '15px' }}>
                <img
                    src="https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"
                    style={{ width: '85px', height: 'auto' }}
                    alt="Logo Pondok"
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
                        PONDOK PESANTREN DARUSSALAM LIRBOYO
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
