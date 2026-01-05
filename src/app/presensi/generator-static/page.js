'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import KopSurat from '@/components/KopSurat';

const TARGET_DIVISIONS = [
    "Kesehatan",
    "Jam'iyyah",
    "Lab & Media",
    "Humasy",
    "PLP",
    "Pembangunan"
];

export default function StaticQRPage() {
    // Generate static token
    const staticToken = btoa(`STATIC_QR_TOKEN_SIMPPDS_2024_SALT`);

    return (
        <div className="view-container animate-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', py: '2rem', background: 'var(--bg-secondary)' }}>
            <KopSurat judul="PRESENSI DIGITAL (QR STATIS)" subJudul="QR Code Permanen Khusus Unit Kerja Terdaftar" hideOnScreen={false} />

            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                marginTop: '2rem',
                border: '8px solid var(--primary-light)',
                maxWidth: '600px',
                width: '100%'
            }}>
                <h2 className="outfit" style={{ marginBottom: '0.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>QR CODE PERMANEN</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 600 }}>Silakan Scan untuk Absensi Kehadiran</p>

                <div style={{ padding: '25px', background: '#f8fafc', borderRadius: '25px', display: 'inline-block', border: '2px solid #e2e8f0' }}>
                    <QRCodeSVG value={staticToken} size={320} level="H" includeMargin={true} />
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'left', background: '#f0f9ff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                    <h4 style={{ fontWeight: 800, color: '#0369a1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-users"></i> Unit Kerja Terdaftar:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {TARGET_DIVISIONS.map(div => (
                            <div key={div} style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#0ea5e9' }}></i> {div}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', noPrint: { display: 'none' } }}>
                <button className="btn btn-primary btn-lg" onClick={() => window.print()} style={{ padding: '12px 30px', borderRadius: '15px' }}>
                    <i className="fas fa-print"></i> Cetak QR Code
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print, button, .sidebar, .header-dashboard {
                        display: none !important;
                    }
                    .view-container {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
