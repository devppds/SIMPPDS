'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import KopSurat from '@/components/KopSurat';

export default function QRScannerPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0] // 0 = QR CODE
        });

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [isScanning]);

    const onScanSuccess = async (decodedText) => {
        if (!isScanning) return;

        setIsScanning(false);
        try {
            // Basic Token Validate
            const decoded = atob(decodedText);
            if (!decoded.includes("SIMPPDS_SALT_2024")) {
                throw new Error("QR Code tidak valid atau sudah kadaluarsa.");
            }

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

            // Determine Masuk/Pulang based on time (Simplified)
            // Or just record every scan
            const hour = now.getHours();
            const tipe = hour >= 13 ? "Pulang" : "Masuk";

            const payload = {
                pengurus_id: user?.id || 0,
                nama: user?.fullname || user?.username || 'Unknown Staff',
                tanggal: dateStr,
                jam: timeStr,
                tipe: tipe,
                keterangan: 'Scan QR Code HP'
            };

            await apiCall('saveData', 'POST', { type: 'presensi_pengurus', data: payload });
            setScanResult({ success: true, message: `Berhasil Absen ${tipe} pada ${timeStr}` });
            showToast(`Absensi ${tipe} Berhasil!`, 'success');
        } catch (err) {
            console.error(err);
            setScanResult({ success: false, message: err.message });
            showToast(err.message, 'error');
        }
    };

    const onScanError = (err) => {
        // console.warn(err);
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <div className="view-container animate-in" style={{ padding: '1rem' }}>
            <KopSurat judul="SCAN PRESENSI" subJudul="Absensi Mandiri Pengurus PPDS" hideOnScreen={true} />

            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        <i className="fas fa-user-circle"></i> {user?.fullname || user?.username}
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}>Silakan pindai QR Code yang ditampilkan di layar kantor.</p>
                </div>

                {isScanning ? (
                    <div id="reader" style={{ borderRadius: '20px', overflow: 'hidden', border: '5px solid var(--primary-light)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}></div>
                ) : (
                    <div style={{
                        background: scanResult?.success ? '#dcfce7' : '#fee2e2',
                        padding: '3rem 2rem',
                        borderRadius: '30px',
                        textAlign: 'center',
                        border: `2px dashed ${scanResult?.success ? '#22c55e' : '#ef4444'}`
                    }}>
                        <i className={`fas ${scanResult?.success ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ fontSize: '4rem', color: scanResult?.success ? '#22c55e' : '#ef4444', marginBottom: '1.5rem' }}></i>
                        <h3 className="outfit" style={{ fontWeight: 800 }}>{scanResult?.success ? 'BERHASIL!' : 'GAGAL'}</h3>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{scanResult?.message}</p>

                        <button className="btn btn-primary w-full" onClick={resetScanner}>
                            <i className="fas fa-redo"></i> Scan Ulang
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '2rem', background: 'var(--primary-light)', padding: '1.5rem', borderRadius: '20px', color: 'var(--primary-dark)', fontSize: '0.9rem' }}>
                    <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}><i className="fas fa-lightbulb"></i> Tips:</h4>
                    <ul style={{ paddingLeft: '1.2rem' }}>
                        <li>Pastikan pencahayaan cukup untuk memindai.</li>
                        <li>Posisikan QR Code di dalam kotak pemindai.</li>
                        <li>Jika gagal, silakan hubungi Sekretariat.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
