'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency, formatDate, apiCall } from '@/lib/utils';
import Link from 'next/link';
import SortableTable from '@/components/SortableTable';

export default function DashboardPage() {
    const { user, isDevelzy } = useAuth();
    const [stats, setStats] = useState({
        santriTotal: 0, ustadzTotal: 0, pengurusTotal: 0, keuanganTotal: 0,
        expenseMonth: 0, kasTotal: 0, violationsMonth: 0, activeIzin: 0,
        activeSakit: 0, kamarKapasitas: 0
    });
    const [lastActivities, setLastActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const isMounted = React.useRef(true);

    const role = mounted ? (user?.role || 'User') : 'Sistem';
    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
    const userMenus = user?.menus || user?.allowedMenus || [];

    // Mapping Menu Name -> Stats & Features
    // This ensures the dashboard ONLY shows what the user is allowed to see in Develzy config.
    const hasAccess = (menuLabel) => {
        if (isDevelzy || role === 'admin') return true;
        return userMenus.some(m => (typeof m === 'string' ? m : m.name) === menuLabel);
    };

    useEffect(() => {
        setMounted(true);
        isMounted.current = true;
        const fetchDashboardData = async () => {
            try {
                const [quickStats, activities] = await Promise.all([
                    apiCall('getQuickStats'),
                    apiCall('getData', 'GET', { type: 'arus_kas' })
                ]);
                if (isMounted.current) {
                    setStats(quickStats);
                    setLastActivities(activities?.slice(0, 5) || []);
                }
            } catch (err) {
                console.error("Dashboard data error:", err);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };
        fetchDashboardData();
        return () => { isMounted.current = false; };
    }, []);

    // ✨ Optimized Smart Stat Cards Logic (Detects Develzy Access)
    // We list all potential 8 cards and rank them by importance for the user's specific context.
    const potentialStats = [
        { label: 'Total Santri', value: stats.santriTotal, icon: 'fas fa-users', color: 'stat-blue', show: hasAccess('Data Santri'), priority: 1 },
        { label: 'Pemasukan/Bln', value: formatCurrency(stats.keuanganTotal), icon: 'fas fa-arrow-down', color: 'stat-green', show: hasAccess('Arus Kas Pondok') || hasAccess('Pembayaran Santri'), priority: 2 },
        { label: 'Pelanggaran', value: stats.violationsMonth, icon: 'fas fa-exclamation-triangle', color: 'stat-red', show: hasAccess('Pelanggaran'), priority: 3 },
        { label: 'Saldo Kas', value: formatCurrency(stats.kasTotal), icon: 'fas fa-wallet', color: 'stat-indigo', show: hasAccess('Arus Kas Pondok') || hasAccess('Setoran Unit'), priority: 4 },
        { label: 'Izin Aktif', value: stats.activeIzin, icon: 'fas fa-id-card', color: 'stat-yellow', show: hasAccess('Perizinan Santri'), priority: 5 },
        { label: 'Pengajar/Kader', value: stats.ustadzTotal, icon: 'fas fa-mosque', color: 'stat-purple', show: hasAccess('Data Pengajar'), priority: 6 },
        { label: 'Santri Sakit', value: stats.activeSakit, icon: 'fas fa-notes-medical', color: 'stat-red', show: hasAccess('Data Kesehatan'), priority: 7 },
        { label: 'Total Pengurus', value: stats.pengurusTotal, icon: 'fas fa-user-tie', color: 'stat-cyan', show: hasAccess('Data Pengurus'), priority: 8 },
        { label: 'Kapasitas Kamar', value: stats.kamarKapasitas, icon: 'fas fa-bed', color: 'stat-indigo', show: hasAccess('Asrama & Kamar'), priority: 9 }
    ];

    // Filter by access and limit to top 8
    const dynamicStats = potentialStats
        .filter(s => s.show)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 8);

    return (
        <div className="view-container animate-in">
            <div className="dashboard-header" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div className="welcome-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '8px 16px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
                            <i className="fas fa-sparkles" style={{ marginRight: '6px' }}></i> SYSTEM ACTIVE
                        </div>
                    </div>
                    <h1 className="outfit" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '8px', letterSpacing: '-1px' }}>
                        Dashboard <span style={{ color: 'var(--accent)' }}>Pintar</span> {displayRole}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>
                        Selamat datang kembali, <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{mounted ? (user?.fullname || 'Admin') : '...'}</span>. Berikut ringkasan performa unit hari ini.
                    </p>
                </div>
                <div className="academic-badge" style={{ padding: '1.5rem 2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', boxShadow: 'var(--shadow-premium)', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tahun Ajaran</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent)' }}>1447 H / 2025-2026 M</div>
                </div>
            </div>

            {/* Smart Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '4rem', gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`, gap: '2rem' }}>
                {dynamicStats.length > 0 ? dynamicStats.map((s, i) => (
                    <StatCard key={i} label={s.label} value={loading ? '...' : s.value} icon={s.icon} colorClass={s.color} />
                )) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                        <i className="fas fa-lock" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Akses terbatas. Gunakan menu samping untuk navigasi.</p>
                    </div>
                )}
            </div>

            <div className="main-grid-layout" style={{ gap: '3rem' }}>
                {mounted ? (
                    <>
                        <div className="primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            {hasAccess('Arus Kas Pondok') && <RecentActivityCard activities={lastActivities} loading={loading} mounted={mounted} />}
                            {hasAccess('Data Santri') && <SantriDistributionCard stats={stats} loading={loading} />}
                        </div>

                        <div className="secondary-column" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <WelcomeBanner
                                title={hasAccess('Pelanggaran') ? "Bagian Keamanan" : hasAccess('Arus Kas Pondok') ? "Manajemen Keuangan" : "Pusat Informasi"}
                                desc={hasAccess('Pelanggaran') ? "Pantau ketertiban dan perizinan santri secara real-time." : "Kelola operasional dan sirkulasi dana dari satu pintu."}
                                link={hasAccess('Pelanggaran') ? "/keamanan/pelanggaran" : "/bendahara/arus-kas"}
                                linkText="Buka Modul"
                                icon={hasAccess('Pelanggaran') ? "fa-shield-alt" : "fa-university"}
                            />
                            <ActiveSessionCard user={user} mounted={mounted} />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function RecentActivityCard({ activities, loading, mounted }) {
    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>Arus Kas Terakhir</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Ringkasan 5 transaksi masuk & keluar pondok.</p>
                </div>
                <Link href="/keuangan/arus-kas" className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.8rem' }}>Lihat Semua</Link>
            </div>
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                <SortableTable
                    columns={[
                        {
                            key: 'kategori', label: 'Item Transaksi', render: (row) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: row.tipe === 'Masuk' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: row.tipe === 'Masuk' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={`fas fa-arrow-${row.tipe === 'Masuk' ? 'down' : 'up'}`}></i>
                                    </div>
                                    <div><div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{row.kategori}</div><small style={{ color: 'var(--text-muted)' }}>{row.keterangan || '-'}</small></div>
                                </div>
                            )
                        },
                        { key: 'nominal', label: 'Nominal', render: (row) => <div style={{ fontWeight: 900, fontSize: '1rem', color: row.tipe === 'Masuk' ? 'var(--success)' : 'var(--danger)' }}>{row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}</div> },
                        { key: 'tanggal', label: 'Waktu', render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{mounted && formatDate(row.tanggal)}</span> }
                    ]}
                    data={activities} loading={loading} emptyMessage="Belum ada transaksi hari ini."
                />
            </div>
        </div>
    );
}

function SantriDistributionCard({ stats, loading }) {
    return (
        <div className="card" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem' }}>Kepadatan Santri</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Menganalisis data...</div>
                ) : (stats.santriChart || []).length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Data tidak tersedia.</div>
                ) : (
                    stats.santriChart.slice(0, 6).map((c, i) => {
                        const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
                        const percentage = (c.count / stats.santriTotal) * 100;
                        return (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.kelas}</span>
                                    <span style={{ fontWeight: 900, color: colors[i % colors.length] }}>{c.count}</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', borderRadius: '10px', background: colors[i % colors.length], transition: 'width 1.5s ease' }}></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function WelcomeBanner({ title, desc, link, linkText, icon = 'fa-rocket' }) {
    return (
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '3rem', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.3)' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                    <i className={`fas ${icon}`}></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.5px' }}>{title}</h3>
                <p style={{ opacity: 0.7, fontSize: '1rem', lineHeight: '1.7', marginBottom: '2.5rem', fontWeight: 500 }}>{desc}</p>
                {link && (
                    <Link href={link} className="btn" style={{ background: 'white', color: '#0f172a', padding: '14px 28px', fontWeight: 900, borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                        {linkText} <i className="fas fa-arrow-right" style={{ marginLeft: '10px' }}></i>
                    </Link>
                )}
            </div>
            <i className={`fas ${icon}`} style={{ position: 'absolute', bottom: '-40px', right: '-40px', fontSize: '240px', color: 'white', opacity: 0.03, transform: 'rotate(-15deg)' }}></i>
        </div>
    );
}

function ActiveSessionCard({ user, mounted }) {
    return (
        <div className="card" style={{ padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem' }}>Detail Sesi SAA</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--accent)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <i className="fas fa-shield-check"></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Otoritas User</div>
                        <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{user?.role?.toUpperCase() || 'PENGGUNA'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#10b981', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <i className="fas fa-clock"></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Waktu Login</div>
                        <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{mounted && new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
