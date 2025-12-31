'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate, exportToExcel } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { SelectInput } from '@/components/FormInput';
import Modal from '@/components/Modal';

export default function RiwayatAbsensiFormalPage() {
    const { canEdit } = usePagePermission();
    const [loading, setLoading] = useState(false);
    const [absenData, setAbsenData] = useState([]);
    const [santriList, setSantriList] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    const STATUS_OPTIONS = ['Semua', 'Hadir', 'Izin', 'Sakit', 'Alfa'];

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAbsen, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'absensi_formal' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setAbsenData(resAbsen || []);
            setSantriList(resSantri || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Group data by santri and aggregate attendance
    const processedData = useMemo(() => {
        const grouped = {};

        absenData.forEach(absen => {
            const santri = santriList.find(s => s.id === absen.santri_id);
            if (!santri) return;

            const key = absen.santri_id;

            if (!grouped[key]) {
                grouped[key] = {
                    id: key,
                    santri_id: absen.santri_id,
                    nama_santri: santri.nama_siswa,
                    kelas: santri.kelas || '-',
                    hadir: 0,
                    izin: 0,
                    sakit: 0,
                    alfa: 0,
                    total: 0
                };
            }

            // Count attendance
            if (absen.status === 'Hadir') grouped[key].hadir++;
            else if (absen.status === 'Izin') grouped[key].izin++;
            else if (absen.status === 'Sakit') grouped[key].sakit++;
            else if (absen.status === 'Alfa') grouped[key].alfa++;
            grouped[key].total++;
        });

        // Calculate percentages
        return Object.values(grouped).map(item => {
            const persentaseKehadiran = item.total > 0
                ? ((item.hadir / item.total) * 100).toFixed(1)
                : 0;

            return {
                ...item,
                persentaseKehadiran: parseFloat(persentaseKehadiran)
            };
        }).sort((a, b) => b.total - a.total);
    }, [absenData, santriList]);

    const displayData = useMemo(() => {
        return processedData.filter(d => {
            const matchSearch = (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.kelas || '').toLowerCase().includes(search.toLowerCase());
            if (!matchSearch) return false;

            // Filter by status (check if santri has any of that status)
            if (filterStatus !== 'Semua') {
                if (filterStatus === 'Hadir' && d.hadir === 0) return false;
                if (filterStatus === 'Izin' && d.izin === 0) return false;
                if (filterStatus === 'Sakit' && d.sakit === 0) return false;
                if (filterStatus === 'Alfa' && d.alfa === 0) return false;
            }

            return true;
        });
    }, [processedData, search, filterStatus]);

    const stats = useMemo(() => {
        const totalHadir = displayData.reduce((sum, d) => sum + d.hadir, 0);
        const totalIzin = displayData.reduce((sum, d) => sum + d.izin, 0);
        const totalSakit = displayData.reduce((sum, d) => sum + d.sakit, 0);
        const totalAlfa = displayData.reduce((sum, d) => sum + d.alfa, 0);

        return [
            { title: 'Total Santri', value: displayData.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Total Hadir', value: totalHadir, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Total Izin', value: totalIzin, icon: 'fas fa-envelope', color: 'var(--warning)' },
            { title: 'Total Sakit', value: totalSakit, icon: 'fas fa-notes-medical', color: '#f97316' },
            { title: 'Total Alfa', value: totalAlfa, icon: 'fas fa-times-circle', color: 'var(--danger)' }
        ];
    }, [displayData]);

    const handleExport = () => {
        const exportData = displayData.map(d => ({
            'Nama Santri': d.nama_santri,
            Kelas: d.kelas,
            'Total Pertemuan': d.total,
            Hadir: d.hadir,
            Izin: d.izin,
            Sakit: d.sakit,
            Alfa: d.alfa,
            '% Kehadiran': d.persentaseKehadiran + '%'
        }));

        exportToExcel(exportData, 'Rekap_Absensi_Formal', Object.keys(exportData[0] || {}));
    };

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_santri}</div><small style={{ color: 'var(--text-muted)' }}>{row.kelas}</small></div> },
        { key: 'total', label: 'Total', render: (row) => <strong style={{ fontSize: '1.1rem' }}>{row.total}x</strong> },
        {
            key: 'hadir',
            label: 'Hadir',
            render: (row) => <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>{row.hadir}x</span>
        },
        {
            key: 'izin',
            label: 'Izin',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>{row.izin}x</span>
        },
        {
            key: 'sakit',
            label: 'Sakit',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: '#fed7aa', color: '#9a3412', fontWeight: 800 }}>{row.sakit}x</span>
        },
        {
            key: 'alfa',
            label: 'Alfa',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>{row.alfa}x</span>
        },
        {
            key: 'persentase',
            label: '% Hadir',
            render: (row) => {
                const color = row.persentaseKehadiran >= 80 ? '#166534' : row.persentaseKehadiran >= 60 ? '#92400e' : '#991b1b';
                return <div style={{ fontWeight: 800, color, fontSize: '1rem' }}>{row.persentaseKehadiran}%</div>;
            }
        },
        {
            key: 'actions', label: 'Aksi', width: '100px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => { setViewData(row); setIsViewModalOpen(true); }}>
                        <i className="fas fa-eye"></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Riwayat Absensi Formal Santri" subJudul="Rekapitulasi kehadiran santri dalam kegiatan formal" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Rekap Absensi Formal"
                subtitle={`Menampilkan ${displayData.length} santri`}
                headerActions={
                    <>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                            <i className="fas fa-print"></i> Print
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={displayData.length === 0}>
                            <i className="fas fa-file-excel"></i> Export Excel
                        </button>
                    </>
                }
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama santri / kelas..." }}
                filters={
                    <SelectInput value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={STATUS_OPTIONS} style={{ width: '150px', marginBottom: 0 }} />
                }
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Ringkasan Kehadiran" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_santri)}&background=1e3a8a&color=fff&size=128`}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }}
                                alt=""
                            />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.nama_santri}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{viewData.kelas}</p>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)' }}>REKAPITULASI KEHADIRAN</h3>
                            <div className="form-grid">
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Total Pertemuan</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--primary)' }}>{viewData.total}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '12px' }}>
                                    <small style={{ color: '#166534' }}>Hadir</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#166534' }}>{viewData.hadir}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '12px' }}>
                                    <small style={{ color: '#92400e' }}>Izin</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#92400e' }}>{viewData.izin}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fed7aa', borderRadius: '12px' }}>
                                    <small style={{ color: '#9a3412' }}>Sakit</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#9a3412' }}>{viewData.sakit}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fee2e2', borderRadius: '12px' }}>
                                    <small style={{ color: '#991b1b' }}>Alfa</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#991b1b' }}>{viewData.alfa}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', padding: '1.5rem', borderRadius: '15px', color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Persentase Kehadiran</div>
                            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{viewData.persentaseKehadiran}%</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
