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

        const html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess
        ).catch(err => {
            console.error("Failed to start scanner", err);
            // Fallback to any camera if environment (back) fails
            html5QrCode.start({ facingMode: "user" }, config, onScanSuccess)
                .catch(fallbackErr => console.error("Failed to start scanner with fallback", fallbackErr));
        });

        scannerRef.current = html5QrCode;

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [isScanning]);

    const onScanSuccess = async (decodedText) => {
        if (!isScanning) return;

        try {
            let decoded = "";
            try {
                decoded = atob(decodedText);
            } catch (e) {
                throw new Error("QR Code tidak dikenali.");
            }

            if (!decoded.includes("SIMPPDS_SALT_2024")) {
                throw new Error("QR Code tidak valid.");
            }

            const parts = decoded.split('_');
            const timeKey = parts[parts.length - 1];

            // Time validation (max 5 minutes old to account for device time drift)
            const currentTimeKey = Math.floor(Date.now() / 60000);
            if (Math.abs(currentTimeKey - parseInt(timeKey)) > 5) {
                throw new Error("QR Code kadaluarsa, silakan scan yang terbaru.");
            }

            setIsScanning(false);
            if (scannerRef.current) await scannerRef.current.stop();

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

            const payload = {
                pengurus_id: user?.id || 0,
                nama: user?.fullname || user?.username || 'Unknown Staff',
                tanggal: dateStr,
                jam: timeStr,
                tipe: "Hadir",
                keterangan: 'Scan QR Code HP'
            };

            await apiCall('saveData', 'POST', { type: 'presensi_pengurus', data: payload });
            setScanResult({ success: true, message: `Berhasil Absen Kehadiran pada ${timeStr}` });
            showToast(`Absensi Berhasil!`, 'success');
        } catch (err) {
            console.error(err);
            // Don't stop scanning on "invalid" error, just show toast
            showToast(err.message, 'error');
            // If it's a critical error we show the failure screen
            if (err.message.includes("kadaluarsa")) {
                setIsScanning(false);
                setScanResult({ success: false, message: err.message });
                if (scannerRef.current) scannerRef.current.stop();
            }
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
