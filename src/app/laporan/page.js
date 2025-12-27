'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';

export default function LaporanPimpinan() {
    const [stats, setStats] = useState({
        santriTotal: 0,
        ustadzTotal: 0,
        keuanganTotal: 0,
        pelanggaranTotal: 0,
        kesehatanTotal: 0,
        pemasukanBulanIni: 0,
        pengeluaranBulanIni: 0
    });
    const [aiSuggestion, setAiSuggestion] = useState("Menganalisis data...");
    const [occupancy, setOccupancy] = useState(0);

    const generateAiSuggestion = (data, totalCapacity) => {
        const { santriTotal, kesehatanTotal, pelanggaranTotal, pemasukanBulanIni, pengeluaranBulanIni } = data;
        let items = [];

        // Financial analysis
        const surplus = pemasukanBulanIni - pengeluaranBulanIni;
        if (pemasukanBulanIni > 0) {
            const ratio = pengeluaranBulanIni / pemasukanBulanIni;
            if (ratio > 0.9) {
                items.push("Beban pengeluaran sangat tinggi (ratio > 90%), evaluasi efisiensi operasional diperlukan.");
            } else if (surplus < 0) {
                items.push("Laporan defisit terdeteksi, mohon periksa pos pengeluaran mendadak.");
            } else if (ratio < 0.6) {
                items.push("Kondisi finansial bulan ini sangat sehat dan stabil.");
            }
        }

        // Health Analysis
        if (santriTotal > 0) {
            const sickRate = (kesehatanTotal / santriTotal) * 100;
            if (sickRate > 5) {
                items.push(`Waspada tren penyakit (${sickRate.toFixed(1)}%), disarankan peningkatan kebersihan asrama.`);
            } else if (kesehatanTotal === 0) {
                items.push("Kesehatan santri terpantau prima (Zero sick data).");
            }
        }

        // Security Analysis
        if (pelanggaranTotal > 15) {
            items.push("Terdapat grafik pelanggaran yang signifikan, perlu penguatan fungsi pengawasan keamanan.");
        }

        // Capacity
        if (totalCapacity > 0) {
            const occ = (santriTotal / totalCapacity) * 100;
            if (occ > 95) {
                items.push("Kapasitas asrama hampir penuh, pertimbangkan pengaturan alokasi santri baru.");
            }
        }

        if (items.length === 0) {
            return "Alokasi pengeluaran dan kondisi operasional terpantau normal dan stabil.";
        }

        return items.slice(0, 2).join(" Serta "); // Limit to 2 highlights
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiCall('getQuickStats');
                const santri = await apiCall('getData', 'GET', { type: 'santri' });
                const ustadz = await apiCall('getData', 'GET', { type: 'ustadz' });
                const pelanggaran = await apiCall('getData', 'GET', { type: 'keamanan' });
                const kesehatan = await apiCall('getData', 'GET', { type: 'kesehatan' });
                const arusKas = await apiCall('getData', 'GET', { type: 'arus_kas' });
                const kamarData = await apiCall('getData', 'GET', { type: 'kamar' });

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const pemasukan = (arusKas || [])
                    .filter(item => item.tipe === 'Masuk' && new Date(item.tanggal).getMonth() === currentMonth && new Date(item.tanggal).getFullYear() === currentYear)
                    .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                const pengeluaran = (arusKas || [])
                    .filter(item => item.tipe === 'Keluar' && new Date(item.tanggal).getMonth() === currentMonth && new Date(item.tanggal).getFullYear() === currentYear)
                    .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                const totalCap = (kamarData || []).reduce((sum, k) => sum + (Number(k.kapasitas) || 0), 0);
                const sTotal = santri?.length || 0;

                if (totalCap > 0) setOccupancy(Math.round((sTotal / totalCap) * 100));

                const finalStats = {
                    santriTotal: sTotal,
                    ustadzTotal: ustadz?.length || 0,
                    keuanganTotal: data?.keuanganTotal || 0,
                    pelanggaranTotal: pelanggaran?.length || 0,
                    kesehatanTotal: kesehatan?.filter(k => k.status_periksa !== 'Sembuh')?.length || 0,
                    pemasukanBulanIni: pemasukan,
                    pengeluaranBulanIni: pengeluaran
                };

                setStats(finalStats);
                setAiSuggestion(generateAiSuggestion(finalStats, totalCap));
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="view-container">
            <div className="loading-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
                <p style={{ marginLeft: '1rem' }}>Menyusun Laporan Pimpinan...</p>
            </div>
        </div>
    );

    return (
        <div className="view-container">
            <div className="card-header">
                <div>
                    <h1 className="view-title">Laporan Pimpinan & Eksekutif</h1>
                    <p className="view-subtitle">Ringkasan operasional dan keuangan Pondok Pesantren</p>
                </div>
                <div className="card-actions">
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="stats-grid">
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white' }}>
                    <div className="stat-icon"><i className="fas fa-user-graduate"></i></div>
                    <div className="stat-info">
                        <h3>Total Santri</h3>
                        <div className="value">{stats.santriTotal}</div>
                        <p>Santri Aktif Terdaftar</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                    <div className="stat-icon"><i className="fas fa-wallet"></i></div>
                    <div className="stat-info">
                        <h3>Pemasukan (Bln Ini)</h3>
                        <div className="value">{formatCurrency(stats.pemasukanBulanIni)}</div>
                        <p>Total Arus Kas Masuk</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                    <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
                    <div className="stat-info">
                        <h3>Pelanggaran</h3>
                        <div className="value">{stats.pelanggaranTotal}</div>
                        <p>Total Catatan Keamanan</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                    <div className="stat-icon"><i className="fas fa-heartbeat"></i></div>
                    <div className="stat-info">
                        <h3>Santri Sakit</h3>
                        <div className="value">{stats.kesehatanTotal}</div>
                        <p>Izin Istirahat / Berobat</p>
                    </div>
                </div>
            </div>

            <div className="report-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Financial Overview Card */}
                <div className="card report-card">
                    <div className="card-header">
                        <h2 className="card-title">Ikhtisar Keuangan Bulanan</h2>
                    </div>
                    <div className="financial-chart-view">
                        <div className="chart-bar-container">
                            <div className="label-row">
                                <span>Pemasukan</span>
                                <span>{formatCurrency(stats.pemasukanBulanIni)}</span>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: '100%', backgroundColor: '#10b981' }}></div>
                            </div>
                        </div>
                        <div className="chart-bar-container" style={{ marginTop: '1.5rem' }}>
                            <div className="label-row">
                                <span>Pengeluaran</span>
                                <span>{formatCurrency(stats.pengeluaranBulanIni)}</span>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{
                                    width: stats.pemasukanBulanIni > 0 ? `${Math.min((stats.pengeluaranBulanIni / stats.pemasukanBulanIni) * 100, 100)}%` : '0%',
                                    backgroundColor: stats.pengeluaranBulanIni > stats.pemasukanBulanIni ? '#dc2626' : '#ef4444'
                                }}></div>
                            </div>
                        </div>
                        <div className="balance-info" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>Saldo Surplus/Defisit:</strong>
                                <span style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: (stats.pemasukanBulanIni - stats.pengeluaranBulanIni) >= 0 ? '#10b981' : '#ef4444'
                                }}>
                                    {formatCurrency(stats.pemasukanBulanIni - stats.pengeluaranBulanIni)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Info Card */}
                <div className="card report-card">
                    <div className="card-header">
                        <h2 className="card-title">Status Real-time</h2>
                    </div>
                    <div className="status-list">
                        <div className="status-item">
                            <span className="dot" style={{ backgroundColor: '#10b981' }}></span>
                            <div className="status-text">
                                <strong>SDM Pondok</strong>
                                <p>{stats.ustadzTotal} Tenaga Pendidik Aktif</p>
                            </div>
                        </div>
                        <div className="status-item" style={{ marginTop: '1.2rem' }}>
                            <span className="dot" style={{ backgroundColor: occupancy > 90 ? '#ef4444' : '#6366f1' }}></span>
                            <div className="status-text">
                                <strong>Hunian Kamar</strong>
                                <p>{occupancy > 0 ? `Terisi ${occupancy}%` : 'Data Kamar Kosong'}</p>
                            </div>
                        </div>
                        <div className="status-item" style={{ marginTop: '1.2rem' }}>
                            <span className="dot" style={{ backgroundColor: stats.pelanggaranTotal > 10 ? '#f59e0b' : '#10b981' }}></span>
                            <div className="status-text">
                                <strong>Ketertiban</strong>
                                <p>{stats.pelanggaranTotal > 10 ? 'Perlu Perhatian' : 'Kondusif & Aman'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="ai-report-box" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f4ff', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <i className="fas fa-robot" style={{ color: '#6366f1' }}></i>
                            <strong style={{ fontSize: '0.8rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Saran Sistem (AI Analisis)</strong>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#1e293b', fontStyle: 'italic', lineHeight: '1.4' }}>
                            "{aiSuggestion}"
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .financial-chart-view {
                    padding: 1rem 0;
                }
                .label-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #475569;
                }
                .bar-bg {
                    height: 12px;
                    background: #f1f5f9;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    border-radius: 6px;
                }
                .status-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-top: 6px;
                    flex-shrink: 0;
                }
                .status-text strong {
                    display: block;
                    font-size: 0.95rem;
                }
                .status-text p {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
