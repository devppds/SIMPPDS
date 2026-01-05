'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import KopSurat from '@/components/KopSurat';

export default function QRGeneratorPage() {
    const [token, setToken] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);

    const generateToken = () => {
        const today = new Date().toISOString().split('T')[0];
        const salt = "SIMPPDS_SALT_2024";
        const newToken = btoa(`${today}_${salt}_${Math.floor(Date.now() / 60000)}`);
        setToken(newToken);
        setTimeLeft(60);
    };

    useEffect(() => {
        generateToken();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateToken();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="view-container animate-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
            <KopSurat judul="SISTEM PRESENSI DIGITAL" subJudul="Silakan Scan QR Code Melalui HP Anda" hideOnScreen={false} />

            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                marginTop: '2rem',
                border: '8px solid var(--primary-light)'
            }}>
                <h2 className="outfit" style={{ marginBottom: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>PRESENSI HARI INI</h2>

                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', display: 'inline-block' }}>
                    {token && <QRCodeSVG value={token} size={300} level="H" includeMargin={true} />}
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>QR Code diperbarui otomatis dalam:</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>{timeLeft}s</div>
                </div>
            </div>

            <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px' }}>
                <i className="fas fa-info-circle"></i> Pastikan Anda sudah login ke aplikasi melalui perangkat HP masing-masing sebelum melakukan pemindaian.
            </div>
        </div>
    );
}
