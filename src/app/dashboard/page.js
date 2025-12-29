'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency, apiCall } from '@/lib/utils';
import Link from 'next/link';
import SortableTable from '@/components/SortableTable';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        santriTotal: 0,
        ustadzTotal: 0,
        keuanganTotal: 0,
        kasTotal: 0
    });
    const [lastActivities, setLastActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [quickStats, activities] = await Promise.all([
                    apiCall('getQuickStats'),
                    apiCall('getData', 'GET', { type: 'arus_kas' })
                ]);
                setStats(quickStats);
                setLastActivities(activities?.slice(0, 6) || []);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="view-container">
            {/* Header Section */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="animate-in">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(to right, var(--primary), #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                        Dashboard Utama
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Ahlan wa Sahlan, <strong>{user?.fullname || 'Admin'}</strong>. Berikut adalah ringkasan unit Anda hari ini.
                    </p>
                </div>
                <div style={{ background: '#fff', padding: '12px 24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahun Ajaran</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>1446-1447 H / 2025-2026 M</div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: '3rem' }}>
                <StatCard
                    label="Total Santri Aktif"
                    value={loading ? '...' : stats.santriTotal}
                    icon="fas fa-users"
                    colorClass="stat-blue"
                />
                <StatCard
                    label="Kader Pengajar"
                    value={loading ? '...' : stats.ustadzTotal}
                    icon="fas fa-mosque"
                    colorClass="stat-purple"
                />
                <StatCard
                    label="Pemasukan (Bulan Ini)"
                    value={loading ? '...' : formatCurrency(stats.keuanganTotal)}
                    icon="fas fa-hand-holding-heart"
                    colorClass="stat-green"
                />
                <StatCard
                    label="Kas Operasional"
                    value={loading ? '...' : formatCurrency(stats.kasTotal)}
                    icon="fas fa-wallet"
                    colorClass="stat-yellow"
                />
            </div>

            {/* Main Grid: Transactions & Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '2.5rem' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {/* Recent Activity */}
                    <div className="card" style={{ padding: '0' }}>
                        <div className="card-header" style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: 0 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Aktivitas Transaksi Terbaru</h2>
                            <Link href="/bendahara/arus-kas" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>Lihat Laporan</Link>
                        </div>
                        <SortableTable
                            columns={[
                                {
                                    key: 'kategori',
                                    label: 'Kategori',
                                    render: (row) => (
                                        <div style={{ paddingLeft: '1rem' }}>
                                            <div style={{ fontWeight: 700 }}>{row.kategori}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.keterangan || 'Selesai'}</div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'nominal',
                                    label: 'Nominal',
                                    render: (row) => (
                                        <div style={{ fontWeight: 800, color: row.tipe === 'Masuk' ? 'var(--success)' : 'var(--danger)' }}>
                                            {row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
                                        </div>
                                    )
                                },
                                {
                                    key: 'tanggal',
                                    label: 'Tanggal',
                                    render: (row) => <span style={{ fontSize: '0.85rem' }}>{new Date(row.tanggal).toLocaleDateString('id-ID')}</span>
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (row) => (
                                        <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            Selesai
                                        </span>
                                    )
                                }
                            ]}
                            data={lastActivities}
                            loading={loading}
                            emptyMessage="Belum ada riwayat hari ini."
                        />
                    </div>

                    {/* Santri Distribution Chart */}
                    <div className="card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Statistik Santri per Kelas</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat data statistik...</div>
                            ) : (stats.santriChart || []).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data santri.</div>
                            ) : (
                                stats.santriChart.map((c, i) => {
                                    const percentage = (c.count / stats.santriTotal) * 100;
                                    return (
                                        <div key={i} style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                                <span style={{ fontWeight: 700 }}>{c.kelas || 'N/A'}</span>
                                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.count} Santri</span>
                                            </div>
                                            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(to right, var(--primary), ${['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]})`,
                                                    transition: 'width 1s ease-out'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Informational Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                    {/* Welcome Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(30, 58, 138, 0.2)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Sistem Informasi Manajemen Terintegrasi</h3>
                            <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                Memantau seluruh perkembangan santri dan arus kas unit secara real-time dari satu dashboard tunggal.
                            </p>
                            <Link href="/sekretariat/santri" className="btn" style={{ background: 'white', color: 'var(--primary)', padding: '12px 24px' }}>
                                Lihat Database Santri <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                        <i className="fas fa-mosque" style={{ position: 'absolute', bottom: '-20px', right: '-10px', fontSize: '120px', opacity: 0.1, transform: 'rotate(-20deg)' }}></i>
                    </div>

                    {/* Quick Profile Info */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>Sesi Aktif</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hak Akses</div>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{user?.role || 'Developer'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Update Terakhir</div>
                                <div style={{ fontWeight: 700 }}>{new Date().toLocaleTimeString('id-ID')}</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx>{`
                .animate-in {
                    animation: slideInLeft 0.6s ease-out;
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
