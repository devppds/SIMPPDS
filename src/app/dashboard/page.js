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
        <div className="view-container">
            <div className="dashboard-header animate-in">
                <div className="welcome-section">
                    <h1 className="dashboard-title outfit">
                        Dashboard Pintar {displayRole}
                    </h1>
                    <p className="dashboard-subtitle">
                        Ahlan wa Sahlan, <strong>{mounted ? (user?.fullname || 'User') : '...'}</strong>. Mendeteksi {dynamicStats.length} metrik aktif dari Develzy.
                    </p>
                </div>
                <div className="academic-badge card-glass">
                    <div className="badge-label">Tahun Ajaran</div>
                    <div className="badge-value">1447 H / 2025-2026 M</div>
                </div>
            </div>

            {/* Smart Stats Grid: Automatically adapts to access configuration */}
            <div className="stats-grid" style={{ marginBottom: '3rem', gridTemplateColumns: `repeat(auto-fill, minmax(260px, 1fr))` }}>
                {dynamicStats.length > 0 ? dynamicStats.map((s, i) => (
                    <StatCard key={i} label={s.label} value={loading ? '...' : s.value} icon={s.icon} colorClass={s.color} />
                )) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Belum ada metrik yang diizinkan untuk dashboard ini.</p>
                    </div>
                )}
            </div>


            <div className="main-grid-layout">
                {mounted ? (
                    <>
                        <div className="primary-column">
                            {hasAccess('Arus Kas Pondok') && <RecentActivityCard activities={lastActivities} loading={loading} mounted={mounted} />}
                            {hasAccess('Data Santri') && <SantriDistributionCard stats={stats} loading={loading} />}
                            {!hasAccess('Data Santri') && !hasAccess('Arus Kas Pondok') && (
                                <div className="card access-limited-card">
                                    <i className="fas fa-shield-alt icon-limited"></i>
                                    <h3 style={{ fontWeight: 800 }}>Akses Terenkripsi</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Anda memiliki akses terbatas. Gunakan sidebar untuk navigasi menu yang diizinkan.</p>
                                </div>
                            )}
                        </div>

                        <div className="secondary-column">
                            {/* Dynamic Banners Contextual to User Menus */}
                            {hasAccess('Pelanggaran') ? (
                                <WelcomeBanner title="Bagian Keamanan" desc="Pantau ketertiban dan perizinan santri secara real-time." link="/keamanan/pelanggaran" linkText="Menu Keamanan" />
                            ) : (hasAccess('Arus Kas Pondok') || hasAccess('Pembayaran Santri')) ? (
                                <WelcomeBanner title="Manajemen Keuangan" desc="Pantau sirkulasi kas dan tagihan santri dari satu panel." link="/bendahara/arus-kas" linkText="Buku Besar" />
                            ) : hasAccess('Data Santri') ? (
                                <WelcomeBanner title="Administrasi Santri" desc="Kelola database pusat santri dan asrama." link="/sekretariat/santri" linkText="Buka Database" />
                            ) : (
                                <WelcomeBanner title="Selamat Datang" desc="SIM-PPDS siap membantu mempermudah manajemen unit Anda." />
                            )}

                            <ActiveSessionCard user={user} mounted={mounted} />
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', width: '100%' }}>
                        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                        <p style={{ color: 'var(--text-muted)' }}>Mempersiapkan Dashboard...</p>
                    </div>
                )}
            </div>


            <style jsx>{`
                .animate-in { animation: slideInLeft 0.6s ease-out forwards; }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                
                .dashboard-header {
                    margin-bottom: 2.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1.5rem;
                }
                .dashboard-title {
                    font-size: 2.5rem;
                    font-weight: 900;
                    background: linear-gradient(to right, var(--primary), #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }
                .dashboard-subtitle {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }
                .academic-badge {
                    padding: 12px 24px;
                    border-radius: 16px;
                }
                .badge-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }
                .badge-value {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: var(--primary);
                }
                .card-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid #f1f5f9;
                    box-shadow: var(--shadow-sm);
                }
                .main-grid-layout {
                    display: grid;
                    grid-template-columns: 1.6fr 1.4fr;
                    gap: 2rem;
                }
                .primary-column, .secondary-column {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                .access-limited-card {
                    text-align: center;
                    padding: 3rem;
                }
                .icon-limited {
                    font-size: 3rem;
                    color: var(--primary-light);
                    margin-bottom: 1rem;
                }

                @media (max-width: 1200px) {
                    .main-grid-layout {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                    .dashboard-title {
                        font-size: 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }
                    .dashboard-title {
                        font-size: 1.8rem;
                        line-height: 1.2;
                    }
                    .dashboard-subtitle {
                        font-size: 0.95rem;
                    }
                    .academic-badge {
                        width: 100%;
                        padding: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .dashboard-title {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
// ✨ Dashboard Sub-Components
function RecentActivityCard({ activities, loading, mounted }) {
    return (
        <div className="card" style={{ padding: '0' }}>
            <div className="card-header" style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: 0 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Aktivitas Arus Kas Terakhir</h2>
                <Link href="/bendahara/arus-kas" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>Detail</Link>
            </div>
            <SortableTable
                columns={[
                    { key: 'kategori', label: 'Kategori', render: (row) => (<div style={{ paddingLeft: '1.25rem' }}><div style={{ fontWeight: 700 }}>{row.kategori}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.keterangan || '-'}</div></div>) },
                    { key: 'nominal', label: 'Nominal', render: (row) => (<div style={{ fontWeight: 800, color: row.tipe === 'Masuk' ? 'var(--success)' : 'var(--danger)' }}>{row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}</div>) },
                    { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontSize: '0.8rem' }}>{mounted && formatDate(row.tanggal)}</span> }
                ]}
                data={activities} loading={loading} emptyMessage="Belum ada transaksi."
            />
        </div>
    );
}

function SantriDistributionCard({ stats, loading }) {
    return (
        <div className="card">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Kepadatan Santri per Unit</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Menganalisis data...</div>
                ) : (stats.santriChart || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Data tidak ditemukan.</div>
                ) : (
                    stats.santriChart.slice(0, 6).map((c, i) => {
                        const percentage = (c.count / stats.santriTotal) * 100;
                        return (
                            <div key={i} style={{ marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 700 }}>{c.kelas || 'N/A'}</span>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.count} Santri</span>
                                </div>
                                <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', background: `linear-gradient(to right, var(--primary), ${['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]})`, transition: 'width 1s ease-out' }}></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function WelcomeBanner({ title, desc, link, linkText }) {
    return (
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', padding: '2.5rem', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(30, 58, 138, 0.2)' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{title}</h3>
                <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{desc}</p>
                {link && (
                    <Link href={link} className="btn" style={{ background: 'white', color: 'var(--primary)', padding: '12px 24px', fontWeight: 800 }}>
                        {linkText} <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                    </Link>
                )}
            </div>
            <i className="fas fa-mosque" style={{ position: 'absolute', bottom: '-20px', right: '-10px', fontSize: '120px', opacity: 0.1, transform: 'rotate(-20deg)' }}></i>
        </div>
    );
}

function ActiveSessionCard({ user, mounted }) {
    return (
        <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>Ringkasan Sesi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hak Akses</div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{user?.role || 'User'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jam Login</div>
                    <div style={{ fontWeight: 700 }}>{mounted && new Date().toLocaleTimeString('id-ID')}</div>
                </div>
            </div>
        </div>
    );
}
