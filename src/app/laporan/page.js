'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import PremiumBanner from '@/components/PremiumBanner';
import StatsPanel from '@/components/StatsPanel';

export default function LaporanPimpinan() {
    const { config } = useAuth();
    const [stats, setStats] = useState({
        santriTotal: 0,
        ustadzTotal: 0,
        keuanganTotal: 0,
        pelanggaranTotal: 0,
        kesehatanTotal: 0,
        pemasukanBulanIni: 0,
        pengeluaranBulanIni: 0,
        totalSaldo: 0,
        pengurusHadir: 0,
        unitStats: {}
    });
    const [aiSuggestion, setAiSuggestion] = useState("Menganalisis data...");
    const [occupancy, setOccupancy] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const generateAiSuggestion = (data, totalCapacity) => {
        const { santriTotal, kesehatanTotal, pelanggaranTotal, pemasukanBulanIni, pengeluaranBulanIni, pengurusHadir } = data;
        let items = [];

        // Financial analysis
        const surplus = pemasukanBulanIni - pengeluaranBulanIni;
        if (pemasukanBulanIni > 0) {
            const ratio = pengeluaranBulanIni / pemasukanBulanIni;
            if (ratio > 0.9) {
                items.push("Beban operasional mendekati threshold (ratio > 90%).");
            } else if (surplus < 0) {
                items.push("Laporan defisit terdeteksi, mohon periksa pos pengeluaran.");
            }
        }

        // Staff Analysis
        if (santriTotal > 0 && pengurusHadir < (santriTotal / 20)) {
            items.push("Rasio kehadiran pengurus terhadap santri cukup rendah bulan ini.");
        }

        // Health Analysis
        if (santriTotal > 0) {
            const sickRate = (kesehatanTotal / santriTotal) * 100;
            if (sickRate > 5) {
                items.push(`Tren kesehatan menurun (${sickRate.toFixed(1)}%), tingkatkan sanitasi.`);
            }
        }

        // Security Analysis
        if (pelanggaranTotal > 15) {
            items.push("Grafik kedisiplinan perlu dievaluasi (lonjakan pelanggaran).");
        }

        if (items.length === 0) {
            return "Seluruh parameter operasional pondok terpantau dalam kondisi prima dan stabil.";
        }

        return items.slice(0, 2).join(" Serta "); // Limit to 2 highlights
    };

    const statsItems = useMemo(() => [
        { title: 'Total Santri', value: stats.santriTotal, icon: 'fas fa-user-graduate', color: '#6366f1' },
        { title: 'Saldo Operasional', value: formatCurrency(stats.totalSaldo), icon: 'fas fa-chart-line', color: '#10b981' },
        { title: 'Kinerja Pengurus', value: stats.pengurusHadir + ' Tugas', icon: 'fas fa-user-tie', color: '#8b5cf6' },
        { title: 'Kesehatan & Disiplin', value: stats.pelanggaranTotal + stats.kesehatanTotal + ' Poin', icon: 'fas fa-heartbeat', color: '#ef4444' }
    ], [stats]);

    useEffect(() => {
        setMounted(true);
        const isMountedRef = { current: true };

        const fetchStats = async () => {
            try {
                // Using allSettled to prevent one failure from breaking everything
                const results = await Promise.allSettled([
                    apiCall('getData', 'GET', { type: 'santri' }),
                    apiCall('getData', 'GET', { type: 'pengurus' }),
                    apiCall('getData', 'GET', { type: 'keamanan' }),
                    apiCall('getData', 'GET', { type: 'kesehatan' }),
                    apiCall('getData', 'GET', { type: 'arus_kas' }),
                    apiCall('getData', 'GET', { type: 'kamar' }),
                    apiCall('getData', 'GET', { type: 'pengurus_absen' })
                ]);

                if (!isMountedRef.current) return;

                const santri = results[0].status === 'fulfilled' ? results[0].value : [];
                const pengurus = results[1].status === 'fulfilled' ? results[1].value : [];
                const pelanggaran = results[2].status === 'fulfilled' ? results[2].value : [];
                const kesehatan = results[3].status === 'fulfilled' ? results[3].value : [];
                const arusKas = results[4].status === 'fulfilled' ? results[4].value : [];
                const kamarData = results[5].status === 'fulfilled' ? results[5].value : [];
                const pengurusAbsen = results[6].status === 'fulfilled' ? results[6].value : [];

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const hMonth = 'Rajab';
                const hYear = '1447';

                const monthlyAbsen = (pengurusAbsen || []).filter(a => a.bulan === hMonth && a.tahun === hYear);
                const totalWorkingSessions = monthlyAbsen.reduce((sum, a) => sum + (Number(a.tugas) || 0), 0);

                // Financial Overview from Bendahara (arus_kas)
                const totalBalance = (arusKas || []).reduce((sum, d) => {
                    const n = Number(d.nominal) || 0;
                    return d.tipe === 'Masuk' ? sum + n : sum - n;
                }, 0);

                const monthlyPemasukan = (arusKas || [])
                    .filter(item => {
                        if (!item.tanggal) return false;
                        const d = new Date(item.tanggal);
                        return item.tipe === 'Masuk' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                const monthlyPengeluaran = (arusKas || [])
                    .filter(item => {
                        if (!item.tanggal) return false;
                        const d = new Date(item.tanggal);
                        return item.tipe === 'Keluar' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                const totalCap = (kamarData || []).reduce((sum, k) => sum + (Number(k.kapasitas) || 0), 0);

                // Filter santri: Only Active AND (MHM or MIU) - Explicitly excluding MD/Other
                const activeSantri = (santri || []).filter(s => {
                    const isActive = !s.status_santri || s.status_santri === 'Aktif';
                    const m = (s.madrasah || '').toUpperCase();
                    // Ensure we ONLY count MHM and MIU, excluding MD or others
                    const isValidUnit = m.includes('MHM') || m.includes('MIU');
                    return isActive && isValidUnit;
                });

                const sTotal = activeSantri.length;

                if (totalCap > 0) setOccupancy(Math.round((sTotal / totalCap) * 100));

                const unitCount = { 'MHM': 0, 'MIU': 0 };
                activeSantri.forEach(s => {
                    const m = (s.madrasah || '').toUpperCase();
                    if (m.includes('MHM')) unitCount['MHM']++;
                    else if (m.includes('MIU')) unitCount['MIU']++;
                });

                const finalStats = {
                    santriTotal: sTotal,
                    ustadzTotal: (pengurus || []).length,
                    pelanggaranTotal: (pelanggaran || []).length,
                    kesehatanTotal: (kesehatan || []).filter(k => k.status_periksa !== 'Sembuh')?.length || 0,
                    pemasukanBulanIni: monthlyPemasukan,
                    pengeluaranBulanIni: monthlyPengeluaran,
                    totalSaldo: totalBalance,
                    pengurusHadir: totalWorkingSessions,
                    unitStats: unitCount
                };

                setStats(finalStats);
                setAiSuggestion(generateAiSuggestion(finalStats, totalCap));
            } catch (error) {
                console.error("Critical error in report page:", error);
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };

        fetchStats();

        return () => { isMountedRef.current = false; };
    }, []);

    if (loading) return (
        <div className="view-container laporan-view">
            <div className="card-glass" style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem' }}>
                <i className="fas fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}></i>
                <h3 className="outfit" style={{ fontWeight: 800 }}>Menyusun Laporan Eksekutif...</h3>
                <p style={{ color: 'var(--text-muted)' }}>Menganalisis data dari seluruh unit kerja Pondok Pesantren.</p>
            </div>
        </div>
    );

    return (
        <div className="view-container laporan-view">
            <div className="print-header-corporate" style={{ display: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '3px solid #1e3a8a', paddingBottom: '15px', marginBottom: '25px' }}>
                    <img
                        src={config?.logo_url || "https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                        alt="Logo"
                        onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=128&bold=true"; }}
                    />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 900 }}>PONDOK PESANTREN DARUSSALAM LIRBOYO</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Sistem Informasi Manajemen Terpadu (SIM-PPDS)</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Lirboyo, Kota Kediri, Jawa Timur</p>
                    </div>
                </div>
            </div>

            <PremiumBanner
                title="Laporan Pimpinan & Eksekutif"
                subtitle="Analisis data cerdas untuk monitoring performa operasional pondok pesantren."
                icon="fas fa-chart-line"
                bgGradient="linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
                actionButton={(
                    <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '16px', fontWeight: 800 }} onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Cetak Laporan
                    </button>
                )}
            />

            <StatsPanel items={statsItems} />

            <div className="report-row" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '3rem', marginTop: '3rem' }}>
                <div className="card" style={{ padding: '2.5rem' }}>
                    <div className="card-header" style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Ikhtisar Keuangan Bulanan</h2>
                    </div>

                    <div className="financial-analysis">
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 800 }}>
                                <span>Pemasukan Terhitung</span>
                                <span style={{ color: '#10b981' }}>{formatCurrency(stats.pemasukanBulanIni)}</span>
                            </div>
                            <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '20px' }}></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 800 }}>
                                <span>Estimasi Pengeluaran</span>
                                <span style={{ color: stats.pengeluaranBulanIni > stats.pemasukanBulanIni ? '#ef4444' : '#64748b' }}>
                                    {formatCurrency(stats.pengeluaranBulanIni)}
                                </span>
                            </div>
                            <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{
                                    width: stats.pemasukanBulanIni > 0 ? `${Math.min((stats.pengeluaranBulanIni / stats.pemasukanBulanIni) * 100, 100)}%` : '0%',
                                    height: '100%',
                                    background: stats.pengeluaranBulanIni > stats.pemasukanBulanIni ? '#ef4444' : '#fbbf24',
                                    borderRadius: '20px',
                                    transition: 'width 1s ease'
                                }}></div>
                            </div>
                        </div>

                        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Saldo Bersih Bulan Ini</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: (stats.pemasukanBulanIni - stats.pengeluaranBulanIni) >= 0 ? '#10b981' : '#ef4444' }}>
                                    {formatCurrency(stats.pemasukanBulanIni - stats.pengeluaranBulanIni)}
                                </div>
                            </div>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: (stats.pemasukanBulanIni - stats.pengeluaranBulanIni) >= 0 ? '#10b981' : '#ef4444', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                                <i className={`fas fa-chart-${(stats.pemasukanBulanIni - stats.pengeluaranBulanIni) >= 0 ? 'line' : 'bar'}`}></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '2rem' }}>Status Real-time & Unit</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '18px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-university"></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Unit Madrasatuna (MHM/MIU)</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '4px' }}>
                                        <span>MHM: <strong>{stats.unitStats.MHM}</strong></span>
                                        <span>MIU: <strong>{stats.unitStats.MIU}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '18px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-user-check"></i>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Performa Partisipasi</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.pengurusHadir} Kali Giat Bulan Ini</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '18px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: stats.pelanggaranTotal > 10 ? '#fef2f2' : '#f0fdf4', color: stats.pelanggaranTotal > 10 ? '#dc2626' : '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className={`fas fa-${stats.pelanggaranTotal > 10 ? 'exclamation-circle' : 'check-circle'}`}></i>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Stabilitas Keamanan</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.pelanggaranTotal > 10 ? 'Butuh Atensi Khusus' : 'Sangat Kondusif'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-brain"></i>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Wawasan Eksekutif AI</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', opacity: 0.9 }}>
                                    "{aiSuggestion}"
                                </p>
                            </div>
                            <i className="fas fa-microchip" style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '100px', opacity: 0.1, color: 'white' }}></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="print-footer-corporate" style={{ display: 'none' }}>
                <div style={{ marginTop: '50px', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <span>Laporan Otomatis: {mounted && new Date().toLocaleString('id-ID')}</span>
                    <span style={{ fontWeight: 700 }}>SIM-PPDS EXECUTIVE DASHBOARD | DARUSSALAM LIRBOYO KEDIRI</span>
                </div>
            </div>

        </div>
    );
}
