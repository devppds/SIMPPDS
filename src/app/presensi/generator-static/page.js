'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import KopSurat from '@/components/KopSurat';

export default function StaticQRPage() {
    const staticToken = btoa(`STATIC_QR_TOKEN_SIMPPDS_2024_SALT`);

    return (
        <div className="view-container animate-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
            <KopSurat judul="PRESENSI DIGITAL (STATIS)" subJudul="QR Code Permanen untuk Absensi Pengurus" hideOnScreen={false} />

            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                marginTop: '2rem',
                border: '8px solid #f1f5f9'
            }}>
                <h2 className="outfit" style={{ marginBottom: '1.5rem', fontWeight: 900, color: '#1e293b' }}>QR CODE PERMANEN</h2>

                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', display: 'inline-block' }}>
                    <QRCodeSVG value={staticToken} size={300} level="H" includeMargin={true} />
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, maxWidth: '400px' }}>
                        QR Code ini bersifat permanen dan tidak berubah. Cocok untuk dicetak dan ditempel di mading atau pintu kantor.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <i className="fas fa-print"></i> Cetak QR Code
                </button>
            </div>
        </div>
    );
}
